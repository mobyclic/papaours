/**
 * Migration - Ajout vérification email
 */
import { connectDB } from '../src/lib/db';

async function migrate() {
  console.log('🚀 Migration - Ajout vérification email\n');
  
  const db = await connectDB();
  
  try {
    // Ajouter champ email_verified à user
    console.log('📦 Ajout champ email_verified...');
    await db.query(`
      DEFINE FIELD OVERWRITE email_verified ON user TYPE bool DEFAULT false;
    `);
    console.log('✅ Champ email_verified ajouté');

    // Créer table email_verification
    console.log('📦 Création table email_verification...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS email_verification SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE token ON email_verification TYPE string;
      DEFINE FIELD OVERWRITE user ON email_verification TYPE record<user>;
      DEFINE FIELD OVERWRITE used ON email_verification TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE created_at ON email_verification TYPE datetime DEFAULT time::now();
      DEFINE FIELD OVERWRITE expires_at ON email_verification TYPE datetime;
      
      DEFINE INDEX IF NOT EXISTS idx_verification_token ON email_verification FIELDS token UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_verification_user ON email_verification FIELDS user;
    `);
    console.log('✅ Table email_verification créée');

    // Marquer les utilisateurs existants comme vérifiés (migration legacy)
    console.log('📦 Mise à jour utilisateurs existants...');
    await db.query(`
      UPDATE user SET email_verified = true WHERE email != NONE AND email_verified = NONE
    `);
    console.log('✅ Utilisateurs existants marqués comme vérifiés');

    console.log('\n✨ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  } finally {
    await db.close();
  }
}

migrate();
