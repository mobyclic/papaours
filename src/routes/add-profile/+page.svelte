<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { currentUser, loadUser } from '$lib/stores/userStore.svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { 
    ChevronLeft, UserPlus, Users, GraduationCap, Baby, 
    BookOpen, Check, ArrowRight
  } from 'lucide-svelte';

  let loading = $state(true);
  let upgradeToTutor = $state(false);
  let step = $state(1);
  
  // Form data
  let profileType = $state<'child' | 'student' | ''>('');
  let firstName = $state('');
  let lastName = $state('');
  let birthYear = $state('');
  let selectedGrade = $state('');
  let selectedCycle = $state('');
  
  // Data
  let cycles = $state<any[]>([]);
  let grades = $state<any[]>([]);
  
  let filteredGrades = $derived(
    selectedCycle ? grades.filter(g => g.cycle?.toString() === selectedCycle) : grades
  );

  onMount(async () => {
    loadUser();
    
    // Check URL params
    const params = $page.url.searchParams;
    if (params.get('upgrade') === 'tutor') {
      upgradeToTutor = true;
    }
    
    await new Promise(r => setTimeout(r, 50));
    
    if (!$currentUser) {
      goto('/');
      return;
    }
    
    // Si l'utilisateur est apprenant et pas en mode upgrade, rediriger
    if ($currentUser.profile_type === 'apprenant' && !upgradeToTutor) {
      goto('/dashboard');
      return;
    }
    
    await loadEducationData();
    loading = false;
  });

  async function loadEducationData() {
    try {
      const res = await fetch('/api/education/cycles');
      if (res.ok) {
        const data = await res.json();
        cycles = data.cycles || [];
        grades = data.grades || [];
      }
    } catch (e) {
      console.error('Erreur chargement données éducatives:', e);
    }
  }

  async function handleUpgradeToTutor() {
    try {
      const res = await fetch('/api/user/upgrade-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        // Recharger l'utilisateur
        loadUser();
        upgradeToTutor = false;
        step = 1;
      }
    } catch (e) {
      console.error('Erreur upgrade tuteur:', e);
    }
  }

  async function createProfile() {
    if (!firstName.trim() || !selectedGrade) return;
    
    try {
      const res = await fetch('/api/user/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthYear: birthYear || null,
          gradeId: selectedGrade,
          profileType
        })
      });
      
      if (res.ok) {
        goto('/dashboard?profile_created=true');
      }
    } catch (e) {
      console.error('Erreur création profil:', e);
    }
  }

  function selectProfileType(type: 'child' | 'student') {
    profileType = type;
    step = 2;
  }
</script>

<svelte:head>
  <title>Ajouter un profil - Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <!-- Grid Background -->
  <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
  
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
    <div class="max-w-2xl mx-auto px-4 py-4">
      <button
        onclick={() => goto('/dashboard')}
        class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft class="w-5 h-5" />
        <span>Retour au dashboard</span>
      </button>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    {:else if upgradeToTutor}
      <!-- Upgrade to Tutor Screen -->
      <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-8 text-center">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
          <Users class="w-10 h-10 text-white" />
        </div>
        
        <h1 class="text-2xl font-bold mb-3">Activer le mode Tuteur</h1>
        <p class="text-gray-400 mb-8 max-w-md mx-auto">
          En devenant tuteur, vous pourrez créer et gérer des profils pour vos enfants ou vos élèves.
        </p>

        <div class="bg-gray-800/50 rounded-xl p-6 mb-8 text-left max-w-sm mx-auto border border-gray-700">
          <h3 class="font-medium text-white mb-4 flex items-center gap-2">
            <GraduationCap class="w-5 h-5 text-amber-400" />
            Fonctionnalités débloquées
          </h3>
          <ul class="space-y-3 text-sm">
            <li class="flex items-center gap-3 text-gray-300">
              <Check class="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Créer des profils enfants/élèves</span>
            </li>
            <li class="flex items-center gap-3 text-gray-300">
              <Check class="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Suivre leur progression détaillée</span>
            </li>
            <li class="flex items-center gap-3 text-gray-300">
              <Check class="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Assigner des quiz personnalisés</span>
            </li>
            <li class="flex items-center gap-3 text-gray-300">
              <Check class="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Recevoir des rapports hebdomadaires</span>
            </li>
          </ul>
        </div>

        <div class="flex gap-4 justify-center">
          <Button 
            variant="outline"
            onclick={() => goto('/dashboard')}
            class="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Annuler
          </Button>
          <Button 
            onclick={handleUpgradeToTutor}
            class="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold px-6"
          >
            <Users class="w-4 h-4 mr-2" />
            Activer le mode Tuteur
          </Button>
        </div>
      </div>
    {:else}
      <!-- Add Profile Flow -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold mb-2">Ajouter un profil</h1>
        <p class="text-gray-400">Créez un profil pour suivre la progression d'un enfant ou d'un élève.</p>
      </div>

      <!-- Progress Steps -->
      <div class="flex items-center gap-2 mb-8">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full {step >= 1 ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-500'} flex items-center justify-center font-bold text-sm">
            1
          </div>
          <span class="text-sm {step >= 1 ? 'text-white' : 'text-gray-500'}">Type</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-800">
          <div class="h-full bg-amber-500 transition-all" style="width: {step >= 2 ? '100%' : '0%'}"></div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full {step >= 2 ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-500'} flex items-center justify-center font-bold text-sm">
            2
          </div>
          <span class="text-sm {step >= 2 ? 'text-white' : 'text-gray-500'}">Infos</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-800">
          <div class="h-full bg-amber-500 transition-all" style="width: {step >= 3 ? '100%' : '0%'}"></div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full {step >= 3 ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-500'} flex items-center justify-center font-bold text-sm">
            3
          </div>
          <span class="text-sm {step >= 3 ? 'text-white' : 'text-gray-500'}">Niveau</span>
        </div>
      </div>

      <!-- Step 1: Profile Type -->
      {#if step === 1}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onclick={() => selectProfileType('child')}
            class="group bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-6 text-left transition-all"
          >
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Baby class="w-7 h-7 text-white" />
            </div>
            <h3 class="font-semibold text-white mb-2">Mon enfant</h3>
            <p class="text-sm text-gray-400">
              Créer un profil pour votre enfant et suivre sa progression scolaire.
            </p>
          </button>

          <button
            onclick={() => selectProfileType('student')}
            class="group bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-6 text-left transition-all"
          >
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen class="w-7 h-7 text-white" />
            </div>
            <h3 class="font-semibold text-white mb-2">Un élève</h3>
            <p class="text-sm text-gray-400">
              Créer un profil pour un élève de votre classe ou groupe.
            </p>
          </button>
        </div>
      {/if}

      <!-- Step 2: Basic Info -->
      {#if step === 2}
        <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
          <h2 class="font-semibold text-lg mb-6">
            Informations de {profileType === 'child' ? "l'enfant" : "l'élève"}
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Prénom *</label>
              <input
                type="text"
                bind:value={firstName}
                placeholder="Entrez le prénom"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Nom (optionnel)</label>
              <input
                type="text"
                bind:value={lastName}
                placeholder="Entrez le nom"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Année de naissance (optionnel)</label>
              <input
                type="number"
                bind:value={birthYear}
                placeholder="Ex: 2015"
                min="2000"
                max="2025"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          <div class="flex gap-4 mt-8">
            <Button 
              variant="outline"
              onclick={() => step = 1}
              class="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Retour
            </Button>
            <Button 
              onclick={() => { if (firstName.trim()) step = 3; }}
              disabled={!firstName.trim()}
              class="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold disabled:opacity-50"
            >
              Continuer
              <ArrowRight class="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      {/if}

      <!-- Step 3: Grade Selection -->
      {#if step === 3}
        <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
          <h2 class="font-semibold text-lg mb-6">Niveau scolaire</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Cycle</label>
              <select
                bind:value={selectedCycle}
                onchange={() => selectedGrade = ''}
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              >
                <option value="">Sélectionner un cycle</option>
                {#each cycles as cycle}
                  <option value={cycle.id?.toString()}>{cycle.name}</option>
                {/each}
              </select>
            </div>

            {#if selectedCycle}
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Classe *</label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {#each filteredGrades as grade}
                    <button
                      onclick={() => selectedGrade = grade.id?.toString()}
                      class="px-4 py-3 rounded-xl border transition-all text-sm font-medium {selectedGrade === grade.id?.toString() ? 'bg-amber-500 border-amber-500 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}"
                    >
                      {grade.name}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <div class="flex gap-4 mt-8">
            <Button 
              variant="outline"
              onclick={() => step = 2}
              class="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Retour
            </Button>
            <Button 
              onclick={createProfile}
              disabled={!selectedGrade}
              class="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold disabled:opacity-50"
            >
              <UserPlus class="w-4 h-4 mr-2" />
              Créer le profil
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>
