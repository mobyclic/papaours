<script lang="ts">
  import type { PageData } from './$types';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Plus, Pencil, HelpCircle, ListChecks } from 'lucide-svelte';
  
  let { data }: { data: PageData } = $props();
  
  const subjectCode = $derived(data.currentSubject?.code);
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Thèmes</h1>
      <p class="text-gray-400">
        {data.themes.length} thème(s) pour {data.currentSubject?.name}
      </p>
    </div>
    <Button href="/admin/subjects/{subjectCode}/themes/new">
      <Plus class="h-4 w-4 mr-2" />
      Nouveau thème
    </Button>
  </div>

  <!-- Themes list -->
  {#if data.themes.length === 0}
    <Card.Root class="bg-gray-900/50 border-gray-800">
      <Card.Content class="p-8 text-center text-gray-500">
        Aucun thème pour cette matière
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.themes as theme}
        <Card.Root class="bg-gray-900/50 border-gray-800 {!theme.is_active ? 'opacity-60' : ''}">
          <Card.Header>
            <div class="flex items-start justify-between">
              <div>
                <Card.Title class="text-white">{theme.name}</Card.Title>
                {#if theme.description}
                  <Card.Description class="line-clamp-2 mt-1 text-gray-400">
                    {theme.description}
                  </Card.Description>
                {/if}
              </div>
              {#if !theme.is_active}
                <Badge variant="destructive">Inactif</Badge>
              {/if}
            </div>
          </Card.Header>
          <Card.Content>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <HelpCircle class="h-4 w-4" />
                <span>{theme.question_count} question(s)</span>
              </div>
              <div class="flex items-center gap-1">
                <ListChecks class="h-4 w-4" />
                <span>{theme.quiz_count} quiz</span>
              </div>
            </div>
          </Card.Content>
          <Card.Footer class="flex gap-2">
            <Button variant="outline" class="flex-1" href="/admin/subjects/{subjectCode}/themes/{theme.slug}">
              <Pencil class="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="ghost" href="/admin/subjects/{subjectCode}/questions?theme={theme.slug}">
              Voir questions
            </Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
