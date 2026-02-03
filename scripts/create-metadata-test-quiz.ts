/**
 * Script pour créer un quiz de test avec différents types de questions
 * utilisant le système de metadata pour la validation avancée
 */

import Surreal from 'surrealdb';

async function createTestQuiz() {
  console.log('🚀 Création du quiz de test avec metadata\n');
  
  const db = new Surreal();
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({ username: process.env.SURREAL_USER, password: process.env.SURREAL_PASS });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });

  try {
    // 1. Créer le quiz de test
    console.log('📝 Création du quiz...');
    const quiz = await db.create('quiz', {
      title: 'Test Questions Metadata',
      slug: 'test-metadata',
      description: 'Quiz de test pour les différents types de questions avec validation avancée (metadata)',
      isActive: true
    });
    console.log('✅ Quiz créé:', quiz);

    const matiereId = 'matiere:u8jbp4i76by5cqyqvnok'; // Histoire
    const themeId = 'theme:8ao80kcbys1dx15ncq5w'; // Antiquité

    // 2. Question 1: Année (type year)
    console.log('\n📝 Création question 1: Année (1789)...');
    await db.create('question', {
      question: 'En quelle année a eu lieu la prise de la Bastille ?',
      questionType: 'open_short',
      sampleAnswers: ['1789'],
      expectedKeywords: [],
      metadata: {
        answerType: 'year',
        maxChars: 4,
        inputType: 'number',
        inputPlaceholder: 'AAAA',
        inputHint: 'Entre une année (ex: 1789)'
      },
      explanation: 'La prise de la Bastille a eu lieu le 14 juillet 1789. C\'est un événement majeur de la Révolution française.',
      matiere_id: matiereId,
      theme_ids: [themeId],
      difficulty: 'easy',
      isActive: true,
      pos: 1
    });
    console.log('✅ Question 1 créée');

    // 3. Question 2: Nombre entier avec tolérance
    console.log('\n📝 Création question 2: Distance avec tolérance...');
    await db.create('question', {
      question: 'Quelle est la distance approximative entre Paris et Lyon en kilomètres ?',
      questionType: 'open_short',
      sampleAnswers: ['465'],
      expectedKeywords: [],
      metadata: {
        answerType: 'integer',
        inputType: 'number',
        tolerance: 10,
        toleranceType: 'percent',
        unit: 'km',
        inputPlaceholder: 'Distance en km',
        inputHint: 'Réponse acceptée à ±10%',
        nearMatchMessage: 'Tu étais proche ! La distance exacte est d\'environ 465 km.'
      },
      explanation: 'La distance entre Paris et Lyon est d\'environ 465 km par la route.',
      matiere_id: 'matiere:1ilgikfv9d2pjbpv8530', // Géographie
      difficulty: 'medium',
      isActive: true,
      pos: 2
    });
    console.log('✅ Question 2 créée');

    // 4. Question 3: Symbole chimique
    console.log('\n📝 Création question 3: Symbole chimique...');
    await db.create('question', {
      question: 'Quel est le symbole chimique de l\'or ?',
      questionType: 'open_short',
      sampleAnswers: ['Au'],
      expectedKeywords: [],
      metadata: {
        answerType: 'text',
        normalize: 'uppercase',
        maxChars: 3,
        inputPlaceholder: 'Symbole',
        inputHint: 'Ex: Fe, Ag, Cu',
        alternativeAnswers: ['AU', 'au']
      },
      explanation: 'Le symbole chimique de l\'or est Au, du latin "Aurum".',
      matiere_id: 'matiere:m84fe7jbm6ijjxofjmtf', // Sciences
      difficulty: 'easy',
      isActive: true,
      pos: 3
    });
    console.log('✅ Question 3 créée');

    // 5. Question 4: Calcul avec tolérance absolue
    console.log('\n📝 Création question 4: Calcul mathématique...');
    await db.create('question', {
      question: 'Combien font 7 × 8 ?',
      questionType: 'open_short',
      sampleAnswers: ['56'],
      expectedKeywords: [],
      metadata: {
        answerType: 'integer',
        inputType: 'number',
        inputPlaceholder: 'Résultat',
        tolerance: 0, // Pas de tolérance pour un calcul exact
        toleranceType: 'absolute'
      },
      explanation: '7 × 8 = 56. C\'est une table de multiplication classique à connaître par cœur !',
      matiere_id: 'matiere:4h1bqu84cexf8yqp0cs2', // Mathématiques
      difficulty: 'easy',
      isActive: true,
      pos: 4
    });
    console.log('✅ Question 4 créée');

    // 6. Question 5: Nombre décimal (PI)
    console.log('\n📝 Création question 5: Nombre décimal (PI)...');
    await db.create('question', {
      question: 'Quelle est la valeur de π (pi) arrondie à 2 décimales ?',
      questionType: 'open_short',
      sampleAnswers: ['3.14'],
      expectedKeywords: [],
      metadata: {
        answerType: 'float',
        inputType: 'number',
        tolerance: 0.01,
        toleranceType: 'absolute',
        inputPlaceholder: 'Valeur de π',
        inputHint: 'Arrondi à 2 décimales (ex: 3.14)',
        alternativeAnswers: ['3,14'] // Accepter virgule française
      },
      explanation: 'π (pi) ≈ 3,14159... Arrondi à 2 décimales : 3,14',
      matiere_id: 'matiere:4h1bqu84cexf8yqp0cs2', // Mathématiques
      difficulty: 'medium',
      isActive: true,
      pos: 5
    });
    console.log('✅ Question 5 créée');

    // 7. Question 6: Date de signature DDHC
    console.log('\n📝 Création question 6: Année DDHC...');
    await db.create('question', {
      question: 'En quelle année a été signée la Déclaration des Droits de l\'Homme et du Citoyen ?',
      questionType: 'open_short',
      sampleAnswers: ['1789'],
      expectedKeywords: [],
      metadata: {
        answerType: 'year',
        maxChars: 4,
        inputType: 'number',
        inputPlaceholder: 'AAAA',
        inputHint: 'Format: année sur 4 chiffres'
      },
      explanation: 'La Déclaration des Droits de l\'Homme et du Citoyen a été adoptée le 26 août 1789 par l\'Assemblée constituante.',
      matiere_id: matiereId,
      theme_ids: [themeId],
      difficulty: 'medium',
      isActive: true,
      pos: 6
    });
    console.log('✅ Question 6 créée');

    console.log('\n✅ Quiz de test créé avec succès !');
    console.log('📋 Accède au quiz via: /quiz/test-metadata');
    console.log(`
Questions créées:
1. Année de la prise de la Bastille (year, exact)
2. Distance Paris-Lyon (integer, ±10%)
3. Symbole de l'or (text, uppercase, alternatives)
4. 7 × 8 (integer, exact)
5. Valeur de π (float, ±0.01)
6. Année DDHC (year, exact)
    `);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.close();
  }
}

createTestQuiz().catch(console.error);
