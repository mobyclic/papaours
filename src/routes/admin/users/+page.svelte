<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Eye, Search, X } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data }: { data: PageData } = $props();

  let users = $derived(data.users || []);
  let grades = $derived(data.grades || []);
  let cycles = $derived(data.cycles || []);
  let search = $state('');
  let selectedGradeId = $state('');
  // svelte-ignore state_referenced_locally
  let selectedCycleCode = $state(data.initialCycleCode || '');
  
  // Synchroniser avec l'URL
  $effect(() => {
    const urlCycle = $page.url.searchParams.get('cycle') || '';
    if (urlCycle !== selectedCycleCode) {
      selectedCycleCode = urlCycle;
    }
  });

  let filteredUsers = $derived.by(() => {
    let result = users;
    
    // Filtre par recherche
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(user =>
        user.name?.toLowerCase().includes(s) ||
        user.pseudo?.toLowerCase().includes(s) ||
        user.email?.toLowerCase().includes(s)
      );
    }
    
    // Filtre par cycle
    if (selectedCycleCode) {
      result = result.filter(user => user.cycle_code === selectedCycleCode);
    }
    
    // Filtre par grade
    if (selectedGradeId) {
      result = result.filter(user => user.grade_id === selectedGradeId);
    }
    
    return result;
  });
  
  // Grades filtrés par cycle sélectionné
  let filteredGrades = $derived.by(() => {
    if (!selectedCycleCode) return grades;
    // On filtre les grades dont les users correspondent au cycle
    const gradeIdsInCycle = new Set(
      users
        .filter(u => u.cycle_code === selectedCycleCode)
        .map(u => u.grade_id)
    );
    return grades.filter((g: any) => gradeIdsInCycle.has(g.id));
  });
  
  function viewProfile(userId: string) {
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
    goto(`/admin/users/${cleanId}`);
  }
  
  function clearFilters() {
    selectedGradeId = '';
    selectedCycleCode = '';
    search = '';
    goto('/admin/users');
  }
  
  function selectCycle(code: string) {
    selectedCycleCode = code;
    selectedGradeId = ''; // Reset grade quand on change de cycle
    if (code) {
      goto(`/admin/users?cycle=${code}`);
    } else {
      goto('/admin/users');
    }
  }
</script>

<svelte:head>
  <title>Utilisateurs - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Utilisateurs</h1>
        <p class="text-gray-400 mt-2">Gérez tous les utilisateurs de la plateforme</p>
      </div>
      <Button class="bg-blue-600 hover:bg-blue-700 text-white">
        <Plus class="w-4 h-4 mr-2" />
        Nouvel utilisateur
      </Button>
    </div>
  </div>

  <!-- Search & Filters -->
  <div class="mb-6 flex flex-wrap gap-4">
    <!-- Recherche -->
    <div class="relative flex-1 min-w-[200px]">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Rechercher par nom, pseudo ou email..."
        bind:value={search}
        class="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    
    <!-- Filtre par cycle -->
    <select
      value={selectedCycleCode}
      onchange={(e) => selectCycle(e.currentTarget.value)}
      class="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Tous les cycles</option>
      {#each cycles as cycle}
        <option value={cycle.code}>{cycle.name}</option>
      {/each}
    </select>
    
    <!-- Filtre par grade -->
    <div class="flex items-center gap-2">
      <select
        bind:value={selectedGradeId}
        class="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Toutes les classes</option>
        {#each filteredGrades as grade}
          <option value={grade.id}>{grade.name}</option>
        {/each}
      </select>
      
      {#if selectedGradeId || search || selectedCycleCode}
        <button
          onclick={clearFilters}
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Réinitialiser les filtres"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Stats -->
  <div class="mb-4 text-sm text-gray-400">
    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
    {#if selectedGradeId || search || selectedCycleCode}
      <span class="text-gray-500">(filtré{filteredUsers.length > 1 ? 's' : ''})</span>
    {/if}
  </div>

  <!-- Table -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-800/50 border-b border-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Pseudo</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Classe</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredUsers as user (user.id)}
          <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user.prenom?.[0] || user.name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p class="text-sm font-medium text-white">
                    {user.name}
                  </p>
                  <p class="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-gray-300 font-medium">@{user.pseudo || '-'}</span>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {user.grade_name || '-'}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
              }`}>
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
              {#if user.is_admin}
                <span class="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admin
                </span>
              {/if}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button 
                  onclick={() => viewProfile(user.id)}
                  class="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors" 
                  title="Voir le profil"
                >
                  <Eye class="w-4 h-4 text-blue-400" />
                </button>
                <button class="p-1.5 hover:bg-gray-700 rounded-lg transition-colors" title="Éditer">
                  <Edit2 class="w-4 h-4 text-gray-400" />
                </button>
                <button class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 class="w-4 h-4 text-red-400" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if filteredUsers.length === 0}
      <div class="px-6 py-12 text-center">
        <p class="text-gray-500 text-sm">Aucun utilisateur trouvé</p>
      </div>
    {/if}
  </div>
</div>
