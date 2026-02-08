import Surreal from 'surrealdb';

async function main() {
  const db = new Surreal();
  
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: 'kweez', database: 'dbkweez' });
  
  console.log('🌍 Création du quiz "Habiter les espaces à fortes contraintes"...');
  
  // 1. Créer ou récupérer un thème "Géographie"
  let themeResult = await db.query('SELECT id FROM theme WHERE name = "Géographie" LIMIT 1');
  let theme = (themeResult[0] as any[])?.[0];
  
  if (!theme) {
    console.log('📌 Création du thème "Géographie"...');
    const createThemeResult = await db.query(`
      CREATE theme SET
        name = "Géographie",
        slug = "geographie",
        description = "Questions de géographie : paysages, territoires, climats et modes de vie",
        isActive = true
    `);
    theme = (createThemeResult[0] as any[])?.[0];
    console.log('✅ Thème créé:', theme?.id);
  } else {
    console.log('✅ Thème existant:', theme?.id);
  }
  
  const themeId = theme?.id?.toString()?.includes(':') ? theme.id.toString().split(':')[1] : theme?.id;
  
  // 2. Créer le quiz
  const quizSlug = 'habiter-espaces-fortes-contraintes';
  
  // Vérifier si le quiz existe déjà
  const existingQuiz = await db.query(`SELECT id FROM quiz WHERE slug = $slug`, { slug: quizSlug });
  if ((existingQuiz[0] as any[])?.length > 0) {
    console.log('⚠️ Le quiz existe déjà, suppression...');
    await db.query(`DELETE quiz WHERE slug = $slug`, { slug: quizSlug });
  }
  
  const quizResult = await db.query(`
    CREATE quiz SET
      title = "Habiter les espaces à fortes contraintes",
      slug = $slug,
      description = "Découvre comment les humains habitent et s'adaptent aux milieux difficiles : déserts, montagnes, régions polaires et îles isolées.",
      difficulty = 3,
      maxQuestions = 10,
      isActive = true,
      theme_ids = [type::thing("theme", $themeId)],
      created_at = time::now()
  `, { slug: quizSlug, themeId });
  
  const quiz = (quizResult[0] as any[])?.[0];
  console.log('✅ Quiz créé:', quiz?.id);
  
  // 3. Créer les questions
  const questions = [
    // 1. Question d'association (matching)
    {
      question: "Associe chaque espace à sa contrainte naturelle principale :",
      questionType: "matching",
      leftItems: [
        { id: "sahara", text: "Le Sahara (Désert chaud)" },
        { id: "himalaya", text: "L'Himalaya (Montagne)" },
        { id: "groenland", text: "Le Groenland (Milieu polaire)" },
        { id: "ile", text: "Une île lointaine" }
      ],
      rightItems: [
        { id: "froid_pente", text: "Le froid et la pente" },
        { id: "isolement", text: "L'isolement (insularité)" },
        { id: "aridite", text: "L'aridité (manque d'eau)" },
        { id: "froid_extreme", text: "Le froid extrême" }
      ],
      correctMatches: {
        "sahara": "aridite",
        "himalaya": "froid_pente",
        "groenland": "froid_extreme",
        "ile": "isolement"
      },
      explanation: "Chaque espace possède une contrainte naturelle dominante : le Sahara souffre du manque d'eau (aridité), l'Himalaya combine froid et pente, le Groenland subit un froid extrême, et les îles lointaines sont isolées du reste du monde.",
      difficulty: "medium",
      pos: 0
    },
    // 2. Définition d'une contrainte naturelle
    {
      question: "Qu'est-ce qu'une 'contrainte naturelle' en géographie ?",
      questionType: "qcm",
      options: [
        "Un élément de la nature qui rend la vie des hommes plus difficile",
        "Un règlement qui interdit de construire",
        "Un avantage naturel pour les habitants",
        "Une loi pour protéger l'environnement"
      ],
      correctAnswer: 0,
      explanation: "Une contrainte naturelle est un élément du milieu naturel (climat, relief, isolement) qui complique l'installation et la vie des populations. Par exemple : le froid, la pente, le manque d'eau ou l'éloignement.",
      difficulty: "easy",
      pos: 1
    },
    // 3. Qu'est-ce qu'une oasis
    {
      question: "Qu'est-ce qu'une oasis ?",
      questionType: "qcm",
      options: [
        "Un endroit dans le désert où l'on trouve de l'eau et de la végétation",
        "Une montagne très haute",
        "Un type de maison en glace",
        "Un grand lac salé"
      ],
      correctAnswer: 0,
      explanation: "Une oasis est un espace fertile au milieu du désert, où l'eau est disponible (source, nappe souterraine). Les hommes y cultivent des palmiers-dattiers et des légumes.",
      difficulty: "easy",
      pos: 2
    },
    // 4. Le nomadisme
    {
      question: "Comment appelle-t-on le mode de vie des personnes qui se déplacent sans cesse pour trouver de l'eau et des pâturages ?",
      questionType: "qcm",
      options: [
        "Le nomadisme",
        "Le tourisme",
        "La sédentarité",
        "L'urbanisation"
      ],
      correctAnswer: 0,
      explanation: "Le nomadisme est un mode de vie où les populations se déplacent régulièrement avec leurs troupeaux pour trouver de l'eau et de l'herbe. Les Touaregs du Sahara et les Mongols d'Asie centrale sont des peuples nomades.",
      difficulty: "easy",
      pos: 3
    },
    // 5. Le dessalement
    {
      question: "Quel aménagement moderne permet de transformer l'eau de mer en eau douce dans les pays désertiques ?",
      questionType: "qcm",
      options: [
        "Une usine de dessalement",
        "Un barrage",
        "Une éolienne",
        "Une centrale nucléaire"
      ],
      correctAnswer: 0,
      explanation: "Les usines de dessalement retirent le sel de l'eau de mer pour produire de l'eau douce. Ces installations sont très utilisées dans les pays du Golfe Persique (Arabie Saoudite, Émirats) qui manquent d'eau douce.",
      difficulty: "medium",
      pos: 4
    },
    // 6. Vrai ou Faux - Les déserts sont inhabités
    {
      question: "Les déserts sont totalement inhabités.",
      questionType: "true_false",
      correctAnswer: false,
      explanation: "Faux ! Environ 250 millions de personnes vivent dans les zones désertiques. Ils se sont adaptés grâce aux oasis, au nomadisme ou à des aménagements modernes (irrigation, dessalement).",
      difficulty: "easy",
      pos: 5
    },
    // 7. Vrai ou Faux - L'altitude rend la vie plus difficile
    {
      question: "Plus on monte en altitude, plus il fait chaud et facile de respirer.",
      questionType: "true_false",
      correctAnswer: false,
      explanation: "Faux ! C'est l'inverse : plus on monte en altitude, plus il fait froid (environ -6°C tous les 1000 mètres) et plus l'air contient moins d'oxygène, ce qui rend la respiration difficile.",
      difficulty: "easy",
      pos: 6
    },
    // 8. Vrai ou Faux - Les Inuits
    {
      question: "Les Inuits vivent traditionnellement dans des igloos en hiver.",
      questionType: "true_false",
      correctAnswer: true,
      explanation: "Vrai ! L'igloo est un abri temporaire construit avec des blocs de neige. La neige isole du froid extérieur et la température à l'intérieur peut atteindre 0°C grâce à la chaleur corporelle.",
      difficulty: "easy",
      pos: 7
    },
    // 9. Vrai ou Faux - Les îles isolées
    {
      question: "Les îles isolées doivent souvent importer la plupart de leurs produits depuis le continent.",
      questionType: "true_false",
      correctAnswer: true,
      explanation: "Vrai ! L'insularité (le fait d'être une île) entraîne un isolement qui rend difficile l'approvisionnement. Les îles dépendent souvent des bateaux et avions pour recevoir nourriture, carburant et matériaux.",
      difficulty: "medium",
      pos: 8
    },
    // 10. Question récapitulative - QCM multiple
    {
      question: "Quelles sont les principales contraintes des milieux montagnards ? (Plusieurs réponses possibles)",
      questionType: "qcm_multiple",
      options: [
        "Le froid",
        "Les fortes pentes",
        "Le manque d'eau",
        "L'isolement difficile en hiver"
      ],
      answers: [
        { text: "Le froid", is_correct: true },
        { text: "Les fortes pentes", is_correct: true },
        { text: "Le manque d'eau", is_correct: false },
        { text: "L'isolement difficile en hiver", is_correct: true }
      ],
      explanation: "En montagne, les contraintes principales sont le froid (qui augmente avec l'altitude), les pentes raides (qui compliquent la construction et la circulation) et l'isolement en hiver (routes bloquées par la neige). L'eau n'est généralement pas un problème car les montagnes reçoivent beaucoup de précipitations.",
      difficulty: "medium",
      pos: 9
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
    if (q.questionType === 'qcm') {
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
    
    if (q.questionType === 'matching') {
      createQuery += `, leftItems = $leftItems, rightItems = $rightItems, correctMatches = $correctMatches`;
      params.leftItems = (q as any).leftItems;
      params.rightItems = (q as any).rightItems;
      params.correctMatches = (q as any).correctMatches;
    }
    
    const result = await db.query(createQuery, params);
    const created = (result[0] as any[])?.[0];
    console.log(`  ✅ [${q.questionType}] "${q.question.substring(0, 50)}..." -> ${created?.id}`);
  }
  
  // 4. Ajouter le quiz au programme de l'utilisateur
  console.log('\n📌 Ajout au programme utilisateur...');
  
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
  console.log('\n🎉 Quiz créé avec succès !');
  console.log(`   Titre: Habiter les espaces à fortes contraintes`);
  console.log(`   Slug: ${quizSlug}`);
  console.log(`   Questions: ${questions.length}`);
  console.log('   Types: 1 matching, 4 QCM, 4 vrai/faux, 1 QCM multiple');
}

main().catch(console.error);
