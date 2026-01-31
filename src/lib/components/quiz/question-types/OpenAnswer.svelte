<script lang="ts">
  /**
   * Question ouverte (courte ou longue)
   * Permet une réponse texte libre avec compteur de mots/caractères
   */
  
  type AnswerType = 'short' | 'long';
  
  interface Props {
    type?: AnswerType;
    answer: string;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    minWords?: number;
    maxWords?: number;
    disabled?: boolean;
    showResult?: boolean;
    /** Exemples de bonnes réponses pour indication */
    sampleAnswers?: string[];
    /** Points clés attendus dans la réponse */
    expectedKeywords?: string[];
    /** Feedback manuel de l'enseignant */
    feedback?: string;
    onAnswerChange: (answer: string) => void;
  }
  
  let { 
    type = 'short',
    answer = '',
    placeholder = 'Tape ta réponse ici...',
    minLength = 0,
    maxLength = 0,
    minWords = 0,
    maxWords = 0,
    disabled = false,
    showResult = false,
    sampleAnswers = [],
    expectedKeywords = [],
    feedback,
    onAnswerChange
  }: Props = $props();
  
  // Compteurs
  let charCount = $derived(answer.length);
  let wordCount = $derived(
    answer.trim() ? answer.trim().split(/\s+/).length : 0
  );
  
  // Validation
  let lengthValid = $derived(
    (minLength === 0 || charCount >= minLength) &&
    (maxLength === 0 || charCount <= maxLength)
  );
  
  let wordCountValid = $derived(
    (minWords === 0 || wordCount >= minWords) &&
    (maxWords === 0 || wordCount <= maxWords)
  );
  
  // Détection des mots-clés présents
  let foundKeywords = $derived(
    expectedKeywords.filter(keyword =>
      answer.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    let value = target.value;
    
    // Appliquer la limite max si définie
    if (maxLength > 0 && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    
    onAnswerChange(value);
  }
</script>

<div class="open-answer-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2">
    <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
      {type === 'short' ? 'Réponse courte' : 'Réponse développée'}
    </span>
    {#if minWords > 0 || maxWords > 0}
      <span class="text-gray-400">
        {#if minWords > 0 && maxWords > 0}
          {minWords} à {maxWords} mots attendus
        {:else if minWords > 0}
          Minimum {minWords} mots
        {:else}
          Maximum {maxWords} mots
        {/if}
      </span>
    {/if}
  </p>
  
  <!-- Input -->
  {#if type === 'short'}
    <input
      type="text"
      value={answer}
      oninput={handleInput}
      disabled={disabled}
      placeholder={placeholder}
      class="w-full p-4 border-2 rounded-xl text-lg transition-all
        {disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        {!lengthValid ? 'border-orange-400' : 'border-gray-200 focus:border-purple-500'}
        focus:ring-2 focus:ring-purple-300"
    />
  {:else}
    <textarea
      value={answer}
      oninput={handleInput}
      disabled={disabled}
      placeholder={placeholder}
      rows="6"
      class="w-full p-4 border-2 rounded-xl text-lg resize-y transition-all
        {disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        {!lengthValid || !wordCountValid ? 'border-orange-400' : 'border-gray-200 focus:border-purple-500'}
        focus:ring-2 focus:ring-purple-300"
    ></textarea>
  {/if}
  
  <!-- Compteurs -->
  <div class="mt-2 flex flex-wrap items-center justify-between text-sm text-gray-500">
    <div class="flex gap-4">
      <!-- Compteur de caractères -->
      {#if maxLength > 0}
        <span class="{charCount > maxLength ? 'text-red-500' : (charCount >= minLength ? 'text-green-600' : '')}">
          {charCount} / {maxLength} caractères
        </span>
      {:else if minLength > 0}
        <span class="{charCount >= minLength ? 'text-green-600' : 'text-orange-500'}">
          {charCount} caractères (min. {minLength})
        </span>
      {/if}
      
      <!-- Compteur de mots -->
      {#if maxWords > 0 || minWords > 0}
        <span class="{wordCountValid ? (wordCount >= minWords ? 'text-green-600' : '') : 'text-orange-500'}">
          {wordCount} {wordCount > 1 ? 'mots' : 'mot'}
          {#if maxWords > 0}
            / {maxWords} max
          {:else if minWords > 0}
            (min. {minWords})
          {/if}
        </span>
      {/if}
    </div>
    
    <!-- Indicateur mots-clés -->
    {#if expectedKeywords.length > 0 && !showResult}
      <span class="text-purple-600">
        💡 {expectedKeywords.length - foundKeywords.length} point{expectedKeywords.length - foundKeywords.length > 1 ? 's' : ''} clé{expectedKeywords.length - foundKeywords.length > 1 ? 's' : ''} à mentionner
      </span>
    {/if}
  </div>
  
  <!-- Résultat / Feedback -->
  {#if showResult}
    <div class="mt-4 space-y-3">
      <!-- Mots-clés attendus -->
      {#if expectedKeywords.length > 0}
        <div class="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p class="font-medium text-purple-800 mb-2">Points clés attendus :</p>
          <div class="flex flex-wrap gap-2">
            {#each expectedKeywords as keyword}
              {@const found = answer.toLowerCase().includes(keyword.toLowerCase())}
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
                {found ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                {#if found}
                  <span>✓</span>
                {:else}
                  <span>○</span>
                {/if}
                {keyword}
              </span>
            {/each}
          </div>
          <p class="mt-2 text-sm text-purple-600">
            {foundKeywords.length} / {expectedKeywords.length} points mentionnés
          </p>
        </div>
      {/if}
      
      <!-- Exemples de réponses -->
      {#if sampleAnswers.length > 0}
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p class="font-medium text-blue-800 mb-2">
            Exemple{sampleAnswers.length > 1 ? 's' : ''} de bonne réponse :
          </p>
          {#each sampleAnswers as sample, i}
            <p class="text-blue-700 {i > 0 ? 'mt-2 pt-2 border-t border-blue-200' : ''}">
              {sample}
            </p>
          {/each}
        </div>
      {/if}
      
      <!-- Feedback enseignant -->
      {#if feedback}
        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p class="font-medium text-yellow-800 mb-1">💬 Commentaire :</p>
          <p class="text-yellow-700">{feedback}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
