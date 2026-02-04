<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2, Globe, BookOpen } from "lucide-svelte";

  interface Language {
    id: string;
    code: string;
    name: string;
    native_name: string;
    flag?: string;
  }

  interface EducationSystem {
    id: string;
    code: string;
    name: string;
    country_code: string;
    flag?: string;
    default_language: string;
    is_active: boolean;
    cycle_count?: number;
    language_details?: Language;
  }

  let educationSystems = $state<EducationSystem[]>([]);
  let languages = $state<Language[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Modal state
  let showModal = $state(false);
  let editingSystem = $state<EducationSystem | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formCode = $state('');
  let formCountryCode = $state('');
  let formFlag = $state('');
  let formLanguage = $state('fr');

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  const commonFlags = ['🇫🇷', '🇬🇧', '🇺🇸', '🇪🇸', '🇩🇪', '🇮🇹', '🇵🇹', '🇧🇪', '🇨🇭', '🇨🇦', '🇲🇦', '🇸🇳'];

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/admin/education-systems');
      if (res.ok) {
        const data = await res.json();
        educationSystems = data.educationSystems || [];
        languages = data.languages || [];
      } else {
        error = 'Erreur lors du chargement';
      }
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }

  function openAddModal() {
    editingSystem = null;
    formName = '';
    formCode = '';
    formCountryCode = '';
    formFlag = '🇫🇷';
    formLanguage = 'fr';
    modalError = '';
    showModal = true;
  }

  function openEditModal(system: EducationSystem) {
    editingSystem = system;
    formName = system.name;
    formCode = system.code;
    formCountryCode = system.country_code;
    formFlag = system.flag || '';
    formLanguage = system.default_language?.toString().replace('language:', '') || 'fr';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingSystem = null;
    modalError = '';
  }

  async function saveSystem() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }
    if (!editingSystem && !formCode.trim()) {
      modalError = 'Le code est requis';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        country_code: formCountryCode.trim().toUpperCase() || formCode.trim().toUpperCase(),
        flag: formFlag.trim() || null,
        default_language: formLanguage,
        is_active: editingSystem?.is_active ?? true
      };

      const url = editingSystem 
        ? `/api/admin/education-systems/${editingSystem.code}` 
        : '/api/admin/education-systems';
      
      const res = await fetch(url, {
        method: editingSystem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        modalError = data.message || 'Erreur lors de la sauvegarde';
        return;
      }

      closeModal();
      await loadData();
    } catch (e) {
      modalError = 'Erreur de connexion au serveur';
    } finally {
      saving = false;
    }
  }

  function confirmDelete(systemId: string) {
    deleteConfirm = systemId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteSystem(systemId: string) {
    deleting = true;
    try {
      const id = systemId.split(':')[1];
      const res = await fetch(`/api/admin/education-systems/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur lors de la suppression';
        deleteConfirm = null;
        return;
      }

      deleteConfirm = null;
      await loadData();
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      deleting = false;
    }
  }

  function getSystemId(system: EducationSystem): string {
    return typeof system.id === 'string' ? system.id : String(system.id);
  }
</script>

<svelte:head>
  <title>Systèmes éducatifs - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/system/settings" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Systèmes éducatifs</h1>
        <p class="text-muted-foreground mt-1">Gérez les systèmes éducatifs par pays (France, Belgique, Suisse...)</p>
      </div>
      <Button onclick={openAddModal}>
        <Plus class="w-4 h-4 mr-2" />
        Nouveau système
      </Button>
    </div>
  </div>

  {#if error}
    <div class="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
      {error}
      <button onclick={() => error = ''} class="ml-2 hover:opacity-70">×</button>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Chargement...</span>
    </div>
  {:else}
    <!-- Cards grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each educationSystems as system (getSystemId(system))}
        <div class="bg-card rounded-xl shadow border p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="text-4xl">{system.flag || '🌍'}</div>
              <div>
                <h3 class="font-semibold text-lg">{system.name}</h3>
                <p class="text-sm text-muted-foreground font-mono">{system.code}</p>
              </div>
            </div>
            {#if !system.is_active}
              <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Inactif</span>
            {/if}
          </div>

          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-sm">
              <Globe class="w-4 h-4 text-muted-foreground" />
              <span class="text-muted-foreground">Langue :</span>
              <span>{system.language_details?.native_name || system.default_language}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <BookOpen class="w-4 h-4 text-muted-foreground" />
              <span class="text-muted-foreground">Cycles :</span>
              <span>{system.cycle_count || 0}</span>
            </div>
          </div>

          <!-- Actions -->
          {#if deleteConfirm === getSystemId(system)}
            <div class="flex items-center justify-between pt-3 border-t">
              <span class="text-sm text-destructive">Supprimer ?</span>
              <div class="flex gap-2">
                <Button size="sm" variant="destructive" onclick={() => deleteSystem(getSystemId(system))} disabled={deleting}>
                  {#if deleting}
                    <Loader2 class="w-4 h-4 animate-spin" />
                  {:else}
                    <Check class="w-4 h-4" />
                  {/if}
                </Button>
                <Button size="sm" variant="outline" onclick={cancelDelete}>
                  <X class="w-4 h-4" />
                </Button>
              </div>
            </div>
          {:else}
            <div class="flex items-center justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="ghost" onclick={() => openEditModal(system)}>
                <Edit2 class="w-4 h-4 mr-1" />
                Modifier
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onclick={() => confirmDelete(getSystemId(system))}
                disabled={(system.cycle_count || 0) > 0}
                class="text-destructive hover:text-destructive"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          {/if}
        </div>
      {/each}

      {#if educationSystems.length === 0}
        <div class="col-span-full text-center py-12 text-muted-foreground">
          Aucun système éducatif pour le moment.
          <button onclick={openAddModal} class="text-primary hover:underline ml-1">
            Créer le premier ?
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Modal -->
<Dialog.Root bind:open={showModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>
        {editingSystem ? 'Modifier le système éducatif' : 'Nouveau système éducatif'}
      </Dialog.Title>
    </Dialog.Header>

    {#if modalError}
      <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
        {modalError}
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); saveSystem(); }} class="space-y-4">
      <!-- Nom -->
      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">
          Nom <span class="text-destructive">*</span>
        </label>
        <Input id="name" bind:value={formName} placeholder="Ex: France" required />
      </div>

      <!-- Code -->
      {#if !editingSystem}
        <div class="space-y-2">
          <label for="code" class="text-sm font-medium">
            Code <span class="text-destructive">*</span>
          </label>
          <Input 
            id="code" 
            bind:value={formCode} 
            placeholder="Ex: FR" 
            class="font-mono uppercase"
            maxlength={5}
            required 
          />
          <p class="text-xs text-muted-foreground">Code ISO du pays (2-3 lettres)</p>
        </div>
      {/if}

      <!-- Flag -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Drapeau</label>
        <div class="flex flex-wrap gap-2">
          {#each commonFlags as flag}
            <button
              type="button"
              onclick={() => formFlag = flag}
              class="w-10 h-10 rounded-lg text-2xl hover:bg-muted transition-colors {formFlag === flag ? 'ring-2 ring-primary bg-muted' : 'bg-muted/50'}"
            >
              {flag}
            </button>
          {/each}
        </div>
        <Input bind:value={formFlag} placeholder="Ou entrez un emoji..." class="mt-2" />
      </div>

      <!-- Langue par défaut -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Langue par défaut</label>
        <Select.Root type="single" bind:value={formLanguage}>
          <Select.Trigger class="w-full">
            {#snippet children()}
              {languages.find(l => l.code === formLanguage)?.native_name || 'Sélectionner...'}
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            {#each languages as lang}
              <Select.Item value={lang.code}>
                {lang.flag} {lang.native_name} ({lang.code})
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Boutons -->
      <div class="flex gap-3 pt-4">
        <Button type="button" variant="outline" onclick={closeModal} class="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} class="flex-1">
          {#if saving}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {:else}
            <Check class="w-4 h-4 mr-2" />
          {/if}
          {editingSystem ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
