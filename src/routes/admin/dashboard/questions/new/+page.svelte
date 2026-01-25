<script lang="ts">
  import { goto } from "$app/navigation";
  import QuestionForm from "$lib/components/question/QuestionForm.svelte";
  import { ArrowLeft } from "lucide-svelte";
  import type { Question } from "$lib/types/question";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  async function handleSave(question: Partial<Question>) {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });

      if (res.ok) {
        goto('/admin/dashboard/questions');
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de créer la question'));
      }
    } catch (e) {
      console.error('Error creating question:', e);
      alert('Erreur de connexion');
    }
  }

  function handleCancel() {
    goto('/admin/dashboard/questions');
  }
</script>

<svelte:head>
  <title>Nouvelle Question - Administration</title>
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
        <h1 class="text-3xl font-bold text-gray-900">Nouvelle Question</h1>
        <p class="text-gray-600 mt-1">Créez une question réutilisable dans plusieurs quiz</p>
      </div>
    </div>
  </div>

  <!-- Form -->
  <QuestionForm 
    question={{}}
    themes={data.themes || []}
    levels={data.levels || []}
    onSave={handleSave}
    onCancel={handleCancel}
  />
</div>
