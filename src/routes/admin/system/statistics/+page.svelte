<script lang="ts">
  import { BarChart3, Users, BookOpen, Trophy, TrendingUp, Activity } from "lucide-svelte";
</script>

<svelte:head>
  <title>Statistiques - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Statistiques</h1>
    <p class="text-gray-600 mt-1">Aperçu des performances de la plateforme</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Utilisateurs</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">1,234</p>
          <p class="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> +12% ce mois
          </p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users class="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Quiz complétés</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">5,678</p>
          <p class="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> +8% ce mois
          </p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <BookOpen class="w-6 h-6 text-purple-600" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Score moyen</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">78%</p>
          <p class="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> +3% ce mois
          </p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Trophy class="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Sessions actives</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">89</p>
          <p class="text-sm text-gray-500 mt-1">En ce moment</p>
        </div>
        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <Activity class="w-6 h-6 text-orange-600" />
        </div>
      </div>
    </div>
  </div>

  <!-- Charts placeholders -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 class="w-5 h-5 text-gray-500" />
        Activité par matière
      </h3>
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p class="text-gray-400">Graphique à venir</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-gray-500" />
        Progression des inscriptions
      </h3>
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p class="text-gray-400">Graphique à venir</p>
      </div>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
    <div class="space-y-4">
      <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Users class="w-5 h-5 text-blue-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">Nouvel utilisateur inscrit</p>
          <p class="text-xs text-gray-500">Marie Dupont a créé un compte</p>
        </div>
        <p class="text-xs text-gray-400">Il y a 5 min</p>
      </div>
      <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-purple-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">Quiz terminé</p>
          <p class="text-xs text-gray-500">Pierre Martin a complété "Les bases des mathématiques"</p>
        </div>
        <p class="text-xs text-gray-400">Il y a 12 min</p>
      </div>
      <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Trophy class="w-5 h-5 text-green-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">Nouveau record</p>
          <p class="text-xs text-gray-500">Sophie Bernard a atteint le niveau Expert</p>
        </div>
        <p class="text-xs text-gray-400">Il y a 30 min</p>
      </div>
    </div>
  </div>
</div>
