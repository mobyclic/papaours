<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, FileText } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Conditions Générales d'Utilisation - Papa Ours</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
  <header class="p-4">
    <button onclick={() => goto('/')} class="flex items-center gap-2 text-gray-600 hover:text-gray-800">
      <ChevronLeft class="w-5 h-5" />
      <span>Retour</span>
    </button>
  </header>

  <main class="max-w-3xl mx-auto px-4 pb-12">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-slate-700 rounded-full mb-4 shadow-lg">
        <FileText class="w-8 h-8 text-white" />
      </div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Conditions Générales d'Utilisation</h1>
      <p class="text-gray-500">Dernière mise à jour : Janvier 2026</p>
    </div>

    <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:text-gray-600 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-gray-600 [&_a]:text-blue-600 [&_a:hover]:underline">
      <h2>1. Présentation du service</h2>
      <p>
        Papa Ours est une application éducative gratuite destinée aux enfants de 3 à 11 ans. 
        Elle propose des quiz et exercices ludiques alignés sur les programmes scolaires français.
      </p>

      <h2>2. Acceptation des conditions</h2>
      <p>
        L'utilisation de Papa Ours implique l'acceptation pleine et entière des présentes conditions. 
        Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
      </p>

      <h2>3. Accès au service</h2>
      <p>
        Papa Ours est accessible gratuitement à tout utilisateur disposant d'un accès internet. 
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
        <a href="mailto:privacy@papaours.app">privacy@papaours.app</a>
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
        L'ensemble des contenus présents sur Papa Ours (textes, images, quiz, code source) 
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
        Papa Ours est fourni "tel quel". L'éditeur ne peut être tenu responsable :
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
        Email : <a href="mailto:contact@papaours.app">contact@papaours.app</a>
      </p>

      <h2>11. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. 
        En cas de litige, les tribunaux français seront seuls compétents.
      </p>
    </div>
  </main>
</div>
