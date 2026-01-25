<script lang="ts">
  import { Search, Filter, Info, AlertTriangle, AlertCircle, Check } from "lucide-svelte";

  // Données de test
  const logs = [
    { id: 1, type: 'info', message: 'Utilisateur connecté: marie.dupont@example.com', timestamp: '2025-01-21T14:32:00Z' },
    { id: 2, type: 'success', message: 'Quiz créé: Les bases des mathématiques', timestamp: '2025-01-21T14:28:00Z' },
    { id: 3, type: 'warning', message: 'Tentative de connexion échouée: unknown@test.com', timestamp: '2025-01-21T14:15:00Z' },
    { id: 4, type: 'info', message: 'Nouvel utilisateur inscrit: pierre.martin@example.com', timestamp: '2025-01-21T13:45:00Z' },
    { id: 5, type: 'error', message: 'Erreur de synchronisation base de données', timestamp: '2025-01-21T12:30:00Z' },
    { id: 6, type: 'success', message: 'Sauvegarde automatique effectuée', timestamp: '2025-01-21T12:00:00Z' },
    { id: 7, type: 'info', message: 'Configuration système mise à jour', timestamp: '2025-01-21T11:30:00Z' },
  ];

  function getIcon(type: string) {
    switch (type) {
      case 'success': return Check;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  }

  function getTypeClass(type: string) {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  }
</script>

<svelte:head>
  <title>Journal - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Journal d'activité</h1>
    <p class="text-gray-600 mt-1">Historique des événements système</p>
  </div>

  <!-- Filters -->
  <div class="flex gap-4 mb-6">
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher dans les logs..."
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
      <Filter class="w-4 h-4" />
      Filtrer
    </button>
  </div>

  <!-- Logs -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <div class="divide-y divide-gray-200">
      {#each logs as log (log.id)}
        {@const IconComponent = getIcon(log.type)}
        <div class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
          <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeClass(log.type)}`}>
            <IconComponent class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-900">{log.message}</p>
          </div>
          <p class="text-xs text-gray-400">
            {new Date(log.timestamp).toLocaleString('fr-FR')}
          </p>
        </div>
      {/each}
    </div>
  </div>
</div>
