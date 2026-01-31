<script lang="ts">
  import { X, Trophy, Star } from 'lucide-svelte';

  interface Badge {
    slug: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    points: number;
  }

  let { 
    badges = [],
    onClose = () => {}
  }: { 
    badges: Badge[];
    onClose: () => void;
  } = $props();

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 via-yellow-500 to-orange-500'
  };

  const rarityGlow = {
    common: 'shadow-gray-400/50',
    uncommon: 'shadow-green-400/50',
    rare: 'shadow-blue-400/50',
    epic: 'shadow-purple-400/50',
    legendary: 'shadow-amber-400/50'
  };

  const rarityLabels = {
    common: 'Commun',
    uncommon: 'Peu commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  };

  let currentIndex = $state(0);
  let animating = $state(true);

  $effect(() => {
    // Animation d'entrée
    animating = true;
    setTimeout(() => {
      animating = false;
    }, 500);
  });

  function nextBadge() {
    if (currentIndex < badges.length - 1) {
      currentIndex++;
    } else {
      onClose();
    }
  }

  const currentBadge = $derived(badges[currentIndex]);
</script>

{#if badges.length > 0 && currentBadge}
  <!-- Overlay -->
  <div 
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <!-- Container -->
    <div 
      class="relative max-w-sm w-full"
      class:animate-bounce-in={animating}
    >
      <!-- Close button -->
      <button
        type="button"
        onclick={onClose}
        class="absolute -top-2 -right-2 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Badge Card -->
      <div 
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br {rarityColors[currentBadge.rarity]} p-1 shadow-2xl {rarityGlow[currentBadge.rarity]}"
      >
        <div class="bg-gray-900/95 rounded-[22px] p-6 text-center">
          <!-- Confetti effect for legendary -->
          {#if currentBadge.rarity === 'legendary'}
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              {#each Array(20) as _, i}
                <div 
                  class="absolute w-2 h-2 rounded-full animate-confetti"
                  style="
                    left: {Math.random() * 100}%;
                    animation-delay: {Math.random() * 2}s;
                    background: {['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5]};
                  "
                ></div>
              {/each}
            </div>
          {/if}

          <!-- Header -->
          <div class="flex items-center justify-center gap-2 mb-4">
            <Trophy class="w-5 h-5 text-amber-400" />
            <span class="text-amber-400 font-semibold text-sm uppercase tracking-wider">
              Nouveau Badge !
            </span>
            <Trophy class="w-5 h-5 text-amber-400" />
          </div>

          <!-- Badge Icon -->
          <div 
            class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br {rarityColors[currentBadge.rarity]} flex items-center justify-center text-5xl shadow-lg animate-pulse-slow"
          >
            {currentBadge.icon}
          </div>

          <!-- Badge Name -->
          <h2 class="text-2xl font-bold text-white mb-2">
            {currentBadge.name}
          </h2>

          <!-- Rarity -->
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r {rarityColors[currentBadge.rarity]} text-white text-xs font-semibold mb-3">
            <Star class="w-3 h-3" />
            {rarityLabels[currentBadge.rarity]}
          </div>

          <!-- Description -->
          <p class="text-gray-300 mb-4">
            {currentBadge.description}
          </p>

          <!-- Points -->
          <div class="flex items-center justify-center gap-2 text-amber-400 font-bold text-lg mb-6">
            <span>+{currentBadge.points}</span>
            <span class="text-sm font-normal text-amber-400/80">points</span>
          </div>

          <!-- Progress indicator -->
          {#if badges.length > 1}
            <div class="flex justify-center gap-2 mb-4">
              {#each badges as _, i}
                <div 
                  class="w-2 h-2 rounded-full transition-colors {i === currentIndex ? 'bg-white' : 'bg-white/30'}"
                ></div>
              {/each}
            </div>
          {/if}

          <!-- Continue Button -->
          <button
            type="button"
            onclick={nextBadge}
            class="w-full py-3 px-6 bg-gradient-to-r {rarityColors[currentBadge.rarity]} text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            {currentIndex < badges.length - 1 ? 'Badge suivant' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes bounce-in {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .animate-bounce-in {
    animation: bounce-in 0.5s ease-out;
  }

  @keyframes pulse-slow {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 2s ease-in-out infinite;
  }

  @keyframes confetti {
    0% {
      transform: translateY(-10px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(400px) rotate(720deg);
      opacity: 0;
    }
  }

  .animate-confetti {
    animation: confetti 3s ease-in-out infinite;
  }
</style>
