<script lang="ts">
  let email = $state("");
  let password = $state("");
  let isLoading = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoading = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Login:", { email, password });
    isLoading = false;
  }
</script>

<svelte:head>
  <title>Kwizy - Connexion</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
  <div class="w-full max-w-md">
    <!-- Logo et titre -->
    <div class="text-center mb-8">
      <div class="inline-block mb-4">
        <svg viewBox="0 0 200 200" class="w-32 h-32 drop-shadow-lg">
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
          <!-- Sourire -->
          <path d="M 85 125 Q 100 140 115 125" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-primary mb-2">Kwizy</h1>
      <p class="text-muted-foreground">Bienvenue sur votre espace</p>
    </div>

    <!-- Card de connexion -->
    <div class="bg-card rounded-xl shadow-2xl border border-border">
      <div class="p-6 space-y-1">
        <h2 class="text-2xl font-semibold text-card-foreground">Connexion</h2>
        <p class="text-sm text-muted-foreground">
          Entrez vos identifiants pour accéder à votre compte
        </p>
      </div>
      
      <div class="p-6 pt-0">
        <form onsubmit={handleLogin} class="space-y-4">
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium text-card-foreground">Email</label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              bind:value={email}
              required
              class="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          
          <div class="space-y-2">
            <label for="password" class="text-sm font-medium text-card-foreground">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
              class="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          
          <div class="flex items-center justify-end">
            <button type="button" class="text-sm text-primary hover:underline">
              Mot de passe oublié ?
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            class="w-full h-10 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
        
        <div class="mt-6 text-center text-sm">
          <span class="text-muted-foreground">Pas encore de compte ?</span>
          <button type="button" class="text-primary hover:underline ml-1 font-medium">
            S'inscrire
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-xs text-muted-foreground">
      <p>Propulsé par Bun • Vite • SvelteKit • SurrealDB • Cloudflare</p>
    </div>
  </div>
</main>
