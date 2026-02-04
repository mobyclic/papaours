<script lang="ts">
  import { Users, HelpCircle, BookOpen, Activity, Award, Building2 } from 'lucide-svelte';

  interface RoleItem {
    role: string;
    total: number;
  }
  
  interface SessionItem {
    user_email?: string;
    quiz_title?: string;
  }

  let { data }: { 
    data: { 
      stats: { users: number; questions: number; quizzes: number; sessions: number; badges: number; organizations: number };
      usersByRole: RoleItem[];
      recentSessions: SessionItem[];
    } 
  } = $props();

  const statCards = $derived([
    { label: 'Utilisateurs', value: data.stats.users, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Questions', value: data.stats.questions, icon: HelpCircle, color: 'from-green-500 to-green-600' },
    { label: 'Quiz', value: data.stats.quizzes, icon: BookOpen, color: 'from-purple-500 to-purple-600' },
    { label: 'Sessions', value: data.stats.sessions, icon: Activity, color: 'from-orange-500 to-orange-600' },
    { label: 'Badges', value: data.stats.badges, icon: Award, color: 'from-yellow-500 to-yellow-600' },
    { label: 'Organisations', value: data.stats.organizations, icon: Building2, color: 'from-pink-500 to-pink-600' },
  ]);
</script>

<svelte:head>
  <title>Statistiques - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Statistiques</h1>
    <p class="text-muted-foreground mt-2">Vue d'ensemble de la plateforme</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
    {#each statCards as card}
      <div class="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gradient-to-br {card.color}">
            <card.icon class="size-5 text-white" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">{card.value}</p>
            <p class="text-xs text-muted-foreground">{card.label}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Détails -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Utilisateurs par rôle -->
    <div class="bg-card rounded-xl border border-border p-6">
      <h2 class="text-lg font-semibold text-foreground mb-4">Utilisateurs par rôle</h2>
      {#if data.usersByRole.length > 0}
        <div class="space-y-3">
          {#each data.usersByRole as item}
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground capitalize">{item.role || 'Non défini'}</span>
              <span class="font-medium text-foreground">{item.total}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-muted-foreground text-sm">Aucune donnée disponible</p>
      {/if}
    </div>

    <!-- Sessions récentes -->
    <div class="bg-card rounded-xl border border-border p-6">
      <h2 class="text-lg font-semibold text-foreground mb-4">Sessions récentes</h2>
      {#if data.recentSessions.length > 0}
        <div class="space-y-3">
          {#each data.recentSessions.slice(0, 5) as session}
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground truncate">{session.user_email || 'Anonyme'}</span>
              <span class="text-foreground">{session.quiz_title || 'Quiz'}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-muted-foreground text-sm">Aucune session récente</p>
      {/if}
    </div>
  </div>
</div>
