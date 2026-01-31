/**
 * Migration: Système Tuteur
 * 
 * Ajoute:
 * - user_type (apprenant, tuteur, admin)
 * - password_code pour apprenants (4 chiffres)
 * - password_hash pour tuteurs (mot de passe complexe)
 * - email obligatoire pour tuteurs
 * - Table tutor_student (relation tuteur-apprenant)
 * - Table user_quiz_library (bibliothèque de quiz de l'utilisateur)
 * - Champs quiz: owner_id, visibility (public, private, tutor_only)
 * - Champs question: owner_id, is_public
 */

import Surreal from 'surrealdb';

const db = new Surreal();

async function connectDB() {
  const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
  await db.connect(`${url}/rpc`, {
    namespace: process.env.SURREAL_NAMESPACE || 'papaours',
    database: process.env.SURREAL_DATABASE || 'dbpapaours',
  });

  await db.signin({
    username: process.env.SURREAL_USER || 'rootuser',
    password: process.env.SURREAL_PASS || 'n1n@S1mone',
  });

  console.log('✅ Connected to SurrealDB');
}

async function runMigration() {
  try {
    await connectDB();

    console.log('\n🚀 Starting Tuteur System Migration...\n');

    // Helper pour ignorer les erreurs "already exists"
    async function safeQuery(query: string, description: string) {
      try {
        await db.query(query);
        console.log(`   ✅ ${description}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`   ℹ️  ${description} (already exists, skipping)`);
        } else {
          throw e;
        }
      }
    }

    // 1. Ajouter les nouveaux champs à la table user
    console.log('1️⃣  Adding new fields to user table...');
    await safeQuery(`DEFINE FIELD user_type ON user TYPE string DEFAULT 'apprenant'`, 'user_type field');
    await safeQuery(`DEFINE FIELD password_code ON user TYPE option<string>`, 'password_code field');
    await safeQuery(`DEFINE FIELD password_hash ON user TYPE option<string>`, 'password_hash field');
    await safeQuery(`DEFINE FIELD tutor_id ON user TYPE option<record<user>>`, 'tutor_id field');
    await safeQuery(`DEFINE INDEX user_type_idx ON user COLUMNS user_type`, 'user_type index');

    // 2. Créer la table tutor_student (relation tuteur-apprenant)
    console.log('2️⃣  Creating tutor_student table...');
    await safeQuery(`DEFINE TABLE tutor_student SCHEMAFULL PERMISSIONS FULL`, 'tutor_student table');
    await safeQuery(`DEFINE FIELD tutor_id ON tutor_student TYPE record<user> ASSERT $value != NONE`, 'tutor_id field');
    await safeQuery(`DEFINE FIELD student_id ON tutor_student TYPE record<user> ASSERT $value != NONE`, 'student_id field');
    await safeQuery(`DEFINE FIELD status ON tutor_student TYPE string DEFAULT 'active'`, 'status field');
    await safeQuery(`DEFINE FIELD invited_at ON tutor_student TYPE datetime DEFAULT time::now()`, 'invited_at field');
    await safeQuery(`DEFINE FIELD accepted_at ON tutor_student TYPE option<datetime>`, 'accepted_at field');
    await safeQuery(`DEFINE FIELD created_at ON tutor_student TYPE datetime DEFAULT time::now()`, 'created_at field');
    await safeQuery(`DEFINE INDEX tutor_student_unique ON tutor_student COLUMNS tutor_id, student_id UNIQUE`, 'unique index');
    await safeQuery(`DEFINE INDEX tutor_student_tutor ON tutor_student COLUMNS tutor_id`, 'tutor index');
    await safeQuery(`DEFINE INDEX tutor_student_student ON tutor_student COLUMNS student_id`, 'student index');

    // 3. Créer la table user_quiz_library (bibliothèque de quiz)
    console.log('3️⃣  Creating user_quiz_library table...');
    await safeQuery(`DEFINE TABLE user_quiz_library SCHEMAFULL PERMISSIONS FULL`, 'user_quiz_library table');
    await safeQuery(`DEFINE FIELD user_id ON user_quiz_library TYPE record<user> ASSERT $value != NONE`, 'user_id field');
    await safeQuery(`DEFINE FIELD quiz_id ON user_quiz_library TYPE record<quiz> ASSERT $value != NONE`, 'quiz_id field');
    await safeQuery(`DEFINE FIELD added_at ON user_quiz_library TYPE datetime DEFAULT time::now()`, 'added_at field');
    await safeQuery(`DEFINE FIELD is_favorite ON user_quiz_library TYPE bool DEFAULT false`, 'is_favorite field');
    await safeQuery(`DEFINE FIELD last_played_at ON user_quiz_library TYPE option<datetime>`, 'last_played_at field');
    await safeQuery(`DEFINE FIELD play_count ON user_quiz_library TYPE number DEFAULT 0`, 'play_count field');
    await safeQuery(`DEFINE INDEX user_quiz_library_unique ON user_quiz_library COLUMNS user_id, quiz_id UNIQUE`, 'unique index');
    await safeQuery(`DEFINE INDEX user_quiz_library_user ON user_quiz_library COLUMNS user_id`, 'user index');
    await safeQuery(`DEFINE INDEX user_quiz_library_favorites ON user_quiz_library COLUMNS user_id, is_favorite`, 'favorites index');

    // 4. Ajouter les champs de visibilité à la table quiz
    console.log('4️⃣  Adding visibility fields to quiz table...');
    await safeQuery(`DEFINE FIELD owner_id ON quiz TYPE option<record<user>>`, 'owner_id field');
    
    // Tous les champs quiz avec OVERWRITE pour éviter les problèmes de NONE
    try {
      await db.query(`DEFINE FIELD OVERWRITE visibility ON quiz TYPE option<string> DEFAULT 'public'`);
      console.log('   ✅ visibility field (overwritten)');
    } catch (e: any) {
      console.log('   ℹ️  visibility field error:', e.message?.slice(0, 100));
    }
    try {
      await db.query(`DEFINE FIELD OVERWRITE approved_public ON quiz TYPE option<bool> DEFAULT false`);
      console.log('   ✅ approved_public field (overwritten)');
    } catch (e: any) {
      console.log('   ℹ️  approved_public field error:', e.message?.slice(0, 100));
    }
    await safeQuery(`DEFINE FIELD approved_by ON quiz TYPE option<record<admin>>`, 'approved_by field');
    await safeQuery(`DEFINE FIELD approved_at ON quiz TYPE option<datetime>`, 'approved_at field');
    try {
      await db.query(`DEFINE FIELD OVERWRITE favorite_count ON quiz TYPE option<number> DEFAULT 0`);
      console.log('   ✅ favorite_count field (overwritten)');
    } catch (e: any) {
      console.log('   ℹ️  favorite_count field error:', e.message?.slice(0, 100));
    }
    await safeQuery(`DEFINE INDEX quiz_owner ON quiz COLUMNS owner_id`, 'owner index');
    await safeQuery(`DEFINE INDEX quiz_visibility ON quiz COLUMNS visibility`, 'visibility index');

    // 5. Ajouter les champs de propriété aux questions
    console.log('5️⃣  Adding ownership fields to question table...');
    await safeQuery(`DEFINE FIELD owner_id ON question TYPE option<record<user>>`, 'owner_id field');
    await safeQuery(`DEFINE FIELD is_public ON question TYPE bool DEFAULT true`, 'is_public field');
    await safeQuery(`DEFINE INDEX question_owner ON question COLUMNS owner_id`, 'owner index');

    // 6. Mettre à jour les utilisateurs existants
    console.log('6️⃣  Updating existing users...');
    await db.query(`UPDATE user SET user_type = 'apprenant' WHERE user_type = NONE OR user_type = ''`);
    await db.query(`UPDATE user SET user_type = 'admin' WHERE is_admin = true`);
    console.log('   ✅ Existing users updated');

    // 7. Mettre à jour les quiz existants (d'abord initialiser les champs NONE)
    console.log('7️⃣  Updating existing quizzes...');
    // Initialiser tous les champs qui pourraient être NONE
    await db.query(`UPDATE quiz SET favorite_count = 0 WHERE favorite_count = NONE`);
    await db.query(`UPDATE quiz SET approved_public = false WHERE approved_public = NONE`);
    await db.query(`UPDATE quiz SET visibility = 'public' WHERE visibility = NONE OR visibility = ''`);
    await db.query(`UPDATE quiz SET approved_public = true WHERE visibility = 'public' AND owner_id = NONE`);
    console.log('   ✅ Existing quizzes updated');

    // 8. Mettre à jour les questions existantes
    console.log('8️⃣  Updating existing questions...');
    await db.query(`UPDATE question SET is_public = true WHERE is_public = NONE`);
    console.log('   ✅ Existing questions updated');

    console.log('\n✅ Migration completed successfully!\n');

    // Afficher un résumé
    const userCount = await db.query('SELECT count() FROM user GROUP ALL');
    const quizCount = await db.query('SELECT count() FROM quiz GROUP ALL');
    const questionCount = await db.query('SELECT count() FROM question GROUP ALL');
    
    console.log('📊 Summary:');
    console.log(`   - Users: ${(userCount[0] as any)?.[0]?.count || 0}`);
    console.log(`   - Quizzes: ${(quizCount[0] as any)?.[0]?.count || 0}`);
    console.log(`   - Questions: ${(questionCount[0] as any)?.[0]?.count || 0}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

runMigration();
