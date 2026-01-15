import { connectDB } from '../src/lib/db';
import { quizQuestions } from '../src/lib/quizData';

async function reimportQuestions() {
  try {
    const db = await connectDB();
    
    console.log('\n🔄 Réimport des questions...\n');

    // Récupérer le quiz
    const quizResult = await db.query(
      'SELECT * FROM quiz WHERE slug = $slug',
      { slug: 'familles-instruments' }
    );
    
    const quiz = quizResult[0]?.[0];
    
    if (!quiz) {
      console.log('❌ Quiz non trouvé!');
      process.exit(1);
    }

    const quizId = `quiz:${quiz.id.id}`;
    console.log('✅ Quiz:', quizId);

    // Importer les questions
    console.log('\n📝 Import des questions...');
    let count = 0;
    
    for (const q of quizQuestions) {
      const created = await db.create('question', {
        quizId: quizId,
        question: q.question,
        family: q.family,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        imageUrl: q.image,
        imageCaption: q.imageCaption,
        difficulty: 'medium',
        isActive: true,
        order: q.id
      });
      
      count++;
      console.log(`   ✅ ${count}/${quizQuestions.length} - ${q.question.substring(0, 40)}...`);
    }

    console.log(`\n✅ ${count} questions importées dans le quiz "${quiz.title}"`);
    console.log(`\n🌐 Accès:`);
    console.log(`   • Homepage: http://localhost:5173/`);
    console.log(`   • Quiz: http://localhost:5173/quiz`);
    console.log(`   • Admin: http://localhost:5173/admin/quiz`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

reimportQuestions();
