<script lang="ts">
  import { goto } from '$app/navigation';
  import { FileText, ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Conditions Générales d'Utilisation - Kweez</title>
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
        <button onclick={() => goto('/')} class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft class="w-5 h-5" />
          <span>Retour</span>
        </button>
      </div>
    </div>
  </header>

  <main class="relative z-10 max-w-3xl mx-auto px-4 py-12">
    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl mb-4 shadow-lg shadow-amber-500/20">
        <FileText class="w-7 h-7 text-gray-900" />
      </div>
      <h1 class="text-3xl font-bold mb-2">Conditions Générales d'Utilisation</h1>
      <p class="text-gray-400">Dernière mise à jour : Janvier 2026</p>
    </div>

    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 md:p-8 max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:text-gray-300 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-gray-300 [&_a]:text-amber-400 [&_a]:underline [&_a:hover]:text-amber-300">
      <h2>1. Présentation du service</h2>
      <p>
        Kweez est une application éducative gratuite proposant des quiz et exercices ludiques 
        pour tous les âges et niveaux.
      </p>

      <h2>2. Acceptation des conditions</h2>
      <p>
        L'utilisation de Kweez implique l'acceptation pleine et entière des présentes conditions. 
        Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
      </p>

      <h2>3. Accès au service</h2>
      <p>
        Kweez est accessible gratuitement à tout utilisateur disposant d'un accès internet. 
        L'éditeur se réserve le droit de suspendre ou interrompre le service pour maintenance 
        ou amélioration, sans préavis ni indemnité.
      </p>

      <h2>4. Compte utilisateur</h2>
      <p>
        La création d'un compte est facultative mais permet de sauvegarder la progression. 
        Les parents ou tuteurs légaux sont responsables de l'utilisation du compte par leurs enfants.
      </p>
      <ul>
        <li>Le prénom de l'enfant est utilisé pour personnaliser l'expérience</li>
        <li>L'email parental (optionnel) permet la récupération du compte</li>
        <li>Aucune donnée n'est partagée avec des tiers</li>
      </ul>

      <h2>5. Protection des données personnelles</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression 
        de vos données. Pour exercer ces droits, contactez-nous à : 
        <a href="mailto:privacy@kweez.fr">privacy@kweez.fr</a>
      </p>
      <p>Données collectées :</p>
      <ul>
        <li>Prénom de l'enfant (pour la personnalisation)</li>
        <li>Niveau scolaire (pour adapter les contenus)</li>
        <li>Progression et scores (pour le suivi pédagogique)</li>
        <li>Email parental (optionnel, pour la récupération de compte)</li>
      </ul>
      <p>Données NON collectées :</p>
      <ul>
        <li>Aucune donnée de localisation</li>
        <li>Aucun cookie publicitaire</li>
        <li>Aucune donnée revendue à des tiers</li>
      </ul>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur Kweez (textes, images, quiz, code source) 
        sont la propriété exclusive de l'éditeur ou de ses partenaires. Toute reproduction 
        non autorisée est interdite.
      </p>

      <h2>7. Dons et paiements</h2>
      <p>
        Les dons effectués via Stripe sont volontaires et non remboursables. 
        Ils ne donnent accès à aucun contenu premium (tout est déjà gratuit !). 
        Un reçu est envoyé par email pour chaque don.
      </p>

      <h2>8. Limitation de responsabilité</h2>
      <p>
        Kweez est fourni "tel quel". L'éditeur ne peut être tenu responsable :
      </p>
      <ul>
        <li>Des interruptions temporaires du service</li>
        <li>Des erreurs éventuelles dans les contenus pédagogiques</li>
        <li>De l'utilisation faite par les utilisateurs</li>
      </ul>

      <h2>9. Modification des CGU</h2>
      <p>
        L'éditeur se réserve le droit de modifier les présentes conditions à tout moment. 
        Les utilisateurs seront informés des modifications importantes.
      </p>

      <h2>10. Contact</h2>
      <p>
        Pour toute question concernant ces conditions :<br>
        Email : <a href="mailto:contact@kweez.fr">contact@kweez.fr</a>
      </p>

      <h2>11. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. 
        En cas de litige, les tribunaux français seront seuls compétents.
      </p>
    </div>
  </main>
</div>
