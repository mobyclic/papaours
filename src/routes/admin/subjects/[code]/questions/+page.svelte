<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-svelte';
  
  let { data }: { data: PageData } = $props();
  
  let searchInput = $state(data.filters?.search || '');
  let selectedTheme = $state(data.filters?.themeSlug || '');
  
  const subjectCode = $derived(data.currentSubject?.code);
  
  function applyFilters() {
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    if (selectedTheme) params.set('theme', selectedTheme);
    goto(`/admin/subjects/${subjectCode}/questions?${params.toString()}`);
  }
  
  function goToPage(newPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', String(newPage));
    goto(`/admin/subjects/${subjectCode}/questions?${params.toString()}`);
  }
  
  function getDifficultyColor(difficulty: number): string {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
  
  function getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'qcm': 'QCM',
      'qcm_image': 'QCM Image',
      'true_false': 'Vrai/Faux',
      'fill_blank': 'Texte à trous',
      'ordering': 'Ordre',
      'matching': 'Association'
    };
    return types[type] || type;
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Questions</h1>
      <p class="text-muted-foreground">
        {data.pagination.total} question(s) pour {data.currentSubject?.name}
      </p>
    </div>
    <Button href="/admin/subjects/{subjectCode}/questions/new">
      <Plus class="h-4 w-4 mr-2" />
      Nouvelle question
    </Button>
  </div>

  <!-- Filters -->
  <Card.Root>
    <Card.Content class="pt-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search"
              placeholder="Rechercher..."
              class="pl-9"
              bind:value={searchInput}
              onkeydown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        
        {#if data.subjectThemes && data.subjectThemes.length > 0}
          <Select.Root type="single" value={selectedTheme} onValueChange={(v) => { selectedTheme = v || ''; applyFilters(); }}>
            <Select.Trigger class="w-[200px]">
              {selectedTheme ? data.subjectThemes.find(t => t.slug === selectedTheme)?.name : 'Tous les thèmes'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">Tous les thèmes</Select.Item>
              {#each data.subjectThemes as theme}
                <Select.Item value={theme.slug}>{theme.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {/if}
        
        <Button onclick={applyFilters}>Filtrer</Button>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Questions list -->
  <Card.Root>
    <Card.Content class="p-0">
      {#if data.questions.length === 0}
        <div class="p-8 text-center text-muted-foreground">
          Aucune question trouvée
        </div>
      {:else}
        <div class="divide-y">
          {#each data.questions as question}
            <div class="p-4 hover:bg-muted/50 transition-colors">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <p class="font-medium line-clamp-2">{question.question}</p>
                  <div class="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline">{getTypeLabel(question.type)}</Badge>
                    <Badge class={getDifficultyColor(question.difficulty)}>
                      Niveau {question.difficulty}
                    </Badge>
                    {#if question.theme_name}
                      <Badge variant="secondary">{question.theme_name}</Badge>
                    {/if}
                    {#if !question.is_active}
                      <Badge variant="destructive">Inactive</Badge>
                    {/if}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="icon" href="/admin/subjects/{subjectCode}/questions/{question.id}">
                    <Pencil class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Pagination -->
  {#if data.pagination.totalPages > 1}
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Page {data.pagination.page} sur {data.pagination.totalPages}
      </p>
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          disabled={data.pagination.page <= 1}
          onclick={() => goToPage(data.pagination.page - 1)}
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          disabled={data.pagination.page >= data.pagination.totalPages}
          onclick={() => goToPage(data.pagination.page + 1)}
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>
