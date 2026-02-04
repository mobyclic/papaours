<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Badge } from '$lib/components/ui/badge';
  import { ArrowLeft, Save, Trash2, FileQuestion, ListChecks, Eye, EyeOff } from 'lucide-svelte';
  
  let { data, form } = $props();
  
  let loading = $state(false);
  let deleteConfirm = $state(false);
  
  async function handleDelete() {
    const formData = new FormData();
    const response = await fetch('?/delete', {
      method: 'POST',
      body: formData
    });
    if (response.redirected) {
      window.location.href = response.url;
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="../themes" class="text-muted-foreground hover:text-foreground">
        <ArrowLeft class="h-5 w-5" />
      </a>
      <div>
        <h1 class="text-2xl font-bold">{data.theme.name}</h1>
        <p class="text-muted-foreground text-sm">Thème • {data.theme.slug}</p>
      </div>
    </div>
    <Badge variant={data.theme.is_active ? 'default' : 'secondary'}>
      {data.theme.is_active ? 'Actif' : 'Inactif'}
    </Badge>
  </div>

  {#if form?.error}
    <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
      {form.error}
    </div>
  {/if}
  
  {#if form?.success}
    <div class="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">
      Thème mis à jour avec succès
    </div>
  {/if}

  <Tabs.Root value="info" class="w-full">
    <Tabs.List>
      <Tabs.Trigger value="info">Informations</Tabs.Trigger>
      <Tabs.Trigger value="questions">Questions ({data.questions.length})</Tabs.Trigger>
      <Tabs.Trigger value="quiz">Quiz ({data.quizzes.length})</Tabs.Trigger>
    </Tabs.List>
    
    <!-- Info Tab -->
    <Tabs.Content value="info" class="mt-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <form method="POST" action="?/update" use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              update();
            };
          }}>
            <div class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium mb-1">Nom</label>
                <Input id="name" name="name" value={data.theme.name} required />
              </div>
              
              <div>
                <label for="description" class="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows="3"
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >{data.theme.description || ''}</textarea>
              </div>
              
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  name="is_active" 
                  checked={data.theme.is_active}
                  class="h-4 w-4 rounded border-gray-300"
                />
                <label for="is_active" class="text-sm">Thème actif</label>
              </div>
              
              <div class="flex justify-between pt-4">
                <Button type="submit" disabled={loading}>
                  <Save class="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                
                {#if !deleteConfirm}
                  <Button type="button" variant="destructive" onclick={() => deleteConfirm = true}>
                    <Trash2 class="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                {:else}
                  <div class="flex gap-2">
                    <Button type="button" variant="outline" onclick={() => deleteConfirm = false}>
                      Annuler
                    </Button>
                    <Button type="button" variant="destructive" onclick={handleDelete}>
                      Confirmer la suppression
                    </Button>
                  </div>
                {/if}
              </div>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
    
    <!-- Questions Tab -->
    <Tabs.Content value="questions" class="mt-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <FileQuestion class="h-5 w-5" />
            Questions du thème
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {#if data.questions.length === 0}
            <p class="text-muted-foreground text-center py-8">Aucune question dans ce thème</p>
          {:else}
            <div class="space-y-2">
              {#each data.questions as question}
                <a 
                  href="../questions/{question.id}"
                  class="block p-3 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <p class="font-medium truncate">{question.question}</p>
                      <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" class="text-xs">{question.type}</Badge>
                        <span>Difficulté: {question.difficulty}</span>
                      </div>
                    </div>
                    {#if question.is_active}
                      <Eye class="h-4 w-4 text-green-500 shrink-0" />
                    {:else}
                      <EyeOff class="h-4 w-4 text-muted-foreground shrink-0" />
                    {/if}
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
    
    <!-- Quiz Tab -->
    <Tabs.Content value="quiz" class="mt-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <ListChecks class="h-5 w-5" />
            Quiz du thème
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {#if data.quizzes.length === 0}
            <p class="text-muted-foreground text-center py-8">Aucun quiz dans ce thème</p>
          {:else}
            <div class="space-y-2">
              {#each data.quizzes as quiz}
                <a 
                  href="../quiz/{quiz.slug}"
                  class="block p-3 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium">{quiz.title}</p>
                      <p class="text-xs text-muted-foreground">{quiz.slug}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant={quiz.is_public ? 'default' : 'secondary'}>
                        {quiz.is_public ? 'Public' : 'Privé'}
                      </Badge>
                      {#if quiz.is_active}
                        <Eye class="h-4 w-4 text-green-500" />
                      {:else}
                        <EyeOff class="h-4 w-4 text-muted-foreground" />
                      {/if}
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
</div>
