import { connectDB } from '../src/lib/db';

async function debugQuestions() {
  try {
    const db = await connectDB();
    
    console.log('\n🔍 Diagnostic des questions...\n');

    // Vérifier le quiz
    const quizResult = await db.query('SELECT * FROM quiz');
    const quiz = quizResult[0] || [];
    console.log('📚 Quiz disponibles:', quiz.map((q: any) => ({
      id: q.id,
      title: q.title,
      slug: q.slug,
      isHomepage: q.isHomepage
    })));

    // Vérifier toutes les questions
    const allQuestions = await db.query('SELECT * FROM question');
    console.log('\n📝 Total questions dans la DB:', allQuestions[0]?.length || 0);
    
    if (allQuestions[0]?.length > 0) {
      console.log('\nDétail des questions:');
      allQuestions[0].forEach((q: any, index: number) => {
        console.log(`  ${index + 1}. ${q.question.substring(0, 50)}...`);
        console.log(`     ID: ${q.id}`);
        console.log(`     quizId: ${q.quizId || 'NULL'}`);
        console.log('');
      });
    }

    // Tester le filtre avec le quiz actuel
    if (quiz.length > 0) {
      const quizId = quiz[0].id;
      console.log(`\n🔎 Test filtrage avec quizId = ${quizId}`);
      
      const filtered = await db.query(
        'SELECT * FROM question WHERE quizId = $quizId',
        { quizId: quizId }
      );
      
      console.log(`   Résultat: ${filtered[0]?.length || 0} questions trouvées`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugQuestions();
