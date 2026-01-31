<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setUser, loadUser, currentUser } from '$lib/stores/userStore.svelte';
  import { setAdminUser } from '$lib/stores/adminStore.svelte';
  
  let mode = $state<'login' | 'signup'>('login');
  let pseudo = $state('');
  let nom = $state('');
  let prenom = $state('');
  let dateNaissance = $state('');
  let classe = $state('');
  let authLoading = $state(false);
  let authError = $state('');
  let checkingAuth = $state(true);

  const classes = [
    'Petite section',
    'Moyenne section', 
    'Grande section',
    'CP',
    'CE1',
    'CE2',
    'CM1',
    'CM2',
    '6ème',
    '5ème',
    '4ème',
    '3ème',
    '2nde',
    '1ère',
    'Terminale',
    'Licence 1',
    'Licence 2',
    'Licence 3',
    'Master 1',
    'Master 2',
    'Doctorat',
    'Autre'
  ];

  onMount(() => {
    // Vérifier si l'utilisateur est déjà connecté
    loadUser();
    // Petit délai pour laisser le store se mettre à jour
    setTimeout(() => {
      if ($currentUser) {
        goto('/dashboard');
      } else {
        checkingAuth = false;
      }
    }, 100);
  });
  
  function goDashboard() {
    goto('/dashboard');
  }

  async function submitAuth(e: Event) {
    e.preventDefault();
    authLoading = true;
    authError = '';
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' 
        ? { email: pseudo, password: '' } 
        : { email: pseudo, password: '', name: `${prenom} ${nom}`, nom, prenom, dateNaissance, classe };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        authError = data.message || 'Erreur';
        return;
      }
      setUser(data.user);
      if (data.user?.is_admin) {
        setAdminUser({ id: data.user.id, email: data.user.email, name: data.user.name, role: 'admin' });
      }
      // Après auth, aller vers le dashboard
      goDashboard();
    } catch (err) {
      console.error(err);
      authError = 'Erreur de connexion au serveur';
    } finally {
      authLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Papa Ours - Connexion</title>
</svelte:head>

{#if checkingAuth}
  <!-- Écran de chargement pendant la vérification de l'auth -->
  <main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <div class="text-center">
      <div class="animate-bounce text-6xl mb-4">🐻</div>
      <p class="text-xl text-purple-600 font-medium">Chargement...</p>
    </div>
  </main>
{:else}
  <main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
  <div class="w-full max-w-2xl">
    <!-- Auth uniquement -->
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-200 overflow-hidden">
      <div class="p-8 space-y-6">
        <!-- Logo / Titre dans le cadre -->
        <div class="text-center">
          <div class="inline-block mb-4">
            <svg viewBox="0 0 200 200" class="w-32 h-32 drop-shadow-2xl">
              <!-- Oreille gauche -->
              <circle cx="60" cy="50" r="25" fill="#8B5A2B" />
              <circle cx="60" cy="50" r="15" fill="#D2691E" />
              <!-- Oreille droite -->
              <circle cx="140" cy="50" r="25" fill="#8B5A2B" />
              <circle cx="140" cy="50" r="15" fill="#D2691E" />
              <!-- Tête -->
              <circle cx="100" cy="100" r="60" fill="#A0522D" />
              <!-- Museau -->
              <ellipse cx="100" cy="115" rx="35" ry="30" fill="#D2B48C" />
              <!-- Yeux -->
              <circle cx="80" cy="90" r="8" fill="#000" />
              <circle cx="83" cy="88" r="3" fill="#fff" />
              <circle cx="120" cy="90" r="8" fill="#000" />
              <circle cx="123" cy="88" r="3" fill="#fff" />
              <!-- Nez -->
              <ellipse cx="100" cy="115" rx="12" ry="10" fill="#000" />
              <circle cx="97" cy="112" r="3" fill="#fff" opacity="0.6" />
              <!-- Sourire musical -->
              <path d="M 85 125 Q 100 140 115 125" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
              <!-- Note de musique -->
              <g transform="translate(145, 145)">
                <circle cx="0" cy="0" r="8" fill="#6366F1" />
                <ellipse cx="0" cy="0" rx="6" ry="8" fill="#6366F1" transform="rotate(-20)" />
                <rect x="5" y="-25" width="3" height="25" fill="#6366F1" />
                <path d="M 8 -25 Q 15 -20 8 -15" fill="#6366F1" />
              </g>
            </svg>
          </div>
          
          <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Bienvenue
          </h1>
        </div>

        <!-- Formulaire d'authentification -->
        <div>
          <!-- Boutons masqués pour l'instant
          <div class="flex gap-4 mb-4">
            <button class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              class:!bg-purple-600={mode==='login'} class:!text-white={mode==='login'} class:!border-purple-600={mode==='login'}
              onclick={() => mode='login'}>Se connecter</button>
            <button class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              class:!bg-pink-600={mode==='signup'} class:!text-white={mode==='signup'} class:!border-pink-600={mode==='signup'}
              onclick={() => mode='signup'}>S'inscrire</button>
          </div>
          -->

          {#if authError}
            <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700">{authError}</div>
          {/if}

          <form onsubmit={submitAuth} class="space-y-4">
            {#if mode === 'login'}
              <!-- Formulaire de connexion simple -->
              <div>
                <label for="home-pseudo" class="text-sm text-gray-700">Ton pseudo</label>
                <input id="home-pseudo" type="text" bind:value={pseudo} required class="w-full h-10 px-3 rounded-lg border" placeholder="Entre ton pseudo..." />
              </div>
              <div>
                <button type="submit" disabled={authLoading} class="w-full h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold disabled:opacity-50">
                  {authLoading ? 'Connexion...' : 'Accéder'}
                </button>
              </div>
              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'signup'} class="text-sm text-purple-600 hover:text-purple-800 underline">
                  Pas encore inscrit ? S'inscrire
                </button>
              </div>
            {:else}
              <!-- Formulaire d'inscription complet -->
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <label for="signup-prenom" class="text-sm text-gray-700">Prénom <span class="text-red-500">*</span></label>
                  <input id="signup-prenom" type="text" bind:value={prenom} required class="w-full h-10 px-3 rounded-lg border" placeholder="Ton prénom" />
                </div>
                <div>
                  <label for="signup-nom" class="text-sm text-gray-700">Nom <span class="text-red-500">*</span></label>
                  <input id="signup-nom" type="text" bind:value={nom} required class="w-full h-10 px-3 rounded-lg border" placeholder="Ton nom" />
                </div>
                <div class="md:col-span-2">
                  <label for="signup-pseudo" class="text-sm text-gray-700">Pseudo <span class="text-red-500">*</span></label>
                  <input id="signup-pseudo" type="text" bind:value={pseudo} required class="w-full h-10 px-3 rounded-lg border" placeholder="Choisis un pseudo unique" />
                </div>
                <div>
                  <label for="signup-date" class="text-sm text-gray-700">Date de naissance <span class="text-red-500">*</span></label>
                  <input id="signup-date" type="date" bind:value={dateNaissance} required class="w-full h-10 px-3 rounded-lg border" />
                </div>
                <div>
                  <label for="signup-classe" class="text-sm text-gray-700">Classe <span class="text-red-500">*</span></label>
                  <select id="signup-classe" bind:value={classe} required class="w-full h-10 px-3 rounded-lg border bg-white">
                    <option value="" disabled>Choisis ta classe</option>
                    <optgroup label="Maternelle">
                      <option value="Petite section">Petite section</option>
                      <option value="Moyenne section">Moyenne section</option>
                      <option value="Grande section">Grande section</option>
                    </optgroup>
                    <optgroup label="Primaire">
                      <option value="CP">CP</option>
                      <option value="CE1">CE1</option>
                      <option value="CE2">CE2</option>
                      <option value="CM1">CM1</option>
                      <option value="CM2">CM2</option>
                    </optgroup>
                    <optgroup label="Collège">
                      <option value="6ème">6ème</option>
                      <option value="5ème">5ème</option>
                      <option value="4ème">4ème</option>
                      <option value="3ème">3ème</option>
                    </optgroup>
                    <optgroup label="Lycée">
                      <option value="2nde">2nde</option>
                      <option value="1ère">1ère</option>
                      <option value="Terminale">Terminale</option>
                    </optgroup>
                    <optgroup label="Études supérieures">
                      <option value="Licence 1">Licence 1</option>
                      <option value="Licence 2">Licence 2</option>
                      <option value="Licence 3">Licence 3</option>
                      <option value="Master 1">Master 1</option>
                      <option value="Master 2">Master 2</option>
                      <option value="Doctorat">Doctorat</option>
                      <option value="Autre">Autre</option>
                    </optgroup>
                  </select>
                </div>
              </div>
              <div>
                <button type="submit" disabled={authLoading} class="w-full h-10 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold disabled:opacity-50">
                  {authLoading ? 'Inscription...' : "S'inscrire"}
                </button>
              </div>
              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'login'} class="text-sm text-purple-600 hover:text-purple-800 underline">
                  Déjà inscrit ? Se connecter
                </button>
              </div>
            {/if}
          </form>
        </div>
      </div>
    </div>
  </div>
</main>
{/if}