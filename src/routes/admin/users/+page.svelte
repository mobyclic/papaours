<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Eye, Search, X } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data }: { data: PageData } = $props();

  let users = $derived(data.users || []);
  let classes = $derived(data.classes || []);
  let categories = $derived(data.categories || []);
  let search = $state('');
  let selectedClasseId = $state('');
  // svelte-ignore state_referenced_locally
  let selectedCategorySlug = $state(data.initialCategorySlug || '');
  
  // Synchroniser avec l'URL
  $effect(() => {
    const urlCategory = $page.url.searchParams.get('category') || '';
    if (urlCategory !== selectedCategorySlug) {
      selectedCategorySlug = urlCategory;
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
    
    // Filtre par catégorie (maternelle, primaire, collège, etc.)
    if (selectedCategorySlug) {
      result = result.filter(user => user.category_slug === selectedCategorySlug);
    }
    
    // Filtre par classe
    if (selectedClasseId) {
      result = result.filter(user => user.classe_id === selectedClasseId);
    }
    
    return result;
  });
  
  // Classes filtrées par catégorie sélectionnée
  let filteredClasses = $derived.by(() => {
    if (!selectedCategorySlug) return classes;
    // On filtre les classes dont les users correspondent à la catégorie
    const classIdsInCategory = new Set(
      users
        .filter(u => u.category_slug === selectedCategorySlug)
        .map(u => u.classe_id)
    );
    return classes.filter(c => classIdsInCategory.has(c.id));
  });
  
  function viewProfile(userId: string) {
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
    goto(`/admin/users/${cleanId}`);
  }
  
  function clearFilters() {
    selectedClasseId = '';
    selectedCategorySlug = '';
    search = '';
    goto('/admin/users');
  }
  
  function selectCategory(slug: string) {
    selectedCategorySlug = slug;
    selectedClasseId = ''; // Reset classe quand on change de catégorie
    if (slug) {
      goto(`/admin/users?category=${slug}`);
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
        <h1 class="text-3xl font-bold text-gray-900">Utilisateurs</h1>
        <p class="text-gray-600 mt-1">Gérez tous les utilisateurs de la plateforme</p>
      </div>
      <Button class="bg-blue-600 hover:bg-blue-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouvel utilisateur
      </Button>
    </div>
  </div>

  <!-- Search & Filters -->
  <div class="mb-6 flex flex-wrap gap-4">
    <!-- Recherche -->
    <div class="relative flex-1 min-w-[200px]">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher par nom, pseudo ou email..."
        bind:value={search}
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <!-- Filtre par catégorie -->
    <select
      value={selectedCategorySlug}
      onchange={(e) => selectCategory(e.currentTarget.value)}
      class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">Tous les niveaux</option>
      {#each categories as category}
        <option value={category.slug}>{category.name}</option>
      {/each}
    </select>
    
    <!-- Filtre par classe -->
    <div class="flex items-center gap-2">
      <select
        bind:value={selectedClasseId}
        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Toutes les classes</option>
        {#each filteredClasses as classe}
          <option value={classe.id}>{classe.name}</option>
        {/each}
      </select>
      
      {#if selectedClasseId || search || selectedCategorySlug}
        <button
          onclick={clearFilters}
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Réinitialiser les filtres"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Stats -->
  <div class="mb-4 text-sm text-gray-500">
    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
    {#if selectedClasseId || search || selectedCategorySlug}
      <span class="text-gray-400">(filtré{filteredUsers.length > 1 ? 's' : ''})</span>
    {/if}
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pseudo</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Classe</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredUsers as user (user.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user.prenom?.[0] || user.name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p class="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-gray-900 font-medium">@{user.pseudo || '-'}</span>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {user.grade_name || '-'}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
              {#if user.is_admin}
                <span class="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Admin
                </span>
              {/if}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button 
                  onclick={() => viewProfile(user.id)}
                  class="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" 
                  title="Voir le profil"
                >
                  <Eye class="w-4 h-4 text-blue-600" />
                </button>
                <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Éditer">
                  <Edit2 class="w-4 h-4 text-gray-600" />
                </button>
                <button class="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 class="w-4 h-4 text-red-600" />
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
