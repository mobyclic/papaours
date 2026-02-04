<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Eye, Edit2, Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ServerDataTable from "$lib/components/ServerDataTable.svelte";
  
  let { data }: { data: PageData } = $props();
  
  // Récupérer le rôle depuis l'URL
  let role = $derived($page.url.searchParams.get('role') || '');
  let cycleFilter = $state('');
  let gradeFilter = $state('');
  
  // Titre dynamique selon le rôle
  let pageTitle = $derived(() => {
    switch(role) {
      case 'student': return 'Apprenants';
      case 'tutor': return 'Tuteurs';
      case 'teacher': return 'Professeurs';
      default: return 'Utilisateurs';
    }
  });
  
  // Filtres à passer à l'API
  let filters = $derived({
    role: role || undefined,
    cycle: cycleFilter || undefined,
    grade: gradeFilter || undefined
  });
  
  // Colonnes du tableau
  const columns = [
    { 
      key: 'name', 
      label: 'Nom',
      sortable: true,
      render: (value: any, row: any) => `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            ${(row.prenom?.[0] || row.name?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p class="font-medium text-white">${row.name}</p>
            <p class="text-xs text-gray-500">${row.email || ''}</p>
          </div>
        </div>
      `
    },
    { 
      key: 'pseudo', 
      label: 'Pseudo',
      sortable: true,
      render: (value: any) => value ? `<span class="font-medium text-gray-300">@${value}</span>` : '<span class="text-gray-600">-</span>'
    },
    { 
      key: 'grade_name', 
      label: 'Classe',
      render: (value: any) => value 
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${value}</span>`
        : '<span class="text-gray-600">-</span>'
    },
    { 
      key: 'is_active', 
      label: 'Statut',
      render: (value: any, row: any) => {
        let html = value 
          ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Actif</span>'
          : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600/20 text-gray-400 border border-gray-600/30">Inactif</span>';
        if (row.is_admin) {
          html += ' <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Admin</span>';
        }
        return html;
      }
    }
  ];
  
  // Actions par ligne
  const rowActions = [
    {
      id: 'view',
      icon: Eye,
      label: 'Voir le profil',
      onClick: (row: any) => {
        const cleanId = row.id.includes(':') ? row.id.split(':')[1] : row.id;
        goto(`/admin/users/${cleanId}`);
      }
    },
    {
      id: 'edit',
      icon: Edit2,
      label: 'Modifier',
      onClick: (row: any) => {
        const cleanId = row.id.includes(':') ? row.id.split(':')[1] : row.id;
        goto(`/admin/users/${cleanId}/edit`);
      }
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Supprimer',
      onClick: (row: any) => {
        // TODO: Implémenter la suppression
        console.log('Delete', row);
      },
      variant: 'destructive' as const
    }
  ];
  
  // Grades filtrés par cycle sélectionné
  let filteredGrades = $derived.by(() => {
    if (!cycleFilter) return data.grades || [];
    return (data.grades || []).filter((g: any) => g.cycle_code === cycleFilter);
  });
  
  function clearFilters() {
    cycleFilter = '';
    gradeFilter = '';
  }
</script>

<svelte:head>
  <title>{pageTitle()} - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{pageTitle()}</h1>
        <p class="text-gray-400 mt-2">Gérez les {pageTitle().toLowerCase()} de la plateforme</p>
      </div>
      <Button class="bg-blue-600 hover:bg-blue-700 text-white">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau
      </Button>
    </div>
  </div>

  <!-- ServerDataTable -->
  <ServerDataTable 
    endpoint="/api/admin/users" 
    {columns}
    {filters}
    pageSize={20}
    {rowActions}
  >
    <!-- Filtres personnalisés -->
    <select
      bind:value={cycleFilter}
      onchange={() => { gradeFilter = ''; }}
      class="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
    >
      <option value="">Tous les cycles</option>
      {#each data.cycles || [] as cycle}
        <option value={cycle.code}>{cycle.name}</option>
      {/each}
    </select>
    
    <select
      bind:value={gradeFilter}
      class="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
    >
      <option value="">Toutes les classes</option>
      {#each filteredGrades as grade}
        <option value={grade.id}>{grade.name}</option>
      {/each}
    </select>
    
    {#if cycleFilter || gradeFilter}
      <button
        onclick={clearFilters}
        class="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        Effacer les filtres
      </button>
    {/if}
  </ServerDataTable>
</div>
