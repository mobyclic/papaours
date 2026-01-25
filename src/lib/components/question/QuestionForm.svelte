<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { 
    Plus, Trash2, GripVertical, Globe, Image, Music, Video,
    ArrowRight, AlertTriangle
  } from "lucide-svelte";
  import { 
    QUESTION_TYPES, AVAILABLE_LANGUAGES, 
    type QuestionType, type Question, type Answer, 
    type MatchingPair, type OrderingItem, type MediaError,
    type QuestionTranslation
  } from "$lib/types/question";

  interface Props {
    question: Partial<Question>;
    themes: { id: string; name: string }[];
    levels: { id: string; name: string }[];
    onSave: (question: Partial<Question>) => void;
    onCancel: () => void;
  }

  let { question: initialQuestion, themes, levels, onSave, onCancel }: Props = $props();

  // Helper to get initial values (captures once at mount)
  function getInitialValue<T>(value: T | undefined, defaultValue: T): T {
    return value ?? defaultValue;
  }

  // Form state - Initialize from question or defaults (captures initial values intentionally)
  let questionType = $state<QuestionType>(getInitialValue(initialQuestion.type, 'qcm'));
  let themeId = $state(getInitialValue(initialQuestion.theme_id, ''));
  let levelId = $state(getInitialValue(initialQuestion.level_id, ''));
  let defaultLanguage = $state(getInitialValue(initialQuestion.default_language, 'fr'));
  let selectedLanguages = $state<string[]>(
    initialQuestion.translations?.map(t => t.language) || ['fr']
  );
  let pointsTotal = $state(getInitialValue(initialQuestion.points_total, 10));
  let timeLimit = $state<number | undefined>(initialQuestion.time_limit);
  let difficultyWeight = $state(getInitialValue(initialQuestion.difficulty_weight, 5));
  let isActive = $state(initialQuestion.is_active ?? true);
  let requireJustification = $state(getInitialValue(initialQuestion.require_justification, false));
  let minWords = $state(initialQuestion.min_words);
  let maxWords = $state(initialQuestion.max_words);

  // Media
  let imageUrl = $state(getInitialValue(initialQuestion.image_url, ''));
  let audioUrl = $state(getInitialValue(initialQuestion.audio_url, ''));
  let videoUrl = $state(getInitialValue(initialQuestion.video_url, ''));

  // Translations
  let translations = $state<Record<string, QuestionTranslation>>(
    Object.fromEntries(
      (initialQuestion.translations || [{ language: 'fr', title: '' }])
        .map(t => [t.language, { ...t }])
    )
  );

  // Answers (for QCM, true_false)
  let answers = $state<Answer[]>(
    initialQuestion.answers || [
      { id: crypto.randomUUID(), text: '', points: 10, is_correct: true, order: 1 },
      { id: crypto.randomUUID(), text: '', points: 0, is_correct: false, order: 2 },
    ]
  );

  // Matching pairs
  let matchingPairs = $state<MatchingPair[]>(
    initialQuestion.matching_pairs || [
      { id: crypto.randomUUID(), left: '', right: '' },
      { id: crypto.randomUUID(), left: '', right: '' },
    ]
  );

  // Ordering items
  let orderingItems = $state<OrderingItem[]>(
    initialQuestion.ordering_items || [
      { id: crypto.randomUUID(), text: '', correct_position: 1 },
      { id: crypto.randomUUID(), text: '', correct_position: 2 },
      { id: crypto.randomUUID(), text: '', correct_position: 3 },
    ]
  );

  // Media errors
  let mediaErrors = $state<MediaError[]>(
    initialQuestion.media_errors || []
  );

  // Type categories for grouping
  const typeCategories = [
    { key: 'knowledge', label: '📚 Connaissances', types: QUESTION_TYPES.filter(t => t.category === 'knowledge') },
    { key: 'open', label: '✍️ Questions ouvertes', types: QUESTION_TYPES.filter(t => t.category === 'open') },
    { key: 'multimedia', label: '🎬 Multimédia', types: QUESTION_TYPES.filter(t => t.category === 'multimedia') },
    { key: 'interactive', label: '🎮 Interactif', types: QUESTION_TYPES.filter(t => t.category === 'interactive') },
  ];

  // Handle type change - setup default answers
  function handleTypeChange(newType: QuestionType) {
    questionType = newType;
    
    // Reset type-specific data
    if (newType === 'true_false') {
      answers = [
        { id: crypto.randomUUID(), text: 'Vrai', points: 10, is_correct: true, order: 1 },
        { id: crypto.randomUUID(), text: 'Faux', points: 0, is_correct: false, order: 2 },
      ];
    } else if (newType === 'qcm' || newType === 'qcm_multiple') {
      if (answers.length < 2) {
        answers = [
          { id: crypto.randomUUID(), text: '', points: 10, is_correct: true, order: 1 },
          { id: crypto.randomUUID(), text: '', points: 0, is_correct: false, order: 2 },
        ];
      }
    }
  }

  // Language management
  function toggleLanguage(langCode: string) {
    if (selectedLanguages.includes(langCode)) {
      if (selectedLanguages.length > 1) {
        selectedLanguages = selectedLanguages.filter(l => l !== langCode);
        delete translations[langCode];
        if (defaultLanguage === langCode) {
          defaultLanguage = selectedLanguages[0];
        }
      }
    } else {
      selectedLanguages = [...selectedLanguages, langCode];
      translations[langCode] = { language: langCode, title: '' };
    }
  }

  // Answer management
  function addAnswer() {
    answers = [...answers, {
      id: crypto.randomUUID(),
      text: '',
      points: 0,
      is_correct: false,
      order: answers.length + 1
    }];
  }

  function removeAnswer(id: string) {
    if (answers.length > 2) {
      answers = answers.filter(a => a.id !== id).map((a, i) => ({ ...a, order: i + 1 }));
    }
  }

  function toggleCorrect(id: string) {
    if (questionType === 'qcm' || questionType === 'true_false') {
      // Single correct answer
      answers = answers.map(a => ({
        ...a,
        is_correct: a.id === id,
        points: a.id === id ? pointsTotal : 0
      }));
    } else {
      // Multiple correct answers
      answers = answers.map(a => 
        a.id === id ? { ...a, is_correct: !a.is_correct } : a
      );
    }
  }

  // Matching management
  function addMatchingPair() {
    matchingPairs = [...matchingPairs, {
      id: crypto.randomUUID(),
      left: '',
      right: ''
    }];
  }

  function removeMatchingPair(id: string) {
    if (matchingPairs.length > 2) {
      matchingPairs = matchingPairs.filter(p => p.id !== id);
    }
  }

  // Ordering management
  function addOrderingItem() {
    orderingItems = [...orderingItems, {
      id: crypto.randomUUID(),
      text: '',
      correct_position: orderingItems.length + 1
    }];
  }

  function removeOrderingItem(id: string) {
    if (orderingItems.length > 2) {
      orderingItems = orderingItems.filter(i => i.id !== id)
        .map((item, idx) => ({ ...item, correct_position: idx + 1 }));
    }
  }

  function moveOrderingItem(id: string, direction: 'up' | 'down') {
    const idx = orderingItems.findIndex(i => i.id === id);
    if (direction === 'up' && idx > 0) {
      const items = [...orderingItems];
      [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      orderingItems = items.map((item, i) => ({ ...item, correct_position: i + 1 }));
    } else if (direction === 'down' && idx < orderingItems.length - 1) {
      const items = [...orderingItems];
      [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      orderingItems = items.map((item, i) => ({ ...item, correct_position: i + 1 }));
    }
  }

  // Media error management
  function addMediaError() {
    mediaErrors = [...mediaErrors, {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      description: ''
    }];
  }

  function removeMediaError(id: string) {
    mediaErrors = mediaErrors.filter(e => e.id !== id);
  }

  // Keywords management (for open questions)
  function addKeyword(langCode: string, keyword: string) {
    if (keyword.trim()) {
      const t = translations[langCode];
      t.keywords = [...(t.keywords || []), keyword.trim()];
      translations[langCode] = t;
    }
  }

  function removeKeyword(langCode: string, keyword: string) {
    const t = translations[langCode];
    t.keywords = (t.keywords || []).filter(k => k !== keyword);
    translations[langCode] = t;
  }

  // Validation
  let isValid = $derived.by(() => {
    const hasTitle = Object.values(translations).some(t => t.title?.trim());
    const hasTheme = !!themeId;
    const hasLevel = !!levelId;
    
    // Type-specific validation
    if (questionType === 'qcm' || questionType === 'qcm_multiple' || questionType === 'true_false') {
      const hasCorrectAnswer = answers.some(a => a.is_correct);
      const hasAnswerText = answers.filter(a => a.text.trim()).length >= 2;
      return hasTitle && hasTheme && hasLevel && hasCorrectAnswer && hasAnswerText;
    }
    
    if (questionType === 'matching') {
      const validPairs = matchingPairs.filter(p => p.left.trim() && p.right.trim()).length >= 2;
      return hasTitle && hasTheme && hasLevel && validPairs;
    }
    
    if (questionType === 'ordering') {
      const validItems = orderingItems.filter(i => i.text.trim()).length >= 2;
      return hasTitle && hasTheme && hasLevel && validItems;
    }
    
    return hasTitle && hasTheme && hasLevel;
  });

  // Save handler
  function handleSave() {
    if (!isValid) return;

    const questionData: Partial<Question> = {
      id: initialQuestion.id,
      type: questionType,
      theme_id: themeId,
      level_id: levelId,
      default_language: defaultLanguage,
      translations: Object.values(translations),
      difficulty_weight: difficultyWeight,
      points_total: pointsTotal,
      time_limit: timeLimit,
      is_active: isActive,
      image_url: imageUrl || undefined,
      audio_url: audioUrl || undefined,
      video_url: videoUrl || undefined,
    };

    // Add type-specific data
    if (['qcm', 'qcm_multiple', 'true_false'].includes(questionType)) {
      questionData.answers = answers;
      questionData.require_justification = questionType === 'true_false' ? requireJustification : undefined;
    }

    if (questionType === 'matching') {
      questionData.matching_pairs = matchingPairs;
    }

    if (questionType === 'ordering') {
      questionData.ordering_items = orderingItems;
    }

    if (['open_short', 'open_long'].includes(questionType)) {
      questionData.min_words = minWords;
      questionData.max_words = maxWords;
    }

    if (questionType === 'error_spotting') {
      questionData.media_errors = mediaErrors;
    }

    onSave(questionData);
  }

  // Current type info
  let currentTypeInfo = $derived(QUESTION_TYPES.find(t => t.value === questionType));
</script>

<div class="space-y-6">
  <!-- Type Selection -->
  <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Type de question</h2>
    
    {#each typeCategories as category}
      <div class="mb-4">
        <p class="text-sm font-medium text-gray-500 mb-2">{category.label}</p>
        <div class="grid grid-cols-3 gap-2">
          {#each category.types as type}
            <button
              type="button"
              onclick={() => handleTypeChange(type.value)}
              class="p-3 rounded-lg border-2 text-left transition-all"
              class:border-indigo-500={questionType === type.value}
              class:bg-indigo-50={questionType === type.value}
              class:border-gray-200={questionType !== type.value}
              class:hover:border-gray-300={questionType !== type.value}
            >
              <div class="flex items-center gap-2">
                <span class="text-xl">{type.icon}</span>
                <span class="text-sm font-medium text-gray-900">{type.label}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Languages -->
  <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Globe class="w-5 h-5 text-gray-500" />
      Langues
    </h2>
    <div class="flex flex-wrap gap-2 mb-4">
      {#each AVAILABLE_LANGUAGES as lang}
        <button
          type="button"
          onclick={() => toggleLanguage(lang.code)}
          class="px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all"
          class:border-indigo-500={selectedLanguages.includes(lang.code)}
          class:bg-indigo-50={selectedLanguages.includes(lang.code)}
          class:border-gray-200={!selectedLanguages.includes(lang.code)}
        >
          <span>{lang.flag}</span>
          <span class="text-sm">{lang.name}</span>
          {#if defaultLanguage === lang.code}
            <span class="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded">Défaut</span>
          {/if}
        </button>
      {/each}
    </div>
    
    {#if selectedLanguages.length > 1}
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-600">Langue par défaut:</span>
        <select bind:value={defaultLanguage} class="px-2 py-1 border border-gray-300 rounded">
          {#each selectedLanguages as langCode}
            {@const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode)}
            <option value={langCode}>{lang?.flag} {lang?.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <!-- Content per language -->
  {#each selectedLanguages as langCode (langCode)}
    {@const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode)}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>{lang?.flag}</span>
        Contenu en {lang?.name}
        {#if langCode === defaultLanguage}
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Principal</span>
        {/if}
      </h2>
      
      <div class="space-y-4">
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-1">Titre de la question *</span>
          <input
            type="text"
            bind:value={translations[langCode].title}
            placeholder="Ex: Quelle est la capitale de la France ?"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="block text-sm font-medium text-gray-700 mb-1">Sous-titre</span>
            <input
              type="text"
              bind:value={translations[langCode].subtitle}
              placeholder="Ex: Géographie européenne"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <span class="block text-sm font-medium text-gray-700 mb-1">Indice</span>
            <input
              type="text"
              bind:value={translations[langCode].hint}
              placeholder="Un indice pour aider..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <span class="block text-sm font-medium text-gray-700 mb-1">Introduction / Contexte</span>
          <textarea
            bind:value={translations[langCode].intro}
            placeholder="Texte d'introduction avant la question..."
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div>
          <span class="block text-sm font-medium text-gray-700 mb-1">Explication (après réponse)</span>
          <textarea
            bind:value={translations[langCode].explanation}
            placeholder="Pourquoi c'est la bonne réponse..."
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <!-- Open question specific fields -->
        {#if questionType === 'open_short' || questionType === 'open_long'}
          <div class="border-t pt-4 mt-4">
            <p class="text-sm font-medium text-gray-700 mb-3">Critères de correction</p>
            
            <div class="space-y-4">
              <div>
                <span class="block text-sm text-gray-600 mb-1">Réponse attendue (pour correction)</span>
                <textarea
                  bind:value={translations[langCode].expected_answer}
                  placeholder="La réponse modèle attendue..."
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <span class="block text-sm text-gray-600 mb-1">Barème / Guidelines de notation</span>
                <textarea
                  bind:value={translations[langCode].answer_guidelines}
                  placeholder="Ex: 5pts pour les concepts clés, 3pts pour l'argumentation..."
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <span class="block text-sm text-gray-600 mb-1">Mots-clés attendus</span>
                <div class="flex flex-wrap gap-2 mb-2">
                  {#each translations[langCode].keywords || [] as keyword}
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">
                      {keyword}
                      <button type="button" onclick={() => removeKeyword(langCode, keyword)} class="hover:text-amber-900">×</button>
                    </span>
                  {/each}
                </div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter un mot-clé..."
                    class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword(langCode, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/each}

  <!-- QCM Answers -->
  {#if questionType === 'qcm' || questionType === 'qcm_multiple'}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">
          Réponses possibles
          {#if questionType === 'qcm_multiple'}
            <span class="text-sm font-normal text-gray-500">(plusieurs bonnes réponses)</span>
          {/if}
        </h2>
        <Button variant="outline" size="sm" onclick={addAnswer}>
          <Plus class="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div class="space-y-3">
        {#each answers as answer, index (answer.id)}
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <GripVertical class="w-4 h-4 text-gray-400 cursor-move" />
            
            <button
              type="button"
              onclick={() => toggleCorrect(answer.id)}
              class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
              class:border-green-500={answer.is_correct}
              class:bg-green-500={answer.is_correct}
              class:border-gray-300={!answer.is_correct}
              title={answer.is_correct ? 'Bonne réponse' : 'Cliquer pour marquer comme correct'}
            >
              {#if answer.is_correct}
                <span class="text-white text-sm">✓</span>
              {/if}
            </button>

            <input
              type="text"
              bind:value={answer.text}
              placeholder={`Réponse ${index + 1}`}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-xs text-gray-500">Points:</span>
              <input
                type="number"
                bind:value={answer.points}
                min="0"
                max="100"
                class="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
              />
            </div>

            <button
              type="button"
              onclick={() => removeAnswer(answer.id)}
              class="p-1.5 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
              disabled={answers.length <= 2}
              class:opacity-50={answers.length <= 2}
            >
              <Trash2 class="w-4 h-4 text-red-600" />
            </button>
          </div>
        {/each}
      </div>

      <p class="text-xs text-gray-500 mt-3">
        💡 Cliquez sur le cercle pour marquer une réponse comme correcte. 
        Les points permettent une pondération (ex: réponse partielle = 5 points).
      </p>
    </div>
  {/if}

  <!-- Vrai/Faux -->
  {#if questionType === 'true_false'}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Réponse correcte</h2>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        {#each answers as answer (answer.id)}
          <button
            type="button"
            onclick={() => toggleCorrect(answer.id)}
            class="p-6 rounded-xl border-2 transition-all text-center"
            class:border-green-500={answer.is_correct}
            class:bg-green-50={answer.is_correct}
            class:border-gray-200={!answer.is_correct}
          >
            <span class="text-3xl mb-2 block">{answer.text === 'Vrai' ? '✓' : '✗'}</span>
            <span class="font-semibold text-lg">{answer.text}</span>
          </button>
        {/each}
      </div>

      <label class="flex items-center gap-2">
        <input 
          type="checkbox" 
          bind:checked={requireJustification}
          class="rounded border-gray-300 text-indigo-600"
        />
        <span class="text-sm text-gray-700">Demander une justification</span>
      </label>
    </div>
  {/if}

  <!-- Matching Pairs -->
  {#if questionType === 'matching'}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Paires à associer</h2>
        <Button variant="outline" size="sm" onclick={addMatchingPair}>
          <Plus class="w-4 h-4 mr-1" />
          Ajouter une paire
        </Button>
      </div>

      <div class="space-y-3">
        {#each matchingPairs as pair, index (pair.id)}
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-500 w-6">{index + 1}.</span>
            
            <input
              type="text"
              bind:value={pair.left}
              placeholder="Élément gauche (ex: format)"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <ArrowRight class="w-5 h-5 text-gray-400 flex-shrink-0" />

            <input
              type="text"
              bind:value={pair.right}
              placeholder="Élément droite (ex: usage)"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <button
              type="button"
              onclick={() => removeMatchingPair(pair.id)}
              class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              disabled={matchingPairs.length <= 2}
              class:opacity-50={matchingPairs.length <= 2}
            >
              <Trash2 class="w-4 h-4 text-red-600" />
            </button>
          </div>
        {/each}
      </div>

      <p class="text-xs text-gray-500 mt-3">
        💡 Les éléments de droite seront mélangés lors de l'affichage de la question.
      </p>
    </div>
  {/if}

  <!-- Ordering Items -->
  {#if questionType === 'ordering'}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Éléments à ordonner</h2>
        <Button variant="outline" size="sm" onclick={addOrderingItem}>
          <Plus class="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <p class="text-sm text-gray-600 mb-3">
        ⬆️⬇️ Utilisez les flèches pour définir l'ordre correct. L'élément en position 1 est le premier.
      </p>

      <div class="space-y-2">
        {#each orderingItems as item, index (item.id)}
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="flex flex-col gap-1">
              <button
                type="button"
                onclick={() => moveOrderingItem(item.id, 'up')}
                disabled={index === 0}
                class="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onclick={() => moveOrderingItem(item.id, 'down')}
                disabled={index === orderingItems.length - 1}
                class="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            
            <span class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold flex-shrink-0">
              {item.correct_position}
            </span>

            <input
              type="text"
              bind:value={item.text}
              placeholder={`Étape ${index + 1}`}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              type="button"
              onclick={() => removeOrderingItem(item.id)}
              class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              disabled={orderingItems.length <= 2}
              class:opacity-50={orderingItems.length <= 2}
            >
              <Trash2 class="w-4 h-4 text-red-600" />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Media Errors (for error_spotting) -->
  {#if questionType === 'error_spotting'}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Erreurs à identifier</h2>
        <Button variant="outline" size="sm" onclick={addMediaError}>
          <Plus class="w-4 h-4 mr-1" />
          Ajouter une erreur
        </Button>
      </div>

      {#if mediaErrors.length === 0}
        <p class="text-sm text-gray-500 text-center py-4">
          Ajoutez les erreurs présentes dans le média que l'utilisateur devra identifier.
        </p>
      {:else}
        <div class="space-y-3">
          {#each mediaErrors as error, index (error.id)}
            <div class="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              
              <div class="flex-1 space-y-2">
                <input
                  type="text"
                  bind:value={error.description}
                  placeholder="Description de l'erreur..."
                  class="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  bind:value={error.hint}
                  placeholder="Indice (optionnel)..."
                  class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>

              <button
                type="button"
                onclick={() => removeMediaError(error.id)}
                class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 class="w-4 h-4 text-red-600" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Open Question Settings -->
  {#if questionType === 'open_short' || questionType === 'open_long'}
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Paramètres de réponse</h2>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-1">Nombre de mots minimum</span>
          <input
            type="number"
            bind:value={minWords}
            placeholder="Ex: 50"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-1">Nombre de mots maximum</span>
          <input
            type="number"
            bind:value={maxWords}
            placeholder="Ex: 500"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Media Upload -->
  <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Médias</h2>
    
    <div class="grid grid-cols-3 gap-4">
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-2">Image</span>
        {#if imageUrl}
          <div class="relative">
            <img src={imageUrl} alt="Preview" class="w-full h-32 object-cover rounded-lg" />
            <button
              type="button"
              onclick={() => imageUrl = ''}
              class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        {:else}
          <div class="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Image class="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="text"
              bind:value={imageUrl}
              placeholder="URL de l'image"
              class="w-full text-xs px-2 py-1 border rounded"
            />
          </div>
        {/if}
      </div>
      
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-2">Audio</span>
        <div class="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Music class="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <input
            type="text"
            bind:value={audioUrl}
            placeholder="URL audio"
            class="w-full text-xs px-2 py-1 border rounded"
          />
        </div>
      </div>
      
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-2">Vidéo</span>
        <div class="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Video class="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <input
            type="text"
            bind:value={videoUrl}
            placeholder="URL vidéo"
            class="w-full text-xs px-2 py-1 border rounded"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Classification & Settings in 2 columns -->
  <div class="grid grid-cols-2 gap-6">
    <!-- Classification -->
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Classification</h2>
      
      <div class="space-y-4">
        <div>
          <label for="theme-select" class="block text-sm font-medium text-gray-700 mb-1">Thème *</label>
          <select 
            id="theme-select"
            bind:value={themeId}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Sélectionner un thème</option>
            {#each themes as theme}
              <option value={theme.id}>{theme.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="level-select" class="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
          <select 
            id="level-select"
            bind:value={levelId}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Sélectionner un niveau</option>
            {#each levels as level}
              <option value={level.id}>{level.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Paramètres</h2>
      
      <div class="space-y-4">
        <div>
          <label for="points-input" class="block text-sm font-medium text-gray-700 mb-1">Points total</label>
          <input
            id="points-input"
            type="number"
            bind:value={pointsTotal}
            min="1"
            max="100"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label for="difficulty-range" class="block text-sm font-medium text-gray-700 mb-1">
            Difficulté: {difficultyWeight}/10
          </label>
          <input
            id="difficulty-range"
            type="range"
            bind:value={difficultyWeight}
            min="1"
            max="10"
            class="w-full"
          />
        </div>

        <div>
          <label for="time-limit" class="block text-sm font-medium text-gray-700 mb-1">Limite de temps (sec)</label>
          <input
            id="time-limit"
            type="number"
            bind:value={timeLimit}
            placeholder="Pas de limite"
            min="5"
            max="600"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">Question active</span>
          <button
            type="button"
            onclick={() => isActive = !isActive}
            aria-label={isActive ? 'Désactiver' : 'Activer'}
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            class:bg-indigo-600={isActive}
            class:bg-gray-200={!isActive}
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              class:translate-x-6={isActive}
              class:translate-x-1={!isActive}
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-3">
    <Button variant="outline" onclick={onCancel}>
      Annuler
    </Button>
    <Button 
      class="bg-indigo-600 hover:bg-indigo-700"
      disabled={!isValid}
      onclick={handleSave}
    >
      {initialQuestion.id ? 'Mettre à jour' : 'Créer la question'}
    </Button>
  </div>
</div>
