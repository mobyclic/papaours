<script lang="ts">
  interface Props {
    totalQuestions: number;
    currentIndex: number;
    answeredQuestions: Set<number>;
    onNavigate: (index: number) => void;
  }
  
  let { totalQuestions, currentIndex, answeredQuestions, onNavigate }: Props = $props();
  
  // Calculer le nombre de réponses
  let answeredCount = $derived(answeredQuestions.size);
  let unansweredCount = $derived(totalQuestions - answeredCount);
</script>

<div class="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-semibold text-gray-700">Navigation</h3>
    <div class="text-sm text-gray-500">
      <span class="text-green-600 font-medium">{answeredCount}</span>/{totalQuestions} répondues
    </div>
  </div>
  
  <!-- Grid of question buttons -->
  <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
    {#each Array(totalQuestions) as _, index}
      <button
        onclick={() => onNavigate(index)}
        class="w-8 h-8 rounded-lg text-sm font-medium transition-all
          {index === currentIndex 
            ? 'ring-2 ring-purple-500 ring-offset-2' 
            : ''}
          {answeredQuestions.has(index)
            ? 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'}"
      >
        {index + 1}
      </button>
    {/each}
  </div>
  
  <!-- Legend -->
  <div class="flex gap-4 mt-3 text-xs text-gray-500">
    <div class="flex items-center gap-1">
      <div class="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
      <span>Répondue</span>
    </div>
    <div class="flex items-center gap-1">
      <div class="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
      <span>À répondre</span>
    </div>
    <div class="flex items-center gap-1">
      <div class="w-3 h-3 rounded ring-2 ring-purple-500 ring-offset-1"></div>
      <span>Actuelle</span>
    </div>
  </div>
  
  <!-- Unanswered warning -->
  {#if unansweredCount > 0}
    <div class="mt-3 text-sm text-orange-600 flex items-center gap-1">
      <span>⚠️</span>
      <span>{unansweredCount} question{unansweredCount > 1 ? 's' : ''} sans réponse</span>
    </div>
  {/if}
</div>
