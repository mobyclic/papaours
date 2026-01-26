<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Search, ArrowLeft } from "lucide-svelte";

  let { data }: { data: PageData } = $props();

  let quizzes = $derived(data.quizzes || []);
  let currentTheme = $derived(data.currentTheme);
  let search = $state('');

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

  function newQuiz() {
    goto('/admin/quiz');
  }

  function goBack() {
    goto('/admin/dashboard/quiz');
  }
</script>

<svelte:head>
  <title>Quiz {currentTheme?.name} - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <button 
      onclick={goBack}
      class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Retour à tous les quiz
    </button>
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quiz - {currentTheme?.name}</h1>
        <p class="text-gray-600 mt-1">{quizzes.length} quiz dans cette catégorie</p>
      </div>
      <Button onclick={newQuiz} class="bg-purple-600 hover:bg-purple-700">
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
                {quiz.difficulty_level || 'N/A'}
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
        <p class="text-gray-500 text-sm">Aucun quiz trouvé dans la catégorie {currentTheme?.name}</p>
      </div>
    {/if}
  </div>
</div>
