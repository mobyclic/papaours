import Surreal from 'surrealdb';

const db = new Surreal();

async function main() {
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({ username: process.env.SURREAL_USER!, password: process.env.SURREAL_PASS! });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });

  console.log('✅ Connecté à SurrealDB');

  // 1. Créer le thème "Cycle de la vie" sous Sciences
  const sciencesMatiereId = 'matiere:m84fe7jbm6ijjxofjmtf';
  
  const themeResult = await db.query(`
    CREATE theme SET
      name = "Cycle de la vie",
      slug = "sciences-cycle-de-la-vie",
      matiere_id = type::thing("matiere", "m84fe7jbm6ijjxofjmtf"),
      is_active = true,
      pos = 10
  `);
  
  const theme = (themeResult[0] as any[])?.[0];
  const themeId = theme?.id?.toString() || theme?.id;
  console.log('✅ Thème créé:', themeId);

  // 2. Questions à créer
  const questions = [
    // I. Cycle de vie humain
    { question: "Le cycle de vie de l'être humain commence par :", options: ["La naissance", "L'enfance", "La fécondation", "La puberté"], correct: 2, explanation: "Le cycle de vie commence à la fécondation, quand l'ovule et le spermatozoïde fusionnent." },
    { question: "Comment s'appelle la cellule formée par l'union de l'ovule et du spermatozoïde ?", options: ["Embryon", "Fœtus", "Cellule-œuf", "Bébé"], correct: 2, explanation: "La cellule-œuf (ou zygote) est formée lors de la fécondation." },
    { question: "L'embryon humain se développe dans :", options: ["L'ovaire", "Le ventre", "L'utérus", "Le placenta"], correct: 2, explanation: "L'embryon se développe dans l'utérus de la mère." },
    { question: "À partir de quel stade parle-t-on de fœtus ?", options: ["Dès la fécondation", "Après 3 semaines", "Après 2 mois", "À la naissance"], correct: 2, explanation: "On parle de fœtus à partir de 2 mois de développement (8 semaines)." },
    { question: "La durée moyenne de la grossesse humaine est de :", options: ["6 mois", "7 mois", "8 mois", "9 mois"], correct: 3, explanation: "La grossesse dure en moyenne 9 mois (environ 40 semaines)." },
    { question: "Le placenta permet :", options: ["De produire les gamètes", "Les échanges entre la mère et le fœtus", "La respiration du bébé après la naissance", "La digestion"], correct: 1, explanation: "Le placenta assure les échanges nutritifs et gazeux entre la mère et le fœtus." },
    { question: "Le cordon ombilical relie :", options: ["Le fœtus au père", "Le fœtus à l'utérus", "Le fœtus au placenta", "Le placenta à l'ovaire"], correct: 2, explanation: "Le cordon ombilical relie le fœtus au placenta." },
    { question: "À la naissance, le bébé est appelé :", options: ["Embryon", "Fœtus", "Nourrisson", "Adolescent"], correct: 2, explanation: "Un nourrisson est un bébé de la naissance jusqu'à environ 2 ans." },
    
    // II. La puberté et les transformations
    { question: "La puberté correspond à :", options: ["Une maladie", "Une période de repos", "Le moment où l'on devient capable de se reproduire", "La fin de la croissance"], correct: 2, explanation: "La puberté est la période de transformation où le corps devient capable de se reproduire." },
    { question: "À la puberté, les organes reproducteurs :", options: ["Disparaissent", "Deviennent fonctionnels", "Ralentissent", "Changent de place"], correct: 1, explanation: "Les organes reproducteurs deviennent fonctionnels à la puberté." },
    { question: "Chez les filles, la puberté commence en général :", options: ["Plus tôt que chez les garçons", "Plus tard que chez les garçons", "Au même âge exactement", "À la naissance"], correct: 0, explanation: "La puberté commence généralement plus tôt chez les filles (vers 10-11 ans) que chez les garçons (vers 12-13 ans)." },
    { question: "Quelle transformation est commune aux filles et aux garçons ?", options: ["Développement de la poitrine", "Apparition des règles", "Mue de la voix", "Pilosité"], correct: 3, explanation: "L'apparition de poils (pilosité) est commune aux filles et aux garçons à la puberté." },
    { question: "Les règles correspondent à :", options: ["Une maladie", "Un écoulement de sang mensuel", "La fécondation", "La grossesse"], correct: 1, explanation: "Les règles sont un écoulement de sang mensuel lié au cycle menstruel." },
    { question: "Chez les garçons, la mue de la voix est due à :", options: ["La croissance du larynx", "Une infection", "La puberté chez les filles", "La fatigue"], correct: 0, explanation: "La mue de la voix est causée par la croissance du larynx et des cordes vocales." },
    { question: "Les caractères sexuels secondaires apparaissent :", options: ["À la naissance", "Pendant l'enfance", "Pendant la puberté", "À l'âge adulte"], correct: 2, explanation: "Les caractères sexuels secondaires (pilosité, poitrine, etc.) apparaissent à la puberté." },
    { question: "La production des spermatozoïdes commence :", options: ["Avant la naissance", "À la puberté", "À l'âge adulte", "À la vieillesse"], correct: 1, explanation: "La production de spermatozoïdes débute à la puberté chez les garçons." },
    
    // III. La reproduction humaine
    { question: "Les gamètes masculins sont :", options: ["Les ovules", "Les spermatozoïdes", "Les cellules-œufs", "Les embryons"], correct: 1, explanation: "Les spermatozoïdes sont les cellules reproductrices masculines." },
    { question: "Les gamètes féminins sont :", options: ["Les spermatozoïdes", "Les ovules", "Les fœtus", "Les bébés"], correct: 1, explanation: "Les ovules sont les cellules reproductrices féminines." },
    { question: "La fécondation a lieu lorsque :", options: ["Le bébé naît", "L'ovule rencontre un spermatozoïde", "Le fœtus grandit", "Les règles commencent"], correct: 1, explanation: "La fécondation est la rencontre et la fusion d'un ovule et d'un spermatozoïde." },
    { question: "La fécondation se déroule généralement :", options: ["Dans l'utérus", "Dans le vagin", "Dans une trompe", "Dans l'ovaire"], correct: 2, explanation: "La fécondation a lieu dans une trompe de Fallope." },
    { question: "Un être humain devient capable de se reproduire :", options: ["À la naissance", "Pendant l'enfance", "À la puberté", "À la vieillesse"], correct: 2, explanation: "C'est à la puberté que le corps devient capable de se reproduire." },
    { question: "Pour fabriquer un bébé, il faut :", options: ["Un ovule seul", "Un spermatozoïde seul", "Un ovule et un spermatozoïde", "Un embryon"], correct: 2, explanation: "La reproduction nécessite la fusion d'un ovule et d'un spermatozoïde." },
    { question: "La cellule-œuf se divise pour former :", options: ["Un ovule", "Un fœtus", "Un embryon", "Un adulte"], correct: 2, explanation: "La cellule-œuf se divise pour former un embryon." },
    { question: "Le développement du bébé avant la naissance s'appelle :", options: ["La croissance", "La puberté", "La gestation", "La reproduction"], correct: 2, explanation: "La gestation est la période de développement du bébé dans l'utérus." },
    
    // IV. Le développement d'une plante à fleurs
    { question: "Une graine contient :", options: ["Une feuille", "Une fleur", "Un embryon végétal", "Une racine adulte"], correct: 2, explanation: "La graine contient un embryon végétal qui donnera la future plante." },
    { question: "La germination correspond :", options: ["À la mort de la graine", "Au développement de la graine", "À la fécondation", "À la floraison"], correct: 1, explanation: "La germination est le développement de la graine qui donne naissance à une nouvelle plante." },
    { question: "Pour germer, une graine a besoin :", options: ["De lumière uniquement", "D'eau", "De terre uniquement", "De fleurs"], correct: 1, explanation: "L'eau est essentielle pour déclencher la germination." },
    { question: "La première partie qui sort de la graine est souvent :", options: ["La fleur", "La tige", "La racine", "La feuille"], correct: 2, explanation: "La radicule (future racine) sort généralement en premier de la graine." },
    { question: "Une plante à fleurs se reproduit grâce :", options: ["Aux feuilles", "Aux racines", "Aux fleurs", "À la tige"], correct: 2, explanation: "Les fleurs contiennent les organes reproducteurs de la plante." },
    { question: "Après la fécondation chez une plante, la fleur devient :", options: ["Une feuille", "Un fruit", "Une racine", "Une tige"], correct: 1, explanation: "Après fécondation, la fleur se transforme en fruit contenant les graines." },
    
    // V. Expériences et conditions de germination
    { question: "Sans eau, une graine :", options: ["Germe mieux", "Ne germe pas", "Devient une fleur", "Meurt immédiatement"], correct: 1, explanation: "L'eau est indispensable à la germination." },
    { question: "Une graine placée au froid extrême :", options: ["Germe plus vite", "Ne germe pas correctement", "Devient une plante adulte", "Fleurit"], correct: 1, explanation: "Le froid extrême empêche ou ralentit la germination." },
    { question: "La température influence :", options: ["Seulement les animaux", "La germination", "La fécondation humaine", "Les règles"], correct: 1, explanation: "La température est un facteur important pour la germination des graines." },
    { question: "Une graine privée d'air :", options: ["Germe normalement", "Ne germe pas", "Produit des fleurs", "Se transforme en fruit"], correct: 1, explanation: "L'air (oxygène) est nécessaire à la germination." },
    { question: "Le rôle principal de la racine est :", options: ["Produire des graines", "Absorber l'eau et les sels minéraux", "Faire des fleurs", "Protéger la plante"], correct: 1, explanation: "Les racines absorbent l'eau et les sels minéraux du sol." },
    
    // VI. Questions de révision générale
    { question: "Le développement d'un être humain commence :", options: ["À la naissance", "À la puberté", "À la fécondation", "À l'enfance"], correct: 2, explanation: "Le développement commence à la fécondation, moment de la conception." },
    { question: "Un embryon humain de 3 semaines mesure environ :", options: ["10 cm", "3 mm", "1 m", "15 cm"], correct: 1, explanation: "À 3 semaines, l'embryon mesure environ 3 mm." },
    { question: "Les transformations physiques et psychologiques ont lieu surtout :", options: ["Pendant la grossesse", "Pendant la puberté", "À la naissance", "À la vieillesse"], correct: 1, explanation: "La puberté est marquée par d'importantes transformations physiques et psychologiques." },
    { question: "La reproduction permet :", options: ["De grandir", "De se nourrir", "De produire de nouveaux individus", "De respirer"], correct: 2, explanation: "La reproduction permet de créer de nouveaux individus et d'assurer la continuité de l'espèce." },
    { question: "Le développement concerne :", options: ["Seulement les humains", "Seulement les plantes", "Tous les êtres vivants", "Seulement les animaux"], correct: 2, explanation: "Tous les êtres vivants (humains, animaux, plantes) passent par des phases de développement." },
  ];

  // 3. Créer toutes les questions
  const cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
  let createdCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      await db.query(`
        CREATE question SET
          question = $question,
          options = $options,
          correctAnswer = $correctAnswer,
          explanation = $explanation,
          difficulty = "medium",
          family = "general",
          isActive = true,
          matiere_id = type::thing("matiere", "m84fe7jbm6ijjxofjmtf"),
          theme_ids = [type::thing("theme", $themeId)],
          createdAt = time::now(),
          updatedAt = time::now()
      `, {
        question: q.question,
        options: q.options,
        correctAnswer: q.correct,
        explanation: q.explanation,
        themeId: cleanThemeId
      });
      createdCount++;
    } catch (e) {
      console.error(`Erreur question ${i + 1}:`, e);
    }
  }

  console.log(`✅ ${createdCount} questions créées`);

  // 4. Créer le quiz
  const quizResult = await db.query(`
    CREATE quiz SET
      title = "Le cycle de la vie",
      slug = "cycle-de-la-vie",
      questionType = "qcm",
      isHomepage = false,
      isActive = true,
      shuffleQuestions = true,
      maxQuestions = 20,
      order = 0,
      theme_ids = [type::thing("theme", $themeId)]
  `, { themeId: cleanThemeId });

  const quiz = (quizResult[0] as any[])?.[0];
  console.log('✅ Quiz créé:', quiz?.id || quiz);

  // Vérifier
  const countResult = await db.query(`
    SELECT count() as total FROM question WHERE type::thing("theme", $themeId) INSIDE theme_ids GROUP ALL
  `, { themeId: cleanThemeId });
  console.log('Questions dans le thème:', (countResult[0] as any[])?.[0]?.total || 0);

  await db.close();
  console.log('✅ Terminé !');
}

main().catch(console.error);
