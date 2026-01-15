<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let quiz = $state<any[]>([]);
  let loading = $state(true);
  let showModal = $state(false);
  let editingQuiz = $state<any>(null);

  let formData = $state({
    title: '',
    description: '',
    slug: '',
    questionType: 'qcm',
    coverImage: '',
    isActive: true
  });

  onMount(() => {
    loadQuiz();
  });

  async function loadQuiz() {
    try {
      loading = true;
      const response = await fetch('/api/admin/quiz');
      const data = await response.json();
      quiz = data.quiz || [];
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
    } finally {
      loading = false;
    }
  }

  function openNewQuizForm() {
    editingQuiz = null;
    formData = {
      title: '',
      description: '',
      slug: '',
      questionType: 'qcm',
      coverImage: '',
      isActive: true
    };
    showModal = true;
  }

  function openEditForm(q: any) {
    editingQuiz = q;
    formData = {
      title: q.title,
      description: q.description || '',
      slug: q.slug,
      questionType: q.questionType || 'qcm',
      coverImage: q.coverImage || '',
      isActive: q.isActive
    };
    showModal = true;
  }

  function generateSlug() {
    if (formData.title && !editingQuiz) {
      formData.slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  async function saveQuiz() {
    try {
      const url = editingQuiz 
        ? `/api/admin/quiz/${editingQuiz.id.split(':')[1]}`
        : '/api/admin/quiz';
      
      const method = editingQuiz ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showModal = false;
        await loadQuiz();
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function setAsHomepage(quizId: string) {
    if (!confirm('Définir ce quiz comme page d\'accueil ?')) return;

    try {
      const response = await fetch(`/api/admin/quiz/${quizId.split(':')[1]}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setHomepage' })
      });

      if (response.ok) {
        await loadQuiz();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  }

  async function deleteQuiz(quizId: string, title: string) {
    if (!confirm(`Supprimer le quiz "${title}" et toutes ses questions ?`)) return;

    try {
      const response = await fetch(`/api/admin/quiz/${quizId.split(':')[1]}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadQuiz();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function manageQuestions(quizId: string) {
    goto(`/admin/questions?quiz=${quizId.split(':')[1]}`);
  }
</script>

<div class="p-8">
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-800">Gestion des Quiz</h1>
      <p class="text-gray-600 mt-2">Créez et organisez vos quiz</p>
    </div>
    <button
      onclick={openNewQuizForm}
      class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      + Nouveau Quiz
    </button>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Chargement...</p>
    </div>
  {:else if quiz.length === 0}
    <div class="text-center py-12 bg-gray-50 rounded-lg">
      <p class="text-gray-600">Aucun quiz créé pour le moment</p>
      <button
        onclick={openNewQuizForm}
        class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Créer mon premier quiz
      </button>
    </div>
  {:else}
    <div class="grid gap-6">
      {#each quiz as q}
        <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-xl font-bold text-gray-800">{q.title}</h3>
                {#if q.isHomepage}
                  <span class="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    🏠 Page d'accueil
                  </span>
                {/if}
                {#if !q.isActive}
                  <span class="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    Inactif
                  </span>
                {/if}
              </div>
              
              {#if q.description}
                <p class="text-gray-600 mb-3">{q.description}</p>
              {/if}
              
              <div class="flex gap-4 text-sm text-gray-500">
                <span>🔗 /{q.slug}</span>
                <span>📝 Type: {q.questionType}</span>
                <span>📅 {new Date(q.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              onclick={() => manageQuestions(q.id)}
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Questions
            </button>
            
            {#if !q.isHomepage}
              <button
                onclick={() => setAsHomepage(q.id)}
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Définir comme accueil
              </button>
            {/if}

            <button
              onclick={() => openEditForm(q)}
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Modifier
            </button>

            <button
              onclick={() => deleteQuiz(q.id, q.title)}
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-auto"
            >
              Supprimer
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-6">
        {editingQuiz ? 'Modifier le quiz' : 'Nouveau quiz'}
      </h2>

      <form onsubmit={(e) => { e.preventDefault(); saveQuiz(); }}>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              bind:value={formData.title}
              oninput={generateSlug}
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <input
              type="text"
              bind:value={formData.slug}
              required
              pattern="[a-z0-9-]+"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-sm text-gray-500 mt-1">URL: /quiz/{formData.slug || 'mon-quiz'}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              bind:value={formData.description}
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Type de questions
            </label>
            <select
              bind:value={formData.questionType}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="qcm">QCM (Choix multiples)</option>
              <option value="vrai-faux">Vrai / Faux</option>
              <option value="texte-libre">Texte libre</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Image de couverture (URL)
            </label>
            <input
              type="url"
              bind:value={formData.coverImage}
              placeholder="https://..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              bind:checked={formData.isActive}
              id="isActive"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label for="isActive" class="text-sm font-medium text-gray-700">
              Quiz actif
            </label>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            type="submit"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {editingQuiz ? 'Mettre à jour' : 'Créer'}
          </button>
          <button
            type="button"
            onclick={() => showModal = false}
            class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
