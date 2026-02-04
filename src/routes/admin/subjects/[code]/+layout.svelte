<script lang="ts">
  import type { LayoutData } from './$types';
  import { page } from '$app/stores';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { Separator } from '$lib/components/ui/separator';
  import { SidebarTrigger } from '$lib/components/ui/sidebar';
  
  let { data, children }: { data: LayoutData; children: any } = $props();
  
  // Navigation items pour ce subject
  const subjectNav = $derived([
    { label: 'Tableau de bord', href: `/admin/subjects/${data.currentSubject?.code}` },
    { label: 'Questions', href: `/admin/subjects/${data.currentSubject?.code}/questions` },
    { label: 'Quiz', href: `/admin/subjects/${data.currentSubject?.code}/quiz` },
    { label: 'Thèmes', href: `/admin/subjects/${data.currentSubject?.code}/themes` }
  ]);
  
  // Détermine le titre de la page actuelle
  const currentPageTitle = $derived(() => {
    const path = $page.url.pathname;
    const code = data.currentSubject?.code;
    if (path.endsWith(`/subjects/${code}`)) return 'Tableau de bord';
    if (path.includes('/questions')) return 'Questions';
    if (path.includes('/quiz')) return 'Quiz';
    if (path.includes('/themes')) return 'Thèmes';
    return 'Tableau de bord';
  });
</script>

<div class="flex flex-col h-full">
  <!-- Header with breadcrumb -->
  <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="mr-2 h-4" />
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/admin">Admin</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page class="flex items-center gap-2">
            {#if data.currentSubject?.icon}
              <span>{data.currentSubject.icon}</span>
            {/if}
            {data.currentSubject?.name || 'Matière'}
          </Breadcrumb.Page>
        </Breadcrumb.Item>
        {#if currentPageTitle() !== 'Tableau de bord'}
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>{currentPageTitle()}</Breadcrumb.Page>
          </Breadcrumb.Item>
        {/if}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  </header>
  
  <!-- Subject navigation tabs -->
  <nav class="flex items-center gap-1 border-b px-4 py-2 bg-muted/30">
    {#each subjectNav as item}
      <a 
        href={item.href}
        class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          {$page.url.pathname === item.href || 
           ($page.url.pathname.startsWith(item.href) && item.href !== `/admin/subjects/${data.currentSubject?.code}`)
            ? 'bg-primary text-primary-foreground' 
            : 'hover:bg-muted'}"
      >
        {item.label}
      </a>
    {/each}
  </nav>
  
  <!-- Content -->
  <main class="flex-1 overflow-auto p-4">
    {@render children?.()}
  </main>
</div>
