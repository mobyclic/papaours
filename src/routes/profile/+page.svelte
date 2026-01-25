<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser } from '$lib/stores/userStore';
  import { goto } from '$app/navigation';

  let quizzes = $state<any[]>([]);
  let userResults = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    loadUser();
    if (!$currentUser) {
      goto('/');
      return;
    }
    const uid = $currentUser.id;
    await Promise.all([loadQuizzes(), loadResults(uid)]);
    loading = false;
  });

  async function loadQuizzes() {
    try {
      const res = await fetch('/api/quiz/list');
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes || [];
      }
    } catch (e) {
      error = 'Erreur chargement des quiz';
    }
  }

  async function loadResults(userId: string) {
    try {
      const res = await fetch(`/api/user/results?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        userResults = data.results || [];
      }
    } catch (e) {
      error = 'Erreur chargement des résultats';
    }
  }

  function playQuiz(slug: string) {
    goto(`/quiz/${slug}`);
  }
</script>

<svelte:head>
  <title>Profil - Papa Ours</title>
</svelte:head>

<main class="min-h-screen bg-gray-50">
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-2">Bonjour {$currentUser?.name || $currentUser?.email}</h1>
    <p class="text-gray-600 mb-6">Choisissez un quiz par thème et par niveau, et suivez votre progression.</p>

    {#if loading}
      <p>Chargement...</p>
    {:else}
      <!-- Quizzes grouped by theme -->
      <div class="space-y-8">
        {#each Array.from(new Set(quizzes.map(q => q.theme || 'Général'))) as theme}
          <section>
            <h2 class="text-xl font-semibold mb-3">Thème: {theme}</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {#each quizzes.filter(q => (q.theme || 'Général') === theme).sort((a,b) => (a.level||1)-(b.level||1)) as q}
                <div class="bg-white border rounded-xl shadow p-4">
                  <h3 class="font-bold">{q.title}</h3>
                  <p class="text-sm text-gray-600">Niveau {q.level || 1}</p>
                  {#if q.description}
                    <p class="text-sm text-gray-700 mt-1">{q.description}</p>
                  {/if}
                  <button class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white" onclick={() => playQuiz(q.slug)}>Commencer</button>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>

      <!-- User history -->
      <section class="mt-10">
        <h2 class="text-xl font-semibold mb-3">Historique</h2>
        {#if userResults.length === 0}
          <p class="text-gray-600">Aucun résultat pour le moment.</p>
        {:else}
          <div class="bg-white border rounded-xl shadow overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="text-left border-b">
                  <th class="p-3">Date</th>
                  <th class="p-3">Quiz</th>
                  <th class="p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {#each userResults as r}
                  <tr class="border-b">
                    <td class="p-3">{new Date(r.completedAt).toLocaleString()}</td>
                    <td class="p-3">{r.quizId}</td>
                    <td class="p-3">{r.score}/{r.totalQuestions}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/if}
  </div>
</main>
