<script lang="ts">
  import { goto } from '$app/navigation';
  import { Loader2, Lock, Mail, AlertCircle } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    
    if (!email || !password) {
      error = 'Veuillez remplir tous les champs';
      return;
    }

    loading = true;
    error = '';

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Identifiants invalides';
        return;
      }

      // Rediriger vers le dashboard
      goto('/admin');
    } catch (e) {
      error = 'Erreur de connexion au serveur';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Connexion - Administration Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative">
  <!-- Grid background pattern -->
  <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
  
  <div class="w-full max-w-md relative z-10">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/25 mb-4">
        <span class="text-3xl">🧠</span>
      </div>
      <h1 class="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Kweez Admin</h1>
      <p class="text-gray-400 mt-1">Connectez-vous pour accéder au backoffice</p>
    </div>

    <!-- Formulaire -->
    <form onsubmit={handleLogin} class="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 shadow-xl">
      {#if error}
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-sm">{error}</span>
        </div>
      {/if}

      <div class="space-y-5">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Adresse email
          </label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="admin@example.com"
              autocomplete="email"
              class="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        <!-- Mot de passe -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Mot de passe
          </label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>
        </div>
      </div>

      <!-- Bouton de connexion -->
      <button
        type="submit"
        disabled={loading}
        class="w-full mt-8 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-900 font-semibold rounded-lg shadow-lg shadow-amber-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {#if loading}
          <Loader2 class="w-5 h-5 animate-spin" />
          Connexion...
        {:else}
          Se connecter
        {/if}
      </button>
    </form>

    <!-- Lien retour -->
    <p class="text-center text-gray-500 text-sm mt-6">
      <a href="/" class="hover:text-amber-400 transition">← Retour à l'accueil</a>
    </p>
  </div>
</div>
