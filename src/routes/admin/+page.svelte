<script lang="ts">
  import type { PageData } from './$types';
  import { adminUser } from '$lib/stores/adminStore.svelte';

  let { data }: { data: PageData } = $props();
  
  let stats = $derived(data.stats || {
    totalQuiz: 0,
    activeQuiz: 0,
    totalQuestions: 0,
    activeQuestions: 0,
    totalMedia: 0,
    totalThemes: 0,
    totalMatieres: 0,
    recentResults: 0,
    totalUsers: 0
  });
</script>

<svelte:head>
  <title>Dashboard Admin - Papa Ours</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold text-gray-900">Tableau de bord</h1>
    <p class="text-gray-600 mt-2">Bienvenue dans l'administration Papa Ours</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow p-6 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Quiz</p>
          <p class="text-3xl font-bold text-gray-900">{stats.totalQuiz}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <span class="text-2xl">📚</span>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">{stats.activeQuiz} actifs</p>
    </div>

    <div class="bg-white rounded-xl shadow p-6 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Questions</p>
          <p class="text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <span class="text-2xl">📝</span>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">{stats.activeQuestions} actives</p>
    </div>

    <div class="bg-white rounded-xl shadow p-6 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Thèmes</p>
          <p class="text-3xl font-bold text-gray-900">{stats.totalThemes}</p>
        </div>
        <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🏷️</span>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">{stats.totalMatieres} matières</p>
    </div>

    <div class="bg-white rounded-xl shadow p-6 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Médias</p>
          <p class="text-3xl font-bold text-gray-900">{stats.totalMedia}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🖼️</span>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">images de questions</p>
    </div>
  </div>

  <!-- Getting Started -->
  <div class="bg-white rounded-xl shadow p-8 border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Démarrage rapide</h2>
    <p class="text-gray-600 mb-6">Utilisez la barre latérale pour naviguer vers les différentes sections de l'administration :</p>
    <ul class="space-y-3 text-gray-600">
      <li class="flex items-start gap-3">
        <span class="text-purple-600 font-bold">📚</span>
        <span><strong>Quiz</strong> - Gérez les quiz et les matières</span>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-blue-600 font-bold">👥</span>
        <span><strong>Utilisateurs</strong> - Gérez les utilisateurs par niveau</span>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-600 font-bold">🖼️</span>
        <span><strong>Médias</strong> - Gérez les photos, vidéos et autres fichiers</span>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-yellow-600 font-bold">⚙️</span>
        <span><strong>Système</strong> - Paramètres, statistiques et journal d'activité</span>
      </li>
    </ul>
  </div>
</div>
