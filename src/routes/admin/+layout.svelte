<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { loadAdminUser, isAuthenticated } from '$lib/stores/adminStore.svelte';
  import * as Sidebar from "$lib/components/ui/sidebar";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  
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
  <div class="dark">
    <!-- Grid Background like frontend -->
    <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0"></div>
    
    <Sidebar.Provider>
      <AppSidebar {data} />
      <Sidebar.Inset>
        <!-- Header avec trigger et breadcrumb -->
        <header class="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-sm px-4 relative z-10">
          <Sidebar.Trigger class="-ml-1" />
          <div class="h-4 w-px bg-sidebar-border"></div>
          <div class="flex items-center gap-2 text-sm">
            <span class="font-semibold text-sidebar-foreground">Kweez Admin</span>
          </div>
        </header>
        
        <!-- Contenu principal -->
        <main class="flex-1 overflow-y-auto p-4 bg-background/50 backdrop-blur-sm min-h-[calc(100vh-3.5rem)] relative z-10">
          {@render children()}
        </main>
      </Sidebar.Inset>
    </Sidebar.Provider>
  </div>
{:else}
  {@render children()}
{/if}
