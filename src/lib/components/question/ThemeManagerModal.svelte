<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Search, X, Plus, Edit2, Trash2, Check, Loader2 } from "lucide-svelte";

  interface Theme {
    id: string;
    name: string;
    slug: string;
    matiere_id: string | null;
    matiere_ids: string[];
    is_active?: boolean;
  }

  interface Matiere {
    id: string;
    name: string;
    icon?: string;
  }

  interface Props {
    open?: boolean;
    matieres: Matiere[];
    selectedThemeIds: string[];
    prefilterMatiereId?: string; // Pre-filter by the question's matiere
    onSelect: (themeIds: string[]) => void;
    onClose: () => void;
  }

  let { 
    open = $bindable(false),
    matieres,
    selectedThemeIds = [],
    prefilterMatiereId = '',
    onSelect,
    onClose
  }: Props = $props();

  // Local state
  let searchQuery = $state('');
  let filterMatiereIds = $state<string[]>([]);
  let themes = $state<Theme[]>([]);
  let loading = $state(false);
  let loadError = $state<string | null>(null);
  let localSelectedIds = $state<string[]>([]);
  let hasFetched = $state(false);

  // Edit/Create mode
  let editMode = $state<'none' | 'create' | 'edit'>('none');
  let editingTheme = $state<Theme | null>(null);
  let editName = $state('');
  let editMatiereIds = $state<string[]>([]);
  let saving = $state(false);
  let deleteConfirm = $state<string | null>(null);

  // Initialize when dialog opens (called from onOpenChange)
  function initializeModal() {
    localSelectedIds = [...selectedThemeIds];
    filterMatiereIds = prefilterMatiereId ? [prefilterMatiereId] : [];
    searchQuery = '';
    editMode = 'none';
    editingTheme = null;
    loadError = null;
    hasFetched = false;
    fetchThemes();
  }

  // Handle dialog open/close
  function handleOpenChange(isOpen: boolean) {
    if (isOpen && !hasFetched) {
      initializeModal();
    }
    if (!isOpen) {
      onClose();
    }
  }

  // Fetch themes with search/filter
  async function fetchThemes() {
    // Prevent concurrent fetches
    if (loading) return;
    
    hasFetched = true;
    loading = true;
    loadError = null;
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) params.set('search', searchQuery);
      // Use first filter matiere for API (supports one at a time currently)
      if (filterMatiereIds.length > 0) {
        params.set('matiere_id', filterMatiereIds[0]);
      }
      
      const res = await fetch(`/api/themes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        themes = data.themes || [];
      } else {
        loadError = 'Erreur serveur lors du chargement des thèmes';
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      loadError = 'Impossible de charger les thèmes. Vérifiez votre connexion.';
    } finally {
      loading = false;
    }
  }

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchThemes, 300);
  }

  // Toggle matiere filter
  function toggleMatiereFilter(matiereId: string) {
    if (filterMatiereIds.includes(matiereId)) {
      filterMatiereIds = filterMatiereIds.filter(id => id !== matiereId);
    } else {
      filterMatiereIds = [...filterMatiereIds, matiereId];
    }
    fetchThemes();
  }

  // Toggle theme selection
  function toggleThemeSelection(themeId: string) {
    if (localSelectedIds.includes(themeId)) {
      localSelectedIds = localSelectedIds.filter(id => id !== themeId);
    } else {
      localSelectedIds = [...localSelectedIds, themeId];
    }
  }

  // Get matiere name by ID
  function getMatiereName(id: string): string {
    return matieres.find(m => m.id === id)?.name || 'Inconnu';
  }

  // Get matiere icon
  function getMatiereIcon(id: string): string {
    return matieres.find(m => m.id === id)?.icon || '';
  }

  // Start creating new theme
  function startCreate() {
    editMode = 'create';
    editingTheme = null;
    editName = '';
    // Pre-select current filter matières
    editMatiereIds = [...filterMatiereIds];
  }

  // Start editing theme
  function startEdit(theme: Theme) {
    editMode = 'edit';
    editingTheme = theme;
    editName = theme.name;
    editMatiereIds = [...(theme.matiere_ids || [])];
  }

  // Cancel edit
  function cancelEdit() {
    editMode = 'none';
    editingTheme = null;
    editName = '';
    editMatiereIds = [];
  }

  // Save theme (create or update)
  async function saveTheme() {
    if (!editName.trim()) return;
    
    saving = true;
    try {
      const url = editMode === 'create' 
        ? '/api/themes'
        : `/api/themes/${editingTheme?.id}`;
      
      const method = editMode === 'create' ? 'POST' : 'PATCH';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          matiere_ids: editMatiereIds
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Refresh list
        await fetchThemes();
        
        // If creating, auto-select the new theme
        if (editMode === 'create' && data.theme?.id) {
          localSelectedIds = [...localSelectedIds, data.theme.id];
        }
        
        cancelEdit();
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      saving = false;
    }
  }

  // Toggle matiere for edit
  function toggleEditMatiere(matiereId: string) {
    if (editMatiereIds.includes(matiereId)) {
      editMatiereIds = editMatiereIds.filter(id => id !== matiereId);
    } else {
      editMatiereIds = [...editMatiereIds, matiereId];
    }
  }

  // Delete theme
  async function deleteTheme(themeId: string) {
    try {
      const res = await fetch(`/api/themes/${themeId}`, { method: 'DELETE' });
      
      if (res.ok) {
        // Remove from local selection if selected
        localSelectedIds = localSelectedIds.filter(id => id !== themeId);
        // Refresh list
        await fetchThemes();
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Erreur lors de la suppression');
    }
    deleteConfirm = null;
  }

  // Confirm and close
  function handleConfirm() {
    onSelect(localSelectedIds);
    open = false;
    onClose();
  }

  // Cancel and close
  function handleCancel() {
    open = false;
    onClose();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-3xl max-h-[85vh] flex flex-col">
    <Dialog.Header>
      <Dialog.Title>Gérer les thèmes</Dialog.Title>
      <Dialog.Description>
        Sélectionnez, créez ou modifiez les thèmes de la question.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-hidden flex flex-col gap-4 py-4">
      <!-- Search and Create -->
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un thème..."
            bind:value={searchQuery}
            oninput={handleSearch}
            class="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onclick={startCreate}
          disabled={editMode !== 'none'}
          class="shrink-0"
        >
          <Plus class="w-4 h-4 mr-1" />
          Nouveau thème
        </Button>
      </div>

      <!-- Matière filters -->
      <div class="flex flex-wrap gap-2">
        <span class="text-sm text-gray-500 self-center mr-1">Filtrer par matière :</span>
        {#each matieres as matiere}
          <button
            type="button"
            onclick={() => toggleMatiereFilter(matiere.id)}
            class="px-2.5 py-1 text-xs rounded-full transition-all {filterMatiereIds.includes(matiere.id) 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            {matiere.icon || ''} {matiere.name}
          </button>
        {/each}
        {#if filterMatiereIds.length > 0}
          <button
            type="button"
            onclick={() => { filterMatiereIds = []; fetchThemes(); }}
            class="px-2 py-1 text-xs text-red-500 hover:text-red-700"
          >
            Effacer
          </button>
        {/if}
      </div>

      <!-- Create/Edit form -->
      {#if editMode !== 'none'}
        <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-blue-800">
              {editMode === 'create' ? '➕ Créer un nouveau thème' : '✏️ Modifier le thème'}
            </h4>
            <button 
              type="button" 
              onclick={cancelEdit}
              class="text-blue-500 hover:text-blue-700"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom du thème *
              </label>
              <Input
                type="text"
                bind:value={editName}
                placeholder="Ex: Révolution française, Algèbre linéaire..."
                class="bg-white"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Matières associées <span class="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <div class="flex flex-wrap gap-2">
                {#each matieres as matiere}
                  <button
                    type="button"
                    onclick={() => toggleEditMatiere(matiere.id)}
                    class="px-2.5 py-1 text-xs rounded-full transition-all border {editMatiereIds.includes(matiere.id) 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}"
                  >
                    {editMatiereIds.includes(matiere.id) ? '✓' : ''} {matiere.icon || ''} {matiere.name}
                  </button>
                {/each}
              </div>
            </div>
            
            <div class="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onclick={cancelEdit}>
                Annuler
              </Button>
              <Button 
                size="sm" 
                onclick={saveTheme}
                disabled={!editName.trim() || saving}
                class="bg-green-600 hover:bg-green-700"
              >
                {#if saving}
                  <Loader2 class="w-4 h-4 mr-1 animate-spin" />
                {:else}
                  <Check class="w-4 h-4 mr-1" />
                {/if}
                {editMode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Themes list -->
      <div class="flex-1 overflow-y-auto min-h-[200px] border rounded-lg">
        {#if loading}
          <div class="flex items-center justify-center h-32 text-gray-500">
            <Loader2 class="w-6 h-6 animate-spin mr-2" />
            Chargement...
          </div>
        {:else if loadError}
          <div class="flex flex-col items-center justify-center h-32 text-red-500 p-4">
            <p class="font-medium">⚠️ {loadError}</p>
            <button
              type="button"
              onclick={fetchThemes}
              class="mt-2 text-sm text-blue-600 hover:underline"
            >
              Réessayer
            </button>
          </div>
        {:else if themes.length === 0}
          <div class="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>Aucun thème trouvé</p>
            {#if searchQuery || filterMatiereIds.length > 0}
              <p class="text-sm">Essayez de modifier vos filtres</p>
            {/if}
          </div>
        {:else}
          <div class="divide-y divide-gray-100">
            {#each themes as theme (theme.id)}
              <div 
                class="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors {localSelectedIds.includes(theme.id) ? 'bg-blue-50' : ''}"
              >
                <!-- Checkbox -->
                <button
                  type="button"
                  onclick={() => toggleThemeSelection(theme.id)}
                  class="w-6 h-6 rounded border-2 flex items-center justify-center transition-all shrink-0 {localSelectedIds.includes(theme.id) 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 hover:border-blue-400'}"
                >
                  {#if localSelectedIds.includes(theme.id)}
                    <Check class="w-4 h-4" />
                  {/if}
                </button>
                
                <!-- Theme info -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-800 truncate">{theme.name}</p>
                  {#if theme.matiere_ids && theme.matiere_ids.length > 0}
                    <p class="text-xs text-gray-500 truncate">
                      {theme.matiere_ids.map(id => `${getMatiereIcon(id)} ${getMatiereName(id)}`).join(' • ')}
                    </p>
                  {:else}
                    <p class="text-xs text-gray-400 italic">Aucune matière associée</p>
                  {/if}
                </div>
                
                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onclick={() => startEdit(theme)}
                    class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  
                  {#if deleteConfirm === theme.id}
                    <div class="flex items-center gap-1 bg-red-50 rounded px-2 py-1">
                      <span class="text-xs text-red-600">Supprimer ?</span>
                      <button
                        type="button"
                        onclick={() => deleteTheme(theme.id)}
                        class="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Check class="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onclick={() => deleteConfirm = null}
                        class="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <X class="w-3 h-3" />
                      </button>
                    </div>
                  {:else}
                    <button
                      type="button"
                      onclick={() => deleteConfirm = theme.id}
                      class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Selection summary -->
      <div class="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
        <strong>{localSelectedIds.length}</strong> thème{localSelectedIds.length !== 1 ? 's' : ''} sélectionné{localSelectedIds.length !== 1 ? 's' : ''}
        {#if localSelectedIds.length > 0}
          <span class="text-gray-400 ml-2">
            ({themes.filter(t => localSelectedIds.includes(t.id)).map(t => t.name).join(', ')})
          </span>
        {/if}
      </div>
    </div>

    <Dialog.Footer class="flex gap-2 justify-end">
      <Button variant="outline" onclick={handleCancel}>
        Annuler
      </Button>
      <Button onclick={handleConfirm} class="bg-blue-600 hover:bg-blue-700">
        <Check class="w-4 h-4 mr-1" />
        Valider la sélection
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
