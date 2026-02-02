<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/userStore.svelte';
  import { Users, GraduationCap, Plus, Mail, Trash2, RefreshCw, BookOpen, BarChart3 } from 'lucide-svelte';
  
  interface Tutor {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    created_at: string;
    students_count: number;
  }

  interface EstablishmentClass {
    id: string;
    name: string;
    description?: string;
    tutor?: { id: string; name: string };
    students_count: number;
    created_at: string;
  }

  let activeTab = $state<'tutors' | 'classes'>('tutors');
  let tutors = $state<Tutor[]>([]);
  let classes = $state<EstablishmentClass[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Modals
  let showInviteTutorModal = $state(false);
  let showCreateClassModal = $state(false);
  
  // Invite tutor form
  let inviteEmail = $state('');
  let invitePrenom = $state('');
  let inviteNom = $state('');
  let inviting = $state(false);
  let inviteError = $state('');
  let inviteSuccess = $state(false);

  // Create class form
  let className = $state('');
  let classDescription = $state('');
  let classTutorId = $state('');
  let creatingClass = $state(false);
  let createClassError = $state('');

  const MAX_TUTORS = 5; // Inclus dans le plan, +5€ par tuteur supplémentaire

  $effect(() => {
    if ($currentUser && $currentUser.profile_type !== 'etablissement') {
      goto('/dashboard');
    }
  });

  onMount(() => {
    loadData();
  });

  async function loadData() {
    loading = true;
    error = '';

    try {
      const [tutorsRes, classesRes] = await Promise.all([
        fetch('/api/establishment/tutors'),
        fetch('/api/establishment/classes')
      ]);

      const tutorsData = await tutorsRes.json();
      const classesData = await classesRes.json();

      if (tutorsRes.ok) tutors = tutorsData.tutors || [];
      if (classesRes.ok) classes = classesData.classes || [];

    } catch (err) {
      error = 'Erreur de chargement';
    } finally {
      loading = false;
    }
  }

  async function inviteTutor() {
    if (!inviteEmail || !invitePrenom || !inviteNom) {
      inviteError = 'Tous les champs sont requis';
      return;
    }

    inviting = true;
    inviteError = '';

    try {
      const res = await fetch('/api/establishment/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          prenom: invitePrenom,
          nom: inviteNom
        })
      });

      const data = await res.json();

      if (!res.ok) {
        inviteError = data.message || 'Erreur d\'invitation';
        return;
      }

      inviteSuccess = true;
      await loadData();

      // Reset après 2s
      setTimeout(() => {
        closeInviteModal();
      }, 2000);

    } catch (err) {
      inviteError = 'Erreur de connexion';
    } finally {
      inviting = false;
    }
  }

  async function removeTutor(tutorId: string) {
    if (!confirm('Retirer ce tuteur de votre établissement ?')) return;

    try {
      const res = await fetch(`/api/establishment/tutors/${tutorId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Erreur');
        return;
      }

      await loadData();
    } catch (err) {
      alert('Erreur de connexion');
    }
  }

  async function createClass() {
    if (!className) {
      createClassError = 'Nom de la classe requis';
      return;
    }

    creatingClass = true;
    createClassError = '';

    try {
      const res = await fetch('/api/establishment/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: className,
          description: classDescription || undefined,
          tutor_id: classTutorId || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        createClassError = data.message || 'Erreur de création';
        return;
      }

      await loadData();
      closeCreateClassModal();

    } catch (err) {
      createClassError = 'Erreur de connexion';
    } finally {
      creatingClass = false;
    }
  }

  async function deleteClass(classId: string) {
    if (!confirm('Supprimer cette classe ?')) return;

    try {
      const res = await fetch(`/api/establishment/classes/${classId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Erreur');
        return;
      }

      await loadData();
    } catch (err) {
      alert('Erreur de connexion');
    }
  }

  function closeInviteModal() {
    showInviteTutorModal = false;
    inviteEmail = '';
    invitePrenom = '';
    inviteNom = '';
    inviteError = '';
    inviteSuccess = false;
  }

  function closeCreateClassModal() {
    showCreateClassModal = false;
    className = '';
    classDescription = '';
    classTutorId = '';
    createClassError = '';
  }
</script>

<svelte:head>
  <title>Gestion Établissement - Kweez</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">Gestion de l'établissement</h1>
    <p class="text-gray-500">Gérez vos tuteurs et vos classes</p>
  </div>

  <!-- Stats cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div class="bg-white rounded-xl border p-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Users class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{tutors.length}</p>
          <p class="text-sm text-gray-500">Tuteurs</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl border p-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{classes.length}</p>
          <p class="text-sm text-gray-500">Classes</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl border p-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <GraduationCap class="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{tutors.reduce((sum, t) => sum + (t.students_count || 0), 0)}</p>
          <p class="text-sm text-gray-500">Apprenants</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-2 mb-6">
    <button
      onclick={() => activeTab = 'tutors'}
      class="px-4 py-2 rounded-lg font-medium transition-colors {activeTab === 'tutors' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      <Users class="w-4 h-4 inline mr-2" />
      Tuteurs
    </button>
    <button
      onclick={() => activeTab = 'classes'}
      class="px-4 py-2 rounded-lg font-medium transition-colors {activeTab === 'classes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      <BookOpen class="w-4 h-4 inline mr-2" />
      Classes
    </button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  {:else if error}
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      {error}
    </div>
  {:else}
    <!-- Tuteurs Tab -->
    {#if activeTab === 'tutors'}
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-900">Tuteurs ({tutors.length}/{MAX_TUTORS} inclus)</h2>
            {#if tutors.length > MAX_TUTORS}
              <p class="text-xs text-amber-600">+{(tutors.length - MAX_TUTORS) * 5}€/mois pour les tuteurs supplémentaires</p>
            {/if}
          </div>
          <button
            onclick={() => showInviteTutorModal = true}
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus class="w-4 h-4" />
            Inviter un tuteur
          </button>
        </div>

        {#if tutors.length === 0}
          <div class="p-8 text-center text-gray-500">
            <Users class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun tuteur pour le moment</p>
            <p class="text-sm">Invitez des tuteurs pour qu'ils puissent créer des apprenants</p>
          </div>
        {:else}
          <div class="divide-y">
            {#each tutors as tutor}
              <div class="p-4 flex items-center justify-between hover:bg-gray-50">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {tutor.prenom?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{tutor.prenom} {tutor.nom}</p>
                    <p class="text-sm text-gray-500">{tutor.email}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-500">{tutor.students_count || 0} apprenant(s)</span>
                  <button
                    onclick={() => removeTutor(tutor.id)}
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Retirer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Classes Tab -->
    {#if activeTab === 'classes'}
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Classes</h2>
          <button
            onclick={() => showCreateClassModal = true}
            class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
          >
            <Plus class="w-4 h-4" />
            Créer une classe
          </button>
        </div>

        {#if classes.length === 0}
          <div class="p-8 text-center text-gray-500">
            <BookOpen class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune classe pour le moment</p>
            <p class="text-sm">Créez des classes pour organiser vos apprenants</p>
          </div>
        {:else}
          <div class="divide-y">
            {#each classes as cls}
              <div class="p-4 flex items-center justify-between hover:bg-gray-50">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <BookOpen class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{cls.name}</p>
                    {#if cls.description}
                      <p class="text-sm text-gray-500">{cls.description}</p>
                    {/if}
                    {#if cls.tutor}
                      <p class="text-xs text-blue-600">Tuteur : {cls.tutor.name}</p>
                    {/if}
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-500">{cls.students_count || 0} élève(s)</span>
                  <button
                    onclick={() => deleteClass(cls.id)}
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Supprimer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Invite Tutor -->
{#if showInviteTutorModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={closeInviteModal}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
      {#if inviteSuccess}
        <div class="text-center py-4">
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Mail class="w-8 h-8 text-green-600" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Invitation envoyée !</h2>
          <p class="text-gray-600">Le tuteur recevra un email avec ses identifiants.</p>
        </div>
      {:else}
        <h2 class="text-xl font-bold text-gray-900 mb-1">Inviter un tuteur</h2>
        <p class="text-gray-500 text-sm mb-6">Le tuteur recevra un email avec un mot de passe temporaire.</p>

        {#if inviteError}
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {inviteError}
          </div>
        {/if}

        <form onsubmit={(e) => { e.preventDefault(); inviteTutor(); }} class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="prenom" class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                id="prenom"
                type="text"
                bind:value={invitePrenom}
                required
                class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="nom" class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                id="nom"
                type="text"
                bind:value={inviteNom}
                required
                class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              bind:value={inviteEmail}
              required
              class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-blue-500"
              placeholder="tuteur@exemple.com"
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" onclick={closeInviteModal} class="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={inviting} class="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {inviting ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}

<!-- Modal Create Class -->
{#if showCreateClassModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={closeCreateClassModal}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
      <h2 class="text-xl font-bold text-gray-900 mb-1">Créer une classe</h2>
      <p class="text-gray-500 text-sm mb-6">Organisez vos apprenants par classe.</p>

      {#if createClassError}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {createClassError}
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); createClass(); }} class="space-y-4">
        <div>
          <label for="class-name" class="block text-sm font-medium text-gray-700 mb-1">Nom de la classe</label>
          <input
            id="class-name"
            type="text"
            bind:value={className}
            required
            class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-purple-500"
            placeholder="CM2 - Groupe A"
          />
        </div>

        <div>
          <label for="class-desc" class="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
          <input
            id="class-desc"
            type="text"
            bind:value={classDescription}
            class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-purple-500"
            placeholder="Classe de Mme Dupont"
          />
        </div>

        {#if tutors.length > 0}
          <div>
            <label for="class-tutor" class="block text-sm font-medium text-gray-700 mb-1">Tuteur responsable (optionnel)</label>
            <select
              id="class-tutor"
              bind:value={classTutorId}
              class="w-full h-11 px-4 rounded-lg border focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Aucun tuteur assigné</option>
              {#each tutors as tutor}
                <option value={tutor.id}>{tutor.prenom} {tutor.nom}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={closeCreateClassModal} class="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={creatingClass} class="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
            {creatingClass ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
