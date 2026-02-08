<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import { 
    ArrowLeft, Save, Loader2, Trash2, Plus, X,
    FileQuestion, Image, ToggleLeft, FileText, Layers, ArrowUpDown, MessageSquare, Map,
    Eye, BarChart2, Check, Edit
  } from 'lucide-svelte';
  import MapEditor from '$lib/components/admin/MapEditor.svelte';

  let { data } = $props();
  
  // Copie locale de la question pour édition - synced with data
  let question = $state<any>({});
  
  $effect(() => {
    question = { ...data.question };
  });
  
  let saving = $state(false);
  let error = $state('');
  let success = $state('');
  let showMapEditor = $state(false);
  
  // Labels des zones pour l'éditeur de carte
  let zoneLabels = $derived(() => {
    const labels: Record<string, string> = {};
    for (const answer of (question.expectedAnswers || [])) {
      labels[`REP_${answer.index}`] = answer.label || '';
    }
    return labels;
  });

  // Types de questions
  const questionTypes = [
    { value: 'qcm', label: 'QCM', icon: FileQuestion },
    { value: 'qcm_multiple', label: 'QCM Multiple', icon: FileQuestion },
    { value: 'qcm_image', label: 'QCM avec images', icon: Image },
    { value: 'true_false', label: 'Vrai/Faux', icon: ToggleLeft },
    { value: 'fill_blank', label: 'Texte à trous', icon: FileText },
    { value: 'matching', label: 'Association', icon: Layers },
    { value: 'ordering', label: 'Classement', icon: ArrowUpDown },
    { value: 'open_short', label: 'Réponse courte', icon: MessageSquare },
    { value: 'open_long', label: 'Réponse longue', icon: MessageSquare },
    { value: 'map_labels', label: 'Carte interactive', icon: Map },
  ];

  const difficulties = [
    { value: 'easy', label: 'Facile', color: 'bg-green-500' },
    { value: 'medium', label: 'Moyen', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Difficile', color: 'bg-red-500' },
  ];

  // Filtrer les thèmes par matière
  let filteredThemes = $derived(
    question.matiere_id 
      ? data.themes.filter((t: any) => {
          const matiereCode = data.matieres.find((m: any) => m.id === question.matiere_id)?.code;
          return t.subject_code === matiereCode;
        })
      : data.themes
  );

  // Sauvegarder
  async function saveQuestion() {
    saving = true;
    error = '';
    
    try {
      const cleanId = question.id.includes(':') ? question.id.split(':')[1] : question.id;
      
      const res = await fetch(`/api/admin/questions/${cleanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur sauvegarde');
      }
      
      success = 'Question sauvegardée !';
      setTimeout(() => success = '', 3000);
      await invalidateAll();
    } catch (e: any) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  // Supprimer
  async function deleteQuestion() {
    if (!confirm('Supprimer cette question définitivement ?')) return;
    
    try {
      const cleanId = question.id.includes(':') ? question.id.split(':')[1] : question.id;
      const res = await fetch(`/api/admin/questions/${cleanId}`, { method: 'DELETE' });
      
      if (res.ok) {
        goto('/admin/questions');
      } else {
        const d = await res.json();
        error = d.error || 'Erreur suppression';
      }
    } catch (e: any) {
      error = e.message;
    }
  }

  // Helpers pour QCM
  function addOption() {
    question.options = [...(question.options || []), ''];
  }
  
  function removeOption(index: number) {
    if (question.options.length > 2) {
      question.options = question.options.filter((_: any, i: number) => i !== index);
      if (question.correctAnswer !== undefined && question.correctAnswer >= question.options.length) {
        question.correctAnswer = 0;
      }
    }
  }

  // Helpers pour Map Labels
  function addExpectedAnswer() {
    const nextIndex = (question.expectedAnswers || []).length;
    question.expectedAnswers = [...(question.expectedAnswers || []), { index: nextIndex, label: '', hint: '' }];
  }

  function removeExpectedAnswer(index: number) {
    question.expectedAnswers = question.expectedAnswers.filter((_: any, i: number) => i !== index);
  }

  // Helpers pour Matching
  function addMatchingPair() {
    question.leftItems = [...(question.leftItems || []), ''];
    question.rightItems = [...(question.rightItems || []), ''];
  }

  function removeMatchingPair(index: number) {
    question.leftItems = question.leftItems.filter((_: any, i: number) => i !== index);
    question.rightItems = question.rightItems.filter((_: any, i: number) => i !== index);
  }

  // Helpers pour Ordering
  function addOrderingItem() {
    question.items = [...(question.items || []), ''];
  }

  function removeOrderingItem(index: number) {
    question.items = question.items.filter((_: any, i: number) => i !== index);
  }
</script>

<svelte:head>
  <title>Éditer question - Admin</title>
</svelte:head>

<div class="flex-1 p-6 overflow-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      <a href="/admin/questions" class="p-2 hover:bg-gray-800 rounded-lg transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-400" />
      </a>
      <div>
        <h1 class="text-2xl font-bold text-white">Éditer la question</h1>
        <p class="text-sm text-gray-400">ID: {question.id}</p>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      {#if success}
        <span class="text-green-400 text-sm flex items-center gap-1">
          <Check class="w-4 h-4" />
          {success}
        </span>
      {/if}
      {#if error}
        <span class="text-red-400 text-sm">{error}</span>
      {/if}
      
      <Button variant="destructive" onclick={deleteQuestion}>
        <Trash2 class="w-4 h-4 mr-2" />
        Supprimer
      </Button>
      
      <Button onclick={saveQuestion} disabled={saving}>
        {#if saving}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {:else}
          <Save class="w-4 h-4 mr-2" />
        {/if}
        Sauvegarder
      </Button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Colonne principale -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Question -->
      <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Question</h2>
        
        <div class="space-y-4">
          <div>
            <label for="question-text" class="block text-sm font-medium text-gray-300 mb-2">Énoncé</label>
            <textarea
              id="question-text"
              bind:value={question.question}
              rows="3"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="Entrez l'énoncé de la question..."
            ></textarea>
          </div>
          
          <div>
            <label for="explanation" class="block text-sm font-medium text-gray-300 mb-2">Explication (après réponse)</label>
            <textarea
              id="explanation"
              bind:value={question.explanation}
              rows="2"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="Explication affichée après la réponse..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Contenu selon le type -->
      {#if question.questionType === 'qcm' || question.questionType === 'qcm_multiple' || question.questionType === 'qcm_image'}
        <!-- Options QCM -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Options de réponse</h2>
          
          <div class="space-y-3">
            {#each question.options || [] as option, i}
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  onclick={() => {
                    if (question.questionType === 'qcm_multiple') {
                      const answers = question.correctAnswers || [];
                      if (answers.includes(i)) {
                        question.correctAnswers = answers.filter((a: number) => a !== i);
                      } else {
                        question.correctAnswers = [...answers, i];
                      }
                    } else {
                      question.correctAnswer = i;
                    }
                  }}
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                    {question.questionType === 'qcm_multiple'
                      ? ((question.correctAnswers || []).includes(i) ? 'bg-green-500 border-green-500' : 'border-gray-600')
                      : (question.correctAnswer === i ? 'bg-green-500 border-green-500' : 'border-gray-600')
                    }"
                >
                  {#if (question.questionType === 'qcm_multiple' && (question.correctAnswers || []).includes(i)) || question.correctAnswer === i}
                    <Check class="w-4 h-4 text-white" />
                  {/if}
                </button>
                
                <Input
                  bind:value={question.options[i]}
                  placeholder="Option {i + 1}"
                  class="flex-1"
                />
                
                {#if question.options.length > 2}
                  <button
                    type="button"
                    onclick={() => removeOption(i)}
                    class="p-2 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <X class="w-4 h-4" />
                  </button>
                {/if}
              </div>
            {/each}
            
            <Button variant="outline" onclick={addOption} class="mt-2">
              <Plus class="w-4 h-4 mr-2" />
              Ajouter une option
            </Button>
          </div>
        </div>

      {:else if question.questionType === 'true_false'}
        <!-- Vrai/Faux -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Bonne réponse</h2>
          
          <div class="flex gap-4">
            <button
              type="button"
              onclick={() => question.correctAnswer = true}
              class="flex-1 py-4 rounded-lg border-2 transition-colors
                {question.correctAnswer === true ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}"
            >
              Vrai
            </button>
            <button
              type="button"
              onclick={() => question.correctAnswer = false}
              class="flex-1 py-4 rounded-lg border-2 transition-colors
                {question.correctAnswer === false ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}"
            >
              Faux
            </button>
          </div>
        </div>

      {:else if question.questionType === 'fill_blank'}
        <!-- Texte à trous -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Texte à trous</h2>
          
          <div>
            <p class="text-sm text-gray-400 mb-2">Utilisez {'{'}mot{'}'} pour indiquer les trous</p>
            <textarea
              bind:value={question.textWithBlanks}
              rows="4"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-purple-500"
              placeholder="Le soleil se [lève] à l'[est]..."
            ></textarea>
          </div>
        </div>

      {:else if question.questionType === 'matching'}
        <!-- Association -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Paires à associer</h2>
          
          <div class="space-y-3">
            {#each question.leftItems || [] as _, i}
              <div class="flex items-center gap-3">
                <Input
                  bind:value={question.leftItems[i]}
                  placeholder="Élément gauche"
                  class="flex-1"
                />
                <span class="text-gray-500">↔</span>
                <Input
                  bind:value={question.rightItems[i]}
                  placeholder="Élément droit"
                  class="flex-1"
                />
                <button
                  type="button"
                  onclick={() => removeMatchingPair(i)}
                  class="p-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            {/each}
            
            <Button variant="outline" onclick={addMatchingPair}>
              <Plus class="w-4 h-4 mr-2" />
              Ajouter une paire
            </Button>
          </div>
        </div>

      {:else if question.questionType === 'ordering'}
        <!-- Classement -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Éléments à ordonner</h2>
          <p class="text-sm text-gray-400 mb-4">L'ordre affiché ici est le bon ordre</p>
          
          <div class="space-y-3">
            {#each question.items || [] as _, i}
              <div class="flex items-center gap-3">
                <span class="text-gray-500 w-6 text-center">{i + 1}</span>
                <Input
                  bind:value={question.items[i]}
                  placeholder="Élément"
                  class="flex-1"
                />
                <button
                  type="button"
                  onclick={() => removeOrderingItem(i)}
                  class="p-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            {/each}
            
            <Button variant="outline" onclick={addOrderingItem}>
              <Plus class="w-4 h-4 mr-2" />
              Ajouter un élément
            </Button>
          </div>
        </div>

      {:else if question.questionType === 'map_labels'}
        <!-- Carte interactive -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Carte interactive</h2>
          
          <div class="space-y-4">
            <div>
              <label for="svg-content" class="block text-sm font-medium text-gray-300 mb-2">
                Contenu SVG (avec id="rep_0", "rep_1", etc.)
              </label>
              <textarea
                id="svg-content"
                bind:value={question.svgContent}
                rows="8"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="<svg>...</svg>"
              ></textarea>
            </div>
            
            {#if question.svgContent}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <p class="text-sm font-medium text-gray-300">Aperçu</p>
                  <Button 
                    variant={showMapEditor ? 'default' : 'outline'} 
                    size="sm" 
                    onclick={() => showMapEditor = !showMapEditor}
                  >
                    <Edit class="w-3 h-3 mr-1" />
                    {showMapEditor ? 'Masquer l\'éditeur' : 'Éditer les positions'}
                  </Button>
                </div>
                
                {#if showMapEditor}
                  <!-- Éditeur interactif avec drag & drop -->
                  <MapEditor
                    svgContent={question.svgContent}
                    zoneLabels={zoneLabels()}
                    onSvgChange={(newSvg) => question.svgContent = newSvg}
                  />
                {:else}
                  <!-- Aperçu simple -->
                  <div class="bg-gray-800 rounded-lg p-4 max-h-64 overflow-auto">
                    {@html question.svgContent}
                  </div>
                {/if}
              </div>
            {/if}
            
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-300">Réponses attendues</p>
                <Button variant="outline" size="sm" onclick={addExpectedAnswer}>
                  <Plus class="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              <div class="space-y-2">
                {#each question.expectedAnswers || [] as answer, i}
                  <div class="flex items-center gap-2 bg-gray-800 p-3 rounded-lg">
                    <span class="text-gray-500 text-sm w-16">rep_{answer.index}</span>
                    <Input
                      bind:value={question.expectedAnswers[i].label}
                      placeholder="Réponse attendue"
                      class="flex-1"
                    />
                    <Input
                      bind:value={question.expectedAnswers[i].hint}
                      placeholder="Indice (optionnel)"
                      class="flex-1"
                    />
                    <button
                      type="button"
                      onclick={() => removeExpectedAnswer(i)}
                      class="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

      {:else if question.questionType === 'open_short' || question.questionType === 'open_long'}
        <!-- Réponse ouverte -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Réponse attendue</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Exemples de réponses correctes</label>
              <textarea
                bind:value={question.sampleAnswers}
                rows="3"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="Une réponse par ligne..."
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Mots-clés attendus</label>
              <Input
                bind:value={question.expectedKeywords}
                placeholder="mot1, mot2, mot3..."
              />
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Colonne latérale -->
    <div class="space-y-6">
      <!-- Métadonnées -->
      <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Paramètres</h2>
        
        <div class="space-y-4">
          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Type de question</label>
            <Select.Root type="single" bind:value={question.questionType}>
              <Select.Trigger class="w-full">
                {questionTypes.find(t => t.value === question.questionType)?.label || 'Sélectionner'}
              </Select.Trigger>
              <Select.Content>
                {#each questionTypes as type}
                  <Select.Item value={type.value}>
                    {type.label}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          
          <!-- Difficulté -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Difficulté</label>
            <div class="flex gap-2">
              {#each difficulties as diff}
                <button
                  type="button"
                  onclick={() => question.difficulty = diff.value}
                  class="flex-1 py-2 rounded-lg border transition-colors text-sm
                    {question.difficulty === diff.value 
                      ? `${diff.color} border-transparent text-white` 
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'}"
                >
                  {diff.label}
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Actif -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-300">Question active</span>
            <button
              type="button"
              title="Activer/Désactiver la question"
              onclick={() => question.isActive = !question.isActive}
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                {question.isActive ? 'bg-green-500' : 'bg-gray-700'}"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  {question.isActive ? 'translate-x-6' : 'translate-x-1'}"
              ></span>
            </button>
          </div>
          
          <!-- Matière -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Matière</label>
            <Select.Root type="single" bind:value={question.matiere_id}>
              <Select.Trigger class="w-full">
                {data.matieres.find((m: any) => m.id === question.matiere_id)?.name || 'Aucune'}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">Aucune</Select.Item>
                {#each data.matieres as matiere}
                  <Select.Item value={matiere.id}>
                    {matiere.icon || ''} {matiere.name}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart2 class="w-5 h-5" />
          Statistiques
        </h2>
        
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-white">{data.stats.views}</p>
            <p class="text-xs text-gray-400">Affichages</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-white">{data.stats.attempts}</p>
            <p class="text-xs text-gray-400">Réponses</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-green-400">{data.stats.correctAttempts}</p>
            <p class="text-xs text-gray-400">Correctes</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-purple-400">{data.stats.successRate}%</p>
            <p class="text-xs text-gray-400">Taux réussite</p>
          </div>
        </div>
        
        <p class="text-xs text-gray-500 mt-3 text-center">Statistiques à venir</p>
      </div>
      
      <!-- Dates -->
      <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <h2 class="text-sm font-medium text-gray-400 mb-3">Informations</h2>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Créée le</span>
            <span class="text-gray-300">
              {question.createdAt ? new Date(question.createdAt).toLocaleDateString('fr-FR') : '-'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Modifiée le</span>
            <span class="text-gray-300">
              {question.updatedAt ? new Date(question.updatedAt).toLocaleDateString('fr-FR') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
