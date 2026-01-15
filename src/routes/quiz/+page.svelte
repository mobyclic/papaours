<script lang="ts">
  import { quizQuestions, type Question } from '$lib/quizData';
  import { goto } from '$app/navigation';
  
  let currentQuestionIndex = $state(0);
  let selectedAnswer = $state<number | null>(null);
  let showExplanation = $state(false);
  let score = $state(0);
  let isQuizFinished = $state(false);
  let answeredQuestions = $state(new Set<number>());
  
  $effect(() => {
    currentQuestion = quizQuestions[currentQuestionIndex];
  });
  
  let currentQuestion = $derived(quizQuestions[currentQuestionIndex]);
  let progress = $derived((currentQuestionIndex / quizQuestions.length) * 100);
  
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
    
    answeredQuestions.add(currentQuestion.id);
  }
  
  function nextQuestion() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
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
    answeredQuestions = new Set();
  }
  
  function backToHome() {
    goto('/');
  }
  
  function getFamilyColor(family: string) {
    const colors: Record<string, string> = {
      cordes: 'from-purple-500 to-purple-600',
      bois: 'from-amber-500 to-amber-600',
      cuivres: 'from-yellow-500 to-yellow-600',
      percussions: 'from-red-500 to-red-600',
      general: 'from-indigo-500 to-indigo-600'
    };
    return colors[family] || 'from-gray-500 to-gray-600';
  }
  
  function getFamilyEmoji(family: string) {
    const emojis: Record<string, string> = {
      cordes: '🎻',
      bois: '🎷',
      cuivres: '🎺',
      percussions: '🥁',
      general: '🎵'
    };
    return emojis[family] || '🎵';
  }
</script>

<svelte:head>
  <title>Papa Ours - Quiz Musical</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 py-8">
  {#if !isQuizFinished}
    <div class="max-w-3xl mx-auto">
      <!-- En-tête avec progression -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <button
            onclick={backToHome}
            class="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Accueil
          </button>
          <span class="text-sm font-medium text-gray-600">
            Question {currentQuestionIndex + 1} / {quizQuestions.length}
          </span>
        </div>
        
        <!-- Barre de progression -->
        <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style="width: {progress}%"
          ></div>
        </div>
      </div>

      <!-- Card de la question -->
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-200 overflow-hidden">
        <!-- Badge de famille -->
        <div class="px-6 pt-6">
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r {getFamilyColor(currentQuestion.family)}">
            {getFamilyEmoji(currentQuestion.family)}
            {currentQuestion.family.charAt(0).toUpperCase() + currentQuestion.family.slice(1)}
          </span>
        </div>

        <div class="p-6">
          <!-- Question -->
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          <!-- Image si disponible -->
          {#if currentQuestion.image}
            <div class="mb-6 flex justify-center">
              <div class="relative">
                <img
                  src={currentQuestion.image}
                  alt={currentQuestion.imageCaption || 'Illustration'}
                  class="rounded-xl shadow-lg max-h-64 object-contain"
                />
                {#if currentQuestion.imageCaption}
                  <p class="text-sm text-gray-600 text-center mt-2 italic">
                    {currentQuestion.imageCaption}
                  </p>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Options de réponse -->
          <div class="space-y-3 mb-6">
            {#each currentQuestion.options as option, index}
              <button
                onclick={() => selectAnswer(index)}
                disabled={showExplanation}
                class="w-full p-4 text-left rounded-xl border-2 transition-all
                  {selectedAnswer === index
                    ? showExplanation
                      ? index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-purple-500 bg-purple-50'
                    : showExplanation && index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                  }
                  {showExplanation ? 'cursor-default' : 'cursor-pointer'}
                "
              >
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                    {selectedAnswer === index
                      ? showExplanation
                        ? index === currentQuestion.correctAnswer
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-purple-500 text-white'
                      : showExplanation && index === currentQuestion.correctAnswer
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }
                  ">
                    {showExplanation && index === currentQuestion.correctAnswer
                      ? '✓'
                      : showExplanation && selectedAnswer === index && index !== currentQuestion.correctAnswer
                        ? '✗'
                        : String.fromCharCode(65 + index)
                    }
                  </div>
                  <span class="text-gray-800 font-medium">{option}</span>
                </div>
              </button>
            {/each}
          </div>

          <!-- Explication -->
          {#if showExplanation}
            <div class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-6">
              <h3 class="font-bold text-blue-900 mb-2">
                {selectedAnswer === currentQuestion.correctAnswer ? '🎉 Bravo !' : '📚 Explication'}
              </h3>
              <p class="text-gray-700">{currentQuestion.explanation}</p>
            </div>
          {/if}

          <!-- Boutons d'action -->
          <div class="flex gap-3">
            {#if !showExplanation}
              <button
                onclick={validateAnswer}
                disabled={selectedAnswer === null}
                class="flex-1 h-12 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold 
                  hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Valider
              </button>
            {:else}
              <button
                onclick={nextQuestion}
                class="flex-1 h-12 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold 
                  hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Question suivante →' : 'Voir les résultats 🎯'}
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Score actuel -->
      <div class="mt-6 text-center">
        <p class="text-gray-600 font-medium">
          Score actuel : <span class="text-purple-600 font-bold text-xl">{score}</span> / {answeredQuestions.size}
        </p>
      </div>
    </div>
  {:else}
    <!-- Écran de résultats -->
    <div class="max-w-2xl mx-auto">
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-200 p-8">
        <div class="text-center">
          <div class="text-8xl mb-6">
            {score === quizQuestions.length ? '🏆' : score >= quizQuestions.length * 0.7 ? '🎉' : score >= quizQuestions.length * 0.5 ? '👍' : '📚'}
          </div>
          
          <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            Quiz terminé !
          </h2>
          
          <div class="my-8">
            <div class="text-6xl font-bold text-purple-600 mb-2">
              {score} / {quizQuestions.length}
            </div>
            <p class="text-xl text-gray-600">
              {score === quizQuestions.length
                ? 'Parfait ! Tu es un vrai expert ! 🌟'
                : score >= quizQuestions.length * 0.7
                  ? 'Excellent travail ! 🎵'
                  : score >= quizQuestions.length * 0.5
                    ? 'Bien joué ! Continue comme ça ! 🎼'
                    : 'Continue à apprendre, tu vas progresser ! 🎹'
              }
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onclick={restartQuiz}
              class="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold 
                hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              🔄 Recommencer le quiz
            </button>
            <button
              onclick={backToHome}
              class="px-8 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-bold 
                hover:bg-purple-50 transition-all"
            >
              🏠 Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>
