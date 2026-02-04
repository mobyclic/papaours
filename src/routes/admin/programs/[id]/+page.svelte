<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import { 
    ArrowLeft, Plus, Pencil, Trash2, GripVertical, 
    BookOpen, FileQuestion, ChevronUp, ChevronDown,
    Save, X
  } from 'lucide-svelte';
  import { goto, invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  // États
  let showModal = $state(false);
  let editingChapter = $state<any>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);
  let reordering = $state(false);

  // Formulaire chapitre
  let form = $state({
    name: '',
    slug: '',
    description: '',
    is_active: true
  });

  // Génère un slug à partir du nom
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Ouvrir modal
  function openModal(chapter?: any) {
    if (chapter) {
      editingChapter = chapter;
      form = {
        name: chapter.name || '',
        slug: chapter.slug || '',
        description: chapter.description || '',
        is_active: chapter.is_active ?? true
      };
    } else {
      editingChapter = null;
      form = {
        name: '',
        slug: '',
        description: '',
        is_active: true
      };
    }
    showModal = true;
  }

  // Sauvegarder chapitre
  async function saveChapter() {
    if (!form.name.trim()) {
      alert('Le nom est requis');
      return;
    }
    saving = true;

    try {
      const slug = form.slug || generateSlug(form.name);
      const order = editingChapter?.order ?? (data.chapters.length + 1);

      const response = await fetch('/api/admin/chapters', {
        method: editingChapter ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingChapter?.id,
          program_id: data.program.id,
          name: form.name,
          slug,
          description: form.description || null,
          order,
          is_active: form.is_active
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
      console.error('Erreur sauvegarde chapitre:', error);
    } finally {
      saving = false;
    }
  }

  // Supprimer chapitre
  async function deleteChapter(chapter: any) {
    if (!confirm(`Supprimer le chapitre "${chapter.name}" ? Les quiz et questions associés seront dissociés.`)) return;
    deleting = chapter.id;

    try {
      const response = await fetch(`/api/admin/chapters?id=${encodeURIComponent(chapter.id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur suppression chapitre:', error);
    } finally {
      deleting = null;
    }
  }

  // Déplacer un chapitre
  async function moveChapter(chapter: any, direction: 'up' | 'down') {
    const currentIndex = data.chapters.findIndex(c => c.id === chapter.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= data.chapters.length) return;
    
    reordering = true;
    
    try {
      const otherChapter = data.chapters[newIndex];
      
      // Échanger les ordres
      await fetch('/api/admin/chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chapter.id,
          order: otherChapter.order
        })
      });
      
      await fetch('/api/admin/chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: otherChapter.id,
          order: chapter.order
        })
      });
      
      await invalidateAll();
    } catch (error) {
      console.error('Erreur réorganisation:', error);
    } finally {
      reordering = false;
    }
  }
</script>

<svelte:head>
  <title>{data.program.subject_name} - {data.program.grade_name} - Kweez</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Breadcrumb -->
  <div class="flex items-center gap-2 text-sm text-gray-400 mb-6">
    <button onclick={() => goto('/admin/programs')} class="hover:text-white transition-colors flex items-center gap-1">
      <ArrowLeft class="w-4 h-4" />
      Programmes
    </button>
    <span>/</span>
    <span class="text-gray-300">{data.program.cycle_name}</span>
    <span>/</span>
    <span class="text-gray-300">{data.program.grade_name}</span>
    <span>/</span>
    <span class="text-white">{data.program.subject_name}</span>
  </div>

  <!-- Header -->
  <div class="flex items-start justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-3xl border border-amber-500/30">
        {data.program.subject_icon || '📚'}
      </div>
      <div>
        <h1 class="text-3xl font-bold text-white">{data.program.subject_name}</h1>
        <p class="text-gray-400 mt-1">{data.program.grade_name} - {data.program.cycle_name}</p>
        {#if data.program.description}
          <p class="text-gray-500 text-sm mt-2 max-w-xl">{data.program.description}</p>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-3">
      {#if data.program.is_active}
        <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          Actif
        </span>
      {:else}
        <span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Inactif
        </span>
      {/if}
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">📖</div>
      <div class="text-2xl font-bold text-white">{data.chapters.length}</div>
      <div class="text-sm text-gray-400">Chapitres</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">🎯</div>
      <div class="text-2xl font-bold text-blue-400">
        {data.chapters.reduce((acc, ch) => acc + (ch.quizzes_count || 0), 0)}
      </div>
      <div class="text-sm text-gray-400">Quiz</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">❓</div>
      <div class="text-2xl font-bold text-purple-400">
        {data.chapters.reduce((acc, ch) => acc + (ch.questions_count || 0), 0)}
      </div>
      <div class="text-sm text-gray-400">Questions</div>
    </div>
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
      <div class="text-2xl mb-1">✅</div>
      <div class="text-2xl font-bold text-green-400">
        {data.chapters.filter(ch => ch.is_active).length}
      </div>
      <div class="text-sm text-gray-400">Chapitres actifs</div>
    </div>
  </div>

  <!-- Section Chapitres -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-amber-400" />
          Chapitres du programme
        </h2>
        <p class="text-sm text-gray-400 mt-1">Organisez les chapitres dans l'ordre du programme officiel</p>
      </div>
      <Button onclick={() => openModal()} class="flex items-center gap-2">
        <Plus class="w-4 h-4" />
        Nouveau chapitre
      </Button>
    </div>

    {#if data.chapters.length > 0}
      <div class="divide-y divide-gray-800">
        {#each data.chapters as chapter, index}
          <div class="px-6 py-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors {!chapter.is_active ? 'opacity-50' : ''}">
            <!-- Numéro & Réorganisation -->
            <div class="flex flex-col items-center gap-1">
              <button
                onclick={() => moveChapter(chapter, 'up')}
                disabled={index === 0 || reordering}
                class="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Monter"
              >
                <ChevronUp class="w-4 h-4 text-gray-400" />
              </button>
              <div class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                {chapter.order || index + 1}
              </div>
              <button
                onclick={() => moveChapter(chapter, 'down')}
                disabled={index === data.chapters.length - 1 || reordering}
                class="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Descendre"
              >
                <ChevronDown class="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <!-- Contenu -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-white truncate">{chapter.name}</h3>
                {#if !chapter.is_active}
                  <span class="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">Inactif</span>
                {/if}
              </div>
              {#if chapter.description}
                <p class="text-sm text-gray-400 mt-1 line-clamp-2">{chapter.description}</p>
              {/if}
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {#if chapter.slug}
                  <span class="font-mono">{chapter.slug}</span>
                {/if}
                <span class="flex items-center gap-1">
                  <BookOpen class="w-3 h-3" />
                  {chapter.quizzes_count || 0} quiz
                </span>
                <span class="flex items-center gap-1">
                  <FileQuestion class="w-3 h-3" />
                  {chapter.questions_count || 0} questions
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button 
                onclick={() => openModal(chapter)}
                class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Modifier"
              >
                <Pencil class="w-4 h-4 text-gray-400" />
              </button>
              <button 
                onclick={() => deleteChapter(chapter)}
                disabled={deleting === chapter.id}
                class="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
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
        <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p class="text-lg font-medium text-gray-300 mb-2">Aucun chapitre</p>
        <p class="text-sm mb-4">Créez le premier chapitre de ce programme.</p>
        <Button onclick={() => openModal()} class="gap-2">
          <Plus class="w-4 h-4" />
          Créer un chapitre
        </Button>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Chapitre -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingChapter ? 'Modifier le chapitre' : 'Nouveau chapitre'}</Dialog.Title>
      <Dialog.Description>
        {editingChapter ? 'Modifiez les informations du chapitre.' : 'Ajoutez un nouveau chapitre au programme.'}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); saveChapter(); }} class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="ch-name">Nom du chapitre</label>
        <Input 
          id="ch-name" 
          bind:value={form.name} 
          placeholder="Ex: Le monstre, aux limites de l'humain" 
          required
          oninput={() => {
            if (!editingChapter && !form.slug) {
              form.slug = generateSlug(form.name);
            }
          }}
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="ch-slug">Slug (URL)</label>
        <Input 
          id="ch-slug" 
          bind:value={form.slug} 
          placeholder="le-monstre-aux-limites-de-lhumain" 
        />
        <p class="text-xs text-gray-500 mt-1">Généré automatiquement si vide</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="ch-description">Description (optionnel)</label>
        <textarea 
          id="ch-description" 
          bind:value={form.description} 
          placeholder="Description du chapitre, compétences visées..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[100px]"
        ></textarea>
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="ch-active" bind:checked={form.is_active} class="w-4 h-4 rounded" />
        <label class="cursor-pointer text-sm font-medium text-gray-700" for="ch-active">Chapitre actif</label>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => showModal = false}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : (editingChapter ? 'Modifier' : 'Créer')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
