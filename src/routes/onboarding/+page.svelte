<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, loadUser, logoutUser } from '$lib/stores/userStore.svelte';
  import { t, locale, availableLocales, setLocale, type Locale } from '$lib/i18n';
  import { Button } from '$lib/components/ui/button';
  
  // Types pour les données éducatives
  interface EducationSystem { id: string; code: string; name: string; flag: string; }
  interface Cycle { id: string; code: string; name: string; order: number; }
  interface Track { id: string; code: string; name: string; }
  interface Grade { id: string; code: string; name: string; track?: string; }
  interface Specialty { id: string; code: string; name: string; }
  
  // État du wizard - Étape 0 = langue, 1-4 = éducation
  let step = $state(0);
  const totalSteps = 5; // langue + 4 étapes éducation
  
  // Données chargées depuis la DB
  let systems = $state<EducationSystem[]>([]);
  let cycles = $state<Cycle[]>([]);
  let tracks = $state<Track[]>([]);
  let grades = $state<Grade[]>([]);
  let specialties = $state<Specialty[]>([]);
  
  // Sélections utilisateur
  let selectedLanguage = $state<string>($locale);
  let selectedSystem = $state<string>('');
  let selectedCycle = $state<string>('');
  let selectedTrack = $state<string>('');
  let selectedGrade = $state<string>('');
  let selectedSpecialties = $state<string[]>([]);
  
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  
  // Derived: a-t-on besoin de choisir une filière (lycée) ?
  let needsTrack = $derived(
    selectedCycle && cycles.find(c => c.id === selectedCycle)?.code === 'lycee'
  );
  
  // Derived: a-t-on besoin de choisir des spécialités ?
  let needsSpecialties = $derived(
    selectedTrack && tracks.find(t => t.id === selectedTrack)?.code === 'general'
  );
  
  // Derived: est-ce qu'on peut passer à l'étape suivante ?
  let canProceed = $derived.by(() => {
    switch (step) {
      case 0: return !!selectedLanguage;
      case 1: return !!selectedSystem;
      case 2: return !!selectedCycle;
      case 3: 
        if (needsTrack && !selectedTrack) return false;
        return !!selectedGrade;
      case 4:
        if (needsSpecialties && selectedSpecialties.length < 2) return false;
        return true;
      default: return false;
    }
  });
  
  // SVG flags pour les langues
  // SVG Flags pour les langues
  const languageFlags: Record<string, string> = {
    fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" class="w-8 h-6"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#000091" d="M0 0h213.3v480H0z"/><path fill="#e1000f" d="M426.7 0H640v480H426.7z"/></svg>`,
    en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" class="w-8 h-6"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/><path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/></svg>`
  };
  
  // Helper pour obtenir le nom de la langue
  function getLanguageName(code: string): string {
    return availableLocales.find(l => l.code === code)?.nativeName || code;
  }
  
  onMount(async () => {
    loadUser();
    await new Promise(r => setTimeout(r, 50));
    
    if (!$currentUser) {
      goto('/');
      return;
    }
    
    // Initialiser la langue sélectionnée
    selectedLanguage = $locale;
    
    // Charger les systèmes éducatifs
    await loadSystems();
    loading = false;
  });
  
  async function loadSystems() {
    try {
      const res = await fetch('/api/education/systems');
      if (res.ok) {
        systems = await res.json();
        // Présélectionner France si disponible
        const france = systems.find(s => s.code === 'FR');
        if (france) selectedSystem = france.id;
      }
    } catch (e) {
      console.error('Failed to load systems:', e);
    }
  }
  
  async function loadCycles(systemId: string) {
    try {
      const res = await fetch(`/api/education/cycles?system=${systemId}`);
      if (res.ok) {
        cycles = await res.json();
      }
    } catch (e) {
      console.error('Failed to load cycles:', e);
    }
  }
  
  async function loadTracks(cycleId: string) {
    try {
      const res = await fetch(`/api/education/tracks?cycle=${cycleId}`);
      if (res.ok) {
        tracks = await res.json();
      }
    } catch (e) {
      console.error('Failed to load tracks:', e);
    }
  }
  
  async function loadGrades(cycleId: string, trackId?: string) {
    try {
      let url = `/api/education/grades?cycle=${cycleId}`;
      if (trackId) url += `&track=${trackId}`;
      const res = await fetch(url);
      if (res.ok) {
        grades = await res.json();
      }
    } catch (e) {
      console.error('Failed to load grades:', e);
    }
  }
  
  async function loadSpecialties(trackId: string) {
    try {
      const res = await fetch(`/api/education/specialties?track=${trackId}`);
      if (res.ok) {
        specialties = await res.json();
      }
    } catch (e) {
      console.error('Failed to load specialties:', e);
    }
  }
  
  // Watchers pour charger les données en cascade
  $effect(() => {
    if (selectedSystem) {
      loadCycles(selectedSystem);
      selectedCycle = '';
      selectedTrack = '';
      selectedGrade = '';
      selectedSpecialties = [];
    }
  });
  
  $effect(() => {
    if (selectedCycle) {
      loadTracks(selectedCycle);
      loadGrades(selectedCycle);
      selectedTrack = '';
      selectedGrade = '';
      selectedSpecialties = [];
    }
  });
  
  $effect(() => {
    if (selectedTrack) {
      loadGrades(selectedCycle, selectedTrack);
      loadSpecialties(selectedTrack);
      selectedGrade = '';
      selectedSpecialties = [];
    }
  });
  
  function selectLanguage(lang: string) {
    selectedLanguage = lang;
    setLocale(lang as Locale);
  }
  
  function nextStep() {
    if (step === 2 && !needsTrack) {
      // Pas de filière → passer directement à l'étape 3
      step = 3;
    } else if (step === 3 && !needsSpecialties) {
      // Pas de spécialités → terminer
      saveAndFinish();
      return;
    } else if (step < totalSteps - 1) {
      step++;
    }
    
    // Si étape 4 et pas de spécialités nécessaires, sauvegarder
    if (step === 4 && !needsSpecialties) {
      saveAndFinish();
    }
  }
  
  function prevStep() {
    if (step > 0) step--;
  }
  
  function toggleSpecialty(id: string) {
    if (selectedSpecialties.includes(id)) {
      selectedSpecialties = selectedSpecialties.filter(s => s !== id);
    } else if (selectedSpecialties.length < 3) {
      selectedSpecialties = [...selectedSpecialties, id];
    }
  }
  
  async function saveAndFinish() {
    saving = true;
    error = '';
    
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          education_system: selectedSystem,
          current_cycle: selectedCycle,
          current_track: selectedTrack || null,
          current_grade: selectedGrade,
          specialties: selectedSpecialties,
          preferred_language: selectedLanguage
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
      
      // Mettre à jour le store local
      if ($currentUser) {
        currentUser.value = {
          ...$currentUser,
          // @ts-ignore
          onboarding_completed: true
        };
      }
      
      goto('/dashboard');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Erreur inconnue';
      saving = false;
    }
  }
  
  // Helpers pour l'affichage
  function getSelectedSystemName() {
    return systems.find(s => s.id === selectedSystem)?.name || '';
  }
  
  function getSelectedCycleName() {
    return cycles.find(c => c.id === selectedCycle)?.name || '';
  }
  
  function getSelectedTrackName() {
    return tracks.find(t => t.id === selectedTrack)?.name || '';
  }
  
  function getSelectedGradeName() {
    return grades.find(g => g.id === selectedGrade)?.name || '';
  }
</script>

<svelte:head>
  <title>Configuration du profil | Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 relative overflow-hidden flex items-center justify-center p-4">
  <!-- Grid background pattern -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
  
  <!-- Gradient orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>
  
  <div class="relative z-10 w-full max-w-lg">
    <!-- Logo -->
    <div class="text-center mb-6">
      <a href="/" class="inline-flex items-center gap-2 text-2xl font-bold">
        <span class="text-3xl">🧠</span>
        <span class="bg-gradient-to-r from-amber-400 to-amber-500 text-transparent bg-clip-text">Kweez</span>
      </a>
    </div>
    
    <!-- Progress bar -->
    <div class="mb-6">
      <div class="flex justify-between mb-2">
        {#each Array(totalSteps) as _, i}
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2
              {i <= step 
                ? 'bg-amber-500 border-amber-500 text-gray-900' 
                : 'bg-gray-800 border-gray-700 text-gray-500'}"
          >
            {#if i < step}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            {:else}
              {i + 1}
            {/if}
          </div>
        {/each}
      </div>
      <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
          style="width: {((step + 1) / totalSteps) * 100}%"
        ></div>
      </div>
    </div>
    
    <!-- Card -->
    <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 shadow-2xl">
      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p class="mt-4 text-gray-400">{$t('common.loading')}</p>
        </div>
      {:else}
        <!-- Step 0: Langue -->
        {#if step === 0}
          <div class="text-center mb-8">
            <div class="text-4xl mb-4">🌐</div>
            <h1 class="text-2xl font-bold text-white">{$t('onboarding.selectLanguage')}</h1>
            <p class="text-gray-400 mt-2">{$t('onboarding.chooseLanguage')}</p>
          </div>
          
          <div class="grid grid-cols-1 gap-3">
            {#each availableLocales as lang}
              <button
                type="button"
                onclick={() => selectLanguage(lang.code)}
                class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                  {selectedLanguage === lang.code 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}"
              >
                <span class="flex-shrink-0">
                  {@html languageFlags[lang.code] || lang.flag}
                </span>
                <span class="font-medium text-white">{lang.nativeName}</span>
                {#if selectedLanguage === lang.code}
                  <span class="ml-auto text-amber-500">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
        
        <!-- Step 1: Pays / Système éducatif -->
        {#if step === 1}
          <div class="text-center mb-8">
            <div class="text-4xl mb-4">🌍</div>
            <h1 class="text-2xl font-bold text-white">{$t('onboarding.welcome')}</h1>
            <p class="text-gray-400 mt-2">{$t('onboarding.selectCountry')}</p>
          </div>
          
          <div class="grid grid-cols-1 gap-3">
            {#each systems as system}
              <button
                type="button"
                onclick={() => selectedSystem = system.id}
                class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                  {selectedSystem === system.id 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}"
              >
                <span class="text-3xl">{system.flag}</span>
                <span class="font-medium text-white">{system.name}</span>
                {#if selectedSystem === system.id}
                  <span class="ml-auto text-amber-500">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
        
        <!-- Step 2: Cycle -->
        {#if step === 2}
          <div class="text-center mb-8">
            <div class="text-4xl mb-4">📚</div>
            <h1 class="text-2xl font-bold text-white">{$t('onboarding.selectLevel')}</h1>
            <p class="text-gray-400 mt-2">{$t('onboarding.whatLevel')}</p>
          </div>
          
          <div class="grid grid-cols-1 gap-3">
            {#each cycles as cycle}
              <button
                type="button"
                onclick={() => selectedCycle = cycle.id}
                class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                  {selectedCycle === cycle.id 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}"
              >
                <span class="text-2xl">
                  {#if cycle.code === 'maternelle'}🧒
                  {:else if cycle.code === 'primaire'}📕
                  {:else if cycle.code === 'college'}📗
                  {:else if cycle.code === 'lycee'}📘
                  {:else if cycle.code === 'superieur'}🎓
                  {:else if cycle.code === 'formation_continue'}💼
                  {:else}📖{/if}
                </span>
                <span class="font-medium text-white">{cycle.name}</span>
                {#if selectedCycle === cycle.id}
                  <span class="ml-auto text-amber-500">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
        
        <!-- Step 3: Filière + Classe -->
        {#if step === 3}
          <div class="text-center mb-8">
            <div class="text-4xl mb-4">🎯</div>
            <h1 class="text-2xl font-bold text-white">{$t('onboarding.selectGrade')}</h1>
            <p class="text-gray-400 mt-2">{$t('onboarding.whatGrade')}</p>
          </div>
          
          <!-- Filière (si lycée) -->
          {#if needsTrack && tracks.length > 0}
            <div class="mb-6">
              <div class="block text-sm font-medium text-gray-300 mb-2">
                {$t('onboarding.track')}
              </div>
              <div class="grid grid-cols-1 gap-2">
                {#each tracks as track}
                  <button
                    type="button"
                    onclick={() => selectedTrack = track.id}
                    class="flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                      {selectedTrack === track.id 
                        ? 'border-amber-500 bg-amber-500/10' 
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}"
                  >
                    <span class="font-medium text-white">{track.name}</span>
                    {#if selectedTrack === track.id}
                      <span class="ml-auto text-amber-500">✓</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Classe -->
          {#if grades.length > 0}
            <div>
              <div class="block text-sm font-medium text-gray-300 mb-2">
                {$t('onboarding.grade')}
              </div>
              <div class="grid grid-cols-2 gap-2">
                {#each grades as grade}
                  <button
                    type="button"
                    onclick={() => selectedGrade = grade.id}
                    class="p-3 rounded-lg border-2 transition-all text-center
                      {selectedGrade === grade.id 
                        ? 'border-amber-500 bg-amber-500/10' 
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}"
                  >
                    <span class="font-medium text-white">{grade.name}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
        
        <!-- Step 4: Spécialités (si lycée général) -->
        {#if step === 4 && needsSpecialties}
          <div class="text-center mb-8">
            <div class="text-4xl mb-4">⭐</div>
            <h1 class="text-2xl font-bold text-white">{$t('onboarding.selectSpecialties')}</h1>
            <p class="text-gray-400 mt-2">{$t('onboarding.chooseSpecialties')}</p>
          </div>
          
          <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
            {#each specialties as specialty}
              <button
                type="button"
                onclick={() => toggleSpecialty(specialty.id)}
                class="flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                  {selectedSpecialties.includes(specialty.id) 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}
                  {selectedSpecialties.length >= 3 && !selectedSpecialties.includes(specialty.id) 
                    ? 'opacity-40 cursor-not-allowed' : ''}"
                disabled={selectedSpecialties.length >= 3 && !selectedSpecialties.includes(specialty.id)}
              >
                <span class="font-medium text-white">{specialty.name}</span>
                {#if selectedSpecialties.includes(specialty.id)}
                  <span class="ml-auto text-amber-500">✓</span>
                {/if}
              </button>
            {/each}
          </div>
          
          <p class="text-sm text-gray-500 mt-4 text-center">
            <span class="text-amber-500 font-medium">{selectedSpecialties.length}</span>/3 {$t('onboarding.specialtiesSelected')}
          </p>
        {/if}
        
        <!-- Error message -->
        {#if error}
          <div class="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        {/if}
        
        <!-- Navigation -->
        <div class="flex justify-between mt-8">
          {#if step > 0}
            <Button
              variant="outline"
              onclick={prevStep}
              class="px-6 border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {$t('common.previous')}
            </Button>
          {:else}
            <div></div>
          {/if}
          
          {#if step === 4 || (step === 3 && !needsSpecialties)}
            <Button
              onclick={saveAndFinish}
              disabled={!canProceed || saving}
              class="px-6 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold disabled:opacity-50"
            >
              {#if saving}
                <span class="animate-spin mr-2">⏳</span>
              {/if}
              {$t('onboarding.finish')}
            </Button>
          {:else}
            <Button
              onclick={nextStep}
              disabled={!canProceed}
              class="px-6 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold disabled:opacity-50"
            >
              {$t('common.next')}
            </Button>
          {/if}
        </div>
      {/if}
    </div>
    
    <!-- Logout button - always visible -->
    <div class="text-center mt-4">
      <button
        type="button"
        onclick={async () => {
          logoutUser(); // Clear localStorage
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/';
        }}
        class="text-sm text-gray-400 hover:text-amber-400 underline transition-colors"
      >
        🚪 {$t('nav.logout')}
      </button>
    </div>
    
    <!-- Summary (shown from step 1) -->
    {#if step > 0 && !loading}
      <div class="mt-4 p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 text-sm">
        <div class="flex flex-wrap gap-2">
          {#if selectedLanguage}
            <span class="px-3 py-1 bg-gray-800 rounded-full text-gray-300 border border-gray-700">
              {getLanguageName(selectedLanguage)}
            </span>
          {/if}
          {#if selectedSystem}
            <span class="px-3 py-1 bg-gray-800 rounded-full text-gray-300 border border-gray-700">
              {systems.find(s => s.id === selectedSystem)?.flag} {getSelectedSystemName()}
            </span>
          {/if}
          {#if selectedCycle}
            <span class="px-3 py-1 bg-gray-800 rounded-full text-gray-300 border border-gray-700">{getSelectedCycleName()}</span>
          {/if}
          {#if selectedTrack}
            <span class="px-3 py-1 bg-gray-800 rounded-full text-gray-300 border border-gray-700">{getSelectedTrackName()}</span>
          {/if}
          {#if selectedGrade}
            <span class="px-3 py-1 bg-gray-800 rounded-full text-gray-300 border border-gray-700">{getSelectedGradeName()}</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
