/**
 * Migration: Ajout du champ metadata aux questions
 * 
 * Le champ metadata permet de stocker des options flexibles
 * pour la validation et l'affichage des questions :
 * - answerType: 'text' | 'integer' | 'float' | 'date' | 'year' | 'regex'
 * - pattern: regex personnalisé
 * - tolerance/toleranceType: tolérance pour réponses numériques
 * - minChars/maxChars: limites de caractères
 * - inputType/inputPlaceholder/inputHint: options d'affichage
 * - normalize: transformation de la réponse
 * - alternativeAnswers: synonymes acceptés
 * - unit: unité à afficher
 */

import Surreal from 'surrealdb';

async function migrate() {
  console.log('🚀 Migration: Ajout du champ metadata aux questions\n');
  
  const db = new Surreal();
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({ username: process.env.SURREAL_USER, password: process.env.SURREAL_PASS });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });

  try {
    // 1. Ajouter le champ metadata (objet flexible)
    console.log('📝 Ajout du champ metadata à la table question...');
    await db.query(`
      DEFINE FIELD OVERWRITE metadata ON question TYPE option<object> FLEXIBLE PERMISSIONS FULL;
    `);
    console.log('✅ Champ metadata ajouté');

    // 2. Vérifier en listant quelques questions
    console.log('\n📊 Vérification...');
    const questions = await db.query(`
      SELECT id, question, questionType, metadata FROM question LIMIT 3
    `);
    console.log('Questions échantillon:', JSON.stringify(questions[0], null, 2));

    console.log('\n✅ Migration terminée avec succès !');
    console.log(`
📋 Le champ metadata supporte maintenant :
   - answerType: type de réponse ('text', 'integer', 'float', 'date', 'year', 'regex')
   - pattern: regex personnalisé pour validation
   - tolerance: tolérance numérique (ex: ±10)
   - toleranceType: 'absolute' ou 'percent'
   - minChars/maxChars: limites de caractères
   - inputType: type d'input HTML ('text', 'number', 'tel')
   - inputPlaceholder: placeholder de l'input
   - inputHint: texte d'aide
   - normalize: transformation ('lowercase', 'uppercase', 'trim')
   - alternativeAnswers: réponses alternatives acceptées
   - unit: unité à afficher (ex: 'km', '°C')
   - showExpectedAnswer: afficher la réponse après validation
   - nearMatchMessage: message si réponse proche

Exemple d'utilisation :
   UPDATE question:xxx SET metadata = {
     answerType: 'year',
     maxChars: 4,
     inputType: 'number',
     inputPlaceholder: 'AAAA'
   }
    `);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
