<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { 
    Heart, ChevronLeft, Trash2, Star, BookOpen, ExternalLink
  } from 'lucide-svelte';

  interface Favorite {
    id: string;
    quizId: string;
    quizTitle: string;
    quizSlug: string;
    quizDescription?: string;
    quizCover?: string;
    quizDifficulty: number;
    matiereName?: string;
    matiereColor?: string;
    createdAt: string;
    notes?: string;
  }

  let favorites = $state<Favorite[]>([]);
  let loading = $state(true);
  let removing = $state<string | null>(null);

  const matiereColors: Record<string, string> = {
    'Mathématiques': 'from-blue-400 to-blue-600',
    'Français': 'from-red-400 to-red-600',
    'Histoire': 'from-amber-400 to-amber-600',
    'Géographie': 'from-green-400 to-green-600',
    'Sciences': 'from-purple-400 to-purple-600',
    'Physique-Chimie': 'from-cyan-400 to-cyan-600',
    'SVT': 'from-lime-400 to-lime-600',
    'Anglais': 'from-pink-400 to-pink-600',
    'Musique': 'from-indigo-400 to-indigo-600',
    'default': 'from-gray-400 to-gray-600'
  };

  onMount(async () => {
    loadUser();
    if (!$currentUser) {
      goto('/');
      return;
    }
    await loadFavorites();
  });

  async function loadFavorites() {
    loading = true;
    try {
      const cleanId = $currentUser?.id.includes(':') 
        ? $currentUser.id.split(':')[1] 
        : $currentUser?.id;
      
      const res = await fetch(`/api/users/${cleanId}/favorites`);
      if (res.ok) {
        const data = await res.json();
        favorites = data.favorites;
      }
    } catch (e) {
      console.error('Erreur:', e);
    } finally {
      loading = false;
    }
  }

  async function removeFavorite(quizId: string) {
    if (removing) return;
    removing = quizId;

    try {
      const cleanUserId = $currentUser?.id.includes(':') 
        ? $currentUser.id.split(':')[1] 
        : $currentUser?.id;
      
      const res = await fetch(`/api/users/${cleanUserId}/favorites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId })
      });

      if (res.ok) {
        favorites = favorites.filter(f => f.quizId !== quizId);
      }
    } catch (e) {
      console.error('Erreur:', e);
    } finally {
      removing = null;
    }
  }

  function getMatiereGradient(matiereName?: string): string {
    if (!matiereName) return matiereColors['default'];
    return matiereColors[matiereName] || matiereColors['default'];
  }

  function getDifficultyStars(level: number): string {
    return '⭐'.repeat(level || 1);
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
</script>

<svelte:head>
  <title>Mes Favoris - Kweez</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50">
  <div class="max-w-5xl mx-auto p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <button
        onclick={() => goto('/dashboard')}
        class="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
      >
        <ChevronLeft class="w-5 h-5" />
        <span>Retour</span>
      </button>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Heart class="w-8 h-8 text-red-500 fill-red-500" />
        Mes Quiz Favoris
      </h1>
      <p class="text-gray-600 mt-1">{favorites.length} quiz sauvegardé{favorites.length !== 1 ? 's' : ''}</p>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-red-500"></div>
      </div>
    {:else if favorites.length === 0}
      <div class="bg-white rounded-xl shadow-sm p-12 text-center">
        <Heart class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Aucun favori</h2>
        <p class="text-gray-500 mb-4">Tu n'as pas encore ajouté de quiz à tes favoris.</p>
        <button
          onclick={() => goto('/explore')}
          class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700"
        >
          Explorer les quiz
        </button>
      </div>
    {:else}
      <div class="space-y-4">
        {#each favorites as fav}
          <div class="bg-white rounded-xl shadow-sm overflow-hidden flex group">
            <!-- Cover -->
            <div class="w-32 md:w-48 flex-shrink-0 bg-gradient-to-br {getMatiereGradient(fav.matiereName)} relative">
              {#if fav.quizCover}
                <img 
                  src={fav.quizCover} 
                  alt={fav.quizTitle}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="absolute inset-0 flex items-center justify-center opacity-20">
                  <BookOpen class="w-16 h-16 text-white" />
                </div>
              {/if}
            </div>

            <!-- Content -->
            <div class="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h3 class="font-semibold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                      {fav.quizTitle}
                    </h3>
                    {#if fav.matiereName}
                      <span class="text-sm text-gray-500">{fav.matiereName}</span>
                    {/if}
                  </div>
                  <span class="text-sm">{getDifficultyStars(fav.quizDifficulty)}</span>
                </div>

                {#if fav.quizDescription}
                  <p class="text-sm text-gray-600 mt-2 line-clamp-2">{fav.quizDescription}</p>
                {/if}

                <p class="text-xs text-gray-400 mt-2">
                  Ajouté le {formatDate(fav.createdAt)}
                </p>
              </div>

              <div class="flex items-center gap-2 mt-3">
                <button
                  onclick={() => goto(`/quiz/${fav.quizSlug}`)}
                  class="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2"
                >
                  <ExternalLink class="w-4 h-4" />
                  Jouer
                </button>
                <button
                  onclick={() => removeFavorite(fav.quizId)}
                  disabled={removing === fav.quizId}
                  class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Retirer des favoris"
                >
                  {#if removing === fav.quizId}
                    <div class="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  {:else}
                    <Trash2 class="w-5 h-5" />
                  {/if}
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</main>
