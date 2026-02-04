<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, GripVertical, Users, GitBranch } from "lucide-svelte";

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
    system: string;
    system_name?: string;
    system_flag?: string;
    age_min?: number;
    age_max?: number;
    order: number;
    is_active: boolean;
    grade_count?: number;
    track_count?: number;
  }

  let cycles = $state<Cycle[]>([]);
  let educationSystems = $state<EducationSystem[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Filter
  let filterSystem = $state<string>('all');

  // Modal state
  let showModal = $state(false);
  let editingCycle = $state<Cycle | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formSystem = $state('');
  let formAgeMin = $state<number | undefined>();
  let formAgeMax = $state<number | undefined>();

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  // Drag & Drop
  let draggingId = $state<string | null>(null);

  let filteredCycles = $derived(
    filterSystem === 'all' 
      ? cycles 
      : cycles.filter(c => c.system?.toString().includes(filterSystem))
  );

  // Grouper par système
  let cyclesBySystem = $derived(() => {
    const grouped: Record<string, Cycle[]> = {};
    for (const cycle of filteredCycles) {
      const sysKey = cycle.system_name || 'Autre';
      if (!grouped[sysKey]) grouped[sysKey] = [];
      grouped[sysKey].push(cycle);
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
      const res = await fetch('/api/admin/cycles');
      if (res.ok) {
        const data = await res.json();
        cycles = data.cycles || [];
        educationSystems = data.educationSystems || [];
        if (educationSystems.length > 0 && !formSystem) {
          formSystem = educationSystems[0].code;
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
    editingCycle = null;
    formName = '';
    formCode = '';
    formSystem = educationSystems[0]?.code || 'FR';
    formAgeMin = undefined;
    formAgeMax = undefined;
    modalError = '';
    showModal = true;
  }

  function openEditModal(cycle: Cycle) {
    editingCycle = cycle;
    formName = cycle.name;
    formCode = cycle.code;
    formSystem = cycle.system?.toString().replace('education_system:', '') || '';
    formAgeMin = cycle.age_min;
    formAgeMax = cycle.age_max;
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCycle = null;
    modalError = '';
  }

  async function saveCycle() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }
    if (!editingCycle && !formCode.trim()) {
      modalError = 'Le code est requis';
      return;
    }
    if (!formSystem) {
      modalError = 'Le système éducatif est requis';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toLowerCase(),
        system: formSystem,
        age_min: formAgeMin || null,
        age_max: formAgeMax || null,
        is_active: editingCycle?.is_active ?? true
      };

      const url = editingCycle 
        ? `/api/admin/cycles/${editingCycle.id.split(':')[1]}` 
        : '/api/admin/cycles';
      
      const res = await fetch(url, {
        method: editingCycle ? 'PUT' : 'POST',
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

  function confirmDelete(cycleId: string) {
    deleteConfirm = cycleId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteCycle(cycleId: string) {
    deleting = true;
    try {
      const id = cycleId.split(':')[1];
      const res = await fetch(`/api/admin/cycles/${id}`, { method: 'DELETE' });
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
  function handleDragStart(e: DragEvent, cycleId: string) {
    draggingId = cycleId;
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

    const dragIndex = cycles.findIndex(c => c.id === draggingId);
    const dropIndex = cycles.findIndex(c => c.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      // Vérifier qu'ils sont du même système
      if (cycles[dragIndex].system !== cycles[dropIndex].system) {
        draggingId = null;
        return;
      }

      const newCycles = [...cycles];
      const [removed] = newCycles.splice(dragIndex, 1);
      newCycles.splice(dropIndex, 0, removed);
      cycles = newCycles;
      
      // Sauvegarder uniquement les cycles du même système
      const systemCycles = newCycles
        .filter(c => c.system === removed.system)
        .map(c => c.id);
      saveOrder(systemCycles);
    }

    draggingId = null;
  }

  async function saveOrder(orderedIds: string[]) {
    try {
      await fetch('/api/admin/cycles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }

  function getCycleId(cycle: Cycle): string {
    return typeof cycle.id === 'string' ? cycle.id : String(cycle.id);
  }
</script>

<svelte:head>
  <title>Cycles - Paramètres</title>
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
        <h1 class="text-3xl font-bold">Cycles</h1>
        <p class="text-muted-foreground mt-1">Maternelle, Primaire, Collège, Lycée, Supérieur...</p>
      </div>
      <div class="flex items-center gap-3">
        <Select.Root type="single" bind:value={filterSystem}>
          <Select.Trigger class="w-48">
            {#snippet children()}
              {filterSystem === 'all' ? 'Tous les systèmes' : educationSystems.find(s => s.code === filterSystem)?.name || filterSystem}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Tous les systèmes</Select.Item>
            {#each educationSystems as sys}
              <Select.Item value={sys.code}>{sys.flag} {sys.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Button onclick={openAddModal}>
          <Plus class="w-4 h-4 mr-2" />
          Nouveau cycle
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
    {#each Object.entries(cyclesBySystem()) as [systemName, systemCycles]}
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
          {systemCycles[0]?.system_flag || '🌍'} {systemName}
        </h2>
        <div class="bg-card rounded-xl shadow border overflow-hidden">
          <div class="divide-y">
            {#each systemCycles as cycle (getCycleId(cycle))}
              <div
                class="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors {draggingId === cycle.id ? 'opacity-50 bg-muted' : ''}"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, cycle.id)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, cycle.id)}
                animate:flip={{ duration: 200 }}
                role="listitem"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical class="w-5 h-5" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{cycle.name}</span>
                    <span class="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      {cycle.code}
                    </span>
                    {#if !cycle.is_active}
                      <span class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Inactif</span>
                    {/if}
                  </div>
                  {#if cycle.age_min || cycle.age_max}
                    <p class="text-sm text-muted-foreground">
                      {cycle.age_min || '?'} - {cycle.age_max || '?'} ans
                    </p>
                  {/if}
                </div>

                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <Users class="w-4 h-4" />
                    <span>{cycle.grade_count || 0} classes</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <GitBranch class="w-4 h-4" />
                    <span>{cycle.track_count || 0} filières</span>
                  </div>
                </div>

                {#if deleteConfirm === getCycleId(cycle)}
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-destructive">Supprimer ?</span>
                    <button onclick={() => deleteCycle(getCycleId(cycle))} disabled={deleting}
                      class="p-1.5 bg-destructive/10 hover:bg-destructive/20 rounded-lg">
                      {#if deleting}<Loader2 class="w-4 h-4 animate-spin text-destructive" />{:else}<Check class="w-4 h-4 text-destructive" />{/if}
                    </button>
                    <button onclick={cancelDelete} class="p-1.5 bg-muted rounded-lg">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {:else}
                  <div class="flex items-center gap-1">
                    <button onclick={() => openEditModal(cycle)} class="p-2 hover:bg-muted rounded-lg" title="Modifier">
                      <Edit2 class="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onclick={() => confirmDelete(getCycleId(cycle))} 
                      class="p-2 hover:bg-destructive/10 rounded-lg"
                      disabled={(cycle.grade_count || 0) > 0 || (cycle.track_count || 0) > 0}
                    >
                      <Trash2 class="w-4 h-4 text-destructive {(cycle.grade_count || 0) > 0 || (cycle.track_count || 0) > 0 ? 'opacity-30' : ''}" />
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}

    {#if filteredCycles.length === 0}
      <div class="text-center py-12 text-muted-foreground">
        Aucun cycle pour le moment.
        <button onclick={openAddModal} class="text-primary hover:underline ml-1">Créer le premier ?</button>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingCycle ? 'Modifier le cycle' : 'Nouveau cycle'}</Dialog.Title>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{modalError}</div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); saveCycle(); }} class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">Système éducatif <span class="text-destructive">*</span></label>
        <Select.Root type="single" bind:value={formSystem} disabled={!!editingCycle}>
          <Select.Trigger class="w-full">
            {#snippet children()}
              {educationSystems.find(s => s.code === formSystem)?.name || 'Sélectionner...'}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            {#each educationSystems as sys}
              <Select.Item value={sys.code}>{sys.flag} {sys.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">Nom <span class="text-destructive">*</span></label>
        <Input id="name" bind:value={formName} placeholder="Ex: Collège" required />
      </div>

      {#if !editingCycle}
        <div class="space-y-2">
          <label for="code" class="text-sm font-medium">Code <span class="text-destructive">*</span></label>
          <Input id="code" bind:value={formCode} placeholder="Ex: college" class="font-mono lowercase" required />
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="age_min" class="text-sm font-medium">Âge minimum</label>
          <Input id="age_min" type="number" bind:value={formAgeMin} placeholder="Ex: 11" min="0" max="99" />
        </div>
        <div class="space-y-2">
          <label for="age_max" class="text-sm font-medium">Âge maximum</label>
          <Input id="age_max" type="number" bind:value={formAgeMax} placeholder="Ex: 14" min="0" max="99" />
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <Button type="button" variant="outline" onclick={closeModal} class="flex-1">Annuler</Button>
        <Button type="submit" disabled={saving} class="flex-1">
          {#if saving}<Loader2 class="w-4 h-4 mr-2 animate-spin" />{:else}<Check class="w-4 h-4 mr-2" />{/if}
          {editingCycle ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
