<script lang="ts">
  import { goto } from '$app/navigation';
  import ShareButton from '$lib/components/ShareButton.svelte';
  
  interface Answer {
    questionIndex: number;
    questionId: string;
    selectedAnswer: number | null;
    correctAnswer: number;
    isCorrect: boolean;
    explanation?: string;
    skipped?: boolean;
  }
  
  interface QuestionData {
    question: string;
    options: string[];
    imageUrl?: string;
    optionImages?: string[];
    questionType?: string;
  }
  
  interface Props {
    score: number;
    totalQuestions: number;
    answers: Answer[];
    questions: QuestionData[];
    quizTitle: string;
    quizSlug: string;
    onRestart: () => void;
  }
  
  let { score, totalQuestions, answers, questions, quizTitle, quizSlug, onRestart }: Props = $props();
  
  let percentage = $derived(Math.round((score / totalQuestions) * 100));
  
  // Afficher ou masquer les détails
  let showDetails = $state(true);
  
  // Stats
  let correctCount = $derived(answers.filter(a => a.isCorrect).length);
  let incorrectCount = $derived(answers.filter(a => !a.isCorrect && !a.skipped).length);
  let skippedCount = $derived(answers.filter(a => a.skipped).length);
  
  function goHome() {
    goto('/dashboard');
  }
  
  function getResultEmoji() {
    if (percentage === 100) return '🏆';
    if (percentage >= 80) return '🎉';
    if (percentage >= 60) return '⭐';
    if (percentage >= 40) return '👍';
    return '💪';
  }
  
  function getResultMessage() {
    if (percentage === 100) return 'Score parfait ! Tu es incroyable !';
    if (percentage >= 80) return 'Excellent ! Tu maîtrises bien ce sujet !';
    if (percentage >= 60) return 'Bien joué ! Continue comme ça !';
    if (percentage >= 40) return 'C\'est un bon début ! Revois les questions manquées.';
    return 'Ne te décourage pas ! La pratique fait le maître !';
  }
</script>

<div class="max-w-4xl mx-auto py-8">
  <!-- Score Card -->
  <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border border-purple-200 mb-8">
    <div class="text-7xl mb-4">{getResultEmoji()}</div>
    
    <h2 class="text-3xl font-bold text-gray-800 mb-2">
      Épreuve terminée !
    </h2>
    
    <p class="text-gray-600 mb-6">{quizTitle}</p>
    
    <!-- Score Display -->
    <div class="inline-block bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
      <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
        {score} / {totalQuestions}
      </div>
      <div class="text-2xl text-gray-600 mt-2">{percentage}%</div>
    </div>
    
    <p class="text-xl text-gray-700 mb-8">{getResultMessage()}</p>
    
    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-green-50 rounded-xl p-4">
        <div class="text-3xl font-bold text-green-600">{correctCount}</div>
        <div class="text-sm text-green-700">Correct{correctCount > 1 ? 'es' : 'e'}</div>
      </div>
      <div class="bg-red-50 rounded-xl p-4">
        <div class="text-3xl font-bold text-red-600">{incorrectCount}</div>
        <div class="text-sm text-red-700">Incorrect{incorrectCount > 1 ? 'es' : 'e'}</div>
      </div>
      <div class="bg-gray-50 rounded-xl p-4">
        <div class="text-3xl font-bold text-gray-600">{skippedCount}</div>
        <div class="text-sm text-gray-700">Non répondue{skippedCount > 1 ? 's' : ''}</div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-4 justify-center flex-wrap">
      <button
        onclick={onRestart}
        class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
      >
        🔄 Recommencer
      </button>
      
      <ShareButton 
        {score}
        {totalQuestions}
        quizName={quizTitle}
        url={typeof window !== 'undefined' ? `${window.location.origin}/quiz/${quizSlug}` : ''}
      />
      
      <button
        onclick={goHome}
        class="px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all"
      >
        🏠 Mon espace
      </button>
    </div>
  </div>
  
  <!-- Toggle Details -->
  <div class="flex justify-center mb-4">
    <button
      onclick={() => showDetails = !showDetails}
      class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
    >
      <span>{showDetails ? '▼' : '▶'}</span>
      <span class="font-medium">{showDetails ? 'Masquer' : 'Voir'} les corrections</span>
    </button>
  </div>
  
  <!-- Detailed Corrections -->
  {#if showDetails}
    <div class="space-y-4">
      {#each answers as answer, index}
        {@const question = questions[answer.questionIndex]}
        <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 
          {answer.isCorrect ? 'border-green-200' : answer.skipped ? 'border-gray-200' : 'border-red-200'}">
          
          <!-- Header -->
          <div class="px-6 py-3 flex items-center justify-between
            {answer.isCorrect ? 'bg-green-50' : answer.skipped ? 'bg-gray-50' : 'bg-red-50'}">
            <span class="font-semibold text-gray-700">Question {index + 1}</span>
            <span class="px-3 py-1 rounded-full text-sm font-medium
              {answer.isCorrect 
                ? 'bg-green-100 text-green-700' 
                : answer.skipped 
                ? 'bg-gray-100 text-gray-700' 
                : 'bg-red-100 text-red-700'}">
              {answer.isCorrect ? '✓ Correct' : answer.skipped ? '— Non répondue' : '✗ Incorrect'}
            </span>
          </div>
          
          <!-- Content -->
          <div class="p-6">
            <!-- Question Image -->
            {#if question?.imageUrl}
              <div class="mb-4 flex justify-center">
                <img 
                  src={question.imageUrl} 
                  alt="Question" 
                  class="max-h-40 rounded-lg"
                />
              </div>
            {/if}
            
            <!-- Question Text -->
            <p class="text-lg font-medium text-gray-800 mb-4">{question?.question}</p>
            
            <!-- Options -->
            {#if question?.questionType === 'qcm_image' && question?.optionImages?.length}
              <div class="grid grid-cols-2 gap-3">
                {#each question.optionImages as imageUrl, optIndex}
                  <div class="relative rounded-lg overflow-hidden border-2
                    {optIndex === answer.correctAnswer 
                      ? 'border-green-500 ring-2 ring-green-200' 
                      : answer.selectedAnswer === optIndex && !answer.isCorrect
                      ? 'border-red-500 ring-2 ring-red-200'
                      : 'border-gray-200'}">
                    <img src={imageUrl} alt="Option {optIndex + 1}" class="w-full h-24 object-cover" />
                    {#if optIndex === answer.correctAnswer}
                      <div class="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                    {:else if answer.selectedAnswer === optIndex}
                      <div class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✗</div>
                    {/if}
                    {#if question.options?.[optIndex]}
                      <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">{question.options[optIndex]}</div>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <div class="space-y-2">
                {#each question?.options || [] as option, optIndex}
                  <div class="p-3 rounded-lg flex items-center gap-3
                    {optIndex === answer.correctAnswer 
                      ? 'bg-green-100 border-2 border-green-300' 
                      : answer.selectedAnswer === optIndex && !answer.isCorrect
                      ? 'bg-red-100 border-2 border-red-300'
                      : 'bg-gray-50 border border-gray-200'}">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-sm
                      {optIndex === answer.correctAnswer 
                        ? 'bg-green-500 text-white' 
                        : answer.selectedAnswer === optIndex && !answer.isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-600'}">
                      {#if optIndex === answer.correctAnswer}
                        ✓
                      {:else if answer.selectedAnswer === optIndex}
                        ✗
                      {:else}
                        {String.fromCharCode(65 + optIndex)}
                      {/if}
                    </div>
                    <span class="flex-1">{option}</span>
                    {#if answer.selectedAnswer === optIndex && !answer.isCorrect}
                      <span class="text-xs text-red-600">Ta réponse</span>
                    {:else if optIndex === answer.correctAnswer}
                      <span class="text-xs text-green-600">Bonne réponse</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
            
            <!-- Explanation -->
            {#if answer.explanation}
              <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start gap-2">
                  <span class="text-xl">💡</span>
                  <div>
                    <div class="font-semibold text-blue-800 mb-1">Explication</div>
                    <p class="text-blue-700 text-sm">{answer.explanation}</p>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
