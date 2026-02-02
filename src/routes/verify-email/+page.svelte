<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-svelte';
  
  let status = $state<'loading' | 'success' | 'error'>('loading');
  let message = $state('');
  let countdown = $state(5);

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    
    if (!token) {
      status = 'error';
      message = 'Token de vérification manquant';
      return;
    }
    
    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      
      if (data.success) {
        status = 'success';
        message = data.message || 'Email vérifié avec succès !';
        
        // Countdown et redirection automatique
        const timer = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(timer);
            goto('/');
          }
        }, 1000);
      } else {
        status = 'error';
        message = data.message || 'Erreur lors de la vérification';
      }
    } catch (e) {
      status = 'error';
      message = 'Erreur de connexion au serveur';
    }
  });
</script>

<svelte:head>
  <title>Vérification de l'email - Kweez</title>
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
      <div class="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden p-8">
        {#if status === 'loading'}
          <!-- Loading -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-6">
              <Loader2 class="w-8 h-8 text-amber-400 animate-spin" />
            </div>
            <h1 class="text-xl font-bold mb-2">Vérification en cours...</h1>
            <p class="text-gray-400">Merci de patienter</p>
          </div>
        {:else if status === 'success'}
          <!-- Success -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <CheckCircle class="w-8 h-8 text-green-400" />
            </div>
            <h1 class="text-xl font-bold mb-2">Email vérifié ! 🎉</h1>
            <p class="text-gray-400 mb-6">{message}</p>
            
            <div class="space-y-4">
              <p class="text-sm text-gray-500">
                Redirection automatique dans <span class="text-amber-400 font-bold">{countdown}</span> secondes...
              </p>
              
              <button 
                onclick={() => goto('/')}
                class="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold transition-colors"
              >
                Se connecter
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        {:else}
          <!-- Error -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <XCircle class="w-8 h-8 text-red-400" />
            </div>
            <h1 class="text-xl font-bold mb-2">Erreur de vérification</h1>
            <p class="text-gray-400 mb-6">{message}</p>
            
            <div class="space-y-3">
              <button 
                onclick={() => goto('/')}
                class="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold transition-colors"
              >
                Retour à l'accueil
              </button>
              
              <p class="text-sm text-gray-500">
                Si le problème persiste, essayez de vous réinscrire ou contactez le support.
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>
