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
        ? 'border-green-500 bg-green-50'
        : 'border-red-500 bg-red-50';
    }
    
    if (draggedIndex === index) {
      return 'opacity-50 border-purple-300 bg-purple-50';
    }
    
    if (dragOverIndex === index && draggedIndex !== null) {
      return 'border-purple-500 bg-purple-100 border-dashed';
    }
    
    return 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50';
  }
  
  // Calcul du score
  let correctCount = $derived(
    showResult ? currentOrder.filter((id, i) => id === correctOrder[i]).length : 0
  );
</script>

<div class="ordering-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
      Remets dans l'ordre
    </span>
    <span class="text-gray-400">
      Glisse-dépose ou utilise les flèches pour réorganiser
    </span>
  </p>
  
  <!-- Liste ordonnée -->
  <div class="space-y-2">
    {#each currentOrder as itemId, index}
      {@const item = getItemAtPosition(index)}
      {#if item}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          role="listitem"
          draggable={!disabled}
          ondragstart={(e) => handleDragStart(index, e)}
          ondragover={(e) => handleDragOver(index, e)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(index, e)}
          ondragend={handleDragEnd}
          class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all
            {getItemClass(index)}
            {disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}"
        >
          <!-- Numéro de position -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold
            {showResult 
              ? (isCorrectPosition(index) ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700')
              : 'bg-purple-200 text-purple-700'}">
            {index + 1}
          </div>
          
          <!-- Handle de drag -->
          {#if !disabled}
            <div class="text-gray-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 8h16M4 16h16"></path>
              </svg>
            </div>
          {/if}
          
          <!-- Contenu de l'item -->
          <div class="flex-1 flex items-center gap-3">
            {#if item.image}
              <img src={item.image} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <span class="font-medium">{item.text}</span>
          </div>
          
          <!-- Boutons de déplacement (mobile-friendly) -->
          {#if !disabled}
            <div class="flex flex-col gap-1">
              <button
                onclick={() => moveUp(index)}
                disabled={index === 0}
                aria-label="Monter"
                class="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
              <button
                onclick={() => moveDown(index)}
                disabled={index === currentOrder.length - 1}
                aria-label="Descendre"
                class="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          {/if}
          
          <!-- Indicateur résultat -->
          {#if showResult}
            <div class="ml-2">
              {#if isCorrectPosition(index)}
                <span class="text-green-600 text-xl">✓</span>
              {:else}
                <span class="text-red-600 text-xl">✗</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  
  <!-- Résultat -->
  {#if showResult}
    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div class="flex items-center justify-between">
        <p class="font-medium text-blue-800">
          {correctCount} / {currentOrder.length} éléments bien placés
        </p>
        {#if correctCount < currentOrder.length}
          <button
            onclick={() => onOrderChange([...correctOrder])}
            class="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Voir l'ordre correct
          </button>
        {/if}
      </div>
      
      {#if correctCount < currentOrder.length}
        <div class="mt-3 pt-3 border-t border-blue-200">
          <p class="text-sm text-blue-700 mb-2">Ordre correct :</p>
          <div class="flex flex-wrap gap-2">
            {#each correctOrder as id, i}
              {@const item = items.find(item => item.id === id)}
              {#if item}
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-blue-200 text-sm">
                  <span class="font-bold text-blue-500">{i + 1}.</span>
                  <span>{item.text}</span>
                </span>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
