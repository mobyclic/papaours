<script lang="ts">
  /**
   * Question à trous (Fill in the blank)
   * Supporte plusieurs formats:
   * - {réponse} : accolades avec la réponse dedans (sera extraite comme correctAnswer)
   * - [___] : marqueur classique
   * - {{blank}} : marqueur alternatif
   * - ___ : triple underscore
   */
  
  interface Props {
    /** Le texte avec les marqueurs de trous: "L'eau bout à {100} degrés" */
    textWithBlanks: string;
    /** Les réponses saisies par l'utilisateur */
    answers: string[];
    disabled?: boolean;
    showResult?: boolean;
    /** Les bonnes réponses attendues (optionnel si {réponse} est utilisé) */
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
  
  // Pattern pour détecter les trous - supporte {réponse}, [___], {{blank}}, ___
  const blankPatternWithAnswer = /\{([^}]+)\}|\[___\]|\{\{blank\}\}|___/g;
  
  // Extraire les parties de texte et les réponses correctes depuis {réponse}
  let parsedData = $derived.by(() => {
    const parts: string[] = [];
    const extractedAnswers: string[] = [];
    let lastIndex = 0;
    let match;
    
    const regex = new RegExp(blankPatternWithAnswer.source, 'g');
    
    while ((match = regex.exec(textWithBlanks)) !== null) {
      // Ajouter le texte avant le trou
      parts.push(textWithBlanks.slice(lastIndex, match.index));
      
      // Si c'est un format {réponse}, extraire la réponse
      if (match[1]) {
        extractedAnswers.push(match[1]);
      } else {
        // Pour les autres formats, utiliser correctAnswers fourni
        extractedAnswers.push(correctAnswers[extractedAnswers.length] || '');
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Ajouter le reste du texte
    parts.push(textWithBlanks.slice(lastIndex));
    
    return { parts, extractedAnswers };
  });
  
  let parts = $derived(parsedData.parts);
  let finalCorrectAnswers = $derived(
    parsedData.extractedAnswers.some(a => a) 
      ? parsedData.extractedAnswers 
      : correctAnswers
  );
  let blankCount = $derived(finalCorrectAnswers.length);
  
  // S'assurer que le tableau de réponses a la bonne taille
  $effect(() => {
    if (answers.length !== blankCount && blankCount > 0) {
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
    if (!finalCorrectAnswers[index]) return false;
    const userAnswer = answers[index]?.trim() || '';
    const correct = finalCorrectAnswers[index].trim();
    
    if (caseSensitive) {
      return userAnswer === correct;
    }
    return userAnswer.toLowerCase() === correct.toLowerCase();
  }
  
  function getInputClass(index: number): string {
    if (showResult) {
      return isCorrect(index)
        ? 'border-green-500 bg-green-500/20 text-green-400'
        : 'border-red-500 bg-red-500/20 text-red-400';
    }
    return 'border-gray-600 bg-gray-800 text-white focus:border-amber-500 focus:ring-amber-500/30';
  }
  
  // Calcul de la largeur approximative basée sur la réponse correcte
  function getInputWidth(index: number): string {
    const minWidth = 80;
    const correctAnswer = finalCorrectAnswers[index] || '';
    const width = Math.max(minWidth, correctAnswer.length * 14 + 40);
    return `${width}px`;
  }
</script>

<div class="fill-blank-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-400 mb-4 flex items-center gap-2">
    <span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-medium">
      Complète les trous
    </span>
    {#if blankCount > 1}
      <span class="text-gray-500">{blankCount} réponses à compléter</span>
    {/if}
  </p>
  
  <!-- Texte avec inputs -->
  <div class="text-lg leading-loose p-4 bg-gray-800/50 rounded-xl text-gray-200">
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
    <div class="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
      <p class="font-medium text-gray-300 mb-2">Réponses correctes :</p>
      <div class="flex flex-wrap gap-2">
        {#each finalCorrectAnswers as answer, index}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg">
            <span class="text-amber-500 text-sm">#{index + 1}</span>
            <span class="font-medium text-white">{answer}</span>
            {#if isCorrect(index)}
              <span class="text-green-500">✓</span>
            {:else}
              <span class="text-red-500">✗</span>
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
