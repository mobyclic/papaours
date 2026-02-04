<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Plus, Pencil, Trash2, BookOpen, ChevronRight, Library, FileText } from 'lucide-svelte';
  import { invalidateAll, goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  // États
  let showModal = $state(false);
  let editingProgram = $state<any>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);
  let filterCycle = $state('all');

  // Formulaire
  let form = $state({
    name: '',
    cycle_slug: '',
    grade_slug: '',
    subject_code: '',
    description: '',
    is_active: true
  });

  // Grades filtrés par cycle sélectionné
  let filteredGrades = $derived.by(() => {
    if (!form.cycle_slug) return [];
    return data.grades.filter(g => g.cycle_slug === form.cycle_slug);
  });

  // Programmes filtrés
  let filteredPrograms = $derived.by(() => {
    if (filterCycle === 'all') return data.programs;
    return data.programs.filter(p => p.cycle_slug === filterCycle);
  });

  // Grouper par cycle > classe
  let programsByCycleGrade = $derived.by(() => {
    const grouped: Record<string, Record<string, any[]>> = {};
    for (const prog of filteredPrograms) {
      const cycleKey = prog.cycle_name || 'Autre';
      const gradeKey = prog.grade_name || 'Autre';
      if (!grouped[cycleKey]) grouped[cycleKey] = {};
      if (!grouped[cycleKey][gradeKey]) grouped[cycleKey][gradeKey] = [];
      grouped[cycleKey][gradeKey].push(prog);
    }
    return grouped;
  });

  // Ouvrir modal
  function openModal(program?: any) {
    if (program) {
      editingProgram = program;
      form = {
        name: program.name || '',
        cycle_slug: program.cycle_slug || '',
        grade_slug: program.grade_slug || '',
        subject_code: program.subject_code || '',
        description: program.description || '',
        is_active: program.is_active ?? true
      };
    } else {
      editingProgram = null;
      form = {
        name: '',
        cycle_slug: data.cycles[0]?.slug || '',
        grade_slug: '',
        subject_code: data.subjects[0]?.code || '',
        description: '',
        is_active: true
      };
    }
    showModal = true;
  }

  // Sauvegarder
  async function save() {
    if (!form.cycle_slug || !form.grade_slug || !form.subject_code) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    saving = true;

    try {
      const response = await fetch('/api/admin/programs', {
        method: editingProgram ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProgram?.id,
          ...form
        })
      });

      if (response.ok) {
        showModal = false;
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur sauvegarde programme:', error);
    } finally {
      saving = false;
    }
  }

  // Supprimer
  async function deleteProgram(program: any) {
    if (!confirm(`Supprimer le programme "${program.subject_name} - ${program.grade_name}" et tous ses chapitres ? Cette action est irréversible.`)) return;
    deleting = program.id;

    try {
      const response = await fetch(`/api/admin/programs?id=${encodeURIComponent(program.id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur suppression programme:', error);
    } finally {
      deleting = null;
    }
  }

  function getSubjectIcon(code: string): string {
    const subject = data.subjects.find(s => s.code === code);
    return subject?.icon || '📖';
  }
</script>

<svelte:head>
  <title>Programmes Officiels - Admin Kweez</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Programmes Officiels</h1>
      <p class="text-gray-400 mt-1">Gérez les programmes scolaires par cycle, classe et matière</p>
    </div>
    <Button onclick={() => openModal()} class="flex items-center gap-2">
      <Plus class="w-4 h-4" />
      Nouveau programme
    </Button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📚</div>
      <div class="text-2xl font-bold text-white">{data.programs.length}</div>
      <div class="text-sm text-gray-400">Programmes</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📖</div>
      <div class="text-2xl font-bold text-blue-400">{data.programs.reduce((acc, p) => acc + (p.chapters_count || 0), 0)}</div>
      <div class="text-sm text-gray-400">Chapitres</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">🎓</div>
      <div class="text-2xl font-bold text-purple-400">{data.cycles.length}</div>
      <div class="text-sm text-gray-400">Cycles</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📝</div>
      <div class="text-2xl font-bold text-green-400">{data.subjects.length}</div>
      <div class="text-sm text-gray-400">Matières</div>
    </div>
  </div>

  <!-- Filtre par cycle -->
  <div class="flex gap-2 mb-6 flex-wrap">
    <button
      onclick={() => filterCycle = 'all'}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filterCycle === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}"
    >
      Tous les cycles
    </button>
    {#each data.cycles as cycle}
      <button
        onclick={() => filterCycle = cycle.slug}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filterCycle === cycle.slug ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}"
      >
        {cycle.name}
      </button>
    {/each}
  </div>

  <!-- Liste par Cycle > Classe > Matière -->
  <div class="space-y-6">
    {#each Object.entries(programsByCycleGrade) as [cycleName, grades]}
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-4 py-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-b border-gray-700">
          <h2 class="font-bold text-white flex items-center gap-2">
            <Library class="w-5 h-5 text-purple-400" />
            {cycleName}
          </h2>
        </div>

        {#each Object.entries(grades) as [gradeName, programs]}
          <div class="border-b border-gray-800 last:border-b-0">
            <div class="px-4 py-2 bg-gray-800/50 flex items-center gap-2">
              <ChevronRight class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-300">{gradeName}</span>
              <span class="text-xs text-gray-500">({programs.length} matières)</span>
            </div>

            <div class="divide-y divide-gray-800">
              {#each programs as program}
                <div class="px-4 py-3 flex items-center justify-between hover:bg-gray-800/50">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-xl border border-blue-500/30">
                      {program.subject_icon || getSubjectIcon(program.subject_code)}
                    </div>
                    <div>
                      <div class="font-medium text-white">{program.subject_name}</div>
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span class="font-mono">{program.subject_code}</span>
                        {#if program.chapters_count > 0}
                          <span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {program.chapters_count} chapitres
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    {#if program.is_active}
                      <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        Actif
                      </span>
                    {:else}
                      <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        Inactif
                      </span>
                    {/if}

                    <button 
                      onclick={() => goto(`/admin/programs/${program.id.replace('official_program:', '')}`)}
                      class="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Gérer les chapitres"
                    >
                      <FileText class="w-4 h-4 text-blue-400" />
                    </button>
                    <button 
                      onclick={() => openModal(program)}
                      class="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil class="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onclick={() => deleteProgram(program)}
                      disabled={deleting === program.id}
                      class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 class="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-12 text-center text-gray-400">
        <Library class="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p class="text-lg font-medium text-gray-300 mb-2">Aucun programme défini</p>
        <p class="text-sm">Créez votre premier programme officiel pour commencer.</p>
      </div>
    {/each}
  </div>
</div>

<!-- Modal Programme -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingProgram ? 'Modifier le programme' : 'Nouveau programme'}</Dialog.Title>
      <Dialog.Description>
        {editingProgram ? 'Modifiez les informations du programme.' : 'Créez un nouveau programme officiel.'}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-cycle">Cycle</label>
        <select 
          id="prog-cycle" 
          bind:value={form.cycle_slug}
          onchange={() => form.grade_slug = ''}
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
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-grade">Classe</label>
        <select 
          id="prog-grade" 
          bind:value={form.grade_slug}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
          disabled={!form.cycle_slug}
        >
          <option value="">Sélectionner une classe</option>
          {#each filteredGrades as grade}
            <option value={grade.slug}>{grade.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-subject">Matière</label>
        <select 
          id="prog-subject" 
          bind:value={form.subject_code}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
        >
          <option value="">Sélectionner une matière</option>
          {#each data.subjects as subject}
            <option value={subject.code}>{subject.icon || '📖'} {subject.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-name">Nom du programme (optionnel)</label>
        <Input 
          id="prog-name" 
          bind:value={form.name} 
          placeholder="Ex: Histoire-Géographie 1ère" 
        />
        <p class="text-xs text-gray-500 mt-1">Si vide, sera généré automatiquement</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-description">Description (optionnel)</label>
        <textarea 
          id="prog-description" 
          bind:value={form.description} 
          placeholder="Description du programme..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]"
        ></textarea>
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="prog-active" bind:checked={form.is_active} class="w-4 h-4 rounded" />
        <label class="cursor-pointer text-sm font-medium text-gray-700" for="prog-active">Programme actif</label>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => showModal = false}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : (editingProgram ? 'Modifier' : 'Créer')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
