<script lang="ts">
  import Card from "$lib/components/ui/card/card.svelte";
  import CardContent from "$lib/components/ui/card/card-content.svelte";
  import CardDescription from "$lib/components/ui/card/card-description.svelte";
  import CardHeader from "$lib/components/ui/card/card-header.svelte";
  import CardTitle from "$lib/components/ui/card/card-title.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import Logo from "$lib/components/logo.svelte";

  let email = $state("");
  let password = $state("");
  let isLoading = $state(false);

  async function handleLogin() {
    isLoading = true;
    // Simuler une connexion
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Login attempt:", { email, password });
    isLoading = false;
  }
</script>

<main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="inline-block">
        <Logo class="w-32 h-32 mx-auto mb-4 drop-shadow-lg" />
      </div>
      <h1 class="text-4xl font-bold text-primary mb-2">Papa Ours</h1>
      <p class="text-muted-foreground">Bienvenue sur votre espace</p>
    </div>

    <Card class="shadow-2xl">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              bind:value={email}
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
            />
          </div>
          <div class="flex items-center justify-between text-sm">
            <button type="button" class="text-primary hover:underline">
              Mot de passe oublié ?
            </button>
          </div>
          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        
        <div class="mt-6 text-center text-sm">
          <span class="text-muted-foreground">Pas encore de compte ?</span>
          <button type="button" class="text-primary hover:underline ml-1 font-medium">
            S'inscrire
          </button>
        </div>
      </CardContent>
    </Card>

    <div class="mt-8 text-center text-xs text-muted-foreground">
      <p>Propulsé par Bun • Vite • Svelte • SurrealDB • Cloudflare</p>
    </div>
  </div>
</main>
