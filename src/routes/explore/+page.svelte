<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { 
    Search, ChevronLeft, BookOpen, Target, Clock,
    Sparkles, X, SlidersHorizontal, ChevronRight, Play,
    Flame, Trophy, Filter, ArrowRight
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
    subject?: { id: string; code: string; name: string; color?: string; icon?: string } | null;
    themes: string[];
    classe?: { id: string; name: string } | null;
  }

  interface FilterOption {
    id: string;
    name: string;
    slug?: string;
    color?: string;
    icon?: string;
    subject_code?: string;
  }

  // State
  let quizzes = $state<Quiz[]>([]);
  let loading = $state(true);
  let total = $state(0);
  
  // Filters
  let subjects = $state<FilterOption[]>([]);
  let themes = $state<FilterOption[]>([]);
  let classes = $state<FilterOption[]>([]);
  
  let selectedSubject = $state<string>('');
  let selectedTheme = $state<string>('');
  let selectedClasse = $state<string>('');
  let selectedDifficulty = $state<string>('');
  let searchQuery = $state('');
  let showFilters = $state(false);
  let viewMode = $state<'grid' | 'list'>('grid');

  // Filtered themes based on selected subject
  let filteredThemes = $derived(
    selectedSubject 
      ? themes.filter(t => t.subject_code === selectedSubject)
      : themes
  );

  const difficultyLevels = [
    { value: '', label: 'Toutes difficultés', short: 'Toutes' },
    { value: '1', label: '⭐ Facile', short: 'Facile' },
    { value: '2', label: '⭐⭐ Moyen', short: 'Moyen' },
    { value: '3', label: '⭐⭐⭐ Difficile', short: 'Difficile' }
  ];

  const subjectColors: Record<string, string> = {
    'Mathématiques': 'from-blue-500 to-blue-600',
    'Français': 'from-red-500 to-red-600',
    'Histoire': 'from-amber-500 to-amber-600',
    'Géographie': 'from-green-500 to-green-600',
    'Sciences': 'from-purple-500 to-purple-600',
    'Physique/Chimie': 'from-cyan-500 to-cyan-600',
    'SVT': 'from-lime-500 to-lime-600',
    'Anglais': 'from-pink-500 to-pink-600',
    'Musique': 'from-indigo-500 to-indigo-600',
    'default': 'from-gray-600 to-gray-700'
  };

  const subjectIcons: Record<string, string> = {
    'Mathématiques': '🔢',
    'Français': '📚',
    'Histoire': '🏰',
    'Géographie': '🌍',
    'Sciences': '🔬',
    'Physique/Chimie': '⚗️',
    'SVT': '🌿',
    'Anglais': '🇬🇧',
    'Musique': '🎵',
    'Arts': '🎨',
    'Éducation civique': '🏛️',
    'default': '📖'
  };

  onMount(async () => {
    loadUser();
    await loadQuizzes();
  });

  async function loadQuizzes() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (selectedSubject) params.set('subject', selectedSubject);
      if (selectedTheme) params.set('theme', selectedTheme);
      if (selectedClasse) params.set('classe', selectedClasse);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/quiz/explore?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes;
        total = data.total;
        
        if (subjects.length === 0) {
          subjects = data.filters.subjects;
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
    selectedSubject = '';
    selectedTheme = '';
    selectedClasse = '';
    selectedDifficulty = '';
    searchQuery = '';
    loadQuizzes();
  }

  function getSubjectGradient(subjectName?: string): string {
    if (!subjectName) return subjectColors['default'];
    return subjectColors[subjectName] || subjectColors['default'];
  }

  function getSubjectIcon(subjectName?: string): string {
    if (!subjectName) return subjectIcons['default'];
    return subjectIcons[subjectName] || subjectIcons['default'];
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
    selectedSubject || selectedTheme || selectedClasse || selectedDifficulty || searchQuery.trim()
  );
</script>

<svelte:head>
  <title>Explorer les Quiz - Kweez</title>
  <meta name="description" content="Découvre tous les quiz disponibles sur Kweez. Filtre par matière, difficulté et thème.">
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <!-- Grid Background -->
  <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
  
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            onclick={() => goto('/dashboard')}
            class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft class="w-5 h-5" />
            <span class="hidden sm:inline">Retour</span>
          </button>
          
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles class="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 class="text-xl font-bold">Explorer les Quiz</h1>
              <p class="text-sm text-gray-400">{total} quiz disponibles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6">
    <!-- Search & Filters -->
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-4 md:p-6 mb-6">
      <!-- Search Bar -->
      <div class="flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un quiz par titre, matière ou thème..."
            bind:value={searchQuery}
            onkeydown={(e) => e.key === 'Enter' && loadQuizzes()}
            class="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          />
        </div>
        
        <div class="flex gap-3">
          <button
            onclick={() => showFilters = !showFilters}
            class="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-colors {showFilters ? 'ring-2 ring-amber-500/50 border-amber-500' : ''}"
          >
            <Filter class="w-5 h-5" />
            <span>Filtres</span>
            {#if hasActiveFilters}
              <span class="w-5 h-5 bg-amber-500 rounded-full text-xs flex items-center justify-center text-gray-900 font-bold">
                {[selectedSubject, selectedTheme, selectedClasse, selectedDifficulty].filter(Boolean).length}
              </span>
            {/if}
          </button>
          
          <button
            onclick={loadQuizzes}
            class="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <Search class="w-5 h-5" />
            <span class="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </div>

      <!-- Expanded Filters -->
      {#if showFilters}
        <div class="mt-6 pt-6 border-t border-gray-800">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Matière -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Matière</label>
              <select
                bind:value={selectedSubject}
                onchange={() => { selectedTheme = ''; }}
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">Toutes les matières</option>
                {#each subjects as s}
                  <option value={s.id}>{s.icon || getSubjectIcon(s.name)} {s.name}</option>
                {/each}
              </select>
            </div>

            <!-- Thème -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Thème</label>
              <select
                bind:value={selectedTheme}
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">Tous les thèmes</option>
                {#each filteredThemes as t}
                  <option value={t.id}>{t.name}</option>
                {/each}
              </select>
            </div>

            <!-- Classe -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Classe</label>
              <select
                bind:value={selectedClasse}
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">Toutes les classes</option>
                {#each classes as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              </select>
            </div>

            <!-- Difficulté -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Difficulté</label>
              <select
                bind:value={selectedDifficulty}
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {#each difficultyLevels as d}
                  <option value={d.value}>{d.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            {#if hasActiveFilters}
              <button
                onclick={clearFilters}
                class="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X class="w-4 h-4" />
                Effacer tous les filtres
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Active Filters Tags -->
      {#if hasActiveFilters && !showFilters}
        <div class="flex flex-wrap gap-2 mt-4">
          {#if selectedSubject}
            {@const s = subjects.find(x => x.id === selectedSubject)}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm border border-amber-500/30">
              {s?.icon || getSubjectIcon(s?.name)} {s?.name}
              <button onclick={() => { selectedSubject = ''; selectedTheme = ''; loadQuizzes(); }} class="hover:text-amber-300">
                <X class="w-4 h-4" />
              </button>
            </span>
          {/if}
          {#if selectedTheme}
            {@const t = themes.find(x => x.id === selectedTheme)}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
              {t?.name}
              <button onclick={() => { selectedTheme = ''; loadQuizzes(); }} class="hover:text-blue-300">
                <X class="w-4 h-4" />
              </button>
            </span>
          {/if}
          {#if selectedClasse}
            {@const c = classes.find(x => x.id === selectedClasse)}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
              {c?.name}
              <button onclick={() => { selectedClasse = ''; loadQuizzes(); }} class="hover:text-green-300">
                <X class="w-4 h-4" />
              </button>
            </span>
          {/if}
          {#if selectedDifficulty}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-500/30">
              {difficultyLevels.find(d => d.value === selectedDifficulty)?.short}
              <button onclick={() => { selectedDifficulty = ''; loadQuizzes(); }} class="hover:text-purple-300">
                <X class="w-4 h-4" />
              </button>
            </span>
          {/if}
          {#if searchQuery}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-full text-sm border border-gray-600">
              "{searchQuery}"
              <button onclick={() => { searchQuery = ''; loadQuizzes(); }} class="hover:text-white">
                <X class="w-4 h-4" />
              </button>
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Quick Subject Filters -->
    {#if !hasActiveFilters && subjects.length > 0}
      <div class="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <div class="flex gap-3 min-w-max">
          {#each subjects.slice(0, 8) as s}
            <button
              onclick={() => { selectedSubject = s.id; loadQuizzes(); }}
              class="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group"
            >
              <span class="text-lg">{s.icon || getSubjectIcon(s.name)}</span>
              <span class="text-sm text-gray-300 group-hover:text-white">{s.name}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Results -->
    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p class="mt-4 text-gray-400">Chargement des quiz...</p>
        </div>
      </div>
    {:else if quizzes.length === 0}
      <!-- Empty State -->
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6">
          <BookOpen class="w-10 h-10 text-gray-600" />
        </div>
        <h2 class="text-xl font-semibold text-white mb-2">Aucun quiz trouvé</h2>
        <p class="text-gray-400 mb-6 max-w-md">
          Nous n'avons trouvé aucun quiz correspondant à vos critères. 
          Essayez de modifier vos filtres ou lancez une nouvelle recherche.
        </p>
        <button
          onclick={clearFilters}
          class="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl transition-colors"
        >
          Réinitialiser les filtres
        </button>
      </div>
    {:else}
      <!-- Quiz Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {#each quizzes as quiz}
          <div class="group relative bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1">
            <!-- Favorite Button -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="absolute top-3 right-3 z-10" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
              <FavoriteButton quizId={quiz.id} size="sm" />
            </div>

            <a href="/quiz/{quiz.slug}" class="block">
              <!-- Cover -->
              <div class="h-36 bg-gradient-to-br {getSubjectGradient(quiz.subject?.name)} relative overflow-hidden">
                {#if quiz.coverImage}
                  <img 
                    src={quiz.coverImage} 
                    alt={quiz.title}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-5xl opacity-30">{quiz.subject?.icon || getSubjectIcon(quiz.subject?.name)}</span>
                  </div>
                {/if}
                
                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>

                <!-- Difficulty Badge -->
                <div class="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                  {getDifficultyStars(quiz.difficulty_level)}
                </div>

                <!-- Subject Badge -->
                {#if quiz.subject}
                  <div class="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <span>{quiz.subject.icon || getSubjectIcon(quiz.subject.name)}</span>
                    <span>{quiz.subject.name}</span>
                  </div>
                {/if}

                <!-- Play Button Overlay -->
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform shadow-lg shadow-amber-500/30">
                    <Play class="w-6 h-6 text-gray-900 ml-1" />
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4">
                <h3 class="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
                
                {#if quiz.description}
                  <p class="text-sm text-gray-500 mt-2 line-clamp-2">{quiz.description}</p>
                {/if}

                <div class="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span class="flex items-center gap-1.5">
                    <Target class="w-4 h-4" />
                    {getQuestionTypeLabel(quiz.questionType)}
                  </span>
                  {#if quiz.maxQuestions}
                    <span class="flex items-center gap-1.5">
                      <BookOpen class="w-4 h-4" />
                      {quiz.maxQuestions} questions
                    </span>
                  {/if}
                </div>

                <!-- Themes Tags -->
                {#if quiz.themes.length > 0}
                  <div class="flex flex-wrap gap-1.5 mt-3">
                    {#each quiz.themes.slice(0, 2) as theme}
                      <span class="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
                        {theme}
                      </span>
                    {/each}
                    {#if quiz.themes.length > 2}
                      <span class="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
                        +{quiz.themes.length - 2}
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>
            </a>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
