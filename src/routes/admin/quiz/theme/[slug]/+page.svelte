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
    goto('/admin/quiz');
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
      class="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Retour à tous les quiz
    </button>
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Quiz - {currentTheme?.name}</h1>
        <p class="text-gray-400 mt-1">{quizzes.length} quiz dans cette catégorie</p>
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
        class="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-800/50 border-b border-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Titre</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Matière</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Niveau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Questions</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-300">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredQuizzes as quiz (quiz.id)}
          <tr 
            class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
            onclick={() => editQuiz(quiz)}
          >
            <td class="px-6 py-4 text-sm font-medium text-white">{quiz.title}</td>
            <td class="px-6 py-4 text-sm text-gray-400">{quiz.subject}</td>
            <td class="px-6 py-4 text-sm">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {quiz.difficulty_level || 'N/A'}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-400">{quiz.question_count || 0}</td>
            <td class="px-6 py-4 text-sm">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                quiz.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {quiz.is_active ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button 
                  class="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors" 
                  title="Éditer"
                  onclick={(e) => { e.stopPropagation(); editQuiz(quiz); }}
                >
                  <Edit2 class="w-4 h-4 text-purple-400" />
                </button>
                <button 
                  class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" 
                  title="Supprimer"
                  onclick={(e) => deleteQuiz(quiz, e)}
                >
                  <Trash2 class="w-4 h-4 text-red-400" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if filteredQuizzes.length === 0}
      <div class="px-6 py-12 text-center">
        <p class="text-gray-400 text-sm">Aucun quiz trouvé dans la catégorie {currentTheme?.name}</p>
      </div>
    {/if}
  </div>
</div>
