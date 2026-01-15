<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let homepageQuiz = $state<any>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const response = await fetch('/api/quiz/homepage');
      if (response.ok) {
        const data = await response.json();
        homepageQuiz = data.quiz;
      }
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
    } finally {
      loading = false;
    }
  });
  
  function startQuiz() {
    // Utiliser le quiz local pour l'instant
    goto('/quiz');
  }
</script>

<svelte:head>
  <title>Papa Ours - {homepageQuiz?.title || 'Les familles d\'instruments'}</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
  <div class="w-full max-w-2xl">
    <!-- Logo musical -->
    <div class="text-center mb-8">
      <div class="inline-block mb-6">
        <svg viewBox="0 0 200 200" class="w-40 h-40 drop-shadow-2xl">
          <!-- Oreille gauche -->
          <circle cx="60" cy="50" r="25" fill="#8B5A2B" />
          <circle cx="60" cy="50" r="15" fill="#D2691E" />
          <!-- Oreille droite -->
          <circle cx="140" cy="50" r="25" fill="#8B5A2B" />
          <circle cx="140" cy="50" r="15" fill="#D2691E" />
          <!-- Tête -->
          <circle cx="100" cy="100" r="60" fill="#A0522D" />
          <!-- Museau -->
          <ellipse cx="100" cy="115" rx="35" ry="30" fill="#D2B48C" />
          <!-- Yeux -->
          <circle cx="80" cy="90" r="8" fill="#000" />
          <circle cx="83" cy="88" r="3" fill="#fff" />
          <circle cx="120" cy="90" r="8" fill="#000" />
          <circle cx="123" cy="88" r="3" fill="#fff" />
          <!-- Nez -->
          <ellipse cx="100" cy="115" rx="12" ry="10" fill="#000" />
          <circle cx="97" cy="112" r="3" fill="#fff" opacity="0.6" />
          <!-- Sourire musical -->
          <path d="M 85 125 Q 100 140 115 125" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
          <!-- Note de musique -->
          <g transform="translate(145, 145)">
            <circle cx="0" cy="0" r="8" fill="#6366F1" />
            <ellipse cx="0" cy="0" rx="6" ry="8" fill="#6366F1" transform="rotate(-20)" />
            <rect x="5" y="-25" width="3" height="25" fill="#6366F1" />
            <path d="M 8 -25 Q 15 -20 8 -15" fill="#6366F1" />
          </g>
        </svg>
      </div>
      
      <h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
        {homepageQuiz?.title || 'Les familles d\'instruments'}
      </h1>
      {#if homepageQuiz?.description}
        <p class="text-lg text-gray-600 max-w-xl mx-auto">
          {homepageQuiz.description}
        </p>
      {:else}
        <h2 class="text-3xl font-semibold text-indigo-700 mb-4">
          & l'orchestre symphonique
        </h2>
        <p class="text-lg text-gray-600 max-w-xl mx-auto">
          Découvrez les différentes familles d'instruments qui composent un orchestre symphonique 
          et testez vos connaissances !
        </p>
      {/if}
    </div>

    <!-- Card d'accueil -->
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-200 overflow-hidden">
      <div class="p-8 space-y-6">
        <!-- Infos sur le quiz -->
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="p-4 bg-purple-50 rounded-xl">
            <div class="text-3xl font-bold text-purple-600">🎻</div>
            <div class="text-sm text-gray-600 mt-2">Cordes</div>
          </div>
          <div class="p-4 bg-pink-50 rounded-xl">
            <div class="text-3xl font-bold text-pink-600">🎺</div>
            <div class="text-sm text-gray-600 mt-2">Cuivres</div>
          </div>
          <div class="p-4 bg-indigo-50 rounded-xl">
            <div class="text-3xl font-bold text-indigo-600">🎷</div>
            <div class="text-sm text-gray-600 mt-2">Bois</div>
          </div>
        </div>

        <div class="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <h3 class="text-xl font-semibold text-gray-800 mb-3">📝 À propos de ce quiz</h3>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Questions sur les 4 familles d'instruments</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Images et illustrations pour mieux apprendre</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Découvrez les instruments de l'orchestre symphonique</span>
            </li>
          </ul>
        </div>
        
        <button
          onclick={startQuiz}
          class="w-full h-14 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          🎵 Lancer le quiz
        </button>

        <p class="text-center text-sm text-gray-500">
          Bonne chance ! 🐻
        </p>
      </div>
    </div>
  </div>
</main>
