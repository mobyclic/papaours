<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { goto } from '$app/navigation';
  import { 
    TrendingUp, Target, Calendar, Clock, Award, BarChart3,
    Trophy, Flame, Star, ChevronLeft, ChevronRight, BookOpen
  } from 'lucide-svelte';

  interface GeneralStats {
    totalQuizzes: number;
    totalScore: number;
    totalQuestions: number;
    avgScore: number;
    perfectScores: number;
    currentStreak: number;
    bestStreak: number;
    totalBadges: number;
    badgePoints: number;
  }

  interface ProgressionEntry {
    date: string;
    quizzes: number;
    score: number;
    questions: number;
  }

  interface SubjectStats {
    subject_name: string;
    subject_code: string;
    quiz_count: number;
    total_score: number;
    total_questions: number;
    success_rate: number;
  }

  interface SessionEntry {
    id: string;
    quiz_title: string;
    quiz_slug: string;
    score: number;
    total_questions: number;
    mode: string;
    completedAt: string;
    percentage: number;
  }

  // State
  let general = $state<GeneralStats | null>(null);
  let progression = $state<ProgressionEntry[]>([]);
  let bySubject = $state<SubjectStats[]>([]);
  let recentSessions = $state<SessionEntry[]>([]);
  let scoreDistribution = $state<any[]>([]);
  let weekdayStats = $state<any[]>([]);
  let hourlyStats = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Period filter
  let selectedPeriod = $state(30);
  const periodOptions = [
    { value: 7, label: '7 jours' },
    { value: 30, label: '30 jours' },
    { value: 90, label: '3 mois' },
    { value: 365, label: '1 an' }
  ];

  const weekdayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  onMount(async () => {
    loadUser();
    if (!$currentUser) {
      goto('/');
      return;
    }
    await loadStats();
  });

  async function loadStats() {
    loading = true;
    error = '';

    try {
      const cleanId = $currentUser?.id.includes(':') 
        ? $currentUser.id.split(':')[1] 
        : $currentUser?.id;
      
      const res = await fetch(`/api/users/${cleanId}/stats?period=${selectedPeriod}`);
      
      if (res.ok) {
        const data = await res.json();
        general = data.general;
        progression = data.progression || [];
        bySubject = data.bySubject || data.byMatiere || [];
        recentSessions = data.recentSessions || [];
        scoreDistribution = data.scoreDistribution || [];
        weekdayStats = data.weekdayStats || [];
        hourlyStats = data.hourlyStats || [];
      } else {
        error = 'Erreur lors du chargement des statistiques';
      }
    } catch (e) {
      console.error('Erreur:', e);
      error = 'Erreur de connexion';
    } finally {
      loading = false;
    }
  }

  // Calculs pour les graphiques
  const maxProgressionQuizzes = $derived(
    Math.max(...progression.map(p => p.quizzes), 1)
  );

  const maxSubjectCount = $derived(
    Math.max(...bySubject.map(s => s.quiz_count), 1)
  );

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }

  function formatDateTime(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  function getScoreColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-lime-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreBarColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-lime-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }
</script>

<svelte:head>
  <title>Mes statistiques - Kweez</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
  <div class="max-w-6xl mx-auto p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <button
          onclick={() => goto('/dashboard')}
          class="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft class="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 class="w-8 h-8 text-purple-600" />
          Mes statistiques
        </h1>
      </div>

      <!-- Period selector -->
      <div class="flex gap-2">
        {#each periodOptions as option}
          <button
            type="button"
            onclick={() => { selectedPeriod = option.value; loadStats(); }}
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            class:bg-purple-500={selectedPeriod === option.value}
            class:text-white={selectedPeriod === option.value}
            class:bg-white={selectedPeriod !== option.value}
            class:text-gray-600={selectedPeriod !== option.value}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-600">{error}</p>
        <button 
          onclick={loadStats}
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    {:else if general}
      <!-- Stats Overview -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 text-purple-600 mb-2">
            <Target class="w-5 h-5" />
            <span class="text-sm font-medium">Quiz terminés</span>
          </div>
          <div class="text-3xl font-bold text-gray-800">{general.totalQuizzes}</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp class="w-5 h-5" />
            <span class="text-sm font-medium">Score moyen</span>
          </div>
          <div class="text-3xl font-bold text-gray-800">{general.avgScore}%</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 text-amber-600 mb-2">
            <Trophy class="w-5 h-5" />
            <span class="text-sm font-medium">Scores parfaits</span>
          </div>
          <div class="text-3xl font-bold text-gray-800">{general.perfectScores}</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 text-orange-600 mb-2">
            <Flame class="w-5 h-5" />
            <span class="text-sm font-medium">Streak actuel</span>
          </div>
          <div class="text-3xl font-bold text-gray-800">{general.currentStreak} 🔥</div>
          <div class="text-xs text-gray-500">Record: {general.bestStreak}</div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <!-- Progression Chart -->
        <div class="bg-white rounded-xl p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-purple-600" />
            Activité récente
          </h2>
          
          {#if progression.length === 0}
            <div class="text-center py-8 text-gray-500">
              <Calendar class="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucune activité sur cette période</p>
            </div>
          {:else}
            <div class="flex items-end gap-1 h-40">
              {#each progression.slice(-14) as entry}
                {@const height = (entry.quizzes / maxProgressionQuizzes) * 100}
                {@const rate = entry.questions > 0 ? Math.round((entry.score / entry.questions) * 100) : 0}
                <div class="flex-1 flex flex-col items-center group relative">
                  <div 
                    class="w-full rounded-t transition-all {getScoreBarColor(rate)} hover:opacity-80"
                    style="height: {Math.max(height, 5)}%"
                  ></div>
                  <!-- Tooltip -->
                  <div class="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div class="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {formatDate(entry.date)}: {entry.quizzes} quiz ({rate}%)
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-2">
              <span>{formatDate(progression[Math.max(0, progression.length - 14)]?.date)}</span>
              <span>{formatDate(progression[progression.length - 1]?.date)}</span>
            </div>
          {/if}
        </div>

        <!-- Performance by Subject -->
        <div class="bg-white rounded-xl p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-600" />
            Par matière
          </h2>
          
          {#if bySubject.length === 0}
            <div class="text-center py-8 text-gray-500">
              <BookOpen class="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucune donnée par matière</p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each bySubject.slice(0, 5) as subject}
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">{subject.subject_name || 'Autre'}</span>
                    <span class="text-sm {getScoreColor(subject.success_rate)}">{subject.success_rate}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      class="{getScoreBarColor(subject.success_rate)} h-2.5 rounded-full transition-all"
                      style="width: {subject.success_rate}%"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-400 mt-0.5">{subject.quiz_count} quiz</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <!-- Weekday Performance -->
        <div class="bg-white rounded-xl p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-green-600" />
            Par jour de la semaine
          </h2>
          
          {#if weekdayStats.length === 0}
            <div class="text-center py-8 text-gray-500">
              <Clock class="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Pas assez de données</p>
            </div>
          {:else}
            <div class="flex items-end justify-between h-32 gap-2">
              {#each Array(7) as _, i}
                {@const stat = weekdayStats.find(s => parseInt(s.weekday) === i)}
                {@const count = stat?.count || 0}
                {@const maxCount = Math.max(...weekdayStats.map(s => s.count), 1)}
                {@const height = count > 0 ? (count / maxCount) * 100 : 5}
                <div class="flex-1 flex flex-col items-center">
                  <div 
                    class="w-full rounded-t bg-gradient-to-t from-green-400 to-green-500 transition-all"
                    style="height: {height}%"
                  ></div>
                  <div class="text-xs text-gray-500 mt-1">{weekdayNames[i]}</div>
                  <div class="text-xs font-medium text-gray-700">{count}</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Score Distribution -->
        <div class="bg-white rounded-xl p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star class="w-5 h-5 text-amber-600" />
            Distribution des scores
          </h2>
          
          {#if scoreDistribution.length === 0}
            <div class="text-center py-8 text-gray-500">
              <Star class="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Pas assez de données</p>
            </div>
          {:else}
            {@const maxDist = Math.max(...scoreDistribution.map(s => s.count), 1)}
            <div class="flex items-end justify-between h-32 gap-1">
              {#each Array(10) as _, i}
                {@const range = i * 10}
                {@const stat = scoreDistribution.find(s => s.score_range === range)}
                {@const count = stat?.count || 0}
                {@const height = count > 0 ? (count / maxDist) * 100 : 3}
                <div class="flex-1 flex flex-col items-center group relative">
                  <div 
                    class="w-full rounded-t transition-all {getScoreBarColor(range + 5)}"
                    style="height: {height}%"
                  ></div>
                  <div class="text-[10px] text-gray-500 mt-1">{range}%</div>
                  <!-- Tooltip -->
                  <div class="absolute bottom-full mb-1 hidden group-hover:block z-10">
                    <div class="bg-gray-800 text-white text-xs rounded px-2 py-1">
                      {count} quiz
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Recent Sessions -->
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-gray-600" />
          Historique récent
        </h2>
        
        {#if recentSessions.length === 0}
          <div class="text-center py-8 text-gray-500">
            <Clock class="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucun quiz terminé</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-sm text-gray-500 border-b">
                  <th class="pb-2">Quiz</th>
                  <th class="pb-2">Mode</th>
                  <th class="pb-2 text-right">Score</th>
                  <th class="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {#each recentSessions as session}
                  <tr class="hover:bg-gray-50">
                    <td class="py-3">
                      <span class="font-medium text-gray-800">{session.quiz_title}</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium
                        {session.mode === 'epreuve' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                        {session.mode === 'epreuve' ? 'Épreuve' : 'Révision'}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <span class="font-bold {getScoreColor(session.percentage)}">
                        {session.score}/{session.total_questions}
                      </span>
                      <span class="text-gray-400 text-sm ml-1">({session.percentage}%)</span>
                    </td>
                    <td class="py-3 text-right text-sm text-gray-500">
                      {formatDateTime(session.completedAt)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>
