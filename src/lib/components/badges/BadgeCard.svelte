<script lang="ts">
  import { Lock, Check } from 'lucide-svelte';

  interface Badge {
    id?: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: 'accomplishment' | 'performance' | 'regularity' | 'mastery' | 'special';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    points: number;
    earned_at?: string;
  }

  let { 
    badge,
    earned = false,
    size = 'md',
    showDetails = true
  }: { 
    badge: Badge;
    earned?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showDetails?: boolean;
  } = $props();

  const rarityColors = {
    common: { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-300', gradient: 'from-gray-600 to-gray-700' },
    uncommon: { bg: 'bg-green-900/50', border: 'border-green-600', text: 'text-green-400', gradient: 'from-green-600 to-green-700' },
    rare: { bg: 'bg-blue-900/50', border: 'border-blue-600', text: 'text-blue-400', gradient: 'from-blue-600 to-blue-700' },
    epic: { bg: 'bg-purple-900/50', border: 'border-purple-600', text: 'text-purple-400', gradient: 'from-purple-600 to-purple-700' },
    legendary: { bg: 'bg-amber-900/50', border: 'border-amber-500', text: 'text-amber-400', gradient: 'from-amber-500 via-yellow-500 to-orange-500' }
  };

  const rarityLabels = {
    common: 'Commun',
    uncommon: 'Peu commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  };

  const sizeClasses = {
    sm: { container: 'p-2', icon: 'w-10 h-10 text-2xl', title: 'text-xs', desc: 'text-[10px]' },
    md: { container: 'p-3', icon: 'w-14 h-14 text-3xl', title: 'text-sm', desc: 'text-xs' },
    lg: { container: 'p-4', icon: 'w-20 h-20 text-4xl', title: 'text-base', desc: 'text-sm' }
  };

  const s = $derived(sizeClasses[size] || sizeClasses.md);
  const colors = $derived(rarityColors[badge?.rarity as keyof typeof rarityColors] || rarityColors.common);

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }
</script>

{#if badge}
<div 
  class="relative rounded-xl border-2 {colors.border} {colors.bg} {s.container} transition-all duration-200 hover:shadow-lg group"
  class:opacity-50={!earned}
  class:grayscale={!earned}
  title={badge.description || ''}
>
  <!-- Earned indicator -->
  {#if earned}
    <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
      <Check class="w-3 h-3 text-white" />
    </div>
  {:else}
    <div class="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center shadow">
      <Lock class="w-3 h-3 text-white" />
    </div>
  {/if}

  <div class="flex flex-col items-center text-center gap-2">
    <!-- Icon -->
    <div 
      class="{s.icon} rounded-full bg-gradient-to-br {colors.gradient} flex items-center justify-center shadow-inner"
      class:animate-pulse={earned && badge.rarity === 'legendary'}
    >
      {badge.icon || '🏆'}
    </div>

    {#if showDetails}
      <!-- Name -->
      <h3 class="{s.title} font-semibold {colors.text} line-clamp-1">
        {badge.name || 'Badge'}
      </h3>

      <!-- Rarity badge -->
      <span class="{s.desc} px-2 py-0.5 rounded-full {colors.bg} {colors.text} font-medium border {colors.border}">
        {rarityLabels[badge?.rarity as keyof typeof rarityLabels] || 'Commun'}
      </span>

      <!-- Description on hover (md and lg only) -->
      {#if size !== 'sm'}
        <p class="{s.desc} text-gray-500 line-clamp-2 hidden group-hover:block">
          {badge.description || ''}
        </p>
      {/if}

      <!-- Earned date -->
      {#if earned && badge.earned_at}
        <p class="text-[10px] text-gray-400">
          Obtenu le {formatDate(badge.earned_at)}
        </p>
      {/if}

      <!-- Points -->
      <div class="{s.desc} {colors.text} font-bold">
        +{badge.points || 0} pts
      </div>
    {/if}
  </div>
</div>
{/if}