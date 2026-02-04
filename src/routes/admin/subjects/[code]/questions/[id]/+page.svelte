<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import { ArrowLeft, Save, Trash2, Eye, EyeOff } from 'lucide-svelte';
  
  let { data, form } = $props();
  
  let loading = $state(false);
  let deleteConfirm = $state(false);
  
  const questionTypes = [
    { value: 'qcm', label: 'QCM (choix unique)' },
    { value: 'qcm_multiple', label: 'QCM (choix multiples)' },
    { value: 'true_false', label: 'Vrai/Faux' },
    { value: 'fill_blank', label: 'Texte à trous' },
    { value: 'matching', label: 'Appariement' },
    { value: 'ordering', label: 'Ordonnancement' },
    { value: 'open', label: 'Question ouverte' }
  ];
  
  const difficultyLevels = [
    { value: 1, label: '1 - Très facile' },
    { value: 2, label: '2 - Facile' },
    { value: 3, label: '3 - Moyen' },
    { value: 4, label: '4 - Difficile' },
    { value: 5, label: '5 - Très difficile' }
  ];
  
  let selectedType = $state('');
  let selectedDifficulty = $state('1');
  let selectedTheme = $state('');
  
  $effect(() => {
    selectedType = data.question.type || '';
    selectedDifficulty = data.question.difficulty?.toString() || '1';
    selectedTheme = data.question.theme_slug || '';
  });
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
        <p class="text-muted-foreground text-sm">
          {data.question.theme_name ? `Thème: ${data.question.theme_name}` : 'Sans thème'}
        </p>
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
          <Card.Root>
            <Card.Header>
              <Card.Title>Options de réponse</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if data.question.options?.length}
                <div class="space-y-2">
                  {#each data.question.options as option, i}
                    <div class="flex items-center gap-2 p-2 rounded border {
                      (data.question.type === 'qcm' && data.question.correct_answer === i) ||
                      (data.question.type === 'qcm_multiple' && data.question.correct_answers?.includes(i))
                        ? 'bg-green-50 border-green-200' 
                        : ''
                    }">
                      <span class="font-mono text-sm text-muted-foreground w-6">{String.fromCharCode(65 + i)}.</span>
                      <span class="flex-1">{option}</span>
                      {#if (data.question.type === 'qcm' && data.question.correct_answer === i) ||
                           (data.question.type === 'qcm_multiple' && data.question.correct_answers?.includes(i))}
                        <Badge variant="default" class="text-xs">Correct</Badge>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-muted-foreground">Aucune option définie</p>
              {/if}
              <p class="text-xs text-muted-foreground mt-4">
                Pour modifier les options, utilisez l'API ou l'éditeur avancé
              </p>
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
        <Card.Root>
          <Card.Header>
            <Card.Title>Paramètres</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div>
              <label for="type" class="block text-sm font-medium mb-1">Type de question</label>
              <select 
                id="type" 
                name="type" 
                bind:value={selectedType}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {#each questionTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label for="difficulty" class="block text-sm font-medium mb-1">Difficulté</label>
              <select 
                id="difficulty" 
                name="difficulty" 
                bind:value={selectedDifficulty}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {#each difficultyLevels as level}
                  <option value={level.value}>{level.label}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label for="theme_slug" class="block text-sm font-medium mb-1">Thème</label>
              <select 
                id="theme_slug" 
                name="theme_slug" 
                bind:value={selectedTheme}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sans thème</option>
                {#each data.themes as theme}
                  <option value={theme.slug}>{theme.name}</option>
                {/each}
              </select>
            </div>
            
            <div class="flex items-center gap-2 pt-2">
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
