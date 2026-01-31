<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { goto } from '$app/navigation';
  import { Brain, TrendingUp, Target, Award, BookOpen, ChevronDown, ChevronUp, Trophy, BarChart3, ChevronLeft } from 'lucide-svelte';
  import { BadgesGrid } from '$lib/components/badges';

  interface UserCompetence {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: 'general' | 'matiere';
    color?: string;
    matiere_name?: string;
    matiere_slug?: string;
    correct_answers: number;
    total_answers: number;
    mastery_level: number;
    last_practiced?: string;
  }

  interface CompetenceStats {
    totalCompetences: number;
    totalCorrect: number;
    totalAnswers: number;
    avgMastery: number;
    successRate: number;
  }

  interface Badge {
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: 'accomplishment' | 'performance' | 'regularity' | 'mastery' | 'special';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    points: number;
    earned_at?: string;
  }

  let quizzes = $state<any[]>([]);
  let userResults = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');
  
  // Compétences
  let competences = $state<UserCompetence[]>([]);
  let generalCompetences = $state<UserCompetence[]>([]);
  let competencesByMatiere = $state<Record<string, UserCompetence[]>>({});
  let competenceStats = $state<CompetenceStats | null>(null);
  let matiereStats = $state<Record<string, { name: string; avgMastery: number; totalAnswers: number }>>({});
  let loadingCompetences = $state(true);
  let showCompetences = $state(true);

  // Badges
  let earnedBadges = $state<Badge[]>([]);
  let availableBadges = $state<Badge[]>([]);
  let badgeStats = $state({ total: 0, points: 0, byCategory: {} as Record<string, number> });
  let loadingBadges = $state(true);
  let showBadges = $state(true);

  onMount(async () => {
    loadUser();
    if (!$currentUser) {
      goto('/');
      return;
    }
    const uid = $currentUser.id;
    await Promise.all([loadQuizzes(), loadResults(uid), loadCompetences(uid), loadBadges(uid)]);
    loading = false;
    loadingCompetences = false;
    loadingBadges = false;
  });

  async function loadQuizzes() {
    try {
      const res = await fetch('/api/quiz/list');
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes || [];
      }
    } catch (e) {
      error = 'Erreur chargement des quiz';
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
      error = 'Erreur chargement des résultats';
    }
  }

  async function loadCompetences(userId: string) {
    try {
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/competences`);
      if (res.ok) {
        const data = await res.json();
        competences = data.competences || [];
        generalCompetences = data.general || [];
        competencesByMatiere = data.byMatiere || {};
        competenceStats = data.stats || null;
        matiereStats = data.matiereStats || {};
      }
    } catch (e) {
      console.error('Erreur chargement des compétences:', e);
    }
  }

  async function loadBadges(userId: string) {
    try {
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/badges`);
      if (res.ok) {
        const data = await res.json();
        earnedBadges = data.earned || [];
        availableBadges = data.available || [];
        badgeStats = data.stats || { total: 0, points: 0, byCategory: {} };
      }
    } catch (e) {
      console.error('Erreur chargement des badges:', e);
    }
  }

  function playQuiz(slug: string) {
    goto(`/quiz/${slug}`);
  }

  function getMasteryColor(level: number): string {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-lime-500';
    if (level >= 40) return 'bg-yellow-500';
    if (level >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function getMasteryLabel(level: number): string {
    if (level >= 80) return 'Maîtrisée';
    if (level >= 60) return 'Acquise';
    if (level >= 40) return 'En cours';
    if (level >= 20) return 'Débutant';
    return 'À travailler';
  }
</script>

<svelte:head>
  <title>Profil - Kwizy</title>
</svelte:head>

<main class="min-h-screen bg-gray-50">
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex items-center justify-between mb-2">
      <div>
        <button
          onclick={() => goto('/dashboard')}
          class="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-1"
        >
          <ChevronLeft class="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 class="text-3xl font-bold">Bonjour {$currentUser?.name || $currentUser?.email}</h1>
      </div>
      <button
        onclick={() => goto('/stats')}
        class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow hover:shadow-lg transition-all"
      >
        <BarChart3 class="w-5 h-5" />
        <span>Statistiques détaillées</span>
      </button>
    </div>
    <p class="text-gray-600 mb-6">Choisissez un quiz par thème et par niveau, et suivez votre progression.</p>

    {#if loading}
      <p>Chargement...</p>
    {:else}
      <!-- Section Badges -->
      <section class="mb-10">
        <button 
          onclick={() => showBadges = !showBadges}
          class="flex items-center justify-between w-full text-left mb-4"
        >
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Trophy class="w-6 h-6 text-amber-500" />
            Mes Badges
            <span class="text-sm font-normal text-gray-500">({earnedBadges.length} obtenus)</span>
          </h2>
          {#if showBadges}
            <ChevronUp class="w-5 h-5 text-gray-500" />
          {:else}
            <ChevronDown class="w-5 h-5 text-gray-500" />
          {/if}
        </button>

        {#if showBadges}
          {#if loadingBadges}
            <div class="text-center py-8 text-gray-500">Chargement des badges...</div>
          {:else}
            <BadgesGrid 
              earnedBadges={earnedBadges} 
              availableBadges={availableBadges}
              stats={badgeStats}
              showAvailable={true}
            />
          {/if}
        {/if}
      </section>

      <!-- Section Compétences -->
      <section class="mb-10">
        <button 
          onclick={() => showCompetences = !showCompetences}
          class="flex items-center justify-between w-full text-left mb-4"
        >
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Brain class="w-6 h-6 text-purple-600" />
            Mes Compétences
          </h2>
          {#if showCompetences}
            <ChevronUp class="w-5 h-5 text-gray-500" />
          {:else}
            <ChevronDown class="w-5 h-5 text-gray-500" />
          {/if}
        </button>

        {#if showCompetences}
          {#if loadingCompetences}
            <div class="text-center py-8 text-gray-500">Chargement des compétences...</div>
          {:else if competences.length === 0}
            <div class="bg-white border rounded-xl shadow p-6 text-center">
              <Brain class="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p class="text-gray-600">Aucune compétence évaluée pour le moment.</p>
              <p class="text-sm text-gray-500 mt-2">Commencez un quiz pour évaluer vos compétences !</p>
            </div>
          {:else}
            <!-- Stats globales -->
            {#if competenceStats}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white border rounded-xl shadow p-4 text-center">
                  <Target class="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p class="text-2xl font-bold text-gray-800">{competenceStats.avgMastery}%</p>
                  <p class="text-sm text-gray-500">Maîtrise moyenne</p>
                </div>
                <div class="bg-white border rounded-xl shadow p-4 text-center">
                  <TrendingUp class="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p class="text-2xl font-bold text-gray-800">{competenceStats.successRate}%</p>
                  <p class="text-sm text-gray-500">Taux de réussite</p>
                </div>
                <div class="bg-white border rounded-xl shadow p-4 text-center">
                  <Award class="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p class="text-2xl font-bold text-gray-800">{competenceStats.totalCorrect}</p>
                  <p class="text-sm text-gray-500">Bonnes réponses</p>
                </div>
                <div class="bg-white border rounded-xl shadow p-4 text-center">
                  <BookOpen class="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p class="text-2xl font-bold text-gray-800">{competenceStats.totalAnswers}</p>
                  <p class="text-sm text-gray-500">Questions répondues</p>
                </div>
              </div>
            {/if}

            <!-- Compétences générales -->
            {#if generalCompetences.length > 0}
              <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-purple-500"></span>
                  Compétences générales
                </h3>
                <div class="bg-white border rounded-xl shadow overflow-hidden">
                  <div class="divide-y">
                    {#each generalCompetences as comp}
                      <div class="p-4 flex items-center gap-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <span class="text-purple-700 font-bold text-sm">{comp.code}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between mb-1">
                            <p class="font-medium text-gray-800">{comp.name}</p>
                            <span class="text-sm font-medium {getMasteryColor(comp.mastery_level).replace('bg-', 'text-')}">
                              {comp.mastery_level}% - {getMasteryLabel(comp.mastery_level)}
                            </span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              class="h-2.5 rounded-full transition-all duration-500 {getMasteryColor(comp.mastery_level)}"
                              style="width: {comp.mastery_level}%"
                            ></div>
                          </div>
                          <p class="text-xs text-gray-500 mt-1">
                            {comp.correct_answers}/{comp.total_answers} réponses correctes
                          </p>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}

            <!-- Compétences par matière -->
            {#if Object.keys(competencesByMatiere).length > 0}
              <div class="space-y-6">
                {#each Object.entries(competencesByMatiere) as [matiereSlug, matiereCompetences]}
                  {@const stats = matiereStats[matiereSlug]}
                  <div>
                    <h3 class="text-lg font-medium text-gray-700 mb-3 flex items-center justify-between">
                      <span class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
                        {stats?.name || matiereSlug}
                      </span>
                      {#if stats}
                        <span class="text-sm font-normal text-gray-500">
                          Moyenne: {stats.avgMastery}%
                        </span>
                      {/if}
                    </h3>
                    <div class="bg-white border rounded-xl shadow overflow-hidden">
                      <div class="divide-y">
                        {#each matiereCompetences as comp}
                          <div class="p-4 flex items-center gap-4">
                            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span class="text-indigo-700 font-bold text-sm">{comp.code}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between mb-1">
                                <p class="font-medium text-gray-800">{comp.name}</p>
                                <span class="text-sm font-medium {getMasteryColor(comp.mastery_level).replace('bg-', 'text-')}">
                                  {comp.mastery_level}% - {getMasteryLabel(comp.mastery_level)}
                                </span>
                              </div>
                              <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  class="h-2.5 rounded-full transition-all duration-500 {getMasteryColor(comp.mastery_level)}"
                                  style="width: {comp.mastery_level}%"
                                ></div>
                              </div>
                              <p class="text-xs text-gray-500 mt-1">
                                {comp.correct_answers}/{comp.total_answers} réponses correctes
                              </p>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        {/if}
      </section>

      <!-- Quizzes grouped by theme -->
      <div class="space-y-8">
        {#each Array.from(new Set(quizzes.map(q => q.theme || 'Général'))) as theme}
          <section>
            <h2 class="text-xl font-semibold mb-3">Thème: {theme}</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {#each quizzes.filter(q => (q.theme || 'Général') === theme).sort((a,b) => (a.level||1)-(b.level||1)) as q}
                <div class="bg-white border rounded-xl shadow p-4">
                  <h3 class="font-bold">{q.title}</h3>
                  <p class="text-sm text-gray-600">Niveau {q.level || 1}</p>
                  {#if q.description}
                    <p class="text-sm text-gray-700 mt-1">{q.description}</p>
                  {/if}
                  <button class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white" onclick={() => playQuiz(q.slug)}>Commencer</button>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>

      <!-- User history -->
      <section class="mt-10">
        <h2 class="text-xl font-semibold mb-3">Historique</h2>
        {#if userResults.length === 0}
          <p class="text-gray-600">Aucun résultat pour le moment.</p>
        {:else}
          <div class="bg-white border rounded-xl shadow overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="text-left border-b">
                  <th class="p-3">Date</th>
                  <th class="p-3">Quiz</th>
                  <th class="p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {#each userResults as r}
                  <tr class="border-b">
                    <td class="p-3">{new Date(r.completedAt).toLocaleString()}</td>
                    <td class="p-3">{r.quizId}</td>
                    <td class="p-3">{r.score}/{r.totalQuestions}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/if}
  </div>
</main>
