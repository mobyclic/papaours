<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { loadAdminUser, isAuthenticated } from '$lib/stores/adminStore.svelte';
  import AdminSidebar from "$lib/components/admin-sidebar.svelte";
  
  let mounted = $state(false);
  
  let { data, children } = $props();
  
  // Afficher la sidebar sur toutes les pages admin
  let showSidebar = $derived(
    $page.url.pathname.startsWith('/admin')
  );
  
  onMount(() => {
    mounted = true;
    
    // Charger l'utilisateur depuis localStorage
    loadAdminUser();
    
    // TODO: Ajouter vérification d'authentification en production
    // const unsubscribe = isAuthenticated.subscribe(value => {
    //   // Ne pas rediriger depuis la page de login
    //   if (mounted && !value && $page.url.pathname !== '/admin') {
    //     goto('/admin');
    //   }
    // });
    
    // return unsubscribe;
  });
</script>

{#if showSidebar}
  <div class="flex h-screen bg-gray-50">
    <AdminSidebar {data} />
    <main class="flex-1 flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto">
        {@render children()}
      </div>
    </main>
  </div>
{:else}
  {@render children()}
{/if}
