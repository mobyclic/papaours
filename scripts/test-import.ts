import { connectDB } from '../src/lib/db';
import { quizQuestions } from '../src/lib/quizData';

async function testImport() {
  try {
    const db = await connectDB();
    
    console.log('\n🧪 Test d\'import avec différents formats...\n');

    // Supprimer toutes les questions
    await db.query('DELETE FROM question');

    // Test 1: Format string simple
    console.log('Test 1: Format string "quiz:es9nj1fh19rjftc43d6k"');
    try {
      const q1 = await db.create('question', {
        quizId: 'quiz:es9nj1fh19rjftc43d6k',
        question: 'Test question 1',
        family: 'general',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Test',
        difficulty: 'medium',
        isActive: true,
        order: 1
      });
      console.log('   ✅ Succès avec format string');
      
      // Vérifier
      const check = await db.query('SELECT * FROM question WHERE id = $id', { id: q1[0].id });
      console.log('   quizId stocké:', check[0]?.[0]?.quizId);
      
      // Supprimer
      await db.delete(q1[0].id);
    } catch (e: any) {
      console.log('   ❌ Échec:', e.message.substring(0, 100));
    }

    // Maintenant importer toutes les questions
    console.log('\n📝 Import de toutes les questions...');
    for (const q of quizQuestions) {
      await db.create('question', {
        quizId: 'quiz:es9nj1fh19rjftc43d6k',
        question: q.question,
        family: q.family,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        imageUrl: q.image || null,
        imageCaption: q.imageCaption || null,
        difficulty: 'medium',
        isActive: true,
        order: q.id
      });
      console.log(`   ✅ ${q.question.substring(0, 50)}...`);
    }

    // Vérification finale
    const final = await db.query('SELECT * FROM question WHERE quizId = $quizId', {
      quizId: 'quiz:es9nj1fh19rjftc43d6k'
    });
    console.log(`\n✅ ${final[0]?.length || 0} questions importées et filtrables`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testImport();
