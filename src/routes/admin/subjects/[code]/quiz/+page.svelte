<script lang="ts">
  import type { PageData } from './$types';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Plus, Pencil, Clock, HelpCircle, Star } from 'lucide-svelte';
  
  let { data }: { data: PageData } = $props();
  
  const subjectCode = $derived(data.currentSubject?.code);
  
  function getDifficultyLabel(level: number): string {
    const labels: Record<number, string> = {
      1: 'Très facile',
      2: 'Facile',
      3: 'Moyen',
      4: 'Difficile',
      5: 'Expert'
    };
    return labels[level] || `Niveau ${level}`;
  }
  
  function getDifficultyColor(level: number): string {
    if (level <= 2) return 'bg-green-500/20 text-green-400 border border-green-500/30';
    if (level <= 3) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Quiz</h1>
      <p class="text-gray-400">
        {data.quizzes.length} quiz pour {data.currentSubject?.name}
      </p>
    </div>
    <Button href="/admin/subjects/{subjectCode}/quiz/new">
      <Plus class="h-4 w-4 mr-2" />
      Nouveau quiz
    </Button>
  </div>

  <!-- Quiz grid -->
  {#if data.quizzes.length === 0}
    <Card.Root class="bg-gray-900/50 border-gray-800">
      <Card.Content class="p-8 text-center text-gray-500">
        Aucun quiz pour cette matière
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.quizzes as quiz}
        <Card.Root class="relative overflow-hidden bg-gray-900/50 border-gray-800 {!quiz.isActive ? 'opacity-60' : ''}">
          {#if quiz.isFeatured}
            <div class="absolute top-2 right-2">
              <Star class="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
          {/if}
          <Card.Header>
            <Card.Title class="line-clamp-2 text-white">{quiz.title}</Card.Title>
            {#if quiz.description}
              <Card.Description class="line-clamp-2 text-gray-400">{quiz.description}</Card.Description>
            {/if}
          </Card.Header>
          <Card.Content>
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <Badge class={getDifficultyColor(quiz.difficulty)}>
                {getDifficultyLabel(quiz.difficulty)}
              </Badge>
              {#if quiz.theme_name}
                <Badge variant="secondary">{quiz.theme_name}</Badge>
              {/if}
              {#if !quiz.isActive}
                <Badge variant="destructive">Inactif</Badge>
              {/if}
            </div>
            
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <HelpCircle class="h-4 w-4" />
                <span>{quiz.questionCount || 0} questions</span>
              </div>
              {#if quiz.estimatedMinutes}
                <div class="flex items-center gap-1">
                  <Clock class="h-4 w-4" />
                  <span>{quiz.estimatedMinutes} min</span>
                </div>
              {/if}
            </div>
          </Card.Content>
          <Card.Footer>
            <Button variant="outline" class="w-full" href="/admin/subjects/{subjectCode}/quiz/{quiz.slug}">
              <Pencil class="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
