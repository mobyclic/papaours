<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { 
    Plus, Edit2, Trash2, Search, Filter, Copy, 
    CheckCircle, XCircle, BarChart2, Eye, ArrowLeft
  } from "lucide-svelte";
  import { QUESTION_TYPES, AVAILABLE_LANGUAGES } from "$lib/types/question";

  let { data } = $props();

  let questions = $derived(data.questions || []);
  let levels = $derived(data.levels || []);
  let currentTheme = $derived(data.currentTheme || { name: 'Thème' });
  
  let search = $state('');
  let filterLevel = $state('');
  let filterType = $state('');
  let showFilters = $state(false);

  let filteredQuestions = $derived.by(() => {
    let result = questions;
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((q: any) => 
        q.translations.some((t: any) => t.title?.toLowerCase().includes(s))
      );
    }
    
    if (filterLevel) {
      result = result.filter((q: any) => q.level_id === filterLevel);
    }
    
    if (filterType) {
      result = result.filter((q: any) => q.type === filterType);
    }
    
    return result;
  });

  function getTypeLabel(type: string) {
    return QUESTION_TYPES.find(t => t.value === type)?.label || type;
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'qcm': return 'bg-blue-100 text-blue-700';
      case 'qcm_multiple': return 'bg-blue-100 text-blue-700';
      case 'true_false': return 'bg-green-100 text-green-700';
      case 'open_short': return 'bg-purple-100 text-purple-700';
      case 'open_long': return 'bg-purple-100 text-purple-700';
      case 'matching': return 'bg-cyan-100 text-cyan-700';
      case 'ordering': return 'bg-teal-100 text-teal-700';
      case 'media_analysis': return 'bg-orange-100 text-orange-700';
      case 'error_spotting': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  function getLanguages(question: any) {
    return question.translations.map((t: any) => 
      AVAILABLE_LANGUAGES.find(l => l.code === t.language)?.flag || t.language
    ).join(' ');
  }

  function getTitle(question: any) {
    const defaultTrans = question.translations.find((t: any) => t.language === question.default_language);
    return defaultTrans?.title || question.translations[0]?.title || 'Sans titre';
  }

  function clearFilters() {
    filterLevel = '';
    filterType = '';
  }
</script>

<svelte:head>
  <title>Questions - {currentTheme.name} - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/dashboard/questions" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Toutes les questions
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Questions - {currentTheme.name}</h1>
        <p class="text-gray-600 mt-1">{questions.length} question{questions.length > 1 ? 's' : ''} dans ce thème</p>
      </div>
      <Button class="bg-indigo-600 hover:bg-indigo-700" onclick={() => window.location.href = '/admin/dashboard/questions/new'}>
        <Plus class="w-4 h-4 mr-2" />
        Nouvelle question
      </Button>
    </div>
  </div>

  <!-- Search & Filters -->
  <div class="mb-6 space-y-4">
    <div class="flex gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une question..."
          bind:value={search}
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button 
        onclick={() => showFilters = !showFilters}
        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        class:bg-indigo-50={showFilters}
        class:border-indigo-300={showFilters}
      >
        <Filter class="w-4 h-4" />
        Filtres
        {#if filterLevel || filterType}
          <span class="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
            {[filterLevel, filterType].filter(Boolean).length}
          </span>
        {/if}
      </button>
    </div>

    {#if showFilters}
      <div class="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <select 
          bind:value={filterLevel}
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les niveaux</option>
          {#each levels as level}
            <option value={level.id}>{level.name}</option>
          {/each}
        </select>
        
        <select 
          bind:value={filterType}
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les types</option>
          {#each QUESTION_TYPES as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>

        {#if filterLevel || filterType}
          <button 
            onclick={clearFilters}
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Effacer les filtres
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Stats for this theme -->
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-2xl font-bold text-gray-900">{questions.length}</p>
      <p class="text-sm text-gray-500">Questions totales</p>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-2xl font-bold text-green-600">{questions.filter((q: any) => q.is_active).length}</p>
      <p class="text-sm text-gray-500">Questions actives</p>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-2xl font-bold text-blue-600">{questions.filter((q: any) => q.type === 'qcm' || q.type === 'qcm_multiple').length}</p>
      <p class="text-sm text-gray-500">QCM</p>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-2xl font-bold text-purple-600">
        {Math.round(questions.reduce((acc: number, q: any) => acc + q.difficulty_weight, 0) / Math.max(questions.length, 1))}
      </p>
      <p class="text-sm text-gray-500">Difficulté moyenne</p>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Question</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Niveau</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Langues</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utilisations</th>
          <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
          <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredQuestions as question (question.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="max-w-md">
                <p class="text-sm font-medium text-gray-900 truncate">{getTitle(question)}</p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                {getTypeLabel(question.type)}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {question.level_name}
              </span>
            </td>
            <td class="px-6 py-4 text-lg">{getLanguages(question)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">
              <span class="inline-flex items-center gap-1">
                <BarChart2 class="w-4 h-4 text-gray-400" />
                {question.usage_count || 0} quiz
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              {#if question.is_active}
                <span class="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle class="w-4 h-4" />
                  Actif
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 text-gray-400">
                  <XCircle class="w-4 h-4" />
                  Inactif
                </span>
              {/if}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <a href="/admin/dashboard/questions/{question.id}" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Aperçu">
                  <Eye class="w-4 h-4 text-gray-600" />
                </a>
                <a href="/admin/dashboard/questions/{question.id}/edit" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Éditer">
                  <Edit2 class="w-4 h-4 text-gray-600" />
                </a>
                <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Dupliquer">
                  <Copy class="w-4 h-4 text-gray-600" />
                </button>
                <button class="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if filteredQuestions.length === 0}
      <div class="px-6 py-12 text-center">
        <p class="text-gray-500 text-sm">Aucune question trouvée dans ce thème</p>
        <a href="/admin/dashboard/questions/new">
          <Button class="mt-4 bg-indigo-600 hover:bg-indigo-700">
            <Plus class="w-4 h-4 mr-2" />
            Créer une question
          </Button>
        </a>
      </div>
    {/if}
  </div>
</div>
