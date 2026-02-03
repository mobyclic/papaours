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
    Tags,
    GraduationCap,
    Award,
    Library,
    User
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
  // Cycles pour le menu Utilisateurs
  let cycles = $derived(data?.cycles || []);
  
  // État accordion - un seul menu ouvert à la fois
  type MenuSection = 'questions' | 'themes' | 'quiz' | 'users' | 'media' | 'system' | 'cursus' | 'badges' | 'programs' | null;
  let openSection = $state<MenuSection>(null);
  
  // Déterminer la section ouverte en fonction de l'URL courante
  $effect(() => {
    const path = $page.url.pathname;
    if (path.startsWith('/admin/questions')) openSection = 'questions';
    else if (path.startsWith('/admin/system/settings/themes')) openSection = 'themes';
    else if (path.startsWith('/admin/quiz')) openSection = 'quiz';
    else if (path.startsWith('/admin/users')) openSection = 'users';
    else if (path.startsWith('/admin/media')) openSection = 'media';
    else if (path.startsWith('/admin/cursus')) openSection = 'cursus';
    else if (path.startsWith('/admin/badges')) openSection = 'badges';
    else if (path.startsWith('/admin/programs')) openSection = 'programs';
    else if (path.startsWith('/admin/system')) openSection = 'system';
    else openSection = null;
  });
  
  function toggleSection(section: MenuSection) {
    openSection = openSection === section ? null : section;
  }
  
  async function handleLogout() {
    await logout();
    goto("/admin/login");
  }

  function isActive(path: string): boolean {
    return $page.url.pathname.startsWith(path);
  }
  
  function isExactPath(path: string): boolean {
    return $page.url.pathname === path;
  }
  
  // Helper pour les classes dynamiques avec opacité
  function linkClass(active: boolean, color: string): string {
    return active 
      ? `bg-${color}-500/20 text-${color}-400` 
      : 'text-gray-400 hover:text-gray-200';
  }
</script>

<aside class="w-64 h-screen flex flex-col bg-gray-900 border-r border-gray-800 overflow-hidden">
  <!-- Header Logo -->
  <div class="px-6 py-6 border-b border-gray-800">
    <h1 class="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Kweez Admin</h1>
    <p class="text-xs text-gray-500 mt-1">Administration</p>
  </div>

  <!-- Navigation Menu -->
  <nav class="flex-1 overflow-y-auto px-2 py-4">
    <!-- Dashboard Home -->
    <a
      href="/admin"
      class="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg transition-colors"
      class:bg-amber-900={isExactPath('/admin')}
      class:bg-opacity-30={isExactPath('/admin')}
      class:text-amber-400={isExactPath('/admin')}
      class:text-gray-300={!isExactPath('/admin')}
      class:hover:bg-gray-800={!isExactPath('/admin')}
    >
      <Home class="w-4 h-4" />
      <span class="text-sm font-medium">Tableau de bord</span>
    </a>

    <!-- Questions Bank Section -->
    <Collapsible.Root open={openSection === 'questions'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('questions')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <HelpCircle class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-200">Questions</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/questions"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-indigo-900={isExactPath("/admin/questions")}
          class:bg-opacity-30={isExactPath("/admin/questions")}
          class:text-indigo-400={isExactPath("/admin/questions")}
          class:text-gray-400={!isExactPath("/admin/questions")}
          class:hover:text-gray-200={!isExactPath("/admin/questions")}
        >
          Toutes les questions
        </a>
        {#each questionThemes as theme}
          <a
            href={`/admin/questions/theme/${theme.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
            class:bg-indigo-900={isActive(`/admin/questions/theme/${theme.slug}`)}
            class:bg-opacity-30={isActive(`/admin/questions/theme/${theme.slug}`)}
            class:text-indigo-400={isActive(`/admin/questions/theme/${theme.slug}`)}
            class:text-gray-400={!isActive(`/admin/questions/theme/${theme.slug}`)}
            class:hover:text-gray-200={!isActive(`/admin/questions/theme/${theme.slug}`)}
          >
            <span>{theme.name}</span>
            <span class="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{theme.questionCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Themes Section -->
    <Collapsible.Root open={openSection === 'themes'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('themes')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <Tags class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-200">Thèmes</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/system/settings/themes"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-green-900={isExactPath("/admin/system/settings/themes")}
          class:bg-opacity-30={isExactPath("/admin/system/settings/themes")}
          class:text-green-400={isExactPath("/admin/system/settings/themes")}
          class:text-gray-400={!isExactPath("/admin/system/settings/themes")}
          class:hover:text-gray-200={!isExactPath("/admin/system/settings/themes")}
        >
          Tous les thèmes
        </a>
        {#each matieres as matiere}
          <a
            href={`/admin/system/settings/themes?matiere=${matiere.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
            class:bg-green-900={$page.url.searchParams.get('matiere') === matiere.slug}
            class:bg-opacity-30={$page.url.searchParams.get('matiere') === matiere.slug}
            class:text-green-400={$page.url.searchParams.get('matiere') === matiere.slug}
            class:text-gray-400={$page.url.searchParams.get('matiere') !== matiere.slug}
            class:hover:text-gray-200={$page.url.searchParams.get('matiere') !== matiere.slug}
          >
            <span>{matiere.name}</span>
            <span class="text-xs bg-green-900 bg-opacity-50 text-green-400 px-1.5 py-0.5 rounded-full">{matiere.themeCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Quiz Section -->
    <Collapsible.Root open={openSection === 'quiz'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('quiz')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <BookOpen class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-200">Quiz</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/quiz"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-purple-900={isExactPath("/admin/quiz")}
          class:bg-opacity-30={isExactPath("/admin/quiz")}
          class:text-purple-400={isExactPath("/admin/quiz")}
          class:text-gray-400={!isExactPath("/admin/quiz")}
          class:hover:text-gray-200={!isExactPath("/admin/quiz")}
        >
          Tous les quiz
        </a>
        {#each themes as theme}
          <a
            href={`/admin/quiz/theme/${theme.slug}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
            class:bg-purple-900={isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:bg-opacity-30={isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:text-purple-400={isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:text-gray-400={!isActive(`/admin/quiz/theme/${theme.slug}`)}
            class:hover:text-gray-200={!isActive(`/admin/quiz/theme/${theme.slug}`)}
          >
            <span>{theme.name}</span>
            <span class="text-xs bg-purple-900 bg-opacity-50 text-purple-400 px-1.5 py-0.5 rounded-full">{theme.quizCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Users Section -->
    <Collapsible.Root open={openSection === 'users'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('users')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <Users class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-200">Utilisateurs</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/users"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-blue-900={isExactPath("/admin/users")}
          class:bg-opacity-30={isExactPath("/admin/users")}
          class:text-blue-400={isExactPath("/admin/users")}
          class:text-gray-400={!isExactPath("/admin/users")}
          class:hover:text-gray-200={!isExactPath("/admin/users")}
        >
          Tous les utilisateurs
        </a>
        {#each cycles as cycle}
          <a
            href={`/admin/users?cycle=${cycle.code}`}
            class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
            class:bg-blue-900={$page.url.searchParams.get('cycle') === cycle.code}
            class:bg-opacity-30={$page.url.searchParams.get('cycle') === cycle.code}
            class:text-blue-400={$page.url.searchParams.get('cycle') === cycle.code}
            class:text-gray-400={$page.url.searchParams.get('cycle') !== cycle.code}
            class:hover:text-gray-200={$page.url.searchParams.get('cycle') !== cycle.code}
          >
            <span>{cycle.name}</span>
            <span class="text-xs bg-blue-900 bg-opacity-50 text-blue-400 px-1.5 py-0.5 rounded-full">{cycle.userCount}</span>
          </a>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <!-- Cursus Section -->
    <a
      href="/admin/cursus"
      class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
      class:bg-amber-900={isActive("/admin/cursus")}
      class:bg-opacity-30={isActive("/admin/cursus")}
      class:text-amber-400={isActive("/admin/cursus")}
      class:text-gray-300={!isActive("/admin/cursus")}
      class:hover:bg-gray-800={!isActive("/admin/cursus")}
    >
      <GraduationCap class="w-4 h-4" />
      <span class="text-sm font-medium">Cursus</span>
    </a>

    <!-- Badges Section -->
    <a
      href="/admin/badges"
      class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
      class:bg-yellow-900={isActive("/admin/badges")}
      class:bg-opacity-30={isActive("/admin/badges")}
      class:text-yellow-400={isActive("/admin/badges")}
      class:text-gray-300={!isActive("/admin/badges")}
      class:hover:bg-gray-800={!isActive("/admin/badges")}
    >
      <Award class="w-4 h-4" />
      <span class="text-sm font-medium">Badges</span>
    </a>

    <!-- Programs Section -->
    <a
      href="/admin/programs"
      class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
      class:bg-indigo-900={isActive("/admin/programs")}
      class:bg-opacity-30={isActive("/admin/programs")}
      class:text-indigo-400={isActive("/admin/programs")}
      class:text-gray-300={!isActive("/admin/programs")}
      class:hover:bg-gray-800={!isActive("/admin/programs")}
    >
      <Library class="w-4 h-4" />
      <span class="text-sm font-medium">Programmes</span>
    </a>

    <!-- Medias Section -->
    <Collapsible.Root open={openSection === 'media'}>
      <Collapsible.Trigger 
        onclick={() => toggleSection('media')}
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <ImageIcon class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-200">Médias</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/media"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-purple-900={isExactPath("/admin/media")}
          class:bg-opacity-30={isExactPath("/admin/media")}
          class:text-purple-400={isExactPath("/admin/media")}
          class:text-gray-400={!isExactPath("/admin/media")}
          class:hover:text-gray-200={!isExactPath("/admin/media")}
        >
          Tous les médias
        </a>
        {#each ["Photos", "Vidéo", "Audio", "Animations"] as mediaType}
          <a
            href={`/admin/media/${mediaType.toLowerCase().replace(/\s+/g, '-')}`}
            class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
            class:bg-purple-900={isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:bg-opacity-30={isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:text-purple-400={isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:text-gray-400={!isActive(`/admin/media/${mediaType.toLowerCase()}`)}
            class:hover:text-gray-200={!isActive(`/admin/media/${mediaType.toLowerCase()}`)}
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
        class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <Zap class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-200">Système</span>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      
      <Collapsible.Content class="pl-6 space-y-1 mt-1">
        <a
          href="/admin/system/statistics"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-purple-900={isActive("/admin/system/statistics")}
          class:bg-opacity-30={isActive("/admin/system/statistics")}
          class:text-purple-400={isActive("/admin/system/statistics")}
          class:text-gray-400={!isActive("/admin/system/statistics")}
          class:hover:text-gray-200={!isActive("/admin/system/statistics")}
        >
          Statistiques
        </a>
        
        <!-- Settings Submenu -->
        <Collapsible.Root open={isActive("/admin/system/settings")}>
          <Collapsible.Trigger class="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm group">
            <span class="text-gray-200 font-medium">Paramètres</span>
            <ChevronDown class="w-3 h-3 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
          </Collapsible.Trigger>
          
          <Collapsible.Content class="pl-6 space-y-1 mt-1">
            <a
              href="/admin/system/settings/subjects"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-800 transition-colors"
              class:bg-purple-900={isActive("/admin/system/settings/subjects")}
              class:bg-opacity-30={isActive("/admin/system/settings/subjects")}
              class:text-purple-400={isActive("/admin/system/settings/subjects")}
              class:text-gray-400={!isActive("/admin/system/settings/subjects")}
              class:hover:text-gray-200={!isActive("/admin/system/settings/subjects")}
            >
              Matières
            </a>
            <a
              href="/admin/system/settings/levels"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-800 transition-colors"
              class:bg-purple-900={isActive("/admin/system/settings/levels")}
              class:bg-opacity-30={isActive("/admin/system/settings/levels")}
              class:text-purple-400={isActive("/admin/system/settings/levels")}
              class:text-gray-400={!isActive("/admin/system/settings/levels")}
              class:hover:text-gray-200={!isActive("/admin/system/settings/levels")}
            >
              Niveaux
            </a>
            <a
              href="/admin/system/settings/countries"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-800 transition-colors"
              class:bg-purple-900={isActive("/admin/system/settings/countries")}
              class:bg-opacity-30={isActive("/admin/system/settings/countries")}
              class:text-purple-400={isActive("/admin/system/settings/countries")}
              class:text-gray-400={!isActive("/admin/system/settings/countries")}
              class:hover:text-gray-200={!isActive("/admin/system/settings/countries")}
            >
              Pays
            </a>
            <a
              href="/admin/system/settings/languages"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-800 transition-colors"
              class:bg-purple-900={isActive("/admin/system/settings/languages")}
              class:bg-opacity-30={isActive("/admin/system/settings/languages")}
              class:text-purple-400={isActive("/admin/system/settings/languages")}
              class:text-gray-400={!isActive("/admin/system/settings/languages")}
              class:hover:text-gray-200={!isActive("/admin/system/settings/languages")}
            >
              Langues
            </a>
            <a
              href="/admin/translations"
              class="block px-3 py-2 text-xs rounded-lg hover:bg-gray-800 transition-colors"
              class:bg-purple-900={isActive("/admin/translations")}
              class:bg-opacity-30={isActive("/admin/translations")}
              class:text-purple-400={isActive("/admin/translations")}
              class:text-gray-400={!isActive("/admin/translations")}
              class:hover:text-gray-200={!isActive("/admin/translations")}
            >
              🌍 Traductions
            </a>
          </Collapsible.Content>
        </Collapsible.Root>

        <a
          href="/admin/system/journal"
          class="block px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          class:bg-purple-900={isActive("/admin/system/journal")}
          class:bg-opacity-30={isActive("/admin/system/journal")}
          class:text-purple-400={isActive("/admin/system/journal")}
          class:text-gray-400={!isActive("/admin/system/journal")}
          class:hover:text-gray-200={!isActive("/admin/system/journal")}
        >
          Journal
        </a>
      </Collapsible.Content>
    </Collapsible.Root>
  </nav>

  <!-- User Profile Section at Bottom -->
  <div class="border-t border-gray-800 p-4 space-y-2">
    <a
      href="/admin/profile"
      class="flex items-center gap-3 w-full px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
    >
      <User class="w-4 h-4" />
      Mon profil
    </a>
    <Button
      onclick={handleLogout}
      variant="outline"
      class="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
    >
      <LogOut class="w-4 h-4 mr-2" />
      Déconnexion
    </Button>
  </div>
</aside>
