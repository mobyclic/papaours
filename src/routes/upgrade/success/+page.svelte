<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { currentUser, setUser, loadUser } from '$lib/stores/userStore.svelte';
  import { Check, PartyPopper, ArrowRight } from 'lucide-svelte';
  
  let loading = $state(true);
  let error = $state('');
  let plan = $state('');

  onMount(async () => {
    loadUser();
    
    const sessionId = $page.url.searchParams.get('session_id');
    
    if (!sessionId) {
      goto('/upgrade');
      return;
    }

    // Vérifier la session et mettre à jour l'utilisateur
    try {
      const res = await fetch(`/api/subscription/verify?session_id=${sessionId}`);
      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur de vérification';
        loading = false;
        return;
      }

      plan = data.plan;

      // Mettre à jour le store utilisateur
      if ($currentUser && data.user) {
        setUser({
          ...$currentUser,
          profile_type: data.user.profile_type,
          tutor_slug: data.user.tutor_slug
        });
      }

      loading = false;

    } catch (err) {
      console.error(err);
      error = 'Erreur de connexion';
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Abonnement activé ! - Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
    {#if loading}
      <div class="p-12 text-center">
        <div class="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600">Vérification de votre abonnement...</p>
      </div>
    {:else if error}
      <div class="p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">❌</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Oups !</h1>
        <p class="text-gray-600 mb-6">{error}</p>
        <a 
          href="/upgrade"
          class="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800"
        >
          Réessayer
        </a>
      </div>
    {:else}
      <div class="p-8 text-center">
        <!-- Success animation -->
        <div class="relative mb-6">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto">
            <Check class="w-10 h-10 text-white" />
          </div>
          <div class="absolute -top-2 -right-2 text-3xl animate-bounce">
            <PartyPopper class="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue dans le plan {plan === 'tutor' ? 'Tuteur' : 'Établissement'} !
        </h1>
        <p class="text-gray-600 mb-8">
          Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités.
        </p>

        <!-- What's next -->
        <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <h3 class="font-semibold text-gray-900 mb-3">Prochaines étapes :</h3>
          <ul class="space-y-2">
            {#if plan === 'tutor'}
              <li class="flex items-center gap-2 text-sm text-gray-700">
                <Check class="w-4 h-4 text-green-500" />
                Créez vos premiers apprenants
              </li>
              <li class="flex items-center gap-2 text-sm text-gray-700">
                <Check class="w-4 h-4 text-green-500" />
                Partagez leur code de connexion
              </li>
              <li class="flex items-center gap-2 text-sm text-gray-700">
                <Check class="w-4 h-4 text-green-500" />
                Suivez leur progression
              </li>
            {:else}
              <li class="flex items-center gap-2 text-sm text-gray-700">
                <Check class="w-4 h-4 text-green-500" />
                Invitez vos tuteurs
              </li>
              <li class="flex items-center gap-2 text-sm text-gray-700">
                <Check class="w-4 h-4 text-green-500" />
                Créez vos classes
              </li>
              <li class="flex items-center gap-2 text-sm text-gray-700">
                <Check class="w-4 h-4 text-green-500" />
                Organisez des examens
              </li>
            {/if}
          </ul>
        </div>

        <a 
          href={plan === 'tutor' ? '/dashboard/tutor' : '/dashboard/establishment'}
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          Commencer
          <ArrowRight class="w-5 h-5" />
        </a>
      </div>
    {/if}
  </div>
</div>
