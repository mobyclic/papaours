<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, GripVertical, BookOpen, GitBranch } from "lucide-svelte";

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
    cycle_code?: string;
    system_flag?: string;
  }

  interface Grade {
    id: string;
    code: string;
    name: string;
    slug?: string;
    short_name?: string;
    cycle_id?: string;
    cycle_code?: string;
    cycle_name?: string;
    cycle_slug?: string;
    track_id?: string;
    track_name?: string;
    system_name?: string;
    system_code?: string;
    system_flag?: string;
    order: number;
    is_active: boolean;
    program_count?: number;
  }

  let grades = $state<Grade[]>([]);
  let cycles = $state<Cycle[]>([]);
  let tracks = $state<Track[]>([]);
  let educationSystems = $state<EducationSystem[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Filters
  let filterSystem = $state<string>('all');
  let filterCycle = $state<string>('all');

  // Modal state
  let showModal = $state(false);
  let editingGrade = $state<Grade | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formShortName = $state('');
  let formCycle = $state('');
  let formTrack = $state('');

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

  // Filtrer les tracks par cycle sélectionné dans le formulaire
  let filteredTracks = $derived(
    formCycle 
      ? tracks.filter(t => t.cycle_code === formCycle)
      : tracks
  );

  // Filtrer les grades
  let filteredGrades = $derived(() => {
    let result = grades;
    if (filterSystem !== 'all') {
      result = result.filter(g => g.system_code === filterSystem);
    }
    if (filterCycle !== 'all') {
      result = result.filter(g => g.cycle_code === filterCycle);
    }
    return result;
  });

  // Grouper par cycle
  let gradesByCycle = $derived(() => {
    const grouped: Record<string, Grade[]> = {};
    for (const grade of filteredGrades()) {
      const cycleKey = grade.cycle_name || 'Autre';
      if (!grouped[cycleKey]) grouped[cycleKey] = [];
      grouped[cycleKey].push(grade);
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
      let url = '/api/admin/grades';
      const params = new URLSearchParams();
      if (filterSystem !== 'all') params.set('system', filterSystem);
      if (filterCycle !== 'all') params.set('cycle', filterCycle);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        grades = data.grades || [];
        cycles = data.cycles || [];
        tracks = data.tracks || [];
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
    editingGrade = null;
    formName = '';
    formCode = '';
    formShortName = '';
    formCycle = cycles[0]?.code || '';
    formTrack = '';
    modalError = '';
    showModal = true;
  }

  function openEditModal(grade: Grade) {
    editingGrade = grade;
    formName = grade.name;
    formCode = grade.code;
    formShortName = grade.short_name || '';
    formCycle = grade.cycle_code || '';
    formTrack = grade.track_id?.toString().replace('track:', '') || '';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingGrade = null;
    modalError = '';
  }

  async function saveGrade() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }
    if (!editingGrade && !formCode.trim()) {
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
        short_name: formShortName.trim() || null,
        cycle: formCycle,
        track: formTrack || null,
        is_active: editingGrade?.is_active ?? true
      };

      const url = editingGrade 
        ? `/api/admin/grades/${editingGrade.id.split(':')[1]}` 
        : '/api/admin/grades';
      
      const res = await fetch(url, {
        method: editingGrade ? 'PUT' : 'POST',
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

  function confirmDelete(gradeId: string) {
    deleteConfirm = gradeId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteGrade(gradeId: string) {
    deleting = true;
    try {
      const id = gradeId.split(':')[1];
      const res = await fetch(`/api/admin/grades/${id}`, { method: 'DELETE' });
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
  function handleDragStart(e: DragEvent, gradeId: string) {
    draggingId = gradeId;
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

    const dragIndex = grades.findIndex(g => g.id === draggingId);
    const dropIndex = grades.findIndex(g => g.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      // Vérifier qu'ils sont du même cycle
      if (grades[dragIndex].cycle_id !== grades[dropIndex].cycle_id) {
        draggingId = null;
        return;
      }

      const newGrades = [...grades];
      const [removed] = newGrades.splice(dragIndex, 1);
      newGrades.splice(dropIndex, 0, removed);
      grades = newGrades;
      
      // Sauvegarder uniquement les grades du même cycle
      const cycleGrades = newGrades
        .filter(g => g.cycle_id === removed.cycle_id)
        .map(g => g.id);
      saveOrder(cycleGrades);
    }

    draggingId = null;
  }

  async function saveOrder(orderedIds: string[]) {
    try {
      await fetch('/api/admin/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }

  function getGradeId(grade: Grade): string {
    return typeof grade.id === 'string' ? grade.id : String(grade.id);
  }
</script>

<svelte:head>
  <title>Classes - Paramètres</title>
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
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Classes</h1>
        <p class="text-gray-400 mt-2">CP, CE1, 6ème, 3ème, Seconde, Terminale...</p>
      </div>
      <div class="flex items-center gap-3">
        <select
          bind:value={filterSystem}
          onchange={() => { filterCycle = 'all'; }}
          class="w-44 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tous les systèmes</option>
          {#each educationSystems as sys}
            <option value={sys.code}>{sys.flag} {sys.name}</option>
          {/each}
        </select>

        <select
          bind:value={filterCycle}
          class="w-44 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tous les cycles</option>
          {#each filteredCycles as cyc}
            <option value={cyc.code}>{cyc.system_flag} {cyc.name}</option>
          {/each}
        </select>

        <Button onclick={openAddModal}>
          <Plus class="w-4 h-4 mr-2" />
          Nouvelle classe
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
    {#each Object.entries(gradesByCycle()) as [cycleName, cycleGrades]}
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
          {cycleGrades[0]?.system_flag || '🌍'} {cycleName}
        </h2>
        <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
          <div class="divide-y divide-gray-800">
            {#each cycleGrades as grade (getGradeId(grade))}
              <div
                class="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors {draggingId === grade.id ? 'opacity-50 bg-gray-800' : ''}"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, grade.id)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, grade.id)}
                animate:flip={{ duration: 200 }}
                role="listitem"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical class="w-5 h-5" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-white">{grade.name}</span>
                    {#if grade.short_name}
                      <span class="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{grade.short_name}</span>
                    {/if}
                    <span class="text-xs text-gray-300 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                      {grade.code}
                    </span>
                    {#if !grade.is_active}
                      <span class="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">Inactif</span>
                    {/if}
                  </div>
                  {#if grade.track_name}
                    <p class="text-sm text-gray-400 flex items-center gap-1">
                      <GitBranch class="w-3 h-3" />
                      {grade.track_name}
                    </p>
                  {/if}
                </div>

                {#if deleteConfirm === getGradeId(grade)}
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-destructive">Supprimer ?</span>
                    <button onclick={() => deleteGrade(getGradeId(grade))} disabled={deleting}
                      class="p-1.5 bg-destructive/10 hover:bg-destructive/20 rounded-lg">
                      {#if deleting}<Loader2 class="w-4 h-4 animate-spin text-destructive" />{:else}<Check class="w-4 h-4 text-destructive" />{/if}
                    </button>
                    <button onclick={cancelDelete} class="p-1.5 bg-gray-800 rounded-lg">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {:else}
                  <div class="flex items-center gap-1">
                    <a 
                      href="/admin/programs?cycle={grade.cycle_slug}&grade={grade.slug}"
                      class="p-2 hover:bg-blue-500/20 rounded-lg flex items-center gap-1.5 text-sm"
                      title="Gérer les programmes ({grade.program_count || 0})"
                    >
                      <BookOpen class="w-4 h-4 text-blue-400" />
                      <span class="text-blue-400 font-medium">{grade.program_count || 0}</span>
                    </a>
                    <a href="/admin/system/settings/grades/{grade.slug}" class="p-2 hover:bg-gray-800 rounded-lg" title="Gérer cette classe">
                      <Edit2 class="w-4 h-4 text-gray-400" />
                    </a>
                    <button 
                      onclick={() => confirmDelete(getGradeId(grade))} 
                      class="p-2 hover:bg-destructive/10 rounded-lg"
                      disabled={(grade.program_count || 0) > 0}
                      title={(grade.program_count || 0) > 0 ? 'Supprimer d\'abord les programmes' : 'Supprimer'}
                    >
                      <Trash2 class="w-4 h-4 text-destructive {(grade.program_count || 0) > 0 ? 'opacity-30' : ''}" />
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
        Aucune classe pour le moment.
        <button onclick={openAddModal} class="text-primary hover:underline ml-1">Créer la première ?</button>
      </div>
    {/each}
  {/if}
</div>

<!-- Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingGrade ? 'Modifier la classe' : 'Nouvelle classe'}</Dialog.Title>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{modalError}</div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); saveGrade(); }} class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">Cycle <span class="text-destructive">*</span></label>
        <Select.Root type="single" bind:value={formCycle} disabled={!!editingGrade}>
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
        <Input id="name" bind:value={formName} placeholder="Ex: Sixième" required />
      </div>

      <div class="grid grid-cols-2 gap-4">
        {#if !editingGrade}
          <div class="space-y-2">
            <label for="code" class="text-sm font-medium">Code <span class="text-destructive">*</span></label>
            <Input id="code" bind:value={formCode} placeholder="Ex: 6eme" class="font-mono lowercase" required />
          </div>
        {/if}
        <div class="space-y-2 {editingGrade ? 'col-span-2' : ''}">
          <label for="short_name" class="text-sm font-medium">Nom court</label>
          <Input id="short_name" bind:value={formShortName} placeholder="Ex: 6e" />
        </div>
      </div>

      {#if filteredTracks.length > 0}
        <div class="space-y-2">
          <label class="text-sm font-medium">Filière (optionnel)</label>
          <Select.Root type="single" bind:value={formTrack}>
            <Select.Trigger class="w-full">
              {#snippet children()}
                {tracks.find(t => t.code === formTrack)?.name || 'Aucune filière'}
              {/snippet}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">Aucune filière</Select.Item>
              {#each filteredTracks as trk}
                <Select.Item value={trk.code}>{trk.system_flag} {trk.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}

      <div class="flex gap-3 pt-4">
        <Button type="button" variant="outline" onclick={closeModal} class="flex-1">Annuler</Button>
        <Button type="submit" disabled={saving} class="flex-1">
          {#if saving}<Loader2 class="w-4 h-4 mr-2 animate-spin" />{:else}<Check class="w-4 h-4 mr-2" />{/if}
          {editingGrade ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
