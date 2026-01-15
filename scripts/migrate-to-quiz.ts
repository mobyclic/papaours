import { connectDB } from '../src/lib/db';

async function migrateToQuiz() {
  try {
    const db = await connectDB();
    
    console.log('\n🔄 Migration vers le système de quiz...\n');

    // 1. Créer le quiz "Les familles d'instruments"
    console.log('📝 Création du quiz principal...');
    
    const existingQuiz = await db.query(
      'SELECT * FROM quiz WHERE slug = $slug',
      { slug: 'familles-instruments' }
    );

    let quizId;
    
    if (existingQuiz[0]?.length > 0) {
      quizId = existingQuiz[0][0].id;
      console.log('✅ Quiz existe déjà:', quizId);
    } else {
      const quiz = await db.create('quiz', {
        title: 'Les familles d\'instruments & l\'orchestre symphonique',
        description: 'Découvrez les grandes familles d\'instruments de l\'orchestre symphonique : les cordes, les bois, les cuivres et les percussions.',
        slug: 'familles-instruments',
        isHomepage: true,
        isActive: true,
        questionType: 'qcm',
        order: 1
      });
      
      quizId = Array.isArray(quiz) ? quiz[0].id : quiz.id;
      console.log('✅ Quiz créé:', quizId);
    }

    // 2. Récupérer toutes les questions sans quizId
    console.log('\n📋 Récupération des questions existantes...');
    const questions = await db.query(
      'SELECT * FROM question WHERE quizId = NONE OR quizId = NULL'
    );
    
    const questionsToUpdate = questions[0] || [];
    console.log(`   Found ${questionsToUpdate.length} questions à migrer`);

    // 3. Associer toutes les questions au quiz
    if (questionsToUpdate.length > 0) {
      console.log('\n🔗 Association des questions au quiz...');
      
      for (const question of questionsToUpdate) {
        await db.query(
          'UPDATE $id SET quizId = $quizId',
          { id: question.id, quizId }
        );
        console.log(`   ✅ ${question.id} → ${quizId}`);
      }
    } else {
      console.log('   ℹ️  Aucune question à migrer');
    }

    // 4. Afficher le résumé
    console.log('\n📊 Résumé de la migration:');
    const allQuiz = await db.query('SELECT * FROM quiz');
    const allQuestions = await db.query('SELECT * FROM question WHERE quizId = $quizId', { quizId });
    
    console.log(`   • Quiz: ${allQuiz[0]?.length || 0}`);
    console.log(`   • Questions liées: ${allQuestions[0]?.length || 0}`);
    
    console.log('\n✅ Migration terminée!\n');
    console.log('🌐 Le quiz est maintenant accessible via:');
    console.log(`   • Homepage: http://localhost:5173/`);
    console.log(`   • Quiz direct: http://localhost:5173/quiz/${quizId.split(':')[1]}`);
    console.log(`   • Admin: http://localhost:5173/admin/quiz`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de migration:', error);
    process.exit(1);
  }
}

migrateToQuiz();
