<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    Search, Plus, Pencil, Trash2, Filter, ChevronLeft, ChevronRight,
    Check, X, Image, FileQuestion, ListChecks, ToggleLeft, Layers, 
    ArrowUpDown, MessageSquare, FileText
  } from 'lucide-svelte';
  import AIQuestionGenerator from '$lib/components/admin/AIQuestionGenerator.svelte';
  
  interface Props {
    data: {
      questions: any[];
      total: number;
      page: number;
      pageSize: number;
      matieres: any[];
      themes: any[];
      classes: any[];
      filters: {
        search: string;
        type: string;
        difficulty: string;
        matiere: string;
        theme: string;
        active: string;
        sort: string;
        dir: string;
      };
    };
  }
  
  let { data }: Props = $props();
  
  // État local pour les filtres (initialisés depuis data)
  let searchInput = $state('');
  let selectedType = $state('');
  let selectedDifficulty = $state('');
  let selectedMatiere = $state('');
  let selectedTheme = $state('');
  let selectedActive = $state('');
  let showFilters = $state(false);
  
  // Initialiser les filtres depuis data
  $effect(() => {
    searchInput = data.filters.search || '';
    selectedType = data.filters.type || '';
    selectedDifficulty = data.filters.difficulty || '';
    selectedMatiere = data.filters.matiere || '';
    selectedTheme = data.filters.theme || '';
    selectedActive = data.filters.active || '';
  });
  
  // Modals
  let showDeleteModal = $state(false);
  let questionToDelete = $state<any>(null);
  let deleting = $state(false);
  
  let showEditModal = $state(false);
  let editingQuestion = $state<any>(null);
  let saving = $state(false);
  
  // Types de questions disponibles
  const questionTypes = [
    { value: 'qcm', label: 'QCM classique', icon: FileQuestion },
    { value: 'qcm_image', label: 'QCM avec images', icon: Image },
    { value: 'qcm_multiple', label: 'QCM multiple', icon: ListChecks },
    { value: 'true_false', label: 'Vrai/Faux', icon: ToggleLeft },
    { value: 'fill_blank', label: 'Texte à trous', icon: FileText },
    { value: 'matching', label: 'Association', icon: Layers },
    { value: 'ordering', label: 'Classement', icon: ArrowUpDown },
    { value: 'open_short', label: 'Réponse courte', icon: MessageSquare },
    { value: 'open_long', label: 'Réponse longue', icon: MessageSquare },
  ];
  
  const difficulties = [
    { value: 'easy', label: 'Facile', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
    { value: 'medium', label: 'Moyen', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
    { value: 'hard', label: 'Difficile', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  ];
  
  // Pagination
  let totalPages = $derived(Math.ceil(data.total / data.pageSize));
  
  // Thèmes filtrés par matière
  let filteredThemes = $derived(
    selectedMatiere 
      ? data.themes.filter((t: any) => t.matiere_id?.toString().includes(selectedMatiere))
      : data.themes
  );
  
  function applyFilters() {
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    if (selectedType) params.set('type', selectedType);
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
    if (selectedMatiere) params.set('matiere', selectedMatiere);
    if (selectedTheme) params.set('theme', selectedTheme);
    if (selectedActive) params.set('active', selectedActive);
    params.set('page', '1');
    goto(`/admin/questions?${params.toString()}`);
  }
  
  function clearFilters() {
    searchInput = '';
    selectedType = '';
    selectedDifficulty = '';
    selectedMatiere = '';
    selectedTheme = '';
    selectedActive = '';
    goto('/admin/questions');
  }
  
  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', pageNum.toString());
    goto(`/admin/questions?${params.toString()}`);
  }
  
  function getTypeInfo(type: string) {
    return questionTypes.find(t => t.value === type) || questionTypes[0];
  }
  
  function getDifficultyInfo(diff: string) {
    return difficulties.find(d => d.value === diff) || difficulties[1];
  }
  
  // CRUD Actions
  function openEditModal(question?: any) {
    if (question) {
      editingQuestion = { ...question };
    } else {
      // Nouvelle question
      editingQuestion = {
        question: '',
        questionType: 'qcm',
        difficulty: 'medium',
        isActive: true,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        matiere_id: '',
        theme_ids: []
      };
    }
    showEditModal = true;
  }
  
  function closeEditModal() {
    showEditModal = false;
    editingQuestion = null;
  }
  
  async function saveQuestion() {
    if (!editingQuestion) return;
    saving = true;
    
    try {
      const isNew = !editingQuestion.id;
      const url = isNew ? '/api/admin/questions' : `/api/admin/questions/${editingQuestion.id.split(':')[1] || editingQuestion.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuestion)
      });
      
      if (res.ok) {
        closeEditModal();
        // Recharger la page
        goto($page.url.pathname + $page.url.search, { invalidateAll: true });
      } else {
        const err = await res.json();
        alert(err.message || 'Erreur lors de la sauvegarde');
      }
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
      alert('Erreur de connexion');
    } finally {
      saving = false;
    }
  }
  
  function openDeleteModal(question: any) {
    questionToDelete = question;
    showDeleteModal = true;
  }
  
  async function confirmDelete() {
    if (!questionToDelete) return;
    deleting = true;
    
    try {
      const id = questionToDelete.id.split(':')[1] || questionToDelete.id;
      const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        showDeleteModal = false;
        questionToDelete = null;
        goto($page.url.pathname + $page.url.search, { invalidateAll: true });
      } else {
        const err = await res.json();
        alert(err.message || 'Erreur lors de la suppression');
      }
    } catch (e) {
      console.error('Erreur suppression:', e);
      alert('Erreur de connexion');
    } finally {
      deleting = false;
    }
  }
  
  // Helpers pour l'édition
  function addOption() {
    if (editingQuestion) {
      editingQuestion.options = [...editingQuestion.options, ''];
    }
  }
  
  function removeOption(index: number) {
    if (editingQuestion && editingQuestion.options.length > 2) {
      editingQuestion.options = editingQuestion.options.filter((_: any, i: number) => i !== index);
      if (editingQuestion.correctAnswer >= editingQuestion.options.length) {
        editingQuestion.correctAnswer = 0;
      }
    }
  }

  // Handler pour les questions générées par l'IA
  async function handleAIQuestion(aiQuestion: any) {
    try {
      // Convertir le format IA vers le format de la base de données
      const questionData: any = {
        question: aiQuestion.question,
        questionType: aiQuestion.questionType,
        difficulty: aiQuestion.difficulty === 1 ? 'easy' : aiQuestion.difficulty === 2 ? 'medium' : 'hard',
        isActive: aiQuestion.isActive ?? true,
        explanation: aiQuestion.explanation,
        matiere_id: aiQuestion.matiere_id,
        theme_ids: aiQuestion.theme_ids || [],
        classe_id: aiQuestion.classe_id,
        difficulty_level: aiQuestion.difficulty_level
      };

      // Selon le type de question, ajouter les champs spécifiques
      switch (aiQuestion.questionType) {
        case 'qcm':
          questionData.options = aiQuestion.options || [];
          questionData.correctAnswer = aiQuestion.correctAnswer;
          break;
        case 'qcm_multiple':
          questionData.options = aiQuestion.options || [];
          questionData.correctAnswers = aiQuestion.correctAnswers || [];
          break;
        case 'true_false':
          questionData.correctAnswer = aiQuestion.correctAnswer;
          break;
        case 'fill_blank':
          questionData.blanks = aiQuestion.blanks || [];
          break;
        case 'matching':
          questionData.leftItems = aiQuestion.leftItems || [];
          questionData.rightItems = aiQuestion.rightItems || [];
          questionData.correctMatches = aiQuestion.correctMatches || {};
          break;
        case 'ordering':
          questionData.items = aiQuestion.items || [];
          questionData.correctOrder = aiQuestion.correctOrder || [];
          break;
      }

      // Sauvegarder via l'API
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });

      if (res.ok) {
        // Recharger la page pour voir les nouvelles questions
        goto($page.url.pathname + $page.url.search, { invalidateAll: true });
      } else {
        const err = await res.json();
        console.error('Erreur sauvegarde IA:', err);
        alert(err.message || 'Erreur lors de la sauvegarde de la question générée');
      }
    } catch (e) {
      console.error('Erreur sauvegarde question IA:', e);
      alert('Erreur de connexion lors de la sauvegarde');
    }
  }
</script>

<svelte:head>
  <title>Gestion des Questions - Admin</title>
</svelte:head>

<div class="flex-1 p-6 overflow-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Gestion des Questions</h1>
      <p class="text-gray-400">{data.total} question{data.total > 1 ? 's' : ''} au total</p>
    </div>
    <div class="flex items-center gap-3">
      <!-- Générateur IA -->
      <AIQuestionGenerator 
        matieres={data.matieres.map(m => ({ id: m.id, name: m.name, slug: m.slug || '' }))}
        themes={data.themes.map(t => ({ id: t.id, name: t.name, matiere_id: t.matiere_ids?.[0] }))}
        classes={data.classes}
        onSaveQuestion={handleAIQuestion}
      />
      
      <!-- Bouton Nouvelle question manuelle -->
      <button
        onclick={() => openEditModal()}
        class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Plus class="w-5 h-5" />
        Nouvelle question
      </button>
    </div>
  </div>
  
  <!-- Filtres -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 p-4 mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Recherche -->
      <div class="flex-1 min-w-[200px]">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            bind:value={searchInput}
            onkeydown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Rechercher une question..."
            class="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
      
      <!-- Toggle filtres avancés -->
      <button
        onclick={() => showFilters = !showFilters}
        class="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800/50"
      >
        <Filter class="w-4 h-4" />
        Filtres
        {#if selectedType || selectedDifficulty || selectedMatiere || selectedTheme || selectedActive}
          <span class="w-2 h-2 rounded-full bg-purple-500"></span>
        {/if}
      </button>
      
      <button
        onclick={applyFilters}
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Rechercher
      </button>
    </div>
    
    <!-- Filtres avancés -->
    {#if showFilters}
      <div class="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label for="filter-type" class="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <select id="filter-type" bind:value={selectedType} class="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="">Tous les types</option>
            {#each questionTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="filter-difficulty" class="block text-sm font-medium text-gray-300 mb-1">Difficulté</label>
          <select id="filter-difficulty" bind:value={selectedDifficulty} class="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="">Toutes</option>
            {#each difficulties as diff}
              <option value={diff.value}>{diff.label}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="filter-matiere" class="block text-sm font-medium text-gray-300 mb-1">Matière</label>
          <select id="filter-matiere" bind:value={selectedMatiere} onchange={() => selectedTheme = ''} class="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="">Toutes</option>
            {#each data.matieres as matiere}
              <option value={matiere.id.split(':')[1] || matiere.id}>{matiere.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="filter-theme" class="block text-sm font-medium text-gray-300 mb-1">Thème</label>
          <select id="filter-theme" bind:value={selectedTheme} class="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="">Tous</option>
            {#each filteredThemes as theme}
              <option value={theme.id.split(':')[1] || theme.id}>{theme.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="filter-status" class="block text-sm font-medium text-gray-300 mb-1">Statut</label>
          <select id="filter-status" bind:value={selectedActive} class="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="">Tous</option>
            <option value="true">Actives</option>
            <option value="false">Inactives</option>
          </select>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <button onclick={clearFilters} class="text-sm text-gray-400 hover:text-gray-200">
          Réinitialiser les filtres
        </button>
      </div>
    {/if}
  </div>
  
  <!-- Liste des questions -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-800/50 border-b border-gray-700">
        <tr>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Question</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300 w-32">Type</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300 w-24">Difficulté</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300 w-32">Matière</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-300 w-20">Statut</th>
          <th class="px-4 py-3 text-right text-sm font-semibold text-gray-300 w-24">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-800">
        {#each data.questions as question}
          {@const typeInfo = getTypeInfo(question.questionType)}
          {@const diffInfo = getDifficultyInfo(question.difficulty)}
          <tr class="hover:bg-gray-800/50">
            <td class="px-4 py-3">
              <div class="flex items-start gap-3">
                {#if question.imageUrl}
                  <img src={question.imageUrl} alt="" class="w-12 h-12 object-cover rounded" />
                {/if}
                <div class="min-w-0">
                  <p class="font-medium text-white line-clamp-2">{question.question}</p>
                  {#if question.explanation}
                    <p class="text-xs text-gray-500 mt-1 line-clamp-1">{question.explanation}</p>
                  {/if}
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              {#if typeInfo.icon}
                {@const Icon = typeInfo.icon}
                <div class="flex items-center gap-2">
                  <Icon class="w-4 h-4 text-gray-400" />
                  <span class="text-sm text-gray-300">{typeInfo.label}</span>
                </div>
              {:else}
                <span class="text-sm text-gray-300">{typeInfo.label}</span>
              {/if}
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium {diffInfo.color}">
                {diffInfo.label}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-gray-400">{question.matiere_name || '-'}</span>
            </td>
            <td class="px-4 py-3 text-center">
              {#if question.isActive}
                <Check class="w-5 h-5 text-green-400 mx-auto" />
              {:else}
                <X class="w-5 h-5 text-red-400 mx-auto" />
              {/if}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button
                  onclick={() => openEditModal(question)}
                  class="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/20 rounded"
                  title="Modifier"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  onclick={() => openDeleteModal(question)}
                  class="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded"
                  title="Supprimer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="px-4 py-12 text-center text-gray-400">
              Aucune question trouvée
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex items-center justify-between mt-4">
      <p class="text-sm text-gray-400">
        Page {data.page} sur {totalPages}
      </p>
      <div class="flex items-center gap-2">
        <button
          onclick={() => goToPage(data.page - 1)}
          disabled={data.page <= 1}
          class="p-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        
        {#each Array(Math.min(5, totalPages)) as _, i}
          {@const pageNum = Math.max(1, Math.min(data.page - 2, totalPages - 4)) + i}
          {#if pageNum <= totalPages}
            <button
              onclick={() => goToPage(pageNum)}
              class="w-10 h-10 rounded-lg {pageNum === data.page ? 'bg-purple-600 text-white' : 'border border-gray-700 text-gray-300 hover:bg-gray-800/50'}"
            >
              {pageNum}
            </button>
          {/if}
        {/each}
        
        <button
          onclick={() => goToPage(data.page + 1)}
          disabled={data.page >= totalPages}
          class="p-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Modal de suppression -->
{#if showDeleteModal && questionToDelete}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
      <p class="text-gray-600 mb-6">
        Êtes-vous sûr de vouloir supprimer cette question ?<br>
        <span class="font-medium">"{questionToDelete.question.substring(0, 50)}..."</span>
      </p>
      <div class="flex gap-3 justify-end">
        <button
          onclick={() => { showDeleteModal = false; questionToDelete = null; }}
          class="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onclick={confirmDelete}
          disabled={deleting}
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal d'édition -->
{#if showEditModal && editingQuestion}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
    <div class="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full mx-4 my-auto">
      <h3 class="text-xl font-bold text-gray-800 mb-6">
        {editingQuestion.id ? 'Modifier la question' : 'Nouvelle question'}
      </h3>
      
      <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <!-- Type et difficulté -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-question-type" class="block text-sm font-medium text-gray-700 mb-1">Type de question</label>
            <select id="edit-question-type" bind:value={editingQuestion.questionType} class="w-full border rounded-lg px-3 py-2">
              {#each questionTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="edit-difficulty" class="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
            <select id="edit-difficulty" bind:value={editingQuestion.difficulty} class="w-full border rounded-lg px-3 py-2">
              {#each difficulties as diff}
                <option value={diff.value}>{diff.label}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <!-- Question -->
        <div>
          <label for="edit-question-text" class="block text-sm font-medium text-gray-700 mb-1">Question *</label>
          <textarea
            id="edit-question-text"
            bind:value={editingQuestion.question}
            rows="3"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="Entrez votre question..."
          ></textarea>
        </div>
        
        <!-- Options pour QCM -->
        {#if ['qcm', 'qcm_image', 'qcm_multiple'].includes(editingQuestion.questionType)}
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Options</label>
            <div class="space-y-2">
              {#each editingQuestion.options as option, i}
                <div class="flex items-center gap-2">
                  {#if editingQuestion.questionType === 'qcm_multiple'}
                    <input
                      type="checkbox"
                      checked={(editingQuestion.correctAnswers || []).includes(i)}
                      onchange={(e) => {
                        const checked = e.currentTarget.checked;
                        if (!editingQuestion.correctAnswers) editingQuestion.correctAnswers = [];
                        if (checked) {
                          editingQuestion.correctAnswers = [...editingQuestion.correctAnswers, i];
                        } else {
                          editingQuestion.correctAnswers = editingQuestion.correctAnswers.filter((x: number) => x !== i);
                        }
                      }}
                      class="w-5 h-5"
                    />
                  {:else}
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={editingQuestion.correctAnswer === i}
                      onchange={() => editingQuestion.correctAnswer = i}
                      class="w-5 h-5"
                    />
                  {/if}
                  <input
                    type="text"
                    bind:value={editingQuestion.options[i]}
                    class="flex-1 border rounded-lg px-3 py-2"
                    placeholder="Option {i + 1}"
                  />
                  {#if editingQuestion.options.length > 2}
                    <button onclick={() => removeOption(i)} class="p-2 text-red-500 hover:bg-red-50 rounded">
                      <X class="w-4 h-4" />
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
            <button onclick={addOption} class="mt-2 text-sm text-purple-600 hover:text-purple-700">
              + Ajouter une option
            </button>
          </div>
        {/if}
        
        <!-- Vrai/Faux -->
        {#if editingQuestion.questionType === 'true_false'}
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Bonne réponse</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" name="tfAnswer" bind:group={editingQuestion.correctAnswer} value={true} />
                Vrai
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="tfAnswer" bind:group={editingQuestion.correctAnswer} value={false} />
                Faux
              </label>
            </div>
          </div>
        {/if}
        
        <!-- Texte à trous -->
        {#if editingQuestion.questionType === 'fill_blank'}
          <div>
            <label for="edit-text-blanks" class="block text-sm font-medium text-gray-700 mb-1">
              Texte avec trous (utilisez [___] pour marquer les trous)
            </label>
            <textarea
              id="edit-text-blanks"
              bind:value={editingQuestion.textWithBlanks}
              rows="3"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="La capitale de la [___] est [___]."
            ></textarea>
          </div>
          <div>
            <label for="edit-correct-answers" class="block text-sm font-medium text-gray-700 mb-1">
              Réponses correctes (séparées par des virgules, dans l'ordre)
            </label>
            <input
              id="edit-correct-answers"
              type="text"
              value={(editingQuestion.correctAnswers || []).join(', ')}
              oninput={(e) => editingQuestion.correctAnswers = e.currentTarget.value.split(',').map(s => s.trim())}
              class="w-full border rounded-lg px-3 py-2"
              placeholder="France, Paris"
            />
          </div>
        {/if}
        
        <!-- Explication -->
        <div>
          <label for="edit-explanation" class="block text-sm font-medium text-gray-700 mb-1">Explication (optionnelle)</label>
          <textarea
            id="edit-explanation"
            bind:value={editingQuestion.explanation}
            rows="2"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="Explication affichée après la réponse..."
          ></textarea>
        </div>
        
        <!-- Matière et thèmes -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-matiere" class="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <select id="edit-matiere" bind:value={editingQuestion.matiere_id} class="w-full border rounded-lg px-3 py-2">
              <option value="">-- Sélectionner --</option>
              {#each data.matieres as matiere}
                <option value={matiere.id}>{matiere.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="edit-active" class="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <select id="edit-active" bind:value={editingQuestion.isActive} class="w-full border rounded-lg px-3 py-2">
              <option value={true}>Oui</option>
              <option value={false}>Non</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3 justify-end mt-6 pt-4 border-t">
        <button
          onclick={closeEditModal}
          class="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onclick={saveQuestion}
          disabled={saving || !editingQuestion.question}
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  </div>
{/if}
