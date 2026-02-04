<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, GripVertical, FolderOpen, Palette } from "lucide-svelte";

  interface SpecialtyGroup {
    id: string;
    code: string;
    name: string;
    icon: string;
    color: string;
    context: string;
    order: number;
    is_active: boolean;
    specialty_count?: number;
  }

  let groups = $state<SpecialtyGroup[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Modal state
  let showModal = $state(false);
  let editingGroup = $state<SpecialtyGroup | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formIcon = $state('📚');
  let formColor = $state('gray');
  let formContext = $state('all');

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  // Drag & Drop
  let draggingId = $state<string | null>(null);

  // Color options
  const colorOptions = [
    { value: 'gray', label: 'Gris', class: 'bg-gray-500' },
    { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { value: 'green', label: 'Vert', class: 'bg-green-500' },
    { value: 'amber', label: 'Ambre', class: 'bg-amber-500' },
    { value: 'red', label: 'Rouge', class: 'bg-red-500' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
    { value: 'slate', label: 'Ardoise', class: 'bg-slate-500' },
  ];

  // Icon suggestions
  const iconSuggestions = ['📚', '🏢', '⚙️', '🏗️', '✨', '🌍', '💼', '🔧', '🎨', '🏥', '🍳', '✈️', '💻', '🚗'];

  // Context options
  const contextOptions = [
    { value: 'all', label: 'Tous les contextes' },
    { value: 'pro', label: 'Voie Professionnelle' },
    { value: 'general', label: 'Voie Générale' },
    { value: 'techno', label: 'Voie Technologique' },
    { value: 'formation_continue', label: 'Formation Continue' },
  ];

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/admin/specialty-groups');
      if (res.ok) {
        const data = await res.json();
        groups = data.groups || [];
      } else {
        error = 'Erreur lors du chargement';
      }
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }

  function openAddModal() {
    editingGroup = null;
    formName = '';
    formCode = '';
    formIcon = '📚';
    formColor = 'gray';
    formContext = 'all';
    modalError = '';
    showModal = true;
  }

  function openEditModal(group: SpecialtyGroup) {
    editingGroup = group;
    formName = group.name;
    formCode = group.code;
    formIcon = group.icon || '📚';
    formColor = group.color || 'gray';
    formContext = group.context || 'all';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingGroup = null;
    modalError = '';
  }

  async function saveGroup() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }
    if (!editingGroup && !formCode.trim()) {
      modalError = 'Le code est requis';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toLowerCase().replace(/\s+/g, '_'),
        icon: formIcon,
        color: formColor,
        context: formContext,
        is_active: editingGroup?.is_active ?? true
      };

      const url = editingGroup 
        ? `/api/admin/specialty-groups/${editingGroup.id.split(':')[1]}` 
        : '/api/admin/specialty-groups';
      
      const res = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        modalError = data.message || 'Erreur lors de la sauvegarde';
        return;
      }

      closeModal();
      await loadData();
    } catch (e) {
      modalError = 'Erreur de connexion au serveur';
    } finally {
      saving = false;
    }
  }

  function confirmDelete(groupId: string) {
    deleteConfirm = groupId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteGroup(groupId: string) {
    deleting = true;
    try {
      const id = groupId.split(':')[1];
      const res = await fetch(`/api/admin/specialty-groups/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur lors de la suppression';
        deleteConfirm = null;
        return;
      }

      deleteConfirm = null;
      await loadData();
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      deleting = false;
    }
  }

  // Drag & Drop
  function handleDragStart(e: DragEvent, groupId: string) {
    draggingId = groupId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) {
      draggingId = null;
      return;
    }

    const dragIndex = groups.findIndex(g => g.id === draggingId);
    const dropIndex = groups.findIndex(g => g.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      const newGroups = [...groups];
      const [removed] = newGroups.splice(dragIndex, 1);
      newGroups.splice(dropIndex, 0, removed);
      groups = newGroups;
      
      saveOrder(newGroups.map(g => g.id));
    }

    draggingId = null;
  }

  async function saveOrder(orderedIds: string[]) {
    try {
      await fetch('/api/admin/specialty-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }

  function getColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      slate: 'bg-slate-500',
    };
    return colorMap[color] || 'bg-gray-500';
  }
</script>

<svelte:head>
  <title>Pôles de spécialités - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/system/settings" class="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Pôles de spécialités</h1>
        <p class="text-gray-400 mt-1">Groupes de spécialités (Services, Techniques, BTP...)</p>
      </div>
      <Button onclick={openAddModal}>
        <Plus class="w-4 h-4 mr-2" />
        Nouveau pôle
      </Button>
    </div>
  </div>

  <!-- Error -->
  {#if error}
    <div class="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
      {error}
      <button onclick={() => error = ''} class="ml-2 underline">Fermer</button>
    </div>
  {/if}

  <!-- Loading -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-gray-500" />
    </div>
  {:else if groups.length === 0}
    <!-- Empty state -->
    <div class="text-center py-12 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">
      <FolderOpen class="w-12 h-12 mx-auto text-gray-500 mb-4" />
      <h3 class="text-lg font-medium text-white mb-2">Aucun pôle</h3>
      <p class="text-gray-400 mb-4">Créez votre premier pôle de spécialités</p>
      <Button onclick={openAddModal}>
        <Plus class="w-4 h-4 mr-2" />
        Nouveau pôle
      </Button>
    </div>
  {:else}
    <!-- Groups List -->
    <div class="space-y-2" role="list">
      {#each groups as group (group.id)}
        <div
          role="listitem"
          animate:flip={{ duration: 200 }}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, group.id)}
          ondragover={handleDragOver}
          ondrop={(e) => handleDrop(e, group.id)}
          class="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors {draggingId === group.id ? 'opacity-50' : ''}"
        >
          <!-- Drag handle -->
          <div class="cursor-grab text-gray-500 hover:text-gray-300">
            <GripVertical class="w-5 h-5" />
          </div>

          <!-- Icon & Color indicator -->
          <div class="flex items-center gap-3">
            <span class="text-2xl">{group.icon || '📚'}</span>
            <div class="w-3 h-3 rounded-full {getColorClass(group.color)}"></div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-white">{group.name}</span>
              <code class="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{group.code}</code>
              {#if !group.is_active}
                <span class="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/30">Inactif</span>
              {/if}
            </div>
            <div class="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
              <span>{contextOptions.find(c => c.value === group.context)?.label || group.context}</span>
              <span>•</span>
              <span>{group.specialty_count || 0} spécialité(s)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" onclick={() => openEditModal(group)} class="text-gray-400 hover:text-white hover:bg-gray-700">
              <Edit2 class="w-4 h-4" />
            </Button>
            
            {#if deleteConfirm === group.id}
              <div class="flex items-center gap-1 bg-red-500/20 rounded-lg px-2 py-1">
                <span class="text-xs text-red-400">Supprimer ?</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onclick={() => deleteGroup(group.id)}
                  disabled={deleting}
                  class="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  {#if deleting}
                    <Loader2 class="w-4 h-4 animate-spin" />
                  {:else}
                    <Check class="w-4 h-4" />
                  {/if}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onclick={cancelDelete}
                  class="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <X class="w-4 h-4" />
                </Button>
              </div>
            {:else}
              <Button 
                variant="ghost" 
                size="sm" 
                onclick={() => confirmDelete(group.id)}
                class="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add/Edit Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingGroup ? 'Modifier le pôle' : 'Nouveau pôle'}</Dialog.Title>
      <Dialog.Description>
        {editingGroup ? 'Modifiez les informations du pôle' : 'Créez un nouveau pôle de spécialités'}
      </Dialog.Description>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
        {modalError}
      </div>
    {/if}

    <div class="space-y-4 py-4">
      <!-- Name -->
      <div>
        <label for="name" class="block text-sm font-medium mb-1.5">Nom *</label>
        <Input 
          id="name"
          bind:value={formName}
          placeholder="Ex: Pôle Services et Tertiaire"
        />
      </div>

      <!-- Code -->
      <div>
        <label for="code" class="block text-sm font-medium mb-1.5">
          Code * {#if editingGroup}<span class="text-muted-foreground font-normal">(non modifiable)</span>{/if}
        </label>
        <Input 
          id="code"
          bind:value={formCode}
          placeholder="Ex: services_tertiaire"
          disabled={!!editingGroup}
        />
      </div>

      <!-- Icon -->
      <div>
        <label for="icon" class="block text-sm font-medium mb-1.5">Icône</label>
        <div class="flex items-center gap-2">
          <Input 
            id="icon"
            bind:value={formIcon}
            class="w-20 text-center text-xl"
          />
          <div class="flex flex-wrap gap-1">
            {#each iconSuggestions as icon}
              <button
                type="button"
                onclick={() => formIcon = icon}
                class="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors {formIcon === icon ? 'bg-primary/20 ring-2 ring-primary' : ''}"
              >
                {icon}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Color -->
      <div>
        <span class="block text-sm font-medium mb-1.5">Couleur</span>
        <div class="flex flex-wrap gap-2">
          {#each colorOptions as color}
            <button
              type="button"
              onclick={() => formColor = color.value}
              class="w-8 h-8 rounded-full {color.class} transition-transform hover:scale-110 {formColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}"
              title={color.label}
            ></button>
          {/each}
        </div>
      </div>

      <!-- Context -->
      <div>
        <span class="block text-sm font-medium mb-1.5">Contexte</span>
        <Select.Root type="single" bind:value={formContext}>
          <Select.Trigger class="w-full">
            {#snippet children()}
              {contextOptions.find(c => c.value === formContext)?.label || 'Sélectionner'}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            {#each contextOptions as ctx}
              <Select.Item value={ctx.value}>{ctx.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={closeModal}>Annuler</Button>
      <Button onclick={saveGroup} disabled={saving}>
        {#if saving}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {/if}
        {editingGroup ? 'Enregistrer' : 'Créer'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
