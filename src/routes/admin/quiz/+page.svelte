<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Search, X, Loader2 } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";

  let { data }: { data: PageData } = $props();

  let quizzes = $derived(data.quizzes || []);
  let themes = $derived(data.themes || []);
  let search = $state('');
  
  // Grouper les thèmes par matière pour l'affichage
  let themesByMatiere = $derived.by(() => {
    const grouped: Record<string, { matiere_name: string; themes: typeof themes }> = {};
    for (const theme of themes) {
      const key = theme.matiere_id || 'none';
      if (!grouped[key]) {
        grouped[key] = { matiere_name: theme.matiere_name, themes: [] };
      }
      grouped[key].themes.push(theme);
    }
    return Object.values(grouped);
  });
  
  // Modal state
  let showModal = $state(false);
  let formTitle = $state('');
  let formSlug = $state('');
  let formDescription = $state('');
  let formThemeIds = $state<string[]>([]);
  let formMaxQuestions = $state(10);
  let formIsActive = $state(true);
  let isSaving = $state(false);
  let modalError = $state('');
  
  // Matières déduites des thèmes sélectionnés
  let selectedMatieres = $derived.by(() => {
    const matiereNames = new Set<string>();
    for (const themeId of formThemeIds) {
      const theme = themes.find(t => t.id === themeId);
      if (theme?.matiere_name) matiereNames.add(theme.matiere_name);
    }
    return Array.from(matiereNames);
  });

  let filteredQuizzes = $derived.by(() => {
    if (!search) return quizzes;
    const s = search.toLowerCase();
    return quizzes.filter(quiz =>
      quiz.title?.toLowerCase().includes(s) ||
      quiz.subject?.toLowerCase().includes(s)
    );
  });

  function editQuiz(quiz: any) {
    const cleanId = quiz.id?.includes(':') ? quiz.id.split(':')[1] : quiz.id;
    goto(`/admin/questions?quiz=${cleanId}`);
  }

  async function deleteQuiz(quiz: any, event: Event) {
    event.stopPropagation();
    if (!confirm(`Supprimer le quiz "${quiz.title}" et toutes ses questions ?`)) return;
    
    try {
      const cleanId = quiz.id?.includes(':') ? quiz.id.split(':')[1] : quiz.id;
      const response = await fetch(`/api/admin/quiz/${cleanId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function openCreateModal() {
    formTitle = '';
    formSlug = '';
    formDescription = '';
    formThemeIds = [];
    formMaxQuestions = 10;
    formIsActive = true;
    modalError = '';
    showModal = true;
  }
  
  function toggleTheme(themeId: string) {
    if (formThemeIds.includes(themeId)) {
      formThemeIds = formThemeIds.filter(id => id !== themeId);
    } else {
      formThemeIds = [...formThemeIds, themeId];
    }
  }
  
  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Auto-générer le slug depuis le titre
  $effect(() => {
    if (formTitle && !formSlug) {
      formSlug = generateSlug(formTitle);
    }
  });

  async function handleSave() {
    if (!formTitle.trim()) {
      modalError = 'Le titre est requis';
      return;
    }
    if (formThemeIds.length === 0) {
      modalError = 'Sélectionnez au moins un thème';
      return;
    }

    isSaving = true;
    modalError = '';

    try {
      const payload = {
        title: formTitle.trim(),
        slug: formSlug || generateSlug(formTitle),
        description: formDescription.trim() || null,
        theme_ids: formThemeIds,
        maxQuestions: formMaxQuestions,
        isActive: formIsActive
      };

      const res = await fetch('/api/admin/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        modalError = result.error || result.message || 'Erreur lors de la création';
        return;
      }

      showModal = false;
      window.location.reload();
    } catch (e) {
      modalError = 'Erreur de connexion au serveur';
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Quiz - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quiz</h1>
        <p class="text-gray-600 mt-1">Gérez tous les quiz de la plateforme</p>
      </div>
      <Button onclick={openCreateModal} class="bg-purple-600 hover:bg-purple-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau quiz
      </Button>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-6">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher un quiz..."
        bind:value={search}
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Titre</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matière</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Niveau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Questions</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredQuizzes as quiz (quiz.id)}
          <tr 
            class="border-b border-gray-200 hover:bg-purple-50 transition-colors cursor-pointer"
            onclick={() => editQuiz(quiz)}
          >
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{quiz.title}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{quiz.subject}</td>
            <td class="px-6 py-4 text-sm">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {quiz.difficulty_level}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{quiz.question_count || 0}</td>
            <td class="px-6 py-4 text-sm">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                quiz.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {quiz.is_active ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button 
                  class="p-1.5 hover:bg-purple-100 rounded-lg transition-colors" 
                  title="Éditer"
                  onclick={(e) => { e.stopPropagation(); editQuiz(quiz); }}
                >
                  <Edit2 class="w-4 h-4 text-purple-600" />
                </button>
                <button 
                  class="p-1.5 hover:bg-red-100 rounded-lg transition-colors" 
                  title="Supprimer"
                  onclick={(e) => deleteQuiz(quiz, e)}
                >
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if filteredQuizzes.length === 0}
      <div class="px-6 py-12 text-center">
        <p class="text-gray-500 text-sm">Aucun quiz trouvé</p>
      </div>
    {/if}
  </div>
</div>

<!-- Modal de création -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Nouveau quiz</Dialog.Title>
      <Dialog.Description>
        Créez un nouveau quiz en renseignant les informations ci-dessous.
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="space-y-4 py-4">
      {#if modalError}
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {modalError}
        </div>
      {/if}
      
      <div class="space-y-2">
        <label for="title" class="text-sm font-medium text-gray-700">Titre *</label>
        <Input 
          id="title"
          bind:value={formTitle} 
          placeholder="Ex: Quiz Histoire de France"
        />
      </div>
      
      <div class="space-y-2">
        <label for="slug" class="text-sm font-medium text-gray-700">Slug (URL)</label>
        <Input 
          id="slug"
          bind:value={formSlug} 
          placeholder="quiz-histoire-france"
        />
        <p class="text-xs text-gray-500">Laissez vide pour générer automatiquement</p>
      </div>
      
      <div class="space-y-2">
        <label for="description" class="text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          bind:value={formDescription}
          placeholder="Description optionnelle du quiz..."
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        ></textarea>
      </div>
      
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">Thèmes * <span class="font-normal text-gray-500">({formThemeIds.length} sélectionné{formThemeIds.length > 1 ? 's' : ''})</span></label>
        <div class="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-3">
          {#each themesByMatiere as group}
            <div>
              <div class="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
                {group.matiere_name}
              </div>
              <div class="flex flex-wrap gap-1">
                {#each group.themes as theme}
                  <button
                    type="button"
                    onclick={() => toggleTheme(theme.id)}
                    class="px-2 py-1 text-xs rounded-full border transition-colors {formThemeIds.includes(theme.id) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'}"
                  >
                    {theme.name}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        {#if selectedMatieres.length > 0}
          <p class="text-xs text-gray-500">
            Matières concernées : <span class="font-medium">{selectedMatieres.join(', ')}</span>
          </p>
        {/if}
      </div>
      
      <div class="space-y-2">
        <label for="maxQuestions" class="text-sm font-medium text-gray-700">Nombre de questions max</label>
        <Input 
          id="maxQuestions"
          type="number"
          bind:value={formMaxQuestions} 
          min="1"
          max="100"
        />
        <p class="text-xs text-gray-500">Limite le nombre de questions par session de quiz</p>
      </div>
      
      <div class="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isActive"
          bind:checked={formIsActive}
          class="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <label for="isActive" class="text-sm text-gray-700">Quiz actif</label>
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showModal = false}>
        Annuler
      </Button>
      <Button 
        onclick={handleSave}
        disabled={isSaving}
        class="bg-purple-600 hover:bg-purple-700"
      >
        {#if isSaving}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          Création...
        {:else}
          Créer le quiz
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
