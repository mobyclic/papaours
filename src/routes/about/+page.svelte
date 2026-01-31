<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, Heart, Users, BookOpen, Shield } from 'lucide-svelte';
</script>

<svelte:head>
  <title>À propos - Papa Ours</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
  <header class="p-4">
    <button onclick={() => goto('/')} class="flex items-center gap-2 text-gray-600 hover:text-gray-800">
      <ChevronLeft class="w-5 h-5" />
      <span>Retour</span>
    </button>
  </header>

  <main class="max-w-2xl mx-auto px-4 pb-12">
    <!-- Hero -->
    <div class="text-center mb-10">
      <div class="text-6xl mb-4">🐻</div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">À propos de Papa Ours</h1>
      <p class="text-gray-600">L'apprentissage ludique pour tous les enfants</p>
    </div>

    <!-- Mission -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Heart class="w-5 h-5 text-red-500" />
        Notre mission
      </h2>
      <p class="text-gray-600 leading-relaxed">
        Papa Ours est né d'une idée simple : <strong>rendre l'apprentissage amusant et accessible à tous les enfants</strong>. 
        Nous croyons que chaque enfant mérite des outils éducatifs de qualité, sans barrière financière.
      </p>
      <p class="text-gray-600 leading-relaxed mt-3">
        C'est pourquoi Papa Ours est et restera <strong>100% gratuit</strong>, sans publicité ni contenu payant caché. 
        Notre financement repose uniquement sur la générosité de notre communauté.
      </p>
    </div>

    <!-- Valeurs -->
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
          <BookOpen class="w-5 h-5 text-blue-600" />
        </div>
        <h3 class="font-bold text-gray-800 mb-2">Pédagogie</h3>
        <p class="text-sm text-gray-600">
          Contenus créés par des enseignants, alignés sur les programmes officiels de l'Éducation nationale.
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
          <Users class="w-5 h-5 text-green-600" />
        </div>
        <h3 class="font-bold text-gray-800 mb-2">Accessibilité</h3>
        <p class="text-sm text-gray-600">
          Interface adaptée aux enfants, simple à utiliser, disponible sur tous les appareils.
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
          <Shield class="w-5 h-5 text-purple-600" />
        </div>
        <h3 class="font-bold text-gray-800 mb-2">Respect</h3>
        <p class="text-sm text-gray-600">
          Aucune publicité, aucun tracking invasif. Les données de vos enfants sont protégées.
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
          <Heart class="w-5 h-5 text-amber-600" />
        </div>
        <h3 class="font-bold text-gray-800 mb-2">Passion</h3>
        <p class="text-sm text-gray-600">
          Projet développé avec amour par des parents et passionnés d'éducation.
        </p>
      </div>
    </div>

    <!-- L'équipe -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">L'équipe</h2>
      <p class="text-gray-600 leading-relaxed">
        Papa Ours a été créé par <strong>Alistair</strong>, développeur et papa, 
        avec l'aide précieuse de contributeurs bénévoles : enseignants, designers et autres parents motivés.
      </p>
      <p class="text-gray-600 leading-relaxed mt-3">
        Vous souhaitez rejoindre l'aventure ? Contactez-nous !
      </p>
    </div>

    <!-- CTA -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a 
        href="/donate"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl hover:from-pink-600 hover:to-red-600 transition-all font-medium shadow-lg"
      >
        <Heart class="w-5 h-5" />
        Soutenir Papa Ours
      </a>
      <a 
        href="mailto:contact@papaours.app"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm border"
      >
        Nous contacter
      </a>
    </div>
  </main>
</div>
