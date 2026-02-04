<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2, X, RefreshCw } from 'lucide-svelte';
  
  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (value: any, row: any) => string;
  }
  
  interface Props {
    endpoint: string;
    columns: Column[];
    filters?: Record<string, any>;
    pageSize?: number;
    onRowClick?: (row: any) => void;
    rowActions?: {
      id: string;
      icon: any;
      label: string;
      onClick: (row: any) => void;
      variant?: 'default' | 'destructive';
    }[];
    children?: Snippet;
  }
  
  let { 
    endpoint, 
    columns, 
    filters = {},
    pageSize = 20,
    onRowClick,
    rowActions = [],
    children
  }: Props = $props();
  
  // State
  let data: any[] = $state([]);
  let total = $state(0);
  let totalPages = $state(0);
  let currentPage = $state(1);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let searchDraft = $state('');
  let sortColumn = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('desc');
  
  // Debounce timer for search
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Fetch data from API
  async function fetchData() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: currentPage,
          pageSize,
          search: searchQuery,
          sortColumn,
          sortDirection,
          filters
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement');
      }
      
      data = result.rows || [];
      total = result.total || 0;
      totalPages = result.totalPages || 0;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Erreur inconnue';
      data = [];
      total = 0;
      totalPages = 0;
    } finally {
      isLoading = false;
    }
  }
  
  // Track previous filter values to detect changes
  let prevFiltersJson = '';
  
  // Single effect for all data fetching dependencies
  $effect(() => {
    // Capture all dependencies
    const filtersJson = JSON.stringify(filters);
    const deps = [currentPage, searchQuery, sortColumn, sortDirection, filtersJson];
    
    // Check if filters changed to reset page
    if (filtersJson !== prevFiltersJson) {
      prevFiltersJson = filtersJson;
      if (currentPage !== 1) {
        currentPage = 1;
        return; // Will re-run with currentPage = 1
      }
    }
    
    fetchData();
  });
  
  // Handle search with debounce
  function handleSearchInput(value: string) {
    searchDraft = value;
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
      searchQuery = value;
      currentPage = 1;
    }, 300);
  }
  
  // Handle sort
  function handleSort(columnKey: string) {
    const column = columns.find(c => c.key === columnKey);
    if (!column?.sortable) return;
    
    if (sortColumn === columnKey) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = columnKey;
      sortDirection = 'asc';
    }
    currentPage = 1;
  }
  
  // Pagination helpers
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
  
  function clearSearch() {
    searchDraft = '';
    searchQuery = '';
    currentPage = 1;
  }
  
  // Get visible page numbers
  function getVisiblePages(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > 3) pages.push('ellipsis');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      
      pages.push(totalPages);
    }
    
    return pages;
  }
  
  // Expose refresh method
  export function refresh() {
    fetchData();
  }
</script>

<div class="space-y-4">
  <!-- Search bar -->
  <div class="flex items-center gap-4">
    <div class="relative flex-1 max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Rechercher..."
        value={searchDraft}
        oninput={(e) => handleSearchInput(e.currentTarget.value)}
        class="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {#if searchDraft}
        <button 
          onclick={clearSearch}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
    
    <!-- Slot for custom filters -->
    {@render children?.()}
    
    <Button variant="outline" size="sm" onclick={() => fetchData()} disabled={isLoading}>
      <RefreshCw class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" />
    </Button>
  </div>
  
  <!-- Stats -->
  <div class="text-sm text-gray-400">
    {total} résultat{total > 1 ? 's' : ''}
    {#if searchQuery}
      <span class="text-gray-500">pour "{searchQuery}"</span>
    {/if}
  </div>
  
  <!-- Table -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden">
    {#if isLoading && data.length === 0}
      <div class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    {:else if error}
      <div class="px-6 py-12 text-center">
        <p class="text-red-400 text-sm">{error}</p>
        <Button variant="outline" size="sm" onclick={() => fetchData()} class="mt-4">
          Réessayer
        </Button>
      </div>
    {:else if data.length === 0}
      <div class="px-6 py-12 text-center">
        <p class="text-gray-500 text-sm">Aucun résultat trouvé</p>
      </div>
    {:else}
      <div class="relative">
        {#if isLoading}
          <div class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10">
            <Loader2 class="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        {/if}
        
        <table class="w-full">
          <thead class="bg-gray-800/50 border-b border-gray-700">
            <tr>
              {#each columns as column}
                <th 
                  class="px-6 py-3 text-left text-sm font-semibold text-gray-300 {column.sortable ? 'cursor-pointer hover:bg-gray-700/50 select-none' : ''}"
                  style={column.width ? `width: ${column.width}` : ''}
                  onclick={() => column.sortable && handleSort(column.key)}
                >
                  <div class="flex items-center gap-2">
                    <span>{column.label}</span>
                    {#if column.sortable}
                      {#if sortColumn === column.key}
                        {#if sortDirection === 'asc'}
                          <ArrowUp class="w-4 h-4 text-blue-400" />
                        {:else}
                          <ArrowDown class="w-4 h-4 text-blue-400" />
                        {/if}
                      {:else}
                        <ArrowUpDown class="w-4 h-4 text-gray-600" />
                      {/if}
                    {/if}
                  </div>
                </th>
              {/each}
              {#if rowActions.length > 0}
                <th class="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each data as row (row.id)}
              <tr 
                class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors {onRowClick ? 'cursor-pointer' : ''}"
                onclick={() => onRowClick?.(row)}
              >
                {#each columns as column}
                  <td class="px-6 py-4 text-sm text-gray-300">
                    {#if column.render}
                      {@html column.render(row[column.key], row)}
                    {:else}
                      {row[column.key] ?? '-'}
                    {/if}
                  </td>
                {/each}
                {#if rowActions.length > 0}
                  <td class="px-6 py-4 text-right" onclick={(e) => e.stopPropagation()}>
                    <div class="flex items-center justify-end gap-2">
                      {#each rowActions as action}
                        <button 
                          onclick={() => action.onClick(row)}
                          class="p-1.5 rounded-lg transition-colors {action.variant === 'destructive' ? 'hover:bg-red-500/20' : 'hover:bg-gray-700'}" 
                          title={action.label}
                        >
                          <action.icon class="w-4 h-4 {action.variant === 'destructive' ? 'text-red-400' : 'text-gray-400'}" />
                        </button>
                      {/each}
                    </div>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  
  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-500">
        Page {currentPage} sur {totalPages}
      </div>
      
      <div class="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          onclick={() => goToPage(1)} 
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronsLeft class="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onclick={() => goToPage(currentPage - 1)} 
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft class="w-4 h-4" />
        </Button>
        
        {#each getVisiblePages() as pageNum}
          {#if pageNum === 'ellipsis'}
            <span class="px-2 text-gray-500">...</span>
          {:else}
            <Button 
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="sm"
              onclick={() => goToPage(pageNum)}
              disabled={isLoading}
            >
              {pageNum}
            </Button>
          {/if}
        {/each}
        
        <Button 
          variant="outline" 
          size="sm" 
          onclick={() => goToPage(currentPage + 1)} 
          disabled={currentPage === totalPages || isLoading}
        >
          <ChevronRight class="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onclick={() => goToPage(totalPages)} 
          disabled={currentPage === totalPages || isLoading}
        >
          <ChevronsRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>
