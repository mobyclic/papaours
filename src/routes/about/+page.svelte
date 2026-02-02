<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, Heart, Users, BookOpen, Shield, ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
  <title>À propos - Kweez</title>
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

  <main class="relative z-10 max-w-2xl mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
        <span class="text-3xl font-black text-gray-900">K</span>
      </div>
      <h1 class="text-3xl font-bold mb-2">À propos de Kweez</h1>
      <p class="text-gray-400">Apprendre en s'amusant, pour tous</p>
    </div>

    <!-- Mission -->
    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <Heart class="w-5 h-5 text-amber-400" />
        Notre mission
      </h2>
      <p class="text-gray-300 leading-relaxed">
        Kweez est né d'une idée simple : <strong class="text-white">rendre l'apprentissage amusant et accessible à tous</strong>. 
        Que vous soyez étudiant, professionnel ou simplement curieux, nos quiz s'adaptent à votre niveau.
      </p>
      <p class="text-gray-300 leading-relaxed mt-3">
        C'est pourquoi Kweez est et restera <strong class="text-white">100% gratuit</strong>, sans publicité ni contenu payant caché. 
        Notre financement repose uniquement sur la générosité de notre communauté.
      </p>
    </div>

    <!-- Valeurs -->
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
          <BookOpen class="w-5 h-5 text-amber-400" />
        </div>
        <h3 class="font-bold mb-2">Qualité</h3>
        <p class="text-sm text-gray-400">
          Contenus créés avec soin, vérifiés et actualisés régulièrement par notre équipe.
        </p>
      </div>

      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
          <Users class="w-5 h-5 text-amber-400" />
        </div>
        <h3 class="font-bold mb-2">Accessibilité</h3>
        <p class="text-sm text-gray-400">
          Interface intuitive, disponible sur tous les appareils, adaptée à tous les âges.
        </p>
      </div>

      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
          <Shield class="w-5 h-5 text-amber-400" />
        </div>
        <h3 class="font-bold mb-2">Respect</h3>
        <p class="text-sm text-gray-400">
          Aucune publicité, aucun tracking invasif. Vos données sont protégées.
        </p>
      </div>

      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
          <Heart class="w-5 h-5 text-amber-400" />
        </div>
        <h3 class="font-bold mb-2">Passion</h3>
        <p class="text-sm text-gray-400">
          Projet développé avec amour par des passionnés d'éducation.
        </p>
      </div>
    </div>

    <!-- L'équipe -->
    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
      <h2 class="text-xl font-bold mb-4">L'équipe</h2>
      <p class="text-gray-300 leading-relaxed">
        Kweez a été créé par <strong class="text-white">Alistair</strong>, développeur passionné, 
        avec l'aide précieuse de contributeurs bénévoles.
      </p>
      <p class="text-gray-300 leading-relaxed mt-3">
        Vous souhaitez rejoindre l'aventure ? Contactez-nous !
      </p>
    </div>

    <!-- CTA -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a 
        href="/donate"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 rounded-xl font-semibold transition-colors"
      >
        <Heart class="w-5 h-5" />
        Soutenir Kweez
      </a>
      <a 
        href="mailto:contact@kweez.fr"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium border border-gray-700"
      >
        Nous contacter
      </a>
    </div>
  </main>
</div>
