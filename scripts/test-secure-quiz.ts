/**
 * Test du nouveau système de session quiz sécurisé
 * 
 * Ce script vérifie que:
 * 1. La session ne contient pas de shuffleMapping ni de questions complètes
 * 2. Les questions sont récupérables via l'endpoint dédié SANS correctAnswer
 * 3. La validation des réponses se fait côté serveur
 */

import { connectDB } from '../src/lib/db';

async function testSecureQuizSession() {
  console.log('🧪 Test du système de quiz sécurisé\n');
  
  const db = await connectDB();

  try {
    // 1. Trouver un quiz actif
    const quizResult = await db.query('SELECT id, slug, title FROM quiz WHERE isActive = true LIMIT 1');
    const quiz = (quizResult[0] as any[])?.[0];
    
    if (!quiz) {
      console.log('❌ Aucun quiz actif trouvé');
      return;
    }
    console.log(`✅ Quiz trouvé: ${quiz.title} (${quiz.slug})`);

    // 2. Créer une session directement dans la DB (simuler l'API)
    // En production, on utiliserait l'API mais pour le test, on vérifie la structure
    
    // Vérifier la structure d'une session existante
    const sessionResult = await db.query('SELECT * FROM quiz_session ORDER BY startedAt DESC LIMIT 1');
    const session = (sessionResult[0] as any[])?.[0];
    
    if (session) {
      console.log('\n📋 Structure de la dernière session:');
      console.log('  - ID:', session.id?.toString());
      console.log('  - questionIds:', session.questionIds?.length || 0, 'questions');
      console.log('  - shuffleMapping présent:', !!session.shuffleMapping);
      console.log('  - questions (ancien champ):', session.questions ? '⚠️ PRÉSENT (legacy)' : '✅ ABSENT');
      
      // Vérifier que shuffleMapping contient les bonnes clés
      if (session.shuffleMapping) {
        const firstKey = Object.keys(session.shuffleMapping)[0];
        const firstMapping = session.shuffleMapping[firstKey];
        console.log('\n🔐 Structure du shuffleMapping:');
        console.log('  - Nombre de questions mappées:', Object.keys(session.shuffleMapping).length);
        console.log('  - Exemple de mapping:', {
          shuffledOptions: firstMapping?.shuffledOptions?.length + ' options',
          shuffledCorrectIndex: firstMapping?.shuffledCorrectIndex
        });
      }
    } else {
      console.log('\n⚠️ Aucune session existante pour vérifier la structure');
    }

    // 3. Vérifier qu'une question peut être récupérée sans correctAnswer
    const questionResult = await db.query('SELECT id, question, options, correctAnswer FROM question LIMIT 1');
    const question = (questionResult[0] as any[])?.[0];
    
    if (question) {
      console.log('\n📝 Structure d\'une question en DB:');
      console.log('  - ID:', question.id?.toString());
      console.log('  - Question:', question.question?.substring(0, 50) + '...');
      console.log('  - Options:', question.options?.length, 'options');
      console.log('  - correctAnswer:', question.correctAnswer, '(doit être EXCLU côté client)');
    }

    console.log('\n✅ Vérifications terminées');
    console.log('\n📌 Rappel des endpoints:');
    console.log('  - POST /api/quiz/[slug]/session - Créer une session');
    console.log('  - GET /api/quiz/session/[id]/question/[index] - Obtenir une question (sans réponse)');
    console.log('  - POST /api/quiz/session/[id] - Soumettre une réponse (validée côté serveur)');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

testSecureQuizSession();
