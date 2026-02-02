<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { Users, School, Check, ArrowLeft, Zap, Crown, Building } from 'lucide-svelte';
  
  let loading = $state(false);
  let error = $state('');
  let selectedPlan = $state<'tutor' | 'establishment' | null>(null);
  let canceled = $state(false);

  const plans = [
    {
      slug: 'tutor' as const,
      name: 'Tuteur',
      price: '5€',
      period: '/mois',
      description: 'Idéal pour les parents et professeurs particuliers',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-500',
      features: [
        'Tout le plan Apprenant',
        'Créer jusqu\'à 5 apprenants',
        'Créer vos propres quiz',
        'Suivi de progression détaillé',
        'Page tuteur personnalisée',
        'Support par email'
      ]
    },
    {
      slug: 'establishment' as const,
      name: 'Établissement',
      price: '20€',
      period: '/mois',
      description: 'Solution complète pour les écoles et centres de formation',
      icon: Building,
      color: 'from-purple-500 to-pink-600',
      borderColor: 'border-purple-500',
      popular: true,
      features: [
        'Tout le plan Tuteur',
        '5 tuteurs inclus (+5€/tuteur supplémentaire)',
        'Apprenants illimités',
        'Gestion des classes',
        'Examens en ligne avec surveillance',
        'Statistiques avancées',
        'Export des données',
        'Support prioritaire'
      ]
    }
  ];

  onMount(() => {
    loadUser();
    canceled = $page.url.searchParams.get('canceled') === 'true';
  });

  async function startCheckout(plan: 'tutor' | 'establishment') {
    loading = true;
    error = '';
    selectedPlan = plan;

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur lors de la création du paiement';
        return;
      }

      // Rediriger vers Stripe Checkout
      window.location.href = data.checkoutUrl;

    } catch (err) {
      console.error(err);
      error = 'Erreur de connexion';
    } finally {
      loading = false;
      selectedPlan = null;
    }
  }
</script>

<svelte:head>
  <title>Passer à un forfait supérieur - Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <a href="/dashboard" class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft class="w-4 h-4" />
        Retour au tableau de bord
      </a>
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-4">
          <Zap class="w-4 h-4" />
          Débloquez plus de fonctionnalités
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Choisissez votre forfait
        </h1>
        <p class="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Accompagnez vos apprenants avec des outils puissants et un suivi personnalisé
        </p>
      </div>
    </div>

    {#if canceled}
      <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-center">
        Le paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.
      </div>
    {/if}

    {#if error}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
        {error}
      </div>
    {/if}

    <!-- Plans -->
    <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
      {#each plans as plan}
        <div class="relative bg-white rounded-2xl shadow-xl border-2 {plan.popular ? plan.borderColor : 'border-gray-100'} overflow-hidden">
          {#if plan.popular}
            <div class="absolute top-0 right-0">
              <div class="bg-gradient-to-r {plan.color} text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                Populaire
              </div>
            </div>
          {/if}

          <div class="p-8">
            <!-- Header -->
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br {plan.color} flex items-center justify-center">
                <plan.icon class="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p class="text-gray-500 text-sm">{plan.description}</p>
              </div>
            </div>

            <!-- Price -->
            <div class="mb-6">
              <span class="text-4xl font-extrabold text-gray-900">{plan.price}</span>
              <span class="text-gray-500">{plan.period}</span>
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8">
              {#each plan.features as feature}
                <li class="flex items-start gap-3">
                  <Check class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">{feature}</span>
                </li>
              {/each}
            </ul>

            <!-- CTA -->
            <button
              onclick={() => startCheckout(plan.slug)}
              disabled={loading}
              class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all {
                plan.popular 
                  ? 'bg-gradient-to-r ' + plan.color + ' text-white hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if loading && selectedPlan === plan.slug}
                <span class="flex items-center justify-center gap-2">
                  <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Redirection...
                </span>
              {:else}
                Souscrire au plan {plan.name}
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- FAQ / Garanties -->
    <div class="mt-12 text-center">
      <div class="inline-flex flex-wrap justify-center gap-6 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <Check class="w-4 h-4 text-green-500" />
          Annulation à tout moment
        </div>
        <div class="flex items-center gap-2">
          <Check class="w-4 h-4 text-green-500" />
          Paiement sécurisé Stripe
        </div>
        <div class="flex items-center gap-2">
          <Check class="w-4 h-4 text-green-500" />
          Sans engagement
        </div>
      </div>
    </div>

    <!-- Current plan info -->
    {#if $currentUser}
      <div class="mt-8 p-4 bg-white rounded-lg border text-center">
        <p class="text-gray-600">
          Votre forfait actuel : <strong class="text-gray-900">{$currentUser.profile_type === 'tuteur' ? 'Tuteur' : $currentUser.profile_type === 'etablissement' ? 'Établissement' : 'Apprenant (gratuit)'}</strong>
        </p>
        {#if $currentUser.profile_type !== 'apprenant'}
          <a href="/settings" class="text-blue-600 hover:text-blue-700 text-sm">
            Gérer mon abonnement →
          </a>
        {/if}
      </div>
    {/if}
  </div>
</div>
