<script lang="ts">
  /**
   * Question à trous (Fill in the blank)
   * Le texte contient des marqueurs [___] ou {{blank}} qui seront remplacés par des inputs
   */
  
  interface Props {
    /** Le texte avec les marqueurs de trous: "La capitale de [___] est Paris" */
    textWithBlanks: string;
    /** Les réponses saisies par l'utilisateur */
    answers: string[];
    disabled?: boolean;
    showResult?: boolean;
    /** Les bonnes réponses attendues */
    correctAnswers?: string[];
    /** Accepter les réponses en ignorant la casse */
    caseSensitive?: boolean;
    onAnswerChange: (answers: string[]) => void;
  }
  
  let { 
    textWithBlanks,
    answers = [],
    disabled = false,
    showResult = false,
    correctAnswers = [],
    caseSensitive = false,
    onAnswerChange
  }: Props = $props();
  
  // Parse le texte pour identifier les trous
  // Supporte les formats: [___], {{blank}}, ___
  const blankPattern = /\[___\]|\{\{blank\}\}|___/g;
  
  let parts = $derived(textWithBlanks.split(blankPattern));
  let blankCount = $derived((textWithBlanks.match(blankPattern) || []).length);
  
  // S'assurer que le tableau de réponses a la bonne taille
  $effect(() => {
    if (answers.length !== blankCount) {
      const newAnswers = Array(blankCount).fill('');
      answers.forEach((a, i) => {
        if (i < blankCount) newAnswers[i] = a;
      });
      onAnswerChange(newAnswers);
    }
  });
  
  function updateAnswer(index: number, value: string) {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    onAnswerChange(newAnswers);
  }
  
  function isCorrect(index: number): boolean {
    if (!correctAnswers[index]) return false;
    const userAnswer = answers[index]?.trim() || '';
    const correct = correctAnswers[index].trim();
    
    if (caseSensitive) {
      return userAnswer === correct;
    }
    return userAnswer.toLowerCase() === correct.toLowerCase();
  }
  
  function getInputClass(index: number): string {
    if (showResult) {
      return isCorrect(index)
        ? 'border-green-500 bg-green-50 text-green-700'
        : 'border-red-500 bg-red-50 text-red-700';
    }
    return 'border-purple-300 focus:border-purple-500 focus:ring-purple-300';
  }
  
  // Calcul de la largeur approximative basée sur la réponse correcte
  function getInputWidth(index: number): string {
    const minWidth = 80;
    const correctAnswer = correctAnswers[index] || '';
    const width = Math.max(minWidth, correctAnswer.length * 12 + 40);
    return `${width}px`;
  }
</script>

<div class="fill-blank-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
      Complète les trous
    </span>
    {#if blankCount > 1}
      <span class="text-gray-400">{blankCount} réponses à compléter</span>
    {/if}
  </p>
  
  <!-- Texte avec inputs -->
  <div class="text-lg leading-relaxed p-4 bg-gray-50 rounded-xl">
    {#each parts as part, index}
      <span class="whitespace-pre-wrap">{part}</span>
      {#if index < blankCount}
        <span class="inline-block align-middle mx-1">
          <input
            type="text"
            value={answers[index] || ''}
            oninput={(e) => updateAnswer(index, e.currentTarget.value)}
            disabled={disabled}
            placeholder="..."
            style="width: {getInputWidth(index)}"
            class="px-3 py-1 border-2 rounded-lg text-center font-medium transition-all
              {getInputClass(index)}
              {disabled ? 'bg-gray-100 cursor-not-allowed' : ''}"
          />
          {#if showResult}
            {#if isCorrect(index)}
              <span class="text-green-600 ml-1">✓</span>
            {:else}
              <span class="text-red-600 ml-1">✗</span>
            {/if}
          {/if}
        </span>
      {/if}
    {/each}
  </div>
  
  <!-- Corrections -->
  {#if showResult}
    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <p class="font-medium text-blue-800 mb-2">Réponses correctes :</p>
      <div class="flex flex-wrap gap-2">
        {#each correctAnswers as answer, index}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 rounded-lg">
            <span class="text-blue-500 text-sm">#{index + 1}</span>
            <span class="font-medium text-blue-800">{answer}</span>
            {#if isCorrect(index)}
              <span class="text-green-600">✓</span>
            {:else}
              <span class="text-red-600">✗</span>
            {/if}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .fill-blank-container input {
    vertical-align: baseline;
  }
</style>
