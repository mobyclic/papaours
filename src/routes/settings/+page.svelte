<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, loadUser, setUser, logoutUser } from '$lib/stores/userStore.svelte';
  import { loadThemeColor, setThemeColor, THEME_COLORS, type ThemeColorId } from '$lib/stores/themeStore.svelte';
  import ColorPicker from '$lib/components/ColorPicker.svelte';
  import { 
    ChevronLeft, User, Bell, Shield, Palette, Save, Trash2, LogOut,
    Eye, EyeOff, Check
  } from 'lucide-svelte';

  // User data
  let name = $state('');
  let email = $state('');
  let pseudo = $state('');
  let classe = $state('');
  let themeColorValue = $state<ThemeColorId>('gray');
  
  // Preferences
  let notifications = $state({
    badges: true,
    streaks: true,
    leaderboard: true,
    tips: true
  });
  
  let theme = $state('light');
  let soundEnabled = $state(true);
  let animationsEnabled = $state(true);

  // UI State
  let loading = $state(true);
  let saving = $state(false);
  let saved = $state(false);
  let error = $state('');
  let showDeleteConfirm = $state(false);
  let deleteConfirmText = $state('');

  const classes = [
    'Petite section', 'Moyenne section', 'Grande section',
    'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    '2nde', '1ère', 'Terminale',
    'Licence 1', 'Licence 2', 'Licence 3',
    'Master 1', 'Master 2', 'Doctorat', 'Autre'
  ];

  onMount(async () => {
    loadUser();
    if (!$currentUser) {
      goto('/');
      return;
    }
    
    // Initialiser avec les données utilisateur
    name = $currentUser.name || '';
    email = $currentUser.email || '';
    pseudo = $currentUser.pseudo || '';
    classe = $currentUser.classe || '';
    themeColorValue = ($currentUser.theme_color as ThemeColorId) || loadThemeColor();
    
    // Charger les préférences sauvegardées
    const savedPrefs = localStorage.getItem('kwizy_preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        notifications = { ...notifications, ...prefs.notifications };
        theme = prefs.theme || 'light';
        soundEnabled = prefs.soundEnabled ?? true;
        animationsEnabled = prefs.animationsEnabled ?? true;
      } catch (e) {
        console.error('Erreur chargement préférences:', e);
      }
    }
    
    loading = false;
  });

  async function saveProfile() {
    saving = true;
    error = '';
    
    try {
      const cleanId = $currentUser?.id.includes(':') 
        ? $currentUser.id.split(':')[1] 
        : $currentUser?.id;
      
      const res = await fetch(`/api/users/${cleanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          pseudo,
          classe,
          theme_color: themeColorValue
        })
      });

      if (res.ok) {
        const data = await res.json();
        if ($currentUser) {
          setUser({ ...$currentUser, name, pseudo, classe, theme_color: themeColorValue });
        }
        // Sauvegarder la couleur dans localStorage pour la page de login
        setThemeColor(themeColorValue);
        saved = true;
        setTimeout(() => saved = false, 2000);
      } else {
        const data = await res.json();
        error = data.error || 'Erreur lors de la sauvegarde';
      }
    } catch (e) {
      console.error('Erreur:', e);
      error = 'Erreur de connexion';
    } finally {
      saving = false;
    }
  }

  function savePreferences() {
    const prefs = {
      notifications,
      theme,
      soundEnabled,
      animationsEnabled
    };
    localStorage.setItem('kwizy_preferences', JSON.stringify(prefs));
    saved = true;
    setTimeout(() => saved = false, 2000);
  }

  function handleLogout() {
    logoutUser();
    goto('/');
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'SUPPRIMER') {
      error = 'Tape "SUPPRIMER" pour confirmer';
      return;
    }

    try {
      const cleanId = $currentUser?.id.includes(':') 
        ? $currentUser.id.split(':')[1] 
        : $currentUser?.id;
      
      const res = await fetch(`/api/users/${cleanId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        logoutUser();
        goto('/');
      } else {
        error = 'Erreur lors de la suppression';
      }
    } catch (e) {
      error = 'Erreur de connexion';
    }
  }
</script>

<svelte:head>
  <title>Paramètres - Kwizy</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="max-w-2xl mx-auto p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <button
        onclick={() => goto('/dashboard')}
        class="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
      >
        <ChevronLeft class="w-5 h-5" />
        <span>Retour</span>
      </button>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">⚙️ Paramètres</h1>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    {:else}
      <!-- Success Message -->
      {#if saved}
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
          <Check class="w-5 h-5" />
          Modifications enregistrées !
        </div>
      {/if}

      <!-- Error Message -->
      {#if error}
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      {/if}

      <!-- Profile Section -->
      <section class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <User class="w-5 h-5 text-purple-600" />
          Mon profil
        </h2>
        
        <div class="space-y-4">
          <div>
            <label for="settings-name" class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              id="settings-name"
              type="text"
              bind:value={name}
              class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ton nom"
            />
          </div>
          
          <div>
            <label for="settings-pseudo" class="block text-sm font-medium text-gray-700 mb-1">Pseudo</label>
            <input
              id="settings-pseudo"
              type="text"
              bind:value={pseudo}
              class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ton pseudo (affiché dans les classements)"
            />
          </div>
          
          <div>
            <label for="settings-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="settings-email"
              type="email"
              value={email}
              disabled
              class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
            <p class="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>
          
          <div>
            <label for="settings-classe" class="block text-sm font-medium text-gray-700 mb-1">Classe / Niveau</label>
            <select
              id="settings-classe"
              bind:value={classe}
              class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Sélectionne ta classe</option>
              {#each classes as c}
                <option value={c}>{c}</option>
              {/each}
            </select>
          </div>
          
          <button
            onclick={saveProfile}
            disabled={saving}
            class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {#if saving}
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {:else}
              <Save class="w-5 h-5" />
            {/if}
            Enregistrer le profil
          </button>
        </div>
      </section>

      <!-- Notifications Section -->
      <section class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Bell class="w-5 h-5 text-blue-600" />
          Notifications
        </h2>
        
        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">Badges gagnés</span>
            <input
              type="checkbox"
              bind:checked={notifications.badges}
              onchange={savePreferences}
              class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
            />
          </label>
          
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">Rappels de série (streak)</span>
            <input
              type="checkbox"
              bind:checked={notifications.streaks}
              onchange={savePreferences}
              class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
            />
          </label>
          
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">Classement hebdomadaire</span>
            <input
              type="checkbox"
              bind:checked={notifications.leaderboard}
              onchange={savePreferences}
              class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
            />
          </label>
          
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">Conseils et astuces</span>
            <input
              type="checkbox"
              bind:checked={notifications.tips}
              onchange={savePreferences}
              class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
            />
          </label>
        </div>
      </section>

      <!-- Appearance Section -->
      <section class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Palette class="w-5 h-5 text-green-600" />
          Apparence
        </h2>
        
        <div class="space-y-6">
          <!-- Sélecteur de couleur -->
          <div>
            <ColorPicker bind:value={themeColorValue} label="Couleur de thème 🎨" size="lg" />
            <p class="text-xs text-gray-500 mt-2">Cette couleur sera utilisée dans toute l'application et sur la page de connexion.</p>
          </div>
          
          <hr class="border-gray-100" />
          
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">Sons activés</span>
            <input
              type="checkbox"
              bind:checked={soundEnabled}
              onchange={savePreferences}
              class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
            />
          </label>
          
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">Animations activées</span>
            <input
              type="checkbox"
              bind:checked={animationsEnabled}
              onchange={savePreferences}
              class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
            />
          </label>
        </div>
      </section>

      <!-- Danger Zone -->
      <section class="bg-white rounded-xl shadow-sm p-6 border border-red-200">
        <h2 class="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
          <Shield class="w-5 h-5" />
          Zone de danger
        </h2>
        
        <div class="space-y-4">
          <button
            onclick={handleLogout}
            class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <LogOut class="w-5 h-5" />
            Se déconnecter
          </button>
          
          {#if !showDeleteConfirm}
            <button
              onclick={() => showDeleteConfirm = true}
              class="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 class="w-5 h-5" />
              Supprimer mon compte
            </button>
          {:else}
            <div class="p-4 bg-red-50 rounded-xl border border-red-200">
              <p class="text-sm text-red-700 mb-3">
                ⚠️ Cette action est irréversible. Toutes tes données seront supprimées.
              </p>
              <p class="text-sm text-gray-600 mb-2">
                Tape <strong>SUPPRIMER</strong> pour confirmer :
              </p>
              <input
                type="text"
                bind:value={deleteConfirmText}
                class="w-full px-4 py-2 border border-red-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="SUPPRIMER"
              />
              <div class="flex gap-2">
                <button
                  onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}
                  class="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onclick={deleteAccount}
                  disabled={deleteConfirmText !== 'SUPPRIMER'}
                  class="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          {/if}
        </div>
      </section>
    {/if}
  </div>
</main>
