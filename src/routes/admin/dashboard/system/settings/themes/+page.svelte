<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-svelte";

  const themes = [
    { id: 1, name: 'Classique', description: 'Thème par défaut', is_default: true },
    { id: 2, name: 'Sombre', description: 'Thème sombre pour les yeux', is_default: false },
    { id: 3, name: 'Enfant', description: 'Couleurs vives pour les enfants', is_default: false },
    { id: 4, name: 'High Contrast', description: 'Contraste élevé pour l\'accessibilité', is_default: false },
  ];
</script>

<svelte:head>
  <title>Thèmes - Paramètres</title>
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
        <h1 class="text-3xl font-bold text-gray-900">Thèmes</h1>
        <p class="text-gray-600 mt-1">Gérez les thèmes visuels de la plateforme</p>
      </div>
      <Button class="bg-green-600 hover:bg-green-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau thème
      </Button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each themes as theme (theme.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{theme.name}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{theme.description}</td>
            <td class="px-6 py-4 text-sm">
              {#if theme.is_default}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Par défaut
                </span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Actif
                </span>
              {/if}
            </td>
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
