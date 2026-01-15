import { connectDB } from '../src/lib/db';

async function linkQuestionsToQuiz() {
  try {
    const db = await connectDB();
    
    console.log('\n🔗 Association des questions au quiz...\n');

    // Récupérer le quiz
    const quizResult = await db.query('SELECT * FROM quiz WHERE slug = $slug', {
      slug: 'familles-instruments'
    });
    
    const quiz = quizResult[0]?.[0];
    if (!quiz) {
      console.log('❌ Quiz non trouvé!');
      process.exit(1);
    }

    const quizId = quiz.id;
    console.log('✅ Quiz:', quizId);

    // Récupérer toutes les questions sans quizId
    const questionsResult = await db.query('SELECT * FROM question WHERE quizId = NONE OR quizId = NULL');
    const questions = questionsResult[0] || [];
    
    console.log(`\n📝 ${questions.length} questions à associer\n`);

    // Associer chaque question au quiz
    for (const question of questions) {
      await db.query(
        'UPDATE $id SET quizId = $quizId',
        { 
          id: question.id,
          quizId: quizId
        }
      );
      console.log(`   ✅ ${question.question.substring(0, 60)}...`);
    }

    // Vérification finale
    const verif = await db.query(
      'SELECT * FROM question WHERE quizId = $quizId',
      { quizId: quizId }
    );

    console.log(`\n✅ Terminé ! ${verif[0]?.length || 0} questions associées au quiz`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

linkQuestionsToQuiz();
