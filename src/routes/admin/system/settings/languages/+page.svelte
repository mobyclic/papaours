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
    <a href="/admin/system/settings" class="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Langues</h1>
        <p class="text-gray-400 mt-1">Langues disponibles sur la plateforme (Français et Anglais uniquement)</p>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-800/50 border-b border-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Drapeau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Code</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Nom (FR)</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Nom (EN)</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Statut</th>
        </tr>
      </thead>
      <tbody>
        {#each data.languages as language (language.id)}
          <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
            <td class="px-6 py-4 text-2xl">{language.flag || ''}</td>
            <td class="px-6 py-4 text-sm font-mono text-gray-400 uppercase">{language.code}</td>
            <td class="px-6 py-4 text-sm font-medium text-white">{language.name_fr}</td>
            <td class="px-6 py-4 text-sm text-gray-400">{language.name_en}</td>
            <td class="px-6 py-4 text-sm">
              {#if language.is_default}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  Par défaut
                </span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                  Actif
                </span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
    <p class="text-sm text-blue-300">
      <strong>Note :</strong> Seuls le Français et l'Anglais sont disponibles sur cette plateforme.
    </p>
  </div>
</div>
