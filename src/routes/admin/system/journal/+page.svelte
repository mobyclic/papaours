<script lang="ts">
  import { Search, Filter, Info, AlertTriangle, AlertCircle, Check, Shield, Settings, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  interface Props {
    data: {
      logs: Array<{
        id: string;
        event_type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'system';
        action: string;
        message: string;
        entity_type?: string;
        entity_id?: string;
        entity_name?: string;
        user_email?: string;
        created_at: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      filters: {
        eventType: string;
        search: string;
      };
    };
  }

  let { data }: Props = $props();
  let searchQuery = $state('');
  let selectedType = $state('');
  
  $effect(() => {
    searchQuery = data.filters.search;
    selectedType = data.filters.eventType;
  });

  const eventTypes = [
    { value: '', label: 'Tous' },
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Succès' },
    { value: 'warning', label: 'Attention' },
    { value: 'error', label: 'Erreur' },
    { value: 'security', label: 'Sécurité' },
    { value: 'system', label: 'Système' },
  ];

  function getIcon(type: string) {
    switch (type) {
      case 'success': return Check;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'security': return Shield;
      case 'system': return Settings;
      default: return Info;
    }
  }

  function getTypeClass(type: string) {
    switch (type) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'security': return 'bg-purple-500/20 text-purple-400';
      case 'system': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedType) params.set('type', selectedType);
    goto(`/admin/system/journal?${params.toString()}`);
  }

  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', pageNum.toString());
    goto(`/admin/system/journal?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Journal - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Journal d'activité</h1>
    <p class="text-muted-foreground mt-1">Historique des événements système ({data.pagination.total} entrées)</p>
  </div>

  <!-- Filters -->
  <div class="flex gap-4 mb-6">
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Rechercher dans les logs..."
        bind:value={searchQuery}
        onkeydown={(e) => e.key === 'Enter' && applyFilters()}
        class="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
    <select 
      bind:value={selectedType}
      onchange={applyFilters}
      class="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {#each eventTypes as type}
        <option value={type.value}>{type.label}</option>
      {/each}
    </select>
    <button 
      onclick={applyFilters}
      class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
    >
      <Filter class="w-4 h-4" />
      Filtrer
    </button>
  </div>

  <!-- Logs -->
  <div class="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
    {#if data.logs.length === 0}
      <div class="p-8 text-center text-muted-foreground">
        <Info class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun log trouvé</p>
      </div>
    {:else}
      <div class="divide-y divide-border">
        {#each data.logs as log (log.id)}
          {@const IconComponent = getIcon(log.event_type)}
          <div class="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
            <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeClass(log.event_type)}`}>
              <IconComponent class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-foreground">{log.message}</p>
              <div class="flex gap-2 mt-1 text-xs text-muted-foreground">
                {#if log.action}
                  <span class="bg-muted px-2 py-0.5 rounded">{log.action}</span>
                {/if}
                {#if log.entity_type}
                  <span>{log.entity_type}{log.entity_name ? `: ${log.entity_name}` : ''}</span>
                {/if}
                {#if log.user_email}
                  <span>par {log.user_email}</span>
                {/if}
              </div>
            </div>
            <p class="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(log.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Pagination -->
  {#if data.pagination.totalPages > 1}
    <div class="flex items-center justify-between mt-4">
      <p class="text-sm text-muted-foreground">
        Page {data.pagination.page} sur {data.pagination.totalPages}
      </p>
      <div class="flex gap-2">
        <button
          onclick={() => goToPage(data.pagination.page - 1)}
          disabled={data.pagination.page <= 1}
          class="p-2 bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          onclick={() => goToPage(data.pagination.page + 1)}
          disabled={data.pagination.page >= data.pagination.totalPages}
          class="p-2 bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
</div>
