<script lang="ts">
  import { Sparkles, Loader2, Plus, Check, X, RefreshCw, Wand2, Copy, Save, AlertTriangle } from 'lucide-svelte';

  interface GeneratedQuestion {
    question: string;
    options?: string[];
    correctAnswer?: number | boolean;
    correctAnswers?: number[];
    blanks?: string[];
    leftItems?: string[];
    rightItems?: string[];
    correctMatches?: Record<string, string>;
    items?: string[];
    correctOrder?: number[];
    explanation: string;
    difficulty: string;
    questionType: string;
    // Doublons
    isPotentialDuplicate?: boolean;
    duplicateSimilarity?: number;
    similarTo?: string;
  }

  interface Matiere {
    id: string;
    name: string;
    slug: string;
  }

  interface Theme {
    id: string;
    name: string;
    matiere_id?: string;
  }

  interface Classe {
    id: string;
    name: string;
  }

  // Props
  let { 
    matieres = [],
    themes = [],
    classes = [],
    onSaveQuestion 
  }: { 
    matieres?: Matiere[];
    themes?: Theme[];
    classes?: Classe[];
    onSaveQuestion?: (question: any) => void;
  } = $props();

  // State
  let isOpen = $state(false);
  let loading = $state(false);
  let error = $state('');
  let duplicatesInfo = $state({ found: 0, existing: 0 });
  
  // Form state
  let topic = $state('');
  let selectedMatiere = $state('');
  let selectedTheme = $state('');
  let selectedClasse = $state('');
  let difficulty = $state(1);
  let questionType = $state('qcm');
  let count = $state(1);
  let additionalInstructions = $state('');

  // Results
  let generatedQuestions = $state<GeneratedQuestion[]>([]);
  let selectedQuestions = $state<Set<number>>(new Set());

  // Filtered themes based on selected matière
  let filteredThemes = $derived(
    selectedMatiere 
      ? themes.filter(t => t.matiere_id === selectedMatiere)
      : themes
  );

  const questionTypes = [
    { value: 'qcm', label: 'QCM (choix unique)', icon: '📝' },
    { value: 'qcm_multiple', label: 'QCM (choix multiples)', icon: '☑️' },
    { value: 'true_false', label: 'Vrai / Faux', icon: '✅' },
    { value: 'fill_blank', label: 'Texte à trous', icon: '📋' },
    { value: 'matching', label: 'Association', icon: '🔗' },
    { value: 'ordering', label: 'Classement', icon: '📊' }
  ];

  const difficultyLevels = [
    { value: 1, label: 'Facile', emoji: '🟢' },
    { value: 2, label: 'Moyen', emoji: '🟡' },
    { value: 3, label: 'Difficile', emoji: '🔴' }
  ];

  function openModal() {
    isOpen = true;
    generatedQuestions = [];
    selectedQuestions.clear();
    error = '';
  }

  function closeModal() {
    isOpen = false;
  }

  async function generateQuestions() {
    if (!topic.trim()) {
      error = 'Veuillez entrer un sujet';
      return;
    }

    loading = true;
    error = '';
    generatedQuestions = [];
    selectedQuestions.clear();
    duplicatesInfo = { found: 0, existing: 0 };

    try {
      const matiereName = matieres.find(m => m.id === selectedMatiere)?.name;
      const themeName = themes.find(t => t.id === selectedTheme)?.name;
      const classeName = classes.find(c => c.id === selectedClasse)?.name;

      const res = await fetch('/api/admin/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          matiere: matiereName,
          matiereId: selectedMatiere,
          theme: themeName,
          themeId: selectedTheme,
          classe: classeName,
          difficulty,
          questionType,
          count,
          additionalInstructions: additionalInstructions.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Erreur lors de la génération';
        return;
      }

      generatedQuestions = data.questions || [];
      duplicatesInfo = { 
        found: data.duplicatesFound || 0, 
        existing: data.existingQuestionsCount || 0 
      };
      
      if (generatedQuestions.length === 0) {
        error = 'Aucune question générée. Essayez avec un autre sujet.';
      }

    } catch (e) {
      console.error('Erreur:', e);
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }

  function toggleQuestionSelection(index: number) {
    if (selectedQuestions.has(index)) {
      selectedQuestions.delete(index);
    } else {
      selectedQuestions.add(index);
    }
    selectedQuestions = new Set(selectedQuestions);
  }

  function selectAllQuestions() {
    generatedQuestions.forEach((_, i) => selectedQuestions.add(i));
    selectedQuestions = new Set(selectedQuestions);
  }

  function saveSelectedQuestions() {
    selectedQuestions.forEach(index => {
      const q = generatedQuestions[index];
      if (q && onSaveQuestion) {
        onSaveQuestion({
          ...q,
          matiere_id: selectedMatiere,
          theme_ids: selectedTheme ? [selectedTheme] : [],
          classe_id: selectedClasse,
          difficulty_level: difficulty,
          isActive: true
        });
      }
    });
    closeModal();
  }

  function formatQuestionPreview(q: GeneratedQuestion): string {
    switch (q.questionType) {
      case 'qcm':
      case 'qcm_multiple':
        return `${q.options?.length || 0} options`;
      case 'true_false':
        return q.correctAnswer ? 'Vrai' : 'Faux';
      case 'fill_blank':
        return `${q.blanks?.length || 0} trou(s)`;
      case 'matching':
        return `${q.leftItems?.length || 0} paires`;
      case 'ordering':
        return `${q.items?.length || 0} éléments`;
      default:
        return '';
    }
  }
</script>

<!-- Trigger Button -->
<button
  onclick={openModal}
  class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
>
  <Wand2 class="w-5 h-5" />
  Générer avec l'IA
</button>

<!-- Modal -->
{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" tabindex="-1" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
              <Sparkles class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Générateur de Questions IA</h2>
              <p class="text-sm text-gray-600">Créez des questions pédagogiques en quelques clics</p>
            </div>
          </div>
          <button onclick={closeModal} class="p-2 hover:bg-gray-100 rounded-lg">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Form -->
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <!-- Left Column - Main Input -->
          <div class="space-y-4">
            <div>
              <label for="ai-topic" class="block text-sm font-medium text-gray-700 mb-1">
                Sujet / Thème de la question *
              </label>
              <textarea
                id="ai-topic"
                bind:value={topic}
                placeholder="Ex: Les propriétés de la matière, La Révolution française, Les fractions..."
                rows="3"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              ></textarea>
            </div>

            <div>
              <label for="ai-instructions" class="block text-sm font-medium text-gray-700 mb-1">
                Instructions supplémentaires (optionnel)
              </label>
              <textarea
                id="ai-instructions"
                bind:value={additionalInstructions}
                placeholder="Ex: Ajouter des pièges courants, Utiliser des exemples concrets du quotidien..."
                rows="2"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
              ></textarea>
            </div>

            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Type de question</span>
              <div class="grid grid-cols-2 gap-2" role="group" aria-label="Type de question">
                {#each questionTypes as type}
                  <button
                    type="button"
                    onclick={() => questionType = type.value}
                    class="px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition-all
                      {questionType === type.value 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 hover:border-gray-300'}"
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <!-- Right Column - Options -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="ai-matiere" class="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                <select
                  id="ai-matiere"
                  bind:value={selectedMatiere}
                  onchange={() => selectedTheme = ''}
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Toutes</option>
                  {#each matieres as m}
                    <option value={m.id}>{m.name}</option>
                  {/each}
                </select>
              </div>

              <div>
                <label for="ai-theme" class="block text-sm font-medium text-gray-700 mb-1">Thème</label>
                <select
                  id="ai-theme"
                  bind:value={selectedTheme}
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Tous</option>
                  {#each filteredThemes as t}
                    <option value={t.id}>{t.name}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="ai-classe" class="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select
                  id="ai-classe"
                  bind:value={selectedClasse}
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Toutes</option>
                  {#each classes as c}
                    <option value={c.id}>{c.name}</option>
                  {/each}
                </select>
              </div>

              <div>
                <label for="ai-count" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <select
                  id="ai-count"
                  bind:value={count}
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {#each [1, 2, 3, 5, 10] as n}
                    <option value={n}>{n} question{n > 1 ? 's' : ''}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Difficulté</span>
              <div class="flex gap-2" role="group" aria-label="Niveau de difficulté">
                {#each difficultyLevels as level}
                  <button
                    type="button"
                    onclick={() => difficulty = level.value}
                    class="flex-1 px-3 py-2 text-sm border rounded-lg flex items-center justify-center gap-2 transition-all
                      {difficulty === level.value 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 hover:border-gray-300'}"
                  >
                    <span>{level.emoji}</span>
                    <span>{level.label}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Generate Button -->
            <button
              onclick={generateQuestions}
              disabled={loading || !topic.trim()}
              class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {#if loading}
                <Loader2 class="w-5 h-5 animate-spin" />
                Génération en cours...
              {:else}
                <Sparkles class="w-5 h-5" />
                Générer {count} question{count > 1 ? 's' : ''}
              {/if}
            </button>
          </div>
        </div>

        <!-- Error -->
        {#if error}
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
            <X class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        {/if}

        <!-- Results -->
        {#if generatedQuestions.length > 0}
          <div class="border-t border-gray-200 pt-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold text-gray-800">
                  Questions générées ({generatedQuestions.length})
                </h3>
                {#if duplicatesInfo.existing > 0}
                  <p class="text-xs text-gray-500">
                    {duplicatesInfo.existing} questions existantes analysées
                    {#if duplicatesInfo.found > 0}
                      • <span class="text-amber-600">{duplicatesInfo.found} doublon(s) potentiel(s) détecté(s)</span>
                    {/if}
                  </p>
                {/if}
              </div>
              <div class="flex gap-2">
                <button
                  onclick={selectAllQuestions}
                  class="text-sm text-purple-600 hover:text-purple-700"
                >
                  Tout sélectionner
                </button>
                <button
                  onclick={generateQuestions}
                  class="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                >
                  <RefreshCw class="w-4 h-4" />
                  Régénérer
                </button>
              </div>
            </div>

            <div class="space-y-3">
              {#each generatedQuestions as q, index}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="border rounded-xl p-4 transition-all cursor-pointer
                    {q.isPotentialDuplicate 
                      ? 'border-amber-400 bg-amber-50' 
                      : selectedQuestions.has(index) 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'}"
                  role="checkbox"
                  aria-checked={selectedQuestions.has(index)}
                  tabindex="0"
                  onclick={() => toggleQuestionSelection(index)}
                  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleQuestionSelection(index)}
                >
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                      <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center
                        {selectedQuestions.has(index) 
                          ? 'border-purple-500 bg-purple-500' 
                          : 'border-gray-300'}">
                        {#if selectedQuestions.has(index)}
                          <Check class="w-4 h-4 text-white" />
                        {/if}
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {questionTypes.find(t => t.value === q.questionType)?.label || q.questionType}
                        </span>
                        <span class="text-xs text-gray-500">
                          {formatQuestionPreview(q)}
                        </span>
                        {#if q.isPotentialDuplicate}
                          <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                            <AlertTriangle class="w-3 h-3" />
                            Doublon potentiel ({q.duplicateSimilarity}%)
                          </span>
                        {/if}
                      </div>
                      <p class="font-medium text-gray-800">{q.question}</p>
                      
                      {#if q.isPotentialDuplicate && q.similarTo}
                        <div class="mt-1 p-2 bg-amber-100/50 rounded text-xs text-amber-800">
                          <strong>Question similaire existante :</strong> "{q.similarTo}"
                        </div>
                      {/if}
                      
                      {#if q.options}
                        <div class="mt-2 grid grid-cols-2 gap-1">
                          {#each q.options as opt, i}
                            <div class="text-sm px-2 py-1 rounded
                              {(q.correctAnswer === i || q.correctAnswers?.includes(i))
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-50 text-gray-600'}">
                              {opt}
                            </div>
                          {/each}
                        </div>
                      {/if}

                      {#if q.explanation}
                        <p class="mt-2 text-sm text-gray-500 italic">
                          💡 {q.explanation}
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if generatedQuestions.length > 0}
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">
              {selectedQuestions.size} question{selectedQuestions.size > 1 ? 's' : ''} sélectionnée{selectedQuestions.size > 1 ? 's' : ''}
            </span>
            <div class="flex gap-3">
              <button
                onclick={closeModal}
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onclick={saveSelectedQuestions}
                disabled={selectedQuestions.size === 0}
                class="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save class="w-4 h-4" />
                Ajouter {selectedQuestions.size > 0 ? selectedQuestions.size : ''} question{selectedQuestions.size > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
