<script lang="ts">
  import { Heart } from 'lucide-svelte';
  import { currentUser } from '$lib/stores/userStore.svelte';

  let { 
    quizId, 
    isFavorite = false,
    size = 'md',
    onToggle
  }: { 
    quizId: string;
    isFavorite?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onToggle?: (newState: boolean) => void;
  } = $props();

  let loading = $state(false);
  // Use isFavorite prop as initial value, then manage locally
  // svelte-ignore state_referenced_locally
  let favorite = $state(isFavorite);

  // Sync when prop changes from parent
  $effect(() => {
    if (isFavorite !== favorite) {
      favorite = isFavorite;
    }
  });

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  async function toggleFavorite() {
    if (loading || !$currentUser) return;
    
    loading = true;
    
    try {
      const cleanUserId = $currentUser.id.includes(':') 
        ? $currentUser.id.split(':')[1] 
        : $currentUser.id;
      
      const method = favorite ? 'DELETE' : 'POST';
      
      const res = await fetch(`/api/users/${cleanUserId}/favorites`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId })
      });

      if (res.ok) {
        favorite = !favorite;
        onToggle?.(favorite);
      } else {
        const data = await res.json();
        // Si déjà favori et on essaie d'ajouter, sync state
        if (data.alreadyExists) {
          favorite = true;
        }
      }
    } catch (e) {
      console.error('Erreur toggle favori:', e);
    } finally {
      loading = false;
    }
  }
</script>

<button
  onclick={toggleFavorite}
  disabled={loading || !$currentUser}
  class="rounded-full transition-all {buttonSizeClasses[size]} 
    {favorite 
      ? 'bg-red-100 text-red-500 hover:bg-red-200' 
      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'}
    disabled:opacity-50 disabled:cursor-not-allowed"
  title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
>
  {#if loading}
    <div class="border-2 border-current border-t-transparent rounded-full animate-spin {sizeClasses[size]}"></div>
  {:else}
    <Heart class="{sizeClasses[size]} {favorite ? 'fill-current' : ''}" />
  {/if}
</button>
