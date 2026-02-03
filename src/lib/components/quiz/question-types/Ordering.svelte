<script lang="ts">
  /**
   * Question de classement / ordonnancement (Ordering)
   * L'utilisateur doit remettre les éléments dans le bon ordre
   */
  
  interface OrderingItem {
    id: string;
    text: string;
    image?: string;
  }
  
  interface Props {
    items: OrderingItem[];
    /** L'ordre actuel des items (array d'ids) */
    currentOrder: string[];
    disabled?: boolean;
    showResult?: boolean;
    /** L'ordre correct (array d'ids) */
    correctOrder?: string[];
    onOrderChange: (order: string[]) => void;
  }
  
  let { 
    items,
    currentOrder = [],
    disabled = false,
    showResult = false,
    correctOrder = [],
    onOrderChange
  }: Props = $props();
  
  // Copie locale des items pour garantir la réactivité
  let localItems = $derived(items);
  
  // État drag & drop
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  
  // Initialiser l'ordre si vide
  $effect(() => {
    if (currentOrder.length === 0 && items.length > 0) {
      onOrderChange(items.map(i => i.id));
    }
  });
  
  function getItemAtPosition(position: number): OrderingItem | undefined {
    const id = currentOrder[position];
    return items.find(i => i.id === id);
  }
  
  function handleDragStart(index: number, e: DragEvent) {
    if (disabled) return;
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }
  
  function handleDragOver(index: number, e: DragEvent) {
    if (disabled) return;
    e.preventDefault();
    dragOverIndex = index;
  }
  
  function handleDragLeave() {
    dragOverIndex = null;
  }
  
  function handleDrop(targetIndex: number, e: DragEvent) {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    
    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);
    
    onOrderChange(newOrder);
    draggedIndex = null;
    dragOverIndex = null;
  }
  
  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }
  
  // Déplacement avec boutons (mobile-friendly)
  function moveUp(index: number) {
    if (disabled || index === 0) return;
    const newOrder = [...currentOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onOrderChange(newOrder);
  }
  
  function moveDown(index: number) {
    if (disabled || index === currentOrder.length - 1) return;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onOrderChange(newOrder);
  }
  
  function isCorrectPosition(index: number): boolean {
    return currentOrder[index] === correctOrder[index];
  }
  
  function getItemClass(index: number): string {
    if (showResult) {
      return isCorrectPosition(index)
        ? 'border-green-500 bg-green-900/30'
        : 'border-red-500 bg-red-900/30';
    }
    
    if (draggedIndex === index) {
      return 'opacity-50 border-amber-500 bg-gray-700';
    }
    
    if (dragOverIndex === index && draggedIndex !== null) {
      return 'border-amber-500 bg-gray-700 border-dashed';
    }
    
    return 'border-gray-600 bg-gray-800 hover:border-amber-500/50';
  }

  // État pour basculer entre ordre utilisateur et ordre correct
  let showingCorrectOrder = $state(false);
  
  // Sauvegarder l'ordre utilisateur pour pouvoir revenir
  let userOrder = $state<string[]>([]);
  
  // Calcul du score - utiliser userOrder quand showResult est actif
  let correctCount = $derived.by(() => {
    const orderToCheck = userOrder.length > 0 ? userOrder : currentOrder;
    return orderToCheck.filter((id, i) => id === correctOrder[i]).length;
  });
  
  $effect(() => {
    if (showResult && userOrder.length === 0 && currentOrder.length > 0) {
      userOrder = [...currentOrder];
    }
  });

  function toggleOrder() {
    showingCorrectOrder = !showingCorrectOrder;
  }
</script>

<div class="ordering-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-white text-gray-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border border-gray-200">
      REMETS DANS L'ORDRE
    </span>
    <span class="text-gray-400">
      Glisse-dépose ou utilise les flèches pour réorganiser
    </span>
  </p>
  
  <!-- Liste ordonnée -->
  <div class="space-y-2">
    {#each (showResult && userOrder.length > 0 ? (showingCorrectOrder ? correctOrder : userOrder) : currentOrder) as itemId, index (`${showingCorrectOrder}-${index}-${itemId}`)}
      {@const item = localItems.find(i => i.id === itemId)}
      {@const isCorrectAtPosition = showingCorrectOrder ? true : (userOrder[index] === correctOrder[index])}
      {#if item}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          role="listitem"
          draggable={!disabled && !showResult}
          ondragstart={(e) => handleDragStart(index, e)}
          ondragover={(e) => handleDragOver(index, e)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(index, e)}
          ondragend={handleDragEnd}
          class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-500 ease-in-out
            {showResult 
              ? (isCorrectAtPosition ? 'border-green-500 bg-green-900/30' : 'border-red-500 bg-red-900/30')
              : getItemClass(index)}
            {disabled || showResult ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}"
        >
          <!-- Numéro de position -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors duration-300
            {showResult 
              ? (isCorrectAtPosition ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
              : 'bg-amber-500 text-gray-900'}">
            {index + 1}
          </div>
          
          <!-- Contenu de l'item -->
          <div class="flex-1 flex items-center gap-3">
            {#if item.image}
              <img src={item.image} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <span class="font-medium text-white">{item.text}</span>
          </div>
          
          <!-- Boutons de déplacement (mobile-friendly) -->
          {#if !disabled && !showResult}
            <div class="flex flex-col gap-1">
              <button
                onclick={() => moveUp(index)}
                disabled={index === 0}
                aria-label="Monter"
                class="p-1 rounded text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
              <button
                onclick={() => moveDown(index)}
                disabled={index === currentOrder.length - 1}
                aria-label="Descendre"
                class="p-1 rounded text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          {/if}
          
          <!-- Indicateur résultat -->
          {#if showResult}
            <div class="ml-2 transition-all duration-300">
              {#if isCorrectAtPosition}
                <span class="text-green-400 text-xl">✓</span>
              {:else}
                <span class="text-red-400 text-xl">✗</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  
  <!-- Résultat -->
  {#if showResult}
    <div class="mt-4 p-4 bg-gray-800 border border-gray-600 rounded-xl">
      <div class="flex items-center justify-between">
        <p class="font-medium text-gray-200">
          {correctCount} / {userOrder.length} éléments bien placés
        </p>
        <button
          onclick={toggleOrder}
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            {showingCorrectOrder 
              ? 'bg-amber-500 text-gray-900 hover:bg-amber-400' 
              : 'bg-green-500 text-white hover:bg-green-400'}"
        >
          {#if showingCorrectOrder}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
            </svg>
            Voir mes réponses
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Voir l'ordre correct
          {/if}
        </button>
      </div>
      
      {#if showingCorrectOrder}
        <p class="mt-2 text-sm text-green-400 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Voici l'ordre correct
        </p>
      {/if}
    </div>
  {/if}
</div>
