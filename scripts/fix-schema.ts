import { connectDB } from '../src/lib/db';

async function fixSchema() {
  try {
    const db = await connectDB();
    
    console.log('\n🔧 Correction du schéma...\n');

    // Supprimer et recréer la table question avec le bon type pour quizId
    console.log('1. Suppression de la table question...');
    await db.query('REMOVE TABLE IF EXISTS question');
    console.log('   ✅ Table supprimée');

    console.log('\n2. Recréation avec le bon schéma...');
    await db.query(`
      DEFINE TABLE question SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD quizId ON question TYPE record<quiz>;
      DEFINE FIELD question ON question TYPE string ASSERT $value != NONE;
      DEFINE FIELD family ON question TYPE string ASSERT $value INSIDE ['cordes', 'bois', 'cuivres', 'percussions', 'general'];
      DEFINE FIELD options ON question TYPE array ASSERT $value != NONE AND array::len($value) >= 2;
      DEFINE FIELD correctAnswer ON question TYPE number ASSERT $value != NONE AND $value >= 0;
      DEFINE FIELD explanation ON question TYPE string ASSERT $value != NONE;
      DEFINE FIELD imageUrl ON question TYPE option<string>;
      DEFINE FIELD imageCaption ON question TYPE option<string>;
      DEFINE FIELD imageCloudflareId ON question TYPE option<string>;
      DEFINE FIELD difficulty ON question TYPE string DEFAULT 'medium' ASSERT $value INSIDE ['easy', 'medium', 'hard'];
      DEFINE FIELD isActive ON question TYPE bool DEFAULT true;
      DEFINE FIELD order ON question TYPE number DEFAULT 0;
      DEFINE FIELD createdAt ON question TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON question TYPE datetime DEFAULT time::now();
      DEFINE FIELD createdBy ON question TYPE option<string>;
    `);
    console.log('   ✅ Schéma recréé avec TYPE record<quiz>');

    console.log('\n✅ Schéma corrigé ! Vous pouvez maintenant réimporter les questions.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixSchema();
