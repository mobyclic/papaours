<script lang="ts">
  /**
   * Question ouverte (courte ou longue)
   * Permet une réponse texte libre avec compteur de mots/caractères
   * Supporte l'évaluation par mots-clés (gratuit) ou IA (premium)
   * Supporte les metadata pour validation avancée (types, tolérance, regex)
   */
  
  import type { QuestionMetadata } from '$lib/types/question';
  
  type AnswerType = 'short' | 'long';
  
  interface AIEvaluation {
    mode: 'ai';
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    correctedAnswer?: string;
  }
  
  interface KeywordEvaluation {
    mode: 'keywords';
    score: number;
    foundKeywords: string[];
    missingKeywords: string[];
    wordCount: number;
    wordCountValid: boolean;
    feedback: string;
    sampleAnswers: string[];
  }
  
  type EvaluationResult = AIEvaluation | KeywordEvaluation | null;
  
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
    /** Résultat de l'évaluation (IA ou mots-clés) */
    evaluation?: EvaluationResult;
    /** Score attribué (pour mode examen) */
    score?: number | null;
    /** Metadata pour validation avancée */
    metadata?: QuestionMetadata;
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
    evaluation = null,
    score = null,
    metadata,
    onAnswerChange
  }: Props = $props();
  
  // Utiliser metadata si disponible
  let effectiveMaxLength = $derived(metadata?.maxChars ?? maxLength);
  let effectiveMinLength = $derived(metadata?.minChars ?? minLength);
  let effectivePlaceholder = $derived(metadata?.inputPlaceholder ?? placeholder);
  let inputType = $derived(metadata?.inputType ?? 'text');
  let inputHint = $derived(metadata?.inputHint);
  let unit = $derived(metadata?.unit);
  
  // Compteurs
  let charCount = $derived(answer.length);
  let wordCount = $derived(
    answer.trim() ? answer.trim().split(/\s+/).length : 0
  );
  
  // Validation
  let lengthValid = $derived(
    (effectiveMinLength === 0 || charCount >= effectiveMinLength) &&
    (effectiveMaxLength === 0 || charCount <= effectiveMaxLength)
  );
  
  let wordCountValid = $derived(
    (minWords === 0 || wordCount >= minWords) &&
    (maxWords === 0 || wordCount <= maxWords)
  );
  
  // Validation du format (basée sur metadata)
  let formatValid = $derived.by(() => {
    if (!metadata?.answerType || !answer.trim()) return true;
    
    const trimmed = answer.trim();
    
    switch (metadata.answerType) {
      case 'integer':
        return /^-?\d+$/.test(trimmed);
      case 'float':
        return /^-?\d+([.,]\d+)?$/.test(trimmed);
      case 'year':
        return /^\d{4}$/.test(trimmed);
      case 'date':
        // Format simple: JJ/MM/AAAA ou AAAA-MM-JJ
        return /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(trimmed);
      case 'regex':
        if (metadata.pattern) {
          try {
            return new RegExp(metadata.pattern).test(trimmed);
          } catch {
            return true; // Pattern invalide, on accepte
          }
        }
        return true;
      default:
        return true;
    }
  });
  
  // Message d'erreur de format
  let formatErrorMessage = $derived.by(() => {
    if (formatValid || !answer.trim()) return null;
    
    switch (metadata?.answerType) {
      case 'integer':
        return 'Nombre entier attendu (ex: 42)';
      case 'float':
        return 'Nombre décimal attendu (ex: 3.14)';
      case 'year':
        return 'Année attendue (ex: 1789)';
      case 'date':
        return 'Date attendue (ex: 14/07/1789)';
      case 'regex':
        return 'Format invalide';
      default:
        return null;
    }
  });
  
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
    if (effectiveMaxLength > 0 && value.length > effectiveMaxLength) {
      value = value.slice(0, effectiveMaxLength);
    }
    
    onAnswerChange(value);
  }
  
  // Label du type de réponse attendu
  let answerTypeLabel = $derived.by(() => {
    if (!metadata?.answerType) return type === 'short' ? 'RÉPONSE COURTE' : 'RÉPONSE DÉVELOPPÉE';
    
    switch (metadata.answerType) {
      case 'integer': return 'NOMBRE ENTIER';
      case 'float': return 'NOMBRE DÉCIMAL';
      case 'year': return 'ANNÉE';
      case 'date': return 'DATE';
      default: return type === 'short' ? 'RÉPONSE COURTE' : 'RÉPONSE DÉVELOPPÉE';
    }
  });
</script>

<div class="open-answer-container">
  <!-- Instructions -->
  <p class="text-sm text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
    <span class="bg-white text-gray-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border border-gray-200">
      {answerTypeLabel}
    </span>
    {#if unit}
      <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
        en {unit}
      </span>
    {/if}
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
  
  <!-- Hint si défini -->
  {#if inputHint}
    <p class="text-xs text-gray-400 mb-2 italic">💡 {inputHint}</p>
  {/if}
  
  <!-- Input -->
  {#if type === 'short'}
    <div class="relative">
      <input
        type={inputType}
        value={answer}
        oninput={handleInput}
        disabled={disabled}
        placeholder={effectivePlaceholder}
        maxlength={effectiveMaxLength > 0 ? effectiveMaxLength : undefined}
        class="w-full p-4 border-2 rounded-xl text-lg transition-all text-white placeholder:text-gray-400
          {disabled ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-800'}
          {!lengthValid || !formatValid ? 'border-orange-400' : 'border-gray-600 focus:border-purple-500'}
          focus:ring-2 focus:ring-purple-300 focus:outline-none
          {unit ? 'pr-16' : ''}"
      />
      {#if unit}
        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          {unit}
        </span>
      {/if}
    </div>
  {:else}
    <textarea
      value={answer}
      oninput={handleInput}
      disabled={disabled}
      placeholder={effectivePlaceholder}
      rows="6"
      class="w-full p-4 border-2 rounded-xl text-lg resize-y transition-all text-white placeholder:text-gray-400
        {disabled ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-800'}
        {!lengthValid || !wordCountValid ? 'border-orange-400' : 'border-gray-600 focus:border-purple-500'}
        focus:ring-2 focus:ring-purple-300 focus:outline-none"
    ></textarea>
  {/if}
  
  <!-- Message d'erreur de format -->
  {#if formatErrorMessage && !disabled}
    <p class="text-orange-400 text-sm mt-2 flex items-center gap-1">
      ⚠️ {formatErrorMessage}
    </p>
  {/if}
  
  <!-- Compteurs -->
  <div class="mt-2 flex flex-wrap items-center justify-between text-sm text-gray-500">
    <div class="flex gap-4">
      <!-- Compteur de caractères -->
      {#if effectiveMaxLength > 0}
        <span class="{charCount > effectiveMaxLength ? 'text-red-500' : (charCount >= effectiveMinLength ? 'text-green-600' : '')}">
          {charCount} / {effectiveMaxLength} caractères
        </span>
      {:else if effectiveMinLength > 0}
        <span class="{charCount >= effectiveMinLength ? 'text-green-600' : 'text-orange-500'}">
          {charCount} caractères (min. {effectiveMinLength})
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
      <!-- Score (si disponible) -->
      {#if evaluation?.score !== undefined || score !== null}
        {@const displayScore = score ?? evaluation?.score ?? 0}
        <div class="p-4 rounded-xl border-2 {displayScore >= 70 ? 'bg-green-900/30 border-green-500' : displayScore >= 40 ? 'bg-amber-900/30 border-amber-500' : 'bg-red-900/30 border-red-500'}">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold {displayScore >= 70 ? 'text-green-400' : displayScore >= 40 ? 'text-amber-400' : 'text-red-400'}">
              {displayScore >= 70 ? '🎉' : displayScore >= 40 ? '👍' : '💪'} Score : {displayScore}/100
            </span>
          </div>
          {#if evaluation?.feedback}
            <p class="mt-2 text-gray-300">{evaluation.feedback}</p>
          {/if}
        </div>
      {/if}
      
      <!-- Évaluation IA détaillée -->
      {#if evaluation?.mode === 'ai'}
        <!-- Points forts -->
        {#if evaluation.strengths && evaluation.strengths.length > 0}
          <div class="p-4 bg-green-900/20 border border-green-700 rounded-xl">
            <p class="font-medium text-green-400 mb-2">✓ Points forts :</p>
            <ul class="space-y-1">
              {#each evaluation.strengths as strength}
                <li class="text-green-300 text-sm flex items-start gap-2">
                  <span class="text-green-500">•</span>
                  {strength}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- Améliorations suggérées -->
        {#if evaluation.improvements && evaluation.improvements.length > 0}
          <div class="p-4 bg-amber-900/20 border border-amber-700 rounded-xl">
            <p class="font-medium text-amber-400 mb-2">💡 Pour améliorer :</p>
            <ul class="space-y-1">
              {#each evaluation.improvements as improvement}
                <li class="text-amber-300 text-sm flex items-start gap-2">
                  <span class="text-amber-500">•</span>
                  {improvement}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- Réponse corrigée (si score faible) -->
        {#if evaluation.correctedAnswer}
          <div class="p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
            <p class="font-medium text-blue-400 mb-2">📝 Exemple de réponse améliorée :</p>
            <p class="text-blue-300 text-sm italic">"{evaluation.correctedAnswer}"</p>
          </div>
        {/if}
      {:else}
        <!-- Évaluation par mots-clés (mode gratuit) -->
        {#if expectedKeywords.length > 0}
          <div class="p-4 bg-purple-900/20 border border-purple-700 rounded-xl">
            <p class="font-medium text-purple-400 mb-2">Points clés attendus :</p>
            <div class="flex flex-wrap gap-2">
              {#each expectedKeywords as keyword}
                {@const found = answer.toLowerCase().includes(keyword.toLowerCase())}
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
                  {found ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-gray-800 text-gray-400 border border-gray-700'}">
                  {#if found}
                    <span>✓</span>
                  {:else}
                    <span>○</span>
                  {/if}
                  {keyword}
                </span>
              {/each}
            </div>
            <p class="mt-2 text-sm text-purple-400">
              {foundKeywords.length} / {expectedKeywords.length} points mentionnés
            </p>
          </div>
        {/if}
      {/if}
      
      <!-- Exemples de réponses -->
      {#if sampleAnswers.length > 0 && evaluation?.mode !== 'ai'}
        <div class="p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
          <p class="font-medium text-blue-400 mb-2">
            📖 Exemple{sampleAnswers.length > 1 ? 's' : ''} de bonne réponse :
          </p>
          {#each sampleAnswers as sample, i}
            <p class="text-blue-300 text-sm {i > 0 ? 'mt-2 pt-2 border-t border-blue-800' : ''}">
              {sample}
            </p>
          {/each}
        </div>
      {/if}
      
      <!-- Feedback enseignant/tuteur -->
      {#if feedback}
        <div class="p-4 bg-amber-900/20 border border-amber-700 rounded-xl">
          <p class="font-medium text-amber-400 mb-1">💬 Commentaire du tuteur :</p>
          <p class="text-amber-300">{feedback}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
