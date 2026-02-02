<script lang="ts">
  import BadgeCard from './BadgeCard.svelte';
  import { Trophy, Star, Calendar, Target, Sparkles } from 'lucide-svelte';

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

  interface BadgeStats {
    total: number;
    points: number;
    byCategory: Record<string, number>;
  }

  let { 
    earnedBadges = [],
    availableBadges = [],
    stats = { total: 0, points: 0, byCategory: {} },
    showAvailable = true
  }: { 
    earnedBadges: Badge[];
    availableBadges: Badge[];
    stats: BadgeStats;
    showAvailable?: boolean;
  } = $props();

  const categoryIcons = {
    accomplishment: Trophy,
    performance: Target,
    regularity: Calendar,
    mastery: Star,
    special: Sparkles
  };

  const categoryLabels = {
    accomplishment: 'Accomplissement',
    performance: 'Performance',
    regularity: 'Régularité',
    mastery: 'Maîtrise',
    special: 'Spécial'
  };

  const categoryColors = {
    accomplishment: 'text-amber-500',
    performance: 'text-red-500',
    regularity: 'text-blue-500',
    mastery: 'text-purple-500',
    special: 'text-pink-500'
  };

  // Grouper les badges par catégorie
  const earnedByCategory = $derived.by(() => {
    const grouped: Record<string, Badge[]> = {};
    for (const badge of earnedBadges) {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    }
    return grouped;
  });

  const availableByCategory = $derived.by(() => {
    const grouped: Record<string, Badge[]> = {};
    for (const badge of availableBadges) {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    }
    return grouped;
  });

  // Calcul du total de badges disponibles
  const totalAvailable = $derived(earnedBadges.length + availableBadges.length);
  const progressPercent = $derived(totalAvailable > 0 ? Math.round((earnedBadges.length / totalAvailable) * 100) : 0);

  let activeTab = $state<'earned' | 'available'>('earned');
</script>

<div class="space-y-6">
  <!-- Stats Overview -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-4 text-center border border-amber-700/50">
      <Trophy class="w-8 h-8 mx-auto text-amber-400 mb-2" />
      <div class="text-2xl font-bold text-amber-300">{stats.total}</div>
      <div class="text-xs text-amber-400/70">Badges obtenus</div>
    </div>
    
    <div class="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 text-center border border-purple-700/50">
      <Star class="w-8 h-8 mx-auto text-purple-400 mb-2" />
      <div class="text-2xl font-bold text-purple-300">{stats.points}</div>
      <div class="text-xs text-purple-400/70">Points de badges</div>
    </div>
    
    <div class="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-4 text-center border border-blue-700/50">
      <Target class="w-8 h-8 mx-auto text-blue-400 mb-2" />
      <div class="text-2xl font-bold text-blue-300">{progressPercent}%</div>
      <div class="text-xs text-blue-400/70">Collection</div>
    </div>
    
    <div class="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-4 text-center border border-green-700/50">
      <Sparkles class="w-8 h-8 mx-auto text-green-400 mb-2" />
      <div class="text-2xl font-bold text-green-300">{availableBadges.length}</div>
      <div class="text-xs text-green-400/70">À débloquer</div>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="bg-gray-800 rounded-full h-3 overflow-hidden">
    <div 
      class="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 transition-all duration-500"
      style="width: {progressPercent}%"
    ></div>
  </div>

  <!-- Tabs -->
  {#if showAvailable}
    <div class="flex gap-2 border-b border-gray-700">
      <button
        type="button"
        class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px"
        class:border-amber-500={activeTab === 'earned'}
        class:text-amber-400={activeTab === 'earned'}
        class:border-transparent={activeTab !== 'earned'}
        class:text-gray-400={activeTab !== 'earned'}
        class:hover:text-gray-200={activeTab !== 'earned'}
        onclick={() => activeTab = 'earned'}
      >
        Obtenus ({earnedBadges.length})
      </button>
      <button
        type="button"
        class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px"
        class:border-purple-500={activeTab === 'available'}
        class:text-purple-400={activeTab === 'available'}
        class:border-transparent={activeTab !== 'available'}
        class:text-gray-400={activeTab !== 'available'}
        class:hover:text-gray-200={activeTab !== 'available'}
        onclick={() => activeTab = 'available'}
      >
        À débloquer ({availableBadges.length})
      </button>
    </div>
  {/if}

  <!-- Earned Badges -->
  {#if activeTab === 'earned'}
    {#if earnedBadges.length === 0}
      <div class="text-center py-12 text-gray-400">
        <Trophy class="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p class="text-lg font-medium">Aucun badge encore</p>
        <p class="text-sm">Continue à jouer pour débloquer des badges !</p>
      </div>
    {:else}
      {#each Object.entries(earnedByCategory) as [category, badges]}
        {@const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <CategoryIcon class="w-5 h-5 {categoryColors[category as keyof typeof categoryColors]}" />
            <h3 class="font-semibold text-gray-200">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <span class="text-xs text-gray-500">({badges.length})</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {#each badges as badge}
              <BadgeCard {badge} earned={true} size="md" />
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {/if}

  <!-- Available Badges -->
  {#if activeTab === 'available' && showAvailable}
    {#if availableBadges.length === 0}
      <div class="text-center py-12 text-gray-400">
        <Star class="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p class="text-lg font-medium">Tu as tous les badges !</p>
        <p class="text-sm">Félicitations, collection complète ! 🎉</p>
      </div>
    {:else}
      {#each Object.entries(availableByCategory) as [category, badges]}
        {@const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <CategoryIcon class="w-5 h-5 {categoryColors[category as keyof typeof categoryColors]} opacity-50" />
            <h3 class="font-semibold text-gray-400">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <span class="text-xs text-gray-500">({badges.length})</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {#each badges as badge}
              <BadgeCard {badge} earned={false} size="md" />
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {/if}
</div>
