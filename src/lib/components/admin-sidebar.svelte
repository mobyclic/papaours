<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { 
    BookOpen, 
    Users, 
    ImageIcon,
    Zap,
    LogOut,
    ChevronDown,
    Home,
    HelpCircle,
    Tags
  } from "lucide-svelte";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import { Button } from "$lib/components/ui/button";
  import { adminUser, logout } from "$lib/stores/adminStore.svelte";

  let { data } = $props<{ data: any }>();
  
  // Thèmes avec nombre de quiz (pour la section Quiz)
  let themes = $derived(data?.themes || []);
  // Thèmes avec nombre de questions (pour la section Questions)  
  let questionThemes = $derived(data?.questionThemes || []);
  // Matières pour le menu Thèmes
  let matieres = $derived(data?.matieres || []);
  // Catégories de classes pour le menu Utilisateurs
  let classCategories = $derived(data?.classCategories || []);
  
  // État accordion - un seul menu ouvert à la fois
  type MenuSection = 'questions' | 'themes' | 'quiz' | 'users' | 'media' | 'system' | null;
  let openSection = $state<MenuSection>(null);
  
  // Déterminer la section ouverte en fonction de l'URL courante
  $effect(() => {
    const path = $page.url.pathname;
    if (path.startsWith('/admin/questions')) openSection = 'questions';
    else if (path.startsWith('/admin/system/settings/themes')) openSection = 'themes';
    else if (path.startsWith('/admin/quiz')) openSection = 'quiz';
    else if (path.startsWith('/admin/users')) openSection = 'users';
    else if (path.startsWith('/admin/media')) openSection = 'media';
    else if (path.startsWith('/admin/system')) openSection = 'system';
    else openSection = null;
  });
  
  function toggleSection(section: MenuSection) {
    openSection = openSection === section ? null : section;
  }
  
  function handleLogout() {
    logout();
    goto("/admin");
  }

  function isActive(path: string): boolean {
    return $page.url.pathname.startsWith(path);
  }
  
  function isExactPath(path: string): boolean {
    return $page.url.pathname === path;
  }
</script>

<aside class="w-64 h-screen flex flex-col bg-white border-r border-gray-200 overflow-hidden">
  <!-- Header Logo -->
  <div class="px-6 py-6 border-b border-gray-200">
    <h1 class="text-lg font-bold text-gray-900">Kwizy Admin</h1>
    <p class="text-xs text-gray-500 mt-1">Administration</p>
  </div>

  <!-- Navigation Menu -->
  <nav class="flex-1 overflow-y-auto px-2 py-4">
    <!-- Dashboard Home -->
    <a
      href="/admin"
      class="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg transition-colors"
      class:bg-purple-100={isExactPath("/admin")}
      class:text-purple-700={isExactPath("/admin")}
      class:text-gray-700={!isExactPath("/admin")}
      class:hover:bg-gray-100={!isExactPath("/admin")}
    >
      <Home class="w-4 h-4" />
      <span class="text-sm font-medium">Tableau de bord</span>
    </a>

    <!-- Questions Bank Section -->
    <Collapsible.Root open={openSection === 'questions'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('questions')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <HelpCircle class="w-4 h-4 text-gray-700" />
          <span class="text-sm font-medium text-gray-900">Questions</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/questions"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-indigo-100={isExactPath("/admin/questions")}
          class:text-indigo-700={isExactPath("/admin/questions")}
          class:text-gray-600={!isExactPath("/admin/questions")}
          class:hover:text-gray-900={!isExactPath("/admin/questions")}
        >
          Toutes les questions
        </a>
        {#each questionThemes as theme}
          <a
            href={`/admin/questions/theme/${theme.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            class:bg-indigo-100={isActive(`/admin/questions/theme/${theme.slug}`)}
            class:text-indigo-700={isActive(`/admin/questions/theme/${theme.slug}`)}
            class:text-gray-600={!isActive(`/admin/questions/theme/${theme.slug}`)}
            class:hover:text-gray-900={!isActive(`/admin/questions/theme/${theme.slug}`)}
          >
            <span>{theme.name}</span>
            <span class="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{theme.questionCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Themes Section -->
    <Collapsible.Root open={openSection === 'themes'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('themes')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <Tags class="w-4 h-4 text-gray-700" />
          <span class="text-sm font-medium text-gray-900">Thèmes</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/system/settings/themes"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-green-100={isExactPath("/admin/system/settings/themes")}
          class:text-green-700={isExactPath("/admin/system/settings/themes")}
          class:text-gray-600={!isExactPath("/admin/system/settings/themes")}
          class:hover:text-gray-900={!isExactPath("/admin/system/settings/themes")}
        >
          Tous les thèmes
        </a>
        {#each matieres as matiere}
          <a
            href={`/admin/system/settings/themes?matiere=${matiere.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            class:bg-green-100={$page.url.searchParams.get('matiere') === matiere.slug}
            class:text-green-700={$page.url.searchParams.get('matiere') === matiere.slug}
            class:text-gray-600={$page.url.searchParams.get('matiere') !== matiere.slug}
            class:hover:text-gray-900={$page.url.searchParams.get('matiere') !== matiere.slug}
          >
            <span>{matiere.name}</span>
            <span class="text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full">{matiere.themeCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Quiz Section -->
    <Collapsible.Root open={openSection === 'quiz'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('quiz')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <BookOpen class="w-4 h-4 text-gray-700" />
          <span class="text-sm font-medium text-gray-900">Quiz</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/quiz"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-purple-100={isExactPath("/admin/quiz")}
          class:text-purple-700={isExactPath("/admin/quiz")}
          class:text-gray-600={!isExactPath("/admin/quiz")}
          class:hover:text-gray-900={!isExactPath("/admin/quiz")}
        >
          Tous les quiz
        </a>
        {#each themes as theme}
          <a
            href={`/admin/quiz/theme/${theme.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            class:bg-purple-100={isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:text-purple-700={isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:text-gray-600={!isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:hover:text-gray-900={!isActive(`/admin/quiz/theme/${theme.slug}`)}
          >
            <span>{theme.name}</span>
            <span class="text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">{theme.quizCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Users Section -->
    <Collapsible.Root open={openSection === 'users'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('users')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <Users class="w-4 h-4 text-gray-700" />
          <span class="text-sm font-medium text-gray-900">Utilisateurs</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/users"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-blue-100={isExactPath("/admin/users")}
          class:text-blue-700={isExactPath("/admin/users")}
          class:text-gray-600={!isExactPath("/admin/users")}
          class:hover:text-gray-900={!isExactPath("/admin/users")}
        >
          Tous les utilisateurs
        </a>
        {#each classCategories as category}
          <a
            href={`/admin/users?category=${category.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            class:bg-blue-100={$page.url.searchParams.get('category') === category.slug}
            class:text-blue-700={$page.url.searchParams.get('category') === category.slug}
            class:text-gray-600={$page.url.searchParams.get('category') !== category.slug}
            class:hover:text-gray-900={$page.url.searchParams.get('category') !== category.slug}
          >
            <span>{category.name}</span>
            <span class="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">{category.userCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Medias Section -->
    <Collapsible.Root open={openSection === 'media'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('media')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <ImageIcon class="w-4 h-4 text-gray-700" />
          <span class="text-sm font-medium text-gray-900">Médias</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/media"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-purple-100={isExactPath("/admin/media")}
          class:text-purple-700={isExactPath("/admin/media")}
          class:text-gray-600={!isExactPath("/admin/media")}
          class:hover:text-gray-900={!isExactPath("/admin/media")}
        >
          Tous les médias
        </a>
        {#each ["Photos", "Vidéo", "Audio", "Animations"] as mediaType}
          <a
            href={`/admin/media/${mediaType.toLowerCase().replace(/\s+/g, '-')}`}
            class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            class:bg-purple-100={isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:text-purple-700={isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:text-gray-600={!isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:hover:text-gray-900={!isActive(`/admin/media/${mediaType.toLowerCase()}`)}
          >
            {mediaType}
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- System Section -->
    <Collapsible.Root open={openSection === 'system'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('system')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <Zap class="w-4 h-4 text-gray-700" />
          <span class="text-sm font-medium text-gray-900">Système</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/system/statistics"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-purple-100={isActive("/admin/system/statistics")}
          class:text-purple-700={isActive("/admin/system/statistics")}
          class:text-gray-600={!isActive("/admin/system/statistics")}
          class:hover:text-gray-900={!isActive("/admin/system/statistics")}
        >
          Statistiques
        </a>
        
        <!-- Settings Submenu -->
        <Collapsible.Root open={isActive("/admin/system/settings")}>
          <Collapsible.Trigger class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm group">
            <span class="text-gray-900 font-medium">Paramètres</span>
            <ChevronDown class="w-3 h-3 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
          </Collapsible.Trigger>
          
          <Collapsible.Content class="pl-6 space-y-1 mt-1">
            <a
              href="/admin/system/settings/subjects"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 transition-colors"
              class:bg-purple-100={isActive("/admin/system/settings/subjects")}
              class:text-purple-700={isActive("/admin/system/settings/subjects")}
              class:text-gray-600={!isActive("/admin/system/settings/subjects")}
              class:hover:text-gray-900={!isActive("/admin/system/settings/subjects")}
            >
              Matières
            </a>
            <a
              href="/admin/system/settings/levels"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 transition-colors"
              class:bg-purple-100={isActive("/admin/system/settings/levels")}
              class:text-purple-700={isActive("/admin/system/settings/levels")}
              class:text-gray-600={!isActive("/admin/system/settings/levels")}
              class:hover:text-gray-900={!isActive("/admin/system/settings/levels")}
            >
              Niveaux
            </a>
            <a
              href="/admin/system/settings/countries"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 transition-colors"
              class:bg-purple-100={isActive("/admin/system/settings/countries")}
              class:text-purple-700={isActive("/admin/system/settings/countries")}
              class:text-gray-600={!isActive("/admin/system/settings/countries")}
              class:hover:text-gray-900={!isActive("/admin/system/settings/countries")}
            >
              Pays
            </a>
            <a
              href="/admin/system/settings/languages"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 transition-colors"
              class:bg-purple-100={isActive("/admin/system/settings/languages")}
              class:text-purple-700={isActive("/admin/system/settings/languages")}
              class:text-gray-600={!isActive("/admin/system/settings/languages")}
              class:hover:text-gray-900={!isActive("/admin/system/settings/languages")}
            >
              Langues
            </a>
          </Collapsible.Content>
        </Collapsible.Root>

        <a
          href="/admin/system/journal"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          class:bg-purple-100={isActive("/admin/system/journal")}
          class:text-purple-700={isActive("/admin/system/journal")}
          class:text-gray-600={!isActive("/admin/system/journal")}
          class:hover:text-gray-900={!isActive("/admin/system/journal")}
        >
          Journal
        </a>
      </Collapsible.Content>
    </Collapsible.Root>
  </nav>

  <!-- User Profile Section at Bottom -->
  <div class="border-t border-gray-200 p-4 space-y-2">
    <div class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">
          {$adminUser?.name || $adminUser?.email || "Admin"}
        </p>
        <p class="text-xs text-gray-500 truncate">Admin</p>
      </div>
    </div>
    <Button
      onclick={handleLogout}
      variant="outline"
      class="w-full justify-start"
    >
      <LogOut class="w-4 h-4 mr-2" />
      Déconnexion
    </Button>
  </div>
</aside>
