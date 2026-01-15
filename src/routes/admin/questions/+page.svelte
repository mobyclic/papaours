<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { adminUser } from '$lib/stores/adminStore';
  
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
  let editingQuestion = $state<Question | null>(null);
  let currentQuizId = $state<string | null>(null);
  let currentQuiz = $state<any>(null);
  
  // Formulaire
  let formData = $state({
    question: '',
    family: 'cordes' as 'cordes' | 'bois' | 'cuivres' | 'percussions' | 'general',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    imageUrl: '',
    imageCaption: '',
    isActive: true,
    order: 0
  });

  onMount(async () => {
    // Récupérer le quizId depuis l'URL
    currentQuizId = $page.url.searchParams.get('quiz');
    
    // Charger les infos du quiz si un quizId est fourni
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
      family: 'cordes',
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
      family: question.family as any,
      difficulty: question.difficulty as any,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      imageUrl: question.imageUrl || '',
      imageCaption: question.imageCaption || '',
      isActive: question.isActive,
      order: question.order
    };
    showForm = true;
  }

  async function saveQuestion() {
    try {
      const url = editingQuestion 
        ? `/api/admin/questions/${editingQuestion.id}`
        : '/api/admin/questions';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      // Ajouter le quizId si on est dans le contexte d'un quiz
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

  async function deleteQuestion(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;
    
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadQuestions();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  async function toggleActive(question: Question) {
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

  function getFamilyEmoji(family: string) {
    const emojis: Record<string, string> = {
      cordes: '🎻',
      bois: '🎷',
      cuivres: '🎺',
      percussions: '🥁',
      general: '🎵'
    };
    return emojis[family] || '🎵';
  }
</script>

<svelte:head>
  <title>Gestion des questions - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-4">
          <button 
            onclick={() => currentQuizId ? goto('/admin/quiz') : goto('/admin/dashboard')} 
            class="text-gray-600 hover:text-gray-900"
          >
            ← {currentQuizId ? 'Retour aux quiz' : 'Dashboard'}
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Gestion des questions</h1>
            {#if currentQuiz}
              <p class="text-sm text-gray-600">Quiz : {currentQuiz.title}</p>
            {/if}
          </div>
        </div>
        <button
          onclick={openNewQuestionForm}
          class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700"
        >
          ➕ Nouvelle question
        </button>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if isLoading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>
    {:else if questions.length === 0}
      <div class="text-center py-12 bg-white rounded-xl shadow">
        <p class="text-gray-600 mb-4">Aucune question pour le moment</p>
        <button
          onclick={openNewQuestionForm}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
        >
          Créer la première question
        </button>
      </div>
    {:else}
      <div class="grid gap-4">
        {#each questions as question (question.id)}
          <div class="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">{getFamilyEmoji(question.family)}</span>
                  <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {question.family}
                  </span>
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {question.difficulty}
                  </span>
                  <button
                    onclick={() => toggleActive(question)}
                    class="px-3 py-1 rounded-full text-sm font-medium {question.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}"
                  >
                    {question.isActive ? '✓ Active' : '✗ Inactive'}
                  </button>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 mb-3">{question.question}</h3>
                
                {#if question.imageUrl}
                  <img src={question.imageUrl} alt={question.imageCaption} class="w-32 h-32 object-cover rounded-lg mb-3" />
                {/if}
                
                <div class="space-y-1 mb-3">
                  {#each question.options as option, i}
                    <div class="flex items-center gap-2">
                      {#if i === question.correctAnswer}
                        <span class="text-green-500 font-bold">✓</span>
                      {:else}
                        <span class="text-gray-300">○</span>
                      {/if}
                      <span class={i === question.correctAnswer ? 'font-semibold text-green-700' : 'text-gray-600'}>
                        {option}
                      </span>
                    </div>
                  {/each}
                </div>
                
                <p class="text-sm text-gray-600 italic">{question.explanation}</p>
              </div>
              
              <div class="flex flex-col gap-2">
                <button
                  onclick={() => openEditForm(question)}
                  class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  ✏️ Modifier
                </button>
                <button
                  onclick={() => deleteQuestion(question.id)}
                  class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Modal Formulaire -->
{#if showForm}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
      <h2 class="text-2xl font-bold mb-6">
        {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
      </h2>
      
      <form onsubmit={(e) => { e.preventDefault(); saveQuestion(); }} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Question *</label>
          <input
            type="text"
            bind:value={formData.question}
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Famille *</label>
            <select bind:value={formData.family} class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="cordes">Cordes</option>
              <option value="bois">Bois</option>
              <option value="cuivres">Cuivres</option>
              <option value="percussions">Percussions</option>
              <option value="general">Général</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
            <select bind:value={formData.difficulty} class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </div>
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
                class="text-purple-600"
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Explication *</label>
          <textarea
            bind:value={formData.explanation}
            required
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
          <input
            type="url"
            bind:value={formData.imageUrl}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Légende de l'image</label>
          <input
            type="text"
            bind:value={formData.imageCaption}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
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
            class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700"
          >
            💾 Enregistrer
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
