<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { goto } from '$app/navigation';
  import { 
    Trophy, Medal, Flame, Target, Crown, Star, 
    TrendingUp, Users, Calendar, Filter, ChevronDown,
    Award
  } from 'lucide-svelte';

  interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    currentStreak: number;
    bestStreak: number;
    totalBadges: number;
    badgePoints: number;
    quizCount: number;
    totalScore: number;
    totalQuestions: number;
    successRate: number;
  }

  interface GlobalStats {
    totalUsers: number;
    totalQuizCompleted: number;
    globalScore: number;
  }

  // State
  let leaderboard = $state<LeaderboardEntry[]>([]);
  let globalStats = $state<GlobalStats>({ totalUsers: 0, totalQuizCompleted: 0, globalScore: 0 });
  let loading = $state(true);
  let error = $state('');

  // Filters
  let selectedType = $state<'points' | 'badges' | 'streak' | 'quizzes'>('points');
  let selectedPeriod = $state<'all' | 'week' | 'month'>('all');
  let showFilters = $state(false);

  // Current user rank
  let currentUserRank = $state<number | null>(null);
  let currentUserEntry = $state<LeaderboardEntry | null>(null);

  const typeOptions = [
    { value: 'points', label: 'Points', icon: Star, description: 'Total des points accumulés' },
    { value: 'badges', label: 'Badges', icon: Award, description: 'Points de badges' },
    { value: 'streak', label: 'Streak', icon: Flame, description: 'Jours consécutifs' },
    { value: 'quizzes', label: 'Quiz', icon: Target, description: 'Nombre de quiz terminés' }
  ];

  const periodOptions = [
    { value: 'all', label: 'Tout temps' },
    { value: 'month', label: 'Ce mois' },
    { value: 'week', label: 'Cette semaine' }
  ];

  onMount(async () => {
    loadUser();
    await loadLeaderboard();
  });

  async function loadLeaderboard() {
    loading = true;
    error = '';

    try {
      const params = new URLSearchParams({
        type: selectedType,
        period: selectedPeriod,
        limit: '50'
      });

      const res = await fetch(`/api/leaderboard?${params}`);
      
      if (res.ok) {
        const data = await res.json();
        leaderboard = data.leaderboard || [];
        globalStats = data.globalStats || { totalUsers: 0, totalQuizCompleted: 0, globalScore: 0 };

        // Trouver le rang de l'utilisateur actuel
        if ($currentUser) {
          const cleanUserId = $currentUser.id.includes(':') 
            ? $currentUser.id.split(':')[1] 
            : $currentUser.id;
          
          const userEntry = leaderboard.find(e => 
            e.userId.includes(cleanUserId) || cleanUserId.includes(e.userId.split(':')[1] || e.userId)
          );
          
          if (userEntry) {
            currentUserRank = userEntry.rank;
            currentUserEntry = userEntry;
          } else {
            currentUserRank = null;
            currentUserEntry = null;
          }
        }
      } else {
        error = 'Erreur lors du chargement du classement';
      }
    } catch (e) {
      console.error('Erreur:', e);
      error = 'Erreur de connexion';
    } finally {
      loading = false;
    }
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-100' };
    if (rank === 3) return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-100' };
    return { icon: null, color: 'text-gray-600', bg: 'bg-gray-50' };
  }

  function getRankBadge(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  function getMainValue(entry: LeaderboardEntry): string {
    switch (selectedType) {
      case 'points':
        return `${entry.totalScore} pts`;
      case 'badges':
        return `${entry.badgePoints} pts (${entry.totalBadges} 🏆)`;
      case 'streak':
        return `${entry.currentStreak} 🔥`;
      case 'quizzes':
        return `${entry.quizCount} quiz`;
      default:
        return '';
    }
  }

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // Réagir aux changements de filtres
  $effect(() => {
    // Tracker les changements pour recharger
    const _ = selectedType + selectedPeriod;
  });

  async function applyFilters() {
    showFilters = false;
    await loadLeaderboard();
  }
</script>

<svelte:head>
  <title>Classement - Kwizy</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
  <div class="max-w-4xl mx-auto p-4 md:p-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg mb-4">
        <Trophy class="w-8 h-8 text-white" />
      </div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Classement</h1>
      <p class="text-gray-600">Les meilleurs joueurs de Kwizy</p>
    </div>

    <!-- Global Stats -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="bg-white/80 backdrop-blur rounded-xl p-4 text-center shadow-sm">
        <Users class="w-6 h-6 mx-auto text-purple-500 mb-1" />
        <div class="text-2xl font-bold text-gray-800">{globalStats.totalUsers}</div>
        <div class="text-xs text-gray-500">Joueurs</div>
      </div>
      <div class="bg-white/80 backdrop-blur rounded-xl p-4 text-center shadow-sm">
        <Target class="w-6 h-6 mx-auto text-blue-500 mb-1" />
        <div class="text-2xl font-bold text-gray-800">{globalStats.totalQuizCompleted}</div>
        <div class="text-xs text-gray-500">Quiz terminés</div>
      </div>
      <div class="bg-white/80 backdrop-blur rounded-xl p-4 text-center shadow-sm">
        <Star class="w-6 h-6 mx-auto text-yellow-500 mb-1" />
        <div class="text-2xl font-bold text-gray-800">{globalStats.globalScore}</div>
        <div class="text-xs text-gray-500">Points totaux</div>
      </div>
    </div>

    <!-- Current User Position -->
    {#if currentUserEntry && currentUserRank}
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 mb-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {getRankBadge(currentUserRank)}
            </div>
            <div>
              <div class="font-semibold">Ton classement</div>
              <div class="text-sm text-white/80">{getMainValue(currentUserEntry)}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold">#{currentUserRank}</div>
            <div class="text-sm text-white/80">sur {leaderboard.length}</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Filter Tabs -->
    <div class="bg-white/80 backdrop-blur rounded-xl shadow-sm mb-4 overflow-hidden">
      <!-- Type selector -->
      <div class="flex border-b">
        {#each typeOptions as option}
          {@const IconComponent = option.icon}
          <button
            type="button"
            onclick={() => { selectedType = option.value as any; loadLeaderboard(); }}
            class="flex-1 py-3 px-2 text-center transition-colors relative"
            class:bg-purple-50={selectedType === option.value}
            class:text-purple-700={selectedType === option.value}
            class:text-gray-500={selectedType !== option.value}
          >
            <IconComponent class="w-5 h-5 mx-auto mb-1" />
            <span class="text-xs font-medium">{option.label}</span>
            {#if selectedType === option.value}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Period selector -->
      <div class="flex justify-center gap-2 p-3">
        {#each periodOptions as option}
          <button
            type="button"
            onclick={() => { selectedPeriod = option.value as any; loadLeaderboard(); }}
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            class:bg-purple-500={selectedPeriod === option.value}
            class:text-white={selectedPeriod === option.value}
            class:bg-gray-100={selectedPeriod !== option.value}
            class:text-gray-600={selectedPeriod !== option.value}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Leaderboard -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-600">{error}</p>
        <button 
          onclick={loadLeaderboard}
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    {:else if leaderboard.length === 0}
      <div class="bg-white/80 backdrop-blur rounded-xl p-12 text-center">
        <Trophy class="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Aucun classement</h3>
        <p class="text-gray-500">Sois le premier à apparaître dans le classement !</p>
        <button
          onclick={() => goto('/dashboard')}
          class="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Commencer un quiz
        </button>
      </div>
    {:else}
      <!-- Top 3 Podium -->
      <div class="flex justify-center items-end gap-2 mb-6">
        <!-- 2nd place -->
        {#if leaderboard[1]}
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg shadow-lg mb-2">
              {leaderboard[1].avatarUrl 
                ? `<img src="${leaderboard[1].avatarUrl}" class="w-full h-full rounded-full object-cover" />`
                : getInitials(leaderboard[1].name)}
            </div>
            <div class="bg-gradient-to-t from-gray-400 to-gray-300 w-20 h-20 rounded-t-lg flex flex-col items-center justify-end pb-2">
              <span class="text-2xl">🥈</span>
              <span class="text-white text-xs font-medium truncate w-full text-center px-1">{leaderboard[1].name}</span>
            </div>
          </div>
        {/if}

        <!-- 1st place -->
        {#if leaderboard[0]}
          <div class="flex flex-col items-center -mt-4">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-2 ring-4 ring-yellow-300">
              {leaderboard[0].avatarUrl 
                ? `<img src="${leaderboard[0].avatarUrl}" class="w-full h-full rounded-full object-cover" />`
                : getInitials(leaderboard[0].name)}
            </div>
            <div class="bg-gradient-to-t from-yellow-500 to-yellow-400 w-24 h-28 rounded-t-lg flex flex-col items-center justify-end pb-2">
              <span class="text-3xl">🥇</span>
              <span class="text-white text-sm font-semibold truncate w-full text-center px-1">{leaderboard[0].name}</span>
              <span class="text-yellow-100 text-xs">{getMainValue(leaderboard[0])}</span>
            </div>
          </div>
        {/if}

        <!-- 3rd place -->
        {#if leaderboard[2]}
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-lg mb-2">
              {leaderboard[2].avatarUrl 
                ? `<img src="${leaderboard[2].avatarUrl}" class="w-full h-full rounded-full object-cover" />`
                : getInitials(leaderboard[2].name)}
            </div>
            <div class="bg-gradient-to-t from-amber-600 to-amber-500 w-20 h-16 rounded-t-lg flex flex-col items-center justify-end pb-2">
              <span class="text-2xl">🥉</span>
              <span class="text-white text-xs font-medium truncate w-full text-center px-1">{leaderboard[2].name}</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Rest of leaderboard -->
      <div class="bg-white/80 backdrop-blur rounded-xl shadow-sm overflow-hidden">
        <div class="divide-y divide-gray-100">
          {#each leaderboard.slice(3) as entry}
            {@const isCurrentUser = $currentUser && (
              entry.userId.includes($currentUser.id.split(':')[1] || $currentUser.id) ||
              ($currentUser.id.split(':')[1] || $currentUser.id).includes(entry.userId.split(':')[1] || entry.userId)
            )}
            <div 
              class="flex items-center gap-3 p-4 hover:bg-purple-50/50 transition-colors"
              class:bg-purple-50={isCurrentUser}
              class:border-l-4={isCurrentUser}
              class:border-purple-500={isCurrentUser}
            >
              <!-- Rank -->
              <div class="w-10 text-center font-bold text-gray-500">
                #{entry.rank}
              </div>

              <!-- Avatar -->
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(entry.name)}
              </div>

              <!-- Name & stats -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-800 truncate">
                  {entry.name}
                  {#if isCurrentUser}
                    <span class="text-purple-600 text-sm">(Toi)</span>
                  {/if}
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-500">
                  {#if entry.quizCount > 0}
                    <span>{entry.quizCount} quiz</span>
                  {/if}
                  {#if entry.currentStreak > 0}
                    <span class="flex items-center gap-0.5">
                      <Flame class="w-3 h-3 text-orange-500" />
                      {entry.currentStreak}
                    </span>
                  {/if}
                  {#if entry.totalBadges > 0}
                    <span>{entry.totalBadges} 🏆</span>
                  {/if}
                </div>
              </div>

              <!-- Main value -->
              <div class="text-right">
                <div class="font-bold text-purple-600">{getMainValue(entry)}</div>
                {#if selectedType === 'points' && entry.successRate > 0}
                  <div class="text-xs text-gray-500">{entry.successRate}% réussite</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Back button -->
    <div class="mt-8 text-center">
      <button
        onclick={() => goto('/dashboard')}
        class="px-6 py-3 bg-white/80 text-purple-600 rounded-xl font-medium hover:bg-white transition-colors shadow-sm"
      >
        ← Retour à mon espace
      </button>
    </div>
  </div>
</main>
