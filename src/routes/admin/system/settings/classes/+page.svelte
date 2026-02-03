<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, ArrowLeft, GripVertical, Check, X } from "lucide-svelte";

  let { data } = $props();

  // Grouper les grades par cycle
  let gradesByCycle = $derived.by(() => {
    const grouped: Record<string, any[]> = {};
    for (const cycle of (data.cycles || [])) {
      grouped[cycle.id] = (data.grades || []).filter((g: any) => 
        g.cycle?.toString() === cycle.id?.toString()
      );
    }
    return grouped;
  });

  // Modal state
  let showModal = $state(false);
  let editingGrade = $state<any>(null);
  let formName = $state('');
  let formCode = $state('');
  let formCycleId = $state('');
  let formOrder = $state(0);
  let formIsActive = $state(true);
  let isSaving = $state(false);

  function openCreateModal() {
    editingGrade = null;
    formName = '';
    formCode = '';
    // Cycle par défaut : Primaire
    const defaultCycle = data.cycles?.find((c: any) => c.code === 'primaire' || c.name?.includes('Primaire'));
    formCycleId = defaultCycle ? defaultCycle.id.split(':')[1] : '';
    formOrder = data.grades?.length || 0;
    formIsActive = true;
    showModal = true;
  }

  function openEditModal(grade: any) {
    editingGrade = grade;
    formName = grade.name;
    formCode = grade.code;
    // Extraire l'ID du cycle
    const cycleId = grade.cycle?.toString() || '';
    formCycleId = cycleId.includes(':') ? cycleId.split(':')[1] : cycleId;
    formOrder = grade.order ?? 0;
    formIsActive = grade.is_active ?? true;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingGrade = null;
  }

  function generateCode(name: string) {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    formName = target.value;
    if (!editingGrade) {
      formCode = generateCode(target.value);
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
        code: formCode || generateCode(formName),
        cycle_id: formCycleId,
        order: formOrder,
        is_active: formIsActive
      };

      const url = editingGrade 
        ? `/api/admin/grades/${editingGrade.id.split(':')[1]}`
        : '/api/admin/grades';
      
      const res = await fetch(url, {
        method: editingGrade ? 'PUT' : 'POST',
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
      console.error('Error saving grade:', e);
      alert('Erreur de connexion');
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete(grade: any) {
    if (grade.question_count > 0) {
      alert(`Impossible de supprimer: ${grade.question_count} question(s) utilisent ce niveau`);
      return;
    }
    
    if (!confirm(`Supprimer le niveau "${grade.name}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/grades/${grade.id.split(':')[1]}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de supprimer'));
      }
    } catch (e) {
      console.error('Error deleting grade:', e);
      alert('Erreur de connexion');
    }
  }

  function getCycleColor(code: string) {
    switch (code) {
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
  <title>Niveaux scolaires - Paramètres</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/system/settings" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour aux paramètres
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Niveaux scolaires</h1>
        <p class="text-gray-600 mt-1">Gérez les niveaux scolaires (de la Maternelle au Supérieur)</p>
      </div>
      <Button onclick={openCreateModal} class="bg-cyan-600 hover:bg-cyan-700">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau niveau
      </Button>
    </div>
  </div>

  <!-- Grades by Cycle -->
  <div class="space-y-8">
    {#each (data.cycles || []) as cycle (cycle.id)}
      {@const cycleGrades = gradesByCycle[cycle.id]}
      {#if cycleGrades?.length > 0}
        <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span class={`px-2 py-1 rounded text-sm font-medium ${getCycleColor(cycle.code)}`}>
                {cycle.name}
              </span>
              <span class="text-gray-400 text-sm font-normal">({cycleGrades.length})</span>
            </h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-16">Ordre</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Questions</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each cycleGrades as grade (grade.id)}
                <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-cyan-100 text-cyan-600 rounded-full text-sm font-medium">
                      {grade.order}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{grade.name}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 font-mono">{grade.code}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{grade.question_count}</td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${grade.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {grade.is_active !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        onclick={() => openEditModal(grade)}
                        class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 class="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onclick={() => handleDelete(grade)}
                        class="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        disabled={grade.question_count > 0}
                        title={grade.question_count > 0 ? 'Utilisé par des questions' : 'Supprimer'}
                      >
                        <Trash2 class="w-4 h-4 {grade.question_count > 0 ? 'text-gray-300' : 'text-red-600'}" />
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
          {editingGrade ? 'Modifier le niveau' : 'Nouveau niveau'}
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
          <label for="code" class="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            id="code"
            bind:value={formCode}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
            placeholder="cm1"
          />
        </div>

        <div>
          <label for="cycle" class="block text-sm font-medium text-gray-700 mb-1">Cycle *</label>
          <select
            id="cycle"
            bind:value={formCycleId}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {#each (data.cycles || []) as cycle}
              <option value={cycle.id.split(':')[1]}>{cycle.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="order" class="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input
            type="number"
            id="order"
            bind:value={formOrder}
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
