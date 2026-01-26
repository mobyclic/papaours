<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Save, X, Tag, BookOpen, GraduationCap, BarChart3, Plus, Trash2, Settings2, Check, Loader2 } from "lucide-svelte";
  import ThemeManagerModal from "./ThemeManagerModal.svelte";

  interface ClassDifficulty {
    classe_id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
  }

  interface Props {
    question: any;
    matieres: Array<{ id: string; name: string; slug: string; icon?: string; color?: string }>;
    themes: Array<{ id: string; name: string; slug: string; matiere_id?: string; matiere_ids?: string[] }>;
    themesByMatiere: Record<string, Array<{ id: string; name: string; slug: string }>>;
    classes: Array<{ id: string; name: string; slug: string; category_id?: string }>;
    classesByCategory: Record<string, Array<{ id: string; name: string; slug: string }>>;
    categoryOrder: string[];
    niveaux: Array<{ id: string; name: string; slug: string; icon?: string; color?: string; points_required?: number }>;
    onSave: (data: any) => void;
    onCancel: () => void;
  }

  let { 
    question, 
    matieres, 
    themes, 
    themesByMatiere, 
    classes, 
    classesByCategory,
    categoryOrder,
    niveaux,
    onSave, 
    onCancel 
  }: Props = $props();

  // Question ID for auto-save
  const questionId = question.id?.toString() || question.id;

  // Form state
  let questionText = $state(question.question || '');
  let explanation = $state(question.explanation || '');
  let options = $state<string[]>(question.options || ['', '', '', '']);
  let correctAnswer = $state<number>(question.correctAnswer ?? 0);
  let isActive = $state(question.isActive ?? true);
  
  // New structured fields
  let selectedMatiereId = $state(question.matiere_id?.toString() || '');
  let selectedThemeIds = $state<string[]>(
    (question.theme_ids || []).map((t: any) => t?.toString() || t)
  );
  
  // Class difficulties (multiple classe/difficulty pairs)
  let classDifficulties = $state<ClassDifficulty[]>(
    question.class_difficulties?.length > 0 
      ? question.class_difficulties.map((cd: any) => ({
          classe_id: cd.classe_id?.toString() || cd.classe_id,
          difficulty: cd.difficulty || 'medium',
          points: cd.points ?? getDefaultPoints(cd.difficulty || 'medium')
        }))
      : []
  );

  // Auto-save states
  let savingMatiereThemes = $state(false);
  let savedMatiereThemes = $state(false);
  let savingClassDifficulties = $state(false);
  let savedClassDifficulties = $state(false);

  // Auto-save function for Matière and Thèmes
  async function autoSaveMatiereThemes() {
    if (!questionId || !selectedMatiereId) return;
    
    savingMatiereThemes = true;
    savedMatiereThemes = false;
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matiere_id: selectedMatiereId,
          theme_ids: selectedThemeIds
        })
      });
      
      if (res.ok) {
        savedMatiereThemes = true;
        setTimeout(() => { savedMatiereThemes = false; }, 2000);
      }
    } catch (error) {
      console.error('Error auto-saving matiere/themes:', error);
    } finally {
      savingMatiereThemes = false;
    }
  }

  // Auto-save function for Class Difficulties
  async function autoSaveClassDifficulties() {
    if (!questionId || classDifficulties.length === 0) return;
    
    savingClassDifficulties = true;
    savedClassDifficulties = false;
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_difficulties: classDifficulties
        })
      });
      
      if (res.ok) {
        savedClassDifficulties = true;
        setTimeout(() => { savedClassDifficulties = false; }, 2000);
      }
    } catch (error) {
      console.error('Error auto-saving class difficulties:', error);
    } finally {
      savingClassDifficulties = false;
    }
  }

  // Debounced auto-save timers
  let matiereThemesSaveTimeout: ReturnType<typeof setTimeout>;
  let classdifficultiesSaveTimeout: ReturnType<typeof setTimeout>;

  function debouncedSaveMatiereThemes() {
    clearTimeout(matiereThemesSaveTimeout);
    matiereThemesSaveTimeout = setTimeout(autoSaveMatiereThemes, 500);
  }

  function debouncedSaveClassDifficulties() {
    clearTimeout(classdifficultiesSaveTimeout);
    classdifficultiesSaveTimeout = setTimeout(autoSaveClassDifficulties, 500);
  }

  // Default points by difficulty
  function getDefaultPoints(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 10;
      case 'medium': return 20;
      case 'hard': return 30;
      default: return 20;
    }
  }

  // Get difficulty label
  function getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  }

  // Get difficulty color class
  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  // Add a new class difficulty
  function addClassDifficulty() {
    // Find a class not yet selected
    const usedClasseIds = new Set(classDifficulties.map(cd => cd.classe_id));
    const availableClasse = classes.find(c => !usedClasseIds.has(c.id));
    
    if (availableClasse) {
      classDifficulties = [...classDifficulties, {
        classe_id: availableClasse.id,
        difficulty: 'medium',
        points: 20
      }];
      debouncedSaveClassDifficulties();
    }
  }

  // Remove a class difficulty
  function removeClassDifficulty(index: number) {
    classDifficulties = classDifficulties.filter((_, i) => i !== index);
    debouncedSaveClassDifficulties();
  }

  // Update difficulty and auto-adjust points
  function updateDifficulty(index: number, newDifficulty: 'easy' | 'medium' | 'hard') {
    classDifficulties = classDifficulties.map((cd, i) => {
      if (i === index) {
        return { ...cd, difficulty: newDifficulty, points: getDefaultPoints(newDifficulty) };
      }
      return cd;
    });
    debouncedSaveClassDifficulties();
  }

  // Update classe for a class difficulty
  function updateClasseId(index: number, newClasseId: string) {
    classDifficulties = classDifficulties.map((cd, i) => {
      if (i === index) {
        return { ...cd, classe_id: newClasseId };
      }
      return cd;
    });
    debouncedSaveClassDifficulties();
  }

  // Update points for a class difficulty
  function updatePoints(index: number, newPoints: number) {
    classDifficulties = classDifficulties.map((cd, i) => {
      if (i === index) {
        return { ...cd, points: newPoints };
      }
      return cd;
    });
    debouncedSaveClassDifficulties();
  }

  // Get class name by ID
  function getClassName(classeId: string): string {
    return classes.find(c => c.id === classeId)?.name || 'Inconnu';
  }

  // Get available classes (not yet selected)
  function getAvailableClasses(currentClasseId: string): Array<{ id: string; name: string; category_id?: string }> {
    const usedIds = new Set(classDifficulties.map(cd => cd.classe_id));
    return classes.filter(c => c.id === currentClasseId || !usedIds.has(c.id));
  }

  // Derived: themes filtered by selected matiere
  let availableThemes = $derived.by(() => {
    if (!selectedMatiereId) return themes;
    return themesByMatiere[selectedMatiereId] || [];
  });

  // Handle matiere change - reset themes if not compatible + auto-save
  function handleMatiereChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedMatiereId = target.value;
    // Filter out themes that don't belong to this matiere
    if (target.value) {
      const validThemeIds = new Set((themesByMatiere[target.value] || []).map(t => t.id));
      selectedThemeIds = selectedThemeIds.filter(id => validThemeIds.has(id));
    }
    debouncedSaveMatiereThemes();
  }

  // Toggle theme selection + auto-save
  function toggleTheme(themeId: string) {
    if (selectedThemeIds.includes(themeId)) {
      selectedThemeIds = selectedThemeIds.filter(id => id !== themeId);
    } else {
      selectedThemeIds = [...selectedThemeIds, themeId];
    }
    debouncedSaveMatiereThemes();
  }

  // Theme manager modal state
  let themeModalOpen = $state(false);

  // Handle themes selected from modal + auto-save
  function handleThemesSelected(themeIds: string[]) {
    selectedThemeIds = themeIds;
    debouncedSaveMatiereThemes();
  }

  // Get theme name by ID
  function getThemeName(themeId: string): string {
    return themes.find(t => t.id === themeId)?.name || 'Inconnu';
  }

  // Add/remove option
  function addOption() {
    options = [...options, ''];
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      const wasCorrect = correctAnswer === index;
      options = options.filter((_, i) => i !== index);
      if (wasCorrect && correctAnswer >= options.length) {
        correctAnswer = 0;
      } else if (correctAnswer > index) {
        correctAnswer--;
      }
    }
  }

  function handleSubmit() {
    // Validate
    if (!questionText.trim()) {
      alert('La question est obligatoire');
      return;
    }
    if (!selectedMatiereId) {
      alert('Veuillez sélectionner une matière');
      return;
    }
    if (options.filter(o => o.trim()).length < 2) {
      alert('Au moins 2 options sont requises');
      return;
    }
    if (classDifficulties.length === 0) {
      alert('Veuillez ajouter au moins un niveau scolaire avec sa difficulté');
      return;
    }

    onSave({
      question: questionText,
      explanation,
      options: options.filter(o => o.trim()),
      correctAnswer,
      isActive,
      matiere_id: selectedMatiereId,
      theme_ids: selectedThemeIds,
      class_difficulties: classDifficulties
    });
  }
</script>

<div class="space-y-8">
  <!-- Type de question (read-only) -->
  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <div class="flex items-center gap-2 text-gray-700">
      <span class="text-lg">📝</span>
      <span class="font-medium">Type : QCM (choix unique)</span>
      <span class="text-sm text-gray-500 ml-2">— Le type ne peut pas être modifié</span>
    </div>
  </div>

  <!-- Question principale -->
  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <BookOpen class="w-5 h-5 text-purple-600" />
      Question
    </h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Énoncé de la question *
        </label>
        <textarea
          bind:value={questionText}
          rows={3}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Saisissez l'énoncé de la question..."
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Options de réponse
        </label>
        <div class="space-y-3">
          {#each options as option, i}
            <div class="flex items-center gap-3">
              <button
                type="button"
                onclick={() => correctAnswer = i}
                class="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all {correctAnswer === i ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}"
                title={correctAnswer === i ? 'Bonne réponse' : 'Marquer comme bonne réponse'}
              >
                {#if correctAnswer === i}✓{/if}
              </button>
              <input
                type="text"
                bind:value={options[i]}
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Option {i + 1}"
              />
              {#if options.length > 2}
                <button
                  type="button"
                  onclick={() => removeOption(i)}
                  class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              {/if}
            </div>
          {/each}
        </div>
        <button
          type="button"
          onclick={addOption}
          class="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          + Ajouter une option
        </button>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Explication (affichée après la réponse)
        </label>
        <textarea
          bind:value={explanation}
          rows={2}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Expliquez pourquoi cette réponse est correcte..."
        ></textarea>
      </div>
    </div>
  </div>

  <!-- Matière et Thèmes -->
  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Tag class="w-5 h-5 text-blue-600" />
        Matière et Thèmes
        {#if savingMatiereThemes}
          <span class="flex items-center text-xs text-gray-400 font-normal ml-2">
            <Loader2 class="w-3 h-3 animate-spin mr-1" />
            Enregistrement...
          </span>
        {:else if savedMatiereThemes}
          <span class="flex items-center text-xs text-green-600 font-normal ml-2">
            <Check class="w-3 h-3 mr-1" />
            Enregistré
          </span>
        {/if}
      </h2>
      <Button 
        variant="outline" 
        size="sm" 
        onclick={() => themeModalOpen = true}
        class="text-blue-600 border-blue-300 hover:bg-blue-50"
      >
        <Settings2 class="w-4 h-4 mr-1" />
        Gérer les thèmes
      </Button>
    </div>

    <div class="space-y-6">
      <!-- Matière -->
      <div>
        <label for="matiere" class="block text-sm font-medium text-gray-700 mb-2">
          Matière *
        </label>
        <select
          id="matiere"
          value={selectedMatiereId}
          onchange={handleMatiereChange}
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">Sélectionner une matière...</option>
          {#each matieres as matiere}
            <option value={matiere.id}>
              {matiere.icon || ''} {matiere.name}
            </option>
          {/each}
        </select>
      </div>

      <!-- Thèmes sélectionnés -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Thèmes <span class="text-gray-400 font-normal">({selectedThemeIds.length} sélectionné{selectedThemeIds.length !== 1 ? 's' : ''})</span>
        </label>
        
        {#if selectedThemeIds.length === 0}
          <div class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Tag class="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p class="text-gray-500">Aucun thème sélectionné</p>
            <button
              type="button"
              onclick={() => themeModalOpen = true}
              class="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Cliquez pour ajouter des thèmes
            </button>
          </div>
        {:else}
          <div class="flex flex-wrap gap-2">
            {#each selectedThemeIds as themeId}
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {getThemeName(themeId)}
                <button
                  type="button"
                  onclick={() => toggleTheme(themeId)}
                  class="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X class="w-3 h-3" />
                </button>
              </span>
            {/each}
          </div>
          <button
            type="button"
            onclick={() => themeModalOpen = true}
            class="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Ajouter ou modifier des thèmes
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Theme Manager Modal -->
  <ThemeManagerModal
    bind:open={themeModalOpen}
    {matieres}
    {selectedThemeIds}
    prefilterMatiereId={selectedMatiereId}
    onSelect={handleThemesSelected}
    onClose={() => themeModalOpen = false}
  />

  <!-- Niveau scolaire et Difficulté -->
  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <GraduationCap class="w-5 h-5 text-green-600" />
        Niveau et Difficulté
        {#if savingClassDifficulties}
          <span class="flex items-center text-xs text-gray-400 font-normal ml-2">
            <Loader2 class="w-3 h-3 animate-spin mr-1" />
            Enregistrement...
          </span>
        {:else if savedClassDifficulties}
          <span class="flex items-center text-xs text-green-600 font-normal ml-2">
            <Check class="w-3 h-3 mr-1" />
            Enregistré
          </span>
        {/if}
      </h2>
      <Button 
        variant="outline" 
        size="sm" 
        onclick={addClassDifficulty}
        disabled={classDifficulties.length >= classes.length}
        class="text-green-600 border-green-300 hover:bg-green-50"
      >
        <Plus class="w-4 h-4 mr-1" />
        Ajouter un niveau
      </Button>
    </div>

    <p class="text-sm text-gray-500 mb-4">
      Définissez la difficulté de cette question pour chaque niveau scolaire. 
      Les points seront attribués selon la difficulté.
    </p>

    {#if classDifficulties.length === 0}
      <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <GraduationCap class="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p class="text-gray-500">Aucun niveau scolaire défini</p>
        <p class="text-sm text-gray-400">Cliquez sur "Ajouter un niveau" pour commencer</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each classDifficulties as cd, index (index)}
          <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <!-- Classe selector -->
            <div class="flex-1 min-w-[150px]">
              <label class="block text-xs font-medium text-gray-500 mb-1">Classe</label>
              <select
                value={cd.classe_id}
                onchange={(e) => updateClasseId(index, (e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                {#each categoryOrder as category}
                  {#if classesByCategory[category]?.some(c => c.id === cd.classe_id || !classDifficulties.some(existing => existing.classe_id === c.id && existing !== cd))}
                    <optgroup label={category}>
                      {#each classesByCategory[category] || [] as classe}
                        {#if classe.id === cd.classe_id || !classDifficulties.some(existing => existing.classe_id === classe.id && existing !== cd)}
                          <option value={classe.id}>{classe.name}</option>
                        {/if}
                      {/each}
                    </optgroup>
                  {/if}
                {/each}
              </select>
            </div>

            <!-- Difficulty buttons -->
            <div class="flex-1">
              <label class="block text-xs font-medium text-gray-500 mb-1">Difficulté</label>
              <div class="flex gap-1">
                {#each [
                  { value: 'easy', label: 'Facile', color: 'green' },
                  { value: 'medium', label: 'Moyen', color: 'yellow' },
                  { value: 'hard', label: 'Difficile', color: 'red' }
                ] as d}
                  <button
                    type="button"
                    onclick={() => updateDifficulty(index, d.value as 'easy' | 'medium' | 'hard')}
                    class="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all border-2 {cd.difficulty === d.value 
                      ? d.color === 'green' ? 'bg-green-100 text-green-700 border-green-400' 
                      : d.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-400' 
                      : 'bg-red-100 text-red-700 border-red-400'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}"
                  >
                    {d.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Points -->
            <div class="w-24">
              <label class="block text-xs font-medium text-gray-500 mb-1">Points</label>
              <input
                type="number"
                value={cd.points}
                onchange={(e) => updatePoints(index, parseInt((e.target as HTMLInputElement).value) || 20)}
                min="1"
                max="100"
                class="w-full px-3 py-2 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <!-- Remove button -->
            <button
              type="button"
              onclick={() => removeClassDifficulty(index)}
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
              title="Supprimer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        {/each}
      </div>

      <!-- Summary -->
      <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-blue-700">
          <strong>Résumé :</strong> Cette question est définie pour 
          {classDifficulties.length} niveau{classDifficulties.length > 1 ? 'x' : ''} scolaire{classDifficulties.length > 1 ? 's' : ''}.
          Points attribuables : {classDifficulties.map(cd => cd.points).join(', ')} pts.
        </p>
      </div>
    {/if}
  </div>

  <!-- Statut -->
  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <BarChart3 class="w-5 h-5 text-orange-600" />
      Statut
    </h2>
    
    <label class="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        bind:checked={isActive}
        class="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
      />
      <span class="text-gray-700">Question active</span>
      <span class="text-sm text-gray-500">(visible dans les quiz)</span>
    </label>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
    <Button variant="outline" onclick={onCancel}>
      Annuler
    </Button>
    <Button onclick={handleSubmit} class="bg-purple-600 hover:bg-purple-700">
      <Save class="w-4 h-4 mr-2" />
      Enregistrer
    </Button>
  </div>
</div>
