<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import QuestionPreview from "$lib/components/question/QuestionPreview.svelte";
  import { QUESTION_TYPES, AVAILABLE_LANGUAGES, type QuestionTranslation } from "$lib/types/question";
  import { 
    ArrowLeft, Edit, Trash2, Copy, Eye, EyeOff, Clock, Target, 
    Calendar, BarChart3, Globe, CheckCircle, XCircle, Link2 
  } from "lucide-svelte";

  let { data } = $props();

  let showDeleteConfirm = $state(false);
  let isDeleting = $state(false);
  let previewLanguage = $state(data.question?.default_language || 'fr');
  let interactiveMode = $state(false);
  let showCorrectAnswers = $state(true);

  // Get type info
  let typeInfo = $derived(QUESTION_TYPES.find(t => t.value === data.question?.type));
  let availableLanguages = $derived(
    (data.question?.translations || []).map((t: QuestionTranslation) => AVAILABLE_LANGUAGES.find(l => l.code === t.language))
  );

  async function handleDelete() {
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }

    isDeleting = true;
    try {
      const res = await fetch(`/api/questions/${data.question.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        goto('/admin/dashboard/questions');
      } else {
        const error = await res.json();
        alert('Erreur: ' + (error.message || 'Impossible de supprimer'));
      }
    } catch (e) {
      console.error('Error deleting:', e);
      alert('Erreur de connexion');
    } finally {
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }

  async function handleDuplicate() {
    // TODO: Implement duplicate
    alert('Fonctionnalité à venir: Dupliquer la question');
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Question - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/dashboard/questions" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Retour à la banque de questions
    </a>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div 
          class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style:background-color="{typeInfo?.color}20"
        >
          {typeInfo?.icon}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-gray-900">
              {(data.question?.translations || []).find((t: QuestionTranslation) => t.language === previewLanguage)?.title || 'Question sans titre'}
            </h1>
            {#if data.question?.is_active}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle class="w-3 h-3" />
                Active
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <XCircle class="w-3 h-3" />
                Inactive
              </span>
            {/if}
          </div>
          <p class="text-gray-500">
            {typeInfo?.label} • {data.question?.theme_name} • {data.question?.level_name}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if showDeleteConfirm}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
            <span class="text-red-700 text-sm">Confirmer ?</span>
            <Button variant="outline" size="sm" onclick={() => showDeleteConfirm = false}>
              Non
            </Button>
            <Button 
              class="bg-red-600 hover:bg-red-700" 
              size="sm"
              onclick={handleDelete}
              disabled={isDeleting}
            >
              Oui, supprimer
            </Button>
          </div>
        {:else}
          <Button variant="outline" onclick={handleDuplicate}>
            <Copy class="w-4 h-4 mr-2" />
            Dupliquer
          </Button>
          <Button 
            variant="outline" 
            class="text-red-600 hover:bg-red-50"
            onclick={handleDelete}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          <Button 
            class="bg-indigo-600 hover:bg-indigo-700"
            onclick={() => goto(`/admin/dashboard/questions/${data.question.id}/edit`)}
          >
            <Edit class="w-4 h-4 mr-2" />
            Modifier
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-8">
    <!-- Main Preview -->
    <div class="col-span-2 space-y-6">
      <!-- Preview Controls -->
      <div class="bg-white rounded-xl shadow border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Globe class="w-4 h-4 text-gray-500" />
              <span class="text-sm text-gray-600">Langue:</span>
              <div class="flex gap-1">
                {#each availableLanguages as lang}
                  {#if lang}
                    <button
                      onclick={() => previewLanguage = lang.code}
                      class="px-3 py-1 rounded-lg text-sm transition-colors"
                      class:bg-indigo-100={previewLanguage === lang.code}
                      class:text-indigo-700={previewLanguage === lang.code}
                      class:bg-gray-100={previewLanguage !== lang.code}
                      class:text-gray-600={previewLanguage !== lang.code}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  {/if}
                {/each}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                bind:checked={interactiveMode}
                class="rounded border-gray-300"
              />
              Mode interactif
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                bind:checked={showCorrectAnswers}
                class="rounded border-gray-300"
              />
              Afficher réponses
            </label>
          </div>
        </div>
      </div>

      <!-- Question Preview -->
      <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye class="w-5 h-5 text-gray-500" />
          Aperçu de la question
        </h2>
        
        <QuestionPreview 
          question={data.question}
          language={previewLanguage}
          interactive={interactiveMode}
          showCorrectAnswers={showCorrectAnswers}
        />
      </div>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Stats -->
      <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Statistiques</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-gray-600">
              <Target class="w-4 h-4" />
              <span class="text-sm">Points</span>
            </div>
            <span class="font-semibold">{data.question.points_total} pts</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-gray-600">
              <BarChart3 class="w-4 h-4" />
              <span class="text-sm">Difficulté</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                  style:width="{data.question.difficulty_weight * 10}%"
                ></div>
              </div>
              <span class="text-sm font-medium">{data.question.difficulty_weight}/10</span>
            </div>
          </div>

          {#if data.question.time_limit}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-600">
                <Clock class="w-4 h-4" />
                <span class="text-sm">Temps limite</span>
              </div>
              <span class="font-semibold">{data.question.time_limit}s</span>
            </div>
          {/if}

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-gray-600">
              <Link2 class="w-4 h-4" />
              <span class="text-sm">Utilisations</span>
            </div>
            <span class="font-semibold">{data.question.usage_count || 0} quiz</span>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
        
        <div class="space-y-3 text-sm">
          <div>
            <span class="text-gray-500 block">ID</span>
            <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{data.question.id}</span>
          </div>
          
          <div>
            <span class="text-gray-500 block">Créée le</span>
            <span>{formatDate(data.question.created_at)}</span>
          </div>
          
          <div>
            <span class="text-gray-500 block">Mise à jour</span>
            <span>{formatDate(data.question.updated_at)}</span>
          </div>

          <div>
            <span class="text-gray-500 block">Langues</span>
            <div class="flex gap-1 mt-1">
              {#each availableLanguages as lang}
                {#if lang}
                  <span class="text-lg" title={lang.name}>{lang.flag}</span>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Used in Quizzes -->
      {#if data.usedInQuizzes && data.usedInQuizzes.length > 0}
        <div class="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Utilisée dans</h2>
          
          <div class="space-y-2">
            {#each data.usedInQuizzes as quiz}
              <a 
                href="/admin/dashboard/quiz/{quiz.id}"
                class="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span class="font-medium text-gray-900 block">{quiz.name}</span>
                <span class="text-xs text-gray-500">Ajoutée le {quiz.usage_date}</span>
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
