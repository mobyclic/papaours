import { connectDB } from '../src/lib/db';
import { quizQuestions } from '../src/lib/quizData';

async function resetAndImport() {
  try {
    const db = await connectDB();
    
    console.log('\n🔄 Réinitialisation et réimport...\n');

    // Récupérer le quiz
    const quizResult = await db.query('SELECT * FROM quiz WHERE slug = $slug', {
      slug: 'familles-instruments'
    });
    
    const quiz = quizResult[0]?.[0];
    if (!quiz) {
      console.log('❌ Quiz non trouvé!');
      process.exit(1);
    }

    const quizId = quiz.id;  // Utiliser directement le RecordId
    console.log('✅ Quiz:', quizId);

    // Supprimer toutes les questions
    console.log('\n🗑️  Suppression des questions existantes...');
    await db.query('DELETE FROM question');
    console.log('   ✅ Questions supprimées');

    // Réimporter avec le quizId
    console.log('\n📝 Réimport des questions...');
    let count = 0;
    
    for (const q of quizQuestions) {
      await db.create('question', {
        quizId: quizId,
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
      
      count++;
      console.log(`   ✅ ${count}/${quizQuestions.length} - ${q.question.substring(0, 50)}...`);
    }

    console.log(`\n✅ ${count} questions importées avec succès !`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetAndImport();
