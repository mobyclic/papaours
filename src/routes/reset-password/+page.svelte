<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
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

  onMount(() => {
    // Vérifier si un token est dans l'URL
    const urlToken = $page.url.searchParams.get('token');
    if (urlToken) {
      token = urlToken;
      mode = 'reset';
    }
  });
  
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
        goto('/');
      }, 3000);
      
    } catch (err) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Réinitialiser mon mot de passe - Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <!-- Grid Background -->
  <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
  
  <!-- Header -->
  <header class="relative z-10 border-b border-gray-800/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="/" class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span class="text-lg font-black text-gray-900">K</span>
          </div>
          <span class="text-xl font-bold">Kweez</span>
        </a>
      </div>
    </div>
  </header>

  <main class="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
    <div class="w-full max-w-md">
      <div class="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        <div class="p-6 space-y-5">
          <!-- Header -->
          <div class="text-center">
            <div class="inline-block mb-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                {#if mode === 'request'}
                  <Mail class="w-7 h-7 text-gray-900" />
                {:else}
                  <KeyRound class="w-7 h-7 text-gray-900" />
                {/if}
              </div>
            </div>
            <h1 class="text-xl font-bold">
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
            <p class="text-gray-400 text-sm mt-1">
              {#if success && mode === 'request'}
                Vérifiez votre boîte mail
              {:else if success && mode === 'reset'}
                Redirection vers la connexion...
              {:else if mode === 'request'}
                Entrez votre email
              {:else}
                Choisissez un nouveau mot de passe
              {/if}
            </p>
          </div>

          {#if error}
            <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          {/if}

          {#if success}
            <!-- Succès -->
            <div class="text-center py-6">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle class="w-8 h-8 text-green-400" />
              </div>
              {#if mode === 'request'}
                <p class="text-gray-300">
                  Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
                <p class="text-sm text-gray-500 mt-2">
                  Pensez à vérifier vos spams.
                </p>
              {:else}
                <p class="text-gray-300">
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
                <label for="email" class="block text-sm font-medium text-gray-300 mb-1">Votre email</label>
                <input 
                  id="email" 
                  type="email" 
                  bind:value={email} 
                  required 
                  class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                  placeholder="votre@email.com" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                class="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>
          {:else}
            <!-- Formulaire nouveau mot de passe -->
            <form onsubmit={handleReset} class="space-y-4">
              <div>
                <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Nouveau mot de passe</label>
                <div class="relative">
                  <input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'}
                    bind:value={password} 
                    required 
                    class="w-full h-11 px-4 pr-11 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onclick={() => showPassword = !showPassword}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {#if showPassword}
                      <EyeOff class="w-5 h-5" />
                    {:else}
                      <Eye class="w-5 h-5" />
                    {/if}
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
              </div>
              
              <div>
                <label for="password-confirm" class="block text-sm font-medium text-gray-300 mb-1">Confirmer le mot de passe</label>
                <input 
                  id="password-confirm" 
                  type={showPassword ? 'text' : 'password'}
                  bind:value={passwordConfirm} 
                  required 
                  class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                class="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Modification...' : 'Changer mon mot de passe'}
              </button>
            </form>
          {/if}

          <!-- Retour -->
          <div class="text-center pt-2">
            <a href="/" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft class="w-4 h-4" />
              Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
