<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, GripVertical, BookOpen, Star } from "lucide-svelte";

  interface Track {
    id: string;
    code: string;
    name: string;
    cycle_name?: string;
    system_name?: string;
    system_flag?: string;
  }

  interface Specialty {
    id: string;
    code: string;
    name: string;
    description?: string;
    track_id?: string;
    track_code?: string;
    track_name?: string;
    cycle_name?: string;
    system_name?: string;
    system_flag?: string;
    order: number;
    is_active: boolean;
    program_count?: number;
  }

  let specialties = $state<Specialty[]>([]);
  let tracks = $state<Track[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Filter
  let filterTrack = $state<string>('all');

  // Modal state
  let showModal = $state(false);
  let editingSpecialty = $state<Specialty | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formDescription = $state('');
  let formTrack = $state('');

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  // Drag & Drop
  let draggingId = $state<string | null>(null);

  // Filtrer les spécialités
  let filteredSpecialties = $derived(
    filterTrack === 'all' 
      ? specialties 
      : specialties.filter(s => s.track_code === filterTrack)
  );

  // Grouper par track
  let specialtiesByTrack = $derived(() => {
    const grouped: Record<string, Specialty[]> = {};
    for (const spec of filteredSpecialties) {
      const trackKey = `${spec.system_flag || '🌍'} ${spec.track_name || 'Autre'} (${spec.cycle_name || ''})`;
      if (!grouped[trackKey]) grouped[trackKey] = [];
      grouped[trackKey].push(spec);
    }
    return grouped;
  });

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';
    try {
      let url = '/api/admin/specialties';
      if (filterTrack !== 'all') {
        url += `?track=${filterTrack}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        specialties = data.specialties || [];
        tracks = data.tracks || [];
        if (tracks.length > 0 && !formTrack) {
          formTrack = tracks[0].code;
        }
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
    editingSpecialty = null;
    formName = '';
    formCode = '';
    formDescription = '';
    formTrack = tracks[0]?.code || '';
    modalError = '';
    showModal = true;
  }

  function openEditModal(spec: Specialty) {
    editingSpecialty = spec;
    formName = spec.name;
    formCode = spec.code;
    formDescription = spec.description || '';
    formTrack = spec.track_code || '';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingSpecialty = null;
    modalError = '';
  }

  async function saveSpecialty() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }
    if (!editingSpecialty && !formCode.trim()) {
      modalError = 'Le code est requis';
      return;
    }
    if (!formTrack) {
      modalError = 'La filière est requise';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toLowerCase(),
        description: formDescription.trim() || null,
        track: formTrack,
        is_active: editingSpecialty?.is_active ?? true
      };

      const url = editingSpecialty 
        ? `/api/admin/specialties/${editingSpecialty.id.split(':')[1]}` 
        : '/api/admin/specialties';
      
      const res = await fetch(url, {
        method: editingSpecialty ? 'PUT' : 'POST',
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

  function confirmDelete(specId: string) {
    deleteConfirm = specId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteSpecialty(specId: string) {
    deleting = true;
    try {
      const id = specId.split(':')[1];
      const res = await fetch(`/api/admin/specialties/${id}`, { method: 'DELETE' });
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
  function handleDragStart(e: DragEvent, specId: string) {
    draggingId = specId;
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

    const dragIndex = specialties.findIndex(s => s.id === draggingId);
    const dropIndex = specialties.findIndex(s => s.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      // Vérifier qu'ils sont du même track
      if (specialties[dragIndex].track_id !== specialties[dropIndex].track_id) {
        draggingId = null;
        return;
      }

      const newSpecialties = [...specialties];
      const [removed] = newSpecialties.splice(dragIndex, 1);
      newSpecialties.splice(dropIndex, 0, removed);
      specialties = newSpecialties;
      
      // Sauvegarder uniquement les spécialités du même track
      const trackSpecialties = newSpecialties
        .filter(s => s.track_id === removed.track_id)
        .map(s => s.id);
      saveOrder(trackSpecialties);
    }

    draggingId = null;
  }

  async function saveOrder(orderedIds: string[]) {
    try {
      await fetch('/api/admin/specialties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialties: orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }

  function getSpecId(spec: Specialty): string {
    return typeof spec.id === 'string' ? spec.id : String(spec.id);
  }
</script>

<svelte:head>
  <title>Spécialités - Paramètres</title>
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
        <h1 class="text-3xl font-bold">Spécialités</h1>
        <p class="text-muted-foreground mt-1">Mathématiques, Physique-Chimie, SVT, SES, LLCE...</p>
      </div>
      <div class="flex items-center gap-3">
        <Select.Root type="single" bind:value={filterTrack}>
          <Select.Trigger class="w-56">
            {#snippet children()}
              {filterTrack === 'all' ? 'Toutes les filières' : tracks.find(t => t.code === filterTrack)?.name || filterTrack}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Toutes les filières</Select.Item>
            {#each tracks as trk}
              <Select.Item value={trk.code}>{trk.system_flag} {trk.name} ({trk.cycle_name})</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Button onclick={openAddModal}>
          <Plus class="w-4 h-4 mr-2" />
          Nouvelle spécialité
        </Button>
      </div>
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
    </div>
  {:else if tracks.length === 0}
    <div class="text-center py-12 text-muted-foreground">
      <Star class="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>Aucune filière n'existe encore.</p>
      <p class="text-sm mt-1">Créez d'abord des filières pour pouvoir ajouter des spécialités.</p>
      <a href="/admin/system/settings/tracks" class="text-primary hover:underline mt-2 inline-block">
        Gérer les filières →
      </a>
    </div>
  {:else}
    {#each Object.entries(specialtiesByTrack()) as [trackKey, trackSpecialties]}
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-3">{trackKey}</h2>
        <div class="bg-card rounded-xl shadow border overflow-hidden">
          <div class="divide-y">
            {#each trackSpecialties as spec (getSpecId(spec))}
              <div
                class="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors {draggingId === spec.id ? 'opacity-50 bg-muted' : ''}"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, spec.id)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, spec.id)}
                animate:flip={{ duration: 200 }}
                role="listitem"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical class="w-5 h-5" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <Star class="w-4 h-4 text-amber-500" />
                    <span class="font-semibold">{spec.name}</span>
                    <span class="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      {spec.code}
                    </span>
                    {#if !spec.is_active}
                      <span class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Inactif</span>
                    {/if}
                  </div>
                  {#if spec.description}
                    <p class="text-sm text-muted-foreground truncate max-w-lg">{spec.description}</p>
                  {/if}
                </div>

                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1" title="Programmes">
                    <BookOpen class="w-4 h-4" />
                    <span>{spec.program_count || 0}</span>
                  </div>
                </div>

                {#if deleteConfirm === getSpecId(spec)}
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-destructive">Supprimer ?</span>
                    <button onclick={() => deleteSpecialty(getSpecId(spec))} disabled={deleting}
                      class="p-1.5 bg-destructive/10 hover:bg-destructive/20 rounded-lg">
                      {#if deleting}<Loader2 class="w-4 h-4 animate-spin text-destructive" />{:else}<Check class="w-4 h-4 text-destructive" />{/if}
                    </button>
                    <button onclick={cancelDelete} class="p-1.5 bg-muted rounded-lg">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {:else}
                  <div class="flex items-center gap-1">
                    <button onclick={() => openEditModal(spec)} class="p-2 hover:bg-muted rounded-lg" title="Modifier">
                      <Edit2 class="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onclick={() => confirmDelete(getSpecId(spec))} 
                      class="p-2 hover:bg-destructive/10 rounded-lg"
                      disabled={(spec.program_count || 0) > 0}
                    >
                      <Trash2 class="w-4 h-4 text-destructive {(spec.program_count || 0) > 0 ? 'opacity-30' : ''}" />
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-12 text-muted-foreground">
        Aucune spécialité pour le moment.
        <button onclick={openAddModal} class="text-primary hover:underline ml-1">Créer la première ?</button>
      </div>
    {/each}
  {/if}
</div>

<!-- Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingSpecialty ? 'Modifier la spécialité' : 'Nouvelle spécialité'}</Dialog.Title>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{modalError}</div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); saveSpecialty(); }} class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">Filière <span class="text-destructive">*</span></label>
        <Select.Root type="single" bind:value={formTrack} disabled={!!editingSpecialty}>
          <Select.Trigger class="w-full">
            {#snippet children()}
              {tracks.find(t => t.code === formTrack)?.name || 'Sélectionner...'}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            {#each tracks as trk}
              <Select.Item value={trk.code}>{trk.system_flag} {trk.name} ({trk.cycle_name} - {trk.system_name})</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">Nom <span class="text-destructive">*</span></label>
        <Input id="name" bind:value={formName} placeholder="Ex: Mathématiques" required />
      </div>

      {#if !editingSpecialty}
        <div class="space-y-2">
          <label for="code" class="text-sm font-medium">Code <span class="text-destructive">*</span></label>
          <Input id="code" bind:value={formCode} placeholder="Ex: maths" class="font-mono lowercase" required />
        </div>
      {/if}

      <div class="space-y-2">
        <label for="description" class="text-sm font-medium">Description</label>
        <textarea 
          id="description" 
          bind:value={formDescription} 
          placeholder="Description optionnelle..." 
          rows="2"
          class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        ></textarea>
      </div>

      <div class="flex gap-3 pt-4">
        <Button type="button" variant="outline" onclick={closeModal} class="flex-1">Annuler</Button>
        <Button type="submit" disabled={saving} class="flex-1">
          {#if saving}<Loader2 class="w-4 h-4 mr-2 animate-spin" />{:else}<Check class="w-4 h-4 mr-2" />{/if}
          {editingSpecialty ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
