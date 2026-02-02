/**
 * Migration - Création de la table email_log
 * Pour historiser tous les emails envoyés
 */
import { connectDB } from '../src/lib/db';

async function migrate() {
  console.log('🚀 Migration - Création table email_log\n');
  
  const db = await connectDB();
  
  try {
    console.log('📦 Création table email_log...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS email_log SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE recipient ON email_log TYPE string;
      DEFINE FIELD OVERWRITE subject ON email_log TYPE string;
      DEFINE FIELD OVERWRITE email_type ON email_log TYPE string;
      DEFINE FIELD OVERWRITE status ON email_log TYPE string;
      DEFINE FIELD OVERWRITE resend_id ON email_log TYPE option<string>;
      DEFINE FIELD OVERWRITE error ON email_log TYPE option<string>;
      DEFINE FIELD OVERWRITE sent_at ON email_log TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_email_log_recipient ON email_log FIELDS recipient;
      DEFINE INDEX IF NOT EXISTS idx_email_log_type ON email_log FIELDS email_type;
      DEFINE INDEX IF NOT EXISTS idx_email_log_status ON email_log FIELDS status;
      DEFINE INDEX IF NOT EXISTS idx_email_log_date ON email_log FIELDS sent_at;
    `);
    console.log('✅ Table email_log créée');

    console.log('\n✨ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  } finally {
    await db.close();
  }
}

migrate();
