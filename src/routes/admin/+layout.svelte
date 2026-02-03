<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { loadAdminUser, isAuthenticated } from '$lib/stores/adminStore.svelte';
  import AdminSidebar from "$lib/components/admin-sidebar.svelte";
  
  let mounted = $state(false);
  
  let { data, children } = $props();
  
  // Ne pas afficher la sidebar sur la page de login
  let showSidebar = $derived(
    $page.url.pathname.startsWith('/admin') && !$page.url.pathname.startsWith('/admin/login')
  );
  
  onMount(() => {
    mounted = true;
    loadAdminUser();
  });
</script>

{#if showSidebar}
  <div class="dark flex h-screen bg-gray-950">
    <!-- Grid background pattern -->
    <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
    
    <AdminSidebar {data} />
    <main class="flex-1 flex flex-col overflow-hidden relative z-10">
      <div class="flex-1 overflow-y-auto">
        {@render children()}
      </div>
    </main>
  </div>
{:else}
  {@render children()}
{/if}
