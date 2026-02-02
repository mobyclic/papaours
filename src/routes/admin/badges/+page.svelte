<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Plus, Pencil, Trash2, Award, Users } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  // États
  let showModal = $state(false);
  let editingBadge = $state<any>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);
  let filterCategory = $state('all');

  // Formulaire
  let form = $state({
    name: '',
    slug: '',
    description: '',
    icon: '🏆',
    category: 'progress',
    condition_type: 'quiz_count',
    condition_value: 1,
    points: 10,
    is_active: true
  });

  // Types de conditions
  const conditionTypes = [
    { id: 'quiz_count', name: 'Nombre de quiz complétés' },
    { id: 'perfect_score', name: 'Quiz avec score parfait' },
    { id: 'streak_days', name: 'Jours consécutifs' },
    { id: 'subject_mastery', name: 'Maîtrise d\'une matière' },
    { id: 'total_points', name: 'Points totaux accumulés' },
    { id: 'first_quiz', name: 'Premier quiz' },
    { id: 'invite_friends', name: 'Amis invités' },
    { id: 'special', name: 'Événement spécial' }
  ];

  // Emojis populaires pour badges
  const popularIcons = ['🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💎', '🔥', '⚡', '🎯', '🎖️', '🏅', '👑', '💪', '🚀', '🧠', '📚', '✨', '🎓', '💯'];

  // Filtrer les badges
  let filteredBadges = $derived.by(() => {
    if (filterCategory === 'all') return data.badges;
    return data.badges.filter(b => b.category === filterCategory);
  });

  // Grouper par catégorie
  let badgesByCategory = $derived.by(() => {
    const grouped: Record<string, any[]> = {};
    for (const badge of filteredBadges) {
      const cat = badge.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(badge);
    }
    return grouped;
  });

  // Générer slug
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Ouvrir modal
  function openModal(badge?: any) {
    if (badge) {
      editingBadge = badge;
      form = {
        name: badge.name,
        slug: badge.slug,
        description: badge.description || '',
        icon: badge.icon || '🏆',
        category: badge.category || 'progress',
        condition_type: badge.condition_type || 'quiz_count',
        condition_value: badge.condition_value || 1,
        points: badge.points || 10,
        is_active: badge.is_active ?? true
      };
    } else {
      editingBadge = null;
      form = {
        name: '',
        slug: '',
        description: '',
        icon: '🏆',
        category: 'progress',
        condition_type: 'quiz_count',
        condition_value: 1,
        points: 10,
        is_active: true
      };
    }
    showModal = true;
  }

  // Sauvegarder
  async function save() {
    if (!form.name || !form.slug) return;
    saving = true;

    try {
      const response = await fetch('/api/admin/badges', {
        method: editingBadge ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBadge?.id,
          ...form
        })
      });

      if (response.ok) {
        showModal = false;
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur sauvegarde badge:', error);
    } finally {
      saving = false;
    }
  }

  // Supprimer
  async function deleteBadge(badge: any) {
    if (!confirm(`Supprimer le badge "${badge.name}" ? Cette action est irréversible.`)) return;
    deleting = badge.id;

    try {
      const response = await fetch(`/api/admin/badges?id=${encodeURIComponent(badge.id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur suppression badge:', error);
    } finally {
      deleting = null;
    }
  }

  // Obtenir nom catégorie
  function getCategoryName(catId: string): string {
    const cat = data.categories.find(c => c.id === catId);
    return cat?.name || catId;
  }

  function getCategoryIcon(catId: string): string {
    const cat = data.categories.find(c => c.id === catId);
    return cat?.icon || '📦';
  }
</script>

<svelte:head>
  <title>Gestion des Badges - Admin Kweez</title>
</svelte:head>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Gestion des Badges</h1>
      <p class="text-gray-600 mt-1">Gérez les badges et récompenses de gamification</p>
    </div>
    <Button onclick={() => openModal()} class="flex items-center gap-2">
      <Plus class="w-4 h-4" />
      Nouveau badge
    </Button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="text-2xl mb-1">🏆</div>
      <div class="text-2xl font-bold text-gray-900">{data.badges.length}</div>
      <div class="text-sm text-gray-500">Badges total</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="text-2xl mb-1">✅</div>
      <div class="text-2xl font-bold text-green-600">{data.badges.filter(b => b.is_active).length}</div>
      <div class="text-sm text-gray-500">Actifs</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="text-2xl mb-1">👥</div>
      <div class="text-2xl font-bold text-blue-600">{data.badges.reduce((acc, b) => acc + (b.users_count || 0), 0)}</div>
      <div class="text-sm text-gray-500">Badges débloqués</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="text-2xl mb-1">📊</div>
      <div class="text-2xl font-bold text-purple-600">{data.categories.length}</div>
      <div class="text-sm text-gray-500">Catégories</div>
    </div>
  </div>

  <!-- Filtre catégorie -->
  <div class="flex gap-2 mb-6 flex-wrap">
    <button
      onclick={() => filterCategory = 'all'}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filterCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      Tous ({data.badges.length})
    </button>
    {#each data.categories as cat}
      {@const count = data.badges.filter(b => b.category === cat.id).length}
      <button
        onclick={() => filterCategory = cat.id}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 {filterCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
      >
        <span>{cat.icon}</span>
        {cat.name} ({count})
      </button>
    {/each}
  </div>

  <!-- Liste des badges -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Badge</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Catégorie</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Condition</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Points</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Utilisateurs</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
          <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each filteredBadges as badge}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-xl">
                  {badge.icon || '🏆'}
                </div>
                <div>
                  <div class="font-medium text-gray-900">{badge.name}</div>
                  <div class="text-xs text-gray-500 font-mono">{badge.slug}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {getCategoryIcon(badge.category)} {getCategoryName(badge.category)}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-gray-600">
                {conditionTypes.find(c => c.id === badge.condition_type)?.name || badge.condition_type}
              </div>
              <div class="text-xs text-gray-500">Valeur: {badge.condition_value}</div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                +{badge.points} pts
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 text-sm text-gray-600">
                <Users class="w-4 h-4" />
                {badge.users_count}
              </span>
            </td>
            <td class="px-4 py-3">
              {#if badge.is_active}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Actif
                </span>
              {:else}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Inactif
                </span>
              {/if}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onclick={() => openModal(badge)}>
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onclick={() => deleteBadge(badge)}
                  disabled={deleting === badge.id}
                  class="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="7" class="px-4 py-12 text-center text-gray-500">
              {#if filterCategory !== 'all'}
                Aucun badge dans cette catégorie.
              {:else}
                Aucun badge défini. Créez-en un pour commencer !
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Badge -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingBadge ? 'Modifier le badge' : 'Nouveau badge'}</Dialog.Title>
      <Dialog.Description>
        {editingBadge ? 'Modifiez les informations du badge.' : 'Créez un nouveau badge de récompense.'}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-name">Nom</label>
          <Input 
            id="badge-name" 
            bind:value={form.name} 
            oninput={() => { if (!editingBadge) form.slug = generateSlug(form.name); }}
            placeholder="Ex: Premier Quiz" 
            required 
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-icon">Icône</label>
          <div class="relative">
            <Input 
              id="badge-icon" 
              bind:value={form.icon} 
              class="text-center text-xl"
              maxlength={4}
            />
          </div>
        </div>
      </div>

      <!-- Emoji picker rapide -->
      <div class="flex flex-wrap gap-1">
        {#each popularIcons as emoji}
          <button
            type="button"
            onclick={() => form.icon = emoji}
            class="w-8 h-8 rounded hover:bg-gray-100 text-lg transition-colors {form.icon === emoji ? 'bg-amber-100 ring-2 ring-amber-400' : ''}"
          >
            {emoji}
          </button>
        {/each}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-slug">Slug</label>
        <Input 
          id="badge-slug" 
          bind:value={form.slug} 
          placeholder="premier-quiz" 
          required 
          class="font-mono"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-description">Description</label>
        <Input 
          id="badge-description" 
          bind:value={form.description} 
          placeholder="Décroché en complétant votre premier quiz !" 
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-category">Catégorie</label>
          <select 
            id="badge-category" 
            bind:value={form.category}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {#each data.categories as cat}
              <option value={cat.id}>{cat.icon} {cat.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-points">Points</label>
          <Input 
            id="badge-points" 
            type="number" 
            bind:value={form.points}
            min="0"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-condition">Type de condition</label>
          <select 
            id="badge-condition" 
            bind:value={form.condition_type}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {#each conditionTypes as cond}
              <option value={cond.id}>{cond.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="badge-condition-value">Valeur requise</label>
          <Input 
            id="badge-condition-value" 
            type="number" 
            bind:value={form.condition_value}
            min="0"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="badge-active" bind:checked={form.is_active} class="w-4 h-4 rounded" />
        <label class="cursor-pointer text-sm font-medium text-gray-700" for="badge-active">Badge actif</label>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => showModal = false}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : (editingBadge ? 'Modifier' : 'Créer')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
