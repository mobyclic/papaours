<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-svelte";

  const languages = [
    { id: 1, code: 'fr', name: 'Français', native: 'Français', is_default: true },
    { id: 2, code: 'en', name: 'Anglais', native: 'English', is_default: false },
    { id: 3, code: 'es', name: 'Espagnol', native: 'Español', is_default: false },
    { id: 4, code: 'de', name: 'Allemand', native: 'Deutsch', is_default: false },
    { id: 5, code: 'it', name: 'Italien', native: 'Italiano', is_default: false },
  ];
</script>

<svelte:head>
  <title>Langues - Paramètres</title>
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
        <h1 class="text-3xl font-bold text-gray-900">Langues</h1>
        <p class="text-gray-600 mt-1">Gérez les langues disponibles sur la plateforme</p>
      </div>
      <Button class="bg-red-600 hover:bg-red-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouvelle langue
      </Button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom natif</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each languages as language (language.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-sm font-mono text-gray-600">{language.code}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{language.name}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{language.native}</td>
            <td class="px-6 py-4 text-sm">
              {#if language.is_default}
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
