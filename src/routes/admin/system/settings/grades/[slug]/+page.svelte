<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { 
    ArrowLeft, BookOpen, Sparkles, ChevronDown, ChevronUp, Plus, 
    Trash2, Edit2, Loader2, Check, X, GripVertical, Wand2, RefreshCw,
    FileText, Layers, Target, AlertTriangle
  } from "lucide-svelte";
  import { flip } from 'svelte/animate';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();

  // États UI
  let expandedPrograms = $state<Set<string>>(new Set());
  let saving = $state(false);
  let error = $state('');
  let success = $state('');

  // Modal création programme
  let showAddProgramModal = $state(false);
  let newProgramSubject = $state('');
  let addingProgram = $state(false);

  // Modal IA Programme
  let showAIProgramModal = $state(false);
  let aiProgramSubject = $state('');
  let aiProgramLoading = $state(false);
  let aiProgramResult = $state<any>(null);
  let aiProgramError = $state('');
  let selectedModel = $state('gpt-4o-mini');
  let chaptersCount = $state(6);
  let includeDescriptions = $state(true);

  // Modal IA Chapitres
  let showAIChaptersModal = $state(false);
  let aiChaptersProgram = $state<any>(null);
  let aiChaptersLoading = $state(false);
  let aiChaptersResult = $state<any>(null);
  let aiChaptersError = $state('');

  // Modal édition chapitre
  let showEditChapterModal = $state(false);
  let editingChapter = $state<any>(null);
  let editChapterTitle = $state('');
  let editChapterDescription = $state('');
  let editingChapterSaving = $state(false);

  // Modèles IA disponibles
  let availableModels = $state<{id: string, name: string, provider: string}[]>([]);

  // Charger les modèles
  $effect(() => {
    fetch('/api/admin/programs/generate')
      .then(r => r.json())
      .then(d => { availableModels = d.models || []; })
      .catch(() => {});
  });

  // Toggle expand programme
  function toggleProgram(programId: string) {
    if (expandedPrograms.has(programId)) {
      expandedPrograms.delete(programId);
    } else {
      expandedPrograms.add(programId);
    }
    expandedPrograms = new Set(expandedPrograms);
  }

  // Ajouter un programme
  async function addProgram() {
    if (!newProgramSubject) return;
    
    addingProgram = true;
    error = '';
    
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_slug: data.grade.slug,
          subject_code: newProgramSubject,
          name: `Programme ${data.allSubjects.find((s: any) => s.code === newProgramSubject)?.name || ''} - ${data.grade.name}`
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur création');
      }

      showAddProgramModal = false;
      newProgramSubject = '';
      success = 'Programme créé';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      error = e.message;
    } finally {
      addingProgram = false;
    }
  }

  // Supprimer un programme
  async function deleteProgram(programId: string) {
    if (!confirm('Supprimer ce programme et tous ses chapitres ?')) return;
    
    saving = true;
    try {
      const res = await fetch(`/api/admin/programs/${programId.replace('official_program:', '')}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Erreur suppression');
      
      success = 'Programme supprimé';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  // Ouvrir modal IA Programme
  function openAIProgramModal(subjectCode?: string) {
    aiProgramSubject = subjectCode || '';
    aiProgramResult = null;
    aiProgramError = '';
    showAIProgramModal = true;
  }

  // Générer programme avec IA
  async function generateProgram() {
    if (!aiProgramSubject) {
      aiProgramError = 'Sélectionnez une matière';
      return;
    }

    aiProgramLoading = true;
    aiProgramError = '';
    aiProgramResult = null;

    try {
      const res = await fetch('/api/admin/programs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_slug: data.grade.slug,
          subject_code: aiProgramSubject,
          chapters_count: chaptersCount,
          include_descriptions: includeDescriptions,
          model: selectedModel
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Erreur génération');
      }

      aiProgramResult = result;
    } catch (e: any) {
      aiProgramError = e.message;
    } finally {
      aiProgramLoading = false;
    }
  }

  // Appliquer le programme généré
  async function applyGeneratedProgram() {
    if (!aiProgramResult?.chapters) return;

    aiProgramLoading = true;
    aiProgramError = '';

    try {
      const res = await fetch('/api/admin/programs/apply-generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_slug: data.grade.slug,
          subject_code: aiProgramSubject,
          program_name: aiProgramResult.program_name,
          chapters: aiProgramResult.chapters
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur application');
      }

      showAIProgramModal = false;
      aiProgramResult = null;
      success = 'Programme appliqué avec succès !';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      aiProgramError = e.message;
    } finally {
      aiProgramLoading = false;
    }
  }

  // Ouvrir modal IA Chapitres
  function openAIChaptersModal(program: any) {
    aiChaptersProgram = program;
    aiChaptersResult = null;
    aiChaptersError = '';
    showAIChaptersModal = true;
  }

  // Générer chapitres avec IA
  async function generateChapters() {
    if (!aiChaptersProgram) return;

    aiChaptersLoading = true;
    aiChaptersError = '';
    aiChaptersResult = null;

    try {
      const res = await fetch('/api/admin/programs/generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: aiChaptersProgram.id,
          chapters_count: chaptersCount,
          include_descriptions: includeDescriptions,
          model: selectedModel
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Erreur génération');
      }

      aiChaptersResult = result;
    } catch (e: any) {
      aiChaptersError = e.message;
    } finally {
      aiChaptersLoading = false;
    }
  }

  // Appliquer les chapitres générés
  async function applyGeneratedChapters() {
    if (!aiChaptersResult?.chapters || !aiChaptersProgram) return;

    aiChaptersLoading = true;
    aiChaptersError = '';

    try {
      const res = await fetch('/api/admin/programs/apply-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: aiChaptersProgram.id,
          chapters: aiChaptersResult.chapters,
          replace: true
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur application');
      }

      showAIChaptersModal = false;
      aiChaptersResult = null;
      success = 'Chapitres appliqués avec succès !';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      aiChaptersError = e.message;
    } finally {
      aiChaptersLoading = false;
    }
  }

  // Ouvrir modal édition chapitre
  function openEditChapter(chapter: any, program: any) {
    editingChapter = { ...chapter, program_id: program.id };
    editChapterTitle = chapter.title;
    editChapterDescription = chapter.description || '';
    showEditChapterModal = true;
  }

  // Sauvegarder chapitre
  async function saveChapter() {
    if (!editingChapter || !editChapterTitle.trim()) return;

    editingChapterSaving = true;
    try {
      const res = await fetch(`/api/admin/chapters/${editingChapter.id.replace('chapter:', '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editChapterTitle,
          description: editChapterDescription || null
        })
      });

      if (!res.ok) throw new Error('Erreur sauvegarde');

      showEditChapterModal = false;
      success = 'Chapitre modifié';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      error = e.message;
    } finally {
      editingChapterSaving = false;
    }
  }

  // Supprimer chapitre
  async function deleteChapter(chapterId: string) {
    if (!confirm('Supprimer ce chapitre ?')) return;

    saving = true;
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId.replace('chapter:', '')}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Erreur suppression');

      success = 'Chapitre supprimé';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  // Couleur par défaut pour les matières
  function getSubjectColor(code: string): string {
    const colors: Record<string, string> = {
      'FR': 'from-blue-500 to-indigo-500',
      'MATH': 'from-emerald-500 to-teal-500',
      'HG': 'from-amber-500 to-orange-500',
      'SVT': 'from-green-500 to-lime-500',
      'PC': 'from-purple-500 to-pink-500',
      'LV1': 'from-red-500 to-rose-500',
      'LV2': 'from-cyan-500 to-sky-500',
    };
    return colors[code] || 'from-gray-500 to-slate-500';
  }
</script>

<svelte:head>
  <title>{data.grade.name} - Gestion classe</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/system/settings/grades" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux classes
    </a>
    
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {data.grade.name}
          </h1>
          {#if data.grade.short_name}
            <span class="px-3 py-1 bg-gray-800 rounded-lg text-sm text-gray-400">{data.grade.short_name}</span>
          {/if}
        </div>
        <p class="text-gray-400 mt-2">
          {data.grade.cycle_name}
          {#if data.grade.track_name}
            <span class="mx-2">•</span> {data.grade.track_name}
          {/if}
          {#if data.grade.system_name}
            <span class="mx-2">•</span> {data.grade.system_name}
          {/if}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button variant="outline" onclick={() => showAddProgramModal = true}>
          <Plus class="w-4 h-4 mr-2" />
          Ajouter programme
        </Button>
        <Button onclick={() => openAIProgramModal()}>
          <Sparkles class="w-4 h-4 mr-2" />
          IA Programme
        </Button>
      </div>
    </div>
  </div>

  <!-- Messages -->
  {#if error}
    <div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
      <AlertTriangle class="w-5 h-5" />
      {error}
      <button onclick={() => error = ''} class="ml-auto"><X class="w-4 h-4" /></button>
    </div>
  {/if}
  {#if success}
    <div class="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-2">
      <Check class="w-5 h-5" />
      {success}
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-4 gap-4 mb-8">
    <div class="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-blue-500/20 rounded-lg">
          <BookOpen class="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{data.stats.totalPrograms}</p>
          <p class="text-sm text-gray-400">Programmes</p>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-emerald-500/20 rounded-lg">
          <Layers class="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{data.stats.totalChapters}</p>
          <p class="text-sm text-gray-400">Chapitres</p>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-amber-500/20 rounded-lg">
          <Target class="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{data.stats.programsWithChapters}/{data.stats.totalPrograms}</p>
          <p class="text-sm text-gray-400">Programmes complets</p>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-purple-500/20 rounded-lg">
          <FileText class="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{data.stats.subjectsWithProgram}/{data.stats.totalSubjects}</p>
          <p class="text-sm text-gray-400">Matières couvertes</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Liste des programmes -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold text-white flex items-center gap-2">
      <BookOpen class="w-5 h-5" />
      Programmes par matière
    </h2>

    {#if data.programs.length === 0}
      <div class="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
        <BookOpen class="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p class="text-gray-400 mb-4">Aucun programme pour cette classe</p>
        <div class="flex items-center justify-center gap-3">
          <Button variant="outline" onclick={() => showAddProgramModal = true}>
            <Plus class="w-4 h-4 mr-2" />
            Ajouter manuellement
          </Button>
          <Button onclick={() => openAIProgramModal()}>
            <Sparkles class="w-4 h-4 mr-2" />
            Générer avec l'IA
          </Button>
        </div>
      </div>
    {:else}
      {#each data.programs as program (program.id)}
        <div 
          class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden"
          animate:flip={{ duration: 200 }}
        >
          <!-- En-tête programme -->
          <div class="p-4 flex items-center justify-between">
            <button 
              onclick={() => toggleProgram(program.id)}
              class="flex items-center gap-4 flex-1 text-left"
            >
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br {getSubjectColor(program.subject_code)} flex items-center justify-center text-white text-lg">
                {program.subject_icon || program.subject_code?.charAt(0) || '?'}
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-white">{program.subject_name}</h3>
                <p class="text-sm text-gray-400">
                  {program.chapters_count} chapitre{program.chapters_count !== 1 ? 's' : ''}
                  {#if program.description}
                    <span class="mx-2">•</span>
                    <span class="truncate">{program.description}</span>
                  {/if}
                </p>
              </div>
              {#if expandedPrograms.has(program.id)}
                <ChevronUp class="w-5 h-5 text-gray-400" />
              {:else}
                <ChevronDown class="w-5 h-5 text-gray-400" />
              {/if}
            </button>

            <div class="flex items-center gap-2 ml-4">
              <Button size="sm" variant="ghost" onclick={() => openAIChaptersModal(program)} title="Générer chapitres avec IA">
                <Wand2 class="w-4 h-4 text-purple-400" />
              </Button>
              <Button size="sm" variant="ghost" onclick={() => deleteProgram(program.id)} title="Supprimer">
                <Trash2 class="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>

          <!-- Liste des chapitres (expandable) -->
          {#if expandedPrograms.has(program.id)}
            <div class="border-t border-gray-800 p-4 bg-gray-950/50">
              {#if program.chapters.length === 0}
                <div class="text-center py-8">
                  <p class="text-gray-500 mb-3">Aucun chapitre</p>
                  <Button size="sm" onclick={() => openAIChaptersModal(program)}>
                    <Sparkles class="w-4 h-4 mr-2" />
                    Générer avec l'IA
                  </Button>
                </div>
              {:else}
                <div class="space-y-2">
                  {#each program.chapters as chapter, i (chapter.id)}
                    <div 
                      class="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg group hover:bg-gray-800/50 transition-colors"
                      animate:flip={{ duration: 150 }}
                    >
                      <span class="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        {i + 1}
                      </span>
                      <div class="flex-1 min-w-0">
                        <p class="text-white truncate">{chapter.title}</p>
                        {#if chapter.description}
                          <p class="text-sm text-gray-500 truncate">{chapter.description}</p>
                        {/if}
                      </div>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onclick={() => openEditChapter(chapter, program)}
                          class="p-1.5 hover:bg-gray-700 rounded"
                        >
                          <Edit2 class="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button 
                          onclick={() => deleteChapter(chapter.id)}
                          class="p-1.5 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 class="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {/if}

    <!-- Matières sans programme -->
    {#if data.subjects.length > 0}
      <div class="mt-8">
        <h3 class="text-lg font-medium text-gray-400 mb-3">Matières sans programme ({data.subjects.length})</h3>
        <div class="flex flex-wrap gap-2">
          {#each data.subjects as subject}
            <button
              onclick={() => { aiProgramSubject = subject.code; openAIProgramModal(subject.code); }}
              class="px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>{subject.icon || subject.code?.charAt(0)}</span>
              {subject.name}
              <Sparkles class="w-3 h-3 text-purple-400" />
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal: Ajouter programme -->
<Dialog.Root bind:open={showAddProgramModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Ajouter un programme</Dialog.Title>
      <Dialog.Description>Sélectionnez une matière pour créer un programme vide</Dialog.Description>
    </Dialog.Header>
    
    <div class="py-4">
      <Select.Root type="single" bind:value={newProgramSubject}>
        <Select.Trigger class="w-full">
          {data.subjects.find((s: any) => s.code === newProgramSubject)?.name || 'Sélectionner une matière'}
        </Select.Trigger>
        <Select.Content>
          {#each data.subjects as subject}
            <Select.Item value={subject.code}>
              {subject.icon} {subject.name}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showAddProgramModal = false}>Annuler</Button>
      <Button onclick={addProgram} disabled={!newProgramSubject || addingProgram}>
        {#if addingProgram}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {/if}
        Créer
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Modal: IA Programme -->
<Dialog.Root bind:open={showAIProgramModal}>
  <Dialog.Content class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-purple-400" />
        Générer un programme avec l'IA
      </Dialog.Title>
      <Dialog.Description>
        L'IA va générer un programme complet avec les chapitres pour {data.grade.name}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="py-4 space-y-4">
      <!-- Sélection matière -->
      <div>
        <label class="block text-sm font-medium mb-2">Matière</label>
        <Select.Root type="single" bind:value={aiProgramSubject}>
          <Select.Trigger class="w-full">
            {data.allSubjects.find((s: any) => s.code === aiProgramSubject)?.name || 'Sélectionner une matière'}
          </Select.Trigger>
          <Select.Content>
            {#each data.allSubjects as subject}
              <Select.Item value={subject.code}>
                {subject.icon} {subject.name}
                {#if data.programs.some((p: any) => p.subject_code === subject.code)}
                  <span class="text-amber-400 text-xs ml-2">(existe déjà)</span>
                {/if}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Options -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Modèle IA</label>
          <Select.Root type="single" bind:value={selectedModel}>
            <Select.Trigger class="w-full">
              {availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
            </Select.Trigger>
            <Select.Content>
              {#each availableModels as model}
                <Select.Item value={model.id}>{model.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Nombre de chapitres</label>
          <Input type="number" bind:value={chaptersCount} min={3} max={15} />
        </div>
      </div>

      <label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={includeDescriptions} class="rounded" />
        <span class="text-sm">Inclure les descriptions des chapitres</span>
      </label>

      {#if aiProgramError}
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {aiProgramError}
        </div>
      {/if}

      <!-- Résultat -->
      {#if aiProgramResult}
        <div class="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h4 class="font-medium text-white mb-3">{aiProgramResult.program_name}</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each aiProgramResult.chapters as chapter, i}
              <div class="flex items-start gap-2 p-2 bg-gray-900/50 rounded-lg">
                <span class="w-5 h-5 rounded bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p class="text-white text-sm">{chapter.title}</p>
                  {#if chapter.description}
                    <p class="text-gray-500 text-xs mt-0.5">{chapter.description}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showAIProgramModal = false}>Annuler</Button>
      {#if aiProgramResult}
        <Button variant="outline" onclick={generateProgram} disabled={aiProgramLoading}>
          <RefreshCw class="w-4 h-4 mr-2" />
          Régénérer
        </Button>
        <Button onclick={applyGeneratedProgram} disabled={aiProgramLoading}>
          {#if aiProgramLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {:else}
            <Check class="w-4 h-4 mr-2" />
          {/if}
          Appliquer
        </Button>
      {:else}
        <Button onclick={generateProgram} disabled={!aiProgramSubject || aiProgramLoading}>
          {#if aiProgramLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Génération...
          {:else}
            <Sparkles class="w-4 h-4 mr-2" />
            Générer
          {/if}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Modal: IA Chapitres -->
<Dialog.Root bind:open={showAIChaptersModal}>
  <Dialog.Content class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Wand2 class="w-5 h-5 text-purple-400" />
        Générer les chapitres
      </Dialog.Title>
      <Dialog.Description>
        {#if aiChaptersProgram}
          Générer des chapitres pour le programme de {aiChaptersProgram.subject_name}
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="py-4 space-y-4">
      <!-- Options -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Modèle IA</label>
          <Select.Root type="single" bind:value={selectedModel}>
            <Select.Trigger class="w-full">
              {availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
            </Select.Trigger>
            <Select.Content>
              {#each availableModels as model}
                <Select.Item value={model.id}>{model.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Nombre de chapitres</label>
          <Input type="number" bind:value={chaptersCount} min={3} max={15} />
        </div>
      </div>

      <label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={includeDescriptions} class="rounded" />
        <span class="text-sm">Inclure les descriptions</span>
      </label>

      {#if aiChaptersProgram?.chapters?.length > 0}
        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm flex items-center gap-2">
          <AlertTriangle class="w-4 h-4" />
          Ce programme a déjà {aiChaptersProgram.chapters.length} chapitre(s). Ils seront remplacés.
        </div>
      {/if}

      {#if aiChaptersError}
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {aiChaptersError}
        </div>
      {/if}

      <!-- Résultat -->
      {#if aiChaptersResult}
        <div class="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h4 class="font-medium text-white mb-3">Chapitres générés</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each aiChaptersResult.chapters as chapter, i}
              <div class="flex items-start gap-2 p-2 bg-gray-900/50 rounded-lg">
                <span class="w-5 h-5 rounded bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p class="text-white text-sm">{chapter.title}</p>
                  {#if chapter.description}
                    <p class="text-gray-500 text-xs mt-0.5">{chapter.description}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showAIChaptersModal = false}>Annuler</Button>
      {#if aiChaptersResult}
        <Button variant="outline" onclick={generateChapters} disabled={aiChaptersLoading}>
          <RefreshCw class="w-4 h-4 mr-2" />
          Régénérer
        </Button>
        <Button onclick={applyGeneratedChapters} disabled={aiChaptersLoading}>
          {#if aiChaptersLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {:else}
            <Check class="w-4 h-4 mr-2" />
          {/if}
          Appliquer
        </Button>
      {:else}
        <Button onclick={generateChapters} disabled={aiChaptersLoading}>
          {#if aiChaptersLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Génération...
          {:else}
            <Sparkles class="w-4 h-4 mr-2" />
            Générer
          {/if}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Modal: Édition chapitre -->
<Dialog.Root bind:open={showEditChapterModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Modifier le chapitre</Dialog.Title>
    </Dialog.Header>
    
    <div class="py-4 space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Titre</label>
        <Input bind:value={editChapterTitle} placeholder="Titre du chapitre" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Description (optionnel)</label>
        <textarea 
          bind:value={editChapterDescription}
          class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white resize-none"
          rows="3"
          placeholder="Description du chapitre..."
        ></textarea>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showEditChapterModal = false}>Annuler</Button>
      <Button onclick={saveChapter} disabled={!editChapterTitle.trim() || editingChapterSaving}>
        {#if editingChapterSaving}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {/if}
        Sauvegarder
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
