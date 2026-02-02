<script lang="ts">
  import { goto } from '$app/navigation';
  import { HelpCircle, ArrowLeft } from 'lucide-svelte';
  import * as Accordion from "$lib/components/ui/accordion";

  const faqs = [
    {
      id: "item-1",
      question: "Kweez est-il vraiment gratuit ?",
      answer: "Oui ! Kweez est 100% gratuit. Nous nous finançons uniquement grâce aux dons volontaires de notre communauté. Aucune publicité, aucun abonnement caché."
    },
    {
      id: "item-2",
      question: "Qui peut utiliser Kweez ?",
      answer: "Kweez s'adresse à tous ! Étudiants, professionnels, curieux... Nos quiz couvrent de nombreux domaines et niveaux de difficulté."
    },
    {
      id: "item-3",
      question: "Comment fonctionne le système de niveaux ?",
      answer: "Vous gagnez des points en répondant correctement aux quiz. Plus vous accumulez de points, plus vous montez en niveau. Chaque niveau débloque de nouveaux badges et récompenses virtuelles !"
    },
    {
      id: "item-4",
      question: "Mes données sont-elles protégées ?",
      answer: "Absolument. Nous ne collectons que le strict minimum. Aucune donnée n'est partagée avec des tiers. Consultez nos CGU pour plus de détails."
    },
    {
      id: "item-5",
      question: "Puis-je suivre ma progression ?",
      answer: "Oui ! Le tableau de bord affiche vos statistiques détaillées : quiz complétés, scores moyens, matières préférées, progression dans le temps..."
    },
    {
      id: "item-6",
      question: "Comment sont créés les quiz ?",
      answer: "Nos quiz sont rédigés avec soin et vérifiés. Nous utilisons aussi l'IA pour générer des variantes et enrichir notre base."
    },
    {
      id: "item-7",
      question: "Puis-je jouer hors connexion ?",
      answer: "Pour l'instant, une connexion internet est nécessaire. Nous travaillons sur un mode hors-ligne pour une prochaine version !"
    },
    {
      id: "item-8",
      question: "Comment puis-je soutenir le projet ?",
      answer: "Vous pouvez faire un don sur notre page dédiée. Même un petit café à 3€ nous aide énormément ! Vous pouvez aussi parler de Kweez autour de vous 😊"
    }
  ];
</script>

<svelte:head>
  <title>FAQ - Kweez</title>
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
    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl mb-4 shadow-lg shadow-amber-500/20">
        <HelpCircle class="w-7 h-7 text-gray-900" />
      </div>
      <h1 class="text-3xl font-bold mb-2">Questions fréquentes</h1>
      <p class="text-gray-400">Tout ce que vous devez savoir sur Kweez</p>
    </div>

    <Accordion.Root type="single" class="w-full space-y-2">
      {#each faqs as faq}
        <Accordion.Item value={faq.id} class="bg-gray-900 border border-gray-800 rounded-xl px-1">
          <Accordion.Trigger class="text-left font-medium text-white hover:no-underline py-4 px-4 hover:text-amber-400 transition-colors">
            {faq.question}
          </Accordion.Trigger>
          <Accordion.Content class="text-gray-400 pb-4 px-4">
            {faq.answer}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>

    <div class="mt-12 text-center">
      <p class="text-gray-500 mb-4">Vous avez une autre question ?</p>
      <a 
        href="mailto:contact@kweez.fr"
        class="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 rounded-xl font-semibold transition-colors"
      >
        Nous contacter
      </a>
    </div>
  </main>
</div>
