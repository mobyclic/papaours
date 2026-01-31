/**
 * Migration: Ajouter la table password_reset_token pour les tuteurs
 */
import { connectDB } from '../src/lib/db';

async function migrate() {
  console.log('🚀 Migration: Ajout table password_reset_token...\n');
  
  const db = await connectDB();
  
  try {
    // Table des tokens de réinitialisation de mot de passe
    await db.query(`
      DEFINE TABLE IF NOT EXISTS password_reset_token SCHEMAFULL;
      
      DEFINE FIELD user_id ON password_reset_token TYPE record<user>;
      DEFINE FIELD token ON password_reset_token TYPE string;
      DEFINE FIELD expires_at ON password_reset_token TYPE datetime;
      DEFINE FIELD used ON password_reset_token TYPE bool DEFAULT false;
      DEFINE FIELD created_at ON password_reset_token TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX idx_token ON password_reset_token FIELDS token UNIQUE;
      DEFINE INDEX idx_user ON password_reset_token FIELDS user_id;
    `);
    console.log('✅ Table password_reset_token créée');

    // Table des codes d'invitation (tuteur → apprenant)
    await db.query(`
      DEFINE TABLE IF NOT EXISTS invite_code SCHEMAFULL;
      
      DEFINE FIELD tutor_id ON invite_code TYPE record<user>;
      DEFINE FIELD code ON invite_code TYPE string;
      DEFINE FIELD student_email ON invite_code TYPE option<string>;
      DEFINE FIELD student_name ON invite_code TYPE option<string>;
      DEFINE FIELD expires_at ON invite_code TYPE datetime;
      DEFINE FIELD used ON invite_code TYPE bool DEFAULT false;
      DEFINE FIELD used_by ON invite_code TYPE option<record<user>>;
      DEFINE FIELD used_at ON invite_code TYPE option<datetime>;
      DEFINE FIELD created_at ON invite_code TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX idx_invite_code ON invite_code FIELDS code UNIQUE;
      DEFINE INDEX idx_tutor ON invite_code FIELDS tutor_id;
    `);
    console.log('✅ Table invite_code créée');

    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
