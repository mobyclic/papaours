<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/stores/userStore.svelte';
  import QuizTimer from '$lib/components/quiz/QuizTimer.svelte';
  import QuestionNavigator from '$lib/components/quiz/QuestionNavigator.svelte';
  import EpreuveResults from '$lib/components/quiz/EpreuveResults.svelte';
  import { BadgeNotification } from '$lib/components/badges';
  import ShareButton from '$lib/components/ShareButton.svelte';
  
  // Composants de types de questions
  import { QcmMultiple, TrueFalse, FillBlank, Matching, Ordering, OpenAnswer } from '$lib/components/quiz/question-types';
  
  // === STATE ===
  let quiz = $state<any>(null);
  let session = $state<any>(null);
  let totalQuestions = $state(0);
  let loading = $state(true);
  let loadingQuestion = $state(false);
  let error = $state('');
  let submitting = $state(false);

  // Question state
  let currentQuestionIndex = $state(0);
  let currentQuestion = $state<any>(null);
  let currentMetadata = $state<{ difficulty?: string; matiere?: string; themes?: string[]; classeId?: string } | null>(null);
  let selectedAnswer = $state<number | null>(null);
  
  // Réponses multi-types
  let selectedAnswers = $state<number[]>([]); // QCM Multiple
  let trueFalseAnswer = $state<boolean | null>(null);
  let trueFalseJustification = $state('');
  let fillBlankAnswers = $state<string[]>([]);
  let matchingAnswers = $state<Record<string, string>>({});
  let orderingAnswer = $state<string[]>([]);
  let openTextAnswer = $state('');
  
  // Mode révision state
  let showExplanation = $state(false);
  let lastAnswerCorrect = $state(false);
  let lastExplanation = $state('');
  let lastCorrectAnswer = $state<number | null>(null);
  
  // Common state
  let score = $state(0);
  let isQuizFinished = $state(false);
  let resumed = $state(false);
  
  // Mode épreuve state
  let savedAnswers = $state<Record<number, number>>({});
  let allQuestionsData = $state<any[]>([]);
  let epreuveResults = $state<any>(null);
  
  // Badges gagnés
  let earnedBadges = $state<any[]>([]);
  let showBadgeNotification = $state(false);
  
  // Timer
  let timerComponent = $state<QuizTimer | null>(null);
  let timerPaused = $state(false);
  
  // === DERIVED ===
  let mode = $derived(session?.mode || 'revision');
  let timeLimit = $derived(session?.timeLimit || null);
  let isEpreuveMode = $derived(mode === 'epreuve');
  let progress = $derived(totalQuestions > 0 ? ((currentQuestionIndex) / totalQuestions) * 100 : 0);
  let answeredQuestions = $derived(new Set(Object.keys(savedAnswers).map(Number)));
  let answeredCount = $derived(isEpreuveMode ? Object.keys(savedAnswers).length : (session?.answers?.length || 0));
  
  // === LIFECYCLE ===
  onMount(async () => {
    const slug = $page.params.slug;
    const sessionId = $page.url.searchParams.get('sessionId');
    
    if (sessionId) {
      await loadSession(sessionId);
    } else {
      goto('/dashboard');
    }
  });
  
  // === FUNCTIONS ===
  async function loadSession(sessionId: string) {
    loading = true;
    
    try {
      const cleanSessionId = sessionId.includes(':') ? sessionId.split(':')[1] : sessionId;
      const response = await fetch(`/api/quiz/session/${cleanSessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        session = data.session;
        quiz = data.quiz;
        totalQuestions = session.totalQuestions || session.questionIds?.length || 0;
        score = session.score || 0;
        resumed = session.answers?.length > 0;
        
        // Restaurer les réponses sauvegardées (mode épreuve)
        if (session.savedAnswers) {
          savedAnswers = { ...session.savedAnswers };
        }
        
        // En mode révision avec des réponses existantes, continuer où on s'est arrêté
        if (session.mode !== 'epreuve' && session.answers?.length > 0) {
          currentQuestionIndex = session.answers.length;
        }
        
        if (totalQuestions === 0) {
          error = 'Ce quiz ne contient pas de questions.';
        } else {
          await loadCurrentQuestion(cleanSessionId);
          
          // En mode épreuve, précharger toutes les questions pour les résultats
          if (session.mode === 'epreuve') {
            await preloadAllQuestions(cleanSessionId);
          }
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
  
  async function preloadAllQuestions(sessionId: string) {
    try {
      const questions: any[] = [];
      for (let i = 0; i < totalQuestions; i++) {
        const response = await fetch(`/api/quiz/session/${sessionId}/question/${i}`);
        if (response.ok) {
          const data = await response.json();
          questions.push(data.question);
        }
      }
      allQuestionsData = questions;
    } catch (err) {
      console.error('Erreur préchargement questions:', err);
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
        
        // Restaurer la réponse sélectionnée si elle existe
        if (isEpreuveMode && savedAnswers[currentQuestionIndex] !== undefined) {
          selectedAnswer = savedAnswers[currentQuestionIndex];
        } else {
          selectedAnswer = null;
        }
        
        // En mode révision, si la question a déjà été répondue, afficher l'explication
        if (!isEpreuveMode && data.alreadyAnswered && data.previousAnswer) {
          selectedAnswer = data.previousAnswer.selectedAnswer;
          lastCorrectAnswer = data.previousAnswer.correctAnswer;
          showExplanation = true;
          lastAnswerCorrect = data.previousAnswer.isCorrect;
        } else {
          showExplanation = false;
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
    if (submitting) return;
    // En mode révision, on ne peut pas changer après validation
    if (!isEpreuveMode && showExplanation) return;
    
    selectedAnswer = index;
    
    // En mode épreuve, sauvegarder automatiquement
    if (isEpreuveMode) {
      saveAnswerForEpreuve(index);
    }
  }
  
  // Réinitialisation des réponses pour une nouvelle question
  function resetAnswerState() {
    selectedAnswer = null;
    selectedAnswers = [];
    trueFalseAnswer = null;
    trueFalseJustification = '';
    fillBlankAnswers = [];
    matchingAnswers = {};
    orderingAnswer = [];
    openTextAnswer = '';
    showExplanation = false;
    lastAnswerCorrect = false;
    lastExplanation = '';
    lastCorrectAnswer = null;
  }
  
  // Obtenir la réponse actuelle selon le type de question
  function getCurrentAnswer(): any {
    const type = currentQuestion?.questionType || 'qcm';
    switch (type) {
      case 'qcm':
      case 'qcm_image':
        return selectedAnswer;
      case 'qcm_multiple':
        return selectedAnswers;
      case 'true_false':
        return { answer: trueFalseAnswer, justification: trueFalseJustification };
      case 'fill_blank':
        return fillBlankAnswers;
      case 'matching':
        return matchingAnswers;
      case 'ordering':
        return orderingAnswer;
      case 'open_short':
      case 'open_long':
        return openTextAnswer;
      default:
        return selectedAnswer;
    }
  }
  
  // Vérifier si une réponse a été donnée
  function hasAnswer(): boolean {
    const type = currentQuestion?.questionType || 'qcm';
    switch (type) {
      case 'qcm':
      case 'qcm_image':
        return selectedAnswer !== null;
      case 'qcm_multiple':
        return selectedAnswers.length > 0;
      case 'true_false':
        return trueFalseAnswer !== null;
      case 'fill_blank':
        return fillBlankAnswers.some(a => a.trim() !== '');
      case 'matching':
        return Object.keys(matchingAnswers).length > 0;
      case 'ordering':
        return orderingAnswer.length > 0;
      case 'open_short':
      case 'open_long':
        return openTextAnswer.trim() !== '';
      default:
        return selectedAnswer !== null;
    }
  }
  
  async function saveAnswerForEpreuve(answer: number) {
    try {
      const sessionId = session.id.split(':')[1] || session.id;
      const response = await fetch(`/api/quiz/session/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          questionIndex: currentQuestionIndex,
          selectedAnswer: answer
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        savedAnswers = data.savedAnswers;
      }
    } catch (err) {
      console.error('Erreur sauvegarde réponse:', err);
    }
  }
  
  // === MODE RÉVISION ===
  async function validateAnswer() {
    if (!hasAnswer() || !session || submitting) return;
    
    submitting = true;
    
    try {
      const sessionId = session.id.split(':')[1] || session.id;
      const response = await fetch(`/api/quiz/session/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          questionType: currentQuestion?.questionType || 'qcm',
          answer: getCurrentAnswer()
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
          // Quiz terminé - gérer les badges gagnés
          if (data.earnedBadges && data.earnedBadges.length > 0) {
            earnedBadges = data.earnedBadges;
            showBadgeNotification = true;
          }
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
      resetAnswerState();
      currentQuestion = null;
      await loadCurrentQuestion();
    } else {
      isQuizFinished = true;
    }
  }
  
  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      loadCurrentQuestion();
    }
  }
  
  // === MODE ÉPREUVE ===
  function navigateToQuestion(index: number) {
    currentQuestionIndex = index;
    loadCurrentQuestion();
  }
  
  async function submitEpreuve() {
    const unanswered = totalQuestions - Object.keys(savedAnswers).length;
    
    if (unanswered > 0) {
      const confirmSubmit = window.confirm(
        `Tu n'as pas répondu à ${unanswered} question${unanswered > 1 ? 's' : ''}. Veux-tu vraiment soumettre ?`
      );
      if (!confirmSubmit) return;
    }
    
    submitting = true;
    timerPaused = true;
    
    try {
      const sessionId = session.id.split(':')[1] || session.id;
      const response = await fetch(`/api/quiz/session/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' })
      });
      
      if (response.ok) {
        const data = await response.json();
        epreuveResults = data;
        score = data.score;
        isQuizFinished = true;
        
        // Gérer les badges gagnés
        if (data.earnedBadges && data.earnedBadges.length > 0) {
          earnedBadges = data.earnedBadges;
          showBadgeNotification = true;
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erreur lors de la soumission');
      }
    } catch (err) {
      console.error('Erreur soumission:', err);
      alert('Erreur de connexion');
    } finally {
      submitting = false;
    }
  }
  
  function handleTimeUp() {
    // Auto-submit en mode épreuve quand le temps est écoulé
    if (isEpreuveMode && !isQuizFinished) {
      alert('⏰ Temps écoulé ! Tes réponses vont être soumises.');
      submitEpreuve();
    } else if (!isEpreuveMode && !isQuizFinished) {
      alert('⏰ Temps écoulé ! Tu peux quand même continuer à répondre.');
    }
  }
  
  // === COMMON ===
  async function restartQuiz() {
    if (session) {
      try {
        const sessionId = session.id.split(':')[1] || session.id;
        await fetch(`/api/quiz/session/${sessionId}`, { method: 'DELETE' });
      } catch (e) { /* ignore */ }
    }
    
    goto('/dashboard');
  }
  
  function goHome() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>{quiz?.title || 'Quiz'} - Kwizy</title>
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
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <button
            onclick={goHome}
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span class="text-2xl">←</span>
            <span>Quitter</span>
          </button>
          
          <div class="flex items-center gap-4">
            <!-- Timer -->
            {#if timeLimit}
              <QuizTimer 
                bind:this={timerComponent}
                initialSeconds={session.timeRemaining || timeLimit}
                onTimeUp={handleTimeUp}
                paused={timerPaused}
              />
            {/if}
            
            <!-- Mode Badge -->
            <span class="px-3 py-1 rounded-full text-sm font-medium
              {isEpreuveMode ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
              {isEpreuveMode ? '🏆 Épreuve' : '📖 Révision'}
            </span>
          </div>
          
          <div class="text-right">
            <div class="text-sm text-gray-600">Question {currentQuestionIndex + 1} / {totalQuestions}</div>
            {#if !isEpreuveMode}
              <div class="text-lg font-bold text-purple-600">Score: {score}</div>
            {:else}
              <div class="text-sm text-gray-500">{answeredCount} répondue{answeredCount > 1 ? 's' : ''}</div>
            {/if}
          </div>
        </div>
        
        {#if resumed && !isEpreuveMode}
          <div class="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            📌 Tu reprends ta session en cours
          </div>
        {/if}
        
        <!-- Progress bar -->
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="h-full transition-all duration-500
              {isEpreuveMode ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}"
            style="width: {progress}%"
          ></div>
        </div>
      </div>
      
      <!-- Question Navigator (Mode Épreuve) -->
      {#if isEpreuveMode}
        <div class="mb-6">
          <QuestionNavigator
            {totalQuestions}
            currentIndex={currentQuestionIndex}
            answeredQuestions={answeredQuestions}
            onNavigate={navigateToQuestion}
          />
        </div>
      {/if}

      <!-- Question Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-purple-200 relative">
        <!-- Loading overlay -->
        {#if loadingQuestion}
          <div class="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        {/if}
        
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
          <!-- Métadonnées -->
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

          <!-- Question Display by Type -->
          {#if currentQuestion.questionType === 'qcm_multiple'}
            <!-- QCM Multiple: plusieurs réponses possibles -->
            <div class="mb-6">
              <QcmMultiple
                options={currentQuestion.options}
                optionImages={currentQuestion.optionImages}
                selectedAnswers={selectedAnswers}
                disabled={(showExplanation && !isEpreuveMode) || submitting}
                showResult={showExplanation && !isEpreuveMode}
                correctAnswers={currentQuestion.answers?.map((a: any, i: number) => a.is_correct ? i : -1).filter((i: number) => i >= 0) || []}
                onSelect={(answers) => {
                  selectedAnswers = answers;
                  if (isEpreuveMode) saveAnswerForEpreuve(answers as any);
                }}
              />
            </div>
          {:else if currentQuestion.questionType === 'true_false'}
            <!-- Vrai/Faux -->
            <div class="mb-6">
              <TrueFalse
                selectedAnswer={trueFalseAnswer}
                justification={trueFalseJustification}
                requireJustification={currentQuestion.requireJustification || false}
                disabled={(showExplanation && !isEpreuveMode) || submitting}
                showResult={showExplanation && !isEpreuveMode}
                correctAnswer={currentQuestion.correctAnswer}
                correctJustification={currentQuestion.explanation}
                onSelect={(answer) => {
                  trueFalseAnswer = answer;
                  if (isEpreuveMode) saveAnswerForEpreuve(answer as any);
                }}
                onJustificationChange={(text) => trueFalseJustification = text}
              />
            </div>
          {:else if currentQuestion.questionType === 'fill_blank'}
            <!-- Question à trous -->
            <div class="mb-6">
              <FillBlank
                textWithBlanks={currentQuestion.textWithBlanks || currentQuestion.question}
                answers={fillBlankAnswers}
                disabled={(showExplanation && !isEpreuveMode) || submitting}
                showResult={showExplanation && !isEpreuveMode}
                correctAnswers={currentQuestion.correctAnswers || []}
                caseSensitive={currentQuestion.caseSensitive || false}
                onAnswerChange={(answers) => {
                  fillBlankAnswers = answers;
                  if (isEpreuveMode) saveAnswerForEpreuve(answers as any);
                }}
              />
            </div>
          {:else if currentQuestion.questionType === 'matching'}
            <!-- Association -->
            <div class="mb-6">
              <Matching
                leftItems={currentQuestion.leftItems || []}
                rightItems={currentQuestion.rightItems || []}
                matches={matchingAnswers}
                disabled={(showExplanation && !isEpreuveMode) || submitting}
                showResult={showExplanation && !isEpreuveMode}
                correctMatches={currentQuestion.correctMatches || {}}
                onMatchChange={(matches) => {
                  matchingAnswers = matches;
                  if (isEpreuveMode) saveAnswerForEpreuve(matches as any);
                }}
              />
            </div>
          {:else if currentQuestion.questionType === 'ordering'}
            <!-- Classement -->
            <div class="mb-6">
              <Ordering
                items={currentQuestion.items || []}
                currentOrder={orderingAnswer.length > 0 ? orderingAnswer : (currentQuestion.shuffledOrder || currentQuestion.items?.map((i: any) => i.id) || [])}
                disabled={(showExplanation && !isEpreuveMode) || submitting}
                showResult={showExplanation && !isEpreuveMode}
                correctOrder={currentQuestion.correctOrder || []}
                onOrderChange={(order) => {
                  orderingAnswer = order;
                  if (isEpreuveMode) saveAnswerForEpreuve(order as any);
                }}
              />
            </div>
          {:else if currentQuestion.questionType === 'open_short' || currentQuestion.questionType === 'open_long'}
            <!-- Question ouverte -->
            <div class="mb-6">
              <OpenAnswer
                type={currentQuestion.questionType === 'open_short' ? 'short' : 'long'}
                answer={openTextAnswer}
                placeholder={currentQuestion.placeholder || 'Tape ta réponse ici...'}
                minLength={currentQuestion.minLength || 0}
                maxLength={currentQuestion.maxLength || 0}
                minWords={currentQuestion.minWords || 0}
                maxWords={currentQuestion.maxWords || 0}
                disabled={(showExplanation && !isEpreuveMode) || submitting}
                showResult={showExplanation && !isEpreuveMode}
                sampleAnswers={currentQuestion.sampleAnswers || []}
                expectedKeywords={currentQuestion.expectedKeywords || []}
                onAnswerChange={(answer) => {
                  openTextAnswer = answer;
                  // Pas de sauvegarde auto pour open en épreuve (trop de traffic)
                }}
              />
            </div>
          {:else if currentQuestion.questionType === 'qcm_image' && currentQuestion.optionImages?.length > 0}
            <!-- Options - QCM Image -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              {#each currentQuestion.optionImages as imageUrl, index}
                <button
                  onclick={() => selectAnswer(index)}
                  disabled={(showExplanation && !isEpreuveMode) || submitting}
                  class="relative rounded-xl border-4 transition-all overflow-hidden aspect-square
                    {selectedAnswer === index 
                      ? (showExplanation && !isEpreuveMode
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 ring-4 ring-green-200'
                          : 'border-red-500 ring-4 ring-red-200')
                        : 'border-purple-500 ring-4 ring-purple-200')
                      : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                        ? 'border-green-500 ring-4 ring-green-200'
                        : 'border-gray-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100')}
                    {(showExplanation && !isEpreuveMode) || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}"
                >
                  <img 
                    src={imageUrl} 
                    alt="Option {index + 1}"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute top-2 right-2 w-8 h-8 rounded-full border-2 flex items-center justify-center
                    {selectedAnswer === index
                      ? (showExplanation && !isEpreuveMode
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-500'
                          : 'border-red-500 bg-red-500')
                        : 'border-purple-500 bg-purple-500')
                      : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                        ? 'border-green-500 bg-green-500'
                        : 'border-white bg-white/80')}">
                    {#if showExplanation && !isEpreuveMode}
                      {#if index === lastCorrectAnswer}
                        <span class="text-white text-lg">✓</span>
                      {:else if selectedAnswer === index}
                        <span class="text-white text-lg">✗</span>
                      {/if}
                    {:else if selectedAnswer === index}
                      <span class="text-white text-lg">●</span>
                    {/if}
                  </div>
                  {#if currentQuestion.options?.[index]}
                    <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm py-2 px-3 text-center">
                      {currentQuestion.options[index]}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {:else}
            <!-- Options - QCM classique -->
            <div class="space-y-3 mb-6">
              {#each currentQuestion.options as option, index}
                <button
                  onclick={() => selectAnswer(index)}
                  disabled={(showExplanation && !isEpreuveMode) || submitting}
                  class="w-full p-4 text-left rounded-xl border-2 transition-all
                    {selectedAnswer === index 
                      ? (showExplanation && !isEpreuveMode
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50')
                        : 'border-purple-500 bg-purple-50')
                      : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50')}
                    {(showExplanation && !isEpreuveMode) || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}"
                >
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3
                      {selectedAnswer === index
                        ? (showExplanation && !isEpreuveMode
                          ? (index === lastCorrectAnswer
                            ? 'border-green-500 bg-green-500'
                            : 'border-red-500 bg-red-500')
                          : 'border-purple-500 bg-purple-500')
                        : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300')}">
                      {#if showExplanation && !isEpreuveMode}
                        {#if index === lastCorrectAnswer}
                          <span class="text-white text-lg">✓</span>
                        {:else if selectedAnswer === index}
                          <span class="text-white text-lg">✗</span>
                        {/if}
                      {:else if selectedAnswer === index}
                        <span class="text-white text-sm">●</span>
                      {/if}
                    </div>
                    <span class="font-medium">{option}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          <!-- Explanation (Mode révision uniquement) -->
          {#if showExplanation && !isEpreuveMode}
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
            {#if isEpreuveMode}
              <!-- Mode Épreuve: Navigation et Submit -->
              <button
                onclick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Précédente
              </button>
              
              {#if currentQuestionIndex < totalQuestions - 1}
                <button
                  onclick={nextQuestion}
                  class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                >
                  Suivante →
                </button>
              {/if}
              
              <button
                onclick={submitEpreuve}
                disabled={submitting}
                class="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Soumission...' : '✓ Terminer l\'épreuve'}
              </button>
            {:else}
              <!-- Mode Révision: Valider puis Suivant -->
              {#if !showExplanation}
                <button
                  onclick={validateAnswer}
                  disabled={!hasAnswer() || submitting}
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
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else if isQuizFinished}
    <!-- Results -->
    {#if isEpreuveMode && epreuveResults}
      <EpreuveResults
        {score}
        {totalQuestions}
        answers={epreuveResults.answers}
        questions={allQuestionsData}
        quizTitle={quiz?.title || 'Quiz'}
        quizSlug={quiz?.slug || ''}
        onRestart={restartQuiz}
      />
    {:else}
      <!-- Mode Révision Results -->
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
          
          <div class="flex gap-4 justify-center flex-wrap">
            <button
              onclick={restartQuiz}
              class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              🔄 Recommencer
            </button>
            
            <ShareButton 
              {score}
              {totalQuestions}
              quizName={quiz?.title}
              url={typeof window !== 'undefined' ? `${window.location.origin}/quiz/${quiz?.slug}` : ''}
            />
            
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
  {/if}
</main>

<!-- Badge Notification Modal -->
{#if showBadgeNotification && earnedBadges.length > 0}
  <BadgeNotification 
    badges={earnedBadges}
    onClose={() => showBadgeNotification = false}
  />
{/if}
