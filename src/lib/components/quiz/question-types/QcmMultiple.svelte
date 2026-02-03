<script lang="ts">
  /**
   * QCM Multiple - Plusieurs bonnes réponses possibles
   * L'utilisateur peut sélectionner plusieurs options (checkboxes)
   */
  
  interface Props {
    options: string[];
    optionImages?: string[];
    selectedAnswers: number[];
    disabled?: boolean;
    showResult?: boolean;
    correctAnswers?: number[];
    onSelect: (answers: number[]) => void;
  }
  
  let { 
    options, 
    optionImages = [],
    selectedAnswers = [], 
    disabled = false, 
    showResult = false,
    correctAnswers = [],
    onSelect 
  }: Props = $props();
  
  function toggleOption(index: number) {
    if (disabled) return;
    
    if (selectedAnswers.includes(index)) {
      onSelect(selectedAnswers.filter(i => i !== index));
    } else {
      onSelect([...selectedAnswers, index]);
    }
  }
  
  function isCorrect(index: number): boolean {
    return correctAnswers.includes(index);
  }
  
  function isSelected(index: number): boolean {
    return selectedAnswers.includes(index);
  }
  
  function getOptionClass(index: number): string {
    if (showResult) {
      if (isCorrect(index) && isSelected(index)) {
        return 'border-green-500 bg-green-900/30'; // Correctement sélectionné
      } else if (isCorrect(index) && !isSelected(index)) {
        return 'border-green-500 bg-green-900/30 ring-2 ring-green-500/30'; // Aurait dû être sélectionné
      } else if (!isCorrect(index) && isSelected(index)) {
        return 'border-red-500 bg-red-900/30'; // Incorrectement sélectionné
      }
      return 'border-gray-600 bg-gray-800';
    }
    
    if (isSelected(index)) {
      return 'border-amber-500 bg-gray-800 ring-2 ring-amber-500/30';
    }
    
    return 'border-gray-600 bg-gray-800 hover:border-amber-500/50';
  }
</script>

<div class="space-y-3">
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-white text-gray-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border border-gray-200">
      PLUSIEURS RÉPONSES POSSIBLES
    </span>
    {#if selectedAnswers.length > 0}
      <span class="text-amber-500">{selectedAnswers.length} sélectionnée{selectedAnswers.length > 1 ? 's' : ''}</span>
    {/if}
  </p>
  
  {#each options as option, index}
    <button
      onclick={() => toggleOption(index)}
      disabled={disabled}
      class="w-full p-4 text-left rounded-xl border-2 transition-all {getOptionClass(index)}
        {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
    >
      <div class="flex items-center">
        <!-- Checkbox -->
        <div class="w-6 h-6 rounded border-2 flex items-center justify-center mr-3
          {isSelected(index)
            ? (showResult
              ? (isCorrect(index)
                ? 'border-green-500 bg-green-500'
                : 'border-red-500 bg-red-500')
              : 'border-amber-500 bg-amber-500')
            : (showResult && isCorrect(index)
              ? 'border-green-500 bg-green-900/50'
              : 'border-gray-500')}">
          {#if isSelected(index)}
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          {:else if showResult && isCorrect(index)}
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          {/if}
        </div>
        
        <!-- Option content -->
        <div class="flex-1">
          {#if optionImages?.[index]}
            <img 
              src={optionImages[index]} 
              alt={option}
              class="w-16 h-16 object-cover rounded mb-2"
            />
          {/if}
          <span class="font-medium text-white">{option}</span>
        </div>
        
        <!-- Result indicator -->
        {#if showResult}
          <div class="ml-2">
            {#if isCorrect(index) && isSelected(index)}
              <span class="text-green-400 text-xl">✓</span>
            {:else if isCorrect(index) && !isSelected(index)}
              <span class="text-green-400 text-sm">Manquée</span>
            {:else if !isCorrect(index) && isSelected(index)}
              <span class="text-red-400 text-xl">✗</span>
            {/if}
          </div>
        {/if}
      </div>
    </button>
  {/each}
</div>
