<script lang="ts">
  /**
   * Question carte interactive avec SVG externe
   * L'utilisateur clique sur une zone REP_X, choisit dans une liste, puis valide
   * 
   * Le SVG doit contenir des éléments avec id="REP_0", "REP_1", etc. (ou rep_0, rep_1)
   * Ces zones seront rendues cliquables et interactives.
   * 
   * Modes:
   * - Avec choices: affiche une liste de choix possibles (nouveau mode)
   * - Sans choices: input texte libre (ancien mode)
   */
  import { onMount, tick } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Check, RotateCcw } from 'lucide-svelte';
  
  interface MapZoneAnswer {
    /** Index correspondant au REP_X dans le SVG */
    index: number;
    /** Réponse attendue */
    label: string;
    /** Indice optionnel */
    hint?: string;
  }
  
  interface Props {
    /** Contenu SVG (le fichier SVG en string) */
    svgContent: string;
    /** Liste des réponses attendues */
    expectedAnswers: MapZoneAnswer[];
    /** Labels entrés par l'utilisateur: "REP_X" -> label */
    answers: Record<string, string>;
    /** Liste des choix possibles (si fourni, affiche une liste au lieu d'un input) */
    choices?: string[];
    disabled?: boolean;
    showResult?: boolean;
    /** Callback quand les réponses changent */
    onAnswerChange: (answers: Record<string, string>) => void;
  }
  
  let { 
    svgContent,
    expectedAnswers = [],
    answers = {},
    choices = [],
    disabled = false,
    showResult = false,
    onAnswerChange
  }: Props = $props();
  
  // Mode avec liste de choix ou input libre
  const hasChoices = $derived(choices && choices.length > 0);
  
  // État du modal
  let modalOpen = $state(false);
  let selectedZoneId = $state<string | null>(null);
  let selectedZoneHint = $state<string | undefined>(undefined);
  let inputValue = $state('');
  
  // État pour confirmation de swap
  let confirmSwapOpen = $state(false);
  let pendingChoice = $state<string | null>(null);
  let existingZoneForChoice = $state<string | null>(null);
  
  // Container ref
  let containerRef = $state<HTMLDivElement | null>(null);
  
  // Zone labels positions (calculés après injection du SVG)
  let labelPositions = $state<Record<string, { x: number; y: number }>>({});
  
  // Map des choix utilisés: choice -> zoneId
  let usedChoices = $derived.by(() => {
    const map: Record<string, string> = {};
    for (const [zoneId, choice] of Object.entries(answers)) {
      if (choice) map[choice] = zoneId;
    }
    return map;
  });
  
  // Normalise zone ID (REP_X ou rep_X -> REP_X)
  function normalizeZoneId(id: string): string {
    return id.toUpperCase();
  }
  
  // Extrait l'index d'un zone ID
  function getZoneIndex(zoneId: string): number {
    const match = zoneId.match(/REP_(\d+)/i);
    return match ? parseInt(match[1]) : -1;
  }
  
  function setupSvg() {
    if (!containerRef || !svgContent) return;
    
    // Injecter le SVG
    containerRef.innerHTML = svgContent;
    
    // Trouver le SVG injecté
    const svg = containerRef.querySelector('svg');
    if (!svg) return;
    
    // Style du SVG
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.maxHeight = '500px';
    
    // Trouver toutes les zones REP_X ou rep_X (case insensitive)
    const elements = svg.querySelectorAll('[id^="REP_"], [id^="rep_"]');
    const positions: Record<string, { x: number; y: number }> = {};

    elements.forEach((el) => {
      const rawId = el.getAttribute('id');
      if (!rawId) return;
      const id = normalizeZoneId(rawId);
      
      // Calculer le centre de la zone pour positionner le label
      const bbox = (el as SVGGraphicsElement).getBBox?.();
      if (bbox) {
        positions[id] = {
          x: bbox.x + bbox.width / 2,
          y: bbox.y + bbox.height / 2
        };
      }
      
      // Styles de base pour les zones
      const elem = el as SVGElement;
      elem.style.cursor = disabled ? 'not-allowed' : 'pointer';
      elem.style.transition = 'all 0.2s ease';
      
      // Appliquer le style selon l'état
      applyZoneStyle(elem, id);
      
      // Events (on clone pour éviter les doublons)
      const newEl = el.cloneNode(true) as SVGElement;
      el.parentNode?.replaceChild(newEl, el);
      
      if (!disabled) {
        newEl.addEventListener('click', (e) => {
          e.stopPropagation();
          handleZoneClick(id);
        });
        newEl.addEventListener('mouseenter', () => {
          newEl.style.filter = 'brightness(1.3)';
          newEl.style.transform = 'scale(1.02)';
        });
        newEl.addEventListener('mouseleave', () => {
          newEl.style.filter = '';
          newEl.style.transform = '';
        });
      }
      
      // Réappliquer le style après clone
      applyZoneStyle(newEl, id);
    });
    
    labelPositions = positions;
    
    // Ajouter le gestionnaire de clic global pour les zones colorées
    if (!disabled) {
      setupColoredZonesClick(svg, positions);
    }
    
    // Ajouter les labels pour les zones répondues
    addLabelsToSvg(svg);
  }
  
  function applyZoneStyle(el: SVGElement, zoneId: string) {
    const hasAnswer = !!answers[zoneId];
    const isCorrect = hasAnswer && isAnswerCorrect(zoneId);
    
    if (showResult && hasAnswer) {
      el.setAttribute('fill', isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)');
      el.setAttribute('stroke', isCorrect ? '#22c55e' : '#ef4444');
      el.setAttribute('stroke-width', '3');
      el.setAttribute('stroke-dasharray', '');
    } else if (hasAnswer) {
      el.setAttribute('fill', 'rgba(251, 191, 36, 0.4)');
      el.setAttribute('stroke', '#f59e0b');
      el.setAttribute('stroke-width', '2');
      el.setAttribute('stroke-dasharray', '');
    } else {
      el.setAttribute('fill', 'rgba(100, 100, 100, 0.15)');
      el.setAttribute('stroke', '#6b7280');
      el.setAttribute('stroke-width', '2');
      el.setAttribute('stroke-dasharray', '8,4');
    }
    
    el.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }
  
  // Fonction pour rendre les zones colorées cliquables
  function setupColoredZonesClick(svg: SVGSVGElement, positions: Record<string, { x: number; y: number }>) {
    // Trouver les paths et polygons colorés (zones géographiques) 
    const coloredElements = svg.querySelectorAll('path, polygon, rect, ellipse');
    
    coloredElements.forEach((el) => {
      const elem = el as SVGElement;
      const id = elem.getAttribute('id') || '';
      
      // Ignorer les éléments REP_X (déjà gérés) et les éléments de décor
      if (id.toUpperCase().startsWith('REP_')) return;
      
      // Vérifier si l'élément a une couleur de remplissage visible
      const fill = elem.getAttribute('fill') || getComputedStyle(elem).fill;
      if (!fill || fill === 'none' || fill === 'transparent') return;
      
      // Rendre l'élément cliquable
      elem.style.cursor = 'pointer';
      
      elem.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Trouver la zone REP_X la plus proche du centre de cet élément
        const bbox = (elem as SVGGraphicsElement).getBBox?.();
        if (!bbox) return;
        
        const clickX = bbox.x + bbox.width / 2;
        const clickY = bbox.y + bbox.height / 2;
        
        let closestZone: string | null = null;
        let minDistance = Infinity;
        
        for (const [zoneId, pos] of Object.entries(positions)) {
          const distance = Math.sqrt(Math.pow(pos.x - clickX, 2) + Math.pow(pos.y - clickY, 2));
          if (distance < minDistance) {
            minDistance = distance;
            closestZone = zoneId;
          }
        }
        
        if (closestZone) {
          handleZoneClick(closestZone);
        }
      });
      
      // Hover effect
      elem.addEventListener('mouseenter', () => {
        elem.style.filter = 'brightness(1.15)';
      });
      elem.addEventListener('mouseleave', () => {
        elem.style.filter = '';
      });
    });
  }
  
  function addLabelsToSvg(svg: SVGSVGElement) {
    // Supprimer les anciens labels
    svg.querySelectorAll('.zone-label-group').forEach(el => el.remove());
    
    // Ajouter les nouveaux labels pour les zones répondues
    for (const [zoneId, pos] of Object.entries(labelPositions)) {
      if (!answers[zoneId]) continue;
      
      const isCorrect = isAnswerCorrect(zoneId);
      const text = answers[zoneId];
      
      // Créer le groupe de label
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('zone-label-group');
      g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      
      // Background du label
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const textWidth = Math.min(text.length * 7 + 30, 150);
      rect.setAttribute('x', String(-textWidth / 2));
      rect.setAttribute('y', '-14');
      rect.setAttribute('width', String(textWidth));
      rect.setAttribute('height', '28');
      rect.setAttribute('rx', '6');
      rect.setAttribute('fill', showResult ? (isCorrect ? '#22c55e' : '#ef4444') : '#1f2937');
      rect.setAttribute('stroke', showResult ? (isCorrect ? '#16a34a' : '#dc2626') : '#374151');
      
      // Texte
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '0');
      label.setAttribute('y', '5');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', 'white');
      label.setAttribute('font-size', '12');
      label.setAttribute('font-weight', '600');
      label.textContent = text.length > 16 ? text.substring(0, 14) + '...' : text;
      
      g.appendChild(rect);
      g.appendChild(label);
      
      // Icône résultat
      if (showResult) {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', String(textWidth / 2 - 15));
        icon.setAttribute('y', '5');
        icon.setAttribute('fill', 'white');
        icon.setAttribute('font-size', '14');
        icon.textContent = isCorrect ? '✓' : '✗';
        g.appendChild(icon);
      }
      
      svg.appendChild(g);
    }
    
    // Ajouter les numéros pour les zones non répondues
    if (!disabled) {
      for (const [zoneId, pos] of Object.entries(labelPositions)) {
        if (answers[zoneId]) continue;
        
        const zoneNumber = getZoneIndex(zoneId);
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('zone-label-group');
        g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
        g.style.cursor = 'pointer';
        
        // Rendre le groupe cliquable
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          handleZoneClick(zoneId);
        });
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '16');
        circle.setAttribute('fill', '#3b82f6');
        circle.setAttribute('stroke', '#1d4ed8');
        circle.setAttribute('stroke-width', '2');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '6');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.textContent = String(zoneNumber + 1);
        
        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      }
    }
  }
  
  function handleZoneClick(zoneId: string) {
    if (disabled) return;
    
    selectedZoneId = zoneId;
    inputValue = answers[zoneId] || '';
    
    // Chercher l'indice
    const index = getZoneIndex(zoneId);
    const expected = expectedAnswers.find(a => a.index === index);
    selectedZoneHint = expected?.hint;
    
    modalOpen = true;
  }
  
  // Pour le mode input libre (ancien mode)
  function handleValidate() {
    if (!selectedZoneId) return;
    const newAnswers = { ...answers, [selectedZoneId]: inputValue.trim() };
    onAnswerChange(newAnswers);
    modalOpen = false;
    selectedZoneId = null;
    inputValue = '';
  }
  
  // Pour le mode liste de choix (nouveau mode)
  function handleChoiceSelect(choice: string) {
    if (!selectedZoneId) return;
    
    // Vérifier si ce choix est déjà utilisé ailleurs
    const existingZone = usedChoices[choice];
    if (existingZone && existingZone !== selectedZoneId) {
      // Demander confirmation pour inverser
      pendingChoice = choice;
      existingZoneForChoice = existingZone;
      confirmSwapOpen = true;
      return;
    }
    
    // Appliquer le choix directement
    applyChoice(choice);
  }
  
  function applyChoice(choice: string, swapWith?: string) {
    if (!selectedZoneId) return;
    
    const newAnswers = { ...answers };
    
    if (swapWith) {
      // Inverser: la zone actuelle prend le choix de l'autre, l'autre prend le nouveau choix
      const currentAnswer = newAnswers[selectedZoneId];
      newAnswers[swapWith] = currentAnswer || '';
    }
    
    newAnswers[selectedZoneId] = choice;
    onAnswerChange(newAnswers);
    
    modalOpen = false;
    selectedZoneId = null;
    pendingChoice = null;
    existingZoneForChoice = null;
  }
  
  function confirmSwap() {
    if (pendingChoice && existingZoneForChoice) {
      applyChoice(pendingChoice, existingZoneForChoice);
    }
    confirmSwapOpen = false;
  }
  
  function cancelSwap() {
    confirmSwapOpen = false;
    pendingChoice = null;
    existingZoneForChoice = null;
  }
  
  // Effacer la réponse de la zone sélectionnée
  function clearCurrentZone() {
    if (!selectedZoneId) return;
    const newAnswers = { ...answers };
    delete newAnswers[selectedZoneId];
    onAnswerChange(newAnswers);
    modalOpen = false;
    selectedZoneId = null;
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidate();
    }
  }
  
  function isAnswerCorrect(zoneId: string): boolean {
    const index = getZoneIndex(zoneId);
    const expected = expectedAnswers.find(a => a.index === index);
    if (!expected) return false;
    
    const userAnswer = (answers[zoneId] || '').toLowerCase().trim();
    const correctAnswer = expected.label.toLowerCase().trim();
    
    // Tolérance : correspondance exacte ou partielle
    return userAnswer === correctAnswer || 
           correctAnswer.includes(userAnswer) || 
           userAnswer.includes(correctAnswer);
  }
  
  // Calcul du score
  let correctCount = $derived(
    expectedAnswers.filter(a => {
      const zoneId = `REP_${a.index}`;
      return answers[zoneId] && isAnswerCorrect(zoneId);
    }).length
  );
  
  let answeredCount = $derived(
    Object.keys(answers).filter(k => answers[k]).length
  );
  
  // Réagir aux changements
  $effect(() => {
    if (svgContent && containerRef) {
      // Force re-setup quand les données changent
      const deps = [svgContent, JSON.stringify(answers), showResult, disabled];
      void deps;
      tick().then(setupSvg);
    }
  });
  
  onMount(() => {
    if (svgContent) setupSvg();
  });
</script>

<div class="map-question-container">
  <!-- Carte SVG -->
  <div 
    bind:this={containerRef}
    class="relative w-full bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg min-h-[300px] flex items-center justify-center"
  >
    {#if !svgContent}
      <p class="text-gray-400">Aucune carte chargée</p>
    {/if}
  </div>
  
  <!-- Labels résumé -->
  {#if expectedAnswers.length > 0}
    <div class="mt-4 flex flex-wrap gap-2">
      {#each expectedAnswers as expected}
        {@const zoneId = `REP_${expected.index}`}
        {@const hasAnswer = !!answers[zoneId]}
        {@const isCorrect = hasAnswer && isAnswerCorrect(zoneId)}
        
        <button
          onclick={() => !disabled && handleZoneClick(zoneId)}
          disabled={disabled}
          class="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
            {hasAnswer 
              ? (showResult 
                ? (isCorrect ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500')
                : 'bg-amber-900/50 border-amber-500 hover:bg-amber-800/50')
              : 'bg-gray-800 border-gray-600 hover:bg-gray-700'} border
            {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
        >
          <span class="text-gray-400">#{expected.index + 1}</span>
          {#if hasAnswer}
            <span class="text-white">{answers[zoneId]}</span>
            {#if showResult}
              <span class={isCorrect ? 'text-green-400' : 'text-red-400'}>
                {isCorrect ? '✓' : '✗'}
              </span>
            {/if}
          {:else}
            <span class="text-gray-500">?</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
  
  <!-- Instructions -->
  {#if !disabled && answeredCount < expectedAnswers.length}
    <div class="mt-4 text-center text-gray-400 text-sm">
      Clique sur une zone colorée ou sur un numéro pour l'identifier
    </div>
  {/if}
  
  <!-- Compteur -->
  <div class="mt-4 text-center">
    <span class="text-gray-400">
      {answeredCount} / {expectedAnswers.length} zones identifiées
    </span>
    {#if showResult}
      <span class="ml-4 font-semibold {correctCount === expectedAnswers.length ? 'text-green-500' : 'text-amber-500'}">
        {correctCount} / {expectedAnswers.length} correctes
      </span>
    {/if}
  </div>
  
  <!-- Correction détaillée -->
  {#if showResult}
    <div class="mt-4 p-4 bg-gray-800 border border-gray-600 rounded-xl">
      <p class="font-medium text-gray-200 mb-3">Correction :</p>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        {#each expectedAnswers as expected}
          {@const zoneId = `REP_${expected.index}`}
          {@const hasAnswer = !!answers[zoneId]}
          {@const isCorrect = hasAnswer && isAnswerCorrect(zoneId)}
          
          <div class="flex items-center gap-2 p-2 rounded {isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'}">
            <span class={isCorrect ? 'text-green-400' : 'text-red-400'}>
              {isCorrect ? '✓' : '✗'}
            </span>
            <span class="text-gray-300">{expected.label}</span>
            {#if !isCorrect && hasAnswer}
              <span class="text-gray-500 text-xs">(tu as mis : {answers[zoneId]})</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Modal pour choisir le label -->
<Dialog.Root bind:open={modalOpen}>
  <Dialog.Content class="sm:max-w-md bg-gray-900 border-gray-700">
    <Dialog.Header>
      <Dialog.Title class="text-white">
        Identifie cette zone
        {#if selectedZoneId}
          <span class="text-gray-500 font-normal text-sm ml-2">
            (Zone #{getZoneIndex(selectedZoneId) + 1})
          </span>
        {/if}
      </Dialog.Title>
      <Dialog.Description class="text-gray-400">
        {#if selectedZoneHint}
          <span class="text-amber-400">Indice : {selectedZoneHint}</span>
        {:else if hasChoices}
          Sélectionne la bonne réponse dans la liste
        {:else}
          Quelle est cette zone géographique ?
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="py-4">
      {#if hasChoices}
        <!-- Mode liste de choix -->
        <div class="grid gap-2 max-h-[300px] overflow-y-auto">
          {#each choices as choice}
            {@const isUsed = !!usedChoices[choice]}
            {@const usedByCurrentZone = selectedZoneId && answers[selectedZoneId] === choice}
            {@const usedByOtherZone = isUsed && !usedByCurrentZone}
            
            <button
              onclick={() => handleChoiceSelect(choice)}
              class="flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all
                {usedByCurrentZone 
                  ? 'bg-green-900/50 border-green-500 border-2' 
                  : usedByOtherZone
                    ? 'bg-gray-800/50 border-gray-600 border hover:bg-gray-700/50'
                    : 'bg-gray-800 border-gray-600 border hover:bg-gray-700 hover:border-amber-500'}"
            >
              <span class="text-white">{choice}</span>
              {#if usedByCurrentZone}
                <Check class="w-5 h-5 text-green-400" />
              {:else if usedByOtherZone}
                <span class="flex items-center gap-1 text-xs text-gray-400">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  Zone #{getZoneIndex(usedChoices[choice]) + 1}
                </span>
              {/if}
            </button>
          {/each}
        </div>
        
        <!-- Bouton effacer si déjà répondu -->
        {#if selectedZoneId && answers[selectedZoneId]}
          <button
            onclick={clearCurrentZone}
            class="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <RotateCcw class="w-4 h-4" />
            Effacer cette réponse
          </button>
        {/if}
      {:else}
        <!-- Mode input libre (ancien mode) -->
        <Input
          bind:value={inputValue}
          placeholder="Nom de la zone..."
          class="bg-gray-800 border-gray-600 text-white"
          onkeydown={handleKeydown}
          autofocus
        />
      {/if}
    </div>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => modalOpen = false}>
        {hasChoices ? 'Fermer' : 'Annuler'}
      </Button>
      {#if !hasChoices}
        <Button onclick={handleValidate} disabled={!inputValue.trim()}>
          Valider
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Modal de confirmation pour swap -->
<AlertDialog.Root bind:open={confirmSwapOpen}>
  <AlertDialog.Content class="bg-gray-900 border-gray-700">
    <AlertDialog.Header>
      <AlertDialog.Title class="text-white">Inverser les réponses ?</AlertDialog.Title>
      <AlertDialog.Description class="text-gray-400">
        Cette réponse est déjà utilisée pour la Zone #{existingZoneForChoice ? getZoneIndex(existingZoneForChoice) + 1 : '?'}.
        <br /><br />
        Veux-tu inverser les deux zones ?
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={cancelSwap}>Annuler</AlertDialog.Cancel>
      <AlertDialog.Action onclick={confirmSwap}>Inverser</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  :global(.map-question-container svg) {
    max-width: 100%;
    height: auto;
  }
  
  :global(.map-question-container [id^="REP_"]),
  :global(.map-question-container [id^="rep_"]) {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  :global(.map-question-container [id^="REP_"]:hover),
  :global(.map-question-container [id^="rep_"]:hover) {
    filter: brightness(1.3);
  }
</style>
