<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft, Search, X, Filter, Check, Loader2 } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  let { data } = $props();

  // Récupérer le filtre matière depuis l'URL
  let urlMatiereSlug = $derived($page.url.searchParams.get('matiere') || '');
  
  // Trouver l'ID de matière correspondant au slug dans l'URL
  let initialMatiereId = $derived.by(() => {
    if (!urlMatiereSlug) return '';
    const matiere = (data.matieres || []).find((m: any) => {
      const slug = m.id?.toString().split(':')[1] || m.slug;
      return slug === urlMatiereSlug;
    });
    return matiere?.id?.toString() || '';
  });

  // État de recherche et filtres
  let searchQuery = $state('');
  let selectedMatiereId = $state('');
  
  // Synchroniser avec l'URL au chargement
  $effect(() => {
    if (initialMatiereId && !selectedMatiereId) {
      selectedMatiereId = initialMatiereId;
    }
  });

  // Filtrer les thèmes
  let filteredThemes = $derived.by(() => {
    let result = data.themes || [];
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t: any) => 
        t.name?.toLowerCase().includes(query) ||
        t.slug?.toLowerCase().includes(query)
      );
    }
    
    // Filtre par matière
    if (selectedMatiereId) {
      result = result.filter((t: any) => {
        const matiereIds = t.matiere_ids || [];
        return matiereIds.some((m: string) => m === selectedMatiereId || m?.toString() === selectedMatiereId);
      });
    }
    
    return result;
  });

  // Modal state
  let showModal = $state(false);
  let editingTheme = $state<any>(null);
  let formName = $state('');
  let formMatiereIds = $state<string[]>([]);
  let formIsActive = $state(true);
  let isSaving = $state(false);
  let modalError = $state('');

  // Delete state
  let deleteConfirm = $state<any>(null);
  let isDeleting = $state(false);

  function openCreateModal() {
    editingTheme = null;
    formName = '';
    formMatiereIds = [];
    formIsActive = true;
    modalError = '';
    showModal = true;
  }

  function openEditModal(theme: any) {
    editingTheme = theme;
    formName = theme.name || '';
    formMatiereIds = (theme.matiere_ids || []).map((m: any) => m?.toString() || m);
    formIsActive = theme.is_active ?? true;
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingTheme = null;
    modalError = '';
  }

  function toggleMatiere(matiereId: string) {
    if (formMatiereIds.includes(matiereId)) {
      formMatiereIds = formMatiereIds.filter(id => id !== matiereId);
    } else {
      formMatiereIds = [...formMatiereIds, matiereId];
    }
  }

  async function handleSave() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }

    isSaving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        matiere_ids: formMatiereIds,
        is_active: formIsActive
      };

      const url = editingTheme 
        ? `/api/themes/${editingTheme.id.split(':')[1]}` 
        : '/api/themes';
      
      const res = await fetch(url, {
        method: editingTheme ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        modalError = result.error || result.message || 'Erreur lors de la sauvegarde';
        return;
      }

      closeModal();
      window.location.reload();
    } catch (e) {
      modalError = 'Erreur de connexion au serveur';
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete(theme: any) {
    if (theme.question_count > 0) {
      alert(`Impossible de supprimer: ${theme.question_count} question(s) utilisent ce thème`);
      return;
    }
    
    deleteConfirm = theme;
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    
    isDeleting = true;
    try {
      const res = await fetch(`/api/themes/${deleteConfirm.id.split(':')[1]}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de supprimer'));
      }
    } catch (e) {
      console.error('Error deleting theme:', e);
      alert('Erreur de connexion');
    } finally {
      isDeleting = false;
      deleteConfirm = null;
    }
  }

  function getMatiereColor(matiereId: string) {
    const matiere = data.matieres?.find((m: any) => m.id === matiereId || m.id?.toString() === matiereId);
    return matiere?.color || '#6B7280';
  }

  function getMatiereName(matiereId: string) {
    const matiere = data.matieres?.find((m: any) => m.id === matiereId || m.id?.toString() === matiereId);
    return matiere?.name || 'Inconnue';
  }

  function clearFilters() {
    searchQuery = '';
    selectedMatiereId = '';
  }
</script>

<svelte:head>
  <title>Thèmes - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/system/settings" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Thèmes</h1>
        <p class="text-gray-600 mt-1">Gérez les thèmes des questions ({data.themes?.length || 0} thèmes)</p>
      </div>
      <Button onclick={openCreateModal} class="bg-green-600 hover:bg-green-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau thème
      </Button>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Search -->
      <div class="relative flex-1 min-w-[250px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher un thème..."
          bind:value={searchQuery}
          class="pl-10"
        />
      </div>

      <!-- Filter by matière -->
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-gray-500" />
        <select
          bind:value={selectedMatiereId}
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Toutes les matières</option>
          {#each (data.matieres || []) as matiere (matiere.id)}
            <option value={matiere.id}>{matiere.name}</option>
          {/each}
        </select>
      </div>

      <!-- Clear filters -->
      {#if searchQuery || selectedMatiereId}
        <Button variant="ghost" size="sm" onclick={clearFilters}>
          <X class="w-4 h-4 mr-1" />
          Effacer les filtres
        </Button>
      {/if}
    </div>

    <!-- Active filters display -->
    {#if searchQuery || selectedMatiereId}
      <div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
        <span>Filtres actifs:</span>
        {#if searchQuery}
          <span class="px-2 py-1 bg-gray-100 rounded-full">Recherche: "{searchQuery}"</span>
        {/if}
        {#if selectedMatiereId}
          <span class="px-2 py-1 rounded-full text-white" style="background-color: {getMatiereColor(selectedMatiereId)}">
            {getMatiereName(selectedMatiereId)}
          </span>
        {/if}
        <span class="text-gray-500">→ {filteredThemes.length} résultat(s)</span>
      </div>
    {/if}
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    {#if filteredThemes.length === 0}
      <div class="p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search class="w-8 h-8 text-gray-400" />
        </div>
        <p class="text-gray-500 text-lg">Aucun thème trouvé</p>
        {#if searchQuery || selectedMatiereId}
          <p class="text-gray-400 mt-1">Essayez de modifier vos filtres</p>
          <Button variant="outline" size="sm" class="mt-4" onclick={clearFilters}>
            Effacer les filtres
          </Button>
        {/if}
      </div>
    {:else}
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matières</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Questions</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
            <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredThemes as theme (theme.id)}
            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div>
                  <div class="text-sm font-medium text-gray-900">{theme.name}</div>
                  <div class="text-xs text-gray-500 font-mono">{theme.slug}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {#each (theme.matiere_ids || []) as matiereId}
                    <span 
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style="background-color: {getMatiereColor(matiereId)}"
                    >
                      {getMatiereName(matiereId)}
                    </span>
                  {:else}
                    <span class="text-gray-400 text-sm">Aucune matière</span>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {theme.question_count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}">
                  {theme.question_count} question{theme.question_count !== 1 ? 's' : ''}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                {#if theme.is_active}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Actif
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inactif
                  </span>
                {/if}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    onclick={() => openEditModal(theme)}
                    class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit2 class="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onclick={() => handleDelete(theme)}
                    class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    title="Supprimer"
                    disabled={theme.question_count > 0}
                  >
                    <Trash2 class="w-4 h-4 {theme.question_count > 0 ? 'text-gray-300' : 'text-red-600'}" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<!-- Create/Edit Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingTheme ? 'Modifier le thème' : 'Nouveau thème'}</Dialog.Title>
      <Dialog.Description>
        {editingTheme ? 'Modifiez les informations du thème' : 'Créez un nouveau thème pour les questions'}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="space-y-4 py-4">
      {#if modalError}
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {modalError}
        </div>
      {/if}

      <!-- Nom -->
      <div>
        <label for="theme-name" class="block text-sm font-medium text-gray-700 mb-1">
          Nom du thème *
        </label>
        <Input
          id="theme-name"
          bind:value={formName}
          placeholder="Ex: Nature, Sciences, Histoire..."
        />
      </div>

      <!-- Matières -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Matières associées
        </label>
        <div class="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
          <div class="grid grid-cols-2 gap-2">
            {#each (data.matieres || []) as matiere (matiere.id)}
              {@const isSelected = formMatiereIds.includes(matiere.id)}
              <button
                type="button"
                onclick={() => toggleMatiere(matiere.id)}
                class="flex items-center gap-2 p-2 rounded-lg border transition-all text-left {isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}"
              >
                <div 
                  class="w-4 h-4 rounded flex items-center justify-center {isSelected ? 'bg-green-500' : 'bg-gray-200'}"
                >
                  {#if isSelected}
                    <Check class="w-3 h-3 text-white" />
                  {/if}
                </div>
                <span 
                  class="w-3 h-3 rounded-full"
                  style="background-color: {matiere.color || '#6B7280'}"
                ></span>
                <span class="text-sm {isSelected ? 'font-medium' : ''}">{matiere.name}</span>
              </button>
            {/each}
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-1">{formMatiereIds.length} matière(s) sélectionnée(s)</p>
      </div>

      <!-- Actif -->
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="theme-active"
          bind:checked={formIsActive}
          class="w-4 h-4 text-green-600 rounded"
        />
        <label for="theme-active" class="text-sm font-medium text-gray-700">Thème actif</label>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={closeModal} disabled={isSaving}>
        Annuler
      </Button>
      <Button onclick={handleSave} disabled={isSaving} class="bg-green-600 hover:bg-green-700">
        {#if isSaving}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          Enregistrement...
        {:else}
          {editingTheme ? 'Mettre à jour' : 'Créer'}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Modal -->
<Dialog.Root open={!!deleteConfirm} onOpenChange={(open) => !open && (deleteConfirm = null)}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Confirmer la suppression</Dialog.Title>
      <Dialog.Description>
        Êtes-vous sûr de vouloir supprimer le thème "{deleteConfirm?.name}" ?
        Cette action est irréversible.
      </Dialog.Description>
    </Dialog.Header>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => deleteConfirm = null} disabled={isDeleting}>
        Annuler
      </Button>
      <Button variant="destructive" onclick={confirmDelete} disabled={isDeleting}>
        {#if isDeleting}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          Suppression...
        {:else}
          Supprimer
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
