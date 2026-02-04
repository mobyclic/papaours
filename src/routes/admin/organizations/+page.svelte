<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Plus, Building2, Network, MapPin, Edit2, Trash2, ChevronRight } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  const typeLabels: Record<string, { label: string; icon: typeof Building2; color: string }> = {
    group: { label: 'Groupe', icon: Building2, color: 'bg-blue-500' },
    network: { label: 'Réseau', icon: Network, color: 'bg-purple-500' },
    campus: { label: 'Campus', icon: MapPin, color: 'bg-green-500' },
  };

  const tabs = [
    { type: '', label: 'Tous' },
    { type: 'group', label: 'Groupes' },
    { type: 'network', label: 'Réseaux' },
    { type: 'campus', label: 'Campus' },
  ];

  function getTypeInfo(type: string) {
    return typeLabels[type] || { label: type, icon: Building2, color: 'bg-gray-500' };
  }

  function getCount(type: string): number {
    if (!type) return data.organizations.length;
    const found = data.countByType.find((c: any) => c.type === type);
    return found?.total || 0;
  }
</script>

<svelte:head>
  <title>Organisations - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Organisations</h1>
      <p class="text-muted-foreground mt-2">Gérez les groupes, réseaux et campus</p>
    </div>
    <Button class="bg-green-600 hover:bg-green-700">
      <Plus class="size-4 mr-2" />
      Nouvelle organisation
    </Button>
  </div>

  <!-- Tabs -->
  <div class="flex gap-2 mb-6 border-b border-border">
    {#each tabs as tab}
      <button
        onclick={() => goto(tab.type ? `/admin/organizations?type=${tab.type}` : '/admin/organizations')}
        class="px-4 py-2 text-sm font-medium transition-colors relative {data.currentType === tab.type ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
      >
        {tab.label}
        <span class="ml-1 text-xs">({getCount(tab.type)})</span>
        {#if data.currentType === tab.type}
          <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Liste -->
  <div class="bg-card rounded-xl border border-border overflow-hidden">
    {#if data.organizations.length === 0}
      <div class="p-8 text-center text-muted-foreground">
        <Building2 class="size-12 mx-auto mb-4 opacity-50" />
        <p>Aucune organisation trouvée</p>
      </div>
    {:else}
      <div class="divide-y divide-border">
        {#each data.organizations as org}
          {@const typeInfo = getTypeInfo(org.type)}
          <div class="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
            <!-- Icon -->
            <div class="size-10 rounded-lg {typeInfo.color} flex items-center justify-center">
              <typeInfo.icon class="size-5 text-white" />
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-foreground">{org.name}</h3>
                <span class="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                  {typeInfo.label}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                {#if org.parent_name}
                  <span>{org.parent_name}</span>
                  <ChevronRight class="size-3" />
                {/if}
                {#if org.city}
                  <span>{org.city}</span>
                {/if}
                {#if org.category}
                  <span class="capitalize">• {org.category}</span>
                {/if}
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button class="p-2 hover:bg-muted rounded-lg transition-colors" title="Éditer">
                <Edit2 class="size-4 text-muted-foreground" />
              </button>
              <button class="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                <Trash2 class="size-4 text-red-500" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
