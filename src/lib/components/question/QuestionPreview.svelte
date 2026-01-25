<script lang="ts">
  import { 
    CheckCircle, Circle, ArrowRight, GripVertical,
    Image, Music, Video, AlertTriangle
  } from "lucide-svelte";
  import type { Question, QuestionType } from "$lib/types/question";
  import { getQuestionTypeInfo, getTypeColor } from "$lib/types/question";

  interface Props {
    question: Partial<Question>;
    language?: string;
    interactive?: boolean;
    showCorrectAnswers?: boolean;
  }

  let { 
    question, 
    language = 'fr', 
    interactive = false,
    showCorrectAnswers = true 
  }: Props = $props();

  // Get translation for current language
  let translation = $derived(
    question.translations?.find(t => t.language === language) || 
    question.translations?.[0] || 
    { title: 'Sans titre', language: 'fr' }
  );

  let typeInfo = $derived(getQuestionTypeInfo(question.type || 'qcm'));

  // User answers (for interactive mode)
  let selectedAnswers = $state<Set<string>>(new Set());
  let userOrdering = $state<string[]>([]);
  let userMatching = $state<Map<string, string>>(new Map());
  let userTextAnswer = $state('');

  function toggleAnswer(answerId: string) {
    if (!interactive) return;
    
    if (question.type === 'qcm') {
      selectedAnswers = new Set([answerId]);
    } else {
      const newSet = new Set(selectedAnswers);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
      }
      selectedAnswers = newSet;
    }
  }
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
    <div class="flex items-center gap-3">
      <span class="text-2xl">{typeInfo?.icon}</span>
      <div>
        <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(question.type || 'qcm')}`}>
          {typeInfo?.label}
        </span>
        {#if question.difficulty_weight}
          <span class="ml-2 text-xs text-gray-500">
            Difficulté: {question.difficulty_weight}/10
          </span>
        {/if}
        {#if question.points_total}
          <span class="ml-2 text-xs text-gray-500">
            {question.points_total} pts
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="p-6">
    <!-- Intro -->
    {#if translation.intro}
      <p class="text-sm text-gray-600 mb-4 italic">{translation.intro}</p>
    {/if}

    <!-- Question Title -->
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      {translation.title || 'Question sans titre'}
    </h3>

    <!-- Subtitle -->
    {#if translation.subtitle}
      <p class="text-sm text-gray-500 mb-4">{translation.subtitle}</p>
    {/if}

    <!-- Media -->
    {#if question.image_url || question.video_url || question.audio_url}
      <div class="mb-6 rounded-lg overflow-hidden bg-gray-100">
        {#if question.image_url}
          <img src={question.image_url} alt="Question media" class="w-full max-h-64 object-contain" />
        {:else if question.video_url}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video src={question.video_url} controls class="w-full max-h-64"></video>
        {:else if question.audio_url}
          <div class="p-4 flex items-center gap-3">
            <Music class="w-8 h-8 text-gray-400" />
            <audio src={question.audio_url} controls class="flex-1"></audio>
          </div>
        {/if}
      </div>
    {/if}

    <!-- QCM / QCM Multiple -->
    {#if question.type === 'qcm' || question.type === 'qcm_multiple'}
      <div class="space-y-2">
        {#each question.answers || [] as answer (answer.id)}
          <button
            type="button"
            onclick={() => toggleAnswer(answer.id)}
            disabled={!interactive}
            class="w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left"
            class:border-gray-200={!selectedAnswers.has(answer.id) && !(showCorrectAnswers && answer.is_correct)}
            class:border-indigo-500={selectedAnswers.has(answer.id)}
            class:bg-indigo-50={selectedAnswers.has(answer.id)}
            class:border-green-500={showCorrectAnswers && answer.is_correct && !interactive}
            class:bg-green-50={showCorrectAnswers && answer.is_correct && !interactive}
            class:hover:border-gray-300={interactive && !selectedAnswers.has(answer.id)}
          >
            <div class="flex-shrink-0">
              {#if question.type === 'qcm'}
                <Circle class="w-5 h-5 {selectedAnswers.has(answer.id) ? 'text-indigo-600' : 'text-gray-400'}" />
              {:else}
                <div class="w-5 h-5 border-2 rounded flex items-center justify-center"
                  class:border-indigo-600={selectedAnswers.has(answer.id)}
                  class:bg-indigo-600={selectedAnswers.has(answer.id)}
                  class:border-gray-400={!selectedAnswers.has(answer.id)}
                >
                  {#if selectedAnswers.has(answer.id)}
                    <CheckCircle class="w-4 h-4 text-white" />
                  {/if}
                </div>
              {/if}
            </div>
            <span class="flex-1 text-gray-900">{answer.text}</span>
            {#if showCorrectAnswers && answer.is_correct}
              <CheckCircle class="w-5 h-5 text-green-600" />
            {/if}
            {#if showCorrectAnswers && answer.points > 0}
              <span class="text-xs text-gray-500">{answer.points} pts</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Vrai / Faux -->
    {#if question.type === 'true_false'}
      <div class="grid grid-cols-2 gap-4">
        {#each question.answers || [] as answer (answer.id)}
          <button
            type="button"
            onclick={() => toggleAnswer(answer.id)}
            disabled={!interactive}
            class="p-6 rounded-xl border-2 transition-all text-center"
            class:border-gray-200={!selectedAnswers.has(answer.id) && !(showCorrectAnswers && answer.is_correct)}
            class:border-indigo-500={selectedAnswers.has(answer.id)}
            class:bg-indigo-50={selectedAnswers.has(answer.id)}
            class:border-green-500={showCorrectAnswers && answer.is_correct && !interactive}
            class:bg-green-50={showCorrectAnswers && answer.is_correct && !interactive}
          >
            <span class="text-3xl mb-2 block">{answer.text === 'Vrai' ? '✓' : '✗'}</span>
            <span class="font-semibold text-lg">{answer.text}</span>
          </button>
        {/each}
      </div>
      {#if question.require_justification}
        <div class="mt-4">
          <p class="text-sm text-gray-600 mb-2">Justifiez votre réponse :</p>
          <textarea
            bind:value={userTextAnswer}
            disabled={!interactive}
            placeholder="Votre justification..."
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>
      {/if}
    {/if}

    <!-- Question ouverte courte -->
    {#if question.type === 'open_short'}
      <div>
        <input
          type="text"
          bind:value={userTextAnswer}
          disabled={!interactive}
          placeholder="Votre réponse..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg"
        />
        {#if showCorrectAnswers && translation.expected_answer}
          <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-green-800">
              <strong>Réponse attendue :</strong> {translation.expected_answer}
            </p>
          </div>
        {/if}
        {#if showCorrectAnswers && translation.keywords?.length}
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="text-xs text-gray-500">Mots-clés :</span>
            {#each translation.keywords as keyword}
              <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">{keyword}</span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Question ouverte longue -->
    {#if question.type === 'open_long'}
      <div>
        <textarea
          bind:value={userTextAnswer}
          disabled={!interactive}
          placeholder="Développez votre réponse..."
          rows="6"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        ></textarea>
        <div class="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            {#if question.min_words}Min: {question.min_words} mots{/if}
            {#if question.min_words && question.max_words} • {/if}
            {#if question.max_words}Max: {question.max_words} mots{/if}
          </span>
          <span>{userTextAnswer.split(/\s+/).filter(w => w).length} mots</span>
        </div>
        {#if showCorrectAnswers && translation.answer_guidelines}
          <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-sm text-amber-800">
              <strong>Critères de notation :</strong> {translation.answer_guidelines}
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Analyse de média -->
    {#if question.type === 'media_analysis'}
      <div>
        {#if !question.image_url && !question.video_url && !question.audio_url}
          <div class="p-8 bg-gray-100 rounded-lg text-center">
            <Image class="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p class="text-gray-500">Média à analyser</p>
          </div>
        {/if}
        <div class="mt-4">
          <p class="text-sm text-gray-600 mb-2">Votre analyse :</p>
          <textarea
            bind:value={userTextAnswer}
            disabled={!interactive}
            placeholder="Décrivez et analysez ce média..."
            rows="5"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>
      </div>
    {/if}

    <!-- Repérage d'erreurs -->
    {#if question.type === 'error_spotting'}
      <div>
        {#if question.image_url}
          <div class="relative">
            <img src={question.image_url} alt="Erreurs à identifier" class="w-full rounded-lg" />
            {#if showCorrectAnswers && question.media_errors}
              {#each question.media_errors as error (error.id)}
                <div 
                  class="absolute w-8 h-8 -ml-4 -mt-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center cursor-pointer"
                  style="left: {error.x}%; top: {error.y}%"
                  title={error.description}
                >
                  <AlertTriangle class="w-4 h-4 text-white" />
                </div>
              {/each}
            {/if}
          </div>
        {:else}
          <div class="p-8 bg-gray-100 rounded-lg text-center">
            <AlertTriangle class="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p class="text-gray-500">Média avec erreurs à identifier</p>
          </div>
        {/if}
        <div class="mt-4">
          <p class="text-sm text-gray-600 mb-2">
            Identifiez les erreurs ({question.media_errors?.length || '?'} à trouver) :
          </p>
          <textarea
            bind:value={userTextAnswer}
            disabled={!interactive}
            placeholder="Listez les erreurs que vous avez repérées..."
            rows="4"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>
        {#if showCorrectAnswers && question.media_errors?.length}
          <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm font-semibold text-red-800 mb-2">Erreurs à trouver :</p>
            <ul class="text-sm text-red-700 space-y-1">
              {#each question.media_errors as error}
                <li>• {error.description}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Association -->
    {#if question.type === 'matching'}
      <div class="grid grid-cols-2 gap-8">
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700 mb-2">Éléments</p>
          {#each question.matching_pairs || [] as pair (pair.id)}
            <div class="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              {#if pair.left_image}
                <img src={pair.left_image} alt="" class="w-full h-16 object-cover rounded mb-2" />
              {/if}
              <span class="text-cyan-900">{pair.left}</span>
            </div>
          {/each}
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700 mb-2">Correspondances</p>
          {#each (question.matching_pairs || []).sort(() => Math.random() - 0.5) as pair (pair.id + '_right')}
            <div class="p-3 bg-gray-100 border border-gray-200 rounded-lg">
              {#if pair.right_image}
                <img src={pair.right_image} alt="" class="w-full h-16 object-cover rounded mb-2" />
              {/if}
              <span class="text-gray-900">{pair.right}</span>
            </div>
          {/each}
        </div>
      </div>
      {#if showCorrectAnswers}
        <div class="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <p class="text-sm font-semibold text-cyan-800 mb-2">Bonnes associations :</p>
          <ul class="text-sm text-cyan-700 space-y-1">
            {#each question.matching_pairs || [] as pair}
              <li class="flex items-center gap-2">
                <span>{pair.left}</span>
                <ArrowRight class="w-4 h-4" />
                <span class="font-medium">{pair.right}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}

    <!-- Classement -->
    {#if question.type === 'ordering'}
      <div class="space-y-2">
        <p class="text-sm text-gray-600 mb-3">Remettez ces éléments dans le bon ordre :</p>
        {#each (question.ordering_items || []).sort(() => Math.random() - 0.5) as item, index (item.id)}
          <div class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <GripVertical class="w-5 h-5 text-gray-400 cursor-move" />
            <span class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold">
              ?
            </span>
            {#if item.image_url}
              <img src={item.image_url} alt="" class="w-12 h-12 object-cover rounded" />
            {/if}
            <span class="flex-1 text-gray-900">{item.text}</span>
          </div>
        {/each}
      </div>
      {#if showCorrectAnswers}
        <div class="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <p class="text-sm font-semibold text-teal-800 mb-2">Ordre correct :</p>
          <ol class="text-sm text-teal-700 space-y-1 list-decimal list-inside">
            {#each (question.ordering_items || []).sort((a, b) => a.correct_position - b.correct_position) as item}
              <li>{item.text}</li>
            {/each}
          </ol>
        </div>
      {/if}
    {/if}

    <!-- Hint -->
    {#if translation.hint && !showCorrectAnswers}
      <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p class="text-sm text-amber-800">
          <strong>💡 Indice :</strong> {translation.hint}
        </p>
      </div>
    {/if}

    <!-- Explanation (after answer) -->
    {#if showCorrectAnswers && translation.explanation}
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>📖 Explication :</strong> {translation.explanation}
        </p>
      </div>
    {/if}
  </div>
</div>
