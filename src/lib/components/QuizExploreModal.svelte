<script lang="ts">
  import { goto } from '$app/navigation';
  import { 
    X, Search, BookOpen, Target, Clock, Sparkles, Filter,
    ChevronRight, Star, Flame, Trophy, SlidersHorizontal
  } from 'lucide-svelte';
  import FavoriteButton from './FavoriteButton.svelte';

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

  interface Props {
    open: boolean;
    onClose: () => void;
    onSelectQuiz?: (quiz: Quiz) => void;
  }

  let { open = $bindable(), onClose, onSelectQuiz }: Props = $props();

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
    { value: '', label: 'Toutes', stars: '' },
    { value: '1', label: 'Facile', stars: '⭐' },
    { value: '2', label: 'Moyen', stars: '⭐⭐' },
    { value: '3', label: 'Difficile', stars: '⭐⭐⭐' }
  ];

  const matiereColors: Record<string, string> = {
    'Mathématiques': 'from-blue-500 to-blue-600',
    'Français': 'from-red-500 to-red-600',
    'Histoire': 'from-amber-500 to-amber-600',
    'Géographie': 'from-green-500 to-green-600',
    'Sciences': 'from-purple-500 to-purple-600',
    'Physique/Chimie': 'from-cyan-500 to-cyan-600',
    'SVT': 'from-lime-500 to-lime-600',
    'Anglais': 'from-pink-500 to-pink-600',
    'Musique': 'from-indigo-500 to-indigo-600',
    'default': 'from-gray-500 to-gray-600'
  };

  $effect(() => {
    if (open) {
      loadQuizzes();
    }
  });

  async function loadQuizzes() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (selectedMatiere) params.set('matiere', selectedMatiere);
      if (selectedTheme) params.set('theme', selectedTheme);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/quiz/explore?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        quizzes = data.quizzes;
        total = data.total;
        
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

  function selectQuiz(quiz: Quiz) {
    if (onSelectQuiz) {
      onSelectQuiz(quiz);
    } else {
      goto(`/quiz/${quiz.slug}`);
    }
    onClose();
  }

  let hasActiveFilters = $derived(
    selectedMatiere || selectedTheme || selectedDifficulty || searchQuery.trim()
  );
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="button"
    tabindex="-1"
  ></div>

  <!-- Modal -->
  <div class="fixed inset-4 md:inset-10 lg:inset-16 bg-gray-900 rounded-2xl z-50 flex flex-col border border-gray-800 shadow-2xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 md:p-6 border-b border-gray-800 bg-gray-900/95">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
          <Sparkles class="w-5 h-5 text-gray-900" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Explorer les Quiz</h2>
          <p class="text-sm text-gray-400">{total} quiz disponibles</p>
        </div>
      </div>
      <button
        onclick={onClose}
        class="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
      >
        <X class="w-6 h-6" />
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="p-4 md:px-6 border-b border-gray-800 bg-gray-900/80">
      <div class="flex flex-col md:flex-row gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un quiz..."
            bind:value={searchQuery}
            onkeydown={(e) => e.key === 'Enter' && loadQuizzes()}
            class="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
        </div>
        
        <!-- Filter Toggle -->
        <button
          onclick={() => showFilters = !showFilters}
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-colors"
        >
          <SlidersHorizontal class="w-5 h-5" />
          <span>Filtres</span>
          {#if hasActiveFilters}
            <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
          {/if}
        </button>

        <button
          onclick={loadQuizzes}
          class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl transition-colors"
        >
          Rechercher
        </button>
      </div>

      <!-- Filters Panel -->
      {#if showFilters}
        <div class="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label class="text-xs text-gray-500 mb-1.5 block">Matière</label>
            <select
              bind:value={selectedMatiere}
              onchange={() => { selectedTheme = ''; loadQuizzes(); }}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="">Toutes</option>
              {#each matieres as m}
                <option value={m.id}>{m.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 mb-1.5 block">Thème</label>
            <select
              bind:value={selectedTheme}
              onchange={loadQuizzes}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="">Tous</option>
              {#each filteredThemes as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 mb-1.5 block">Difficulté</label>
            <select
              bind:value={selectedDifficulty}
              onchange={loadQuizzes}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {#each difficultyLevels as d}
                <option value={d.value}>{d.stars} {d.label}</option>
              {/each}
            </select>
          </div>

          <div class="flex items-end">
            {#if hasActiveFilters}
              <button
                onclick={clearFilters}
                class="w-full px-3 py-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700 transition-colors"
              >
                Effacer filtres
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Active Filters Tags -->
      {#if hasActiveFilters && !showFilters}
        <div class="flex flex-wrap gap-2 mt-3">
          {#if selectedMatiere}
            {@const m = matieres.find(x => x.id === selectedMatiere)}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
              {m?.name}
              <button onclick={() => { selectedMatiere = ''; selectedTheme = ''; loadQuizzes(); }}>
                <X class="w-3.5 h-3.5" />
              </button>
            </span>
          {/if}
          {#if selectedDifficulty}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
              {difficultyLevels.find(d => d.value === selectedDifficulty)?.label}
              <button onclick={() => { selectedDifficulty = ''; loadQuizzes(); }}>
                <X class="w-3.5 h-3.5" />
              </button>
            </span>
          {/if}
          {#if searchQuery}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
              "{searchQuery}"
              <button onclick={() => { searchQuery = ''; loadQuizzes(); }}>
                <X class="w-3.5 h-3.5" />
              </button>
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Quiz Grid -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      {#if loading}
        <div class="flex items-center justify-center py-16">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      {:else if quizzes.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <BookOpen class="w-8 h-8 text-gray-600" />
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Aucun quiz trouvé</h3>
          <p class="text-gray-400 text-sm mb-4">Essayez de modifier vos filtres</p>
          <button
            onclick={clearFilters}
            class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each quizzes as quiz}
            <button
              onclick={() => selectQuiz(quiz)}
              class="group bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl overflow-hidden transition-all text-left"
            >
              <!-- Cover -->
              <div class="h-28 bg-gradient-to-br {getMatiereGradient(quiz.matiere?.name)} relative">
                {#if quiz.coverImage}
                  <img src={quiz.coverImage} alt={quiz.title} class="w-full h-full object-cover" />
                {:else}
                  <div class="absolute inset-0 flex items-center justify-center opacity-20">
                    <BookOpen class="w-12 h-12 text-white" />
                  </div>
                {/if}
                
                <!-- Difficulty -->
                <div class="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs">
                  {getDifficultyStars(quiz.difficulty_level)}
                </div>

                <!-- Matière -->
                {#if quiz.matiere}
                  <div class="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white">
                    {quiz.matiere.name}
                  </div>
                {/if}

                <!-- Hover overlay -->
                <div class="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div class="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform">
                    <ChevronRight class="w-5 h-5 text-gray-900" />
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="p-3">
                <h3 class="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2 text-sm">
                  {quiz.title}
                </h3>
                
                {#if quiz.description}
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{quiz.description}</p>
                {/if}

                <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  {#if quiz.maxQuestions}
                    <span class="flex items-center gap-1">
                      <Target class="w-3 h-3" />
                      {quiz.maxQuestions}q
                    </span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-800 bg-gray-900/95 flex items-center justify-between">
      <a 
        href="/explore" 
        class="text-sm text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-1"
        onclick={onClose}
      >
        Voir tous les quiz
        <ChevronRight class="w-4 h-4" />
      </a>
      <button
        onclick={onClose}
        class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
      >
        Fermer
      </button>
    </div>
  </div>
{/if}
