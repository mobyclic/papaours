<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let quiz = $state<any>(null);
  let questions = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  let currentQuestionIndex = $state(0);
  let selectedAnswer = $state<number | null>(null);
  let showExplanation = $state(false);
  let score = $state(0);
  let isQuizFinished = $state(false);
  
  let currentQuestion = $derived(questions[currentQuestionIndex]);
  let progress = $derived((currentQuestionIndex / questions.length) * 100);
  
  onMount(async () => {
    const slug = $page.params.slug;
    
    try {
      const response = await fetch(`/api/quiz/${slug}`);
      if (response.ok) {
        const data = await response.json();
        quiz = data.quiz;
        questions = data.questions;
        
        if (questions.length === 0) {
          error = 'Ce quiz ne contient pas encore de questions.';
        }
      } else {
        error = 'Quiz non trouvé';
      }
    } catch (err) {
      console.error('Erreur chargement quiz:', err);
      error = 'Erreur de chargement';
    } finally {
      loading = false;
    }
  });
  
  function selectAnswer(index: number) {
    if (showExplanation) return;
    selectedAnswer = index;
  }
  
  function validateAnswer() {
    if (selectedAnswer === null) return;
    
    showExplanation = true;
    
    if (selectedAnswer === currentQuestion.correctAnswer) {
      score++;
    }
  }
  
  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      selectedAnswer = null;
      showExplanation = false;
    } else {
      isQuizFinished = true;
    }
  }
  
  function restartQuiz() {
    currentQuestionIndex = 0;
    selectedAnswer = null;
    showExplanation = false;
    score = 0;
    isQuizFinished = false;
  }
  
  function goHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>{quiz?.title || 'Quiz'} - Papa Ours</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p class="text-xl text-gray-600">Chargement du quiz...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div class="text-6xl mb-4">😕</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Oups !</h2>
        <p class="text-gray-600 mb-6">{error}</p>
        <button
          onclick={goHome}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  {:else if !isQuizFinished && currentQuestion}
    <div class="max-w-4xl mx-auto py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <button
            onclick={goHome}
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span class="text-2xl">←</span>
            <span>Retour</span>
          </button>
          <div class="text-right">
            <div class="text-sm text-gray-600">Question {currentQuestionIndex + 1} / {questions.length}</div>
            <div class="text-lg font-bold text-purple-600">Score: {score}</div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
            style="width: {progress}%"
          ></div>
        </div>
      </div>

      <!-- Question Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-purple-200">
        <!-- Image -->
        {#if currentQuestion.imageUrl}
          <div class="bg-gradient-to-br from-purple-100 to-pink-100 p-8 flex justify-center items-center">
            <div class="max-w-md">
              <img 
                src={currentQuestion.imageUrl} 
                alt={currentQuestion.imageCaption || currentQuestion.question}
                class="rounded-lg shadow-lg w-full h-auto"
              />
              {#if currentQuestion.imageCaption}
                <p class="text-center text-sm text-gray-600 mt-3 italic">{currentQuestion.imageCaption}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Question -->
        <div class="p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          <!-- Options -->
          <div class="space-y-3 mb-6">
            {#each currentQuestion.options as option, index}
              <button
                onclick={() => selectAnswer(index)}
                disabled={showExplanation}
                class="w-full p-4 text-left rounded-xl border-2 transition-all
                  {selectedAnswer === index 
                    ? (showExplanation
                      ? (index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50')
                      : 'border-purple-500 bg-purple-50')
                    : (showExplanation && index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50')}
                  {showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}"
              >
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3
                    {selectedAnswer === index
                      ? (showExplanation
                        ? (index === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-500'
                          : 'border-red-500 bg-red-500')
                        : 'border-purple-500 bg-purple-500')
                      : (showExplanation && index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300')}">
                    {#if showExplanation}
                      {#if index === currentQuestion.correctAnswer}
                        <span class="text-white text-lg">✓</span>
                      {:else if selectedAnswer === index}
                        <span class="text-white text-lg">✗</span>
                      {/if}
                    {/if}
                  </div>
                  <span class="font-medium">{option}</span>
                </div>
              </button>
            {/each}
          </div>

          <!-- Explanation -->
          {#if showExplanation}
            <div class="p-4 rounded-xl {selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'} mb-6">
              <div class="flex items-start gap-3">
                <div class="text-2xl">
                  {selectedAnswer === currentQuestion.correctAnswer ? '🎉' : '💡'}
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-lg mb-2">
                    {selectedAnswer === currentQuestion.correctAnswer ? 'Bravo !' : 'Pas tout à fait...'}
                  </h3>
                  <p class="text-gray-700">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex gap-3">
            {#if !showExplanation}
              <button
                onclick={validateAnswer}
                disabled={selectedAnswer === null}
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                Valider
              </button>
            {:else}
              <button
                onclick={nextQuestion}
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Question suivante →' : 'Voir mes résultats'}
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else if isQuizFinished}
    <!-- Results Screen -->
    <div class="max-w-2xl mx-auto py-16">
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center border border-purple-200">
        <div class="text-8xl mb-6">
          {score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '🎉' : score >= questions.length * 0.5 ? '👍' : '💪'}
        </div>
        
        <h2 class="text-4xl font-bold text-gray-800 mb-4">
          Quiz terminé !
        </h2>
        
        <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
          {score} / {questions.length}
        </div>
        
        <p class="text-xl text-gray-600 mb-8">
          {score === questions.length 
            ? 'Parfait ! Tu es un expert !' 
            : score >= questions.length * 0.7 
            ? 'Très bon score ! Continue comme ça !' 
            : score >= questions.length * 0.5 
            ? 'Pas mal ! Tu peux encore progresser !'
            : 'Continue à apprendre, tu vas y arriver !'}
        </p>
        
        <div class="flex gap-4 justify-center">
          <button
            onclick={restartQuiz}
            class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            🔄 Recommencer
          </button>
          
          <button
            onclick={goHome}
            class="px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all"
          >
            🏠 Accueil
          </button>
        </div>
      </div>
    </div>
  {/if}
</main>
