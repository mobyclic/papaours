<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-svelte";

  const levels = [
    { id: 1, name: 'Débutant', order: 1, user_count: 450 },
    { id: 2, name: 'Intermédiaire', order: 2, user_count: 280 },
    { id: 3, name: 'Avancé', order: 3, user_count: 120 },
    { id: 4, name: 'Expert', order: 4, user_count: 45 },
    { id: 5, name: 'Maître', order: 5, user_count: 12 },
  ];
</script>

<svelte:head>
  <title>Niveaux - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/dashboard/system/settings" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Niveaux</h1>
        <p class="text-gray-600 mt-1">Gérez les niveaux de difficulté</p>
      </div>
      <Button class="bg-purple-600 hover:bg-purple-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau niveau
      </Button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ordre</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utilisateurs</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each levels as level (level.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <span class="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                {level.order}
              </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{level.name}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{level.user_count}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 class="w-4 h-4 text-gray-600" />
                </button>
                <button class="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
