<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import { 
    Plus, Pencil, Trash2, Target, BookOpen, 
    ChevronRight, Users, FileQuestion, Sparkles
  } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  // États
  let showModal = $state(false);
  let editingCompetence = $state<any>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);
  let filterType = $state<'all' | 'general' | 'subject'>('all');
  let filterSubject = $state('all');

  // Formulaire
  let form = $state({
    code: '',
    name: '',
    description: '',
    type: 'general' as 'general' | 'subject',
    subject_id: '',
    color: '#3B82F6',
    order: 0,
    is_active: true
  });

  // Compétences filtrées
  let filteredCompetences = $derived.by(() => {
    let result = data.competences;
    
    if (filterType !== 'all') {
      result = result.filter(c => c.type === filterType);
    }
    
    if (filterSubject !== 'all') {
      result = result.filter(c => c.subject_code === filterSubject || (filterSubject === 'general' && c.type === 'general'));
    }
    
    return result;
  });

  // Stats
  let stats = $derived({
    total: data.competences.length,
    general: data.grouped.general.length,
    bySubject: Object.values(data.grouped.bySubject).flat().length,
    withQuestions: data.competences.filter(c => c.questions_count > 0).length
  });

  // Couleurs prédéfinies
  const presetColors = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Ouvrir modal
  function openModal(competence?: any) {
    if (competence) {
      editingCompetence = competence;
      form = {
        code: competence.code || '',
        name: competence.name || '',
        description: competence.description || '',
        type: competence.type || 'general',
        subject_id: competence.subject_id || '',
        color: competence.color || '#3B82F6',
        order: competence.order || 0,
        is_active: competence.is_active ?? true
      };
    } else {
      editingCompetence = null;
      form = {
        code: '',
        name: '',
        description: '',
        type: 'general',
        subject_id: '',
        color: presetColors[Math.floor(Math.random() * presetColors.length)],
        order: 0,
        is_active: true
      };
    }
    showModal = true;
  }

  // Sauvegarder
  async function save() {
    if (!form.code.trim() || !form.name.trim()) {
      alert('Le code et le nom sont requis');
      return;
    }
    
    if (form.type === 'subject' && !form.subject_id) {
      alert('Veuillez sélectionner une matière');
      return;
    }
    
    saving = true;

    try {
      const response = await fetch('/api/admin/competences', {
        method: editingCompetence ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCompetence?.id,
          ...form,
          subject_id: form.type === 'subject' ? form.subject_id : null
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
      console.error('Erreur sauvegarde compétence:', error);
    } finally {
      saving = false;
    }
  }

  // Supprimer
  async function deleteCompetence(competence: any) {
    if (!confirm(`Supprimer la compétence "${competence.name}" ?`)) return;
    deleting = competence.id;

    try {
      const response = await fetch(`/api/admin/competences?id=${encodeURIComponent(competence.id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur suppression compétence:', error);
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
  <title>Compétences - Admin Kweez</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Compétences</h1>
      <p class="text-gray-400 mt-1">Gérez les compétences générales et par matière</p>
    </div>
    <Button onclick={() => openModal()} class="flex items-center gap-2">
      <Plus class="w-4 h-4" />
      Nouvelle compétence
    </Button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">🎯</div>
      <div class="text-2xl font-bold text-white">{stats.total}</div>
      <div class="text-sm text-gray-400">Total compétences</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">⭐</div>
      <div class="text-2xl font-bold text-purple-400">{stats.general}</div>
      <div class="text-sm text-gray-400">Générales</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📚</div>
      <div class="text-2xl font-bold text-blue-400">{stats.bySubject}</div>
      <div class="text-sm text-gray-400">Par matière</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">❓</div>
      <div class="text-2xl font-bold text-green-400">{stats.withQuestions}</div>
      <div class="text-sm text-gray-400">Avec questions</div>
    </div>
  </div>

  <!-- Filtres -->
  <div class="flex flex-wrap gap-4 mb-6">
    <!-- Filtre par type -->
    <div class="flex gap-2">
      <button
        onclick={() => filterType = 'all'}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filterType === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}"
      >
        Toutes
      </button>
      <button
        onclick={() => filterType = 'general'}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filterType === 'general' ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}"
      >
        ⭐ Générales
      </button>
      <button
        onclick={() => filterType = 'subject'}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filterType === 'subject' ? 'bg-blue-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}"
      >
        📚 Par matière
      </button>
    </div>
    
    <!-- Filtre par matière -->
    {#if filterType !== 'general'}
      <select
        bind:value={filterSubject}
        class="px-4 py-2 rounded-lg text-sm bg-gray-800/50 text-gray-300 border border-gray-700"
      >
        <option value="all">Toutes les matières</option>
        {#each data.subjects as subject}
          <option value={subject.code}>{subject.icon} {subject.name}</option>
        {/each}
      </select>
    {/if}
  </div>

  <!-- Liste des compétences -->
  <div class="space-y-6">
    <!-- Compétences générales -->
    {#if (filterType === 'all' || filterType === 'general') && filterSubject === 'all'}
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-4 py-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-gray-700">
          <h2 class="font-bold text-white flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-purple-400" />
            Compétences Générales
            <span class="text-xs text-gray-400 font-normal">({data.grouped.general.length})</span>
          </h2>
        </div>

        <div class="divide-y divide-gray-800">
          {#each data.grouped.general as competence}
            <div class="px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 {!competence.is_active ? 'opacity-50' : ''}">
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm border"
                  style="background-color: {competence.color}20; border-color: {competence.color}50;"
                >
                  {competence.code}
                </div>
                <div>
                  <div class="font-medium text-white">{competence.name}</div>
                  {#if competence.description}
                    <div class="text-xs text-gray-500 line-clamp-1">{competence.description}</div>
                  {/if}
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-3 text-xs text-gray-500">
                  <span class="flex items-center gap-1" title="Questions associées">
                    <FileQuestion class="w-3 h-3" />
                    {competence.questions_count}
                  </span>
                  <span class="flex items-center gap-1" title="Utilisateurs">
                    <Users class="w-3 h-3" />
                    {competence.users_count}
                  </span>
                </div>

                <div class="flex items-center gap-1">
                  <button 
                    onclick={() => openModal(competence)}
                    class="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil class="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    onclick={() => deleteCompetence(competence)}
                    disabled={deleting === competence.id}
                    class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 class="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <div class="p-8 text-center text-gray-500">
              Aucune compétence générale
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Compétences par matière -->
    {#if filterType === 'all' || filterType === 'subject'}
      {#each Object.entries(data.grouped.bySubject) as [subjectCode, competences]}
        {#if filterSubject === 'all' || filterSubject === subjectCode}
          {@const subject = data.subjects.find(s => s.code === subjectCode)}
          <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            <div class="px-4 py-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-b border-gray-700">
              <h2 class="font-bold text-white flex items-center gap-2">
                <span class="text-xl">{subject?.icon || '📖'}</span>
                {subject?.name || subjectCode}
                <span class="text-xs text-gray-400 font-normal">({competences.length})</span>
              </h2>
            </div>

            <div class="divide-y divide-gray-800">
              {#each competences as competence}
                <div class="px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 {!competence.is_active ? 'opacity-50' : ''}">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm border"
                      style="background-color: {competence.color}20; border-color: {competence.color}50;"
                    >
                      {competence.code}
                    </div>
                    <div>
                      <div class="font-medium text-white">{competence.name}</div>
                      {#if competence.description}
                        <div class="text-xs text-gray-500 line-clamp-1">{competence.description}</div>
                      {/if}
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-3 text-xs text-gray-500">
                      <span class="flex items-center gap-1" title="Questions associées">
                        <FileQuestion class="w-3 h-3" />
                        {competence.questions_count}
                      </span>
                      <span class="flex items-center gap-1" title="Utilisateurs">
                        <Users class="w-3 h-3" />
                        {competence.users_count}
                      </span>
                    </div>

                    <div class="flex items-center gap-1">
                      <button 
                        onclick={() => openModal(competence)}
                        class="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil class="w-4 h-4 text-gray-400" />
                      </button>
                      <button 
                        onclick={() => deleteCompetence(competence)}
                        disabled={deleting === competence.id}
                        class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 class="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        {#if filterType === 'subject'}
          <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-12 text-center text-gray-400">
            <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p class="text-lg font-medium text-gray-300 mb-2">Aucune compétence par matière</p>
            <p class="text-sm">Créez des compétences liées aux matières.</p>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<!-- Modal Compétence -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingCompetence ? 'Modifier la compétence' : 'Nouvelle compétence'}</Dialog.Title>
      <Dialog.Description>
        {editingCompetence ? 'Modifiez les informations de la compétence.' : 'Créez une nouvelle compétence.'}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="comp-code">Code</label>
          <Input 
            id="comp-code" 
            bind:value={form.code} 
            placeholder="Ex: C1, MA1..." 
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="comp-order">Ordre</label>
          <Input 
            id="comp-order" 
            type="number"
            bind:value={form.order} 
            min="0"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="comp-name">Nom</label>
        <Input 
          id="comp-name" 
          bind:value={form.name} 
          placeholder="Ex: Restituer une connaissance" 
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="comp-description">Description</label>
        <textarea 
          id="comp-description" 
          bind:value={form.description} 
          placeholder="Description de la compétence..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="comp-type">Type</label>
        <select 
          id="comp-type" 
          bind:value={form.type}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
        >
          <option value="general">⭐ Compétence générale</option>
          <option value="subject">📚 Compétence par matière</option>
        </select>
      </div>

      {#if form.type === 'subject'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="comp-subject">Matière</label>
          <select 
            id="comp-subject" 
            bind:value={form.subject_id}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          >
            <option value="">Sélectionner une matière</option>
            {#each data.subjects as subject}
              <option value={subject.id}>{subject.icon} {subject.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
        <div class="flex items-center gap-2 flex-wrap">
          {#each presetColors as color}
            <button
              type="button"
              onclick={() => form.color = color}
              class="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110"
              style="background-color: {color}; border-color: {form.color === color ? 'white' : 'transparent'}"
            ></button>
          {/each}
          <input 
            type="color" 
            bind:value={form.color}
            class="w-8 h-8 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="comp-active" bind:checked={form.is_active} class="w-4 h-4 rounded" />
        <label class="cursor-pointer text-sm font-medium text-gray-700" for="comp-active">Compétence active</label>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => showModal = false}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : (editingCompetence ? 'Modifier' : 'Créer')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
