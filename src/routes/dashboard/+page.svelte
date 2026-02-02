<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser, logoutUser } from '$lib/stores/userStore.svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n';
  import { Button } from '$lib/components/ui/button';
  import { Brain, UserPlus, User, LogOut, ChevronDown, Search, Plus, X, Users, GraduationCap } from 'lucide-svelte';
  import QuizExploreModal from '$lib/components/QuizExploreModal.svelte';

  // Dropdown state
  let showUserDropdown = $state(false);
  let showExploreModal = $state(false);
  let showTutorModal = $state(false);

  // User context data
  let userContext = $state<{
    country?: string;
    cycle?: string;
    grade?: string;
    cycleName?: string;
    gradeName?: string;
  }>({});
  
  // Dashboard data
  let loading = $state(true);
  let quizzes = $state<any[]>([]);
  let userResults = $state<any[]>([]);
  let activeSessions = $state<any[]>([]);
  let badges = $state<any[]>([]);
  let officialProgram = $state<any[]>([]);
  let greeting = $state('');
  
  // Modal state for quiz
  let showQuizModal = $state(false);
  let selectedQuiz = $state<any>(null);
  let selectedMode = $state<'revision' | 'epreuve'>('revision');
  let selectedTimeLimit = $state<number | null>(null);
  let startingQuiz = $state(false);
  
  // Stats calculées
  let totalQuizzesDone = $derived(userResults.length);
  let averageScore = $derived.by(() => {
    if (userResults.length === 0) return 0;
    const total = userResults.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0);
    return Math.round(total / userResults.length);
  });
  let currentStreak = $derived(3); // TODO: calculer depuis les résultats
  
  // Quiz du jour (random ou basé sur recommandation)
  let quizOfTheDay = $derived.by(() => {
    if (quizzes.length === 0) return null;
    const notDone = quizzes.filter(q => !userResults.some(r => r.quizId === q.id));
    if (notDone.length > 0) return notDone[Math.floor(Math.random() * notDone.length)];
    return quizzes[Math.floor(Math.random() * quizzes.length)];
  });
  
  // Quiz en cours
  let quizzesInProgress = $derived.by(() => {
    const completedIds = new Set(userResults.filter(r => r.score === r.totalQuestions).map(r => r.quizId));
    return quizzes.filter(q => {
      const hasStarted = userResults.some(r => r.quizId === q.id);
      return hasStarted && !completedIds.has(q.id);
    }).slice(0, 3);
  });

  // Libellé adapté selon l'âge/cycle
  let cursusLabel = $derived.by(() => {
    const cycle = userContext.cycle?.toLowerCase() || '';
    if (cycle.includes('maternelle') || cycle.includes('primaire')) return 'Mes aventures';
    if (cycle.includes('college')) return 'Mon parcours';
    return 'Mon cursus';
  });

  onMount(async () => {
    loadUser();
    await new Promise(r => setTimeout(r, 50));
    
    if (!$currentUser) {
      goto('/');
      return;
    }
    
    // Rediriger vers onboarding si pas complété
    if (!$currentUser.onboarding_completed && !$currentUser.current_cycle && !$currentUser.current_grade) {
      goto('/onboarding');
      return;
    }

    // Message de bienvenue selon l'heure
    const hour = new Date().getHours();
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';

    // Charger le contexte utilisateur et les données
    await Promise.all([
      loadUserContext(),
      loadQuizzes(),
      loadResults(),
      loadBadges(),
      loadOfficialProgram()
    ]);
    
    loading = false;
  });

  async function loadUserContext() {
    try {
      const res = await fetch('/api/user/context');
      if (res.ok) {
        userContext = await res.json();
      }
    } catch (e) {
      console.error('Erreur chargement contexte:', e);
    }
  }

  async function loadQuizzes() {
    try {
      const res = await fetch('/api/quiz/list');
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes || [];
      }
    } catch (e) {
      console.error('Erreur chargement quiz:', e);
    }
  }

  async function loadResults() {
    try {
      const userId = $currentUser?.id;
      if (!userId) return;
      const res = await fetch(`/api/user/results?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        userResults = data.results || [];
      }
    } catch (e) {
      console.error('Erreur chargement résultats:', e);
    }
  }

  async function loadBadges() {
    try {
      const res = await fetch('/api/user/badges');
      if (res.ok) {
        const data = await res.json();
        badges = data.badges || [];
      }
    } catch (e) {
      console.error('Erreur chargement badges:', e);
    }
  }

  async function loadOfficialProgram() {
    try {
      const res = await fetch('/api/education/program');
      if (res.ok) {
        const data = await res.json();
        officialProgram = data.subjects || [];
      }
    } catch (e) {
      console.error('Erreur chargement programme:', e);
    }
  }

  function playQuiz(quiz: any) {
    selectedQuiz = quiz;
    showQuizModal = true;
  }

  async function startQuiz() {
    if (!selectedQuiz || startingQuiz) return;
    startingQuiz = true;
    
    try {
      const response = await fetch(`/api/quiz/${selectedQuiz.slug}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: $currentUser?.id,
          mode: selectedMode,
          timeLimit: selectedTimeLimit
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        goto(`/quiz/${selectedQuiz.slug}?sessionId=${data.session.id}`);
      }
    } catch (err) {
      console.error('Erreur démarrage quiz:', err);
    } finally {
      startingQuiz = false;
    }
  }

  function handleLogout() {
    logoutUser();
    goto('/');
  }

  function handleAddProfile() {
    showUserDropdown = false;
    // Si l'utilisateur est un apprenant, on affiche la modal d'explication
    if ($currentUser?.profile_type === 'apprenant') {
      showTutorModal = true;
    } else {
      // Sinon on va directement à la page d'ajout de profil
      goto('/add-profile');
    }
  }

  function becomeTutor() {
    showTutorModal = false;
    goto('/add-profile?upgrade=tutor');
  }

  function getSubjectIcon(code: string): string {
    const icons: Record<string, string> = {
      'history': '🏰', 'geography': '🌍', 'french': '📚', 'math': '🔢', 'mathematics': '🔢',
      'physics': '⚛️', 'chemistry': '🧪', 'biology': '🌿', 'svt': '🌿',
      'english': '🇬🇧', 'spanish': '🇪🇸', 'german': '🇩🇪',
      'philosophy': '🤔', 'art': '🎨', 'music': '🎵', 'sport': '⚽',
      'economics': '📈', 'ses': '📊', 'technology': '💻'
    };
    return icons[code.toLowerCase()] || '📖';
  }
</script>

<svelte:head>
  <title>Dashboard | Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gray-950">
  <!-- Grid background pattern -->
  <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
  
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
        <p class="mt-4 text-gray-400">{$t('common.loading')}</p>
      </div>
    </div>
  {:else}
    <!-- Header / Navigation -->
    <header class="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Logo + Context -->
          <div class="flex items-center gap-4">
            <a href="/" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Brain class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-transparent bg-clip-text">Kweez</span>
            </a>
            
            <!-- Context Breadcrumb -->
            {#if userContext.cycleName}
              <div class="hidden md:flex items-center gap-2 text-sm text-gray-400">
                <span class="text-gray-600">|</span>
                <span>🇫🇷</span>
                <span class="text-gray-600">›</span>
                <span>{userContext.cycleName}</span>
                {#if userContext.gradeName}
                  <span class="text-gray-600">›</span>
                  <span class="text-amber-400 font-medium">{userContext.gradeName}</span>
                {/if}
              </div>
            {/if}
          </div>
          
          <!-- User Actions -->
          <div class="flex items-center gap-2">
            <button 
              onclick={() => showExploreModal = true}
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium transition-colors"
              title="Trouver un quiz"
            >
              <Search class="w-4 h-4" />
              <span class="hidden sm:inline text-sm">Trouver un quiz</span>
            </button>
            
            <div class="relative">
              <button 
                onclick={() => showUserDropdown = !showUserDropdown}
                onblur={() => setTimeout(() => showUserDropdown = false, 150)}
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-gray-900">
                  {($currentUser?.name?.charAt(0) || $currentUser?.email?.charAt(0) || '?').toUpperCase()}
                </div>
                <span class="text-sm text-gray-300 hidden sm:block">{$currentUser?.name?.split(' ')[0] || 'Mon profil'}</span>
                <ChevronDown class="w-4 h-4 text-gray-500" />
              </button>
              
              {#if showUserDropdown}
                <div class="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <button 
                    onmousedown={() => { showUserDropdown = false; goto('/profile'); }}
                    class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left"
                  >
                    <User class="w-4 h-4 text-amber-400" />
                    Mon profil
                  </button>
                  <button 
                    onmousedown={handleAddProfile}
                    class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left"
                  >
                    <UserPlus class="w-4 h-4 text-gray-400" />
                    Ajouter un profil
                  </button>
                  <div class="border-t border-gray-800"></div>
                  <button 
                    onmousedown={() => { showUserDropdown = false; handleLogout(); }}
                    class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors text-left"
                  >
                    <LogOut class="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="relative z-10 max-w-7xl mx-auto px-4 py-6">
      <!-- Welcome Section -->
      <section class="mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">
          {greeting}, <span class="text-amber-400">{$currentUser?.name?.split(' ')[0] || 'Champion'}</span> ! 👋
        </h1>
        <p class="text-gray-400">Prêt à apprendre en t'amusant ?</p>
      </section>

      <!-- Stats Row -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gray-900/80 rounded-xl p-4 border border-gray-800 text-center">
          <div class="text-2xl mb-1">🎮</div>
          <div class="text-2xl font-bold text-white">{totalQuizzesDone}</div>
          <div class="text-xs text-gray-500">Quiz joués</div>
        </div>
        <div class="bg-gray-900/80 rounded-xl p-4 border border-gray-800 text-center">
          <div class="text-2xl mb-1">📊</div>
          <div class="text-2xl font-bold text-white">{averageScore}%</div>
          <div class="text-xs text-gray-500">Score moyen</div>
        </div>
        <div class="bg-gray-900/80 rounded-xl p-4 border border-gray-800 text-center">
          <div class="text-2xl mb-1">🔥</div>
          <div class="text-2xl font-bold text-amber-400">{currentStreak}</div>
          <div class="text-xs text-gray-500">Jours de suite</div>
        </div>
        <button 
          onclick={() => goto('/leaderboard')}
          class="bg-gray-900/80 rounded-xl p-4 border border-gray-800 text-center hover:border-amber-500/50 transition-colors"
        >
          <div class="text-2xl mb-1">🏆</div>
          <div class="text-lg font-bold text-white">Classement</div>
          <div class="text-xs text-gray-500">Voir le top →</div>
        </button>
      </section>

      <!-- Main Grid: 2 columns on desktop -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left Column: Cursus + Recommendations -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Mon Cursus Section -->
          <section class="bg-gray-900/80 rounded-2xl border border-gray-800 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📚</span> {cursusLabel}
              </h2>
              <button 
                onclick={() => goto('/explore')}
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-gray-900 text-sm font-medium transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Ajouter un quiz
              </button>
            </div>
            
            <!-- Progress bar global -->
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-400">Progression globale</span>
                <span class="text-amber-400 font-medium">{averageScore}%</span>
              </div>
              <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all" style="width: {averageScore}%"></div>
              </div>
            </div>
            
            <!-- Quiz en cours -->
            {#if quizzesInProgress.length > 0}
              <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-400">En cours</h3>
                {#each quizzesInProgress as quiz}
                  {@const lastResult = userResults.filter(r => r.quizId === quiz.id).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]}
                  <button 
                    onclick={() => playQuiz(quiz)}
                    class="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/50 transition-all text-left"
                  >
                    <span class="text-2xl">{getSubjectIcon(quiz.subject || quiz.theme || '')}</span>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-white truncate">{quiz.title}</div>
                      {#if lastResult}
                        <div class="text-xs text-gray-500">
                          Dernier: {lastResult.score}/{lastResult.totalQuestions}
                        </div>
                      {/if}
                    </div>
                    <span class="text-amber-400 text-sm">Continuer →</span>
                  </button>
                {/each}
              </div>
            {:else}
              <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">🎯</div>
                <p>Aucun quiz en cours</p>
                <button 
                  onclick={() => goto('/explore')}
                  class="mt-3 text-amber-400 hover:text-amber-300 text-sm"
                >
                  Découvrir des quiz →
                </button>
              </div>
            {/if}
          </section>

          <!-- Flux de Recommandations -->
          <section class="bg-gray-900/80 rounded-2xl border border-gray-800 p-6">
            <h2 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>✨</span> Recommandations
            </h2>
            
            <div class="grid md:grid-cols-2 gap-4">
              <!-- Quiz du jour -->
              {#if quizOfTheDay}
                <div class="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
                  <div class="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                    <span>🌟</span> Quiz du jour
                  </div>
                  <h3 class="font-bold text-white mb-2">{quizOfTheDay.title}</h3>
                  <p class="text-sm text-gray-400 mb-3 line-clamp-2">{quizOfTheDay.description || 'Teste tes connaissances !'}</p>
                  <Button 
                    onclick={() => playQuiz(quizOfTheDay)}
                    class="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium"
                  >
                    Jouer maintenant
                  </Button>
                </div>
              {/if}
              
              <!-- Points faibles -->
              <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
                <div class="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                  <span>💪</span> Révisions ciblées
                </div>
                <h3 class="font-bold text-white mb-2">Améliore tes points faibles</h3>
                <p class="text-sm text-gray-400 mb-3">Quiz généré sur les questions où tu as eu des difficultés</p>
                <Button 
                  variant="outline"
                  class="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  disabled
                >
                  Bientôt disponible
                </Button>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column: Hub / Matières -->
        <div class="space-y-6">
          <!-- Bibliothèque des matières -->
          <section class="bg-gray-900/80 rounded-2xl border border-gray-800 p-6">
            <h2 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>📖</span> Programme officiel
            </h2>
            
            {#if officialProgram.length > 0}
              <div class="space-y-2">
                {#each officialProgram as subject}
                  <button 
                    onclick={() => goto(`/subjects/${subject.code}`)}
                    class="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all text-left"
                  >
                    <span class="text-xl">{subject.icon || getSubjectIcon(subject.code)}</span>
                    <div class="flex-1">
                      <div class="font-medium text-white">{subject.name}</div>
                      {#if subject.chaptersCount}
                        <div class="text-xs text-gray-500">{subject.chaptersCount} chapitres</div>
                      {/if}
                    </div>
                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500">
                <p class="text-sm">Complète ton profil pour voir ton programme</p>
                <button 
                  onclick={() => goto('/profile')}
                  class="mt-2 text-amber-400 hover:text-amber-300 text-sm"
                >
                  Configurer →
                </button>
              </div>
            {/if}
          </section>

          <!-- Badges / Gamification -->
          <section class="bg-gray-900/80 rounded-2xl border border-gray-800 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>🏅</span> Mes badges
              </h2>
              <button 
                onclick={() => goto('/badges')}
                class="text-sm text-gray-400 hover:text-amber-400"
              >
                Voir tous →
              </button>
            </div>
            
            {#if badges.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each badges.slice(0, 6) as badge}
                  <div 
                    class="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl border border-gray-700"
                    title={badge.name}
                  >
                    {badge.icon || '🎖️'}
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-4 text-gray-500">
                <div class="text-3xl mb-2">🎯</div>
                <p class="text-sm">Joue des quiz pour gagner des badges !</p>
              </div>
            {/if}
          </section>

          <!-- Quick Links -->
          <div class="grid grid-cols-2 gap-3">
            <button 
              onclick={() => goto('/stats')}
              class="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 text-center transition-colors"
            >
              <div class="text-2xl mb-1">📊</div>
              <div class="text-sm text-gray-400">Statistiques</div>
            </button>
            <button 
              onclick={() => goto('/favorites')}
              class="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 text-center transition-colors"
            >
              <div class="text-2xl mb-1">❤️</div>
              <div class="text-sm text-gray-400">Favoris</div>
            </button>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="relative z-10 border-t border-gray-800 mt-12">
      <div class="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          © 2026 Kweez
        </div>
        <div class="flex items-center gap-4">
          <button onclick={() => goto('/donate')} class="text-sm text-gray-400 hover:text-amber-400">
            💝 Soutenir
          </button>
          <button onclick={handleLogout} class="text-sm text-gray-400 hover:text-white">
            Déconnexion
          </button>
        </div>
      </div>
    </footer>
  {/if}
</div>

<!-- Quiz Start Modal -->
{#if showQuizModal && selectedQuiz}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6">
      <h2 class="text-xl font-bold text-white mb-2">{selectedQuiz.title}</h2>
      <p class="text-gray-400 text-sm mb-6">{selectedQuiz.description || 'Prêt à tester tes connaissances ?'}</p>
      
      <!-- Mode selection -->
      <div class="mb-4">
        <label class="text-sm font-medium text-gray-300 mb-2 block">Mode</label>
        <div class="grid grid-cols-2 gap-2">
          <button 
            onclick={() => selectedMode = 'revision'}
            class="p-3 rounded-lg border transition-colors {selectedMode === 'revision' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}"
          >
            <div class="text-lg mb-1">📖</div>
            <div class="text-sm font-medium">Révision</div>
          </button>
          <button 
            onclick={() => selectedMode = 'epreuve'}
            class="p-3 rounded-lg border transition-colors {selectedMode === 'epreuve' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}"
          >
            <div class="text-lg mb-1">⏱️</div>
            <div class="text-sm font-medium">Épreuve</div>
          </button>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-3">
        <Button 
          variant="outline" 
          onclick={() => { showQuizModal = false; selectedQuiz = null; }}
          class="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Annuler
        </Button>
        <Button 
          onclick={startQuiz}
          disabled={startingQuiz}
          class="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
        >
          {#if startingQuiz}
            <span class="animate-spin mr-2">⏳</span>
          {/if}
          Commencer
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Devenir Tuteur -->
{#if showTutorModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full shadow-2xl">
      <!-- Header -->
      <div class="relative p-6 pb-0">
        <button 
          onclick={() => showTutorModal = false}
          class="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
        
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
          <Users class="w-8 h-8 text-white" />
        </div>
        
        <h2 class="text-xl font-bold text-white text-center">Devenir Tuteur</h2>
        <p class="text-gray-400 text-center mt-2 text-sm">
          Pour ajouter et gérer des profils, vous devez passer en mode Tuteur.
        </p>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700">
          <h3 class="font-medium text-white mb-3 flex items-center gap-2">
            <GraduationCap class="w-5 h-5 text-amber-400" />
            À quoi sert le mode Tuteur ?
          </h3>
          <ul class="space-y-2 text-sm text-gray-300">
            <li class="flex items-start gap-2">
              <span class="text-green-400 mt-0.5">✓</span>
              <span>Créer des profils pour vos <strong class="text-white">enfants</strong> ou <strong class="text-white">élèves</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-400 mt-0.5">✓</span>
              <span>Suivre leur progression et leurs résultats</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-400 mt-0.5">✓</span>
              <span>Assigner des quiz et définir des objectifs</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-400 mt-0.5">✓</span>
              <span>Recevoir des rapports de progression</span>
            </li>
          </ul>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm">
          <p class="text-amber-200">
            <strong>Note :</strong> Vous conserverez votre profil apprenant actuel et pourrez y revenir à tout moment.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 pt-0 flex gap-3">
        <Button 
          variant="outline" 
          onclick={() => showTutorModal = false}
          class="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Plus tard
        </Button>
        <Button 
          onclick={becomeTutor}
          class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold"
        >
          <Users class="w-4 h-4 mr-2" />
          Devenir Tuteur
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- Quiz Explore Modal -->
<QuizExploreModal 
  bind:open={showExploreModal} 
  onClose={() => showExploreModal = false}
  onSelectQuiz={(quiz) => playQuiz(quiz)}
/>
