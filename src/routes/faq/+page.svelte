<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, HelpCircle } from 'lucide-svelte';
  import * as Accordion from "$lib/components/ui/accordion";

  const faqs = [
    {
      id: "item-1",
      question: "Kwizy est-il vraiment gratuit ?",
      answer: "Oui ! Kwizy est 100% gratuit. Nous nous finançons uniquement grâce aux dons volontaires de notre communauté. Aucune publicité, aucun abonnement caché."
    },
    {
      id: "item-2",
      question: "Qui peut utiliser Kwizy ?",
      answer: "Kwizy s'adresse à tous ! Étudiants, professionnels, curieux... Nos quiz couvrent de nombreux domaines et niveaux de difficulté."
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
      answer: "Vous pouvez faire un don sur notre page dédiée. Même un petit café à 3€ nous aide énormément ! Vous pouvez aussi parler de Kwizy autour de vous 😊"
    }
  ];
</script>

<svelte:head>
  <title>FAQ - Kwizy</title>
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
    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-full mb-4">
        <HelpCircle class="w-7 h-7 text-white" />
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Questions fréquentes</h1>
      <p class="text-gray-500">Tout ce que vous devez savoir sur Kwizy</p>
    </div>

    <Accordion.Root type="single" class="w-full space-y-2">
      {#each faqs as faq}
        <Accordion.Item value={faq.id} class="bg-white border border-gray-200 rounded-lg px-1">
          <Accordion.Trigger class="text-left font-medium text-gray-900 hover:no-underline py-4 px-4">
            {faq.question}
          </Accordion.Trigger>
          <Accordion.Content class="text-gray-600 pb-4 px-4">
            {faq.answer}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>

    <div class="mt-12 text-center">
      <p class="text-gray-500 mb-4">Vous avez une autre question ?</p>
      <a 
        href="mailto:contact@kwizy.fr"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
      >
        Nous contacter
      </a>
    </div>
  </main>
</div>
