<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { loadAdminUser, isAuthenticated } from '$lib/stores/adminStore';
  
  let mounted = $state(false);
  
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

  let { children } = $props<{ children: any }>();
</script>

{@render children()}
