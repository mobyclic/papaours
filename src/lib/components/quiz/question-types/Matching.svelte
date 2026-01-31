<script lang="ts">
  /**
   * Question d'association (Matching)
   * L'utilisateur associe les éléments de gauche avec ceux de droite
   */
  
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
  
  // État pour le drag & drop et la sélection
  let selectedLeft = $state<string | null>(null);
  let draggedRight = $state<string | null>(null);
  
  function handleLeftClick(leftId: string) {
    if (disabled) return;
    
    if (selectedLeft === leftId) {
      // Désélectionner
      selectedLeft = null;
    } else {
      selectedLeft = leftId;
    }
  }
  
  function handleRightClick(rightId: string) {
    if (disabled || !selectedLeft) return;
    
    // Créer l'association
    const newMatches = { ...matches };
    
    // Retirer l'ancienne association si rightId était déjà utilisé
    for (const [left, right] of Object.entries(newMatches)) {
      if (right === rightId) {
        delete newMatches[left];
      }
    }
    
    newMatches[selectedLeft] = rightId;
    onMatchChange(newMatches);
    selectedLeft = null;
  }
  
  function removeMatch(leftId: string) {
    if (disabled) return;
    const newMatches = { ...matches };
    delete newMatches[leftId];
    onMatchChange(newMatches);
  }
  
  function isMatchCorrect(leftId: string): boolean {
    return matches[leftId] === correctMatches[leftId];
  }
  
  function getMatchedRightItem(leftId: string): MatchingItem | undefined {
    const rightId = matches[leftId];
    return rightItems.find(item => item.id === rightId);
  }
  
  function isRightItemUsed(rightId: string): boolean {
    return Object.values(matches).includes(rightId);
  }
  
  function getLeftItemClass(leftId: string): string {
    if (selectedLeft === leftId) {
      return 'ring-2 ring-purple-500 bg-purple-100';
    }
    if (showResult && matches[leftId]) {
      return isMatchCorrect(leftId)
        ? 'bg-green-50 border-green-500'
        : 'bg-red-50 border-red-500';
    }
    if (matches[leftId]) {
      return 'bg-purple-50 border-purple-400';
    }
    return 'bg-white hover:bg-gray-50';
  }
  
  function getRightItemClass(rightId: string): string {
    const isUsed = isRightItemUsed(rightId);
    
    if (showResult) {
      // Trouver si cette réponse droite est correctement associée
      for (const [left, right] of Object.entries(matches)) {
        if (right === rightId) {
          return isMatchCorrect(left)
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500';
        }
      }
      return 'bg-gray-100 opacity-50';
    }
    
    if (isUsed) {
      return 'bg-purple-50 border-purple-400 opacity-60';
    }
    
    if (selectedLeft) {
      return 'bg-yellow-50 border-yellow-400 hover:bg-yellow-100 cursor-pointer';
    }
    
    return 'bg-white';
  }
</script>

<div class="matching-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
      Associe les éléments
    </span>
    {#if selectedLeft}
      <span class="text-purple-600 animate-pulse">
        Clique sur l'élément correspondant à droite
      </span>
    {:else}
      <span class="text-gray-400">
        Clique sur un élément à gauche, puis sur sa correspondance à droite
      </span>
    {/if}
  </p>
  
  <div class="grid grid-cols-2 gap-6">
    <!-- Colonne gauche -->
    <div class="space-y-3">
      <h4 class="font-medium text-gray-600 text-center pb-2 border-b">À associer</h4>
      {#each leftItems as item}
        <button
          onclick={() => handleLeftClick(item.id)}
          disabled={disabled}
          class="w-full p-3 rounded-xl border-2 transition-all text-left
            {getLeftItemClass(item.id)}
            {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
        >
          <div class="flex items-center gap-3">
            {#if item.image}
              <img src={item.image} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <div class="flex-1">
              <span class="font-medium">{item.text}</span>
              {#if matches[item.id]}
                <div class="mt-1 flex items-center gap-2 text-sm">
                  <span class="text-purple-600">→</span>
                  <span class="text-purple-700">{getMatchedRightItem(item.id)?.text}</span>
                  {#if !disabled}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <span
                      role="button"
                      tabindex="0"
                      onclick={(e) => { e.stopPropagation(); removeMatch(item.id); }}
                      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); removeMatch(item.id); }}}
                      class="text-red-500 hover:text-red-700 ml-auto cursor-pointer"
                    >
                      ✕
                    </span>
                  {/if}
                  {#if showResult}
                    {#if isMatchCorrect(item.id)}
                      <span class="text-green-600 ml-auto">✓</span>
                    {:else}
                      <span class="text-red-600 ml-auto">✗</span>
                    {/if}
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
    
    <!-- Colonne droite -->
    <div class="space-y-3">
      <h4 class="font-medium text-gray-600 text-center pb-2 border-b">Correspondances</h4>
      {#each rightItems as item}
        <button
          onclick={() => handleRightClick(item.id)}
          disabled={disabled || !selectedLeft || isRightItemUsed(item.id)}
          class="w-full p-3 rounded-xl border-2 transition-all text-left
            {getRightItemClass(item.id)}
            {(disabled || !selectedLeft || isRightItemUsed(item.id)) ? 'cursor-default' : ''}"
        >
          <div class="flex items-center gap-3">
            {#if item.image}
              <img src={item.image} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <span class="font-medium">{item.text}</span>
            {#if isRightItemUsed(item.id)}
              <span class="ml-auto text-purple-500">✓</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Corrections -->
  {#if showResult}
    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <p class="font-medium text-blue-800 mb-2">Associations correctes :</p>
      <div class="space-y-1">
        {#each Object.entries(correctMatches) as [leftId, rightId]}
          {@const leftItem = leftItems.find(i => i.id === leftId)}
          {@const rightItem = rightItems.find(i => i.id === rightId)}
          {#if leftItem && rightItem}
            <div class="flex items-center gap-2 text-blue-700">
              <span class="font-medium">{leftItem.text}</span>
              <span class="text-blue-400">→</span>
              <span>{rightItem.text}</span>
              {#if isMatchCorrect(leftId)}
                <span class="text-green-600 ml-2">✓</span>
              {:else}
                <span class="text-red-600 ml-2">✗</span>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Compteur -->
  <div class="mt-4 text-center text-sm text-gray-500">
    {Object.keys(matches).length} / {leftItems.length} associations faites
  </div>
</div>
