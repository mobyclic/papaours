<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { 
    ArrowLeft, BookOpen, Sparkles, ChevronDown, ChevronUp, Plus, 
    Trash2, Edit2, Loader2, Check, X, GripVertical, Wand2, RefreshCw,
    FileText, Layers, Target, AlertTriangle, ArrowUp, ArrowDown, Eye, Info
  } from "lucide-svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { flip } from 'svelte/animate';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  
  // Derived grade - évite les problèmes de réactivité
  let grade = $derived(data.grade);

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
  let aiSubjectMode = $state<'all' | 'single'>('all'); // 'all' ou 'single'
  let aiSelectedSubjects = $state<string[]>([]); // codes des matières sélectionnées
  let aiProgramLoading = $state(false);
  let aiProgramResult = $state<any>(null);
  let aiProgramError = $state('');
  let selectedModel = $state('gpt-4o-mini');
  let customPrompt = $state('Génère le programme scolaire officiel français avec tous les chapitres nécessaires selon les programmes de l\'Éducation Nationale.');
  
  // États pour la validation des résultats IA
  let aiProgramsToApply = $state<any[]>([]); // programmes sélectionnés pour application

  // Modal IA Chapitres
  let showAIChaptersModal = $state(false);
  let aiChaptersProgram = $state<any>(null);
  let aiChaptersLoading = $state(false);
  let aiChaptersResult = $state<any>(null);
  let aiChaptersError = $state('');
  let chaptersCount = $state(8);
  let includeDescriptions = $state(true);

  // Modal édition chapitre
  let showEditChapterModal = $state(false);
  let editingChapter = $state<any>(null);
  let editChapterTitle = $state('');
  let editChapterDescription = $state('');
  let editingChapterSaving = $state(false);

  // Modal ajout chapitre manuel
  let showAddChapterModal = $state(false);
  let addChapterProgram = $state<any>(null);
  let newChapterTitle = $state('');
  let newChapterDescription = $state('');
  let addingChapter = $state(false);

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
          grade_id: grade.id,
          subject_code: newProgramSubject,
          name: `Programme ${data.allSubjects.find((s: any) => s.code === newProgramSubject)?.name || ''} - ${grade.name}`
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
    if (subjectCode) {
      aiSubjectMode = 'single';
      aiSelectedSubjects = [subjectCode];
    } else {
      aiSubjectMode = 'all';
      aiSelectedSubjects = [];
    }
    aiProgramResult = null;
    aiProgramError = '';
    aiProgramsToApply = [];
    customPrompt = 'Génère le programme scolaire officiel français avec tous les chapitres nécessaires selon les programmes de l\'Éducation Nationale.';
    showAIProgramModal = true;
  }

  // Générer programme avec IA
  async function generateProgram() {
    aiProgramLoading = true;
    aiProgramError = '';
    aiProgramResult = null;
    aiProgramsToApply = [];

    try {
      // Préparer les programmes existants pour comparaison
      const existingPrograms = data.programs.map((p: any) => ({
        subject_code: p.subject_code,
        subject_name: p.subject_name,
        chapters: p.chapters || []
      }));

      // Déterminer les matières à traiter
      const subjectCodes = aiSubjectMode === 'all' 
        ? ['all'] 
        : aiSelectedSubjects;

      const res = await fetch('/api/admin/programs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: grade.id,
          subject_codes: subjectCodes,
          custom_prompt: customPrompt,
          model: selectedModel,
          existing_programs: existingPrograms.length > 0 ? existingPrograms : undefined
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Erreur génération');
      }

      aiProgramResult = result;
      // Par défaut, tous les programmes sont sélectionnés pour application
      aiProgramsToApply = result.programs?.map((p: any) => p.subject_code) || [];
    } catch (e: any) {
      aiProgramError = e.message;
    } finally {
      aiProgramLoading = false;
    }
  }

  // Toggle sélection d'un programme pour application
  function toggleProgramSelection(subjectCode: string) {
    if (aiProgramsToApply.includes(subjectCode)) {
      aiProgramsToApply = aiProgramsToApply.filter(c => c !== subjectCode);
    } else {
      aiProgramsToApply = [...aiProgramsToApply, subjectCode];
    }
  }

  // Appliquer les programmes sélectionnés
  async function applySelectedPrograms() {
    if (!aiProgramResult?.programs || aiProgramsToApply.length === 0) return;

    aiProgramLoading = true;
    aiProgramError = '';

    try {
      // Appliquer chaque programme sélectionné
      const programsToApply = aiProgramResult.programs.filter(
        (p: any) => aiProgramsToApply.includes(p.subject_code)
      );

      for (const program of programsToApply) {
        // Filtrer les chapitres : garder seulement ceux qui sont activés
        const enabledChapters = (program.chapters || [])
          .filter((c: any) => c.enabled !== false)
          .map((c: any, idx: number) => ({
            title: c.title,
            description: c.description || '',
            sort_order: idx
          }));

        const res = await fetch('/api/admin/programs/apply-generated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade_id: grade.id,
            subject_code: program.subject_code,
            program_name: `${program.subject_name} - ${grade.name}`,
            chapters: enabledChapters
          })
        });

        if (!res.ok) {
          const d = await res.json();
          throw new Error(`Erreur pour ${program.subject_name}: ${d.error}`);
        }
      }

      showAIProgramModal = false;
      aiProgramResult = null;
      success = `${programsToApply.length} programme(s) appliqué(s) avec succès !`;
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
    editChapterTitle = chapter.title || chapter.name || '';
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

  // Ouvrir modal ajout chapitre manuel
  function openAddChapterModal(program: any) {
    addChapterProgram = program;
    newChapterTitle = '';
    newChapterDescription = '';
    showAddChapterModal = true;
  }

  // Ajouter chapitre manuellement
  async function addChapterManually() {
    if (!addChapterProgram || !newChapterTitle.trim()) return;

    addingChapter = true;
    try {
      const programId = addChapterProgram.id.toString().replace('official_program:', '');
      const sortOrder = (addChapterProgram.chapters?.length || 0);

      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          title: newChapterTitle,
          description: newChapterDescription || null,
          sort_order: sortOrder
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur création');
      }

      showAddChapterModal = false;
      success = 'Chapitre ajouté';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      error = e.message;
    } finally {
      addingChapter = false;
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
  <title>{grade?.name ?? 'Chargement...'} - Gestion classe</title>
</svelte:head>

{#if grade}
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
            {grade.name}
          </h1>
          {#if grade.short_name}
            <span class="px-3 py-1 bg-gray-800 rounded-lg text-sm text-gray-400">{grade.short_name}</span>
          {/if}
        </div>
        <p class="text-gray-400 mt-2">
          {grade.cycle_name}
          {#if grade.track_name}
            <span class="mx-2">•</span> {grade.track_name}
          {/if}
          {#if grade.system_name}
            <span class="mx-2">•</span> {grade.system_name}
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
                  <div class="flex items-center justify-center gap-3">
                    <Button size="sm" variant="outline" onclick={() => openAddChapterModal(program)}>
                      <Plus class="w-4 h-4 mr-2" />
                      Ajouter manuellement
                    </Button>
                    <Button size="sm" onclick={() => openAIChaptersModal(program)}>
                      <Sparkles class="w-4 h-4 mr-2" />
                      Générer avec l'IA
                    </Button>
                  </div>
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
                  
                  <!-- Bouton ajouter chapitre manuellement -->
                  <button
                    onclick={() => openAddChapterModal(program)}
                    class="w-full py-2.5 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus class="w-4 h-4" />
                    Ajouter un chapitre
                  </button>
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
              onclick={() => { openAIProgramModal(subject.code); }}
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
  <Dialog.Content class="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-white">
        <Sparkles class="w-5 h-5 text-purple-400" />
        Générer un programme avec l'IA
      </Dialog.Title>
      <Dialog.Description class="text-gray-400">
        L'IA va générer le programme officiel avec les chapitres pour {grade.name}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="py-4 space-y-4">
      {#if !aiProgramResult}
        <!-- Configuration avant génération -->
        
        <!-- Mode de sélection des matières -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-gray-300">Matières à traiter</p>
          <div class="flex gap-2">
            <button
              onclick={() => { aiSubjectMode = 'all'; aiSelectedSubjects = []; }}
              class="flex-1 px-4 py-3 rounded-lg border transition-colors {aiSubjectMode === 'all' 
                ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}"
            >
              <BookOpen class="w-5 h-5 mx-auto mb-1" />
              <span class="text-sm">Toutes les matières</span>
            </button>
            <button
              onclick={() => aiSubjectMode = 'single'}
              class="flex-1 px-4 py-3 rounded-lg border transition-colors {aiSubjectMode === 'single' 
                ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}"
            >
              <Target class="w-5 h-5 mx-auto mb-1" />
              <span class="text-sm">Matière spécifique</span>
            </button>
          </div>
        </div>

        <!-- Sélection de matière si mode single -->
        {#if aiSubjectMode === 'single'}
          <div class="flex flex-wrap gap-2">
            {#each data.allSubjects as subject}
              {@const isSelected = aiSelectedSubjects.includes(subject.code)}
              {@const hasProgram = data.programs.some((p: any) => p.subject_code === subject.code)}
              <button
                onclick={() => {
                  if (isSelected) {
                    aiSelectedSubjects = aiSelectedSubjects.filter(c => c !== subject.code);
                  } else {
                    aiSelectedSubjects = [...aiSelectedSubjects, subject.code];
                  }
                }}
                class="px-3 py-2 rounded-lg border text-sm transition-colors flex items-center gap-2
                  {isSelected 
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}"
              >
                <span>{subject.icon || '📚'}</span>
                {subject.name}
                {#if hasProgram}
                  <span class="w-2 h-2 rounded-full bg-amber-400" title="Programme existant"></span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}

        <!-- Prompt personnalisable -->
        <div>
          <p class="text-sm font-medium text-gray-300 mb-2">Instructions pour l'IA</p>
          <textarea
            bind:value={customPrompt}
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            placeholder="Décrivez ce que l'IA doit générer..."
          ></textarea>
        </div>

        <!-- Modèle IA -->
        <div>
          <p class="text-sm font-medium text-gray-300 mb-2">Modèle IA</p>
          <Select.Root type="single" bind:value={selectedModel}>
            <Select.Trigger class="w-full bg-gray-800 border-gray-700 text-white">
              {availableModels.find((m: any) => m.id === selectedModel)?.name || selectedModel}
            </Select.Trigger>
            <Select.Content class="bg-gray-800 border-gray-700">
              {#each availableModels as model}
                <Select.Item value={model.id} class="text-white hover:bg-gray-700">{model.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Info sur les programmes existants -->
        {#if data.programs.length > 0}
          <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium">Programmes existants détectés</p>
              <p class="text-amber-400/80 text-xs mt-1">
                L'IA prendra en compte les {data.programs.length} programme(s) existant(s) pour proposer des modifications si nécessaire.
              </p>
            </div>
          </div>
        {/if}

      {:else}
        <!-- Résultats de la génération -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-400">
              {aiProgramResult.programs?.length || 0} programme(s) généré(s) • {aiProgramsToApply.length} sélectionné(s)
            </p>
            <div class="flex items-center gap-2">
              <button
                onclick={() => aiProgramsToApply = aiProgramResult.programs?.map((p: any) => p.subject_code) || []}
                class="text-xs text-purple-400 hover:text-purple-300"
              >
                Tout sélectionner
              </button>
              <span class="text-gray-600">|</span>
              <button
                onclick={() => aiProgramsToApply = []}
                class="text-xs text-gray-400 hover:text-gray-300"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {#each aiProgramResult.programs || [] as program, pIndex}
              {@const isSelected = aiProgramsToApply.includes(program.subject_code)}
              {@const existingProgram = data.programs.find((p: any) => p.subject_code === program.subject_code)}
              
              <div class="rounded-xl border transition-colors {isSelected ? 'bg-gray-800/80 border-purple-500/50' : 'bg-gray-800/30 border-gray-700'}">
                <!-- Header du programme -->
                <button
                  onclick={() => toggleProgramSelection(program.subject_code)}
                  class="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    {isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}">
                    {#if isSelected}
                      <Check class="w-3 h-3 text-white" />
                    {/if}
                  </div>
                  
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-white">{program.subject_name}</span>
                      {#if existingProgram}
                        <span class="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                          Modification
                          <Tooltip.Provider>
                            <Tooltip.Root>
                              <Tooltip.Trigger class="cursor-help">
                                <Info class="w-3 h-3" />
                              </Tooltip.Trigger>
                              <Tooltip.Content class="bg-gray-900 border border-gray-700 p-3 max-w-xs">
                                <p class="text-xs text-gray-400 mb-1">Programme existant :</p>
                                <p class="text-sm text-white">{existingProgram.name || existingProgram.subject_name}</p>
                                <p class="text-xs text-gray-500 mt-1">{existingProgram.chapters?.length || 0} chapitre(s)</p>
                              </Tooltip.Content>
                            </Tooltip.Root>
                          </Tooltip.Provider>
                        </span>
                      {:else}
                        <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Nouveau
                        </span>
                      {/if}
                    </div>
                    <p class="text-sm text-gray-400 mt-0.5">
                      {program.chapters?.filter((c: any) => c.enabled !== false).length || 0} chapitre(s) activé(s)
                    </p>
                  </div>

                  <ChevronDown class="w-5 h-5 text-gray-500 transition-transform {isSelected ? 'rotate-180' : ''}" />
                </button>

                <!-- Liste des chapitres éditable -->
                {#if isSelected}
                  <div class="px-4 pb-4 pt-0 border-t border-gray-700/50">
                    <!-- Légende des actions -->
                    <div class="flex items-center gap-4 mb-3 mt-2 text-xs">
                      <span class="flex items-center gap-1 text-green-400">
                        <span class="w-2 h-2 rounded-full bg-green-400"></span> Nouveau
                      </span>
                      <span class="flex items-center gap-1 text-amber-400">
                        <span class="w-2 h-2 rounded-full bg-amber-400"></span> Modifié
                      </span>
                      <span class="flex items-center gap-1 text-red-400">
                        <span class="w-2 h-2 rounded-full bg-red-400"></span> À supprimer
                      </span>
                    </div>
                    
                    <div class="space-y-2">
                      {#each program.chapters || [] as chapter, i (chapter.id || i)}
                        {@const existingChapter = existingProgram?.chapters?.find((c: any) => 
                          c.title === chapter.original_title || c.id === chapter.existing_id
                        )}
                        {@const isNewChapter = !existingChapter && !chapter.existing_id}
                        {@const isModifiedChapter = existingChapter && (existingChapter.title !== chapter.title || existingChapter.description !== chapter.description)}
                        {@const isDeletedChapter = chapter.action === 'delete'}
                        <div 
                          class="group flex items-start gap-2 py-2 px-3 rounded-lg transition-colors
                            {isDeletedChapter ? 'bg-red-500/10 border border-red-500/30' : 
                             chapter.enabled === false ? 'bg-gray-900/30 opacity-50' : 
                             isNewChapter ? 'bg-green-500/5 border border-green-500/20' :
                             isModifiedChapter ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-gray-900/50'}"
                          animate:flip={{ duration: 200 }}
                        >
                          <!-- Indicateur d'action -->
                          <div class="w-2 h-2 rounded-full flex-shrink-0 mt-2
                            {isDeletedChapter ? 'bg-red-400' : 
                             isNewChapter ? 'bg-green-400' : 
                             isModifiedChapter ? 'bg-amber-400' : 'bg-gray-600'}">
                          </div>

                          <!-- Checkbox pour activer/désactiver -->
                          <button
                            onclick={() => {
                              chapter.enabled = chapter.enabled === false ? true : false;
                              aiProgramResult = { ...aiProgramResult };
                            }}
                            class="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                              {isDeletedChapter ? 'border-red-500 bg-red-500' : 
                               chapter.enabled === false ? 'border-gray-600 bg-transparent' : 'border-purple-500 bg-purple-500'}"
                          >
                            {#if isDeletedChapter}
                              <X class="w-3 h-3 text-white" />
                            {:else if chapter.enabled !== false}
                              <Check class="w-3 h-3 text-white" />
                            {/if}
                          </button>

                          <!-- Numéro et contenu -->
                          <div class="flex-1 min-w-0">
                            {#if chapter.editing}
                              <!-- Mode édition -->
                              <input
                                type="text"
                                bind:value={chapter.title}
                                class="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm mb-1 focus:outline-none focus:border-purple-500"
                                placeholder="Titre du chapitre"
                              />
                              <textarea
                                bind:value={chapter.description}
                                class="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-300 text-xs resize-none focus:outline-none focus:border-purple-500"
                                rows="2"
                                placeholder="Description (optionnel)"
                              ></textarea>
                              <button
                                onclick={() => { chapter.editing = false; aiProgramResult = { ...aiProgramResult }; }}
                                class="mt-1 text-xs text-purple-400 hover:text-purple-300"
                              >
                                Terminer l'édition
                              </button>
                            {:else}
                              <!-- Mode affichage -->
                              <div class="flex items-center gap-2">
                                <span class="w-5 h-5 rounded text-xs flex items-center justify-center flex-shrink-0
                                  {isNewChapter ? 'bg-green-500/20 text-green-400' : 
                                   isModifiedChapter ? 'bg-amber-500/20 text-amber-400' :
                                   isDeletedChapter ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}">
                                  {i + 1}
                                </span>
                                <p class="text-sm flex-1 {isDeletedChapter ? 'line-through text-red-400' : 'text-white'}">
                                  {chapter.title}
                                </p>
                                
                                <!-- Badge d'action -->
                                {#if isNewChapter}
                                  <span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded uppercase font-medium">
                                    Nouveau
                                  </span>
                                {:else if isModifiedChapter}
                                  <span class="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded uppercase font-medium">
                                    Modifié
                                  </span>
                                {:else if isDeletedChapter}
                                  <span class="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded uppercase font-medium">
                                    Supprimé
                                  </span>
                                {/if}
                                
                                <!-- Tooltip pour voir l'ancien contenu si modifié -->
                                {#if existingChapter && isModifiedChapter}
                                  <Tooltip.Provider>
                                    <Tooltip.Root>
                                      <Tooltip.Trigger class="cursor-help">
                                        <Eye class="w-3.5 h-3.5 text-amber-400" />
                                      </Tooltip.Trigger>
                                      <Tooltip.Content class="bg-gray-900 border border-gray-700 p-3 max-w-sm">
                                        <p class="text-xs text-gray-400 mb-1">Contenu actuel :</p>
                                        <p class="text-sm text-white font-medium">{existingChapter.title}</p>
                                        {#if existingChapter.description}
                                          <p class="text-xs text-gray-400 mt-1">{existingChapter.description}</p>
                                        {/if}
                                      </Tooltip.Content>
                                    </Tooltip.Root>
                                  </Tooltip.Provider>
                                {/if}
                              </div>
                              {#if chapter.description}
                                <p class="text-xs text-gray-500 mt-0.5 ml-7 line-clamp-2">{chapter.description}</p>
                              {/if}
                            {/if}
                          </div>

                          <!-- Actions -->
                          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <!-- Éditer -->
                            <button
                              onclick={() => { chapter.editing = !chapter.editing; aiProgramResult = { ...aiProgramResult }; }}
                              class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                              title="Éditer"
                            >
                              <Edit2 class="w-3.5 h-3.5" />
                            </button>
                            
                            <!-- Monter -->
                            {#if i > 0}
                              <button
                                onclick={() => {
                                  const chapters = [...program.chapters];
                                  [chapters[i - 1], chapters[i]] = [chapters[i], chapters[i - 1]];
                                  program.chapters = chapters;
                                  aiProgramResult = { ...aiProgramResult };
                                }}
                                class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                                title="Monter"
                              >
                                <ArrowUp class="w-3.5 h-3.5" />
                              </button>
                            {/if}
                            
                            <!-- Descendre -->
                            {#if i < (program.chapters?.length || 0) - 1}
                              <button
                                onclick={() => {
                                  const chapters = [...program.chapters];
                                  [chapters[i], chapters[i + 1]] = [chapters[i + 1], chapters[i]];
                                  program.chapters = chapters;
                                  aiProgramResult = { ...aiProgramResult };
                                }}
                                class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                                title="Descendre"
                              >
                                <ArrowDown class="w-3.5 h-3.5" />
                              </button>
                            {/if}
                            
                            <!-- Supprimer -->
                            <button
                              onclick={() => {
                                program.chapters = program.chapters.filter((_: any, idx: number) => idx !== i);
                                aiProgramResult = { ...aiProgramResult };
                              }}
                              class="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                              title="Supprimer"
                            >
                              <Trash2 class="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      {/each}
                      
                      <!-- Ajouter un chapitre -->
                      <button
                        onclick={() => {
                          program.chapters = [...(program.chapters || []), { 
                            title: 'Nouveau chapitre', 
                            description: '', 
                            enabled: true,
                            editing: true 
                          }];
                          aiProgramResult = { ...aiProgramResult };
                        }}
                        class="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Plus class="w-4 h-4" />
                        Ajouter un chapitre
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if aiProgramError}
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {aiProgramError}
        </div>
      {/if}
    </div>

    <Dialog.Footer class="border-t border-gray-700 pt-4">
      <Button variant="ghost" onclick={() => showAIProgramModal = false} class="text-gray-400 hover:text-white">
        Annuler
      </Button>
      {#if aiProgramResult}
        <Button variant="outline" onclick={generateProgram} disabled={aiProgramLoading} class="border-gray-600">
          <RefreshCw class="w-4 h-4 mr-2" />
          Régénérer
        </Button>
        <Button 
          onclick={applySelectedPrograms} 
          disabled={aiProgramLoading || aiProgramsToApply.length === 0}
          class="bg-purple-600 hover:bg-purple-700"
        >
          {#if aiProgramLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {:else}
            <Check class="w-4 h-4 mr-2" />
          {/if}
          Appliquer ({aiProgramsToApply.length})
        </Button>
      {:else}
        <Button 
          onclick={generateProgram} 
          disabled={aiProgramLoading || (aiSubjectMode === 'single' && aiSelectedSubjects.length === 0)}
          class="bg-purple-600 hover:bg-purple-700"
        >
          {#if aiProgramLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Génération en cours...
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

<!-- Modal: Ajout chapitre manuel -->
<Dialog.Root bind:open={showAddChapterModal}>
  <Dialog.Content class="sm:max-w-md bg-gray-900 border-gray-700">
    <Dialog.Header>
      <Dialog.Title class="text-white">Ajouter un chapitre</Dialog.Title>
      {#if addChapterProgram}
        <Dialog.Description class="text-gray-400">
          Nouveau chapitre pour {addChapterProgram.subject_name}
        </Dialog.Description>
      {/if}
    </Dialog.Header>
    
    <div class="py-4 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Titre</label>
        <Input 
          bind:value={newChapterTitle} 
          placeholder="Titre du chapitre" 
          class="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Description (optionnel)</label>
        <textarea 
          bind:value={newChapterDescription}
          class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows="3"
          placeholder="Description du chapitre..."
        ></textarea>
      </div>
    </div>

    <Dialog.Footer class="border-t border-gray-700 pt-4">
      <Button variant="ghost" onclick={() => showAddChapterModal = false} class="text-gray-400">
        Annuler
      </Button>
      <Button 
        onclick={addChapterManually} 
        disabled={!newChapterTitle.trim() || addingChapter}
        class="bg-purple-600 hover:bg-purple-700"
      >
        {#if addingChapter}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {:else}
          <Plus class="w-4 h-4 mr-2" />
        {/if}
        Ajouter
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
{:else}
<div class="flex-1 p-8 flex items-center justify-center">
  <p class="text-gray-400">Chargement de la classe...</p>
</div>
{/if}