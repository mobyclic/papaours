<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setAdminUser } from '$lib/stores/adminStore';
  
  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state('');

  onMount(() => {
    // Le layout gère déjà la vérification et redirection si connecté
  });

  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setAdminUser(data.user);
        goto('/admin/dashboard');
      } else {
        error = data.message || 'Erreur de connexion';
      }
    } catch (err) {
      error = 'Erreur de connexion au serveur';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin - Connexion</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
  <div class="w-full max-w-md">
    <!-- Logo Admin -->
    <div class="text-center mb-8">
      <div class="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-white mb-2">Backoffice</h1>
      <p class="text-gray-300">Papa Ours - Administration</p>
    </div>

    <!-- Card de connexion -->
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
      <div class="p-6">
        <h2 class="text-2xl font-semibold text-white mb-6">Connexion Admin</h2>
        
        {#if error}
          <div class="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        {/if}

        <form onsubmit={handleLogin} class="space-y-4">
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium text-gray-200">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              bind:value={email}
              required
              class="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div class="space-y-2">
            <label for="password" class="text-sm font-medium text-gray-200">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
              class="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            class="w-full h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>

    <div class="mt-6 text-center">
      <button
        onclick={() => goto('/')}
        class="text-gray-300 hover:text-white transition-colors"
      >
        ← Retour au site
      </button>
    </div>
  </div>
</main>
