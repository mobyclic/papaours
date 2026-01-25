<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft, X, Check, Loader2 } from "lucide-svelte";

  interface Subject {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    order: number;
    is_active: boolean;
  }

  let subjects = $state<Subject[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Modal state
  let showModal = $state(false);
  let editingSubject = $state<Subject | null>(null);
  let saving = $state(false);
  let modalError = $state('');

  // Form state
  let formName = $state('');
  let formDescription = $state('');
  let formColor = $state('#6366F1');
  let formIcon = $state('');

  // Delete confirmation
  let deleteConfirm = $state<string | null>(null);
  let deleting = $state(false);

  const defaultColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#84CC16', // Lime
  ];

  onMount(async () => {
    await loadSubjects();
  });

  async function loadSubjects() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/admin/subjects');
      if (res.ok) {
        const data = await res.json();
        subjects = data.subjects || [];
      } else {
        error = 'Erreur lors du chargement des matières';
      }
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }

  function openAddModal() {
    editingSubject = null;
    formName = '';
    formDescription = '';
    formColor = '#6366F1';
    formIcon = '';
    modalError = '';
    showModal = true;
  }

  function openEditModal(subject: Subject) {
    editingSubject = subject;
    formName = subject.name;
    formDescription = subject.description || '';
    formColor = subject.color || '#6366F1';
    formIcon = subject.icon || '';
    modalError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingSubject = null;
    modalError = '';
  }

  async function saveSubject() {
    if (!formName.trim()) {
      modalError = 'Le nom est requis';
      return;
    }

    saving = true;
    modalError = '';

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        color: formColor,
        icon: formIcon.trim() || null,
        is_active: editingSubject?.is_active ?? true,
        order: editingSubject?.order ?? 0
      };

      const url = editingSubject 
        ? `/api/admin/subjects/${editingSubject.id.split(':')[1]}` 
        : '/api/admin/subjects';
      
      const res = await fetch(url, {
        method: editingSubject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        modalError = data.message || 'Erreur lors de la sauvegarde';
        return;
      }

      closeModal();
      await loadSubjects();
    } catch (e) {
      modalError = 'Erreur de connexion au serveur';
    } finally {
      saving = false;
    }
  }

  function confirmDelete(subjectId: string) {
    deleteConfirm = subjectId;
  }

  function cancelDelete() {
    deleteConfirm = null;
  }

  async function deleteSubject(subjectId: string) {
    deleting = true;
    try {
      const id = subjectId.split(':')[1];
      const res = await fetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur lors de la suppression';
        deleteConfirm = null;
        return;
      }

      deleteConfirm = null;
      await loadSubjects();
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      deleting = false;
    }
  }

  function getSubjectId(subject: Subject): string {
    return typeof subject.id === 'string' ? subject.id : String(subject.id);
  }
</script>

<svelte:head>
  <title>Matières - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/dashboard/system/settings" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Matières</h1>
        <p class="text-gray-600 mt-1">Gérez les matières disponibles pour les quiz</p>
      </div>
      <Button onclick={openAddModal} class="bg-blue-600 hover:bg-blue-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouvelle matière
      </Button>
    </div>
  </div>

  {#if error}
    <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      {error}
      <button onclick={() => error = ''} class="ml-2 text-red-500 hover:text-red-700">×</button>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
      <span class="ml-2 text-gray-600">Chargement...</span>
    </div>
  {:else}
    <!-- Table -->
    <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Couleur</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
            <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if subjects.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                Aucune matière pour le moment.
                <button onclick={openAddModal} class="text-blue-600 hover:underline ml-1">
                  Créer la première ?
                </button>
              </td>
            </tr>
          {:else}
            {#each subjects as subject (getSubjectId(subject))}
              <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div 
                    class="w-8 h-8 rounded-lg shadow-sm" 
                    style="background-color: {subject.color || '#6366F1'}"
                  ></div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">{subject.name}</div>
                  {#if subject.description}
                    <div class="text-sm text-gray-500 truncate max-w-xs">{subject.description}</div>
                  {/if}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 font-mono">{subject.slug}</td>
                <td class="px-6 py-4">
                  {#if subject.is_active}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactif
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4 text-right">
                  {#if deleteConfirm === getSubjectId(subject)}
                    <div class="flex items-center justify-end gap-2">
                      <span class="text-sm text-red-600">Supprimer ?</span>
                      <button 
                        onclick={() => deleteSubject(getSubjectId(subject))}
                        disabled={deleting}
                        class="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {#if deleting}
                          <Loader2 class="w-4 h-4 text-red-600 animate-spin" />
                        {:else}
                          <Check class="w-4 h-4 text-red-600" />
                        {/if}
                      </button>
                      <button 
                        onclick={cancelDelete}
                        class="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <X class="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  {:else}
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        onclick={() => openEditModal(subject)}
                        class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 class="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onclick={() => confirmDelete(getSubjectId(subject))}
                        class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 class="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/50" 
      onclick={closeModal}
      onkeydown={(e) => e.key === 'Escape' && closeModal()}
      role="button"
      tabindex="-1"
    ></div>
    
    <!-- Modal content -->
    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">
          {editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}
        </h2>
        <button onclick={closeModal} class="p-1 hover:bg-gray-100 rounded-lg">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {#if modalError}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {modalError}
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); saveSubject(); }} class="space-y-4">
        <!-- Nom -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Nom <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            bind:value={formName}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Mathématiques"
            required
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            bind:value={formDescription}
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Description optionnelle..."
          ></textarea>
        </div>

        <!-- Couleur -->
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-2">
            Couleur
          </span>
          <div class="flex flex-wrap gap-2 mb-2" role="group" aria-label="Sélection de couleur">
            {#each defaultColors as color}
              <button
                type="button"
                onclick={() => formColor = color}
                class="w-8 h-8 rounded-lg transition-transform hover:scale-110 {formColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}"
                style="background-color: {color}"
                title="Couleur {color}"
                aria-label="Sélectionner la couleur {color}"
              ></button>
            {/each}
          </div>
          <div class="flex items-center gap-2">
            <input
              type="color"
              bind:value={formColor}
              class="w-10 h-10 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              bind:value={formColor}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="#6366F1"
            />
          </div>
        </div>

        <!-- Icône (optionnel) -->
        <div>
          <label for="icon" class="block text-sm font-medium text-gray-700 mb-1">
            Icône (emoji)
          </label>
          <input
            id="icon"
            type="text"
            bind:value={formIcon}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 📐 ou 📚"
          />
        </div>

        <!-- Boutons -->
        <div class="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onclick={closeModal}
            class="flex-1"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
            class="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {#if saving}
              <Loader2 class="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            {:else}
              <Check class="w-4 h-4 mr-2" />
              {editingSubject ? 'Modifier' : 'Créer'}
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
