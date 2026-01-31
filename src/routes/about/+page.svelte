<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, Heart, Users, BookOpen, Shield } from 'lucide-svelte';
</script>

<svelte:head>
  <title>À propos - Kwizy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <header class="p-4 border-b bg-white">
    <div class="max-w-2xl mx-auto">
      <button onclick={() => goto('/dashboard')} class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ChevronLeft class="w-5 h-5" />
        <span>Retour</span>
      </button>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
        <span class="text-3xl font-black text-white">K</span>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">À propos de Kwizy</h1>
      <p class="text-gray-500">Apprendre en s'amusant, pour tous</p>
    </div>

    <!-- Mission -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Heart class="w-5 h-5 text-gray-700" />
        Notre mission
      </h2>
      <p class="text-gray-600 leading-relaxed">
        Kwizy est né d'une idée simple : <strong>rendre l'apprentissage amusant et accessible à tous</strong>. 
        Que vous soyez étudiant, professionnel ou simplement curieux, nos quiz s'adaptent à votre niveau.
      </p>
      <p class="text-gray-600 leading-relaxed mt-3">
        C'est pourquoi Kwizy est et restera <strong>100% gratuit</strong>, sans publicité ni contenu payant caché. 
        Notre financement repose uniquement sur la générosité de notre communauté.
      </p>
    </div>

    <!-- Valeurs -->
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <BookOpen class="w-5 h-5 text-gray-700" />
        </div>
        <h3 class="font-bold text-gray-900 mb-2">Qualité</h3>
        <p class="text-sm text-gray-600">
          Contenus créés avec soin, vérifiés et actualisés régulièrement par notre équipe.
        </p>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <Users class="w-5 h-5 text-gray-700" />
        </div>
        <h3 class="font-bold text-gray-900 mb-2">Accessibilité</h3>
        <p class="text-sm text-gray-600">
          Interface intuitive, disponible sur tous les appareils, adaptée à tous les âges.
        </p>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <Shield class="w-5 h-5 text-gray-700" />
        </div>
        <h3 class="font-bold text-gray-900 mb-2">Respect</h3>
        <p class="text-sm text-gray-600">
          Aucune publicité, aucun tracking invasif. Vos données sont protégées.
        </p>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <Heart class="w-5 h-5 text-gray-700" />
        </div>
        <h3 class="font-bold text-gray-900 mb-2">Passion</h3>
        <p class="text-sm text-gray-600">
          Projet développé avec amour par des passionnés d'éducation.
        </p>
      </div>
    </div>

    <!-- L'équipe -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">L'équipe</h2>
      <p class="text-gray-600 leading-relaxed">
        Kwizy a été créé par <strong>Alistair</strong>, développeur passionné, 
        avec l'aide précieuse de contributeurs bénévoles.
      </p>
      <p class="text-gray-600 leading-relaxed mt-3">
        Vous souhaitez rejoindre l'aventure ? Contactez-nous !
      </p>
    </div>

    <!-- CTA -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a 
        href="/donate"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
      >
        <Heart class="w-5 h-5" />
        Soutenir Kwizy
      </a>
      <a 
        href="mailto:contact@kwizy.fr"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-200"
      >
        Nous contacter
      </a>
    </div>
  </main>
</div>
