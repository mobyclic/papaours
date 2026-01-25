import { connectDB } from '../src/lib/db';

async function createAntiquiteQuiz() {
  const db = await connectDB();

  try {
    // 1. Créer le quiz
    console.log('📝 Création du quiz sur l\'Antiquité...');
    const quizResult = await db.query(`
      CREATE quiz SET
        title = "L'Antiquité - CE2",
        slug = "antiquite-ce2",
        description = "Découvre les grandes civilisations de l'Antiquité : les Égyptiens, les Grecs et les Romains ! Un voyage dans le temps pour les CE2.",
        theme = "Histoire",
        level = 1,
        isActive = true,
        isHomepage = false,
        order = 11,
        questionType = "qcm"
      RETURN AFTER
    `);
    const quiz = (quizResult[0] as any[])[0];
    console.log('✅ Quiz créé:', quiz.id);

    // 2. Créer les 15 questions adaptées CE2
    console.log('\n❓ Création des questions...');

    const questions = [
      {
        question: "Comment s'appellent les grandes constructions en pierre où les pharaons égyptiens étaient enterrés ?",
        options: ["Les pyramides", "Les châteaux", "Les églises", "Les grottes"],
        correctAnswer: 0,
        explanation: "Les pyramides sont d'immenses tombeaux construits pour les pharaons d'Égypte. La plus célèbre est la pyramide de Khéops !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/320px-Kheops-Pyramid.jpg",
        imageCaption: "La pyramide de Khéops en Égypte"
      },
      {
        question: "Comment appelait-on les rois de l'Égypte ancienne ?",
        options: ["Les empereurs", "Les pharaons", "Les chevaliers", "Les présidents"],
        correctAnswer: 1,
        explanation: "Les pharaons étaient les rois tout-puissants de l'Égypte ancienne. Ils étaient considérés comme des dieux vivants !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Tutanchamun_Maske.jpg/200px-Tutanchamun_Maske.jpg",
        imageCaption: "Le masque d'or du pharaon Toutânkhamon"
      },
      {
        question: "Quel grand fleuve traverse l'Égypte et permettait aux Égyptiens de cultiver leurs champs ?",
        options: ["La Seine", "Le Nil", "La Loire", "L'Amazone"],
        correctAnswer: 1,
        explanation: "Le Nil est le plus long fleuve d'Afrique. Chaque année, il débordait et déposait de la terre fertile sur les champs.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Nile_River_and_delta_from_orbit.jpg/220px-Nile_River_and_delta_from_orbit.jpg",
        imageCaption: "Le Nil vu de l'espace"
      },
      {
        question: "Comment s'appelle l'écriture inventée par les Égyptiens avec des petits dessins ?",
        options: ["L'alphabet", "Les hiéroglyphes", "Les chiffres", "Le morse"],
        correctAnswer: 1,
        explanation: "Les hiéroglyphes sont une écriture avec des dessins représentant des sons ou des idées. Il y en avait plus de 700 différents !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Hieroglyphs_from_the_tomb_of_Seti_I.jpg/320px-Hieroglyphs_from_the_tomb_of_Seti_I.jpg",
        imageCaption: "Des hiéroglyphes égyptiens"
      },
      {
        question: "Dans quelle ville de Grèce se trouvait un temple célèbre appelé le Parthénon ?",
        options: ["Paris", "Rome", "Athènes", "Londres"],
        correctAnswer: 2,
        explanation: "Le Parthénon est un magnifique temple construit à Athènes pour la déesse Athéna. On peut encore le voir aujourd'hui !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/320px-The_Parthenon_in_Athens.jpg",
        imageCaption: "Le Parthénon à Athènes"
      },
      {
        question: "Quel était le sport le plus important dans la Grèce antique ?",
        options: ["Le football", "Les Jeux Olympiques", "Le tennis", "Le ski"],
        correctAnswer: 1,
        explanation: "Les Jeux Olympiques ont été inventés par les Grecs il y a presque 3000 ans ! Ils avaient lieu tous les 4 ans à Olympie.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ancient_Greek_Olympic_stadium_in_Rhodes.jpg/320px-Ancient_Greek_Olympic_stadium_in_Rhodes.jpg",
        imageCaption: "Un stade grec ancien"
      },
      {
        question: "Comment s'appelait le chef des dieux grecs qui lançait la foudre ?",
        options: ["Apollon", "Poséidon", "Zeus", "Hercule"],
        correctAnswer: 2,
        explanation: "Zeus était le roi des dieux grecs. Il vivait sur le mont Olympe et lançait des éclairs quand il était en colère !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Jupiter_Smyrna_Louvre_Ma13.jpg/200px-Jupiter_Smyrna_Louvre_Ma13.jpg",
        imageCaption: "Une statue de Zeus"
      },
      {
        question: "Comment s'appelle la capitale de l'Empire romain ?",
        options: ["Paris", "Athènes", "Rome", "Le Caire"],
        correctAnswer: 2,
        explanation: "Rome est une ville d'Italie qui a donné son nom à l'Empire romain. On dit que Rome a été fondée par Romulus et Rémus.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/320px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg",
        imageCaption: "Le Colisée à Rome"
      },
      {
        question: "Comment s'appelaient les combattants qui se battaient dans les arènes romaines ?",
        options: ["Les chevaliers", "Les gladiateurs", "Les soldats", "Les pirates"],
        correctAnswer: 1,
        explanation: "Les gladiateurs étaient des combattants qui se battaient dans des arènes comme le Colisée pour divertir le peuple romain.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Gladiators_from_the_Zliten_mosaic_3.JPG/320px-Gladiators_from_the_Zliten_mosaic_3.JPG",
        imageCaption: "Une mosaïque représentant des gladiateurs"
      },
      {
        question: "Comment s'appelait le célèbre général romain qui a conquis la Gaule (l'ancienne France) ?",
        options: ["Napoléon", "Jules César", "Clovis", "Charlemagne"],
        correctAnswer: 1,
        explanation: "Jules César a conquis la Gaule vers 50 avant J.-C. Il a écrit un livre célèbre sur ses batailles contre les Gaulois.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Rimini083.jpg/200px-Rimini083.jpg",
        imageCaption: "Statue de Jules César"
      },
      {
        question: "Comment s'appelaient les habitants de la Gaule avant l'arrivée des Romains ?",
        options: ["Les Français", "Les Gaulois", "Les Vikings", "Les Grecs"],
        correctAnswer: 1,
        explanation: "Les Gaulois vivaient dans ce qui est aujourd'hui la France. Le plus célèbre d'entre eux est Vercingétorix !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Vercingetorix_stat%C3%A8re_avers.jpg/200px-Vercingetorix_stat%C3%A8re_avers.jpg",
        imageCaption: "Une pièce de monnaie gauloise"
      },
      {
        question: "Quel animal était sacré pour les Égyptiens et protégé par la déesse Bastet ?",
        options: ["Le chien", "Le chat", "Le lion", "L'éléphant"],
        correctAnswer: 1,
        explanation: "Les chats étaient sacrés en Égypte ! La déesse Bastet avait une tête de chat. Tuer un chat était très grave.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Bastet.svg/200px-Bastet.svg.png",
        imageCaption: "La déesse Bastet"
      },
      {
        question: "Quel peuple a inventé les premiers alphabets avec des lettres ?",
        options: ["Les Égyptiens", "Les Romains", "Les Phéniciens", "Les Gaulois"],
        correctAnswer: 2,
        explanation: "Les Phéniciens, un peuple de marins et de commerçants, ont inventé le premier alphabet. Les Grecs et les Romains s'en sont inspirés.",
      },
      {
        question: "Comment s'appelaient les longues routes construites par les Romains pour voyager ?",
        options: ["Les autoroutes", "Les voies romaines", "Les chemins de fer", "Les sentiers"],
        correctAnswer: 1,
        explanation: "Les Romains ont construit des milliers de kilomètres de routes pavées. On dit que 'tous les chemins mènent à Rome' !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Road_in_Pompei.jpg/320px-Road_in_Pompei.jpg",
        imageCaption: "Une voie romaine à Pompéi"
      },
      {
        question: "Qu'est-ce que les Romains construisaient pour amener l'eau dans les villes ?",
        options: ["Des piscines", "Des aqueducs", "Des fontaines", "Des puits"],
        correctAnswer: 1,
        explanation: "Les aqueducs étaient de grands ponts avec des canaux pour transporter l'eau depuis les montagnes jusqu'aux villes.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Pont_du_Gard_BLS.jpg/320px-Pont_du_Gard_BLS.jpg",
        imageCaption: "Le Pont du Gard, un aqueduc romain en France"
      }
    ];

    // Insérer chaque question avec SQL brut (pour éviter le bug SDK avec les arrays)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const optionsStr = JSON.stringify(q.options).replace(/"/g, '\\"');
      
      let query = `
        CREATE question SET
          quizId = ${quiz.id},
          question = "${q.question.replace(/"/g, '\\"')}",
          options = ["${q.options.join('", "')}"],
          correctAnswer = ${q.correctAnswer},
          explanation = "${q.explanation.replace(/"/g, '\\"')}",
          difficulty = "easy",
          family = "general",
          order = ${i + 1},
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
      console.log(`  ✅ Question ${i + 1}/15`);
    }

    console.log('\n🎉 Quiz créé avec succès !');
    console.log('   📚 Matière: Histoire');
    console.log('   📝 Quiz: L\'Antiquité - CE2');
    console.log('   ❓ Questions: 15');
    console.log('   🔗 URL: http://localhost:5173/quiz/antiquite-ce2');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

createAntiquiteQuiz();
