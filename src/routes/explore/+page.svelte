<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { 
    Search, Filter, ChevronLeft, BookOpen, Target, Clock,
    Sparkles, Star, X, SlidersHorizontal
  } from 'lucide-svelte';
  import FavoriteButton from '$lib/components/FavoriteButton.svelte';

  interface Quiz {
    id: string;
    title: string;
    slug: string;
    description?: string;
    coverImage?: string;
    difficulty_level: number;
    questionType: string;
    maxQuestions?: number;
    matiere?: { id: string; name: string; color?: string } | null;
    themes: string[];
    classe?: { id: string; name: string } | null;
  }

  interface FilterOption {
    id: string;
    name: string;
    slug?: string;
    color?: string;
    matiere_id?: string;
  }

  // State
  let quizzes = $state<Quiz[]>([]);
  let loading = $state(true);
  let total = $state(0);
  
  // Filters
  let matieres = $state<FilterOption[]>([]);
  let themes = $state<FilterOption[]>([]);
  let classes = $state<FilterOption[]>([]);
  
  let selectedMatiere = $state<string>('');
  let selectedTheme = $state<string>('');
  let selectedClasse = $state<string>('');
  let selectedDifficulty = $state<string>('');
  let searchQuery = $state('');
  let showFilters = $state(false);

  // Filtered themes based on selected matière
  let filteredThemes = $derived(
    selectedMatiere 
      ? themes.filter(t => t.matiere_id === selectedMatiere)
      : themes
  );

  const difficultyLevels = [
    { value: '', label: 'Toutes' },
    { value: '1', label: '⭐ Facile' },
    { value: '2', label: '⭐⭐ Moyen' },
    { value: '3', label: '⭐⭐⭐ Difficile' }
  ];

  const matiereColors: Record<string, string> = {
    'Mathématiques': 'from-blue-400 to-blue-600',
    'Français': 'from-red-400 to-red-600',
    'Histoire': 'from-amber-400 to-amber-600',
    'Géographie': 'from-green-400 to-green-600',
    'Sciences': 'from-purple-400 to-purple-600',
    'Physique-Chimie': 'from-cyan-400 to-cyan-600',
    'SVT': 'from-lime-400 to-lime-600',
    'Anglais': 'from-pink-400 to-pink-600',
    'Musique': 'from-indigo-400 to-indigo-600',
    'default': 'from-gray-400 to-gray-600'
  };

  onMount(async () => {
    loadUser();
    await loadQuizzes();
  });

  async function loadQuizzes() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (selectedMatiere) params.set('matiere', selectedMatiere);
      if (selectedTheme) params.set('theme', selectedTheme);
      if (selectedClasse) params.set('classe', selectedClasse);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/quiz/explore?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes;
        total = data.total;
        
        // Set filters on first load
        if (matieres.length === 0) {
          matieres = data.filters.matieres;
          themes = data.filters.themes;
          classes = data.filters.classes;
        }
      }
    } catch (e) {
      console.error('Erreur:', e);
    } finally {
      loading = false;
    }
  }

  function clearFilters() {
    selectedMatiere = '';
    selectedTheme = '';
    selectedClasse = '';
    selectedDifficulty = '';
    searchQuery = '';
    loadQuizzes();
  }

  function getMatiereGradient(matiereName?: string): string {
    if (!matiereName) return matiereColors['default'];
    return matiereColors[matiereName] || matiereColors['default'];
  }

  function getDifficultyStars(level: number): string {
    return '⭐'.repeat(level || 1);
  }

  function getQuestionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'qcm': 'QCM',
      'qcm_image': 'QCM Images',
      'vrai-faux': 'Vrai/Faux',
      'texte-libre': 'Texte libre'
    };
    return labels[type] || type;
  }

  let hasActiveFilters = $derived(
    selectedMatiere || selectedTheme || selectedClasse || selectedDifficulty || searchQuery.trim()
  );
</script>

<svelte:head>
  <title>Explorer les Quiz - Kwizy</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
  <div class="max-w-7xl mx-auto p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <button
          onclick={() => goto('/dashboard')}
          class="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft class="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles class="w-8 h-8 text-purple-600" />
          Explorer les Quiz
        </h1>
        <p class="text-gray-600 mt-1">{total} quiz disponibles</p>
      </div>
    </div>

    <!-- Search & Filters Bar -->
    <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un quiz..."
            bind:value={searchQuery}
            onkeydown={(e) => e.key === 'Enter' && loadQuizzes()}
            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <!-- Filter Toggle (Mobile) -->
        <button
          onclick={() => showFilters = !showFilters}
          class="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-100 text-purple-700 rounded-lg"
        >
          <SlidersHorizontal class="w-5 h-5" />
          Filtres
          {#if hasActiveFilters}
            <span class="w-2 h-2 bg-purple-600 rounded-full"></span>
          {/if}
        </button>

        <!-- Quick Filters (Desktop) -->
        <div class="hidden md:flex gap-3">
          <select
            bind:value={selectedMatiere}
            onchange={() => { selectedTheme = ''; loadQuizzes(); }}
            class="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">Toutes matières</option>
            {#each matieres as m}
              <option value={m.id}>{m.name}</option>
            {/each}
          </select>

          <select
            bind:value={selectedDifficulty}
            onchange={loadQuizzes}
            class="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {#each difficultyLevels as d}
              <option value={d.value}>{d.label}</option>
            {/each}
          </select>

          <button
            onclick={loadQuizzes}
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Rechercher
          </button>

          {#if hasActiveFilters}
            <button
              onclick={clearFilters}
              class="px-3 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X class="w-4 h-4" />
              Effacer
            </button>
          {/if}
        </div>
      </div>

      <!-- Mobile Filters Panel -->
      {#if showFilters}
        <div class="md:hidden mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <label for="mobile-matiere" class="text-xs text-gray-500 mb-1 block">Matière</label>
            <select
              id="mobile-matiere"
              bind:value={selectedMatiere}
              onchange={() => selectedTheme = ''}
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Toutes</option>
              {#each matieres as m}
                <option value={m.id}>{m.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="mobile-theme" class="text-xs text-gray-500 mb-1 block">Thème</label>
            <select
              id="mobile-theme"
              bind:value={selectedTheme}
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Tous</option>
              {#each filteredThemes as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="mobile-classe" class="text-xs text-gray-500 mb-1 block">Classe</label>
            <select
              id="mobile-classe"
              bind:value={selectedClasse}
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Toutes</option>
              {#each classes as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="mobile-difficulty" class="text-xs text-gray-500 mb-1 block">Difficulté</label>
            <select
              id="mobile-difficulty"
              bind:value={selectedDifficulty}
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {#each difficultyLevels as d}
                <option value={d.value}>{d.label}</option>
              {/each}
            </select>
          </div>

          <button
            onclick={() => { loadQuizzes(); showFilters = false; }}
            class="col-span-2 py-2 bg-purple-600 text-white rounded-lg font-medium"
          >
            Appliquer les filtres
          </button>
        </div>
      {/if}
    </div>

    <!-- Active Filters Tags -->
    {#if hasActiveFilters}
      <div class="flex flex-wrap gap-2 mb-4">
        {#if selectedMatiere}
          {@const m = matieres.find(x => x.id === selectedMatiere)}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
            {m?.name || selectedMatiere}
            <button onclick={() => { selectedMatiere = ''; selectedTheme = ''; loadQuizzes(); }}>
              <X class="w-4 h-4" />
            </button>
          </span>
        {/if}
        {#if selectedTheme}
          {@const t = themes.find(x => x.id === selectedTheme)}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {t?.name || selectedTheme}
            <button onclick={() => { selectedTheme = ''; loadQuizzes(); }}>
              <X class="w-4 h-4" />
            </button>
          </span>
        {/if}
        {#if selectedClasse}
          {@const c = classes.find(x => x.id === selectedClasse)}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            {c?.name || selectedClasse}
            <button onclick={() => { selectedClasse = ''; loadQuizzes(); }}>
              <X class="w-4 h-4" />
            </button>
          </span>
        {/if}
        {#if selectedDifficulty}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
            {difficultyLevels.find(d => d.value === selectedDifficulty)?.label}
            <button onclick={() => { selectedDifficulty = ''; loadQuizzes(); }}>
              <X class="w-4 h-4" />
            </button>
          </span>
        {/if}
        {#if searchQuery}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            "{searchQuery}"
            <button onclick={() => { searchQuery = ''; loadQuizzes(); }}>
              <X class="w-4 h-4" />
            </button>
          </span>
        {/if}
      </div>
    {/if}

    <!-- Loading -->
    {#if loading}
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    {:else if quizzes.length === 0}
      <!-- Empty State -->
      <div class="bg-white rounded-xl shadow-sm p-12 text-center">
        <BookOpen class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Aucun quiz trouvé</h2>
        <p class="text-gray-500 mb-4">Essayez de modifier vos filtres de recherche</p>
        <button
          onclick={clearFilters}
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Réinitialiser les filtres
        </button>
      </div>
    {:else}
      <!-- Quiz Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each quizzes as quiz}
          <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 group relative">
            <!-- Favorite Button -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="absolute top-3 left-3 z-10" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
              <FavoriteButton quizId={quiz.id} size="sm" />
            </div>

            <button
              onclick={() => goto(`/quiz/${quiz.slug}`)}
              class="w-full text-left"
            >
              <!-- Cover Image or Gradient -->
              <div class="h-32 bg-gradient-to-br {getMatiereGradient(quiz.matiere?.name)} relative">
                {#if quiz.coverImage}
                  <img 
                    src={quiz.coverImage} 
                    alt={quiz.title}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="absolute inset-0 flex items-center justify-center opacity-20">
                    <BookOpen class="w-20 h-20 text-white" />
                  </div>
                {/if}
                
                <!-- Difficulty Badge -->
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                  {getDifficultyStars(quiz.difficulty_level)}
                </div>

                <!-- Matière Badge -->
                {#if quiz.matiere}
                  <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                    {quiz.matiere.name}
                  </div>
                {/if}
              </div>

              <!-- Content -->
              <div class="p-4">
                <h3 class="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
                
                {#if quiz.description}
                  <p class="text-sm text-gray-500 mt-1 line-clamp-2">{quiz.description}</p>
                {/if}

                <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <span class="flex items-center gap-1">
                    <Target class="w-3.5 h-3.5" />
                    {getQuestionTypeLabel(quiz.questionType)}
                  </span>
                  {#if quiz.maxQuestions}
                  <span class="flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5" />
                    {quiz.maxQuestions} questions
                  </span>
                {/if}
              </div>

              <!-- Themes Tags -->
              {#if quiz.themes.length > 0}
                <div class="flex flex-wrap gap-1 mt-3">
                  {#each quiz.themes.slice(0, 3) as theme}
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {theme}
                    </span>
                  {/each}
                  {#if quiz.themes.length > 3}
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      +{quiz.themes.length - 3}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</main>
