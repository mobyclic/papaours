<script lang="ts">
  import { goto } from "$app/navigation";
  import QuestionEditForm from "$lib/components/question/QuestionEditForm.svelte";
  import { ArrowLeft, Trash2 } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";

  let { data } = $props();

  let showDeleteConfirm = $state(false);
  let isDeleting = $state(false);
  let isSaving = $state(false);

  async function handleSave(questionData: any) {
    isSaving = true;
    try {
      const questionId = data.question.id?.includes(':') 
        ? data.question.id.split(':')[1] 
        : data.question.id;
        
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });

      if (res.ok) {
        goto('/admin/dashboard/questions');
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de mettre à jour la question'));
      }
    } catch (e) {
      console.error('Error updating question:', e);
      alert('Erreur de connexion');
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    goto('/admin/dashboard/questions');
  }

  async function handleDelete() {
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }

    isDeleting = true;
    try {
      const questionId = data.question.id?.includes(':') 
        ? data.question.id.split(':')[1] 
        : data.question.id;
        
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        goto('/admin/dashboard/questions');
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de supprimer la question'));
      }
    } catch (e) {
      console.error('Error deleting question:', e);
      alert('Erreur de connexion');
    } finally {
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }
</script>

<svelte:head>
  <title>Modifier Question - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/dashboard/questions" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour à la banque de questions
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Modifier la Question</h1>
        <p class="text-gray-600 mt-1">ID: {data.question.id}</p>
      </div>
      <div class="flex items-center gap-3">
        {#if showDeleteConfirm}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
            <span class="text-red-700 text-sm">Confirmer la suppression ?</span>
            <Button 
              variant="outline" 
              size="sm"
              onclick={() => showDeleteConfirm = false}
            >
              Annuler
            </Button>
            <Button 
              class="bg-red-600 hover:bg-red-700"
              size="sm"
              onclick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
            </Button>
          </div>
        {:else}
          <Button 
            variant="outline" 
            class="text-red-600 hover:bg-red-50 hover:text-red-700"
            onclick={handleDelete}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Form -->
  <QuestionEditForm 
    question={data.question}
    matieres={data.matieres}
    themes={data.themes}
    themesByMatiere={data.themesByMatiere}
    classes={data.classes}
    classesByCategory={data.classesByCategory}
    categoryOrder={data.categoryOrder}
    niveaux={data.niveaux}
    onSave={handleSave}
    onCancel={handleCancel}
  />
</div>
