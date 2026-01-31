<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Heart, PartyPopper, Home, Share2, Copy, Check, Loader2 } from 'lucide-svelte';

  let loading = $state(true);
  let error = $state('');
  let donationInfo = $state<{
    amount: number;
    email?: string;
    name?: string;
  } | null>(null);
  let copied = $state(false);
  let canShare = $state(false);

  onMount(async () => {
    // Check share API availability
    canShare = typeof navigator !== 'undefined' && 'share' in navigator;
    
    const sessionId = $page.url.searchParams.get('session_id');
    
    if (!sessionId) {
      error = 'Session de paiement introuvable';
      loading = false;
      return;
    }

    try {
      // Vérifier la session côté serveur
      const res = await fetch(`/api/donate/verify?session_id=${sessionId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de vérification');
      }

      donationInfo = data;
      loading = false;

      // Confettis ! 🎉
      if (browser) {
        // @ts-ignore - dynamic import
        const confetti = (await import('canvas-confetti')).default;
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 300);

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 700);
      }

    } catch (e: any) {
      error = e.message;
      loading = false;
    }
  });

  function formatAmount(cents: number): string {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }

  const shareUrl = 'https://papaours.app/donate';
  const shareText = "Je viens de soutenir Papa Ours, une super appli éducative pour les enfants ! 🐻❤️";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch {
      // Fallback
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Soutenir Papa Ours',
          text: shareText,
          url: shareUrl
        });
      } catch {
        // User cancelled
      }
    }
  }
</script>

<svelte:head>
  <title>Merci pour votre don ! - Papa Ours</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    {#if loading}
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <Loader2 class="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
        <p class="text-gray-600">Vérification du paiement...</p>
      </div>
    {:else if error}
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">😕</span>
        </div>
        <h1 class="text-xl font-bold text-gray-800 mb-2">Oups !</h1>
        <p class="text-gray-600 mb-6">{error}</p>
        <button
          onclick={() => goto('/donate')}
          class="px-6 py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    {:else}
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <!-- Animation de succès -->
        <div class="relative mb-6">
          <div class="w-24 h-24 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <Heart class="w-12 h-12 text-white" fill="white" />
          </div>
          <div class="absolute -top-2 -right-2">
            <PartyPopper class="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          Merci infiniment {donationInfo?.name || ''} ! 💖
        </h1>
        
        <p class="text-gray-600 mb-4">
          Votre don de <span class="font-bold text-pink-600">{formatAmount(donationInfo?.amount || 0)}</span> a bien été reçu.
        </p>

        <div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-6">
          <p class="text-gray-700">
            Grâce à vous, Papa Ours peut continuer à aider les enfants à apprendre en s'amusant ! 🐻✨
          </p>
        </div>

        {#if donationInfo?.email}
          <p class="text-sm text-gray-500 mb-6">
            Un reçu a été envoyé à <span class="font-medium">{donationInfo.email}</span>
          </p>
        {/if}

        <!-- Partager -->
        <div class="border-t pt-6 mb-6">
          <p class="text-sm text-gray-500 mb-3">Partagez l'amour 💕</p>
          <div class="flex gap-2 justify-center">
            {#if canShare}
              <button
                onclick={shareNative}
                class="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Share2 class="w-4 h-4" />
                Partager
              </button>
            {/if}
            <button
              onclick={copyLink}
              class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {#if copied}
                <Check class="w-4 h-4 text-green-600" />
                <span class="text-green-600">Copié !</span>
              {:else}
                <Copy class="w-4 h-4" />
                Copier le lien
              {/if}
            </button>
          </div>
        </div>

        <!-- Retour -->
        <button
          onclick={() => goto('/dashboard')}
          class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all"
        >
          <Home class="w-5 h-5" />
          Retour à l'accueil
        </button>
      </div>

      <!-- Fun facts -->
      <div class="mt-6 text-center">
        <p class="text-gray-500 text-sm">
          🎮 Saviez-vous que + de 1000 enfants utilisent Papa Ours chaque jour ?
        </p>
      </div>
    {/if}
  </div>
</div>
