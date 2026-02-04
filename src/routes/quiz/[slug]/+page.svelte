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
  let currentMetadata = $state<{ difficulty?: string; subject?: string; themes?: string[]; classeId?: string } | null>(null);
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
  let lastCorrectAnswer = $state<number | number[] | Record<string, string> | null>(null);
  let lastAiEvaluation = $state<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    correctedAnswer?: string;
  } | null>(null);
  
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
    lastAiEvaluation = null;
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
        lastAiEvaluation = data.aiEvaluation || null;
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
  <title>{quiz?.title || 'Quiz'} - Kweez</title>
</svelte:head>

<!-- Focus Mode: Dark theme, minimal distractions -->
<main class="min-h-screen bg-gray-950 text-white">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mx-auto mb-4"></div>
        <p class="text-xl text-gray-400">Chargement du quiz...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-md text-center">
        <div class="text-6xl mb-4">😕</div>
        <h2 class="text-2xl font-bold text-white mb-4">Oups !</h2>
        <p class="text-gray-400 mb-6">{error}</p>
        <button
          onclick={goHome}
          class="px-6 py-3 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  {:else if !isQuizFinished && currentQuestion}
    <!-- Quiz Header - Minimal -->
    <header class="fixed top-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Quitter -->
        <button
          onclick={goHome}
          class="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          <span class="hidden sm:inline">Quitter</span>
        </button>
        
        <!-- Centre: Progress -->
        <div class="flex-1 max-w-xs mx-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 font-medium">{currentQuestionIndex + 1}/{totalQuestions}</span>
            <div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style="width: {progress}%"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Droite: Timer / Score -->
        <div class="flex items-center gap-3">
          {#if timeLimit}
            <QuizTimer 
              bind:this={timerComponent}
              initialSeconds={session.timeRemaining || timeLimit}
              onTimeUp={handleTimeUp}
              paused={timerPaused}
            />
          {/if}
          {#if !isEpreuveMode}
            <div class="px-3 py-1 bg-amber-500/20 rounded-full">
              <span class="text-amber-400 font-semibold">{score} pts</span>
            </div>
          {/if}
        </div>
      </div>
    </header>
    
    <!-- Quiz Content -->
    <div class="pt-20 pb-32 px-4">
      <div class="max-w-3xl mx-auto">
        
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
        <div class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden relative">
          <!-- Loading overlay -->
          {#if loadingQuestion}
            <div class="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          {/if}
          
          <!-- Image -->
          {#if currentQuestion.imageUrl}
            <div class="bg-gray-800/50 p-6 flex justify-center items-center">
              <div class="max-w-md">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt={currentQuestion.imageCaption || currentQuestion.question}
                  class="rounded-xl w-full h-auto"
                />
                {#if currentQuestion.imageCaption}
                  <p class="text-center text-sm text-gray-500 mt-3 italic">{currentQuestion.imageCaption}</p>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Question Text -->
          <div class="p-6 sm:p-8">
            <!-- Métadonnées discrètes -->
            {#if currentMetadata && (currentMetadata.subject || currentMetadata.difficulty)}
              <div class="flex flex-wrap gap-2 mb-4 text-xs">
                {#if currentMetadata.subject}
                  <span class="px-2 py-1 bg-gray-800 text-gray-400 rounded-full">
                    {currentMetadata.subject}
                  </span>
                {/if}
                {#if currentMetadata.difficulty}
                  <span class="px-2 py-1 rounded-full {
                    currentMetadata.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    currentMetadata.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }">
                    {currentMetadata.difficulty === 'easy' ? 'Facile' :
                     currentMetadata.difficulty === 'medium' ? 'Moyen' :
                     'Difficile'}
                  </span>
                {/if}
              </div>
            {/if}
            
            <h2 class="text-xl sm:text-2xl font-bold text-white mb-6 leading-relaxed">
              {currentQuestion.question}
            </h2>

          <!-- Explanation between question and answers (Mode révision uniquement) -->
          {#if showExplanation && !isEpreuveMode}
            <div class="p-4 rounded-xl {lastAnswerCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'} mb-6">
              <div class="flex items-start gap-3">
                <div class="text-2xl">
                  {lastAnswerCorrect ? '🎉' : '💡'}
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-lg mb-2 {lastAnswerCorrect ? 'text-green-400' : 'text-amber-400'}">
                    {lastAnswerCorrect ? 'Bravo !' : 'Pas tout à fait...'}
                  </h3>
                  <p class="text-gray-300">{lastExplanation || 'Pas d\'explication disponible.'}</p>
                </div>
              </div>
            </div>
          {/if}

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
                correctAnswers={showExplanation && lastCorrectAnswer ? (Array.isArray(lastCorrectAnswer) ? lastCorrectAnswer : [lastCorrectAnswer]) : (currentQuestion.answers?.map((a: any, i: number) => a.is_correct ? i : -1).filter((i: number) => i >= 0) || [])}
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
                correctMatches={showExplanation && lastCorrectAnswer && typeof lastCorrectAnswer === 'object' && !Array.isArray(lastCorrectAnswer) ? lastCorrectAnswer as Record<string, string> : (currentQuestion.correctMatches || {})}
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
                correctOrder={showExplanation && lastCorrectAnswer ? (Array.isArray(lastCorrectAnswer) ? lastCorrectAnswer : []) : (currentQuestion.correctOrder || [])}
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
                evaluation={lastAiEvaluation ? { mode: 'ai', ...lastAiEvaluation } : null}
                metadata={currentQuestion.metadata}
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
                  class="relative rounded-xl border-2 transition-all overflow-hidden aspect-square
                    {selectedAnswer === index 
                      ? (showExplanation && !isEpreuveMode
                        ? (index === lastCorrectAnswer
                          ? 'border-green-500 ring-2 ring-green-500/30'
                          : 'border-red-500 ring-2 ring-red-500/30')
                        : 'border-amber-500 ring-2 ring-amber-500/30')
                      : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                        ? 'border-green-500 ring-2 ring-green-500/30'
                        : 'border-gray-700 hover:border-amber-500/50')}
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
                        : 'border-amber-500 bg-amber-500')
                      : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-600 bg-gray-800/80')}">
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
                    <div class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm py-2 px-3 text-center">
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
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-red-500 bg-red-500/10')
                        : 'border-amber-500 bg-amber-500/10')
                      : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 hover:border-amber-500/50 hover:bg-gray-800')}
                    {(showExplanation && !isEpreuveMode) || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}"
                >
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3
                      {selectedAnswer === index
                        ? (showExplanation && !isEpreuveMode
                          ? (index === lastCorrectAnswer
                            ? 'border-green-500 bg-green-500'
                            : 'border-red-500 bg-red-500')
                          : 'border-amber-500 bg-amber-500')
                        : (showExplanation && !isEpreuveMode && index === lastCorrectAnswer
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-600')}">
                      {#if showExplanation && !isEpreuveMode}
                        {#if index === lastCorrectAnswer}
                          <span class="text-white text-lg">✓</span>
                        {:else if selectedAnswer === index}
                          <span class="text-white text-lg">✗</span>
                        {/if}
                      {:else if selectedAnswer === index}
                        <span class="text-gray-900 text-sm">●</span>
                      {/if}
                    </div>
                    <span class="font-medium text-white">{option}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          </div>
        </div>
      </div>
    </div>
    
    <!-- Fixed Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-4 z-40">
      <div class="max-w-3xl mx-auto flex gap-3">
        {#if isEpreuveMode}
          <!-- Mode Épreuve: Navigation et Submit -->
          <button
            onclick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            class="px-5 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédente
          </button>
          
          {#if currentQuestionIndex < totalQuestions - 1}
            <button
              onclick={nextQuestion}
              class="flex-1 px-5 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Suivante →
            </button>
          {/if}
          
          <button
            onclick={submitEpreuve}
            disabled={submitting}
            class="px-6 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Soumission...' : '✓ Terminer'}
          </button>
        {:else}
          <!-- Mode Révision: Valider puis Suivant -->
          {#if !showExplanation}
            <button
              onclick={validateAnswer}
              disabled={!hasAnswer() || submitting}
              class="flex-1 px-6 py-4 bg-amber-500 text-gray-900 rounded-xl font-bold hover:bg-amber-400 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Validation...' : 'Valider ma réponse'}
            </button>
          {:else}
            <button
              onclick={nextQuestion}
              class="flex-1 px-6 py-4 bg-amber-500 text-gray-900 rounded-xl font-bold hover:bg-amber-400 transition-colors"
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Question suivante →' : 'Voir mes résultats'}
            </button>
          {/if}
        {/if}
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
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-8 sm:p-12 text-center max-w-md w-full">
          <div class="text-7xl mb-6">
            {score === totalQuestions ? '🏆' : score >= totalQuestions * 0.7 ? '🎉' : score >= totalQuestions * 0.5 ? '👍' : '💪'}
          </div>
          
          <h2 class="text-3xl font-bold text-white mb-4">
            Quiz terminé !
          </h2>
          
          <div class="text-5xl font-bold text-amber-400 mb-4">
            {score} / {totalQuestions}
          </div>
          
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden mb-6">
            <div 
              class="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
              style="width: {(score / totalQuestions) * 100}%"
            ></div>
          </div>
          
          <p class="text-lg text-gray-400 mb-8">
            {score === totalQuestions 
              ? 'Parfait ! Tu es un expert !' 
              : score >= totalQuestions * 0.7 
              ? 'Très bon score ! Continue comme ça !' 
              : score >= totalQuestions * 0.5 
              ? 'Pas mal ! Tu peux encore progresser !'
              : 'Continue à apprendre, tu vas y arriver !'}
          </p>
          
          <div class="flex flex-col gap-3">
            <button
              onclick={restartQuiz}
              class="w-full px-6 py-4 bg-amber-500 text-gray-900 rounded-xl font-bold hover:bg-amber-400 transition-colors"
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
              class="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              ← Retour au tableau de bord
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
