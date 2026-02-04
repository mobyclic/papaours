<script lang="ts">
  import type { PageData } from './$types';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { BookOpen, HelpCircle, ListChecks, Plus } from 'lucide-svelte';
  
  let { data }: { data: PageData } = $props();
  
  const stats = $derived([
    {
      title: 'Questions',
      value: data.currentSubject?.questionCount || 0,
      icon: HelpCircle,
      href: `/admin/subjects/${data.currentSubject?.code}/questions`,
      color: 'text-blue-500'
    },
    {
      title: 'Quiz',
      value: data.currentSubject?.quizCount || 0,
      icon: ListChecks,
      href: `/admin/subjects/${data.currentSubject?.code}/quiz`,
      color: 'text-green-500'
    },
    {
      title: 'Thèmes',
      value: data.currentSubject?.themeCount || 0,
      icon: BookOpen,
      href: `/admin/subjects/${data.currentSubject?.code}/themes`,
      color: 'text-purple-500'
    }
  ]);
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      {#if data.currentSubject?.icon}
        <span class="text-4xl">{data.currentSubject.icon}</span>
      {/if}
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{data.currentSubject?.name}</h1>
        <p class="text-gray-400">
          Domaine : {data.currentSubject?.domain || 'Non défini'}
        </p>
      </div>
    </div>
  </div>

  <!-- Stats cards -->
  <div class="grid gap-4 md:grid-cols-3">
    {#each stats as stat}
      <Card.Root class="bg-gray-900/50 border-gray-800">
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-gray-300">{stat.title}</Card.Title>
          <stat.icon class="h-4 w-4 {stat.color}" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold text-white">{stat.value}</div>
          <a href={stat.href} class="text-xs text-gray-400 hover:text-gray-300 hover:underline">
            Voir tout →
          </a>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <!-- Quick actions -->
  <Card.Root class="bg-gray-900/50 border-gray-800">
    <Card.Header>
      <Card.Title class="text-white">Actions rapides</Card.Title>
      <Card.Description class="text-gray-400">Gérez le contenu de cette matière</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-wrap gap-2">
      <Button href="/admin/subjects/{data.currentSubject?.code}/questions/new">
        <Plus class="h-4 w-4 mr-2" />
        Nouvelle question
      </Button>
      <Button variant="outline" href="/admin/subjects/{data.currentSubject?.code}/quiz/new">
        <Plus class="h-4 w-4 mr-2" />
        Nouveau quiz
      </Button>
      <Button variant="outline" href="/admin/subjects/{data.currentSubject?.code}/themes/new">
        <Plus class="h-4 w-4 mr-2" />
        Nouveau thème
      </Button>
    </Card.Content>
  </Card.Root>

  <!-- Themes list -->
  {#if data.subjectThemes && data.subjectThemes.length > 0}
    <Card.Root class="bg-gray-900/50 border-gray-800">
      <Card.Header>
        <Card.Title class="text-white">Thèmes</Card.Title>
        <Card.Description class="text-gray-400">{data.subjectThemes.length} thème(s) actif(s)</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {#each data.subjectThemes as theme}
            <a 
              href="/admin/subjects/{data.currentSubject?.code}/themes/{theme.slug}"
              class="p-3 rounded-lg border border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <p class="font-medium text-white">{theme.name}</p>
              {#if theme.description}
                <p class="text-sm text-gray-500 line-clamp-2">{theme.description}</p>
              {/if}
            </a>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
