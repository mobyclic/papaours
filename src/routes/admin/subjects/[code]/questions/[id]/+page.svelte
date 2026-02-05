<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { ArrowLeft, Save, Trash2, X } from 'lucide-svelte';
  
  let { data, form } = $props();
  
  let loading = $state(false);
  let deleteConfirm = $state(false);
  
  // Types de questions (pour affichage uniquement)
  const questionTypeLabels: Record<string, string> = {
    'qcm': 'QCM',
    'qcm_multiple': 'QCM',
    'true_false': 'Vrai/Faux',
    'fill_blank': 'Texte à trous',
    'matching': 'Appariement',
    'ordering': 'Ordonnancement',
    'open': 'Question ouverte'
  };

  // Fonction pour normaliser le type QCM (pour affichage)
  function normalizeQcmType(type: string): string {
    return type === 'qcm_multiple' ? 'qcm' : type;
  }

  // Calculer si c'est un QCM multiple (plusieurs bonnes réponses)
  function isQcmMultiple(question: any): boolean {
    if (question.type !== 'qcm' && question.type !== 'qcm_multiple') return false;
    return Array.isArray(question.correct_answers) && question.correct_answers.length > 1;
  }
  
  const difficultyLevels = [
    { value: 1, label: '1 - Très facile' },
    { value: 2, label: '2 - Facile' },
    { value: 3, label: '3 - Moyen' },
    { value: 4, label: '4 - Difficile' },
    { value: 5, label: '5 - Très difficile' }
  ];
  
  // État pour les thèmes sélectionnés (multiples)
  let selectedThemeIds = $state<string[]>([]);
  
  // État pour les difficultés par grade
  let gradeDifficulties = $state<Array<{grade_id: string, difficulty: number, points: number}>>([]);
  
  // Initialiser les états à partir de data
  $effect(() => {
    selectedThemeIds = data.question.theme_ids || [];
    gradeDifficulties = data.question.grade_difficulties || [];
  });
  
  // Fonction pour ajouter une difficulté pour un grade
  function addGradeDifficulty(gradeId: string) {
    if (!gradeDifficulties.find(gd => gd.grade_id === gradeId)) {
      gradeDifficulties = [...gradeDifficulties, { grade_id: gradeId, difficulty: 3, points: 10 }];
    }
  }
  
  // Fonction pour supprimer une difficulté
  function removeGradeDifficulty(gradeId: string) {
    gradeDifficulties = gradeDifficulties.filter(gd => gd.grade_id !== gradeId);
  }
  
  // Fonction pour mettre à jour une difficulté
  function updateGradeDifficulty(gradeId: string, field: 'difficulty' | 'points', value: number) {
    gradeDifficulties = gradeDifficulties.map(gd => 
      gd.grade_id === gradeId ? { ...gd, [field]: value } : gd
    );
  }
  
  // Toggle un thème
  function toggleTheme(themeId: string) {
    if (selectedThemeIds.includes(themeId)) {
      selectedThemeIds = selectedThemeIds.filter(id => id !== themeId);
    } else {
      selectedThemeIds = [...selectedThemeIds, themeId];
    }
  }
  
  // Récupérer le nom d'un grade par son ID
  function getGradeName(gradeId: string): string {
    const grade = data.grades?.find((g: any) => g.id === gradeId);
    return grade?.name || gradeId;
  }
  
  // Grades disponibles (non encore ajoutés)
  let availableGrades = $derived(
    data.grades?.filter((g: any) => !gradeDifficulties.find(gd => gd.grade_id === g.id)) || []
  );
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="../questions" class="text-muted-foreground hover:text-foreground">
        <ArrowLeft class="h-5 w-5" />
      </a>
      <div>
        <h1 class="text-2xl font-bold">Modifier la question</h1>
        <div class="flex items-center gap-2 mt-1">
          <Badge variant="outline">{questionTypeLabels[data.question.type] || data.question.type}</Badge>
          {#if isQcmMultiple(data.question)}
            <Badge variant="secondary" class="text-xs">Choix multiples</Badge>
          {/if}
        </div>
      </div>
    </div>
    <Badge variant={data.question.is_active ? 'default' : 'secondary'}>
      {data.question.is_active ? 'Active' : 'Inactive'}
    </Badge>
  </div>

  {#if form?.error}
    <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
      {form.error}
    </div>
  {/if}
  
  {#if form?.success}
    <div class="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">
      Question mise à jour avec succès
    </div>
  {/if}

  <form method="POST" action="?/update" use:enhance={() => {
    loading = true;
    return async ({ update }) => {
      loading = false;
      update();
    };
  }}>
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content -->
      <div class="lg:col-span-2 space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Contenu de la question</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div>
              <label for="question" class="block text-sm font-medium mb-1">Question *</label>
              <textarea 
                id="question" 
                name="question" 
                rows="4"
                required
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >{data.question.question}</textarea>
            </div>
            
            <div>
              <label for="explanation" class="block text-sm font-medium mb-1">Explication (après réponse)</label>
              <textarea 
                id="explanation" 
                name="explanation" 
                rows="3"
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >{data.question.explanation || ''}</textarea>
            </div>
          </Card.Content>
        </Card.Root>
        
        <!-- Type-specific fields -->
        {#if data.question.type === 'qcm' || data.question.type === 'qcm_multiple'}
          {@const isMultiple = isQcmMultiple(data.question)}
          <Card.Root>
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                Options de réponse
                <Badge variant={isMultiple ? 'default' : 'secondary'} class="text-xs">
                  {isMultiple ? 'Choix multiples' : 'Choix unique'}
                </Badge>
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {#if data.question.options?.length}
                {@const correctAnswers = data.question.correct_answers || 
                  (data.question.correct_answer !== undefined ? [data.question.correct_answer] : [])}
                <div class="space-y-2">
                  {#each data.question.options as option, i}
                    {@const isCorrect = correctAnswers.includes(i)}
                    <div class="flex items-center gap-2 p-2 rounded border {
                      isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' : ''
                    }">
                      <span class="font-mono text-sm text-muted-foreground w-6">{String.fromCharCode(65 + i)}.</span>
                      <span class="flex-1">{option}</span>
                      {#if isCorrect}
                        <Badge variant="default" class="text-xs">Correct</Badge>
                      {/if}
                    </div>
                  {/each}
                </div>
                <p class="text-xs text-muted-foreground mt-4">
                  {correctAnswers.length} bonne(s) réponse(s) sur {data.question.options.length} options
                </p>
              {:else}
                <p class="text-muted-foreground">Aucune option définie</p>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
        
        {#if data.question.type === 'true_false'}
          <Card.Root>
            <Card.Header>
              <Card.Title>Réponse</Card.Title>
            </Card.Header>
            <Card.Content>
              <Badge variant={data.question.correct_answer ? 'default' : 'secondary'}>
                Réponse correcte: {data.question.correct_answer ? 'Vrai' : 'Faux'}
              </Badge>
            </Card.Content>
          </Card.Root>
        {/if}
        
        {#if data.question.type === 'fill_blank' && data.question.text_with_blanks}
          <Card.Root>
            <Card.Header>
              <Card.Title>Texte à trous</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="font-mono text-sm bg-muted p-3 rounded">{data.question.text_with_blanks}</p>
              {#if data.question.correct_answers?.length}
                <div class="mt-4">
                  <p class="text-sm font-medium mb-2">Réponses attendues:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each data.question.correct_answers as answer}
                      <Badge variant="outline">{answer}</Badge>
                    {/each}
                  </div>
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
        
        {#if data.question.type === 'matching'}
          <Card.Root>
            <Card.Header>
              <Card.Title>Appariements</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if data.question.left_items?.length && data.question.right_items?.length}
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium mb-2">Colonne gauche</p>
                    {#each data.question.left_items as item, i}
                      <div class="p-2 border rounded mb-1">{i + 1}. {item}</div>
                    {/each}
                  </div>
                  <div>
                    <p class="text-sm font-medium mb-2">Colonne droite</p>
                    {#each data.question.right_items as item, i}
                      <div class="p-2 border rounded mb-1">{String.fromCharCode(65 + i)}. {item}</div>
                    {/each}
                  </div>
                </div>
              {:else}
                <p class="text-muted-foreground">Aucun appariement défini</p>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
        
        {#if data.question.type === 'ordering'}
          <Card.Root>
            <Card.Header>
              <Card.Title>Éléments à ordonner</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if data.question.items?.length}
                <div class="space-y-1">
                  {#each data.question.correct_order || data.question.items as itemIndex, i}
                    <div class="p-2 border rounded flex items-center gap-2">
                      <span class="font-mono text-sm text-muted-foreground">{i + 1}.</span>
                      <span>{data.question.items[typeof itemIndex === 'number' ? itemIndex : i]}</span>
                    </div>
                  {/each}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  Ordre correct affiché ci-dessus
                </p>
              {:else}
                <p class="text-muted-foreground">Aucun élément défini</p>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
        
        {#if data.question.type === 'open'}
          <Card.Root>
            <Card.Header>
              <Card.Title>Question ouverte</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if data.question.sample_answers?.length}
                <div class="mb-4">
                  <p class="text-sm font-medium mb-2">Exemples de réponses</p>
                  {#each data.question.sample_answers as answer}
                    <p class="text-sm p-2 bg-muted rounded mb-1">{answer}</p>
                  {/each}
                </div>
              {/if}
              {#if data.question.expected_keywords?.length}
                <div>
                  <p class="text-sm font-medium mb-2">Mots-clés attendus</p>
                  <div class="flex flex-wrap gap-1">
                    {#each data.question.expected_keywords as keyword}
                      <Badge variant="outline">{keyword}</Badge>
                    {/each}
                  </div>
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
      
      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Hidden fields pour envoyer les données JSON -->
        <input type="hidden" name="theme_ids" value={JSON.stringify(selectedThemeIds)} />
        <input type="hidden" name="grade_difficulties" value={JSON.stringify(gradeDifficulties)} />
        
        <!-- Difficultés par niveau -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Difficulté par niveau</Card.Title>
            <p class="text-xs text-muted-foreground">
              Définissez la difficulté et les points pour chaque niveau scolaire
            </p>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#if gradeDifficulties.length === 0}
              <p class="text-sm text-muted-foreground italic">
                Aucun niveau configuré
              </p>
            {:else}
              {#each gradeDifficulties as gd (gd.grade_id)}
                <div class="p-3 border rounded-md space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{getGradeName(gd.grade_id)}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onclick={() => removeGradeDifficulty(gd.grade_id)}
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-xs text-muted-foreground">Difficulté</label>
                      <select 
                        class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={gd.difficulty}
                        onchange={(e) => updateGradeDifficulty(gd.grade_id, 'difficulty', parseInt(e.currentTarget.value))}
                      >
                        {#each difficultyLevels as level}
                          <option value={level.value}>{level.value}</option>
                        {/each}
                      </select>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Points</label>
                      <Input 
                        type="number" 
                        value={gd.points}
                        min="1"
                        max="100"
                        class="h-8"
                        onchange={(e) => updateGradeDifficulty(gd.grade_id, 'points', parseInt(e.currentTarget.value) || 10)}
                      />
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
            
            {#if availableGrades.length > 0}
              <div class="pt-2">
                <select 
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onchange={(e) => {
                    if (e.currentTarget.value) {
                      addGradeDifficulty(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                >
                  <option value="">+ Ajouter un niveau...</option>
                  {#each availableGrades as grade}
                    <option value={grade.id}>{grade.name}</option>
                  {/each}
                </select>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
        
        <!-- Thèmes (multiples) -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Thèmes</Card.Title>
            <p class="text-xs text-muted-foreground">
              Sélectionnez un ou plusieurs thèmes
            </p>
          </Card.Header>
          <Card.Content>
            {#if data.themes?.length}
              <div class="space-y-2 max-h-48 overflow-y-auto">
                {#each data.themes as theme}
                  {@const isSelected = selectedThemeIds.includes(theme.id)}
                  <label 
                    class="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors {isSelected ? 'bg-primary/10' : ''}"
                  >
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onchange={() => toggleTheme(theme.id)}
                      class="h-4 w-4 rounded border-gray-300"
                    />
                    <span class="text-sm">{theme.name}</span>
                  </label>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-muted-foreground italic">Aucun thème disponible</p>
            {/if}
          </Card.Content>
        </Card.Root>
        
        <!-- Statut -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Statut</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="is_active" 
                name="is_active" 
                checked={data.question.is_active}
                class="h-4 w-4 rounded border-gray-300"
              />
              <label for="is_active" class="text-sm">Question active</label>
            </div>
          </Card.Content>
        </Card.Root>
        
        <Card.Root>
          <Card.Content class="pt-6 space-y-3">
            <Button type="submit" class="w-full" disabled={loading}>
              <Save class="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
            
            {#if !deleteConfirm}
              <Button type="button" variant="destructive" class="w-full" onclick={() => deleteConfirm = true}>
                <Trash2 class="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            {:else}
              <div class="space-y-2 p-3 bg-destructive/10 rounded-md">
                <p class="text-sm text-destructive font-medium">Confirmer la suppression ?</p>
                <div class="flex gap-2">
                  <Button type="button" variant="outline" size="sm" class="flex-1" onclick={() => deleteConfirm = false}>
                    Annuler
                  </Button>
                  <form method="POST" action="?/delete" use:enhance class="flex-1">
                    <Button type="submit" variant="destructive" size="sm" class="w-full">
                      Supprimer
                    </Button>
                  </form>
                </div>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
        
        {#if data.question.image_url}
          <Card.Root>
            <Card.Header>
              <Card.Title>Image</Card.Title>
            </Card.Header>
            <Card.Content>
              <img 
                src={data.question.image_url} 
                alt={data.question.image_caption || 'Image de la question'}
                class="w-full rounded-md"
              />
              {#if data.question.image_caption}
                <p class="text-xs text-muted-foreground mt-2">{data.question.image_caption}</p>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </div>
  </form>
</div>
