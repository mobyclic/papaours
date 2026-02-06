<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import { 
    Plus, Pencil, Trash2, BookOpen, ChevronRight, Library, FileText,
    Sparkles, AlertTriangle, CheckCircle, ChevronDown, GraduationCap,
    Wand2, Loader2, ExternalLink, Globe, Save
  } from 'lucide-svelte';
  import { invalidateAll, goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { data }: { data: PageData } = $props();

  // États de navigation - gérés localement, pas dépendants des props
  let selectedSystemSlug = $state('');
  let selectedCycleSlug = $state('');
  let selectedTrackSlug = $state('');
  let selectedGradeSlug = $state('');
  let initialized = $state(false);
  
  // Initialisation une seule fois au montage du composant
  $effect(() => {
    if (!initialized) {
      // Lire les paramètres de l'URL directement
      const url = new URL(window.location.href);
      const systemParam = url.searchParams.get('system');
      const cycleParam = url.searchParams.get('cycle');
      const trackParam = url.searchParams.get('track');
      const gradeParam = url.searchParams.get('grade');
      if (systemParam) selectedSystemSlug = systemParam;
      if (cycleParam) selectedCycleSlug = cycleParam;
      if (trackParam) selectedTrackSlug = trackParam;
      if (gradeParam) selectedGradeSlug = gradeParam;
      
      // Si pas de système sélectionné, présélectionner France
      if (!selectedSystemSlug) {
        const france = data.educationSystems.find((s: any) => s.code === 'FR');
        if (france) selectedSystemSlug = france.code;
      }
      
      initialized = true;
    }
  });
  
  // États modaux
  let showModal = $state(false);
  let showAIModal = $state(false);
  let editingProgram = $state<any>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);
  let generating = $state(false);
  let aiResult = $state<any>(null);

  // Formulaire programme
  let form = $state({
    name: '',
    cycle_slug: '',
    grade_slug: '',
    subject_code: '',
    description: '',
    is_active: true
  });

  // Formulaire génération IA
  let aiForm = $state({
    grade_slug: '',
    subject_code: '',
    chapters_count: 6,
    include_descriptions: true,
    model: 'gpt-4o-mini'
  });

  // Modèles IA disponibles
  let availableModels = $state<Array<{id: string, name: string, provider: string}>>([
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (rapide)', provider: 'openai' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai' },
    { id: 'DeepSeek-R1', name: 'DeepSeek R1', provider: 'deepseek' },
    { id: 'Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', provider: 'meta' },
  ]);

  // Tracks (filières) filtrés par cycle sélectionné
  let tracksForSelectedCycle = $derived.by(() => {
    if (!selectedCycleSlug) return [];
    return data.tracks.filter(t => t.cycle_slug === selectedCycleSlug);
  });

  // Est-ce que le cycle sélectionné a des filières ?
  let cycleHasTracks = $derived(tracksForSelectedCycle.length > 0);

  // Grades filtrés par cycle et track sélectionnés dans le nav
  let gradesForSelectedCycle = $derived.by(() => {
    if (!selectedCycleSlug) return data.grades;
    let result = data.grades.filter(g => g.cycle_slug === selectedCycleSlug);
    
    // Si une filière est sélectionnée, filtrer aussi par track
    if (selectedTrackSlug) {
      result = result.filter(g => g.track_slug === selectedTrackSlug);
    }
    
    return result;
  });

  // Grades filtrés par cycle du formulaire
  let filteredGrades = $derived.by(() => {
    if (!form.cycle_slug) return [];
    return data.grades.filter(g => g.cycle_slug === form.cycle_slug);
  });

  // Programmes filtrés par cycle, track et classe
  let filteredPrograms = $derived.by(() => {
    let result = data.programs;
    
    if (selectedCycleSlug) {
      result = result.filter(p => p.cycle_slug === selectedCycleSlug);
    }
    
    if (selectedGradeSlug) {
      result = result.filter(p => p.grade_slug === selectedGradeSlug);
    }
    
    return result;
  });

  // Grade sélectionné avec ses détails
  let selectedGrade = $derived.by(() => {
    if (!selectedGradeSlug) return null;
    return data.grades.find(g => g.slug === selectedGradeSlug);
  });

  // Matières manquantes pour la classe sélectionnée
  let missingSubjects = $derived.by(() => {
    if (!selectedGradeSlug) return [];
    const existingSubjectCodes = filteredPrograms.map(p => p.subject_code);
    return data.subjects.filter(s => !existingSubjectCodes.includes(s.code));
  });

  // Stats de couverture par cycle
  let coverageByClycle = $derived.by(() => {
    return data.cycles.map(cycle => {
      const cycleGrades = data.grades.filter(g => g.cycle_slug === cycle.slug);
      const gradesWithPrograms = cycleGrades.filter(g => g.programs_count > 0);
      const totalPrograms = cycleGrades.reduce((acc, g) => acc + g.programs_count, 0);
      
      return {
        ...cycle,
        gradesCount: cycleGrades.length,
        gradesWithPrograms: gradesWithPrograms.length,
        gradesWithoutPrograms: cycleGrades.length - gradesWithPrograms.length,
        totalPrograms,
        coverage: cycleGrades.length > 0 
          ? Math.round((gradesWithPrograms.length / cycleGrades.length) * 100) 
          : 0
      };
    });
  });

  // Helper pour mettre à jour l'URL
  function updateURL() {
    const url = new URL(window.location.href);
    
    if (selectedSystemSlug) {
      url.searchParams.set('system', selectedSystemSlug);
    } else {
      url.searchParams.delete('system');
    }
    
    if (selectedCycleSlug) {
      url.searchParams.set('cycle', selectedCycleSlug);
    } else {
      url.searchParams.delete('cycle');
    }
    
    if (selectedTrackSlug) {
      url.searchParams.set('track', selectedTrackSlug);
    } else {
      url.searchParams.delete('track');
    }
    
    if (selectedGradeSlug) {
      url.searchParams.set('grade', selectedGradeSlug);
    } else {
      url.searchParams.delete('grade');
    }
    
    history.pushState({}, '', url);
  }

  // Changer de système
  function handleSystemChange() {
    selectedCycleSlug = '';
    selectedTrackSlug = '';
    selectedGradeSlug = '';
    updateURL();
  }

  // Changer de cycle
  function handleCycleChange() {
    selectedTrackSlug = '';
    selectedGradeSlug = '';
    updateURL();
  }

  // Changer de filière
  function handleTrackChange() {
    selectedGradeSlug = '';
    updateURL();
  }

  // Changer de classe
  function handleGradeChange() {
    updateURL();
  }

  // Ouvrir modal création/édition
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
      const defaultCycle = selectedCycleSlug !== 'all' ? selectedCycleSlug : (data.cycles[0]?.slug || '');
      form = {
        name: '',
        cycle_slug: defaultCycle,
        grade_slug: selectedGradeSlug || '',
        subject_code: '',
        description: '',
        is_active: true
      };
    }
    showModal = true;
  }

  // Créer rapidement un programme pour une matière manquante
  async function quickCreateProgram(subjectCode: string) {
    if (!selectedGrade) return;
    saving = true;

    try {
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_slug: selectedGrade.cycle_slug,
          grade_slug: selectedGrade.slug,
          subject_code: subjectCode,
          is_active: true
        })
      });

      if (response.ok) {
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur création rapide:', error);
    } finally {
      saving = false;
    }
  }

  // Sauvegarder programme
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

  // Supprimer programme
  async function deleteProgram(program: any) {
    if (!confirm(`Supprimer le programme "${program.subject_name} - ${program.grade_name}" et tous ses chapitres ?`)) return;
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
      console.error('Erreur suppression:', error);
    } finally {
      deleting = null;
    }
  }

  // Ouvrir modal génération IA
  function openAIModal() {
    aiForm = {
      grade_slug: selectedGradeSlug || '',
      subject_code: '',
      chapters_count: 6,
      include_descriptions: true,
      model: 'gpt-4o-mini'
    };
    aiResult = null;
    showAIModal = true;
  }

  // Générer programme via IA
  async function generateWithAI() {
    if (!aiForm.grade_slug || !aiForm.subject_code) {
      alert('Veuillez sélectionner une classe et une matière');
      return;
    }
    generating = true;
    aiResult = null;

    try {
      const response = await fetch('/api/admin/programs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm)
      });

      if (response.ok) {
        aiResult = await response.json();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Erreur génération IA:', error);
      alert('Erreur lors de la génération');
    } finally {
      generating = false;
    }
  }

  // Appliquer le résultat IA
  async function applyAIResult() {
    if (!aiResult?.chapters) return;
    saving = true;

    try {
      const response = await fetch('/api/admin/programs/apply-generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_slug: aiForm.grade_slug,
          subject_code: aiForm.subject_code,
          chapters: aiResult.chapters
        })
      });

      if (response.ok) {
        showAIModal = false;
        aiResult = null;
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur application:', error);
    } finally {
      saving = false;
    }
  }

  function getSubjectIcon(code: string): string {
    const subject = data.subjects.find(s => s.code === code);
    return subject?.icon || '📖';
  }

  function getCoverageColor(percent: number): string {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }
</script>

<svelte:head>
  <title>Programmes Officiels - Admin Kweez</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
        Programmes Officiels
      </h1>
      <p class="text-gray-400 mt-1">
        Gérez les programmes scolaires par cycle, classe et matière
      </p>
    </div>
    <div class="flex items-center gap-3 ">
      <Button variant="outline" onclick={openAIModal} class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50">
        <Wand2 class="w-4 h-4" />
        Générer avec IA
      </Button>
      <Button onclick={() => openModal()} class="flex items-center gap-2">
        <Plus class="w-4 h-4" />
        Nouveau programme
      </Button>
    </div>
  </div>

  <!-- Stats globales -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">🎓</div>
      <div class="text-2xl font-bold text-white">{data.stats.totalGrades}</div>
      <div class="text-sm text-gray-400">Classes</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📚</div>
      <div class="text-2xl font-bold text-blue-400">{data.stats.totalPrograms}</div>
      <div class="text-sm text-gray-400">Programmes</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📖</div>
      <div class="text-2xl font-bold text-purple-400">{data.stats.totalChapters}</div>
      <div class="text-sm text-gray-400">Chapitres</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">✅</div>
      <div class="text-2xl font-bold text-green-400">{data.stats.gradesWithPrograms}</div>
      <div class="text-sm text-gray-400">Classes couvertes</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 {data.stats.gradesWithoutPrograms > 0 ? 'border-amber-500/50' : ''}">
      <div class="text-2xl mb-1">⚠️</div>
      <div class="text-2xl font-bold {data.stats.gradesWithoutPrograms > 0 ? 'text-amber-400' : 'text-gray-500'}">
        {data.stats.gradesWithoutPrograms}
      </div>
      <div class="text-sm text-gray-400">Classes sans programme</div>
    </div>
  </div>

  <!-- Filtres avec selects -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <GraduationCap class="w-5 h-5 text-amber-400" />
        Filtres
      </h3>
    </div>
    
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Zone éducative -->
      <div>
        <label for="system-select" class="block text-sm font-medium text-gray-400 mb-2">
          <Globe class="w-4 h-4 inline mr-1" />
          Zone éducative
        </label>
        <select
          id="system-select"
          bind:value={selectedSystemSlug}
          onchange={handleSystemChange}
          class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
        >
          <option value="">Toutes les zones</option>
          {#each data.educationSystems as system}
            <option value={system.code}>{system.flag} {system.name}</option>
          {/each}
        </select>
      </div>

      <!-- Cycle -->
      <div>
        <label for="cycle-select" class="block text-sm font-medium text-gray-400 mb-2">Cycle</label>
        <select
          id="cycle-select"
          bind:value={selectedCycleSlug}
          onchange={handleCycleChange}
          class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
        >
          <option value="">Tous les cycles</option>
          {#each data.cycles as cycle}
            {@const coverage = coverageByClycle.find(c => c.slug === cycle.slug)}
            <option value={cycle.slug}>
              {cycle.name} ({coverage?.gradesWithPrograms || 0}/{coverage?.gradesCount || 0})
            </option>
          {/each}
        </select>
      </div>

      <!-- Filière (conditionnelle) -->
      {#if cycleHasTracks}
        <div>
          <label for="track-select" class="block text-sm font-medium text-gray-400 mb-2">Filière</label>
          <select
            id="track-select"
            bind:value={selectedTrackSlug}
            onchange={handleTrackChange}
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          >
            <option value="">Toutes les filières</option>
            {#each tracksForSelectedCycle as track}
              <option value={track.slug}>{track.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Niveau / Classe -->
      <div>
        <label for="grade-select" class="block text-sm font-medium text-gray-400 mb-2">Niveau / Classe</label>
        <select
          id="grade-select"
          bind:value={selectedGradeSlug}
          onchange={handleGradeChange}
          class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
        >
          <option value="">Tous les niveaux</option>
          {#each gradesForSelectedCycle as grade}
            {@const hasPrograms = grade.programs_count > 0}
            <option value={grade.slug}>
              {grade.name} {hasPrograms ? `(${grade.programs_count})` : '⚠️'}
            </option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Contenu principal -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Liste des programmes -->
    <div class="lg:col-span-2">
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 class="font-semibold text-white flex items-center gap-2">
            <Library class="w-5 h-5 text-purple-400" />
            {#if selectedGrade}
              Programmes - {selectedGrade.name}
            {:else if selectedCycleSlug}
              Programmes - {data.cycles.find(c => c.slug === selectedCycleSlug)?.name}
            {:else}
              Tous les programmes
            {/if}
            <span class="text-sm font-normal text-gray-500">({filteredPrograms.length})</span>
          </h2>
        </div>

        {#if filteredPrograms.length > 0}
          <div class="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
            {#each filteredPrograms as program}
              <div class="px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-xl border border-blue-500/30">
                    {program.subject_icon || getSubjectIcon(program.subject_code)}
                  </div>
                  <div>
                    <div class="font-medium text-white flex items-center gap-2">
                      {program.subject_name}
                      {#if !selectedGrade}
                        <span class="text-xs text-gray-500 font-normal">
                          {program.grade_name}
                        </span>
                      {/if}
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      {#if program.chapters_count > 0}
                        <span class="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                          {program.chapters_count} chapitres
                        </span>
                      {:else}
                        <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pas de chapitres
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1">
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
        {:else}
          <div class="p-12 text-center text-gray-400">
            <Library class="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p class="text-lg font-medium text-gray-300 mb-2">Aucun programme</p>
            <p class="text-sm mb-4">
              {#if selectedGrade}
                Aucun programme pour {selectedGrade.name}
              {:else}
                Sélectionnez une classe ou créez un programme
              {/if}
            </p>
            <Button onclick={() => openModal()} size="sm" class="gap-2">
              <Plus class="w-4 h-4" />
              Créer un programme
            </Button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Panel latéral -->
    <div class="space-y-6">
      <!-- Matières manquantes (si classe sélectionnée) -->
      {#if selectedGrade && missingSubjects.length > 0}
        <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-amber-500/30 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-800 bg-amber-500/10">
            <h3 class="font-semibold text-white flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-400" />
              Matières manquantes
              <span class="text-sm font-normal text-amber-400/80">({missingSubjects.length})</span>
            </h3>
          </div>
          <div class="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {#each missingSubjects as subject}
              <div class="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{subject.icon || '📖'}</span>
                  <span class="text-sm text-gray-300">{subject.name}</span>
                </div>
                <button
                  onclick={() => quickCreateProgram(subject.code)}
                  disabled={saving}
                  class="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Créer le programme"
                >
                  <Plus class="w-4 h-4 text-green-400" />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Couverture par cycle -->
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-800">
          <h3 class="font-semibold text-white flex items-center gap-2">
            <GraduationCap class="w-4 h-4 text-purple-400" />
            Couverture par cycle
          </h3>
        </div>
        <div class="p-4 space-y-3">
          {#each coverageByClycle as cycle}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-300">{cycle.name}</span>
                <span class={getCoverageColor(cycle.coverage)}>
                  {cycle.coverage}%
                </span>
              </div>
              <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500
                    {cycle.coverage >= 80 ? 'bg-green-500' : cycle.coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
                  style="width: {cycle.coverage}%"
                ></div>
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{cycle.gradesWithPrograms}/{cycle.gradesCount} classes</span>
                <span>{cycle.totalPrograms} programmes</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-800">
          <h3 class="font-semibold text-white flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-400" />
            Actions rapides
          </h3>
        </div>
        <div class="p-4 space-y-2">
          <Button 
            variant="outline" 
            class="w-full justify-start gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            onclick={openAIModal}
          >
            <Wand2 class="w-4 h-4" />
            Générer programme avec IA
          </Button>
          <Button 
            variant="outline" 
            class="w-full justify-start gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            onclick={() => openModal()}
          >
            <Plus class="w-4 h-4" />
            Créer un programme
          </Button>
        </div>
      </div>
    </div>
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
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-name">Nom (optionnel)</label>
        <Input 
          id="prog-name" 
          bind:value={form.name} 
          placeholder="Généré automatiquement si vide" 
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="prog-description">Description</label>
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

<!-- Modal Génération IA -->
<Dialog.Root bind:open={showAIModal}>
  <Dialog.Content class="sm:max-w-2xl">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Wand2 class="w-5 h-5 text-purple-400" />
        Générer un programme avec IA
      </Dialog.Title>
      <Dialog.Description>
        L'IA va rechercher les informations officielles et générer une structure de chapitres.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      {#if !aiResult}
        <!-- Formulaire de génération -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="ai-grade">Classe</label>
            <select 
              id="ai-grade" 
              bind:value={aiForm.grade_slug}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            >
              <option value="">Sélectionner une classe</option>
              {#each data.grades as grade}
                <option value={grade.slug}>{grade.cycle_name} - {grade.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="ai-subject">Matière</label>
            <select 
              id="ai-subject" 
              bind:value={aiForm.subject_code}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            >
              <option value="">Sélectionner une matière</option>
              {#each data.subjects as subject}
                <option value={subject.code}>{subject.icon || '📖'} {subject.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="ai-chapters">Nombre de chapitres</label>
            <Input 
              id="ai-chapters" 
              type="number" 
              bind:value={aiForm.chapters_count}
              min="1"
              max="20"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="ai-model">Modèle IA</label>
            <select 
              id="ai-model" 
              bind:value={aiForm.model}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {#each availableModels as model}
                <option value={model.id}>{model.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center">
            <input 
              type="checkbox" 
              id="ai-descriptions" 
              bind:checked={aiForm.include_descriptions} 
              class="w-4 h-4 rounded"
            />
            <label class="cursor-pointer text-sm font-medium text-gray-700 ml-2" for="ai-descriptions">
              Inclure les descriptions
            </label>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p class="font-medium mb-1">💡 GitHub Models (gratuit)</p>
          <p>Utilise ton GITHUB_TOKEN pour accéder gratuitement à plusieurs modèles IA.</p>
        </div>
      {:else}
        <!-- Résultat de la génération -->
        <div class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-800 font-medium flex items-center gap-2">
              <CheckCircle class="w-4 h-4" />
              Programme généré avec succès !
            </p>
            {#if aiResult.model}
              <p class="text-xs text-green-600 mt-1">
                Modèle utilisé : {availableModels.find(m => m.id === aiResult.model)?.name || aiResult.model}
              </p>
            {/if}
          </div>

          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 font-medium text-sm flex items-center justify-between">
              <span>{aiResult.chapters?.length || 0} chapitres générés</span>
              {#if aiResult.grade && aiResult.subject}
                <span class="text-xs text-gray-500">{aiResult.subject.name} - {aiResult.grade.name}</span>
              {/if}
            </div>
            <div class="max-h-[300px] overflow-y-auto">
              {#each aiResult.chapters || [] as chapter, i}
                <div class="px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div class="flex items-start gap-3">
                    <span class="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p class="font-medium text-gray-900">{chapter.name}</p>
                      {#if chapter.description}
                        <p class="text-sm text-gray-500 mt-1">{chapter.description}</p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button type="button" variant="outline" onclick={() => { showAIModal = false; aiResult = null; }}>
        {aiResult ? 'Fermer' : 'Annuler'}
      </Button>
      {#if aiResult}
        <Button onclick={applyAIResult} disabled={saving} class="gap-2">
          {#if saving}
            <Loader2 class="w-4 h-4 animate-spin" />
          {/if}
          Appliquer ce programme
        </Button>
      {:else}
        <Button onclick={generateWithAI} disabled={generating || !aiForm.grade_slug || !aiForm.subject_code} class="gap-2">
          {#if generating}
            <Loader2 class="w-4 h-4 animate-spin" />
            Génération en cours...
          {:else}
            <Wand2 class="w-4 h-4" />
            Générer
          {/if}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
