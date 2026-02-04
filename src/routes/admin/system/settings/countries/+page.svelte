<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-svelte";

  let { data } = $props();

  // Search and pagination
  let searchQuery = $state('');
  let currentPage = $state(1);
  const itemsPerPage = 20;

  // Filtered countries
  let filteredCountries = $derived.by(() => {
    if (!searchQuery.trim()) return data.countries;
    const query = searchQuery.toLowerCase();
    return data.countries.filter((c: any) => 
      c.name_fr?.toLowerCase().includes(query) ||
      c.name_en?.toLowerCase().includes(query) ||
      c.code?.toLowerCase().includes(query)
    );
  });

  // Paginated countries
  let totalPages = $derived(Math.ceil(filteredCountries.length / itemsPerPage));
  let paginatedCountries = $derived.by(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCountries.slice(start, start + itemsPerPage);
  });

  // Reset page when search changes
  $effect(() => {
    searchQuery; // track
    currentPage = 1;
  });
</script>

<svelte:head>
  <title>Pays - Paramètres</title>
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
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Pays</h1>
        <p class="text-gray-400 mt-1">{data.countries.length} pays disponibles (noms en français et anglais)</p>
      </div>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Rechercher un pays..."
        class="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-800/50 border-b border-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300 w-16">Drapeau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300 w-20">Code</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Nom (FR)</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Nom (EN)</th>
        </tr>
      </thead>
      <tbody>
        {#each paginatedCountries as country (country.id)}
          <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
            <td class="px-6 py-3 text-2xl">{country.flag || ''}</td>
            <td class="px-6 py-3 text-sm font-mono text-gray-400">{country.code}</td>
            <td class="px-6 py-3 text-sm font-medium text-white">{country.name_fr}</td>
            <td class="px-6 py-3 text-sm text-gray-400">{country.name_en}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="px-6 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
        <p class="text-sm text-gray-400">
          Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredCountries.length)} sur {filteredCountries.length}
        </p>
        <div class="flex items-center gap-2">
          <button
            onclick={() => currentPage = Math.max(1, currentPage - 1)}
            disabled={currentPage === 1}
            class="p-2 rounded-lg hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm text-gray-400">Page {currentPage} / {totalPages}</span>
          <button
            onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
            disabled={currentPage === totalPages}
            class="p-2 rounded-lg hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
