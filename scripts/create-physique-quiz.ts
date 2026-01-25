import { connectDB } from '../src/lib/db';

async function createPhysiqueQuiz() {
  const db = await connectDB();

  try {
    // 1. Récupérer le quiz existant
    console.log('📝 Recherche du quiz existant...');
    const quizResult = await db.query(`SELECT * FROM quiz WHERE slug = "proprietes-matiere-6e"`);
    const quiz = (quizResult[0] as any[])[0];
    
    if (!quiz) {
      console.log('❌ Quiz non trouvé');
      return;
    }
    console.log('✅ Quiz trouvé:', quiz.id);

    // 2. Les questions du quiz
    const questions = [
      {
        question: "Quels sont les trois états de la matière que tu connais ?",
        options: ["Solide, liquide, gazeux", "Dur, mou, transparent", "Chaud, froid, tiède", "Lourd, léger, moyen"],
        correctAnswer: 0,
        explanation: "La matière peut exister sous trois états principaux : solide (comme la glace), liquide (comme l'eau) et gazeux (comme la vapeur d'eau).",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Phase_diagram_of_water_simplified.svg/400px-Phase_diagram_of_water_simplified.svg.png",
        imageCaption: "Les trois états de l'eau"
      },
      {
        question: "Que se passe-t-il quand on chauffe de la glace ?",
        options: ["Elle fond et devient liquide", "Elle devient plus froide", "Elle disparaît", "Elle devient plus dure"],
        correctAnswer: 0,
        explanation: "Quand on chauffe de la glace (état solide), elle fond et se transforme en eau liquide. C'est ce qu'on appelle la fusion.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Ice_cubes_openphoto.jpg/320px-Ice_cubes_openphoto.jpg",
        imageCaption: "Glaçons en train de fondre"
      },
      {
        question: "Comment s'appelle le passage de l'état liquide à l'état gazeux ?",
        options: ["L'évaporation", "La solidification", "La fusion", "La condensation"],
        correctAnswer: 0,
        explanation: "L'évaporation (ou vaporisation) est le passage de l'état liquide à l'état gazeux. Par exemple, quand l'eau bout, elle s'évapore en vapeur.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Boiling_water.jpg/320px-Boiling_water.jpg",
        imageCaption: "Eau en ébullition"
      },
      {
        question: "Un solide a-t-il une forme propre ?",
        options: ["Oui, il garde sa forme", "Non, il prend la forme du récipient", "Ça dépend de la température", "Il n'a pas de forme"],
        correctAnswer: 0,
        explanation: "Un solide a une forme propre : il garde sa forme même si on le change de récipient. Un liquide, lui, prend la forme du récipient qui le contient.",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Quel instrument utilise-t-on pour mesurer la masse d'un objet ?",
        options: ["Une balance", "Un thermomètre", "Une règle", "Un chronomètre"],
        correctAnswer: 0,
        explanation: "La balance permet de mesurer la masse d'un objet en grammes (g) ou en kilogrammes (kg). La masse représente la quantité de matière.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Balance_%C3%A0_tabac_1850.jpg/280px-Balance_%C3%A0_tabac_1850.jpg",
        imageCaption: "Une balance"
      },
      {
        question: "Quel instrument utilise-t-on pour mesurer le volume d'un liquide ?",
        options: ["Une éprouvette graduée", "Une balance", "Un thermomètre", "Un microscope"],
        correctAnswer: 0,
        explanation: "L'éprouvette graduée permet de mesurer le volume d'un liquide en millilitres (mL) ou en litres (L).",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Graduated_cylinder.jpg/120px-Graduated_cylinder.jpg",
        imageCaption: "Une éprouvette graduée"
      },
      {
        question: "Quelle est l'unité de mesure de la masse ?",
        options: ["Le kilogramme (kg)", "Le litre (L)", "Le mètre (m)", "Le degré Celsius (°C)"],
        correctAnswer: 0,
        explanation: "La masse se mesure en kilogrammes (kg) ou en grammes (g). 1 kg = 1000 g.",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Qu'est-ce qui caractérise un gaz ?",
        options: ["Il occupe tout l'espace disponible", "Il a une forme propre", "Il ne peut pas se comprimer", "Il est toujours visible"],
        correctAnswer: 0,
        explanation: "Un gaz n'a pas de forme propre et occupe tout l'espace disponible dans son récipient. Les molécules d'un gaz sont très éloignées les unes des autres.",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Comment s'appelle le passage de l'état gazeux à l'état liquide ?",
        options: ["La condensation", "L'évaporation", "La fusion", "La solidification"],
        correctAnswer: 0,
        explanation: "La condensation (ou liquéfaction) est le passage de l'état gazeux à l'état liquide. C'est ce qui se passe quand la vapeur d'eau forme des gouttelettes sur une vitre froide.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Dew_on_leaf.jpg/320px-Dew_on_leaf.jpg",
        imageCaption: "Gouttes de rosée (condensation)"
      },
      {
        question: "À quelle température l'eau pure gèle-t-elle ?",
        options: ["0°C", "100°C", "-10°C", "50°C"],
        correctAnswer: 0,
        explanation: "L'eau pure gèle (se solidifie) à 0°C. C'est la température de solidification de l'eau. Elle bout à 100°C.",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Comment s'appelle le passage de l'état solide à l'état liquide ?",
        options: ["La fusion", "La solidification", "L'évaporation", "La condensation"],
        correctAnswer: 0,
        explanation: "La fusion est le passage de l'état solide à l'état liquide. Par exemple, la glace fond pour devenir de l'eau liquide.",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Parmi ces matériaux, lequel est un conducteur de chaleur ?",
        options: ["Le métal", "Le bois", "Le plastique", "Le tissu"],
        correctAnswer: 0,
        explanation: "Les métaux (fer, cuivre, aluminium...) sont de bons conducteurs de chaleur : ils transmettent bien la chaleur. C'est pourquoi les casseroles sont souvent en métal !",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Un liquide peut-il se comprimer facilement ?",
        options: ["Non, un liquide est incompressible", "Oui, très facilement", "Seulement s'il est chaud", "Seulement s'il est froid"],
        correctAnswer: 0,
        explanation: "Les liquides sont pratiquement incompressibles : on ne peut pas réduire leur volume en appuyant dessus. C'est pour cela qu'on utilise des liquides dans les freins des voitures !",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Qu'est-ce que la masse volumique ?",
        options: ["La masse d'un litre de matière", "La température d'un solide", "La couleur d'un liquide", "La taille d'un gaz"],
        correctAnswer: 0,
        explanation: "La masse volumique est la masse d'un volume donné de matière. Par exemple, 1 litre d'eau a une masse de 1 kg, donc sa masse volumique est de 1 kg/L.",
        imageUrl: null,
        imageCaption: null
      },
      {
        question: "Pourquoi le fer coule-t-il dans l'eau alors que le bois flotte ?",
        options: ["Le fer est plus dense que l'eau", "Le fer est plus grand", "Le bois est plus chaud", "L'eau n'aime pas le fer"],
        correctAnswer: 0,
        explanation: "Le fer a une masse volumique (densité) plus grande que l'eau, donc il coule. Le bois a une masse volumique plus faible que l'eau, donc il flotte.",
        imageUrl: null,
        imageCaption: null
      }
    ];

    // 3. Créer les questions
    console.log('\n❓ Création des questions...');
    let count = 0;
    const quizId = quiz.id.toString();

    for (const q of questions) {
      // Utiliser SQL brut pour les options (le SDK a un bug avec les arrays)
      const optionsStr = q.options.map(o => `"${o.replace(/"/g, '\\"')}"`).join(', ');
      
      await db.query(`
        CREATE question SET
          quizId = ${quizId},
          question = $question,
          options = [${optionsStr}],
          correctAnswer = ${q.correctAnswer},
          explanation = $explanation,
          imageUrl = ${q.imageUrl ? `"${q.imageUrl}"` : 'NONE'},
          imageCaption = ${q.imageCaption ? `"${q.imageCaption}"` : 'NONE'},
          family = "general",
          difficulty = "easy",
          isActive = true,
          order = ${count + 1}
      `, {
        question: q.question,
        explanation: q.explanation
      });
      
      count++;
      console.log(`  ✅ Question ${count}/${questions.length}`);
    }

    console.log('\n🎉 Quiz créé avec succès !');
    console.log('   📚 Matière: Physique/Chimie');
    console.log('   📝 Quiz: Les propriétés de la matière - 6ème');
    console.log('   ❓ Questions:', count);
    console.log('   🔗 URL: http://localhost:5173/quiz/proprietes-matiere-6e');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
    process.exit(0);
  }
}

createPhysiqueQuiz();
