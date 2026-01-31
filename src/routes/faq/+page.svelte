<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, HelpCircle, ChevronDown } from 'lucide-svelte';

  interface FAQItem {
    question: string;
    answer: string;
    open?: boolean;
  }

  let faqs = $state<FAQItem[]>([
    {
      question: "Papa Ours est-il vraiment gratuit ?",
      answer: "Oui ! Papa Ours est 100% gratuit. Nous nous finançons uniquement grâce aux dons volontaires de notre communauté. Aucune publicité, aucun abonnement caché."
    },
    {
      question: "À quel âge mon enfant peut-il utiliser Papa Ours ?",
      answer: "Papa Ours est conçu pour les enfants de la maternelle au CM2 (3 à 11 ans). Les quiz sont adaptés à chaque niveau scolaire avec des difficultés progressives."
    },
    {
      question: "Comment fonctionne le système de niveaux ?",
      answer: "Votre enfant gagne des points en répondant correctement aux quiz. Plus il accumule de points, plus il monte en niveau. Chaque niveau débloque de nouveaux badges et récompenses virtuelles pour le motiver !"
    },
    {
      question: "Les données de mon enfant sont-elles protégées ?",
      answer: "Absolument. Nous ne collectons que le strict minimum (prénom et niveau scolaire). Aucune donnée n'est partagée avec des tiers. Consultez nos CGU pour plus de détails."
    },
    {
      question: "Puis-je suivre les progrès de mon enfant ?",
      answer: "Oui ! Le tableau de bord affiche les statistiques détaillées : quiz complétés, scores moyens, matières préférées, progression dans le temps..."
    },
    {
      question: "Comment sont créés les quiz ?",
      answer: "Nos quiz sont rédigés par des enseignants et validés selon les programmes officiels de l'Éducation nationale. Nous utilisons aussi l'IA pour générer des variantes et enrichir notre base."
    },
    {
      question: "Mon enfant peut-il jouer hors connexion ?",
      answer: "Pour l'instant, une connexion internet est nécessaire. Nous travaillons sur un mode hors-ligne pour une prochaine version !"
    },
    {
      question: "Comment puis-je soutenir le projet ?",
      answer: "Vous pouvez faire un don sur notre page dédiée. Même un petit café à 3€ nous aide énormément ! Vous pouvez aussi parler de Papa Ours autour de vous 🐻"
    }
  ]);

  function toggleFAQ(index: number) {
    faqs[index].open = !faqs[index].open;
  }
</script>

<svelte:head>
  <title>FAQ - Papa Ours</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
  <header class="p-4">
    <button onclick={() => goto('/')} class="flex items-center gap-2 text-gray-600 hover:text-gray-800">
      <ChevronLeft class="w-5 h-5" />
      <span>Retour</span>
    </button>
  </header>

  <main class="max-w-2xl mx-auto px-4 pb-12">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mb-4 shadow-lg">
        <HelpCircle class="w-8 h-8 text-white" />
      </div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Questions fréquentes</h1>
      <p class="text-gray-600">Tout ce que vous devez savoir sur Papa Ours 🐻</p>
    </div>

    <div class="space-y-3">
      {#each faqs as faq, index}
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onclick={() => toggleFAQ(index)}
            class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
          >
            <span class="font-medium text-gray-800">{faq.question}</span>
            <ChevronDown 
              class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200"
              style="transform: rotate({faq.open ? 180 : 0}deg)"
            />
          </button>
          
          {#if faq.open}
            <div class="px-5 pb-4 text-gray-600 border-t border-gray-100 pt-3">
              {faq.answer}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="mt-8 text-center">
      <p class="text-gray-500 mb-4">Vous avez une autre question ?</p>
      <a 
        href="mailto:contact@papaours.app"
        class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
      >
        Nous contacter
      </a>
    </div>
  </main>
</div>
