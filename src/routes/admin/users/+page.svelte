<script lang="ts">
  import { onMount } from 'svelte';
  let users = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        users = data.users || [];
      } else {
        error = (await res.json()).message || 'Erreur de chargement';
      }
    } catch (e) {
      error = 'Erreur serveur';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Admin - Utilisateurs</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
  <h1 class="text-2xl font-bold mb-4">Utilisateurs</h1>
  {#if loading}
    <p>Chargement...</p>
  {:else if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
  {:else}
    <div class="bg-white border rounded-xl shadow">
      <table class="w-full">
        <thead>
          <tr class="text-left border-b">
            <th class="p-3">Email</th>
            <th class="p-3">Nom</th>
            <th class="p-3">Admin</th>
          </tr>
        </thead>
        <tbody>
          {#each users as u}
            <tr class="border-b">
              <td class="p-3">{u.email}</td>
              <td class="p-3">{u.name || '-'}</td>
              <td class="p-3">{u.is_admin ? 'Oui' : 'Non'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
