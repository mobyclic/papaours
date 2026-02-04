<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, GripVertical, BookOpen } from "lucide-svelte";

  interface Domain {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    order: number;
    is_active: boolean;
    subject_count?: number;
  }

  let domains = $state<Domain[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Modal state
  let showModal = $state(false);
  let editingDomain = $state<Domain | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formDescription = $state('');
  let formColor = $state('#6366F1');
  let formIcon = $state('');

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  // Drag & Drop
  let draggingId = $state<string | null>(null);

  const defaultColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16',
  ];

  const defaultIcons = ['📚', '🔬', '🗣️', '🎨', '⚽', '💻', '🌍', '📐', '🎵', '✍️'];

  onMount(async () => {
    await loadDomains();
  });

  async function loadDomains() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/admin/domains');
      if (res.ok) {
        const data = await res.json();
        domains = data.domains || [];
      } else {
        error = 'Erreur lors du chargement des domaines';
      }
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }

  function openAddModal() {
    editingDomain = null;
    formName = '';
    formCode = '';
    formDescription = '';
    formColor = '#6366F1';
    formIcon = '📚';
    modalError = '';
    showModal = true;
  }

  function openEditModal(domain: Domain) {
    editingDomain = domain;
    formName = domain.name;
    formCode = domain.code;
    formDescription = domain.description || '';
    formColor = domain.color || '#6366F1';
    formIcon = domain.icon || '';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingDomain = null;
    modalError = '';
  }

  async function saveDomain() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        description: formDescription.trim() || null,
        color: formColor,
        icon: formIcon.trim() || null,
        is_active: editingDomain?.is_active ?? true
      };

      const url = editingDomain 
        ? `/api/admin/domains/${editingDomain.id.split(':')[1]}` 
        : '/api/admin/domains';
      
      const res = await fetch(url, {
        method: editingDomain ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        modalError = data.message || 'Erreur lors de la sauvegarde';
        return;
      }

      closeModal();
      await loadDomains();
    } catch (e) {
      modalError = 'Erreur de connexion au serveur';
    } finally {
      saving = false;
    }
  }

  function confirmDelete(domainId: string) {
    deleteConfirm = domainId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteDomain(domainId: string) {
    deleting = true;
    try {
      const id = domainId.split(':')[1];
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur lors de la suppression';
        deleteConfirm = null;
        return;
      }

      deleteConfirm = null;
      await loadDomains();
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      deleting = false;
    }
  }

  // Drag & Drop handlers
  function handleDragStart(e: DragEvent, domainId: string) {
    draggingId = domainId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', domainId);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) {
      draggingId = null;
      return;
    }

    const dragIndex = domains.findIndex(d => d.id === draggingId);
    const dropIndex = domains.findIndex(d => d.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      const newDomains = [...domains];
      const [removed] = newDomains.splice(dragIndex, 1);
      newDomains.splice(dropIndex, 0, removed);
      domains = newDomains;
      saveOrder(newDomains.map(d => d.id));
    }

    draggingId = null;
  }

  function handleDragEnd() {
    draggingId = null;
  }

  async function saveOrder(orderedIds: string[]) {
    try {
      await fetch('/api/admin/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }

  function getDomainId(domain: Domain): string {
    return typeof domain.id === 'string' ? domain.id : String(domain.id);
  }
</script>

<svelte:head>
  <title>Domaines - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/system/settings" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Domaines</h1>
        <p class="text-gray-400 mt-2">Regroupez les matières par domaine (Humanités, Sciences, Langues...)</p>
      </div>
      <Button onclick={openAddModal}>
        <Plus class="w-4 h-4 mr-2" />
        Nouveau domaine
      </Button>
    </div>
  </div>

  {#if error}
    <div class="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
      {error}
      <button onclick={() => error = ''} class="ml-2 hover:opacity-70">×</button>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-gray-400">Chargement...</span>
    </div>
  {:else}
    <!-- Liste avec drag & drop -->
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
      <div class="p-4 bg-gray-800/50 border-b border-gray-700">
        <p class="text-sm text-gray-400 flex items-center gap-2">
          <GripVertical class="w-4 h-4" />
          Glissez-déposez pour réorganiser l'ordre d'affichage
        </p>
      </div>
      
      {#if domains.length === 0}
        <div class="px-6 py-12 text-center text-muted-foreground">
          Aucun domaine pour le moment.
          <button onclick={openAddModal} class="text-primary hover:underline ml-1">
            Créer le premier ?
          </button>
        </div>
      {:else}
        <div class="divide-y divide-gray-800">
          {#each domains as domain (getDomainId(domain))}
            <div
              class="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors {draggingId === domain.id ? 'opacity-50 bg-gray-800' : ''}"
              draggable="true"
              ondragstart={(e) => handleDragStart(e, domain.id)}
              ondragover={handleDragOver}
              ondrop={(e) => handleDrop(e, domain.id)}
              ondragend={handleDragEnd}
              animate:flip={{ duration: 200 }}
              role="listitem"
            >
              <!-- Drag handle -->
              <div class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical class="w-5 h-5" />
              </div>

              <!-- Icon & Color -->
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" 
                style="background-color: {domain.color || '#6366F1'}20; border: 2px solid {domain.color || '#6366F1'}40"
              >
                {domain.icon || '📚'}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-white">{domain.name}</span>
                  <span class="text-xs text-gray-300 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                    {domain.code}
                  </span>
                  {#if !domain.is_active}
                    <span class="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Inactif
                    </span>
                  {/if}
                </div>
                {#if domain.description}
                  <p class="text-sm text-gray-400 truncate">{domain.description}</p>
                {/if}
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-2 text-sm text-gray-400">
                <BookOpen class="w-4 h-4" />
                <span>{domain.subject_count || 0} matière(s)</span>
              </div>

              <!-- Actions -->
              {#if deleteConfirm === getDomainId(domain)}
                <div class="flex items-center gap-2">
                  <span class="text-sm text-destructive">Supprimer ?</span>
                  <button 
                    onclick={() => deleteDomain(getDomainId(domain))}
                    disabled={deleting}
                    class="p-1.5 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {#if deleting}
                      <Loader2 class="w-4 h-4 text-destructive animate-spin" />
                    {:else}
                      <Check class="w-4 h-4 text-destructive" />
                    {/if}
                  </button>
                  <button 
                    onclick={cancelDelete}
                    class="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              {:else}
                <div class="flex items-center gap-1">
                  <button 
                    onclick={() => openEditModal(domain)}
                    class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit2 class="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    onclick={() => confirmDelete(getDomainId(domain))}
                    class="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Supprimer"
                    disabled={(domain.subject_count || 0) > 0}
                  >
                    <Trash2 class="w-4 h-4 text-destructive {(domain.subject_count || 0) > 0 ? 'opacity-30' : ''}" />
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>
        {editingDomain ? 'Modifier le domaine' : 'Nouveau domaine'}
      </Dialog.Title>
      <Dialog.Description>
        Les domaines permettent de regrouper les matières par catégorie.
      </Dialog.Description>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
        {modalError}
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); saveDomain(); }} class="space-y-4">
      <!-- Nom -->
      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">
          Nom <span class="text-destructive">*</span>
        </label>
        <Input
          id="name"
          bind:value={formName}
          placeholder="Ex: Humanités"
          required
        />
      </div>

      <!-- Code (optionnel pour création) -->
      {#if !editingDomain}
        <div class="space-y-2">
          <label for="code" class="text-sm font-medium">
            Code <span class="text-muted-foreground">(optionnel)</span>
          </label>
          <Input
            id="code"
            bind:value={formCode}
            placeholder="Auto-généré si vide"
            class="font-mono"
          />
        </div>
      {/if}

      <!-- Description -->
      <div class="space-y-2">
        <label for="description" class="text-sm font-medium">Description</label>
        <textarea
          id="description"
          bind:value={formDescription}
          rows="2"
          class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-ring"
          placeholder="Description optionnelle..."
        ></textarea>
      </div>

      <!-- Icône -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Icône</label>
        <div class="flex flex-wrap gap-2">
          {#each defaultIcons as icon}
            <button
              type="button"
              onclick={() => formIcon = icon}
              class="w-10 h-10 rounded-lg text-xl hover:bg-muted transition-colors {formIcon === icon ? 'ring-2 ring-primary bg-muted' : 'bg-muted/50'}"
            >
              {icon}
            </button>
          {/each}
        </div>
        <Input
          bind:value={formIcon}
          placeholder="Ou entrez un emoji..."
          class="mt-2"
        />
      </div>

      <!-- Couleur -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Couleur</label>
        <div class="flex flex-wrap gap-2">
          {#each defaultColors as color}
            <button
              type="button"
              onclick={() => formColor = color}
              class="w-8 h-8 rounded-lg transition-transform hover:scale-110 {formColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}"
              style="background-color: {color}"
            ></button>
          {/each}
        </div>
        <div class="flex items-center gap-2 mt-2">
          <input type="color" bind:value={formColor} class="w-10 h-10 rounded cursor-pointer" />
          <Input bind:value={formColor} class="font-mono flex-1" />
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex gap-3 pt-4">
        <Button type="button" variant="outline" onclick={closeModal} class="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} class="flex-1">
          {#if saving}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {:else}
            <Check class="w-4 h-4 mr-2" />
          {/if}
          {editingDomain ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
