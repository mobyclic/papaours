<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, GripVertical, Star, Users } from "lucide-svelte";

  interface EducationSystem {
    id: string;
    code: string;
    name: string;
    flag?: string;
  }

  interface Cycle {
    id: string;
    code: string;
    name: string;
    system_name?: string;
    system_flag?: string;
    system_code?: string;
  }

  interface Track {
    id: string;
    code: string;
    name: string;
    description?: string;
    cycle_id?: string;
    cycle_name?: string;
    system_name?: string;
    system_flag?: string;
    order: number;
    is_active: boolean;
    specialty_count?: number;
    grade_count?: number;
  }

  let tracks = $state<Track[]>([]);
  let cycles = $state<Cycle[]>([]);
  let educationSystems = $state<EducationSystem[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Filters
  let filterSystem = $state<string>('all');
  let filterCycle = $state<string>('all');

  // Modal state
  let showModal = $state(false);
  let editingTrack = $state<Track | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formDescription = $state('');
  let formCycle = $state('');

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  // Drag & Drop
  let draggingId = $state<string | null>(null);

  // Filtrer les cycles par système sélectionné
  let filteredCycles = $derived(
    filterSystem === 'all' 
      ? cycles 
      : cycles.filter(c => c.system_code === filterSystem)
  );

  // Filtrer les tracks
  let filteredTracks = $derived(() => {
    let result = tracks;
    if (filterSystem !== 'all') {
      result = result.filter(t => t.system_name === educationSystems.find(s => s.code === filterSystem)?.name);
    }
    if (filterCycle !== 'all') {
      result = result.filter(t => t.cycle_id?.toString().includes(filterCycle));
    }
    return result;
  });

  // Grouper par cycle
  let tracksByCycle = $derived(() => {
    const grouped: Record<string, Track[]> = {};
    for (const track of filteredTracks()) {
      const cycleKey = track.cycle_name || 'Autre';
      if (!grouped[cycleKey]) grouped[cycleKey] = [];
      grouped[cycleKey].push(track);
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
      let url = '/api/admin/tracks';
      const params = new URLSearchParams();
      if (filterSystem !== 'all') params.set('system', filterSystem);
      if (filterCycle !== 'all') params.set('cycle', filterCycle);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        tracks = data.tracks || [];
        cycles = data.cycles || [];
        educationSystems = data.educationSystems || [];
        if (cycles.length > 0 && !formCycle) {
          formCycle = cycles[0].code;
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
    editingTrack = null;
    formName = '';
    formCode = '';
    formDescription = '';
    formCycle = cycles[0]?.code || '';
    modalError = '';
    showModal = true;
  }

  function openEditModal(track: Track) {
    editingTrack = track;
    formName = track.name;
    formCode = track.code;
    formDescription = track.description || '';
    formCycle = track.cycle_id?.toString().replace('cycle:', '') || '';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingTrack = null;
    modalError = '';
  }

  async function saveTrack() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }
    if (!editingTrack && !formCode.trim()) {
      modalError = 'Le code est requis';
      return;
    }
    if (!formCycle) {
      modalError = 'Le cycle est requis';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toLowerCase(),
        description: formDescription.trim() || null,
        cycle: formCycle,
        is_active: editingTrack?.is_active ?? true
      };

      const url = editingTrack 
        ? `/api/admin/tracks/${editingTrack.id.split(':')[1]}` 
        : '/api/admin/tracks';
      
      const res = await fetch(url, {
        method: editingTrack ? 'PUT' : 'POST',
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

  function confirmDelete(trackId: string) {
    deleteConfirm = trackId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteTrack(trackId: string) {
    deleting = true;
    try {
      const id = trackId.split(':')[1];
      const res = await fetch(`/api/admin/tracks/${id}`, { method: 'DELETE' });
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
  function handleDragStart(e: DragEvent, trackId: string) {
    draggingId = trackId;
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

    const dragIndex = tracks.findIndex(t => t.id === draggingId);
    const dropIndex = tracks.findIndex(t => t.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      // Vérifier qu'ils sont du même cycle
      if (tracks[dragIndex].cycle_id !== tracks[dropIndex].cycle_id) {
        draggingId = null;
        return;
      }

      const newTracks = [...tracks];
      const [removed] = newTracks.splice(dragIndex, 1);
      newTracks.splice(dropIndex, 0, removed);
      tracks = newTracks;
      
      // Sauvegarder uniquement les tracks du même cycle
      const cycleTracks = newTracks
        .filter(t => t.cycle_id === removed.cycle_id)
        .map(t => t.id);
      saveOrder(cycleTracks);
    }

    draggingId = null;
  }

  async function saveOrder(orderedIds: string[]) {
    try {
      await fetch('/api/admin/tracks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }

  function getTrackId(track: Track): string {
    return typeof track.id === 'string' ? track.id : String(track.id);
  }
</script>

<svelte:head>
  <title>Filières - Paramètres</title>
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
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Filières</h1>
        <p class="text-gray-400 mt-2">Générale, Technologique, Professionnelle...</p>
      </div>
      <div class="flex items-center gap-3">
        <select
          bind:value={filterSystem}
          onchange={() => { filterCycle = 'all'; }}
          class="w-48 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tous les systèmes</option>
          {#each educationSystems as sys}
            <option value={sys.code}>{sys.flag} {sys.name}</option>
          {/each}
        </select>

        <select
          bind:value={filterCycle}
          class="w-48 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tous les cycles</option>
          {#each filteredCycles as cyc}
            <option value={cyc.code}>{cyc.system_flag} {cyc.name}</option>
          {/each}
        </select>

        <Button onclick={openAddModal}>
          <Plus class="w-4 h-4 mr-2" />
          Nouvelle filière
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
  {:else}
    {#each Object.entries(tracksByCycle()) as [cycleName, cycleTracks]}
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
          {cycleTracks[0]?.system_flag || '🌍'} {cycleName}
        </h2>
        <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
          <div class="divide-y divide-gray-800">
            {#each cycleTracks as track (getTrackId(track))}
              <div
                class="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors {draggingId === track.id ? 'opacity-50 bg-gray-800' : ''}"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, track.id)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, track.id)}
                animate:flip={{ duration: 200 }}
                role="listitem"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical class="w-5 h-5" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-white">{track.name}</span>
                    <span class="text-xs text-gray-300 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                      {track.code}
                    </span>
                    {#if !track.is_active}
                      <span class="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">Inactif</span>
                    {/if}
                  </div>
                  {#if track.description}
                    <p class="text-sm text-gray-400 truncate max-w-md">{track.description}</p>
                  {/if}
                </div>

                <div class="flex items-center gap-4 text-sm text-gray-400">
                  <div class="flex items-center gap-1" title="Spécialités">
                    <Star class="w-4 h-4" />
                    <span>{track.specialty_count || 0}</span>
                  </div>
                  <div class="flex items-center gap-1" title="Classes">
                    <Users class="w-4 h-4" />
                    <span>{track.grade_count || 0}</span>
                  </div>
                </div>

                {#if deleteConfirm === getTrackId(track)}
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-destructive">Supprimer ?</span>
                    <button onclick={() => deleteTrack(getTrackId(track))} disabled={deleting}
                      class="p-1.5 bg-destructive/10 hover:bg-destructive/20 rounded-lg">
                      {#if deleting}<Loader2 class="w-4 h-4 animate-spin text-destructive" />{:else}<Check class="w-4 h-4 text-destructive" />{/if}
                    </button>
                    <button onclick={cancelDelete} class="p-1.5 bg-gray-800 rounded-lg">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {:else}
                  <div class="flex items-center gap-1">
                    <button onclick={() => openEditModal(track)} class="p-2 hover:bg-gray-800 rounded-lg" title="Modifier">
                      <Edit2 class="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onclick={() => confirmDelete(getTrackId(track))} 
                      class="p-2 hover:bg-destructive/10 rounded-lg"
                      disabled={(track.specialty_count || 0) > 0 || (track.grade_count || 0) > 0}
                    >
                      <Trash2 class="w-4 h-4 text-destructive {(track.specialty_count || 0) > 0 || (track.grade_count || 0) > 0 ? 'opacity-30' : ''}" />
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
        Aucune filière pour le moment.
        <button onclick={openAddModal} class="text-primary hover:underline ml-1">Créer la première ?</button>
      </div>
    {/each}
  {/if}
</div>

<!-- Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingTrack ? 'Modifier la filière' : 'Nouvelle filière'}</Dialog.Title>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{modalError}</div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); saveTrack(); }} class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">Cycle <span class="text-destructive">*</span></label>
        <Select.Root type="single" bind:value={formCycle} disabled={!!editingTrack}>
          <Select.Trigger class="w-full">
            {#snippet children()}
              {cycles.find(c => c.code === formCycle)?.name || 'Sélectionner...'}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            {#each cycles as cyc}
              <Select.Item value={cyc.code}>{cyc.system_flag} {cyc.name} ({cyc.system_name})</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">Nom <span class="text-destructive">*</span></label>
        <Input id="name" bind:value={formName} placeholder="Ex: Générale" required />
      </div>

      {#if !editingTrack}
        <div class="space-y-2">
          <label for="code" class="text-sm font-medium">Code <span class="text-destructive">*</span></label>
          <Input id="code" bind:value={formCode} placeholder="Ex: generale" class="font-mono lowercase" required />
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
          {editingTrack ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
