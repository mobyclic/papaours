<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Plus, Pencil, Trash2, GraduationCap, BookOpen, ChevronRight } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  // États
  let activeTab = $state('cycles');
  let showCycleModal = $state(false);
  let showGradeModal = $state(false);
  let editingCycle = $state<any>(null);
  let editingGrade = $state<any>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);

  // Formulaires
  let cycleForm = $state({
    name: '',
    slug: '',
    description: '',
    order: 0,
    is_active: true
  });

  let gradeForm = $state({
    name: '',
    slug: '',
    description: '',
    cycle_slug: '',
    order: 0,
    is_active: true
  });

  // Générer slug à partir du nom
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Ouvrir modal cycle
  function openCycleModal(cycle?: any) {
    if (cycle) {
      editingCycle = cycle;
      cycleForm = {
        name: cycle.name,
        slug: cycle.slug,
        description: cycle.description || '',
        order: cycle.order || 0,
        is_active: cycle.is_active ?? true
      };
    } else {
      editingCycle = null;
      cycleForm = {
        name: '',
        slug: '',
        description: '',
        order: data.cycles.length,
        is_active: true
      };
    }
    showCycleModal = true;
  }

  // Ouvrir modal classe
  function openGradeModal(grade?: any) {
    if (grade) {
      editingGrade = grade;
      gradeForm = {
        name: grade.name,
        slug: grade.slug,
        description: grade.description || '',
        cycle_slug: grade.cycle_slug || '',
        order: grade.order || 0,
        is_active: grade.is_active ?? true
      };
    } else {
      editingGrade = null;
      gradeForm = {
        name: '',
        slug: '',
        description: '',
        cycle_slug: data.cycles[0]?.slug || '',
        order: 0,
        is_active: true
      };
    }
    showGradeModal = true;
  }

  // Sauvegarder cycle
  async function saveCycle() {
    if (!cycleForm.name || !cycleForm.slug) return;
    saving = true;

    try {
      const response = await fetch('/api/admin/cursus/cycles', {
        method: editingCycle ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCycle?.id,
          ...cycleForm
        })
      });

      if (response.ok) {
        showCycleModal = false;
        await invalidateAll();
      }
    } catch (error) {
      console.error('Erreur sauvegarde cycle:', error);
    } finally {
      saving = false;
    }
  }

  // Sauvegarder classe
  async function saveGrade() {
    if (!gradeForm.name || !gradeForm.slug || !gradeForm.cycle_slug) return;
    saving = true;

    try {
      const response = await fetch('/api/admin/cursus/grades', {
        method: editingGrade ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGrade?.id,
          ...gradeForm
        })
      });

      if (response.ok) {
        showGradeModal = false;
        await invalidateAll();
      }
    } catch (error) {
      console.error('Erreur sauvegarde classe:', error);
    } finally {
      saving = false;
    }
  }

  // Supprimer cycle
  async function deleteCycle(cycle: any) {
    if (!confirm(`Supprimer le cycle "${cycle.name}" ? Cette action est irréversible.`)) return;
    deleting = cycle.id;

    try {
      const response = await fetch(`/api/admin/cursus/cycles?id=${encodeURIComponent(cycle.id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      }
    } catch (error) {
      console.error('Erreur suppression cycle:', error);
    } finally {
      deleting = null;
    }
  }

  // Supprimer classe
  async function deleteGrade(grade: any) {
    if (!confirm(`Supprimer la classe "${grade.name}" ? Cette action est irréversible.`)) return;
    deleting = grade.id;

    try {
      const response = await fetch(`/api/admin/cursus/grades?id=${encodeURIComponent(grade.id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      }
    } catch (error) {
      console.error('Erreur suppression classe:', error);
    } finally {
      deleting = null;
    }
  }

  // Grouper les classes par cycle
  let gradesByCycle = $derived.by(() => {
    const grouped: Record<string, any[]> = {};
    for (const grade of data.grades) {
      const cycleSlug = grade.cycle_slug || 'unknown';
      if (!grouped[cycleSlug]) grouped[cycleSlug] = [];
      grouped[cycleSlug].push(grade);
    }
    return grouped;
  });
</script>

<svelte:head>
  <title>Gestion des Cursus - Admin Kweez</title>
</svelte:head>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Gestion des Cursus</h1>
      <p class="text-gray-600 mt-1">Gérez les cycles d'enseignement et les classes</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="w-full">
    <div class="flex gap-2 mb-6 border-b border-gray-200">
      <button
        onclick={() => activeTab = 'cycles'}
        class="flex items-center gap-2 px-4 py-2 border-b-2 transition-colors {activeTab === 'cycles' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}"
      >
        <GraduationCap class="w-4 h-4" />
        Cycles ({data.cycles.length})
      </button>
      <button
        onclick={() => activeTab = 'grades'}
        class="flex items-center gap-2 px-4 py-2 border-b-2 transition-colors {activeTab === 'grades' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}"
      >
        <BookOpen class="w-4 h-4" />
        Classes ({data.grades.length})
      </button>
    </div>

    <!-- Tab Cycles -->
    {#if activeTab === 'cycles'}
      <div class="flex justify-end mb-4">
        <Button onclick={() => openCycleModal()} class="flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Ajouter un cycle
        </Button>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ordre</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Classes</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each data.cycles as cycle}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-600">{cycle.order}</td>
                <td class="px-4 py-3">
                  <span class="font-medium text-gray-900">{cycle.name}</span>
                  {#if cycle.description}
                    <p class="text-xs text-gray-500 mt-0.5">{cycle.description}</p>
                  {/if}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 font-mono">{cycle.slug}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {cycle.grades_count} classes
                  </span>
                </td>
                <td class="px-4 py-3">
                  {#if cycle.is_active}
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
                    <Button variant="ghost" size="sm" onclick={() => openCycleModal(cycle)}>
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onclick={() => deleteCycle(cycle)}
                      disabled={deleting === cycle.id}
                      class="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                  Aucun cycle défini. Ajoutez-en un pour commencer.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- Tab Classes -->
    {#if activeTab === 'grades'}
      <div class="flex justify-end mb-4">
        <Button onclick={() => openGradeModal()} class="flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Ajouter une classe
        </Button>
      </div>

      <div class="space-y-6">
        {#each data.cycles as cycle}
          {@const cycleGrades = gradesByCycle[cycle.slug] || []}
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <GraduationCap class="w-5 h-5 text-gray-600" />
              <h3 class="font-semibold text-gray-900">{cycle.name}</h3>
              <span class="text-sm text-gray-500">({cycleGrades.length} classes)</span>
            </div>
            
            {#if cycleGrades.length > 0}
              <table class="w-full">
                <thead class="bg-gray-50/50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ordre</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nom</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Slug</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Statut</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {#each cycleGrades as grade}
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-2 text-sm text-gray-600">{grade.order}</td>
                      <td class="px-4 py-2">
                        <span class="font-medium text-gray-900">{grade.name}</span>
                      </td>
                      <td class="px-4 py-2 text-sm text-gray-600 font-mono">{grade.slug}</td>
                      <td class="px-4 py-2">
                        {#if grade.is_active}
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Actif
                          </span>
                        {:else}
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Inactif
                          </span>
                        {/if}
                      </td>
                      <td class="px-4 py-2 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onclick={() => openGradeModal(grade)}>
                            <Pencil class="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onclick={() => deleteGrade(grade)}
                            disabled={deleting === grade.id}
                            class="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 class="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <div class="px-4 py-8 text-center text-gray-500 text-sm">
                Aucune classe dans ce cycle
              </div>
            {/if}
          </div>
        {:else}
          <div class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            Créez d'abord des cycles pour pouvoir ajouter des classes.
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Modal Cycle -->
<Dialog.Root bind:open={showCycleModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingCycle ? 'Modifier le cycle' : 'Nouveau cycle'}</Dialog.Title>
      <Dialog.Description>
        {editingCycle ? 'Modifiez les informations du cycle.' : 'Ajoutez un nouveau cycle d\'enseignement.'}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); saveCycle(); }} class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="cycle-name">Nom</label>
        <Input 
          id="cycle-name" 
          bind:value={cycleForm.name} 
          oninput={() => { if (!editingCycle) cycleForm.slug = generateSlug(cycleForm.name); }}
          placeholder="Ex: Lycée" 
          required 
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="cycle-slug">Slug</label>
        <Input 
          id="cycle-slug" 
          bind:value={cycleForm.slug} 
          placeholder="Ex: lycee" 
          required 
          class="font-mono"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="cycle-description">Description (optionnel)</label>
        <Input 
          id="cycle-description" 
          bind:value={cycleForm.description} 
          placeholder="Description du cycle" 
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="cycle-order">Ordre</label>
          <Input 
            id="cycle-order" 
            type="number" 
            bind:value={cycleForm.order}
            min="0"
          />
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={cycleForm.is_active} class="w-4 h-4 rounded" />
            <span class="text-sm">Actif</span>
          </label>
        </div>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => showCycleModal = false}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : (editingCycle ? 'Modifier' : 'Créer')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Modal Classe -->
<Dialog.Root bind:open={showGradeModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingGrade ? 'Modifier la classe' : 'Nouvelle classe'}</Dialog.Title>
      <Dialog.Description>
        {editingGrade ? 'Modifiez les informations de la classe.' : 'Ajoutez une nouvelle classe.'}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); saveGrade(); }} class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="grade-cycle">Cycle</label>
        <select 
          id="grade-cycle" 
          bind:value={gradeForm.cycle_slug}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
        >
          <option value="">Sélectionner un cycle</option>
          {#each data.cycles as cycle}
            <option value={cycle.slug}>{cycle.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="grade-name">Nom</label>
        <Input 
          id="grade-name" 
          bind:value={gradeForm.name} 
          oninput={() => { if (!editingGrade) gradeForm.slug = generateSlug(gradeForm.name); }}
          placeholder="Ex: Première" 
          required 
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="grade-slug">Slug</label>
        <Input 
          id="grade-slug" 
          bind:value={gradeForm.slug} 
          placeholder="Ex: premiere" 
          required 
          class="font-mono"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="grade-order">Ordre</label>
          <Input 
            id="grade-order" 
            type="number" 
            bind:value={gradeForm.order}
            min="0"
          />
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={gradeForm.is_active} class="w-4 h-4 rounded" />
            <span class="text-sm">Actif</span>
          </label>
        </div>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => showGradeModal = false}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : (editingGrade ? 'Modifier' : 'Créer')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
