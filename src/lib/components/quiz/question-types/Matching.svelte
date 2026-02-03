<script lang="ts">
  /**
   * Question d'association (Matching)
   * L'utilisateur associe les éléments de gauche avec ceux de droite
   * Avec connecteurs visuels (lignes SVG)
   */
  import { onMount } from 'svelte';
  
  interface MatchingItem {
    id: string;
    text: string;
    image?: string;
  }
  
  interface Props {
    leftItems: MatchingItem[];
    rightItems: MatchingItem[];
    /** Map de associations: leftId -> rightId */
    matches: Record<string, string>;
    disabled?: boolean;
    showResult?: boolean;
    /** Les bonnes associations: leftId -> rightId */
    correctMatches?: Record<string, string>;
    onMatchChange: (matches: Record<string, string>) => void;
  }
  
  let { 
    leftItems,
    rightItems,
    matches = {},
    disabled = false,
    showResult = false,
    correctMatches = {},
    onMatchChange
  }: Props = $props();
  
  // État pour la sélection
  let selectedLeft = $state<string | null>(null);
  let selectedRight = $state<string | null>(null);
  
  // Refs pour les positions des éléments (pour les lignes)
  let containerRef = $state<HTMLDivElement | null>(null);
  let leftRefs = $state<Record<string, HTMLElement | null>>({});
  let rightRefs = $state<Record<string, HTMLElement | null>>({});
  
  // Recalculer les lignes quand les matches ou la taille changent
  let lines = $state<Array<{x1: number, y1: number, x2: number, y2: number, leftId: string, rightId: string}>>([]);
  
  function calculateLines() {
    if (!containerRef) return;
    
    const containerRect = containerRef.getBoundingClientRect();
    const newLines: typeof lines = [];
    
    for (const [leftId, rightId] of Object.entries(matches)) {
      const leftEl = leftRefs[leftId];
      const rightEl = rightRefs[rightId];
      
      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        
        newLines.push({
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top,
          leftId,
          rightId
        });
      }
    }
    
    lines = newLines;
  }
  
  $effect(() => {
    // Recalculer à chaque changement de matches
    matches;
    // Petit délai pour laisser le DOM se mettre à jour
    setTimeout(calculateLines, 50);
  });
  
  onMount(() => {
    calculateLines();
    window.addEventListener('resize', calculateLines);
    return () => window.removeEventListener('resize', calculateLines);
  });
  
  function handleLeftClick(leftId: string) {
    if (disabled) return;
    
    // Si on clique sur un élément déjà associé, proposer de le modifier
    if (matches[leftId] && selectedLeft !== leftId) {
      selectedLeft = leftId;
      selectedRight = null;
      return;
    }
    
    if (selectedLeft === leftId) {
      // Désélectionner
      selectedLeft = null;
    } else if (selectedRight) {
      // On a déjà sélectionné un élément à droite, créer l'association
      createMatch(leftId, selectedRight);
    } else {
      selectedLeft = leftId;
    }
  }
  
  function handleRightClick(rightId: string) {
    if (disabled) return;
    
    if (selectedLeft) {
      // Créer l'association
      createMatch(selectedLeft, rightId);
    } else if (selectedRight === rightId) {
      // Désélectionner
      selectedRight = null;
    } else {
      // Sélectionner à droite (permet de commencer par la droite)
      selectedRight = rightId;
      selectedLeft = null;
    }
  }
  
  function createMatch(leftId: string, rightId: string) {
    const newMatches = { ...matches };
    
    // Retirer l'ancienne association si rightId était déjà utilisé
    for (const [left, right] of Object.entries(newMatches)) {
      if (right === rightId && left !== leftId) {
        delete newMatches[left];
      }
    }
    
    newMatches[leftId] = rightId;
    onMatchChange(newMatches);
    selectedLeft = null;
    selectedRight = null;
  }
  
  function removeMatch(leftId: string, e?: Event) {
    if (disabled) return;
    e?.stopPropagation();
    const newMatches = { ...matches };
    delete newMatches[leftId];
    onMatchChange(newMatches);
    selectedLeft = null;
    selectedRight = null;
  }
  
  function isMatchCorrect(leftId: string): boolean {
    return matches[leftId] === correctMatches[leftId];
  }
  
  function isRightItemUsed(rightId: string): boolean {
    return Object.values(matches).includes(rightId);
  }
  
  function getLeftForRight(rightId: string): string | undefined {
    for (const [left, right] of Object.entries(matches)) {
      if (right === rightId) return left;
    }
    return undefined;
  }
  
  function getLineColor(leftId: string): string {
    if (showResult) {
      return isMatchCorrect(leftId) ? '#22c55e' : '#ef4444'; // green-500 / red-500
    }
    return '#f59e0b'; // amber-500
  }
  
  function getLeftItemClass(leftId: string): string {
    const isSelected = selectedLeft === leftId;
    const hasMatch = !!matches[leftId];
    
    if (showResult && hasMatch) {
      return isMatchCorrect(leftId)
        ? 'bg-green-900/30 border-green-500'
        : 'bg-red-900/30 border-red-500';
    }
    
    if (isSelected) {
      return 'ring-2 ring-amber-500 bg-gray-700 border-amber-400';
    }
    
    if (hasMatch) {
      return 'bg-gray-700 border-amber-400';
    }
    
    if (selectedRight) {
      return 'bg-gray-700 border-amber-300 hover:bg-gray-600';
    }
    
    return 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-amber-500/50';
  }
  
  function getRightItemClass(rightId: string): string {
    const isUsed = isRightItemUsed(rightId);
    const isSelected = selectedRight === rightId;
    const leftId = getLeftForRight(rightId);
    
    if (showResult && isUsed && leftId) {
      return isMatchCorrect(leftId)
        ? 'bg-green-900/30 border-green-500'
        : 'bg-red-900/30 border-red-500';
    }
    
    if (isSelected) {
      return 'ring-2 ring-amber-500 bg-gray-700 border-amber-400';
    }
    
    if (isUsed) {
      return 'bg-gray-700 border-amber-400';
    }
    
    if (selectedLeft) {
      return 'bg-gray-700 border-amber-300 hover:bg-gray-600';
    }
    
    return 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-amber-500/50';
  }
  
  // Score
  let correctCount = $derived(
    Object.keys(matches).filter(leftId => isMatchCorrect(leftId)).length
  );
  
  // Toggle pour voir les corrections
  let showingCorrections = $state(false);
</script>

<div class="matching-container relative" bind:this={containerRef}>
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-white text-gray-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border border-gray-200">
      ASSOCIE LES ÉLÉMENTS
    </span>
    {#if selectedLeft || selectedRight}
      <span class="text-amber-500 animate-pulse">
        {#if selectedLeft}
          Clique sur l'élément correspondant à droite
        {:else}
          Clique sur l'élément correspondant à gauche
        {/if}
      </span>
    {:else}
      <span class="text-gray-400">
        Clique sur un élément, puis sur sa correspondance
      </span>
    {/if}
  </p>
  
  <!-- SVG pour les lignes de connexion -->
  <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" style="overflow: visible;">
    {#each lines as line}
      <!-- Ligne de connexion avec courbe de Bézier -->
      <path
        d="M {line.x1} {line.y1} C {line.x1 + 40} {line.y1}, {line.x2 - 40} {line.y2}, {line.x2} {line.y2}"
        stroke={getLineColor(line.leftId)}
        stroke-width="3"
        fill="none"
        class="transition-all duration-300"
        stroke-linecap="round"
      />
      <!-- Point de départ avec bouton supprimer -->
      {#if !disabled && !showResult}
        <g 
          class="cursor-pointer" 
          style="pointer-events: auto;"
          onclick={(e) => removeMatch(line.leftId, e)}
          role="button"
          tabindex="0"
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeMatch(line.leftId, e); }}
        >
          <circle
            cx={line.x1}
            cy={line.y1}
            r="10"
            fill="white"
            stroke="#ef4444"
            stroke-width="2"
            class="transition-all hover:fill-red-50"
          />
          <text
            x={line.x1}
            y={line.y1 + 1}
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#ef4444"
            font-size="12"
            font-weight="bold"
          >×</text>
        </g>
      {:else}
        <!-- Point de départ simple (sans bouton) -->
        <circle
          cx={line.x1}
          cy={line.y1}
          r="5"
          fill={getLineColor(line.leftId)}
          class="transition-all duration-300"
        />
      {/if}
      <!-- Point d'arrivée -->
      <circle
        cx={line.x2}
        cy={line.y2}
        r="5"
        fill={getLineColor(line.leftId)}
        class="transition-all duration-300"
      />
    {/each}
  </svg>
  
  <div class="grid grid-cols-2 gap-8">
    <!-- Colonne gauche -->
    <div class="space-y-3">
      <h4 class="font-medium text-gray-400 text-center pb-2 border-b border-gray-700">À associer</h4>
      {#each leftItems as item}
        <button
          bind:this={leftRefs[item.id]}
          onclick={() => handleLeftClick(item.id)}
          disabled={disabled}
          class="w-full p-4 rounded-xl border-2 transition-all text-left relative
            {getLeftItemClass(item.id)}
            {disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}"
        >
          <div class="flex items-center gap-3">
            {#if item.image}
              <img src={item.image} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <span class="font-medium text-white">{item.text}</span>
            
            {#if showResult && matches[item.id]}
              <span class="ml-auto">
                {#if isMatchCorrect(item.id)}
                  <span class="text-green-400 text-xl">✓</span>
                {:else}
                  <span class="text-red-400 text-xl">✗</span>
                {/if}
              </span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
    
    <!-- Colonne droite -->
    <div class="space-y-3">
      <h4 class="font-medium text-gray-400 text-center pb-2 border-b border-gray-700">Correspondances</h4>
      {#each rightItems as item}
        <button
          bind:this={rightRefs[item.id]}
          onclick={() => handleRightClick(item.id)}
          disabled={disabled}
          class="w-full p-4 rounded-xl border-2 transition-all text-left relative
            {getRightItemClass(item.id)}
            {disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}"
        >
          <div class="flex items-center gap-3">
            {#if item.image}
              <img src={item.image} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <span class="font-medium text-white">{item.text}</span>
            
            {#if isRightItemUsed(item.id)}
              <span class="ml-auto text-amber-500">✓</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Résultat -->
  {#if showResult}
    <div class="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-xl">
      <div class="flex items-center justify-between mb-3">
        <p class="font-medium text-gray-200">
          {correctCount} / {leftItems.length} associations correctes
        </p>
        <button
          onclick={() => showingCorrections = !showingCorrections}
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            {showingCorrections 
              ? 'bg-amber-500 text-gray-900 hover:bg-amber-400' 
              : 'bg-green-500 text-white hover:bg-green-400'}"
        >
          {#if showingCorrections}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
            </svg>
            Masquer les corrections
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Voir les corrections
          {/if}
        </button>
      </div>
      
      {#if showingCorrections}
        <div class="space-y-2 pt-3 border-t border-gray-600">
          <p class="text-sm text-gray-400 mb-2">Associations correctes :</p>
          {#each Object.entries(correctMatches) as [leftId, rightId]}
            {@const leftItem = leftItems.find(i => i.id === leftId)}
            {@const rightItem = rightItems.find(i => i.id === rightId)}
            {@const userAnswer = matches[leftId]}
            {@const userRightItem = userAnswer ? rightItems.find(i => i.id === userAnswer) : null}
            {@const isCorrect = isMatchCorrect(leftId)}
            {#if leftItem && rightItem}
              <div class="flex items-center gap-2 p-2 rounded-lg {isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'}">
                <span class="font-medium text-white">{leftItem.text}</span>
                <span class="text-gray-400">→</span>
                <span class="text-white">{rightItem.text}</span>
                {#if isCorrect}
                  <span class="text-green-400 ml-auto">✓</span>
                {:else}
                  <span class="text-red-400 ml-2">(tu as mis : {userRightItem?.text || 'rien'})</span>
                  <span class="text-red-400 ml-auto">✗</span>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Compteur -->
  <div class="mt-4 text-center text-sm text-gray-500">
    {Object.keys(matches).length} / {leftItems.length} associations faites
  </div>
</div>
