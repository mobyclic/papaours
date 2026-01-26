<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-svelte";

  let { data } = $props();
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
        <p class="text-gray-600 mt-1">Langues disponibles sur la plateforme (Français et Anglais uniquement)</p>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Drapeau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom (FR)</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom (EN)</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
        </tr>
      </thead>
      <tbody>
        {#each data.languages as language (language.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-2xl">{language.flag || ''}</td>
            <td class="px-6 py-4 text-sm font-mono text-gray-600 uppercase">{language.code}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{language.name_fr}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{language.name_en}</td>
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
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <p class="text-sm text-blue-700">
      <strong>Note :</strong> Seuls le Français et l'Anglais sont disponibles sur cette plateforme.
    </p>
  </div>
</div>
