<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { adminUser, logout } from '$lib/stores/adminStore';
  
  let stats = $state({
    totalQuiz: 0,
    activeQuiz: 0,
    totalQuestions: 0,
    activeQuestions: 0,
    totalMedia: 0,
    recentResults: 0
  });
  
  onMount(async () => {
    // Charger les statistiques
    await loadStats();
  });

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  function handleLogout() {
    logout();
    goto('/admin');
  }
</script>

<svelte:head>
  <title>Dashboard Admin - Papa Ours</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">🐻 Papa Ours Admin</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">
            {$adminUser?.name || $adminUser?.email}
          </span>
          <button
            onclick={handleLogout}
            class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p class="text-sm text-gray-600 mb-1">Questions totales</p>
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
            <p class="text-sm text-gray-600 mb-1">Médias</p>
            <p class="text-3xl font-bold text-blue-600">{stats.totalMedia}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🖼️</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Résultats récents</p>
            <p class="text-3xl font-bold text-pink-600">{stats.recentResults}</p>
          </div>
          <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📊</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <button
        onclick={() => goto('/admin/quiz')}
        class="bg-white rounded-xl shadow p-8 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left group"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-3xl">
            📚
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              Gérer les quiz
            </h3>
            <p class="text-gray-600 mt-1">
              Créer, modifier et organiser vos quiz
            </p>
          </div>
        </div>
      </button>

      <button
        onclick={() => goto('/admin/questions')}
        class="bg-white rounded-xl shadow p-8 border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-3xl">
            📝
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
              Gérer les questions
            </h3>
            <p class="text-gray-600 mt-1">
              Ajouter, modifier ou supprimer des questions
            </p>
          </div>
        </div>
      </button>

      <button
        onclick={() => goto('/admin/media')}
        class="bg-white rounded-xl shadow p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left group"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-3xl">
            🖼️
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Bibliothèque média
            </h3>
            <p class="text-gray-600 mt-1">
              Gérer les images hébergées sur Cloudflare R2
            </p>
          </div>
        </div>
      </button>
    </div>
  </div>
</div>
