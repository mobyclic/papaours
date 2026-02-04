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
    Settings
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
  
  // Items du menu système (Kweez) - Tout au même niveau, ordre logique
  const systemMenuItems = [
    // --- Principal ---
    { title: "Tableau de bord", url: "/admin", icon: Home },
    { title: "Utilisateurs", url: "/admin/users", icon: Users },
    // --- Contenu pédagogique ---
    { title: "Programmes", url: "/admin/programs", icon: Library },
    { title: "Cursus", url: "/admin/cursus", icon: GraduationCap },
    { title: "Badges", url: "/admin/badges", icon: Award },
    { title: "Médias", url: "/admin/media", icon: ImageIcon },
    // --- Structure éducative ---
    { title: "Systèmes éducatifs", url: "/admin/system/settings/education-systems", icon: Globe },
    { title: "Cycles", url: "/admin/system/settings/cycles", icon: GraduationCap },
    { title: "Filières", url: "/admin/system/settings/tracks", icon: GitBranch },
    { title: "Classes", url: "/admin/system/settings/grades", icon: Users },
    { title: "Spécialités", url: "/admin/system/settings/specialties", icon: Star },
    // --- Contenu ---
    { title: "Domaines", url: "/admin/system/settings/domains", icon: Palette },
    { title: "Matières", url: "/admin/system/settings/subjects", icon: BookOpen },
    // --- Localisation ---
    { title: "Langues", url: "/admin/system/settings/languages", icon: Languages },
    { title: "Traductions", url: "/admin/translations", icon: FileText },
    // --- Système ---
    { title: "Journal", url: "/admin/system/journal", icon: FileText },
  ];

  function isActive(path: string): boolean {
    return $page.url.pathname === path || $page.url.pathname.startsWith(path + "/");
  }
  
  function isExactPath(path: string): boolean {
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
            class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Label class="text-xs text-muted-foreground">
              Contexte
            </DropdownMenu.Label>
            
            {#if isSuperadmin}
              <DropdownMenu.Item onclick={() => selectContext("kweez")} class="gap-2 p-2">
                <div class="flex size-6 items-center justify-center rounded-sm border bg-gradient-to-br from-amber-400 to-orange-500">
                  <Zap class="size-4 text-white" />
                </div>
                <span class="font-medium">Kweez</span>
                <span class="ml-auto text-xs text-muted-foreground">Système</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
            {/if}
            
            <DropdownMenu.Label class="text-xs text-muted-foreground">
              Matières
            </DropdownMenu.Label>
            
            {#each subjects as subject}
              <DropdownMenu.Item onclick={() => selectContext(subject.code)} class="gap-2 p-2">
                <div class="flex size-6 items-center justify-center rounded-sm border" style="background-color: {subject.color || '#6366f1'}20; border-color: {subject.color || '#6366f1'}40">
                  {#if subject.icon}
                    <span class="text-sm">{subject.icon}</span>
                  {:else}
                    <BookOpen class="size-3.5" style="color: {subject.color || '#6366f1'}" />
                  {/if}
                </div>
                <span>{subject.name}</span>
              </DropdownMenu.Item>
            {/each}
            
            {#if isSuperadmin}
              <DropdownMenu.Separator />
              <DropdownMenu.Item onclick={() => goto("/admin/system/settings/subjects")} class="gap-2 p-2">
                <div class="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus class="size-4" />
                </div>
                <span class="font-medium text-muted-foreground">Gérer les matières</span>
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    {#if currentContext === "kweez"}
      <!-- Menu Système (Kweez) - Tout au même niveau -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each systemMenuItems as item}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive={item.url === "/admin" ? isExactPath(item.url) : isActive(item.url)}>
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
      
    {:else}
      <!-- Menu Subject (Matière) -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>
          {currentSubject?.name || "Matière"}
        </Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(`/admin/questions`) && $page.url.searchParams.get('subject') === currentContext}>
                {#snippet child({ props })}
                  <a href={`/admin/questions?subject=${currentContext}`} {...props}>
                    <HelpCircle class="size-4" />
                    <span>Questions</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{currentSubject?.questionCount || 0}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
            
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(`/admin/system/settings/themes`) && $page.url.searchParams.get('subject') === currentContext}>
                {#snippet child({ props })}
                  <a href={`/admin/system/settings/themes?subject=${currentContext}`} {...props}>
                    <Tags class="size-4" />
                    <span>Thèmes</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{currentSubject?.themeCount || 0}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
            
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(`/admin/quiz/subject/${currentContext}`)}>
                {#snippet child({ props })}
                  <a href={`/admin/quiz/subject/${currentContext}`} {...props}>
                    <BookOpen class="size-4" />
                    <span>Quiz</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{currentSubject?.quizCount || 0}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
      
      <!-- Thèmes du subject -->
      <Sidebar.Group>
        <Collapsible.Root open class="group/collapsible">
          <Sidebar.GroupLabel>
            {#snippet child({ props })}
              <Collapsible.Trigger {...props}>
                <Tags class="size-4" />
                Thèmes
                <ChevronDown class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </Collapsible.Trigger>
            {/snippet}
          </Sidebar.GroupLabel>
          <Collapsible.Content>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <!-- Les thèmes seront chargés dynamiquement -->
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    {#snippet child({ props })}
                      <a href={`/admin/system/settings/themes?subject=${currentContext}`} {...props}>
                        <Plus class="size-4" />
                        <span class="text-muted-foreground">Voir tous les thèmes</span>
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Collapsible.Content>
        </Collapsible.Root>
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
