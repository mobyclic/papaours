<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Loader2, User, Mail, Lock, Check, AlertCircle } from "lucide-svelte";
  import { adminUser, loadAdminUser } from "$lib/stores/adminStore.svelte";

  let email = $state($adminUser?.email || '');
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  
  let savingEmail = $state(false);
  let savingPassword = $state(false);
  let emailSuccess = $state('');
  let emailError = $state('');
  let passwordSuccess = $state('');
  let passwordError = $state('');

  // Synchroniser email avec adminUser
  $effect(() => {
    if ($adminUser?.email) {
      email = $adminUser.email;
    }
  });

  async function handleEmailUpdate(e: Event) {
    e.preventDefault();
    
    if (!email.trim()) {
      emailError = 'L\'email est requis';
      return;
    }

    savingEmail = true;
    emailError = '';
    emailSuccess = '';

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        emailError = data.error || 'Erreur lors de la mise à jour';
        return;
      }

      emailSuccess = 'Email mis à jour avec succès';
      loadAdminUser(); // Recharger les données utilisateur
    } catch (e) {
      emailError = 'Erreur de connexion au serveur';
    } finally {
      savingEmail = false;
    }
  }

  async function handlePasswordUpdate(e: Event) {
    e.preventDefault();
    
    if (!currentPassword) {
      passwordError = 'Le mot de passe actuel est requis';
      return;
    }
    
    if (!newPassword) {
      passwordError = 'Le nouveau mot de passe est requis';
      return;
    }
    
    if (newPassword.length < 6) {
      passwordError = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordError = 'Les mots de passe ne correspondent pas';
      return;
    }

    savingPassword = true;
    passwordError = '';
    passwordSuccess = '';

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        passwordError = data.error || 'Erreur lors de la mise à jour';
        return;
      }

      passwordSuccess = 'Mot de passe mis à jour avec succès';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (e) {
      passwordError = 'Erreur de connexion au serveur';
    } finally {
      savingPassword = false;
    }
  }
</script>

<svelte:head>
  <title>Mon profil - Administration Kweez</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Mon profil</h1>
    <p class="text-gray-400 mt-1">Gérez vos informations de connexion</p>
  </div>

  <div class="max-w-2xl space-y-8">
    <!-- Section Email -->
    <div class="bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-blue-900 bg-opacity-50 flex items-center justify-center">
          <Mail class="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-white">Adresse email</h2>
          <p class="text-sm text-gray-400">Modifiez votre adresse email de connexion</p>
        </div>
      </div>

      <form onsubmit={handleEmailUpdate} class="space-y-4">
        {#if emailError}
          <div class="p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {emailError}
          </div>
        {/if}
        
        {#if emailSuccess}
          <div class="p-3 bg-green-900 bg-opacity-30 border border-green-800 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <Check class="w-4 h-4 shrink-0" />
            {emailSuccess}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-gray-300">Email</label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="admin@example.com"
            class="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500"
          />
        </div>

        <Button 
          type="submit" 
          disabled={savingEmail}
          class="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-900 font-semibold"
        >
          {#if savingEmail}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          {:else}
            Mettre à jour l'email
          {/if}
        </Button>
      </form>
    </div>

    <!-- Section Mot de passe -->
    <div class="bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-purple-900 bg-opacity-50 flex items-center justify-center">
          <Lock class="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-white">Mot de passe</h2>
          <p class="text-sm text-gray-400">Modifiez votre mot de passe de connexion</p>
        </div>
      </div>

      <form onsubmit={handlePasswordUpdate} class="space-y-4">
        {#if passwordError}
          <div class="p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {passwordError}
          </div>
        {/if}
        
        {#if passwordSuccess}
          <div class="p-3 bg-green-900 bg-opacity-30 border border-green-800 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <Check class="w-4 h-4 shrink-0" />
            {passwordSuccess}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="currentPassword" class="text-sm font-medium text-gray-300">Mot de passe actuel</label>
          <Input
            id="currentPassword"
            type="password"
            bind:value={currentPassword}
            placeholder="••••••••"
            class="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500"
          />
        </div>

        <div class="space-y-2">
          <label for="newPassword" class="text-sm font-medium text-gray-300">Nouveau mot de passe</label>
          <Input
            id="newPassword"
            type="password"
            bind:value={newPassword}
            placeholder="••••••••"
            class="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500"
          />
        </div>

        <div class="space-y-2">
          <label for="confirmPassword" class="text-sm font-medium text-gray-300">Confirmer le mot de passe</label>
          <Input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            placeholder="••••••••"
            class="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500"
          />
        </div>

        <Button 
          type="submit" 
          disabled={savingPassword}
          class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold"
        >
          {#if savingPassword}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          {:else}
            Changer le mot de passe
          {/if}
        </Button>
      </form>
    </div>
  </div>
</div>
