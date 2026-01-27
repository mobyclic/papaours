<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser, logoutUser } from '$lib/stores/userStore';
  import { goto } from '$app/navigation';

  let quizzes = $state<any[]>([]);
  let userResults = $state<any[]>([]);
  let activeSessions = $state<any[]>([]); // Sessions en cours
  let loading = $state(true);
  let greeting = $state('');
  
  // Modal state
  let showQuizModal = $state(false);
  let selectedQuiz = $state<any>(null);
  let startingQuiz = $state(false);

  // Stats calculées
  let totalQuizzesDone = $derived(userResults.length);
  let averageScore = $derived(() => {
    if (userResults.length === 0) return 0;
    const total = userResults.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0);
    return Math.round(total / userResults.length);
  });
  let bestScore = $derived(() => {
    if (userResults.length === 0) return 0;
    return Math.max(...userResults.map(r => Math.round((r.score / r.totalQuestions) * 100)));
  });

  // Quiz en cours (non terminés à 100%)
  let quizzesInProgress = $derived(() => {
    const completedQuizIds = new Set(
      userResults
        .filter(r => r.score === r.totalQuestions)
        .map(r => r.quizId)
    );
    return quizzes.filter(q => {
      const hasStarted = userResults.some(r => r.quizId === q.id);
      const notPerfect = !completedQuizIds.has(q.id);
      return hasStarted && notPerfect;
    });
  });

  // Quiz pas encore essayés
  let newQuizzes = $derived(() => {
    const triedQuizIds = new Set(userResults.map(r => r.quizId));
    return quizzes.filter(q => !triedQuizIds.has(q.id));
  });

  // Quiz maîtrisés (100%)
  let masteredQuizzes = $derived(() => {
    const perfectQuizIds = new Set(
      userResults
        .filter(r => r.score === r.totalQuestions)
        .map(r => r.quizId)
    );
    return quizzes.filter(q => perfectQuizIds.has(q.id));
  });

  onMount(async () => {
    loadUser();
    
    // Petit délai pour laisser le store se mettre à jour
    await new Promise(r => setTimeout(r, 50));
    
    if (!$currentUser) {
      goto('/');
      return;
    }

    // Message de bienvenue selon l'heure
    const hour = new Date().getHours();
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';

    const uid = $currentUser.id;
    await Promise.all([loadQuizzes(), loadResults(uid), loadActiveSessions(uid)]);
    loading = false;
  });

  async function loadQuizzes() {
    try {
      const res = await fetch('/api/quiz/list');
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes || [];
      }
    } catch (e) {
      console.error('Erreur chargement des quiz', e);
    }
  }

  async function loadResults(userId: string) {
    try {
      const res = await fetch(`/api/user/results?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        userResults = data.results || [];
      }
    } catch (e) {
      console.error('Erreur chargement des résultats', e);
    }
  }
  
  async function loadActiveSessions(userId: string) {
    try {
      const res = await fetch(`/api/user/sessions?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        activeSessions = data.sessions || [];
      }
    } catch (e) {
      console.error('Erreur chargement des sessions', e);
    }
  }

  function playQuiz(slug: string) {
    // Trouver le quiz et ouvrir la modal
    const quiz = quizzes.find(q => q.slug === slug);
    if (quiz) {
      selectedQuiz = quiz;
      showQuizModal = true;
    }
  }
  
  function closeQuizModal() {
    showQuizModal = false;
    selectedQuiz = null;
  }
  
  async function confirmStartQuiz() {
    if (!selectedQuiz || startingQuiz) return;
    
    startingQuiz = true;
    
    try {
      // Créer la session
      const response = await fetch(`/api/quiz/${selectedQuiz.slug}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: $currentUser?.id || `anonymous_${Date.now()}`,
          classeId: $currentUser?.classe_id || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Rediriger vers le quiz avec la session déjà créée
        goto(`/quiz/${selectedQuiz.slug}?sessionId=${data.session.id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erreur lors du démarrage du quiz');
      }
    } catch (err) {
      console.error('Erreur démarrage quiz:', err);
      alert('Erreur de connexion');
    } finally {
      startingQuiz = false;
    }
  }
  
  function resumeSession(session: any) {
    // Reprendre une session en cours
    const quiz = quizzes.find(q => q.id === session.quizId || `quiz:${q.id?.split(':')[1]}` === session.quizId);
    goto(`/quiz/${quiz?.slug || 'unknown'}?sessionId=${session.id}`);
  }

  function handleLogout() {
    logoutUser();
    goto('/');
  }

  function getQuizEmoji(theme: string) {
    const emojis: Record<string, string> = {
      'Musique': '🎵',
      'Instruments': '🎸',
      'Sciences': '🔬',
      'Nature': '🌿',
      'Histoire': '📜',
      'Géographie': '🌍',
      'Mathématiques': '🔢',
      'Français': '📚',
      'Sport': '⚽',
      'Art': '🎨',
      'Animaux': '🐾',
      'Espace': '🚀',
    };
    return emojis[theme] || '🎯';
  }

  function getScoreColor(score: number, total: number) {
    const percent = (score / total) * 100;
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  }

  function getScoreEmoji(score: number, total: number) {
    const percent = (score / total) * 100;
    if (percent === 100) return '🏆';
    if (percent >= 80) return '⭐';
    if (percent >= 50) return '👍';
    return '💪';
  }
</script>

<svelte:head>
  <title>Mon Espace - Papa Ours</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-bounce text-6xl mb-4">🐻</div>
        <p class="text-xl text-purple-600 font-medium">Chargement de ton espace...</p>
      </div>
    </div>
  {:else}
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🐻</span>
          <span class="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Papa Ours
          </span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600 hidden sm:block">
            Connecté en tant que <strong class="text-purple-600">{$currentUser?.name || $currentUser?.email}</strong>
          </span>
          <button 
            onclick={handleLogout}
            class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Welcome Section -->
      <section class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          {greeting}, <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{$currentUser?.name?.split(' ')[0] || 'Champion'}</span> ! 👋
        </h1>
        <p class="text-gray-600 text-lg">Prêt à apprendre en t'amusant aujourd'hui ?</p>
      </section>

      <!-- Stats Cards -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-2xl shadow-lg p-4 border border-purple-100 text-center transform hover:scale-105 transition-transform">
          <div class="text-3xl mb-2">🎮</div>
          <div class="text-2xl font-bold text-purple-600">{totalQuizzesDone}</div>
          <div class="text-sm text-gray-600">Quiz joués</div>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-4 border border-pink-100 text-center transform hover:scale-105 transition-transform">
          <div class="text-3xl mb-2">📊</div>
          <div class="text-2xl font-bold text-pink-600">{averageScore()}%</div>
          <div class="text-sm text-gray-600">Score moyen</div>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-4 border border-green-100 text-center transform hover:scale-105 transition-transform">
          <div class="text-3xl mb-2">🏆</div>
          <div class="text-2xl font-bold text-green-600">{bestScore()}%</div>
          <div class="text-sm text-gray-600">Meilleur score</div>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-4 border border-yellow-100 text-center transform hover:scale-105 transition-transform">
          <div class="text-3xl mb-2">⭐</div>
          <div class="text-2xl font-bold text-yellow-600">{masteredQuizzes().length}</div>
          <div class="text-sm text-gray-600">Quiz maîtrisés</div>
        </div>
      </section>

      <!-- Active Sessions - Quiz à reprendre -->
      {#if activeSessions.length > 0}
        <section class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">⏸️</span>
            <h2 class="text-xl font-bold text-gray-800">Reprends où tu t'es arrêté</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each activeSessions as session}
              {@const quiz = quizzes.find(q => q.id === session.quizId || `quiz:${q.id?.split(':')[1]}` === session.quizId)}
              <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-5 border-2 border-blue-200 hover:border-blue-400 transition-all transform hover:scale-102">
                <div class="flex items-start justify-between mb-3">
                  <span class="text-3xl">{getQuizEmoji(quiz?.theme || 'Musique')}</span>
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    En pause
                  </span>
                </div>
                <h3 class="font-bold text-lg text-gray-800 mb-1">{quiz?.title || 'Quiz'}</h3>
                <p class="text-sm text-gray-600 mb-2">
                  Progression: <span class="font-bold text-blue-600">{session.progress}/{session.totalQuestions}</span> questions
                </p>
                <div class="w-full bg-blue-100 rounded-full h-2 mb-3">
                  <div 
                    class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style="width: {Math.round((session.progress / session.totalQuestions) * 100)}%"
                  ></div>
                </div>
                <button 
                  onclick={() => resumeSession(session)}
                  class="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Reprendre ▶️
                </button>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Continue Learning Section -->
      {#if quizzesInProgress().length > 0}
        <section class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🚀</span>
            <h2 class="text-xl font-bold text-gray-800">Continue ton apprentissage</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each quizzesInProgress() as quiz}
              {@const lastResult = userResults.filter(r => r.quizId === quiz.id).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]}
              <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-lg p-5 border-2 border-orange-200 hover:border-orange-400 transition-all transform hover:scale-102">
                <div class="flex items-start justify-between mb-3">
                  <span class="text-3xl">{getQuizEmoji(quiz.theme || 'Musique')}</span>
                  <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    En cours
                  </span>
                </div>
                <h3 class="font-bold text-lg text-gray-800 mb-1">{quiz.title}</h3>
                {#if lastResult}
                  <p class="text-sm text-gray-600 mb-3">
                    Dernier score: <span class="{getScoreColor(lastResult.score, lastResult.totalQuestions)} font-bold">{lastResult.score}/{lastResult.totalQuestions}</span>
                    {getScoreEmoji(lastResult.score, lastResult.totalQuestions)}
                  </p>
                {/if}
                <button 
                  onclick={() => playQuiz(quiz.slug)}
                  class="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all"
                >
                  Continuer 🎯
                </button>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- New Quizzes Section -->
      {#if newQuizzes().length > 0}
        <section class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">✨</span>
            <h2 class="text-xl font-bold text-gray-800">Découvre de nouveaux quiz</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each newQuizzes() as quiz}
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-5 border-2 border-purple-200 hover:border-purple-400 transition-all transform hover:scale-102">
                <div class="flex items-start justify-between mb-3">
                  <span class="text-3xl">{getQuizEmoji(quiz.theme || 'Musique')}</span>
                  <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    Nouveau !
                  </span>
                </div>
                <h3 class="font-bold text-lg text-gray-800 mb-1">{quiz.title}</h3>
                {#if quiz.description}
                  <p class="text-sm text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                {:else}
                  <p class="text-sm text-gray-600 mb-3">Niveau {quiz.level || 1}</p>
                {/if}
                <button 
                  onclick={() => playQuiz(quiz.slug)}
                  class="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Commencer 🚀
                </button>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Mastered Quizzes Section -->
      {#if masteredQuizzes().length > 0}
        <section class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🏆</span>
            <h2 class="text-xl font-bold text-gray-800">Tes quiz maîtrisés</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each masteredQuizzes() as quiz}
              <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-5 border-2 border-green-200 hover:border-green-400 transition-all transform hover:scale-102">
                <div class="flex items-start justify-between mb-3">
                  <span class="text-3xl">{getQuizEmoji(quiz.theme || 'Musique')}</span>
                  <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <span>🏆</span> Maîtrisé
                  </span>
                </div>
                <h3 class="font-bold text-lg text-gray-800 mb-1">{quiz.title}</h3>
                <p class="text-sm text-green-600 font-medium mb-3">Score parfait ! 100% ⭐</p>
                <button 
                  onclick={() => playQuiz(quiz.slug)}
                  class="w-full py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  Rejouer 🔄
                </button>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- All Quizzes Section -->
      <section class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">📚</span>
          <h2 class="text-xl font-bold text-gray-800">Tous les quiz</h2>
        </div>
        
        {#if quizzes.length === 0}
          <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div class="text-5xl mb-4">📭</div>
            <p class="text-gray-600">Aucun quiz disponible pour le moment.</p>
            <p class="text-sm text-gray-500 mt-2">Reviens bientôt, de nouveaux quiz arrivent !</p>
          </div>
        {:else}
          <!-- Group by theme -->
          {#each Array.from(new Set(quizzes.map(q => q.theme || 'Musique'))) as theme}
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>{getQuizEmoji(theme)}</span> {theme}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each quizzes.filter(q => (q.theme || 'Musique') === theme) as quiz}
                  {@const results = userResults.filter(r => r.quizId === quiz.id)}
                  {@const bestResult = results.sort((a, b) => (b.score / b.totalQuestions) - (a.score / a.totalQuestions))[0]}
                  <div class="bg-white rounded-xl shadow p-4 border border-gray-100 hover:border-purple-300 transition-all">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-bold text-gray-800">{quiz.title}</h4>
                      {#if bestResult}
                        <span class="text-sm {getScoreColor(bestResult.score, bestResult.totalQuestions)} font-medium">
                          {getScoreEmoji(bestResult.score, bestResult.totalQuestions)} {Math.round((bestResult.score / bestResult.totalQuestions) * 100)}%
                        </span>
                      {/if}
                    </div>
                    {#if quiz.description}
                      <p class="text-sm text-gray-600 mb-3 line-clamp-1">{quiz.description}</p>
                    {/if}
                    <button 
                      onclick={() => playQuiz(quiz.slug)}
                      class="w-full py-2 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 font-medium transition-colors"
                    >
                      {bestResult ? 'Rejouer' : 'Jouer'}
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </section>

      <!-- Recent Activity -->
      {#if userResults.length > 0}
        <section class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">📈</span>
            <h2 class="text-xl font-bold text-gray-800">Ton activité récente</h2>
          </div>
          <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quiz</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Score</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Résultat</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {#each userResults.slice(0, 10).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()) as result}
                    {@const quiz = quizzes.find(q => q.id === result.quizId)}
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm text-gray-600">
                        {new Date(result.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td class="px-4 py-3 text-sm font-medium text-gray-800">
                        {quiz?.title || 'Quiz'}
                      </td>
                      <td class="px-4 py-3 text-sm {getScoreColor(result.score, result.totalQuestions)} font-bold">
                        {result.score}/{result.totalQuestions}
                      </td>
                      <td class="px-4 py-3 text-xl">
                        {getScoreEmoji(result.score, result.totalQuestions)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      {/if}

      <!-- Fun Encouragement -->
      <section class="text-center py-8">
        <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 inline-block">
          <p class="text-lg text-gray-700">
            {#if totalQuizzesDone === 0}
              🌟 Lance-toi dans ton premier quiz et deviens un champion !
            {:else if averageScore() >= 80}
              🎉 Bravo ! Tu es un vrai champion avec une moyenne de {averageScore()}% !
            {:else if averageScore() >= 50}
              💪 Continue comme ça ! Tu progresses super bien !
            {:else}
              🌱 Chaque essai te rend plus fort. Continue à apprendre !
            {/if}
          </p>
        </div>
      </section>
    </div>
    
    <!-- Quiz Start Modal -->
    {#if showQuizModal && selectedQuiz}
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onclick={closeQuizModal}
          role="button"
          tabindex="-1"
          onkeydown={(e) => e.key === 'Escape' && closeQuizModal()}
        ></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-in zoom-in-95 duration-200">
          <button
            onclick={closeQuizModal}
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
          
          <div class="text-center">
            <div class="text-6xl mb-4">🎯</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">Prêt à jouer ?</h3>
            <p class="text-gray-600 mb-4">Tu vas commencer le quiz :</p>
            
            <div class="bg-purple-50 rounded-xl p-4 mb-6">
              <h4 class="font-bold text-purple-800 text-lg">{selectedQuiz.title}</h4>
              {#if selectedQuiz.description}
                <p class="text-purple-600 text-sm mt-1">{selectedQuiz.description}</p>
              {/if}
              <div class="flex justify-center gap-2 mt-3 text-xs flex-wrap">
                <span class="px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                  {selectedQuiz.maxQuestions || '?'} questions
                </span>
                {#if selectedQuiz.theme}
                  <span class="px-2 py-1 bg-pink-200 text-pink-800 rounded-full">{selectedQuiz.theme}</span>
                {/if}
                {#if selectedQuiz.shuffleQuestions}
                  <span class="px-2 py-1 bg-orange-200 text-orange-800 rounded-full">🎲 Aléatoire</span>
                {/if}
              </div>
            </div>
            
            <div class="flex gap-3">
              <button
                onclick={closeQuizModal}
                class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onclick={confirmStartQuiz}
                disabled={startingQuiz}
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50"
              >
                {startingQuiz ? 'Chargement...' : "🚀 C'est parti !"}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</main>

<style>
  .hover\:scale-102:hover {
    transform: scale(1.02);
  }
</style>
