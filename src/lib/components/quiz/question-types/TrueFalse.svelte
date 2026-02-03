<script lang="ts">
  /**
   * Vrai/Faux avec justification optionnelle
   */
  
  interface Props {
    selectedAnswer: boolean | null;
    justification?: string;
    requireJustification?: boolean;
    disabled?: boolean;
    showResult?: boolean;
    correctAnswer?: boolean;
    correctJustification?: string;
    onSelect: (answer: boolean) => void;
    onJustificationChange?: (text: string) => void;
  }
  
  let { 
    selectedAnswer = null, 
    justification = '',
    requireJustification = false,
    disabled = false, 
    showResult = false,
    correctAnswer,
    correctJustification,
    onSelect,
    onJustificationChange
  }: Props = $props();
  
  function getButtonClass(value: boolean): string {
    const isSelected = selectedAnswer === value;
    const isCorrectValue = correctAnswer === value;
    
    if (showResult) {
      if (isCorrectValue && isSelected) {
        return 'border-green-500 bg-green-100 text-green-700';
      } else if (isCorrectValue && !isSelected) {
        return 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-300';
      } else if (!isCorrectValue && isSelected) {
        return 'border-red-500 bg-red-100 text-red-700';
      }
      return 'border-gray-200 text-gray-400';
    }
    
    if (isSelected) {
      return value 
        ? 'border-green-500 bg-green-100 text-green-700'
        : 'border-red-500 bg-red-100 text-red-700';
    }
    
    return 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700';
  }
</script>

<div class="space-y-4">
  <!-- Boutons Vrai/Faux -->
  <div class="flex gap-4 justify-center">
    <button
      onclick={() => onSelect(true)}
      disabled={disabled}
      class="flex-1 max-w-xs p-6 rounded-xl border-2 transition-all font-bold text-xl
        {getButtonClass(true)}
        {disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}"
    >
      <div class="flex items-center justify-center gap-3">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        VRAI
      </div>
      {#if showResult && correctAnswer === true}
        <div class="text-sm font-normal mt-2">
          {selectedAnswer === true ? '✓ Correct' : 'Bonne réponse'}
        </div>
      {/if}
    </button>
    
    <button
      onclick={() => onSelect(false)}
      disabled={disabled}
      class="flex-1 max-w-xs p-6 rounded-xl border-2 transition-all font-bold text-xl
        {getButtonClass(false)}
        {disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}"
    >
      <div class="flex items-center justify-center gap-3">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        FAUX
      </div>
      {#if showResult && correctAnswer === false}
        <div class="text-sm font-normal mt-2">
          {selectedAnswer === false ? '✓ Correct' : 'Bonne réponse'}
        </div>
      {/if}
    </button>
  </div>
  
  <!-- Justification -->
  {#if requireJustification || justification}
    <div class="mt-4">
      <label for="tf-justification" class="block text-sm font-medium text-gray-700 mb-2">
        Justifie ta réponse 
        {#if requireJustification}
          <span class="text-red-500">*</span>
        {:else}
          <span class="text-gray-400">(optionnel)</span>
        {/if}
      </label>
      <textarea
        id="tf-justification"
        value={justification}
        oninput={(e) => onJustificationChange?.(e.currentTarget.value)}
        disabled={disabled}
        placeholder="Explique pourquoi tu as choisi cette réponse..."
        class="w-full p-3 border-2 rounded-xl resize-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500
          {disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}"
        rows="3"
      ></textarea>
    </div>
  {/if}
  
  <!-- Correction justification -->
  {#if showResult && correctJustification}
    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <p class="font-medium text-blue-800 mb-1">Explication :</p>
      <p class="text-blue-700">{correctJustification}</p>
    </div>
  {/if}
</div>
