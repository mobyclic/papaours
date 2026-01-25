import { connectDB } from '../src/lib/db';

async function addMatiereQuestions() {
  const db = await connectDB();

  try {
    // Récupérer le quiz "propriétés de la matière"
    const quizResult = await db.query(`SELECT * FROM quiz WHERE slug = "proprietes-matiere-6e"`);
    const quiz = (quizResult[0] as any[])[0];
    
    if (!quiz) {
      console.log('❌ Quiz non trouvé');
      return;
    }
    console.log('✅ Quiz trouvé:', quiz.title);

    // Compter les questions existantes pour l'ordre
    const countResult = await db.query(`SELECT count() FROM question WHERE quizId = ${quiz.id} GROUP ALL`);
    const existingCount = (countResult[0] as any[])[0]?.count || 0;
    console.log(`📊 Questions existantes: ${existingCount}`);

    // Les 20 nouvelles questions
    const questions = [
      {
        question: "Parmi ces matériaux, lequel est métallique ?",
        options: ["Bois", "Verre", "Aluminium", "Carton"],
        correctAnswer: 2,
        explanation: "L'aluminium est un métal léger et résistant, très utilisé dans l'industrie. Le bois, le verre et le carton ne sont pas des métaux."
      },
      {
        question: "Quel matériau est issu du pétrole ?",
        options: ["Verre", "Plastique", "Bois", "Papier"],
        correctAnswer: 1,
        explanation: "Le plastique est fabriqué à partir du pétrole, une ressource fossile. C'est pourquoi il est important de le recycler !"
      },
      {
        question: "Le verre est fabriqué principalement à partir de :",
        options: ["Bois", "Sable", "Pétrole", "Métal"],
        correctAnswer: 1,
        explanation: "Le verre est fabriqué en chauffant du sable (silice) à très haute température, environ 1500°C !"
      },
      {
        question: "Quel déchet va dans la poubelle jaune ?",
        options: ["Bouteille en verre", "Restes alimentaires", "Canette en aluminium", "Pot de yaourt sale"],
        correctAnswer: 2,
        explanation: "La canette en aluminium va dans la poubelle jaune car c'est un emballage métallique recyclable."
      },
      {
        question: "Une bouteille en verre se jette :",
        options: ["Dans la poubelle jaune", "Dans le conteneur à verre", "Dans la poubelle noire", "Dans le compost"],
        correctAnswer: 1,
        explanation: "Le verre se recycle dans les conteneurs à verre (souvent verts). Il peut être recyclé à l'infini sans perdre ses qualités !"
      },
      {
        question: "Le papier est fabriqué à partir :",
        options: ["Du sable", "Du bois", "Du pétrole", "Du métal"],
        correctAnswer: 1,
        explanation: "Le papier est fabriqué à partir de fibres de bois (cellulose). C'est pourquoi le recycler permet de préserver les forêts."
      },
      {
        question: "Quel matériau est recyclable presque à l'infini ?",
        options: ["Plastique", "Papier", "Verre", "Carton"],
        correctAnswer: 2,
        explanation: "Le verre peut être recyclé indéfiniment sans perdre ses propriétés, contrairement au plastique ou au papier qui se dégradent à chaque recyclage."
      },
      {
        question: "À l'état solide, une matière :",
        options: ["Prend la forme du récipient", "A un volume variable", "A une forme propre", "N'a pas de volume"],
        correctAnswer: 2,
        explanation: "Un solide a une forme propre (il garde sa forme) et un volume propre. Un glaçon reste un glaçon quel que soit le récipient !"
      },
      {
        question: "À l'état liquide, une matière :",
        options: ["A une forme propre", "N'a pas de volume", "Prend la forme du récipient", "Est invisible"],
        correctAnswer: 2,
        explanation: "Un liquide n'a pas de forme propre : il prend la forme du récipient qui le contient. Mais il garde un volume constant."
      },
      {
        question: "À l'état gazeux, une matière :",
        options: ["A une forme propre", "A un volume propre", "Occupe tout l'espace disponible", "Ne peut pas être compressée"],
        correctAnswer: 2,
        explanation: "Un gaz n'a ni forme ni volume propre : il occupe tout l'espace disponible et peut être compressé (comme dans une bouteille de plongée)."
      },
      {
        question: "Le passage de l'état solide à l'état liquide s'appelle :",
        options: ["Solidification", "Évaporation", "Fusion", "Condensation"],
        correctAnswer: 2,
        explanation: "La fusion, c'est quand un solide fond pour devenir liquide. Exemple : la glace qui fond au soleil devient de l'eau liquide."
      },
      {
        question: "Le passage de l'état liquide à l'état gazeux s'appelle :",
        options: ["Fusion", "Évaporation", "Solidification", "Liquéfaction"],
        correctAnswer: 1,
        explanation: "L'évaporation (ou vaporisation), c'est quand un liquide se transforme en gaz. L'eau qui bout se transforme en vapeur d'eau."
      },
      {
        question: "Le passage de l'état gazeux à l'état liquide s'appelle :",
        options: ["Fusion", "Condensation", "Évaporation", "Sublimation"],
        correctAnswer: 1,
        explanation: "La condensation, c'est quand un gaz redevient liquide. Exemple : la buée sur une vitre froide, c'est la vapeur d'eau de l'air qui se condense."
      },
      {
        question: "Quel objet est utilisé pour mesurer un volume de liquide ?",
        options: ["Bécher", "Erlenmeyer", "Éprouvette graduée", "Ballon"],
        correctAnswer: 2,
        explanation: "L'éprouvette graduée est l'instrument le plus précis pour mesurer un volume de liquide grâce à ses graduations fines.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Graduated_cylinder.jpg/120px-Graduated_cylinder.jpg",
        imageCaption: "Une éprouvette graduée"
      },
      {
        question: "Le bécher sert principalement à :",
        options: ["Mesurer précisément un volume", "Chauffer et mélanger des liquides", "Peser des solides", "Filtrer un liquide"],
        correctAnswer: 1,
        explanation: "Le bécher est un récipient à bec verseur utilisé pour chauffer, mélanger ou transvaser des liquides. Ses graduations ne sont pas très précises.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Becher.svg/200px-Becher.svg.png",
        imageCaption: "Un bécher"
      },
      {
        question: "L'erlenmeyer est surtout utilisé pour :",
        options: ["Stocker des solides", "Mélanger sans renverser", "Mesurer une masse", "Observer des insectes"],
        correctAnswer: 1,
        explanation: "L'erlenmeyer a une forme conique qui permet d'agiter des liquides sans les renverser. Très pratique pour les mélanges !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Erlenmeyer_flask.svg/200px-Erlenmeyer_flask.svg.png",
        imageCaption: "Un erlenmeyer"
      },
      {
        question: "Pour filtrer un mélange, on utilise :",
        options: ["Une éprouvette", "Un entonnoir et un filtre", "Un ballon", "Une pipette"],
        correctAnswer: 1,
        explanation: "La filtration se fait avec un entonnoir dans lequel on place un filtre en papier. Cela permet de séparer un solide d'un liquide."
      },
      {
        question: "Lors d'une expérience, la sécurité impose :",
        options: ["De manger au laboratoire", "De porter des lunettes de protection", "De courir", "De sentir les produits"],
        correctAnswer: 1,
        explanation: "Au laboratoire, on porte des lunettes pour protéger ses yeux. On ne mange pas, on ne court pas, et on ne sent JAMAIS directement les produits !"
      },
      {
        question: "Le tri des déchets permet :",
        options: ["De polluer plus", "De gagner du temps", "De recycler les matériaux", "De mélanger les déchets"],
        correctAnswer: 2,
        explanation: "Le tri sélectif permet de recycler les matériaux : le verre redevient du verre, le plastique est transformé en nouveaux objets, etc."
      },
      {
        question: "Un matériau biodégradable est un matériau :",
        options: ["Qui ne se décompose jamais", "Qui fond à basse température", "Qui se décompose naturellement", "Qui est en métal"],
        correctAnswer: 2,
        explanation: "Un matériau biodégradable se décompose naturellement grâce aux micro-organismes. Le papier, le bois, les épluchures sont biodégradables, mais pas le plastique classique !"
      }
    ];

    console.log('\n❓ Ajout des 20 nouvelles questions...');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      let query = `
        CREATE question SET
          quizId = ${quiz.id},
          question = "${q.question.replace(/"/g, '\\"')}",
          options = ["${q.options.join('", "')}"],
          correctAnswer = ${q.correctAnswer},
          explanation = "${q.explanation.replace(/"/g, '\\"')}",
          difficulty = "easy",
          family = "general",
          order = ${existingCount + i + 1},
          isActive = true,
          createdAt = time::now(),
          updatedAt = time::now()
      `;
      
      if (q.imageUrl) {
        query += `, imageUrl = "${q.imageUrl}"`;
      }
      if (q.imageCaption) {
        query += `, imageCaption = "${q.imageCaption}"`;
      }

      await db.query(query);
      console.log(`  ✅ Question ${i + 1}/20: ${q.question.substring(0, 50)}...`);
    }

    // Mettre à jour le quiz : shuffle + max 20 questions
    await db.query(`
      UPDATE ${quiz.id} SET 
        shuffleQuestions = true,
        maxQuestions = 20
    `);
    console.log('\n✅ Quiz configuré: shuffle=true, maxQuestions=20');

    // Compter le total
    const finalCount = await db.query(`SELECT count() FROM question WHERE quizId = ${quiz.id} GROUP ALL`);
    const total = (finalCount[0] as any[])[0]?.count || 0;

    console.log('\n🎉 Terminé !');
    console.log(`   📝 Quiz: ${quiz.title}`);
    console.log(`   ❓ Total questions: ${total}`);
    console.log(`   🔀 Mode: 20 questions aléatoires`);
    console.log(`   🔗 URL: http://localhost:5173/quiz/proprietes-matiere-6e`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

addMatiereQuestions();
