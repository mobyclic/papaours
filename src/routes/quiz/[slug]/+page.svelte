<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/stores/userStore';
  
  let quiz = $state<any>(null);
  let session = $state<any>(null);
  let totalQuestions = $state(0);
  let loading = $state(true);
  let loadingQuestion = $state(false);
  let error = $state('');
  let submitting = $state(false);

  let currentQuestionIndex = $state(0);
  let currentQuestion = $state<any>(null);
  let currentMetadata = $state<{ difficulty?: string; matiere?: string; themes?: string[]; classeId?: string } | null>(null);
  let selectedAnswer = $state<number | null>(null);
  let showExplanation = $state(false);
  let lastAnswerCorrect = $state(false);
  let lastExplanation = $state('');
  let lastCorrectAnswer = $state<number | null>(null);
  let score = $state(0);
  let isQuizFinished = $state(false);
  let resumed = $state(false);
  
  let progress = $derived(totalQuestions > 0 ? ((currentQuestionIndex) / totalQuestions) * 100 : 0);
  
  onMount(async () => {
    const slug = $page.params.slug;
    const sessionId = $page.url.searchParams.get('sessionId');
    
    // Si on a un sessionId dans l'URL, charger cette session directement
    if (sessionId) {
      await loadSession(sessionId);
    } else {
      // Sinon, rediriger vers le dashboard (pas d'accès direct)
      goto('/dashboard');
    }
  });
  
  async function loadSession(sessionId: string) {
    loading = true;
    
    try {
      // Récupérer la session existante
      const cleanSessionId = sessionId.includes(':') ? sessionId.split(':')[1] : sessionId;
      const response = await fetch(`/api/quiz/session/${cleanSessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        session = data.session;
        quiz = data.quiz;
        totalQuestions = session.totalQuestions || session.questionIds?.length || 0;
        currentQuestionIndex = session.answers?.length || 0;
        score = session.score || 0;
        resumed = session.answers?.length > 0;
        
        if (totalQuestions === 0) {
          error = 'Ce quiz ne contient pas de questions.';
        } else {
          // Charger la première question (ou celle en cours)
          await loadCurrentQuestion(cleanSessionId);
        }
      } else {
        error = 'Session non trouvée';
        setTimeout(() => goto('/dashboard'), 2000);
      }
    } catch (err) {
      console.error('Erreur chargement session:', err);
      error = 'Erreur de chargement';
    } finally {
      loading = false;
    }
  }
  
  async function loadCurrentQuestion(sessionId?: string) {
    loadingQuestion = true;
    try {
      const cleanSessionId = sessionId || (session?.id?.includes(':') ? session.id.split(':')[1] : session?.id);
      const response = await fetch(`/api/quiz/session/${cleanSessionId}/question/${currentQuestionIndex}`);
      
      if (response.ok) {
        const data = await response.json();
        currentQuestion = data.question;
        currentMetadata = data.metadata || null;
        
        // Si la question a déjà été répondue, afficher l'explication
        if (data.alreadyAnswered && data.previousAnswer) {
          selectedAnswer = data.previousAnswer.selectedAnswer;
          lastCorrectAnswer = data.previousAnswer.correctAnswer;
          showExplanation = true;
          lastAnswerCorrect = data.previousAnswer.isCorrect;
        }
      } else {
        console.error('Erreur chargement question');
      }
    } catch (err) {
      console.error('Erreur chargement question:', err);
    } finally {
      loadingQuestion = false;
    }
  }
  
  function selectAnswer(index: number) {
    if (showExplanation || submitting) return;
    selectedAnswer = index;
  }
  
  async function validateAnswer() {
    if (selectedAnswer === null || !session || submitting) return;
    
    submitting = true;
    
    try {
      const sessionId = session.id.split(':')[1] || session.id;
      const response = await fetch(`/api/quiz/session/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          selectedAnswer
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        showExplanation = true;
        lastAnswerCorrect = data.isCorrect;
        lastExplanation = data.explanation;
        lastCorrectAnswer = data.correctAnswer;
        score = data.score;
        session = data.session;
        
        if (data.isCompleted) {
          // Quiz terminé
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erreur lors de la validation');
      }
    } catch (err) {
      console.error('Erreur validation:', err);
      alert('Erreur de connexion');
    } finally {
      submitting = false;
    }
  }
  
  async function nextQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
      currentQuestionIndex++;
      selectedAnswer = null;
      showExplanation = false;
      lastAnswerCorrect = false;
      lastExplanation = '';
      lastCorrectAnswer = null;
      currentQuestion = null;
      // Charger la question suivante
      await loadCurrentQuestion();
    } else {
      isQuizFinished = true;
    }
  }
  
  async function restartQuiz() {
    // Abandonner l'ancienne session si elle existe
    if (session) {
      try {
        const sessionId = session.id.split(':')[1] || session.id;
        await fetch(`/api/quiz/session/${sessionId}`, { method: 'DELETE' });
      } catch (e) { /* ignore */ }
    }
    
    // Créer une nouvelle session et rediriger
    const slug = $page.params.slug;
    try {
      const response = await fetch(`/api/quiz/${slug}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: $currentUser?.id || `anonymous_${Date.now()}`,
          classeId: $currentUser?.classe_id || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Recharger avec la nouvelle session
        window.location.href = `/quiz/${slug}?sessionId=${data.session.id}`;
      }
    } catch (e) {
      console.error('Erreur restart:', e);
    }
  }
  
  function goHome() {
    goto('/dashboard');
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
            <span>Quitter</span>
          </button>
          <div class="text-right">
            <div class="text-sm text-gray-600">Question {currentQuestionIndex + 1} / {totalQuestions}</div>
            <div class="text-lg font-bold text-purple-600">Score: {score}</div>
          </div>
        </div>
        
        {#if resumed}
          <div class="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            📌 Tu reprends ta session en cours
          </div>
        {/if}
        
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
          <!-- Métadonnées de la question -->
          {#if currentMetadata}
            <div class="flex flex-wrap gap-2 mb-4 text-sm">
              {#if currentMetadata.matiere}
                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  📚 {currentMetadata.matiere}
                </span>
              {/if}
              {#if currentMetadata.difficulty}
                <span class="px-3 py-1 rounded-full font-medium {
                  currentMetadata.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  currentMetadata.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }">
                  {currentMetadata.difficulty === 'easy' ? '⭐ Facile' :
                   currentMetadata.difficulty === 'medium' ? '⭐⭐ Moyen' :
                   '⭐⭐⭐ Difficile'}
                </span>
              {/if}
              {#if currentMetadata.themes && currentMetadata.themes.length > 0}
                {#each currentMetadata.themes as theme}
                  <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    🏷️ {theme}
                  </span>
                {/each}
              {/if}
            </div>
          {/if}
          
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          <!-- Options - QCM Image (grille d'images) -->
          {#if currentQuestion.questionType === 'qcm_image' && currentQuestion.optionImages?.length > 0}
            <div class="grid grid-cols-2 gap-4 mb-6">
              {#each currentQuestion.optionImages as imageUrl, index}
                <button
                  onclick={() => selectAnswer(index)}
                  disabled={showExplanation || submitting}
                  class="relative rounded-xl border-4 transition-all overflow-hidden aspect-square
                    {selectedAnswer === index 
                      ? (showExplanation
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 ring-4 ring-green-200'
                          : 'border-red-500 ring-4 ring-red-200')
                        : 'border-purple-500 ring-4 ring-purple-200')
                      : (showExplanation && index === lastCorrectAnswer
                        ? 'border-green-500 ring-4 ring-green-200'
                        : 'border-gray-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100')}
                    {showExplanation || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}"
                >
                  <img 
                    src={imageUrl} 
                    alt="Option {index + 1}"
                    class="w-full h-full object-cover"
                  />
                  <!-- Indicateur de sélection -->
                  <div class="absolute top-2 right-2 w-8 h-8 rounded-full border-2 flex items-center justify-center
                    {selectedAnswer === index
                      ? (showExplanation
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-500'
                          : 'border-red-500 bg-red-500')
                        : 'border-purple-500 bg-purple-500')
                      : (showExplanation && index === lastCorrectAnswer
                        ? 'border-green-500 bg-green-500'
                        : 'border-white bg-white/80')}">
                    {#if showExplanation}
                      {#if index === lastCorrectAnswer}
                        <span class="text-white text-lg">✓</span>
                      {:else if selectedAnswer === index}
                        <span class="text-white text-lg">✗</span>
                      {/if}
                    {:else if selectedAnswer === index}
                      <span class="text-white text-lg">●</span>
                    {/if}
                  </div>
                  <!-- Label optionnel -->
                  {#if currentQuestion.options?.[index]}
                    <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm py-2 px-3 text-center">
                      {currentQuestion.options[index]}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {:else}
            <!-- Options - QCM classique (texte) -->
            <div class="space-y-3 mb-6">
              {#each currentQuestion.options as option, index}
                <button
                  onclick={() => selectAnswer(index)}
                  disabled={showExplanation || submitting}
                  class="w-full p-4 text-left rounded-xl border-2 transition-all
                    {selectedAnswer === index 
                      ? (showExplanation
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50')
                        : 'border-purple-500 bg-purple-50')
                      : (showExplanation && index === lastCorrectAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50')}
                    {showExplanation || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}"
                >
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3
                      {selectedAnswer === index
                        ? (showExplanation
                          ? (index === lastCorrectAnswer
                            ? 'border-green-500 bg-green-500'
                            : 'border-red-500 bg-red-500')
                          : 'border-purple-500 bg-purple-500')
                        : (showExplanation && index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300')}">
                      {#if showExplanation}
                        {#if index === lastCorrectAnswer}
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
          {/if}

          <!-- Explanation -->
          {#if showExplanation}
            <div class="p-4 rounded-xl {lastAnswerCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'} mb-6">
              <div class="flex items-start gap-3">
                <div class="text-2xl">
                  {lastAnswerCorrect ? '🎉' : '💡'}
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-lg mb-2">
                    {lastAnswerCorrect ? 'Bravo !' : 'Pas tout à fait...'}
                  </h3>
                  <p class="text-gray-700">{lastExplanation || 'Pas d\'explication disponible.'}</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex gap-3">
            {#if !showExplanation}
              <button
                onclick={validateAnswer}
                disabled={selectedAnswer === null || submitting}
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {submitting ? 'Validation...' : 'Valider'}
              </button>
            {:else}
              <button
                onclick={nextQuestion}
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                {currentQuestionIndex < totalQuestions - 1 ? 'Question suivante →' : 'Voir mes résultats'}
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
          {score === totalQuestions ? '🏆' : score >= totalQuestions * 0.7 ? '🎉' : score >= totalQuestions * 0.5 ? '👍' : '💪'}
        </div>
        
        <h2 class="text-4xl font-bold text-gray-800 mb-4">
          Quiz terminé !
        </h2>
        
        <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
          {score} / {totalQuestions}
        </div>
        
        <p class="text-xl text-gray-600 mb-8">
          {score === totalQuestions 
            ? 'Parfait ! Tu es un expert !' 
            : score >= totalQuestions * 0.7 
            ? 'Très bon score ! Continue comme ça !' 
            : score >= totalQuestions * 0.5 
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
            🏠 Mon espace
          </button>
        </div>
      </div>
    </div>
  {/if}
</main>
