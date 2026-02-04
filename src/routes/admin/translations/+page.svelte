<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Globe, Save, Check, X } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  let { data } = $props();
  
  let saving = $state(false);
  let saveSuccess = $state<string | null>(null);
  let saveError = $state<string | null>(null);
  
  // État local des traductions modifiées
  let localTranslations = $state<Record<string, Record<string, string>>>({});
  
  // Initialiser avec les traductions existantes
  $effect(() => {
    localTranslations = { ...data.translations };
  });
  
  function getTranslation(entityId: string, field: string): string {
    const key = `${data.entityType}:${entityId}`;
    return localTranslations[key]?.[field] || '';
  }
  
  function setTranslation(entityId: string, field: string, value: string) {
    const key = `${data.entityType}:${entityId}`;
    if (!localTranslations[key]) {
      localTranslations[key] = {};
    }
    localTranslations[key][field] = value;
    localTranslations = { ...localTranslations };
  }
  
  function changeEntityType(type: string) {
    goto(`/admin/translations?type=${type}&lang=${data.selectedLang}`);
  }
  
  function changeLanguage(lang: string) {
    goto(`/admin/translations?type=${data.entityType}&lang=${lang}`);
  }
  
  async function saveTranslations() {
    saving = true;
    saveSuccess = null;
    saveError = null;
    
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: data.entityType,
          language: data.selectedLang,
          translations: localTranslations
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la sauvegarde');
      }
      
      saveSuccess = 'Traductions enregistrées !';
      setTimeout(() => saveSuccess = null, 3000);
    } catch (e) {
      saveError = e instanceof Error ? e.message : 'Erreur inconnue';
    } finally {
      saving = false;
    }
  }
  
  // Compter les traductions manquantes
  let missingCount = $derived.by(() => {
    let count = 0;
    for (const entity of data.entities) {
      const cleanId = entity.id.includes(':') ? entity.id.split(':')[1] : entity.id;
      if (!getTranslation(cleanId, 'name')) count++;
    }
    return count;
  });
  
  let completedCount = $derived(data.entities.length - missingCount);
</script>

<svelte:head>
  <title>Traductions - Admin Kweez</title>
</svelte:head>

<div class="flex-1 p-6 overflow-auto max-w-6xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
        <Globe class="w-8 h-8 text-amber-400" />
        Traductions du contenu
      </h1>
      <p class="text-gray-400 mt-1">
        Gérez les traductions des domaines, matières, classes, etc.
      </p>
    </div>
    
    <Button onclick={saveTranslations} disabled={saving} class="gap-2">
      {#if saving}
        <span class="animate-spin">⏳</span>
      {:else}
        <Save class="w-4 h-4" />
      {/if}
      Enregistrer
    </Button>
  </div>
  
  <!-- Success/Error messages -->
  {#if saveSuccess}
    <div class="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2">
      <Check class="w-4 h-4" />
      {saveSuccess}
    </div>
  {/if}
  
  {#if saveError}
    <div class="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
      <X class="w-4 h-4" />
      {saveError}
    </div>
  {/if}
  
  <!-- Filters -->
  <div class="flex gap-4 mb-6">
    <!-- Entity Type Selector -->
    <div class="flex-1">
      <div class="block text-sm font-medium text-gray-300 mb-1">Type d'entité</div>
      <div class="flex gap-2 flex-wrap">
        {#each data.entityTypes as type}
          <button
            onclick={() => changeEntityType(type.code)}
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
              {data.entityType === type.code 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}"
          >
            {type.icon} {type.name}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Language Selector -->
    <div class="w-48">
      <div class="block text-sm font-medium text-gray-300 mb-1">Langue cible</div>
      <select 
        class="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        value={data.selectedLang}
        onchange={(e) => changeLanguage(e.currentTarget.value)}
      >
        {#each data.languages.filter((l: any) => l.code !== 'fr') as lang}
          <option value={lang.code}>
            {lang.native_name} ({lang.code})
          </option>
        {/each}
      </select>
    </div>
  </div>
  
  <!-- Progress -->
  <div class="mb-6 p-4 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-300">
        Progression : {completedCount} / {data.entities.length} traduits
      </span>
      <span class="text-sm text-gray-400">
        {missingCount > 0 ? `${missingCount} manquant(s)` : '✅ Complet'}
      </span>
    </div>
    <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
      <div 
        class="h-full bg-green-500 transition-all"
        style="width: {data.entities.length > 0 ? (completedCount / data.entities.length) * 100 : 0}%"
      ></div>
    </div>
  </div>
  
  <!-- Translation Table -->
  <div class="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-800/50 border-b border-gray-700">
        <tr>
          <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Code</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">
            🇫🇷 Français (original)
          </th>
          <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">
            {data.languages.find((l: any) => l.code === data.selectedLang)?.native_name || data.selectedLang} (traduction)
          </th>
          <th class="px-4 py-3 text-center text-sm font-medium text-gray-300 w-16">État</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-800">
        {#each data.entities as entity}
          {@const cleanId = entity.id.includes(':') ? entity.id.split(':')[1] : entity.id}
          {@const translation = getTranslation(cleanId, 'name')}
          <tr class="hover:bg-gray-800/50">
            <td class="px-4 py-3 text-sm text-gray-500 font-mono">
              {entity.code}
              {#if entity.domain_name}
                <span class="block text-xs text-gray-600">{entity.domain_name}</span>
              {:else if entity.cycle_name}
                <span class="block text-xs text-gray-600">{entity.cycle_name}</span>
              {:else if entity.system_name}
                <span class="block text-xs text-gray-600">{entity.system_name}</span>
              {:else if entity.track_name}
                <span class="block text-xs text-gray-600">{entity.track_name}</span>
              {/if}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                {#if entity.icon}
                  <span class="text-lg">{entity.icon}</span>
                {/if}
                <span class="text-sm text-white">{entity.name}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <Input
                type="text"
                value={translation}
                oninput={(e) => setTranslation(cleanId, 'name', e.currentTarget.value)}
                placeholder="Entrez la traduction..."
                class="text-sm"
              />
            </td>
            <td class="px-4 py-3 text-center">
              {#if translation}
                <span class="text-green-500" title="Traduit">✓</span>
              {:else}
                <span class="text-gray-300" title="Non traduit">○</span>
              {/if}
            </td>
          </tr>
        {/each}
        
        {#if data.entities.length === 0}
          <tr>
            <td colspan="4" class="px-4 py-8 text-center text-gray-400">
              Aucune entité trouvée pour ce type.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
