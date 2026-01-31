<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { loadThemeColor, THEME_COLORS, type ThemeColorId } from '$lib/stores/themeStore.svelte';
  import { Eye, EyeOff, ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-svelte';
  
  // Mode: request (demande email) ou reset (nouveau mdp avec token)
  let mode = $state<'request' | 'reset'>('request');
  let token = $state('');
  
  // Champs
  let email = $state('');
  let password = $state('');
  let passwordConfirm = $state('');
  let showPassword = $state(false);
  
  // UI
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);
  let pageThemeColor = $state<ThemeColorId>('gray');

  onMount(() => {
    pageThemeColor = loadThemeColor();
    // Vérifier si un token est dans l'URL
    const urlToken = $page.url.searchParams.get('token');
    if (urlToken) {
      token = urlToken;
      mode = 'reset';
    }
  });

  function getThemeClasses() {
    return THEME_COLORS.find(c => c.id === pageThemeColor) || THEME_COLORS[0];
  }
  
  function validatePassword(pwd: string): { valid: boolean; message: string } {
    if (pwd.length < 8) return { valid: false, message: 'Au moins 8 caractères' };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: 'Au moins une majuscule' };
    if (!/[a-z]/.test(pwd)) return { valid: false, message: 'Au moins une minuscule' };
    if (!/[0-9]/.test(pwd)) return { valid: false, message: 'Au moins un chiffre' };
    return { valid: true, message: '' };
  }

  async function handleRequest(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        error = data.message || 'Erreur';
        return;
      }
      
      success = true;
    } catch (err) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }

  async function handleReset(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    // Validation
    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      error = pwdValidation.message;
      loading = false;
      return;
    }
    
    if (password !== passwordConfirm) {
      error = 'Les mots de passe ne correspondent pas';
      loading = false;
      return;
    }
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        error = data.message || 'Erreur';
        return;
      }
      
      success = true;
      
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        goto('/?userType=tuteur');
      }, 3000);
      
    } catch (err) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Réinitialiser mon mot de passe - Kwizy</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6 space-y-5">
        <!-- Header -->
        <div class="text-center">
          <div class="inline-block mb-3">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center {getThemeClasses().bg}">
              {#if mode === 'request'}
                <Mail class="w-7 h-7 text-white" />
              {:else}
                <KeyRound class="w-7 h-7 text-white" />
              {/if}
            </div>
          </div>
          <h1 class="text-xl font-bold text-gray-900">
            {#if success && mode === 'request'}
              Email envoyé !
            {:else if success && mode === 'reset'}
              Mot de passe modifié !
            {:else if mode === 'request'}
              Mot de passe oublié ?
            {:else}
              Nouveau mot de passe
            {/if}
          </h1>
          <p class="text-gray-500 text-sm mt-1">
            {#if success && mode === 'request'}
              Vérifiez votre boîte mail
            {:else if success && mode === 'reset'}
              Redirection vers la connexion...
            {:else if mode === 'request'}
              Entrez votre email de tuteur
            {:else}
              Choisissez un nouveau mot de passe
            {/if}
          </p>
        </div>

        {#if error}
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        {/if}

        {#if success}
          <!-- Succès -->
          <div class="text-center py-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle class="w-8 h-8 text-green-600" />
            </div>
            {#if mode === 'request'}
              <p class="text-gray-600">
                Si un compte tuteur existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.
              </p>
              <p class="text-sm text-gray-500 mt-2">
                Pensez à vérifier vos spams.
              </p>
            {:else}
              <p class="text-gray-600">
                Votre mot de passe a été modifié avec succès !
              </p>
              <p class="text-sm text-gray-500 mt-2">
                Vous allez être redirigé vers la page de connexion...
              </p>
            {/if}
          </div>
        {:else if mode === 'request'}
          <!-- Formulaire demande de reset -->
          <form onsubmit={handleRequest} class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Votre email de tuteur</label>
              <input 
                id="email" 
                type="email" 
                bind:value={email} 
                required 
                class="w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 {getThemeClasses().ring}" 
                placeholder="votre@email.com" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              class="w-full h-10 rounded-lg text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-colors {getThemeClasses().bg}"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </form>
        {:else}
          <!-- Formulaire nouveau mot de passe -->
          <form onsubmit={handleReset} class="space-y-4">
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <div class="relative">
                <input 
                  id="password" 
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
              <p class="text-xs text-gray-500 mt-1">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
            </div>
            
            <div>
              <label for="password-confirm" class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input 
                id="password-confirm" 
                type={showPassword ? 'text' : 'password'}
                bind:value={passwordConfirm} 
                required 
                class="w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 {getThemeClasses().ring}" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              class="w-full h-10 rounded-lg text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-colors {getThemeClasses().bg}"
            >
              {loading ? 'Modification...' : 'Changer mon mot de passe'}
            </button>
          </form>
        {/if}

        <!-- Retour -->
        <div class="text-center pt-2">
          <a href="/" class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft class="w-4 h-4" />
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  </div>
</main>
