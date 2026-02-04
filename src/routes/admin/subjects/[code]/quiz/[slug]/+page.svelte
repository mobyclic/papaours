<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Select from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { 
    ArrowLeft, 
    Save, 
    Settings, 
    Tags, 
    HelpCircle, 
    FileText,
    Eye,
    EyeOff,
    Lock,
    Globe,
    Clock,
    Hash,
    GripVertical,
    Plus,
    Trash2,
    Check,
    X
  } from 'lucide-svelte';
  
  let { data }: { data: PageData } = $props();
  
  // État local pour les formulaires
  let saving = $state(false);
  let activeTab = $state('info');
  let successMessage = $state('');
  let errorMessage = $state('');
  
  // État pour les thèmes sélectionnés
  let selectedThemeIds = $state<string[]>([]);
  
  // État pour les questions sélectionnées
  let selectedQuestionIds = $state<string[]>([]);
  
  // Initialiser depuis data avec $effect
  $effect(() => {
    selectedThemeIds = data.quizThemes?.map((t: any) => t.id) || [];
    selectedQuestionIds = data.quizQuestions?.map((q: any) => q.id) || [];
  });
  
  // Difficultés disponibles
  const difficulties = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' }
  ];
  
  function toggleTheme(themeId: string) {
    if (selectedThemeIds.includes(themeId)) {
      selectedThemeIds = selectedThemeIds.filter(id => id !== themeId);
    } else {
      selectedThemeIds = [...selectedThemeIds, themeId];
    }
  }
  
  function toggleQuestion(questionId: string) {
    if (selectedQuestionIds.includes(questionId)) {
      selectedQuestionIds = selectedQuestionIds.filter(id => id !== questionId);
    } else {
      selectedQuestionIds = [...selectedQuestionIds, questionId];
    }
  }
  
  function selectAllQuestions() {
    selectedQuestionIds = data.availableQuestions?.map((q: any) => q.id) || [];
  }
  
  function deselectAllQuestions() {
    selectedQuestionIds = [];
  }
  
  function showSuccess(message: string) {
    successMessage = message;
    setTimeout(() => successMessage = '', 3000);
  }
  
  function showError(message: string) {
    errorMessage = message;
    setTimeout(() => errorMessage = '', 5000);
  }
</script>

<svelte:head>
  <title>{data.quiz?.title || 'Quiz'} - Édition</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a 
        href="/admin/subjects/{data.currentSubject?.code}/quiz" 
        class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
      </a>
      <div>
        <h1 class="text-2xl font-bold text-white">{data.quiz?.title}</h1>
        <p class="text-gray-400 text-sm">
          Slug: <code class="bg-gray-800 px-2 py-0.5 rounded">{data.quiz?.slug}</code>
          {#if data.quiz?.isActive}
            <span class="ml-2 inline-flex items-center gap-1 text-green-400">
              <Eye class="w-3 h-3" /> Actif
            </span>
          {:else}
            <span class="ml-2 inline-flex items-center gap-1 text-gray-500">
              <EyeOff class="w-3 h-3" /> Inactif
            </span>
          {/if}
          {#if data.quiz?.isPublic}
            <span class="ml-2 inline-flex items-center gap-1 text-blue-400">
              <Globe class="w-3 h-3" /> Public
            </span>
          {:else}
            <span class="ml-2 inline-flex items-center gap-1 text-amber-400">
              <Lock class="w-3 h-3" /> Privé
            </span>
          {/if}
        </p>
      </div>
    </div>
  </div>
  
  <!-- Messages -->
  {#if successMessage}
    <div class="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2">
      <Check class="w-4 h-4" />
      {successMessage}
    </div>
  {/if}
  {#if errorMessage}
    <div class="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
      <X class="w-4 h-4" />
      {errorMessage}
    </div>
  {/if}
  
  <!-- Tabs -->
  <Tabs.Root value={activeTab} onValueChange={(v) => activeTab = v || 'info'}>
    <Tabs.List class="bg-gray-900/50 border border-gray-800">
      <Tabs.Trigger value="info" class="data-[state=active]:bg-gray-800">
        <Settings class="w-4 h-4 mr-2" />
        Informations
      </Tabs.Trigger>
      <Tabs.Trigger value="themes" class="data-[state=active]:bg-gray-800">
        <Tags class="w-4 h-4 mr-2" />
        Thèmes ({selectedThemeIds.length})
      </Tabs.Trigger>
      <Tabs.Trigger value="questions" class="data-[state=active]:bg-gray-800">
        <HelpCircle class="w-4 h-4 mr-2" />
        Questions ({selectedQuestionIds.length})
      </Tabs.Trigger>
      <Tabs.Trigger value="slides" class="data-[state=active]:bg-gray-800">
        <FileText class="w-4 h-4 mr-2" />
        Slides ({data.quizSlides?.length || 0})
      </Tabs.Trigger>
    </Tabs.List>
    
    <!-- Tab: Informations générales -->
    <Tabs.Content value="info">
      <Card.Root class="bg-gray-900/50 border-gray-800">
        <Card.Header>
          <Card.Title class="text-white">Informations générales</Card.Title>
          <Card.Description>Configurez les paramètres de base du quiz</Card.Description>
        </Card.Header>
        <Card.Content>
          <form 
            method="POST" 
            action="?/updateInfo"
            use:enhance={() => {
              saving = true;
              return async ({ result }) => {
                saving = false;
                if (result.type === 'success') {
                  showSuccess('Quiz mis à jour avec succès');
                } else if (result.type === 'failure') {
                  showError(String(result.data?.error || 'Erreur lors de la mise à jour'));
                }
              };
            }}
            class="space-y-6"
          >
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="title">Titre *</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={data.quiz?.title || ''} 
                  required
                  class="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="difficulty">Difficulté</Label>
                <select 
                  id="difficulty" 
                  name="difficulty" 
                  class="w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-700 text-white"
                >
                  {#each difficulties as diff}
                    <option value={diff.value} selected={data.quiz?.difficulty === diff.value}>
                      {diff.label}
                    </option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div class="space-y-2">
              <Label for="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={data.quiz?.description || ''} 
                rows={3}
                class="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="maxQuestions" class="flex items-center gap-2">
                  <Hash class="w-4 h-4" />
                  Nombre max de questions
                </Label>
                <Input 
                  id="maxQuestions" 
                  name="maxQuestions" 
                  type="number" 
                  min="0"
                  value={data.quiz?.maxQuestions || ''} 
                  placeholder="Toutes les questions"
                  class="bg-gray-800 border-gray-700"
                />
                <p class="text-xs text-gray-500">Laissez vide pour utiliser toutes les questions</p>
              </div>
              
              <div class="space-y-2">
                <Label for="timeLimit" class="flex items-center gap-2">
                  <Clock class="w-4 h-4" />
                  Limite de temps (minutes)
                </Label>
                <Input 
                  id="timeLimit" 
                  name="timeLimit" 
                  type="number" 
                  min="0"
                  value={data.quiz?.timeLimit || ''} 
                  placeholder="Pas de limite"
                  class="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <div class="flex flex-wrap gap-6 pt-4 border-t border-gray-800">
              <div class="flex items-center gap-3">
                <input 
                  type="hidden" 
                  name="isActive" 
                  value={data.quiz?.isActive ? 'true' : 'false'} 
                />
                <Switch 
                  checked={data.quiz?.isActive} 
                  onCheckedChange={(checked) => {
                    const input = document.querySelector('input[name="isActive"]') as HTMLInputElement;
                    if (input) input.value = checked ? 'true' : 'false';
                  }}
                />
                <Label class="flex items-center gap-2 cursor-pointer">
                  {#if data.quiz?.isActive}
                    <Eye class="w-4 h-4 text-green-400" />
                    <span>Quiz actif</span>
                  {:else}
                    <EyeOff class="w-4 h-4 text-gray-400" />
                    <span>Quiz inactif</span>
                  {/if}
                </Label>
              </div>
              
              <div class="flex items-center gap-3">
                <input 
                  type="hidden" 
                  name="isPublic" 
                  value={data.quiz?.isPublic ? 'true' : 'false'} 
                />
                <Switch 
                  checked={data.quiz?.isPublic} 
                  onCheckedChange={(checked) => {
                    const input = document.querySelector('input[name="isPublic"]') as HTMLInputElement;
                    if (input) input.value = checked ? 'true' : 'false';
                  }}
                />
                <Label class="flex items-center gap-2 cursor-pointer">
                  {#if data.quiz?.isPublic}
                    <Globe class="w-4 h-4 text-blue-400" />
                    <span>Public</span>
                  {:else}
                    <Lock class="w-4 h-4 text-amber-400" />
                    <span>Privé</span>
                  {/if}
                </Label>
              </div>
            </div>
            
            <div class="flex justify-end pt-4">
              <Button type="submit" disabled={saving}>
                <Save class="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
    
    <!-- Tab: Thèmes -->
    <Tabs.Content value="themes">
      <Card.Root class="bg-gray-900/50 border-gray-800">
        <Card.Header>
          <Card.Title class="text-white">Thèmes du quiz</Card.Title>
          <Card.Description>Sélectionnez les thèmes dont les questions seront utilisées</Card.Description>
        </Card.Header>
        <Card.Content>
          <form 
            method="POST" 
            action="?/updateThemes"
            use:enhance={() => {
              saving = true;
              return async ({ result }) => {
                saving = false;
                if (result.type === 'success') {
                  showSuccess('Thèmes mis à jour');
                } else if (result.type === 'failure') {
                  showError(String(result.data?.error || 'Erreur'));
                }
              };
            }}
          >
            {#if data.allThemes?.length === 0}
              <div class="text-center py-8 text-gray-500">
                <Tags class="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun thème disponible pour cette matière</p>
                <a 
                  href="/admin/subjects/{data.currentSubject?.code}/themes" 
                  class="text-blue-400 hover:underline"
                >
                  Créer des thèmes
                </a>
              </div>
            {:else}
              <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {#each data.allThemes as theme}
                  {@const isSelected = selectedThemeIds.includes(theme.id)}
                  <button
                    type="button"
                    onclick={() => toggleTheme(theme.id)}
                    class="flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      {isSelected 
                        ? 'bg-blue-500/20 border-blue-500/50 text-white' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'}"
                  >
                    <div class="w-5 h-5 rounded border-2 flex items-center justify-center
                      {isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}">
                      {#if isSelected}
                        <Check class="w-3 h-3 text-white" />
                      {/if}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">{theme.name}</div>
                      {#if theme.description}
                        <div class="text-xs text-gray-500 truncate">{theme.description}</div>
                      {/if}
                    </div>
                  </button>
                  {#if isSelected}
                    <input type="hidden" name="theme_ids" value={theme.id} />
                  {/if}
                {/each}
              </div>
              
              <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
                <span class="text-sm text-gray-400">
                  {selectedThemeIds.length} thème(s) sélectionné(s)
                </span>
                <Button type="submit" disabled={saving}>
                  <Save class="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer les thèmes'}
                </Button>
              </div>
            {/if}
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
    
    <!-- Tab: Questions -->
    <Tabs.Content value="questions">
      <Card.Root class="bg-gray-900/50 border-gray-800">
        <Card.Header>
          <div class="flex items-center justify-between">
            <div>
              <Card.Title class="text-white">Questions du quiz</Card.Title>
              <Card.Description>Sélectionnez les questions à inclure dans ce quiz</Card.Description>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={selectAllQuestions}>
                Tout sélectionner
              </Button>
              <Button variant="outline" size="sm" onclick={deselectAllQuestions}>
                Tout désélectionner
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <form 
            method="POST" 
            action="?/updateQuestions"
            use:enhance={() => {
              saving = true;
              return async ({ result }) => {
                saving = false;
                if (result.type === 'success') {
                  showSuccess('Questions mises à jour');
                } else if (result.type === 'failure') {
                  showError(String(result.data?.error || 'Erreur'));
                }
              };
            }}
          >
            {#if selectedThemeIds.length === 0}
              <div class="text-center py-8 text-gray-500">
                <HelpCircle class="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez d'abord des thèmes pour voir les questions disponibles</p>
              </div>
            {:else if data.availableQuestions?.length === 0}
              <div class="text-center py-8 text-gray-500">
                <HelpCircle class="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune question disponible pour les thèmes sélectionnés</p>
                <a 
                  href="/admin/subjects/{data.currentSubject?.code}/questions" 
                  class="text-blue-400 hover:underline"
                >
                  Créer des questions
                </a>
              </div>
            {:else}
              <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {#each data.availableQuestions as question}
                  {@const isSelected = selectedQuestionIds.includes(question.id)}
                  <button
                    type="button"
                    onclick={() => toggleQuestion(question.id)}
                    class="w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left
                      {isSelected 
                        ? 'bg-green-500/20 border-green-500/50' 
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}"
                  >
                    <div class="w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0
                      {isSelected ? 'bg-green-500 border-green-500' : 'border-gray-600'}">
                      {#if isSelected}
                        <Check class="w-3 h-3 text-white" />
                      {/if}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white line-clamp-2">{question.question}</div>
                      <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span class="px-1.5 py-0.5 rounded bg-gray-700">
                          {question.questionType || 'QCM'}
                        </span>
                        {#if question.difficulty}
                          <span class="px-1.5 py-0.5 rounded bg-gray-700">
                            {question.difficulty}
                          </span>
                        {/if}
                      </div>
                    </div>
                  </button>
                  {#if isSelected}
                    <input type="hidden" name="question_ids" value={question.id} />
                  {/if}
                {/each}
              </div>
              
              <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
                <span class="text-sm text-gray-400">
                  {selectedQuestionIds.length} / {data.availableQuestions?.length} question(s) sélectionnée(s)
                </span>
                <Button type="submit" disabled={saving}>
                  <Save class="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer les questions'}
                </Button>
              </div>
            {/if}
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
    
    <!-- Tab: Slides -->
    <Tabs.Content value="slides">
      <Card.Root class="bg-gray-900/50 border-gray-800">
        <Card.Header>
          <div class="flex items-center justify-between">
            <div>
              <Card.Title class="text-white">Slides du quiz</Card.Title>
              <Card.Description>Ajoutez des slides d'introduction, d'explication ou de transition</Card.Description>
            </div>
            <Button>
              <Plus class="w-4 h-4 mr-2" />
              Ajouter un slide
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          {#if data.quizSlides?.length === 0}
            <div class="text-center py-12 text-gray-500">
              <FileText class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p class="mb-2">Aucun slide pour ce quiz</p>
              <p class="text-sm">Les slides permettent d'ajouter du contenu entre les questions</p>
            </div>
          {:else}
            <div class="space-y-2">
              {#each data.quizSlides as slide, index}
                <div class="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <GripVertical class="w-4 h-4 text-gray-500 cursor-grab" />
                  <div class="flex-1">
                    <div class="font-medium text-white">{slide.title || `Slide ${index + 1}`}</div>
                    <div class="text-sm text-gray-500">{slide.type || 'Texte'}</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 class="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
</div>
