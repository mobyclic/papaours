<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Eye, Search } from "lucide-svelte";

  let { data }: { data: PageData } = $props();

  let users = $derived(data.users || []);
  let search = $state('');

  let filteredUsers = $derived.by(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(user =>
      user.email?.toLowerCase().includes(s) ||
      user.first_name?.toLowerCase().includes(s) ||
      user.last_name?.toLowerCase().includes(s) ||
      user.level?.toLowerCase().includes(s)
    );
  });
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

  <!-- Search -->
  <div class="mb-6">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher un utilisateur..."
        bind:value={search}
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utilisateur</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Niveau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Points</th>
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
                  {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {user.first_name || ''} {user.last_name || ''}
                  </p>
                  <p class="text-xs text-gray-500">Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{user.email}</td>
            <td class="px-6 py-4 text-sm">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {user.level || 'Débutant'}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{user.points || 0}</td>
            <td class="px-6 py-4 text-sm">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                  <Eye class="w-4 h-4 text-gray-600" />
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
