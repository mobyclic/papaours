<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Heart, Coffee, Pizza, BookOpen, Gift, Rocket, 
    ChevronLeft, Loader2, Sparkles, Check, Users, MessageCircle
  } from 'lucide-svelte';

  // Types
  interface Donor {
    id: string;
    donor_name: string | null;
    message: string | null;
    amount: number;
    created_at: string;
  }

  // Montants prédéfinis
  const donationOptions = [
    { amount: 300, label: '3 €', emoji: '☕', description: 'Un café', icon: Coffee },
    { amount: 500, label: '5 €', emoji: '🍕', description: 'Une pizza', icon: Pizza },
    { amount: 1000, label: '10 €', emoji: '📚', description: 'Un livre', icon: BookOpen },
    { amount: 2000, label: '20 €', emoji: '🎁', description: 'Un cadeau', icon: Gift },
    { amount: 5000, label: '50 €', emoji: '🚀', description: 'Super soutien', icon: Rocket }
  ];

  let selectedAmount = $state<number | null>(1000); // 10€ par défaut
  let customAmount = $state('');
  let isCustom = $state(false);
  let email = $state('');
  let name = $state('');
  let message = $state('');
  let loading = $state(false);
  let error = $state('');
  let showCancelled = $state(false);
  
  // Donateurs
  let donors = $state<Donor[]>([]);
  let stats = $state({ totalAmount: 0, totalDonors: 0 });
  let loadingDonors = $state(true);

  onMount(async () => {
    // Vérifier si retour d'annulation
    if ($page.url.searchParams.get('cancelled') === 'true') {
      showCancelled = true;
      setTimeout(() => showCancelled = false, 5000);
    }
    
    // Charger les donateurs
    try {
      const res = await fetch('/api/donate/donors?limit=20');
      const data = await res.json();
      donors = data.donors || [];
      stats = data.stats || { totalAmount: 0, totalDonors: 0 };
    } catch (e) {
      console.error('Erreur chargement donateurs:', e);
    } finally {
      loadingDonors = false;
    }
  });

  function selectAmount(amount: number) {
    selectedAmount = amount;
    isCustom = false;
    customAmount = '';
  }

  function selectCustom() {
    isCustom = true;
    selectedAmount = null;
  }

  function getCustomAmountCents(): number {
    const euros = parseFloat(customAmount.replace(',', '.'));
    if (isNaN(euros) || euros < 1) return 0;
    return Math.round(euros * 100);
  }

  let finalAmount = $derived(isCustom ? getCustomAmountCents() : (selectedAmount || 0));
  let finalAmountEuros = $derived((finalAmount / 100).toFixed(2).replace('.', ','));
  let isValid = $derived(finalAmount >= 100); // Minimum 1€

  async function handleDonate() {
    if (!isValid) return;
    
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: isCustom ? undefined : selectedAmount,
          customAmount: isCustom ? getCustomAmountCents() : undefined,
          email: email || undefined,
          name: name || undefined,
          message: message || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement');
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      error = e.message || 'Une erreur est survenue';
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Faire un don - Kwizy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="p-4 border-b bg-white">
    <div class="max-w-2xl mx-auto">
      <button onclick={() => goto('/dashboard')} class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ChevronLeft class="w-5 h-5" />
        <span>Retour</span>
      </button>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
        <Heart class="w-8 h-8 text-white" fill="white" />
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Soutenir Kwizy</h1>
      <p class="text-gray-500 max-w-md mx-auto">
        Votre don nous aide à maintenir l'application gratuite et à créer de nouveaux contenus éducatifs.
      </p>
    </div>

    <!-- Message annulation -->
    {#if showCancelled}
      <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-center">
        Le paiement a été annulé. Pas de souci, vous pouvez réessayer quand vous voulez !
      </div>
    {/if}

    <!-- Carte de don -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
      <!-- Montants prédéfinis -->
      <div class="mb-6">
        <p class="block text-sm font-medium text-gray-700 mb-3">Choisissez un montant</p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          {#each donationOptions as option}
            <button
              onclick={() => selectAmount(option.amount)}
              class="relative p-4 rounded-xl border-2 transition-all text-left
                {selectedAmount === option.amount && !isCustom
                  ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' 
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'}"
            >
              {#if selectedAmount === option.amount && !isCustom}
                <div class="absolute top-2 right-2">
                  <Check class="w-5 h-5 text-pink-600" />
                </div>
              {/if}
              <div class="text-2xl mb-1">{option.emoji}</div>
              <div class="font-bold text-gray-800">{option.label}</div>
              <div class="text-xs text-gray-500">{option.description}</div>
            </button>
          {/each}

          <!-- Montant personnalisé -->
          <button
            onclick={selectCustom}
            class="p-4 rounded-xl border-2 transition-all text-left
              {isCustom 
                ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' 
                : 'border-gray-200 hover:border-pink-300'}"
          >
            {#if isCustom}
              <div class="absolute top-2 right-2">
                <Check class="w-5 h-5 text-pink-600" />
              </div>
            {/if}
            <div class="text-2xl mb-1">✨</div>
            <div class="font-bold text-gray-800">Autre</div>
            <div class="text-xs text-gray-500">Montant libre</div>
          </button>
        </div>
      </div>

      <!-- Input montant personnalisé -->
      {#if isCustom}
        <div class="mb-6">
          <label for="custom-amount" class="block text-sm font-medium text-gray-700 mb-2">
            Votre montant (minimum 1 €)
          </label>
          <div class="relative">
            <input
              id="custom-amount"
              type="text"
              inputmode="decimal"
              placeholder="10"
              bind:value={customAmount}
              class="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-xl font-bold"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
          </div>
        </div>
      {/if}

      <!-- Informations optionnelles -->
      <div class="space-y-4 mb-6">
        <div class="border-t pt-6">
          <p class="text-sm text-gray-500 mb-4">Informations optionnelles</p>
          
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label for="donor-name" class="block text-sm font-medium text-gray-700 mb-1">Votre prénom</label>
              <input
                id="donor-name"
                type="text"
                placeholder="Marie"
                bind:value={name}
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none"
              />
            </div>
            <div>
              <label for="donor-email" class="block text-sm font-medium text-gray-700 mb-1">Email (pour le reçu)</label>
              <input
                id="donor-email"
                type="email"
                placeholder="marie@exemple.fr"
                bind:value={email}
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none"
              />
            </div>
          </div>

          <div class="mt-4">
            <label for="donor-message" class="block text-sm font-medium text-gray-700 mb-1">Un petit mot ? 💬</label>
            <textarea
              id="donor-message"
              placeholder="Merci pour cette super appli !"
              bind:value={message}
              rows="2"
              class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Erreur -->
      {#if error}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      {/if}

      <!-- Bouton de don -->
      <button
        onclick={handleDonate}
        disabled={!isValid || loading}
        class="w-full py-4 px-6 bg-gray-900 text-white font-bold text-lg rounded-lg 
          hover:bg-gray-800 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {#if loading}
          <Loader2 class="w-5 h-5 animate-spin" />
          <span>Redirection vers le paiement...</span>
        {:else}
          <Heart class="w-5 h-5" />
          <span>Faire un don de {finalAmountEuros} €</span>
        {/if}
      </button>

      <!-- Sécurité -->
      <div class="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
        <span>Paiement sécurisé par Stripe</span>
      </div>
    </div>

    <!-- Pourquoi donner -->
    <div class="mt-8 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-gray-700" />
        Pourquoi soutenir Kwizy ?
      </h2>
      <ul class="space-y-3 text-gray-600">
        <li class="flex items-start gap-3">
          <span class="text-xl">🎓</span>
          <span>Créer de nouveaux quiz éducatifs adaptés à chaque niveau</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-xl">🆓</span>
          <span>Maintenir l'application 100% gratuite pour tous</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-xl">🔒</span>
          <span>Garantir un environnement sans publicité et respectueux</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-xl">💡</span>
          <span>Développer de nouvelles fonctionnalités pédagogiques</span>
        </li>
      </ul>
    </div>

    <!-- Liste des donateurs -->
    <div class="mt-8 bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users class="w-5 h-5 text-gray-700" />
          Nos généreux donateurs
        </h2>
        {#if stats.totalDonors > 0}
          <div class="text-sm text-gray-500">
            <span class="font-bold text-gray-900">{stats.totalDonors}</span> don{stats.totalDonors > 1 ? 's' : ''}
            · <span class="font-bold text-gray-900">{(stats.totalAmount / 100).toFixed(0)} €</span> collectés
          </div>
        {/if}
      </div>

      {#if loadingDonors}
        <div class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin text-pink-500" />
        </div>
      {:else if donors.length === 0}
        <div class="text-center py-8 text-gray-500">
          <Heart class="w-12 h-12 mx-auto mb-2 text-blue-200" />
          <p>Soyez le premier à soutenir Kwizy ! 💙</p>
        </div>
      {:else}
        <div class="space-y-3 max-h-96 overflow-y-auto">
          {#each donors as donor}
            {@const amountEuros = (donor.amount / 100).toFixed(0)}
            {@const displayName = donor.donor_name || 'Anonyme'}
            {@const date = new Date(donor.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            <div class="flex items-start gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-gray-800">{displayName}</span>
                  <span class="text-pink-600 font-bold">{amountEuros} €</span>
                  <span class="text-xs text-gray-400">· {date}</span>
                </div>
                
                {#if donor.message}
                  <p class="mt-1 text-sm text-gray-600 italic flex items-start gap-1">
                    <MessageCircle class="w-3 h-3 mt-1 flex-shrink-0 text-gray-400" />
                    <span>"{donor.message}"</span>
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>
