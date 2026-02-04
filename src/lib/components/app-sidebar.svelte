<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import { Button } from "$lib/components/ui/button";
  import { adminUser, logout } from "$lib/stores/adminStore.svelte";
  import { 
    BookOpen, 
    Users, 
    ImageIcon,
    Zap,
    LogOut,
    Home,
    HelpCircle,
    Tags,
    GraduationCap,
    Award,
    Library,
    User,
    ChevronsUpDown,
    ChevronUp,
    ChevronDown,
    Plus,
    Palette,
    FileText,
    BarChart3,
    Globe,
    Languages,
    GitBranch,
    Star,
    Settings,
    FolderOpen,
    Building2,
    Network,
    MapPin,
    UserCheck,
    School,
    Target
  } from "lucide-svelte";

  interface Subject {
    id: string;
    code: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    domain?: string;
    themeCount: number;
    questionCount: number;
    quizCount: number;
  }

  interface Props {
    data: {
      subjects?: Subject[];
      questionThemes?: any[];
      cycles?: any[];
      backofficeUser?: { email: string; name: string; role?: string; is_superadmin?: boolean } | null;
    };
  }

  let { data }: Props = $props();
  
  // Subjects (matières unifiées)
  let subjects = $derived(data?.subjects || []);
  
  // Détecter le contexte depuis l'URL
  let contextFromUrl = $derived(() => {
    const pathname = $page.url.pathname;
    const match = pathname.match(/^\/admin\/subjects\/([^\/]+)/);
    if (match) {
      return match[1]; // Le code du subject
    }
    return "kweez";
  });
  
  // Contexte actuel : synchronisé avec l'URL
  let currentContext = $derived(contextFromUrl());
  let currentSubject = $derived(subjects.find(s => s.code === currentContext));
  
  // Vérifier si l'utilisateur est superadmin
  let isSuperadmin = $derived(data?.backofficeUser?.is_superadmin ?? true); // Par défaut true pour l'instant
  
  // Données pour les menus
  let cycles = $derived(data?.cycles || []);
  
  // Structure du menu système (Kweez) - Organisé par groupes
  const menuGroups = [
    {
      label: "Principal",
      items: [
        { title: "Tableau de bord", url: "/admin", icon: Home, exact: true },
        { title: "Statistiques", url: "/admin/stats", icon: BarChart3 },
      ]
    },
    {
      label: "Personnes",
      items: [
        { title: "Apprenants", url: "/admin/users?role=student", icon: Users },
        { title: "Tuteurs", url: "/admin/users?role=tutor", icon: UserCheck },
        { title: "Professeurs", url: "/admin/users?role=teacher", icon: School },
      ]
    },
    {
      label: "Organisations",
      items: [
        { title: "Groupes", url: "/admin/organizations?type=group", icon: Building2 },
        { title: "Réseaux", url: "/admin/organizations?type=network", icon: Network },
        { title: "Campus", url: "/admin/organizations?type=campus", icon: MapPin },
      ]
    },
    {
      label: "Pédagogie",
      items: [
        { title: "Programmes", url: "/admin/programs", icon: Library },
        { title: "Compétences", url: "/admin/competences", icon: Target },
        { title: "Badges", url: "/admin/badges", icon: Award },
        { title: "Médias", url: "/admin/media", icon: ImageIcon },
      ]
    },
    {
      label: "Structure éducative",
      items: [
        { title: "Systèmes éducatifs", url: "/admin/system/settings/education-systems", icon: Globe },
        { title: "Cycles", url: "/admin/system/settings/cycles", icon: GraduationCap },
        { title: "Filières", url: "/admin/system/settings/tracks", icon: GitBranch },
        { title: "Classes", url: "/admin/system/settings/grades", icon: Users },
      ]
    },
    {
      label: "Organisation contenu",
      items: [
        { title: "Pôles", url: "/admin/system/settings/specialty-groups", icon: FolderOpen },
        { title: "Spécialités", url: "/admin/system/settings/specialties", icon: Star },
        { title: "Domaines", url: "/admin/system/settings/domains", icon: Palette },
        { title: "Matières", url: "/admin/system/settings/subjects", icon: BookOpen },
      ]
    },
    {
      label: "Localisation",
      items: [
        { title: "Langues", url: "/admin/system/settings/languages", icon: Languages },
        { title: "Traductions", url: "/admin/translations", icon: FileText },
      ]
    },
    {
      label: "Système",
      items: [
        { title: "Journal", url: "/admin/system/journal", icon: FileText },
      ]
    },
  ];

  function isActive(path: string): boolean {
    // Si le path contient un query string, comparer avec l'URL complète
    if (path.includes('?')) {
      const currentUrl = $page.url.pathname + $page.url.search;
      return currentUrl === path || currentUrl.startsWith(path + '&');
    }
    return $page.url.pathname === path || $page.url.pathname.startsWith(path + "/");
  }
  
  function isExactPath(path: string): boolean {
    // Si le path contient un query string, comparer avec l'URL complète
    if (path.includes('?')) {
      return ($page.url.pathname + $page.url.search) === path;
    }
    return $page.url.pathname === path;
  }

  async function handleLogout() {
    await logout();
    goto("/admin/login");
  }
  
  function selectContext(context: string) {
    if (context === "kweez") {
      goto("/admin");
    } else {
      // Rediriger vers le dashboard de la matière
      goto(`/admin/subjects/${context}`);
    }
  }
</script>

<Sidebar.Root collapsible="icon" class="border-r border-sidebar-border">
  <!-- Header avec le sélecteur de contexte -->
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton
                {...props}
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-sm">
                  {#if currentContext === "kweez"}
                    K
                  {:else if currentSubject?.icon}
                    {currentSubject.icon}
                  {:else}
                    {currentSubject?.name?.charAt(0) || "?"}
                  {/if}
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">
                    {currentContext === "kweez" ? "Kweez" : currentSubject?.name || "Matière"}
                  </span>
                  <span class="truncate text-xs text-muted-foreground">
                    {currentContext === "kweez" ? "Administration système" : currentSubject?.domain || "Matière"}
                  </span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg !bg-gray-900 !border-gray-800"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Label class="text-xs text-gray-500">
              Contexte
            </DropdownMenu.Label>
            
            {#if isSuperadmin}
              <DropdownMenu.Item onclick={() => selectContext("kweez")} class="gap-2 p-2 !bg-transparent hover:!bg-gray-800 focus:!bg-gray-800 data-[highlighted]:!bg-gray-800">
                <div class="flex size-6 items-center justify-center rounded-sm border border-orange-500/40 bg-gradient-to-br from-amber-400 to-orange-500">
                  <Zap class="size-4 text-white" />
                </div>
                <span class="font-medium text-gray-200">Kweez</span>
                <span class="ml-auto text-xs text-gray-500">Système</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator class="!bg-gray-800" />
            {/if}
            
            <DropdownMenu.Label class="text-xs text-gray-500">
              Matières
            </DropdownMenu.Label>
            
            {#each subjects as subject}
              <DropdownMenu.Item onclick={() => selectContext(subject.code)} class="gap-2 p-2 !bg-transparent hover:!bg-gray-800 focus:!bg-gray-800 data-[highlighted]:!bg-gray-800">
                <div class="flex size-6 items-center justify-center rounded-sm border" style="background-color: {subject.color || '#6366f1'}20; border-color: {subject.color || '#6366f1'}40">
                  {#if subject.icon}
                    <span class="text-sm">{subject.icon}</span>
                  {:else}
                    <BookOpen class="size-3.5" style="color: {subject.color || '#6366f1'}" />
                  {/if}
                </div>
                <span class="text-gray-200">{subject.name}</span>
              </DropdownMenu.Item>
            {/each}
            
            {#if isSuperadmin}
              <DropdownMenu.Separator class="!bg-gray-800" />
              <DropdownMenu.Item onclick={() => goto("/admin/system/settings/subjects")} class="gap-2 p-2 !bg-transparent hover:!bg-gray-800 focus:!bg-gray-800 data-[highlighted]:!bg-gray-800">
                <div class="flex size-6 items-center justify-center rounded-md border border-gray-700 bg-gray-800">
                  <Plus class="size-4 text-gray-400" />
                </div>
                <span class="font-medium text-gray-500">Gérer les matières</span>
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    {#if currentContext === "kweez"}
      <!-- Menu Système (Kweez) - Organisé par groupes -->
      {#each menuGroups as group}
        <Sidebar.Group>
          <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              {#each group.items as item}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive={item.exact ? isExactPath(item.url) : (item.url.includes('?') ? isExactPath(item.url) : isActive(item.url))}>
                    {#snippet child({ props })}
                      <a href={item.url} {...props}>
                        <item.icon class="size-4" />
                        <span>{item.title}</span>
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/each}
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
      {/each}
      
    {:else}
      <!-- Menu Subject (Matière) -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>
          {currentSubject?.name || "Matière"}
        </Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(`/admin/subjects/${currentContext}/quiz`)}>
                {#snippet child({ props })}
                  <a href={`/admin/subjects/${currentContext}/quiz`} {...props}>
                    <BookOpen class="size-4" />
                    <span>Quiz</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{currentSubject?.quizCount || 0}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
            
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(`/admin/subjects/${currentContext}/themes`)}>
                {#snippet child({ props })}
                  <a href={`/admin/subjects/${currentContext}/themes`} {...props}>
                    <Tags class="size-4" />
                    <span>Thèmes</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{currentSubject?.themeCount || 0}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
            
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(`/admin/subjects/${currentContext}/questions`)}>
                {#snippet child({ props })}
                  <a href={`/admin/subjects/${currentContext}/questions`} {...props}>
                    <HelpCircle class="size-4" />
                    <span>Questions</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{currentSubject?.questionCount || 0}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/if}
  </Sidebar.Content>

  <!-- Footer avec profil utilisateur -->
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton
                {...props}
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <User class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">
                    {data?.backofficeUser?.name || "Admin"}
                  </span>
                  <span class="truncate text-xs text-muted-foreground">
                    {data?.backofficeUser?.email || "admin@kweez.io"}
                  </span>
                </div>
                <ChevronUp class="ml-auto size-4" />
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
            side="top"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Item onclick={() => goto("/admin/profile")}>
              <User class="mr-2 size-4" />
              <span>Mon profil</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto("/admin/system/settings")}>
              <Settings class="mr-2 size-4" />
              <span>Paramètres</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={handleLogout}>
              <LogOut class="mr-2 size-4" />
              <span>Déconnexion</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>

  <Sidebar.Rail />
</Sidebar.Root>
