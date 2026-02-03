<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft, Edit2, Trophy, Target, Clock, Star, BookOpen, TrendingUp, Award } from "lucide-svelte";

  let { data }: { data: PageData } = $props();
  
  const user = $derived(data.user);
  const stats = $derived(data.stats);
  const themeProgress = $derived(data.themeProgress || []);
  const matiereProgress = $derived(data.matiereProgress || []);
  const recentQuizResults = $derived(data.recentQuizResults || []);
  
  const niveauColors: Record<string, string> = {
    'débutant': 'bg-gray-100 text-gray-800',
    'apprenti': 'bg-blue-100 text-blue-800',
    'confirmé': 'bg-green-100 text-green-800',
    'expert': 'bg-purple-100 text-purple-800',
    'maître': 'bg-amber-100 text-amber-800'
  };
  
  const niveauEmojis: Record<string, string> = {
    'débutant': '🌱',
    'apprenti': '📚',
    'confirmé': '⭐',
    'expert': '🏆',
    'maître': '👑'
  };
  
  function formatDate(date: string | Date | undefined) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  function calculateAge(dateNaissance: string | Date | undefined) {
    if (!dateNaissance) return null;
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
</script>

<svelte:head>
  <title>{user.name} - Profil utilisateur</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/users" class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
      <ArrowLeft class="w-4 h-4" />
      Retour aux utilisateurs
    </a>
    
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          {(user.prenom?.[0] || user.name?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{user.name}</h1>
          <p class="text-gray-500">@{user.pseudo || 'sans-pseudo'}</p>
          <div class="flex items-center gap-3 mt-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {user.grade_name || 'Niveau non défini'}
            </span>
            {#if user.is_admin}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Admin
              </span>
            {/if}
            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>
      <Button variant="outline">
        <Edit2 class="w-4 h-4 mr-2" />
        Modifier
      </Button>
    </div>
  </div>
  
  <!-- Info Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Trophy class="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Points totaux</p>
          <p class="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Quiz complétés</p>
          <p class="text-2xl font-bold text-gray-900">{stats.totalQuizCompleted}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Target class="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Score moyen</p>
          <p class="text-2xl font-bold text-gray-900">{stats.avgScore}%</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Award class="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Niveau global</p>
          <p class="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
            <span>{niveauEmojis[stats.globalLevel] || '🌱'}</span>
            {stats.globalLevel}
          </p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- User Details -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <!-- Informations personnelles -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
      <dl class="space-y-3">
        <div>
          <dt class="text-sm text-gray-500">Email</dt>
          <dd class="text-sm font-medium text-gray-900">{user.email}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">Date de naissance</dt>
          <dd class="text-sm font-medium text-gray-900">
            {formatDate(user.date_naissance)}
            {#if calculateAge(user.date_naissance)}
              <span class="text-gray-500">({calculateAge(user.date_naissance)} ans)</span>
            {/if}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">Niveau</dt>
          <dd class="text-sm font-medium text-gray-900">{user.grade_name || '-'}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">Inscrit le</dt>
          <dd class="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</dd>
        </div>
      </dl>
    </div>
    
    <!-- Progression par matière -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Progression par matière</h2>
      {#if matiereProgress.length > 0}
        <div class="space-y-4">
          {#each matiereProgress as matiere}
            <div>
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-medium text-gray-900">{matiere.name}</p>
                <span class="text-sm font-bold text-indigo-600">{matiere.points} pts</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span>{matiere.themes} thème{matiere.themes > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{matiere.quizzes_completed} quiz</span>
                <span>•</span>
                <span class={`px-1.5 py-0.5 rounded ${niveauColors[matiere.best_niveau] || 'bg-gray-100'}`}>
                  {niveauEmojis[matiere.best_niveau] || '🌱'} {matiere.best_niveau}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-gray-500">Aucune progression enregistrée</p>
      {/if}
    </div>
    
    <!-- Progression par thème -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Top thèmes</h2>
      {#if themeProgress.length > 0}
        <div class="space-y-3">
          {#each themeProgress.slice(0, 5) as progress}
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">{progress.theme_name}</p>
                <div class="flex items-center gap-2 text-xs">
                  <span class={`px-1.5 py-0.5 rounded ${niveauColors[progress.niveau] || 'bg-gray-100'}`}>
                    {niveauEmojis[progress.niveau] || '🌱'} {progress.niveau}
                  </span>
                  <span class="text-gray-500">{progress.correct_answers}/{progress.total_answers} bonnes rép.</span>
                </div>
              </div>
              <span class="text-sm font-bold text-green-600">{progress.points} pts</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-gray-500">Aucune progression enregistrée</p>
      {/if}
    </div>
  </div>
  <!-- Recent Quiz Results -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Derniers quiz</h2>
    {#if recentQuizResults.length > 0}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200">
            <tr>
              <th class="text-left text-sm font-medium text-gray-500 pb-3">Quiz</th>
              <th class="text-left text-sm font-medium text-gray-500 pb-3">Score</th>
              <th class="text-left text-sm font-medium text-gray-500 pb-3">Réponses</th>
              <th class="text-left text-sm font-medium text-gray-500 pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {#each recentQuizResults as result}
              <tr class="border-b border-gray-100">
                <td class="py-3 text-sm font-medium text-gray-900">{result.quiz_title}</td>
                <td class="py-3">
                  <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    result.score >= 80 ? 'bg-green-100 text-green-800' :
                    result.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.score}%
                  </span>
                </td>
                <td class="py-3 text-sm text-gray-600">
                  {Math.round((result.score / 100) * result.total_questions)}/{result.total_questions}
                </td>
                <td class="py-3 text-sm text-gray-500">{formatDate(result.completed_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-sm text-gray-500">Aucun quiz complété</p>
    {/if}
  </div>
</div>
