<script lang="ts">
  import type { PageData } from './$types';
  import { adminUser } from '$lib/stores/adminStore.svelte';
  import { Users, BookOpen, Trophy, TrendingUp, Activity, BarChart3, ImageIcon, Layers, GraduationCap } from "lucide-svelte";

  let { data }: { data: PageData } = $props();
  
  let stats = $derived(data.stats || {
    totalQuiz: 0,
    activeQuiz: 0,
    totalQuestions: 0,
    activeQuestions: 0,
    totalMedia: 0,
    totalThemes: 0,
    totalSubjects: 0,
    recentResults: 0,
    totalUsers: 0
  });
</script>

<svelte:head>
  <title>Dashboard Admin - Kweez</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Tableau de bord</h1>
    <p class="text-gray-400 mt-2">Bienvenue dans l'administration Kweez</p>
  </div>

  <!-- Stats Cards - Première ligne -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Utilisateurs</p>
          <p class="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Users class="w-6 h-6 text-blue-400" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">inscrits sur la plateforme</p>
    </div>

    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Quiz</p>
          <p class="text-3xl font-bold text-white">{stats.totalQuiz}</p>
        </div>
        <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <BookOpen class="w-6 h-6 text-purple-400" />
        </div>
      </div>
      <p class="text-xs text-green-500 mt-2 flex items-center gap-1">
        <Activity class="w-3 h-3" /> {stats.activeQuiz} actifs
      </p>
    </div>

    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Questions</p>
          <p class="text-3xl font-bold text-white">{stats.totalQuestions}</p>
        </div>
        <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
          <BarChart3 class="w-6 h-6 text-green-400" />
        </div>
      </div>
      <p class="text-xs text-green-500 mt-2 flex items-center gap-1">
        <Activity class="w-3 h-3" /> {stats.activeQuestions} actives
      </p>
    </div>

    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Quiz cette semaine</p>
          <p class="text-3xl font-bold text-white">{stats.recentResults}</p>
        </div>
        <div class="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Trophy class="w-6 h-6 text-amber-400" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">résultats enregistrés</p>
    </div>
  </div>

  <!-- Stats Cards - Deuxième ligne -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Matières</p>
          <p class="text-3xl font-bold text-white">{stats.totalSubjects}</p>
        </div>
        <div class="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <GraduationCap class="w-6 h-6 text-indigo-400" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">disponibles</p>
    </div>

    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Thèmes</p>
          <p class="text-3xl font-bold text-white">{stats.totalThemes}</p>
        </div>
        <div class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
          <Layers class="w-6 h-6 text-cyan-400" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">catégories de quiz</p>
    </div>

    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Médias</p>
          <p class="text-3xl font-bold text-white">{stats.totalMedia}</p>
        </div>
        <div class="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
          <ImageIcon class="w-6 h-6 text-pink-400" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">images de questions</p>
    </div>

    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 mb-1">Taux d'activité</p>
          <p class="text-3xl font-bold text-white">
            {stats.totalQuiz > 0 ? Math.round((stats.activeQuiz / stats.totalQuiz) * 100) : 0}%
          </p>
        </div>
        <div class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <TrendingUp class="w-6 h-6 text-emerald-400" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">quiz actifs / total</p>
    </div>
  </div>

  <!-- Getting Started -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-gray-800">
    <h2 class="text-2xl font-bold text-white mb-4">Démarrage rapide</h2>
    <p class="text-gray-400 mb-6">Utilisez la barre latérale pour naviguer vers les différentes sections de l'administration :</p>
    <ul class="space-y-3 text-gray-300">
      <li class="flex items-start gap-3">
        <span class="text-purple-400 font-bold">📚</span>
        <span><strong class="text-white">Quiz</strong> - Gérez les quiz et les matières</span>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-blue-400 font-bold">👥</span>
        <span><strong class="text-white">Utilisateurs</strong> - Gérez les utilisateurs par niveau</span>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-400 font-bold">🖼️</span>
        <span><strong class="text-white">Médias</strong> - Gérez les photos, vidéos et autres fichiers</span>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-yellow-400 font-bold">⚙️</span>
        <span><strong class="text-white">Système</strong> - Paramètres et configuration de la plateforme</span>
      </li>
    </ul>
  </div>
</div>
