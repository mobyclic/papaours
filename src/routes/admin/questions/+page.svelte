<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Edit2, Trash2, Plus, Search, ChevronUp, ChevronDown, Eye } from 'lucide-svelte';
  
  interface Question {
    id: string;
    question: string;
    family: string;
    difficulty: string;
    isActive: boolean;
    imageUrl?: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    imageCaption?: string;
    order: number;
    quizId?: string;
  }
  
  let questions = $state<Question[]>([]);
  let isLoading = $state(true);
  let showForm = $state(false);
  let showPreview = $state(false);
  let previewQuestion = $state<Question | null>(null);
  let editingQuestion = $state<Question | null>(null);
  let currentQuizId = $state<string | null>(null);
  let currentQuiz = $state<any>(null);
  let search = $state('');
  let sortColumn = $state<string>('order');
  let sortDirection = $state<'asc' | 'desc'>('asc');
  
  // Formulaire
  let formData = $state({
    question: '',
    family: 'general' as string,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    imageUrl: '',
    imageCaption: '',
    isActive: true,
    order: 0
  });

  // Questions filtrées et triées
  let filteredQuestions = $derived.by(() => {
    let result = questions;
    
    // Filtre par recherche
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(q => 
        q.question?.toLowerCase().includes(s) ||
        q.explanation?.toLowerCase().includes(s)
      );
    }
    
    // Tri
    result = [...result].sort((a, b) => {
      let aVal: unknown = a[sortColumn as keyof Question];
      let bVal: unknown = b[sortColumn as keyof Question];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  });

  onMount(async () => {
    currentQuizId = $page.url.searchParams.get('quiz');
    
    if (currentQuizId) {
      await loadQuizInfo();
    }
    
    await loadQuestions();
  });

  async function loadQuizInfo() {
    if (!currentQuizId) return;
    
    try {
      const response = await fetch(`/api/admin/quiz/${currentQuizId}`);
      if (response.ok) {
        const data = await response.json();
        currentQuiz = data.quiz;
      }
    } catch (error) {
      console.error('Failed to load quiz info:', error);
    }
  }

  async function loadQuestions() {
    try {
      isLoading = true;
      const url = currentQuizId 
        ? `/api/admin/questions?quiz=${currentQuizId}`
        : '/api/admin/questions';
      const response = await fetch(url);
      if (response.ok) {
        questions = await response.json();
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      isLoading = false;
    }
  }

  function openNewQuestionForm() {
    editingQuestion = null;
    formData = {
      question: '',
      family: 'general',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      imageUrl: '',
      imageCaption: '',
      isActive: true,
      order: questions.length
    };
    showForm = true;
  }

  function openEditForm(question: Question) {
    editingQuestion = question;
    formData = {
      question: question.question,
      family: question.family || 'general',
      difficulty: (question.difficulty as any) || 'medium',
      options: [...(question.options || ['', '', '', ''])],
      correctAnswer: question.correctAnswer || 0,
      explanation: question.explanation || '',
      imageUrl: question.imageUrl || '',
      imageCaption: question.imageCaption || '',
      isActive: question.isActive,
      order: question.order || 0
    };
    showForm = true;
  }

  function openPreview(question: Question) {
    previewQuestion = question;
    showPreview = true;
  }

  async function saveQuestion() {
    try {
      const url = editingQuestion 
        ? `/api/admin/questions/${editingQuestion.id}`
        : '/api/admin/questions';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const dataToSend = {
        ...formData,
        quizId: currentQuizId ? `quiz:${currentQuizId}` : null
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        showForm = false;
        await loadQuestions();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function deleteQuestion(question: Question, event: Event) {
    event.stopPropagation();
    if (!confirm(`Supprimer la question "${question.question.substring(0, 50)}..." ?`)) return;
    
    try {
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadQuestions();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  async function toggleActive(question: Question, event: Event) {
    event.stopPropagation();
    try {
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...question, isActive: !question.isActive })
      });

      if (response.ok) {
        await loadQuestions();
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  function truncate(text: string, maxLength: number = 80) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
</script>

<svelte:head>
  <title>Questions {currentQuiz ? `- ${currentQuiz.title}` : ''} - Admin</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button onclick={() => goto('/admin/dashboard')} class="hover:text-purple-600">Dashboard</button>
          <span>/</span>
          <button onclick={() => goto('/admin/dashboard/quiz')} class="hover:text-purple-600">Quiz</button>
          {#if currentQuiz}
            <span>/</span>
            <span class="text-gray-900">{currentQuiz.title}</span>
          {/if}
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Questions</h1>
        {#if currentQuiz}
          <p class="text-gray-600 mt-1">{questions.length} questions dans ce quiz</p>
        {:else}
          <p class="text-gray-600 mt-1">Toutes les questions de la plateforme</p>
        {/if}
      </div>
      <button
        onclick={openNewQuestionForm}
        class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nouvelle question
      </button>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-6">
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher une question..."
        bind:value={search}
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    {#if isLoading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>
    {:else if filteredQuestions.length === 0}
      <div class="p-12 text-center">
        <p class="text-gray-500 mb-4">
          {search ? 'Aucune question trouvée pour cette recherche' : 'Aucune question pour le moment'}
        </p>
        {#if !search}
          <button
            onclick={openNewQuestionForm}
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Créer la première question
          </button>
        {/if}
      </div>
    {:else}
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-12">#</th>
            <th 
              class="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              onclick={() => handleSort('question')}
            >
              <div class="flex items-center gap-1">
                Question
                {#if sortColumn === 'question'}
                  {#if sortDirection === 'asc'}
                    <ChevronUp class="w-4 h-4" />
                  {:else}
                    <ChevronDown class="w-4 h-4" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24">Image</th>
            <th 
              class="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24 cursor-pointer hover:bg-gray-100"
              onclick={() => handleSort('isActive')}
            >
              <div class="flex items-center gap-1">
                Statut
                {#if sortColumn === 'isActive'}
                  {#if sortDirection === 'asc'}
                    <ChevronUp class="w-4 h-4" />
                  {:else}
                    <ChevronDown class="w-4 h-4" />
                  {/if}
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700 w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredQuestions as question, index (question.id)}
            <tr 
              class="border-b border-gray-200 hover:bg-purple-50 transition-colors cursor-pointer"
              onclick={() => openEditForm(question)}
            >
              <td class="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900">{truncate(question.question)}</p>
              </td>
              <td class="px-6 py-4">
                {#if question.imageUrl}
                  <img 
                    src={question.imageUrl} 
                    alt="" 
                    class="w-10 h-10 rounded object-cover"
                  />
                {:else}
                  <span class="text-gray-400 text-sm">—</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <button
                  onclick={(e) => toggleActive(question, e)}
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors {question.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                >
                  {question.isActive ? 'Actif' : 'Inactif'}
                </button>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button 
                    class="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" 
                    title="Voir"
                    onclick={(e) => { e.stopPropagation(); openPreview(question); }}
                  >
                    <Eye class="w-4 h-4 text-blue-600" />
                  </button>
                  <button 
                    class="p-1.5 hover:bg-purple-100 rounded-lg transition-colors" 
                    title="Modifier"
                    onclick={(e) => { e.stopPropagation(); openEditForm(question); }}
                  >
                    <Edit2 class="w-4 h-4 text-purple-600" />
                  </button>
                  <button 
                    class="p-1.5 hover:bg-red-100 rounded-lg transition-colors" 
                    title="Supprimer"
                    onclick={(e) => deleteQuestion(question, e)}
                  >
                    <Trash2 class="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Footer avec count -->
      <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        {filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''}
        {#if search}
          (filtrées sur {questions.length})
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Modal Preview -->
{#if showPreview && previewQuestion}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    onclick={() => showPreview = false}
  >
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <h2 class="text-xl font-bold mb-4">Aperçu de la question</h2>
      
      <div class="space-y-4">
        <p class="text-lg font-medium">{previewQuestion.question}</p>
        
        {#if previewQuestion.imageUrl}
          <img src={previewQuestion.imageUrl} alt={previewQuestion.imageCaption} class="w-full max-h-64 object-contain rounded-lg" />
        {/if}
        
        <div class="space-y-2">
          {#each previewQuestion.options as option, i}
            <div class="flex items-center gap-2 p-3 rounded-lg {i === previewQuestion.correctAnswer ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}">
              {#if i === previewQuestion.correctAnswer}
                <span class="text-green-600 font-bold">✓</span>
              {:else}
                <span class="text-gray-400">○</span>
              {/if}
              <span class={i === previewQuestion.correctAnswer ? 'font-semibold text-green-700' : 'text-gray-700'}>
                {option}
              </span>
            </div>
          {/each}
        </div>
        
        <div class="p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800"><strong>Explication :</strong> {previewQuestion.explanation}</p>
        </div>
      </div>
      
      <div class="flex gap-3 mt-6">
        <button
          onclick={() => { showPreview = false; if (previewQuestion) openEditForm(previewQuestion); }}
          class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Modifier
        </button>
        <button
          onclick={() => showPreview = false}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Formulaire -->
{#if showForm}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    onclick={() => showForm = false}
  >
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <h2 class="text-2xl font-bold mb-6">
        {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
      </h2>
      
      <form onsubmit={(e) => { e.preventDefault(); saveQuestion(); }} class="space-y-4">
        <div>
          <label for="question-text" class="block text-sm font-medium text-gray-700 mb-1">Question *</label>
          <textarea
            id="question-text"
            bind:value={formData.question}
            required
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Options de réponse *</label>
          {#each formData.options as _, i}
            <div class="flex items-center gap-2 mb-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === i}
                onchange={() => formData.correctAnswer = i}
                class="text-purple-600 w-4 h-4"
              />
              <input
                type="text"
                bind:value={formData.options[i]}
                required
                placeholder="Option {i + 1}"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          {/each}
          <p class="text-xs text-gray-500 mt-1">Cochez la bonne réponse</p>
        </div>

        <div>
          <label for="explanation" class="block text-sm font-medium text-gray-700 mb-1">Explication *</label>
          <textarea
            id="explanation"
            bind:value={formData.explanation}
            required
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="imageUrl" class="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
            <input
              id="imageUrl"
              type="url"
              bind:value={formData.imageUrl}
              placeholder="https://..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label for="imageCaption" class="block text-sm font-medium text-gray-700 mb-1">Légende</label>
            <input
              id="imageCaption"
              type="text"
              bind:value={formData.imageCaption}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            bind:checked={formData.isActive}
            class="w-4 h-4 text-purple-600 rounded"
          />
          <label for="isActive" class="text-sm font-medium text-gray-700">Question active</label>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            {editingQuestion ? 'Mettre à jour' : 'Créer'}
          </button>
          <button
            type="button"
            onclick={() => showForm = false}
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
