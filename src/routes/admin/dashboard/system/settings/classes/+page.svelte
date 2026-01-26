<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft, GripVertical, Check, X } from "lucide-svelte";

  let { data } = $props();

  // Grouper les classes par catégorie
  let classesByCategory = $derived.by(() => {
    const grouped: Record<string, any[]> = {};
    for (const cat of (data.categories || [])) {
      grouped[cat.id] = (data.classes || []).filter((c: any) => 
        c.category_id?.toString() === cat.id?.toString()
      );
    }
    return grouped;
  });

  // Modal state
  let showModal = $state(false);
  let editingClass = $state<any>(null);
  let formName = $state('');
  let formSlug = $state('');
  let formCategoryId = $state('');
  let formPos = $state(0);
  let formIsActive = $state(true);
  let isSaving = $state(false);

  function openCreateModal() {
    editingClass = null;
    formName = '';
    formSlug = '';
    // Catégorie par défaut : Primaire
    const defaultCat = data.categories?.find((c: any) => c.slug === 'primaire');
    formCategoryId = defaultCat ? defaultCat.id.split(':')[1] : '';
    formPos = data.classes?.length || 0;
    formIsActive = true;
    showModal = true;
  }

  function openEditModal(classe: any) {
    editingClass = classe;
    formName = classe.name;
    formSlug = classe.slug;
    // Extraire l'ID de la catégorie
    const catId = classe.category_id?.toString() || '';
    formCategoryId = catId.includes(':') ? catId.split(':')[1] : catId;
    formPos = classe.pos ?? 0;
    formIsActive = classe.is_active ?? true;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingClass = null;
  }

  function generateSlug(name: string) {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    formName = target.value;
    if (!editingClass) {
      formSlug = generateSlug(target.value);
    }
  }

  async function handleSave() {
    if (!formName.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    isSaving = true;
    try {
      const payload = {
        name: formName,
        slug: formSlug || generateSlug(formName),
        category_id: formCategoryId,
        pos: formPos,
        is_active: formIsActive
      };

      const url = editingClass 
        ? `/api/admin/classes/${editingClass.id.split(':')[1]}`
        : '/api/admin/classes';
      
      const res = await fetch(url, {
        method: editingClass ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de sauvegarder'));
      }
    } catch (e) {
      console.error('Error saving class:', e);
      alert('Erreur de connexion');
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete(classe: any) {
    if (classe.question_count > 0) {
      alert(`Impossible de supprimer: ${classe.question_count} question(s) utilisent cette classe`);
      return;
    }
    
    if (!confirm(`Supprimer la classe "${classe.name}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/classes/${classe.id.split(':')[1]}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de supprimer'));
      }
    } catch (e) {
      console.error('Error deleting class:', e);
      alert('Erreur de connexion');
    }
  }

  function getCategoryColor(slug: string) {
    switch (slug) {
      case 'maternelle': return 'bg-pink-100 text-pink-700';
      case 'primaire': return 'bg-blue-100 text-blue-700';
      case 'college': return 'bg-green-100 text-green-700';
      case 'lycee': return 'bg-purple-100 text-purple-700';
      case 'superieur': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
</script>

<svelte:head>
  <title>Classes - Paramètres</title>
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
        <h1 class="text-3xl font-bold text-gray-900">Classes</h1>
        <p class="text-gray-600 mt-1">Gérez les niveaux scolaires (de la Maternelle au Supérieur)</p>
      </div>
      <Button onclick={openCreateModal} class="bg-cyan-600 hover:bg-cyan-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouvelle classe
      </Button>
    </div>
  </div>

  <!-- Classes by Category -->
  <div class="space-y-8">
    {#each (data.categories || []) as category (category.id)}
      {@const categoryClasses = classesByCategory[category.id]}
      {#if categoryClasses?.length > 0}
        <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span class={`px-2 py-1 rounded text-sm font-medium ${getCategoryColor(category.slug)}`}>
                {category.name_fr}
              </span>
              <span class="text-gray-400 text-sm font-normal">({categoryClasses.length})</span>
            </h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-16">Ordre</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Questions</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each categoryClasses as classe (classe.id)}
                <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-cyan-100 text-cyan-600 rounded-full text-sm font-medium">
                      {classe.pos}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{classe.name}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 font-mono">{classe.slug}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{classe.question_count}</td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classe.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {classe.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        onclick={() => openEditModal(classe)}
                        class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 class="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onclick={() => handleDelete(classe)}
                        class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        disabled={classe.question_count > 0}
                        title={classe.question_count > 0 ? 'Utilisé par des questions' : 'Supprimer'}
                      >
                        <Trash2 class="w-4 h-4 {classe.question_count > 0 ? 'text-gray-300' : 'text-red-600'}" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/each}
  </div>
</div>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {editingClass ? 'Modifier la classe' : 'Nouvelle classe'}
        </h3>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input
            type="text"
            id="name"
            value={formName}
            oninput={handleNameChange}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="ex: CM1"
          />
        </div>

        <div>
          <label for="slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            id="slug"
            bind:value={formSlug}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
            placeholder="cm1"
          />
        </div>

        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
          <select
            id="category"
            bind:value={formCategoryId}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {#each (data.categories || []) as cat}
              <option value={cat.id.split(':')[1]}>{cat.name_fr}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="pos" class="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input
            type="number"
            id="pos"
            bind:value={formPos}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            min="0"
          />
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={formIsActive}
            class="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span class="text-sm text-gray-700">Actif</span>
        </label>
      </div>

      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <Button variant="outline" onclick={closeModal}>
          Annuler
        </Button>
        <Button onclick={handleSave} disabled={isSaving} class="bg-cyan-600 hover:bg-cyan-700">
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  </div>
{/if}
