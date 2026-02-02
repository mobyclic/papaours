<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/userStore.svelte';
  import { Plus, Users, Copy, Check, Trash2, Edit2, RefreshCw, ExternalLink } from 'lucide-svelte';
  
  interface Student {
    id: string;
    prenom: string;
    nom: string;
    tutor_student_id: string;
    global_student_id: string;
    login_code: string;
    theme_color: string;
    created_at: string;
    last_login?: string;
  }

  let students = $state<Student[]>([]);
  let loading = $state(true);
  let error = $state('');
  
  // Création d'élève
  let showCreateModal = $state(false);
  let newStudent = $state({ prenom: '', nom: '' });
  let creating = $state(false);
  let createError = $state('');
  let createdStudent = $state<Student | null>(null);
  
  // Copy feedback
  let copiedId = $state<string | null>(null);

  const MAX_STUDENTS = 5;

  $effect(() => {
    if ($currentUser && $currentUser.profile_type !== 'tuteur') {
      goto('/dashboard');
    }
  });

  onMount(() => {
    loadStudents();
  });

  async function loadStudents() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/tutor/students');
      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Erreur de chargement';
        return;
      }

      students = data.students || [];
    } catch (err) {
      error = 'Erreur de connexion';
    } finally {
      loading = false;
    }
  }

  async function createStudent() {
    if (!newStudent.prenom || !newStudent.nom) {
      createError = 'Prénom et nom requis';
      return;
    }

    creating = true;
    createError = '';

    try {
      const res = await fetch('/api/tutor/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });

      const data = await res.json();

      if (!res.ok) {
        createError = data.message || 'Erreur de création';
        return;
      }

      createdStudent = data.student;
      await loadStudents();
    } catch (err) {
      createError = 'Erreur de connexion';
    } finally {
      creating = false;
    }
  }

  async function deleteStudent(studentId: string) {
    if (!confirm('Supprimer cet élève ? Cette action est irréversible.')) return;

    try {
      const res = await fetch(`/api/tutor/students/${studentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Erreur de suppression');
        return;
      }

      await loadStudents();
    } catch (err) {
      alert('Erreur de connexion');
    }
  }

  async function regenerateCode(studentId: string) {
    try {
      const res = await fetch(`/api/tutor/students/${studentId}/regenerate-code`, {
        method: 'POST'
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Erreur');
        return;
      }

      await loadStudents();
    } catch (err) {
      alert('Erreur de connexion');
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    copiedId = id;
    setTimeout(() => copiedId = null, 2000);
  }

  function closeModal() {
    showCreateModal = false;
    newStudent = { prenom: '', nom: '' };
    createdStudent = null;
    createError = '';
  }

  function getLoginUrl(student: Student) {
    return `${window.location.origin}/student-login`;
  }
</script>

<svelte:head>
  <title>Mes Élèves - Kweez Tuteur</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Mes Élèves</h1>
      <p class="text-gray-500">Gérez les comptes de vos apprenants</p>
    </div>
    
    <button
      onclick={() => showCreateModal = true}
      disabled={students.length >= MAX_STUDENTS}
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Plus class="w-5 h-5" />
      Ajouter un élève
    </button>
  </div>

  <!-- Quota -->
  <div class="mb-6 p-4 bg-gray-50 rounded-lg border">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700">Élèves créés</span>
      <span class="text-sm font-bold text-gray-900">{students.length} / {MAX_STUDENTS}</span>
    </div>
    <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        class="h-full bg-blue-500 transition-all"
        style="width: {(students.length / MAX_STUDENTS) * 100}%"
      ></div>
    </div>
    {#if students.length >= MAX_STUDENTS}
      <p class="text-xs text-amber-600 mt-2">
        Limite atteinte. Passez au plan Établissement pour plus d'élèves.
      </p>
    {/if}
  </div>

  <!-- Liste des élèves -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  {:else if error}
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      {error}
    </div>
  {:else if students.length === 0}
    <div class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
      <Users class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-1">Aucun élève</h3>
      <p class="text-gray-500 mb-4">Créez votre premier élève pour commencer</p>
      <button
        onclick={() => showCreateModal = true}
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
      >
        <Plus class="w-5 h-5" />
        Ajouter un élève
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each students as student}
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div 
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style="background-color: {student.theme_color || '#3B82F6'}"
              >
                {student.prenom.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-900">
                  {student.prenom} {student.nom}
                </h3>
                <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>ID: <code class="bg-gray-100 px-1.5 py-0.5 rounded">{student.global_student_id}</code></span>
                  <span>Code: <code class="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{student.login_code}</code></span>
                </div>
                {#if student.last_login}
                  <p class="text-xs text-gray-400 mt-1">
                    Dernière connexion: {new Date(student.last_login).toLocaleDateString('fr-FR')}
                  </p>
                {:else}
                  <p class="text-xs text-amber-500 mt-1">Jamais connecté</p>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- Copy credentials -->
              <button
                onclick={() => copyToClipboard(`Identifiant: ${student.global_student_id}\nCode: ${student.login_code}`, student.id)}
                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Copier les identifiants"
              >
                {#if copiedId === student.id}
                  <Check class="w-5 h-5 text-green-500" />
                {:else}
                  <Copy class="w-5 h-5" />
                {/if}
              </button>
              
              <!-- Regenerate code -->
              <button
                onclick={() => regenerateCode(student.id)}
                class="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Régénérer le code"
              >
                <RefreshCw class="w-5 h-5" />
              </button>
              
              <!-- Delete -->
              <button
                onclick={() => deleteStudent(student.id)}
                class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Instructions -->
  <div class="mt-8 p-4 bg-blue-50 rounded-lg">
    <h4 class="font-medium text-blue-900 mb-2">Comment ça marche ?</h4>
    <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
      <li>Créez un compte pour votre élève</li>
      <li>Notez son <strong>identifiant</strong> et son <strong>code à 4 chiffres</strong></li>
      <li>L'élève se connecte sur <a href="/student-login" class="underline">kweez.io/student-login</a></li>
      <li>Suivez sa progression dans votre tableau de bord</li>
    </ol>
  </div>
</div>

<!-- Modal création -->
{#if showCreateModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => closeModal()}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div 
      class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      onclick={(e) => e.stopPropagation()}
    >
      {#if createdStudent}
        <!-- Success state -->
        <div class="p-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check class="w-8 h-8 text-green-600" />
            </div>
            <h2 class="text-xl font-bold text-gray-900">Élève créé !</h2>
            <p class="text-gray-500">Notez bien ces informations</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-xs text-gray-500 uppercase">Nom</span>
              <p class="font-medium">{createdStudent.prenom} {createdStudent.nom}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 uppercase">Identifiant</span>
              <p class="font-mono font-bold text-lg">{createdStudent.global_student_id}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 uppercase">Code secret</span>
              <p class="font-mono font-bold text-2xl tracking-widest">{createdStudent.login_code}</p>
            </div>
          </div>

          <button
            onclick={() => copyToClipboard(
              `Identifiant: ${createdStudent?.global_student_id}\nCode: ${createdStudent?.login_code}\nConnexion: ${window.location.origin}/student-login`,
              'new'
            )}
            class="w-full mt-4 py-3 border rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            {#if copiedId === 'new'}
              <Check class="w-5 h-5 text-green-500" />
              Copié !
            {:else}
              <Copy class="w-5 h-5" />
              Copier les informations
            {/if}
          </button>

          <button
            onclick={closeModal}
            class="w-full mt-3 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Terminé
          </button>
        </div>
      {:else}
        <!-- Form state -->
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-1">Nouvel élève</h2>
          <p class="text-gray-500 text-sm mb-6">Créez un compte pour un apprenant</p>

          {#if createError}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {createError}
            </div>
          {/if}

          <form onsubmit={(e) => { e.preventDefault(); createStudent(); }} class="space-y-4">
            <div>
              <label for="prenom" class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                id="prenom"
                type="text"
                bind:value={newStudent.prenom}
                required
                class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maïlys"
              />
            </div>

            <div>
              <label for="nom" class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                id="nom"
                type="text"
                bind:value={newStudent.nom}
                required
                class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Martin"
              />
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                onclick={closeModal}
                class="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                class="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      {/if}
    </div>
  </div>
{/if}
