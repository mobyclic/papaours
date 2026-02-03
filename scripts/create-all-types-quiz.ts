import Surreal from 'surrealdb';

async function main() {
  const db = new Surreal();
  
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: 'kweez', database: 'dbkweez' });
  
  console.log('🧪 Création du quiz "Test de tous les types de questions"...');
  
  // 1. Créer ou récupérer un thème "Test"
  let themeResult = await db.query('SELECT id FROM theme WHERE name = "Test" LIMIT 1');
  let theme = (themeResult[0] as any[])?.[0];
  
  if (!theme) {
    console.log('📌 Création du thème "Test"...');
    const createThemeResult = await db.query(`
      CREATE theme SET
        name = "Test",
        slug = "test",
        description = "Thème de test pour les différents types de questions",
        isActive = true
    `);
    theme = (createThemeResult[0] as any[])?.[0];
    console.log('✅ Thème créé:', theme?.id);
  } else {
    console.log('✅ Thème existant:', theme?.id);
  }
  
  const themeId = theme?.id?.toString()?.includes(':') ? theme.id.toString().split(':')[1] : theme?.id;
  
  // 2. Créer le quiz
  const quizSlug = 'test-tous-types';
  
  // Vérifier si le quiz existe déjà
  const existingQuiz = await db.query(`SELECT id FROM quiz WHERE slug = $slug`, { slug: quizSlug });
  if ((existingQuiz[0] as any[])?.length > 0) {
    console.log('⚠️ Le quiz existe déjà, suppression...');
    await db.query(`DELETE quiz WHERE slug = $slug`, { slug: quizSlug });
  }
  
  const quizResult = await db.query(`
    CREATE quiz SET
      title = "Test de tous les types de questions",
      slug = $slug,
      description = "Ce quiz contient une question de chaque type pour tester l'interface : QCM classique, QCM multiple, Vrai/Faux, Question à trous, Association, Classement, Question ouverte courte et longue.",
      difficulty = 5,
      maxQuestions = 8,
      isActive = true,
      theme_ids = [type::thing("theme", $themeId)],
      created_at = time::now()
  `, { slug: quizSlug, themeId });
  
  const quiz = (quizResult[0] as any[])?.[0];
  console.log('✅ Quiz créé:', quiz?.id);
  
  // 3. Créer les questions de chaque type
  const questions = [
    // 1. QCM Classique
    {
      question: "Quelle est la capitale de la France ?",
      questionType: "qcm",
      options: ["Paris", "Londres", "Berlin", "Madrid"],
      correctAnswer: 0,
      explanation: "Paris est la capitale de la France depuis des siècles. C'est la ville la plus peuplée du pays avec environ 2,2 millions d'habitants intra-muros.",
      difficulty: "easy",
      pos: 0
    },
    // 2. QCM Multiple (plusieurs réponses)
    {
      question: "Quelles planètes font partie du système solaire ? (Plusieurs réponses possibles)",
      questionType: "qcm_multiple",
      options: ["Mars", "Pluton (planète naine)", "Jupiter", "Andromède"],
      answers: [
        { text: "Mars", is_correct: true },
        { text: "Pluton (planète naine)", is_correct: true },
        { text: "Jupiter", is_correct: true },
        { text: "Andromède", is_correct: false }
      ],
      explanation: "Mars, Pluton (bien qu'officiellement une planète naine) et Jupiter font partie de notre système solaire. Andromède est une galaxie, pas une planète !",
      difficulty: "medium",
      pos: 1
    },
    // 3. Vrai/Faux
    {
      question: "La Terre est plus grande que la Lune.",
      questionType: "true_false",
      correctAnswer: true,
      explanation: "Vrai ! La Terre a un diamètre d'environ 12 742 km, tandis que la Lune n'a qu'un diamètre de 3 474 km. La Terre est donc environ 3,7 fois plus grande que la Lune.",
      difficulty: "easy",
      pos: 2
    },
    // 4. Question à trous
    {
      question: "Complete la phrase suivante :",
      questionType: "fill_blank",
      textWithBlanks: "L'eau bout à ___ degrés Celsius et gèle à ___ degrés Celsius.",
      correctAnswers: ["100", "0"],
      caseSensitive: false,
      explanation: "L'eau bout à 100°C (au niveau de la mer) et gèle à 0°C. Ces températures sont utilisées comme références pour l'échelle Celsius.",
      difficulty: "easy",
      pos: 3
    },
    // 5. Association (Matching)
    {
      question: "Associe chaque pays à sa capitale :",
      questionType: "matching",
      leftItems: [
        { id: "fr", text: "France" },
        { id: "de", text: "Allemagne" },
        { id: "it", text: "Italie" },
        { id: "es", text: "Espagne" }
      ],
      rightItems: [
        { id: "paris", text: "Paris" },
        { id: "berlin", text: "Berlin" },
        { id: "rome", text: "Rome" },
        { id: "madrid", text: "Madrid" }
      ],
      correctMatches: {
        "fr": "paris",
        "de": "berlin",
        "it": "rome",
        "es": "madrid"
      },
      explanation: "Paris est la capitale de la France, Berlin celle de l'Allemagne, Rome celle de l'Italie et Madrid celle de l'Espagne.",
      difficulty: "easy",
      pos: 4
    },
    // 6. Classement (Ordering)
    {
      question: "Classe ces événements historiques du plus ancien au plus récent :",
      questionType: "ordering",
      items: [
        { id: "rev", text: "Révolution française (1789)" },
        { id: "ww2", text: "Seconde Guerre mondiale (1939-1945)" },
        { id: "moon", text: "Premier pas sur la Lune (1969)" },
        { id: "rome", text: "Chute de l'Empire romain (476)" }
      ],
      correctOrder: ["rome", "rev", "ww2", "moon"],
      explanation: "L'ordre chronologique est : Chute de l'Empire romain (476), Révolution française (1789), Seconde Guerre mondiale (1939-1945), Premier pas sur la Lune (1969).",
      difficulty: "medium",
      pos: 5
    },
    // 7. Question ouverte courte
    {
      question: "En quelle année a été signée la Déclaration des Droits de l'Homme et du Citoyen ?",
      questionType: "open_short",
      placeholder: "Écris l'année...",
      sampleAnswers: ["1789"],
      expectedKeywords: ["1789"],
      explanation: "La Déclaration des Droits de l'Homme et du Citoyen a été signée le 26 août 1789, pendant la Révolution française.",
      difficulty: "medium",
      pos: 6
    },
    // 8. Question ouverte longue
    {
      question: "Explique en quelques phrases ce qu'est le cycle de l'eau.",
      questionType: "open_long",
      placeholder: "Décris le cycle de l'eau avec tes propres mots...",
      minWords: 20,
      maxWords: 200,
      sampleAnswers: [
        "Le cycle de l'eau décrit le mouvement continu de l'eau sur Terre. L'eau des océans s'évapore sous l'effet du soleil, forme des nuages par condensation, puis retombe sous forme de pluie ou de neige. Cette eau rejoint ensuite les rivières et les océans, et le cycle recommence."
      ],
      expectedKeywords: ["évaporation", "condensation", "précipitation", "nuages", "pluie"],
      explanation: "Le cycle de l'eau comprend l'évaporation (l'eau devient vapeur), la condensation (formation des nuages), les précipitations (pluie, neige) et le ruissellement (retour vers les océans).",
      difficulty: "hard",
      pos: 7
    }
  ];
  
  console.log('\n📝 Création des questions...');
  
  for (const q of questions) {
    let createQuery = `
      CREATE question SET
        question = $question,
        questionType = $questionType,
        explanation = $explanation,
        difficulty = $difficulty,
        isActive = true,
        pos = $pos,
        theme_ids = [type::thing("theme", $themeId)]
    `;
    
    const params: any = {
      question: q.question,
      questionType: q.questionType,
      explanation: q.explanation,
      difficulty: q.difficulty,
      pos: q.pos,
      themeId
    };
    
    // Ajouter les champs spécifiques selon le type
    if (q.questionType === 'qcm' || q.questionType === 'qcm_image') {
      createQuery += `, options = $options, correctAnswer = $correctAnswer`;
      params.options = (q as any).options;
      params.correctAnswer = (q as any).correctAnswer;
    }
    
    if (q.questionType === 'qcm_multiple') {
      createQuery += `, options = $options, answers = $answers`;
      params.options = (q as any).options;
      params.answers = (q as any).answers;
    }
    
    if (q.questionType === 'true_false') {
      createQuery += `, correctAnswer = $correctAnswer`;
      params.correctAnswer = (q as any).correctAnswer;
    }
    
    if (q.questionType === 'fill_blank') {
      createQuery += `, textWithBlanks = $textWithBlanks, correctAnswers = $correctAnswers, caseSensitive = $caseSensitive`;
      params.textWithBlanks = (q as any).textWithBlanks;
      params.correctAnswers = (q as any).correctAnswers;
      params.caseSensitive = (q as any).caseSensitive;
    }
    
    if (q.questionType === 'matching') {
      createQuery += `, leftItems = $leftItems, rightItems = $rightItems, correctMatches = $correctMatches`;
      params.leftItems = (q as any).leftItems;
      params.rightItems = (q as any).rightItems;
      params.correctMatches = (q as any).correctMatches;
    }
    
    if (q.questionType === 'ordering') {
      createQuery += `, items = $items, correctOrder = $correctOrder`;
      params.items = (q as any).items;
      params.correctOrder = (q as any).correctOrder;
    }
    
    if (q.questionType === 'open_short' || q.questionType === 'open_long') {
      createQuery += `, placeholder = $placeholder, sampleAnswers = $sampleAnswers, expectedKeywords = $expectedKeywords`;
      params.placeholder = (q as any).placeholder;
      params.sampleAnswers = (q as any).sampleAnswers;
      params.expectedKeywords = (q as any).expectedKeywords;
      
      if ((q as any).minWords) {
        createQuery += `, minWords = $minWords`;
        params.minWords = (q as any).minWords;
      }
      if ((q as any).maxWords) {
        createQuery += `, maxWords = $maxWords`;
        params.maxWords = (q as any).maxWords;
      }
    }
    
    const result = await db.query(createQuery, params);
    const created = (result[0] as any[])?.[0];
    console.log(`  ✅ [${q.questionType}] "${q.question.substring(0, 50)}..." -> ${created?.id}`);
  }
  
  // 4. Ajouter le quiz au programme de l'utilisateur
  console.log('\n📌 Ajout au programme utilisateur...');
  
  // Récupérer l'utilisateur (le premier avec une session récente)
  const userResult = await db.query(`
    SELECT user FROM session 
    WHERE expires_at > time::now() 
    ORDER BY expires_at DESC 
    LIMIT 1
  `);
  const userRecord = (userResult[0] as any[])?.[0];
  
  if (userRecord?.user) {
    const userId = userRecord.user.toString().includes(':') 
      ? userRecord.user.toString().split(':')[1] 
      : userRecord.user;
    const quizId = quiz?.id?.toString()?.includes(':') 
      ? quiz.id.toString().split(':')[1] 
      : quiz?.id;
    
    // Vérifier si déjà dans le programme
    const existingProgram = await db.query(`
      SELECT id FROM user_program 
      WHERE user = type::thing("user", $userId) 
        AND quiz = type::thing("quiz", $quizId)
    `, { userId, quizId });
    
    if ((existingProgram[0] as any[])?.length === 0) {
      await db.query(`
        CREATE user_program SET
          user = type::thing("user", $userId),
          quiz = type::thing("quiz", $quizId),
          added_at = time::now(),
          completed = false
      `, { userId, quizId });
      console.log(`  ✅ Quiz ajouté au programme de l'utilisateur ${userId}`);
    } else {
      console.log(`  ℹ️ Quiz déjà dans le programme`);
    }
  } else {
    console.log('  ⚠️ Aucun utilisateur connecté trouvé');
  }
  
  await db.close();
  console.log('\n🎉 Quiz de test créé avec succès !');
  console.log(`   Slug: ${quizSlug}`);
  console.log(`   Questions: ${questions.length} (une de chaque type)`);
}

main().catch(console.error);
