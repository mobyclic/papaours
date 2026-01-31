<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setUser, loadUser, currentUser } from '$lib/stores/userStore.svelte';
  import { setAdminUser } from '$lib/stores/adminStore.svelte';
  import { loadThemeColor, setThemeColor, THEME_COLORS, type ThemeColorId } from '$lib/stores/themeStore.svelte';
  import ColorPicker from '$lib/components/ColorPicker.svelte';
  import { Eye, EyeOff } from 'lucide-svelte';
  
  // Modes: login-apprenant, login-tuteur, signup-apprenant, signup-tuteur
  let mode = $state<'login' | 'signup'>('login');
  let userType = $state<'apprenant' | 'tuteur'>('apprenant');
  
  // Champs communs
  let pseudo = $state('');
  let nom = $state('');
  let prenom = $state('');
  let themeColorValue = $state<ThemeColorId>('blue');
  
  // Champs apprenant
  let passwordCode = $state(''); // Code à 4 chiffres
  let dateNaissance = $state('');
  let classe = $state('');
  
  // Champs tuteur
  let email = $state('');
  let password = $state('');
  let passwordConfirm = $state('');
  let showPassword = $state(false);
  
  // UI State
  let authLoading = $state(false);
  let authError = $state('');
  let checkingAuth = $state(true);
  let pageThemeColor = $state<ThemeColorId>('gray');

  const classes = [
    'Petite section', 'Moyenne section', 'Grande section',
    'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    '2nde', '1ère', 'Terminale',
    'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat', 'Autre'
  ];

  onMount(() => {
    pageThemeColor = loadThemeColor();
    loadUser();
    setTimeout(() => {
      if ($currentUser) {
        goto('/dashboard');
      } else {
        checkingAuth = false;
      }
    }, 100);
  });

  function getThemeClasses() {
    return THEME_COLORS.find(c => c.id === pageThemeColor) || THEME_COLORS[0];
  }
  
  function validatePasswordCode(code: string): boolean {
    return /^\d{4}$/.test(code);
  }
  
  function validatePassword(pwd: string): { valid: boolean; message: string } {
    if (pwd.length < 8) return { valid: false, message: 'Au moins 8 caractères' };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: 'Au moins une majuscule' };
    if (!/[a-z]/.test(pwd)) return { valid: false, message: 'Au moins une minuscule' };
    if (!/[0-9]/.test(pwd)) return { valid: false, message: 'Au moins un chiffre' };
    return { valid: true, message: '' };
  }
  
  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function submitAuth(e: Event) {
    e.preventDefault();
    authLoading = true;
    authError = '';
    
    try {
      // Validation selon le type d'utilisateur
      if (mode === 'signup') {
        if (userType === 'apprenant') {
          if (!validatePasswordCode(passwordCode)) {
            authError = 'Le code doit être exactement 4 chiffres';
            authLoading = false;
            return;
          }
        } else {
          // Tuteur
          if (!validateEmail(email)) {
            authError = 'Email invalide';
            authLoading = false;
            return;
          }
          const pwdValidation = validatePassword(password);
          if (!pwdValidation.valid) {
            authError = pwdValidation.message;
            authLoading = false;
            return;
          }
          if (password !== passwordConfirm) {
            authError = 'Les mots de passe ne correspondent pas';
            authLoading = false;
            return;
          }
        }
      }
      
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      
      let body: any;
      if (mode === 'login') {
        body = userType === 'apprenant' 
          ? { pseudo, password_code: passwordCode, user_type: 'apprenant' }
          : { email, password, user_type: 'tuteur' };
      } else {
        body = userType === 'apprenant'
          ? { 
              pseudo, 
              password_code: passwordCode, 
              user_type: 'apprenant',
              name: `${prenom} ${nom}`, 
              nom, 
              prenom, 
              dateNaissance, 
              classe, 
              theme_color: themeColorValue 
            }
          : { 
              email,
              password,
              user_type: 'tuteur',
              name: `${prenom} ${nom}`,
              nom,
              prenom,
              theme_color: themeColorValue
            };
      }
      
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
      
      if (data.user?.theme_color) {
        setThemeColor(data.user.theme_color as ThemeColorId);
      } else if (mode === 'signup') {
        setThemeColor(themeColorValue);
      }
      
      if (data.user?.is_admin) {
        setAdminUser({ id: data.user.id, email: data.user.email, name: data.user.name, role: 'admin' });
      }
      
      goto('/dashboard');
    } catch (err) {
      console.error(err);
      authError = 'Erreur de connexion au serveur';
    } finally {
      authLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Kwizy - Connexion</title>
</svelte:head>

{#if checkingAuth}
  <main class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-pulse text-4xl mb-4 font-bold {getThemeClasses().text}">K</div>
      <p class="text-lg text-gray-600 font-medium">Chargement...</p>
    </div>
  </main>
{:else}
  <main class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6 space-y-5">
          <!-- Logo -->
          <div class="text-center">
            <div class="inline-block mb-3">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center {getThemeClasses().bg}">
                <span class="text-2xl font-black text-white">K</span>
              </div>
            </div>
            <h1 class="text-xl font-bold text-gray-900">Kwizy</h1>
            <p class="text-gray-500 text-sm">Apprendre en s'amusant</p>
          </div>

          <!-- Sélecteur de type d'utilisateur -->
          <div class="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onclick={() => userType = 'apprenant'}
              class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all {userType === 'apprenant' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
            >
              🎓 Apprenant
            </button>
            <button
              type="button"
              onclick={() => userType = 'tuteur'}
              class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all {userType === 'tuteur' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
            >
              👨‍🏫 Tuteur
            </button>
          </div>

          {#if authError}
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{authError}</div>
          {/if}

          <form onsubmit={submitAuth} class="space-y-4">
            {#if mode === 'login'}
              <!-- CONNEXION -->
              {#if userType === 'apprenant'}
                <!-- Connexion Apprenant -->
                <div>
                  <label for="login-pseudo" class="block text-sm font-medium text-gray-700 mb-1">Ton pseudo</label>
                  <input 
                    id="login-pseudo" 
                    type="text" 
                    bind:value={pseudo} 
                    required 
                    class="w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 {getThemeClasses().ring}" 
                    placeholder="Entre ton pseudo..." 
                  />
                </div>
                <div>
                  <label for="login-code" class="block text-sm font-medium text-gray-700 mb-1">Ton code secret (4 chiffres)</label>
                  <input 
                    id="login-code" 
                    type="password" 
                    inputmode="numeric"
                    maxlength="4"
                    bind:value={passwordCode} 
                    required 
                    class="w-full h-10 px-3 rounded-lg border text-center text-2xl tracking-widest focus:outline-none focus:ring-2 {getThemeClasses().ring}" 
                    placeholder="••••" 
                  />
                </div>
              {:else}
                <!-- Connexion Tuteur -->
                <div>
                  <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    id="login-email" 
                    type="email" 
                    bind:value={email} 
                    required 
                    class="w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 {getThemeClasses().ring}" 
                    placeholder="votre@email.com" 
                  />
                </div>
                <div>
                  <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <div class="relative">
                    <input 
                      id="login-password" 
                      type={showPassword ? 'text' : 'password'}
                      bind:value={password} 
                      required 
                      class="w-full h-10 px-3 pr-10 rounded-lg border focus:outline-none focus:ring-2 {getThemeClasses().ring}" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onclick={() => showPassword = !showPassword}
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {#if showPassword}
                        <EyeOff class="w-4 h-4" />
                      {:else}
                        <Eye class="w-4 h-4" />
                      {/if}
                    </button>
                  </div>
                  <div class="text-right mt-1">
                    <a href="/reset-password" class="text-xs text-gray-500 hover:text-gray-700 underline">
                      Mot de passe oublié ?
                    </a>
                  </div>
                </div>
              {/if}

              <button 
                type="submit" 
                disabled={authLoading} 
                class="w-full h-10 rounded-lg text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-colors {getThemeClasses().bg}"
              >
                {authLoading ? 'Connexion...' : 'Se connecter'}
              </button>

              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'signup'} class="text-sm text-gray-600 hover:text-gray-900 underline">
                  Pas encore inscrit ? S'inscrire
                </button>
              </div>

            {:else}
              <!-- INSCRIPTION -->
              <div class="grid gap-3 grid-cols-2">
                <div>
                  <label for="signup-prenom" class="block text-sm font-medium text-gray-700 mb-1">Prénom <span class="text-red-500">*</span></label>
                  <input id="signup-prenom" type="text" bind:value={prenom} required class="w-full h-10 px-3 rounded-lg border" placeholder="Prénom" />
                </div>
                <div>
                  <label for="signup-nom" class="block text-sm font-medium text-gray-700 mb-1">Nom <span class="text-red-500">*</span></label>
                  <input id="signup-nom" type="text" bind:value={nom} required class="w-full h-10 px-3 rounded-lg border" placeholder="Nom" />
                </div>
              </div>

              {#if userType === 'apprenant'}
                <!-- Inscription Apprenant -->
                <div>
                  <label for="signup-pseudo" class="block text-sm font-medium text-gray-700 mb-1">Pseudo <span class="text-red-500">*</span></label>
                  <input id="signup-pseudo" type="text" bind:value={pseudo} required class="w-full h-10 px-3 rounded-lg border" placeholder="Choisis un pseudo unique" />
                </div>
                
                <div>
                  <label for="signup-code" class="block text-sm font-medium text-gray-700 mb-1">Code secret (4 chiffres) <span class="text-red-500">*</span></label>
                  <input 
                    id="signup-code" 
                    type="password" 
                    inputmode="numeric"
                    maxlength="4"
                    bind:value={passwordCode} 
                    required 
                    class="w-full h-10 px-3 rounded-lg border text-center text-2xl tracking-widest" 
                    placeholder="••••" 
                  />
                  <p class="text-xs text-gray-500 mt-1">Choisis 4 chiffres faciles à retenir</p>
                </div>

                <div class="grid gap-3 grid-cols-2">
                  <div>
                    <label for="signup-date" class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    <input id="signup-date" type="date" bind:value={dateNaissance} class="w-full h-10 px-3 rounded-lg border" />
                  </div>
                  <div>
                    <label for="signup-classe" class="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                    <select id="signup-classe" bind:value={classe} class="w-full h-10 px-3 rounded-lg border bg-white">
                      <option value="">Choisis...</option>
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

              {:else}
                <!-- Inscription Tuteur -->
                <div>
                  <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
                  <input id="signup-email" type="email" bind:value={email} required class="w-full h-10 px-3 rounded-lg border" placeholder="votre@email.com" />
                </div>
                
                <div>
                  <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input 
                      id="signup-password" 
                      type={showPassword ? 'text' : 'password'}
                      bind:value={password} 
                      required 
                      class="w-full h-10 px-3 pr-10 rounded-lg border" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onclick={() => showPassword = !showPassword}
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {#if showPassword}
                        <EyeOff class="w-4 h-4" />
                      {:else}
                        <Eye class="w-4 h-4" />
                      {/if}
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
                </div>
                
                <div>
                  <label for="signup-password-confirm" class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe <span class="text-red-500">*</span></label>
                  <input 
                    id="signup-password-confirm" 
                    type={showPassword ? 'text' : 'password'}
                    bind:value={passwordConfirm} 
                    required 
                    class="w-full h-10 px-3 rounded-lg border" 
                    placeholder="••••••••" 
                  />
                </div>
              {/if}

              <!-- Sélecteur de couleur -->
              <div>
                <ColorPicker bind:value={themeColorValue} label="Ta couleur préférée 🎨" size="md" />
              </div>

              <button 
                type="submit" 
                disabled={authLoading} 
                class="w-full h-10 rounded-lg text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-colors"
                style="background-color: {THEME_COLORS.find(c => c.id === themeColorValue)?.preview}"
              >
                {authLoading ? 'Inscription...' : "S'inscrire"}
              </button>

              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'login'} class="text-sm text-gray-600 hover:text-gray-900 underline">
                  Déjà inscrit ? Se connecter
                </button>
              </div>
            {/if}
          </form>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <div class="flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href="/about" class="text-gray-500 hover:text-gray-900 transition-colors">À propos</a>
          <span class="text-gray-300">•</span>
          <a href="/faq" class="text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
          <span class="text-gray-300">•</span>
          <a href="/cgu" class="text-gray-500 hover:text-gray-900 transition-colors">CGU</a>
          <span class="text-gray-300">•</span>
          <a href="/donate" class="text-gray-700 hover:text-gray-900 font-medium transition-colors">❤️ Soutenir</a>
        </div>
      </div>
    </div>
  </main>
{/if}
