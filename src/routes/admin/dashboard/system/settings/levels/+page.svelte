<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-svelte";

  let { data } = $props();
  
  // Modal state
  let showModal = $state(false);
  let editingLevel = $state<any>(null);
  let formName = $state('');
  let formSlug = $state('');
  let formOrder = $state(0);
  let formPointsRequired = $state(0);
  let formIcon = $state('');
  let formColor = $state('#6366F1');
  let isSaving = $state(false);

  function openCreateModal() {
    editingLevel = null;
    formName = '';
    formSlug = '';
    formOrder = data.levels?.length || 0;
    formPointsRequired = 0;
    formIcon = '⭐';
    formColor = '#6366F1';
    showModal = true;
  }

  function openEditModal(level: any) {
    editingLevel = level;
    formName = level.name;
    formSlug = level.slug;
    formOrder = level.pos ?? 0;
    formPointsRequired = level.points_required ?? 0;
    formIcon = level.icon || '⭐';
    formColor = level.color || '#6366F1';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingLevel = null;
  }

  function generateSlug(name: string) {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    formName = target.value;
    if (!editingLevel) {
      formSlug = generateSlug(target.value);
    }
  }

  async function handleSave() {
    if (!formName.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    isSaving = true;
    try {
      const payload = {
        name: formName,
        slug: formSlug || generateSlug(formName),
        pos: formOrder,
        points_required: formPointsRequired,
        icon: formIcon,
        color: formColor
      };

      const url = editingLevel 
        ? `/api/admin/levels/${editingLevel.id.split(':')[1]}`
        : '/api/admin/levels';
      
      const res = await fetch(url, {
        method: editingLevel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de sauvegarder'));
      }
    } catch (e) {
      console.error('Error saving level:', e);
      alert('Erreur de connexion');
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete(level: any) {
    if (level.user_count > 0) {
      alert(`Impossible de supprimer: ${level.user_count} utilisateur(s) ont ce niveau`);
      return;
    }
    
    if (!confirm(`Supprimer le niveau "${level.name}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/levels/${level.id.split(':')[1]}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de supprimer'));
      }
    } catch (e) {
      console.error('Error deleting level:', e);
      alert('Erreur de connexion');
    }
  }
</script>

<svelte:head>
  <title>Difficulté - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/dashboard/system/settings" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Niveaux de difficulté</h1>
        <p class="text-gray-600 mt-1">Gérez la progression des joueurs (points requis pour atteindre chaque niveau)</p>
      </div>
      <Button onclick={openCreateModal} class="bg-purple-600 hover:bg-purple-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau niveau
      </Button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ordre</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Icône</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Points requis</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utilisateurs</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.levels as level (level.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <span class="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                {level.pos}
              </span>
            </td>
            <td class="px-6 py-4">
              <span 
                class="text-2xl" 
                style="filter: drop-shadow(0 1px 2px {level.color || '#6366F1'}40)"
              >
                {level.icon || '⭐'}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-gray-900">{level.name}</span>
              <span 
                class="ml-2 inline-block w-3 h-3 rounded-full" 
                style="background-color: {level.color || '#6366F1'}"
              ></span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600 font-mono">{level.points_required} pts</td>
            <td class="px-6 py-4 text-sm text-gray-600">{level.user_count}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button 
                  onclick={() => openEditModal(level)}
                  class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 class="w-4 h-4 text-gray-600" />
                </button>
                <button 
                  onclick={() => handleDelete(level)}
                  class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                  disabled={level.user_count > 0}
                  title={level.user_count > 0 ? 'Utilisé par des joueurs' : 'Supprimer'}
                >
                  <Trash2 class="w-4 h-4 {level.user_count > 0 ? 'text-gray-300' : 'text-red-600'}" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {editingLevel ? 'Modifier le niveau' : 'Nouveau niveau'}
        </h3>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input
            type="text"
            id="name"
            value={formName}
            oninput={handleNameChange}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="ex: Expert"
          />
        </div>

        <div>
          <label for="slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            id="slug"
            bind:value={formSlug}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            placeholder="expert"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="order" class="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
            <input
              type="number"
              id="order"
              bind:value={formOrder}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div>
            <label for="points" class="block text-sm font-medium text-gray-700 mb-1">Points requis</label>
            <input
              type="number"
              id="points"
              bind:value={formPointsRequired}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="icon" class="block text-sm font-medium text-gray-700 mb-1">Icône (emoji)</label>
            <input
              type="text"
              id="icon"
              bind:value={formIcon}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-2xl text-center"
              placeholder="⭐"
            />
          </div>
          <div>
            <label for="color" class="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
            <div class="flex gap-2">
              <input
                type="color"
                id="color"
                bind:value={formColor}
                class="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                bind:value={formColor}
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <Button variant="outline" onclick={closeModal}>
          Annuler
        </Button>
        <Button onclick={handleSave} disabled={isSaving} class="bg-purple-600 hover:bg-purple-700">
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  </div>
{/if}
