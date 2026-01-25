<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-svelte";

  const countries = [
    { id: 1, code: 'FR', name: 'France', flag: '🇫🇷', user_count: 850 },
    { id: 2, code: 'BE', name: 'Belgique', flag: '🇧🇪', user_count: 120 },
    { id: 3, code: 'CH', name: 'Suisse', flag: '🇨🇭', user_count: 95 },
    { id: 4, code: 'CA', name: 'Canada', flag: '🇨🇦', user_count: 180 },
    { id: 5, code: 'SN', name: 'Sénégal', flag: '🇸🇳', user_count: 45 },
  ];
</script>

<svelte:head>
  <title>Pays - Paramètres</title>
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
        <h1 class="text-3xl font-bold text-gray-900">Pays</h1>
        <p class="text-gray-600 mt-1">Gérez les pays disponibles</p>
      </div>
      <Button class="bg-orange-600 hover:bg-orange-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau pays
      </Button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Drapeau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utilisateurs</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each countries as country (country.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-2xl">{country.flag}</td>
            <td class="px-6 py-4 text-sm font-mono text-gray-600">{country.code}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{country.name}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{country.user_count}</td>
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
