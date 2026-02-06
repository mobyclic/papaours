<script lang="ts">
  import { X, Clock, BookOpen, Play, Star, ChevronRight, Loader2, Plus, Minus, Check, Info } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';

  interface Subject {
    code: string;
    name: string;
    icon: string;
    color?: string;
    hoursPerWeek?: number;
    chaptersCount?: number;
    domain?: string;
  }

  interface Chapter {
    id: string;
    name: string;
    description?: string;
    order: number;
    quizzes?: Quiz[];
  }

  interface Quiz {
    id: string;
    title: string;
    slug: string;
    description?: string;
    difficulty?: number;
    maxQuestions?: number;
    favorite_count?: number;
  }

  let { 
    open = $bindable(false),
    subject,
    onPlayQuiz,
    onProgramChange
  }: { 
    open: boolean;
    subject: Subject | null;
    onPlayQuiz?: (quiz: Quiz) => void;
    onProgramChange?: () => void;
  } = $props();

  let loading = $state(true);
  let program = $state<any>(null);
  let chapters = $state<Chapter[]>([]);
  let quizzes = $state<Quiz[]>([]);
  let error = $state<string | null>(null);
  
  // Programme utilisateur (quiz ajoutés)
  let userProgramQuizIds = $state<Set<string>>(new Set());
  let addingQuiz = $state<string | null>(null);
  let removingQuiz = $state<string | null>(null);
  
  // Quiz avec description dépliée
  let expandedQuizId = $state<string | null>(null);
  
  function toggleQuizInfo(quizId: string) {
    expandedQuizId = expandedQuizId === quizId ? null : quizId;
  }

  // Charger les détails quand le modal s'ouvre
  $effect(() => {
    if (open && subject) {
      loadSubjectDetails();
      loadUserProgram();
    }
  });

  async function loadUserProgram() {
    try {
      const res = await fetch('/api/user/program');
      if (res.ok) {
        const data = await res.json();
        userProgramQuizIds = new Set((data.programs || []).map((p: any) => p.quizId));
      }
    } catch (e) {
      console.error('Erreur chargement programme utilisateur:', e);
    }
  }

  async function addToProgram(quiz: Quiz) {
    addingQuiz = quiz.id;
    try {
      const res = await fetch('/api/user/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id })
      });
      if (res.ok) {
        userProgramQuizIds = new Set([...userProgramQuizIds, quiz.id]);
        onProgramChange?.();
      } else {
        const data = await res.json();
        console.error('Erreur:', data.error);
      }
    } catch (e) {
      console.error('Erreur ajout programme:', e);
    } finally {
      addingQuiz = null;
    }
  }

  async function removeFromProgram(quiz: Quiz) {
    removingQuiz = quiz.id;
    try {
      const res = await fetch('/api/user/program', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id })
      });
      if (res.ok) {
        const newSet = new Set(userProgramQuizIds);
        newSet.delete(quiz.id);
        userProgramQuizIds = newSet;
        onProgramChange?.();
      }
    } catch (e) {
      console.error('Erreur suppression programme:', e);
    } finally {
      removingQuiz = null;
    }
  }

  function isInProgram(quizId: string): boolean {
    return userProgramQuizIds.has(quizId);
  }

  async function loadSubjectDetails() {
    if (!subject) return;
    
    loading = true;
    error = null;

    try {
      const res = await fetch(`/api/education/program?subject=${subject.code}`);
      if (!res.ok) {
        throw new Error('Erreur de chargement');
      }
      const data = await res.json();
      program = data.program;
      chapters = data.chapters || [];
      quizzes = data.quizzes || [];
    } catch (e) {
      console.error('Erreur:', e);
      error = 'Impossible de charger les détails';
    } finally {
      loading = false;
    }
  }

  function handlePlayQuiz(quiz: Quiz) {
    if (onPlayQuiz) {
      onPlayQuiz(quiz);
    } else {
      goto(`/quiz/${quiz.slug}`);
    }
    open = false;
  }

  const domainLabels: Record<string, string> = {
    sciences: 'Sciences',
    langues: 'Langues',
    humanites: 'Humanités',
    arts: 'Arts & Sport'
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-2xl bg-gray-900 border-gray-800 text-white max-h-[85vh] overflow-hidden flex flex-col">
    <Dialog.Header class="border-b border-gray-800 pb-4">
      <div class="flex items-center gap-3">
        <span class="text-3xl">{subject?.icon}</span>
        <div>
          <Dialog.Title class="text-xl font-bold">{subject?.name}</Dialog.Title>
          <div class="flex items-center gap-2 mt-1 text-sm text-gray-400">
            {#if subject?.domain}
              <span class="px-2 py-0.5 rounded-full bg-gray-800 text-xs">
                {domainLabels[subject.domain] || subject.domain}
              </span>
            {/if}
            {#if subject?.hoursPerWeek}
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {subject.hoursPerWeek}h/semaine
              </span>
            {/if}
          </div>
        </div>
      </div>
    </Dialog.Header>

    <div class="flex-1 overflow-y-auto py-4 space-y-6">
      {#if loading}
        <div class="flex items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-amber-400" />
        </div>
      {:else if error}
        <div class="text-center py-8 text-red-400">
          <p>{error}</p>
          <Button variant="outline" onclick={loadSubjectDetails} class="mt-4">
            Réessayer
          </Button>
        </div>
      {:else}
        <!-- Programme / Chapitres -->
        {#if chapters.length > 0}
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <BookOpen class="w-4 h-4" />
              Programme ({chapters.length} chapitres)
            </h3>
            <div class="space-y-3">
              {#each chapters as chapter, i}
                <div class="rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden">
                  <div class="p-3">
                    <div class="flex items-start gap-3">
                      <span class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 shrink-0">
                        {i + 1}
                      </span>
                      <div class="flex-1">
                        <div class="font-medium text-white">{chapter.name}</div>
                        {#if chapter.description}
                          <p class="text-sm text-gray-500 mt-1">{chapter.description}</p>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Quiz de ce chapitre -->
                  {#if chapter.quizzes && chapter.quizzes.length > 0}
                    <div class="border-t border-gray-700/50 bg-gray-800/30 p-2">
                      <div class="space-y-1">
                        {#each chapter.quizzes as quiz}
                          <div class="rounded-md bg-gray-900/50 hover:bg-gray-900 transition-all group">
                            <div class="flex items-center gap-1 p-2">
                              <!-- Icône Play -->
                              <button
                                onclick={() => handlePlayQuiz(quiz)}
                                class="w-8 h-8 rounded-md bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center shrink-0 transition-colors"
                                title="Jouer"
                              >
                                <Play class="w-4 h-4 text-amber-400" />
                              </button>
                              
                              <!-- Infos quiz -->
                              <button
                                onclick={() => handlePlayQuiz(quiz)}
                                class="flex-1 min-w-0 text-left"
                              >
                                <div class="text-sm font-medium text-white truncate">{quiz.title}</div>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                  {#if quiz.maxQuestions}
                                    <span>{quiz.maxQuestions} questions</span>
                                  {/if}
                                  {#if quiz.difficulty}
                                    <span>Niveau {quiz.difficulty}/10</span>
                                  {/if}
                                </div>
                              </button>
                              
                              <!-- Bouton Info -->
                              <button
                                onclick={(e) => { e.stopPropagation(); toggleQuizInfo(quiz.id); }}
                                class="w-7 h-7 rounded-md {expandedQuizId === quiz.id ? 'bg-blue-500/20' : 'bg-gray-700/50 opacity-0 group-hover:opacity-100'} hover:bg-blue-500/20 flex items-center justify-center shrink-0 transition-all"
                                title="Plus d'infos"
                              >
                                <Info class="w-3.5 h-3.5 {expandedQuizId === quiz.id ? 'text-blue-400' : 'text-gray-400'}" />
                              </button>
                              
                              <!-- Bouton + / - -->
                              {#if isInProgram(quiz.id)}
                                <button
                                  onclick={(e) => { e.stopPropagation(); removeFromProgram(quiz); }}
                                  disabled={removingQuiz === quiz.id}
                                  class="w-7 h-7 rounded-md bg-green-500/20 hover:bg-red-500/20 flex items-center justify-center shrink-0 transition-colors group/btn"
                                  title="Retirer de Ma sélection"
                                >
                                  {#if removingQuiz === quiz.id}
                                    <Loader2 class="w-3.5 h-3.5 text-gray-400 animate-spin" />
                                  {:else}
                                    <Check class="w-3.5 h-3.5 text-green-400 group-hover/btn:hidden" />
                                    <Minus class="w-3.5 h-3.5 text-red-400 hidden group-hover/btn:block" />
                                  {/if}
                                </button>
                              {:else}
                                <button
                                  onclick={(e) => { e.stopPropagation(); addToProgram(quiz); }}
                                  disabled={addingQuiz === quiz.id}
                                  class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-green-500/20 flex items-center justify-center shrink-0 transition-colors"
                                  title="Ajouter à Ma sélection"
                                >
                                  {#if addingQuiz === quiz.id}
                                    <Loader2 class="w-3.5 h-3.5 text-gray-400 animate-spin" />
                                  {:else}
                                    <Plus class="w-3.5 h-3.5 text-gray-400 hover:text-green-400" />
                                  {/if}
                                </button>
                              {/if}
                            </div>
                            
                            <!-- Description dépliable -->
                            {#if expandedQuizId === quiz.id}
                              <div class="px-3 pb-3 pt-1 border-t border-gray-700/30 ml-10">
                                <p class="text-sm text-gray-400">
                                  {quiz.description || 'Aucune description disponible pour ce quiz.'}
                                </p>
                              </div>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Quiz non assignés à un chapitre -->
        {#if quizzes.length > 0}
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Play class="w-4 h-4" />
              Autres quiz ({quizzes.length})
            </h3>
            
            <div class="space-y-2">
              {#each quizzes as quiz}
                <div class="rounded-lg bg-gray-800/50 border border-gray-700/50 group">
                  <div class="flex items-center gap-2 p-3">
                    <!-- Icône Play -->
                    <button
                      onclick={() => handlePlayQuiz(quiz)}
                      class="w-10 h-10 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center shrink-0 transition-colors"
                      title="Jouer"
                    >
                      <Play class="w-5 h-5 text-amber-400" />
                    </button>
                    
                    <!-- Infos quiz -->
                    <button
                      onclick={() => handlePlayQuiz(quiz)}
                      class="flex-1 min-w-0 text-left"
                    >
                      <div class="font-medium text-white truncate">{quiz.title}</div>
                      <div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {#if quiz.maxQuestions}
                          <span>{quiz.maxQuestions} questions</span>
                        {/if}
                        {#if quiz.difficulty}
                          <span>Niveau {quiz.difficulty}/10</span>
                        {/if}
                        {#if quiz.favorite_count && quiz.favorite_count > 0}
                          <span class="flex items-center gap-1">
                            <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
                            {quiz.favorite_count}
                          </span>
                        {/if}
                      </div>
                    </button>
                    
                    <!-- Bouton Info -->
                    <button
                      onclick={(e) => { e.stopPropagation(); toggleQuizInfo(quiz.id); }}
                      class="w-8 h-8 rounded-lg {expandedQuizId === quiz.id ? 'bg-blue-500/20' : 'bg-gray-700/50 opacity-0 group-hover:opacity-100'} hover:bg-blue-500/20 flex items-center justify-center shrink-0 transition-all"
                      title="Plus d'infos"
                    >
                      <Info class="w-4 h-4 {expandedQuizId === quiz.id ? 'text-blue-400' : 'text-gray-400'}" />
                    </button>
                    
                    <!-- Bouton + / - -->
                    {#if isInProgram(quiz.id)}
                      <button
                        onclick={(e) => { e.stopPropagation(); removeFromProgram(quiz); }}
                        disabled={removingQuiz === quiz.id}
                        class="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-red-500/20 flex items-center justify-center shrink-0 transition-colors group/btn"
                        title="Retirer de Ma sélection"
                      >
                        {#if removingQuiz === quiz.id}
                          <Loader2 class="w-4 h-4 text-gray-400 animate-spin" />
                        {:else}
                          <Check class="w-4 h-4 text-green-400 group-hover/btn:hidden" />
                          <Minus class="w-4 h-4 text-red-400 hidden group-hover/btn:block" />
                        {/if}
                      </button>
                    {:else}
                      <button
                        onclick={(e) => { e.stopPropagation(); addToProgram(quiz); }}
                        disabled={addingQuiz === quiz.id}
                        class="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-green-500/20 flex items-center justify-center shrink-0 transition-colors"
                        title="Ajouter à Ma sélection"
                      >
                        {#if addingQuiz === quiz.id}
                          <Loader2 class="w-4 h-4 text-gray-400 animate-spin" />
                        {:else}
                          <Plus class="w-4 h-4 text-gray-400 hover:text-green-400" />
                        {/if}
                      </button>
                    {/if}
                  </div>
                  
                  <!-- Description dépliable -->
                  {#if expandedQuizId === quiz.id}
                    <div class="px-4 pb-3 pt-1 border-t border-gray-700/30 ml-12">
                      <p class="text-sm text-gray-400">
                        {quiz.description || 'Aucune description disponible pour ce quiz.'}
                      </p>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </section>
        {/if}
        
        <!-- Message si aucun quiz -->
        {#if quizzes.length === 0 && chapters.every(c => !c.quizzes || c.quizzes.length === 0)}
          <div class="text-center py-8 text-gray-500">
            <p class="text-sm">Aucun quiz disponible pour cette matière</p>
            <p class="text-xs mt-1">De nouveaux quiz seront bientôt ajoutés !</p>
          </div>
        {/if}

        <!-- Action: Explorer plus de quiz -->
        <div class="pt-4 border-t border-gray-800">
          <Button 
            variant="outline"
            class="w-full border-amber-500/30 text-amber-400 bg-gray-700  cursor-pointer"
            onclick={() => { open = false; goto(`/explore?subject=${subject?.code}`); }}
          >
            Explorer tous les quiz de {subject?.name}
            <ChevronRight class="w-4 h-4 ml-2" />
          </Button>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>