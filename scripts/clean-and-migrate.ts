import { connectDB } from '../src/lib/db';

async function cleanAndMigrate() {
  try {
    const db = await connectDB();
    
    console.log('\n🔍 Diagnostic et nettoyage...\n');

    // Supprimer les questions invalides (sans options)
    console.log('🧹 Suppression des questions invalides...');
    const invalidQuestions = await db.query(
      'SELECT * FROM question WHERE array::len(options) < 2 OR options = NONE'
    );
    
    if (invalidQuestions[0]?.length > 0) {
      for (const q of invalidQuestions[0]) {
        await db.delete(q.id);
        console.log(`   ❌ Supprimé: ${q.id}`);
      }
    }

    // Récupérer le quiz
    const quizResult = await db.query(
      'SELECT * FROM quiz WHERE slug = $slug',
      { slug: 'familles-instruments' }
    );
    
    const quizId = quizResult[0]?.[0]?.id;
    
    if (!quizId) {
      console.log('❌ Quiz non trouvé!');
      process.exit(1);
    }

    console.log('✅ Quiz trouvé:', quizId);

    // Associer les questions valides
    console.log('\n🔗 Association des questions valides...');
    const validQuestions = await db.query(
      'SELECT * FROM question WHERE (quizId = NONE OR quizId = NULL) AND array::len(options) >= 2'
    );
    
    const questionsToUpdate = validQuestions[0] || [];
    console.log(`   Found ${questionsToUpdate.length} questions valides`);

    for (const question of questionsToUpdate) {
      await db.query(
        'UPDATE $id SET quizId = $quizId',
        { id: question.id, quizId }
      );
      console.log(`   ✅ ${question.id}`);
    }

    // Résumé final
    const finalCount = await db.query(
      'SELECT * FROM question WHERE quizId = $quizId',
      { quizId }
    );
    
    console.log('\n✅ Migration terminée!');
    console.log(`   • Questions associées: ${finalCount[0]?.length || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanAndMigrate();
