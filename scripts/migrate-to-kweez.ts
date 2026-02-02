/**
 * Script de migration des données vers le nouveau namespace kweez/dbkweez
 */
import Surreal from 'surrealdb';

const SURREAL_URL = 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc';
const SURREAL_USER = 'rootuser';
const SURREAL_PASS = 'n1n@S1mone';

// Ancien namespace/database
const OLD_NS = 'papaours';
const OLD_DB = 'dbpapaours';

// Nouveau namespace/database
const NEW_NS = 'kweez';
const NEW_DB = 'dbkweez';

// Tables à migrer
const TABLES = [
  'user',
  'session',
  'quiz',
  'question',
  'option',
  'user_progress',
  'user_result',
  'user_favorite',
  'user_badge',
  'badge',
  'matiere',
  'theme',
  'classe',
  'competence',
  'donation',
  'subscription_plan',
  'user_subscription',
  'email_verification',
  'email_log',
  'password_reset',
  'establishment_class',
  'class_member',
  'tutor_student',
  'user_quiz_library'
];

async function migrate() {
  console.log('🚀 Migration vers kweez/dbkweez\n');
  
  const db = new Surreal();
  
  try {
    // Connexion
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    console.log('✅ Connecté à SurrealDB\n');

    // ==========================================
    // 1. Exporter les données de l'ancienne base
    // ==========================================
    console.log('📦 Export depuis papaours/dbpapaours...');
    await db.use({ namespace: OLD_NS, database: OLD_DB });
    
    const exportedData: Record<string, any[]> = {};
    
    for (const table of TABLES) {
      try {
        const result = await db.query(`SELECT * FROM ${table}`);
        const records = (result[0] as any[]) || [];
        if (records.length > 0) {
          exportedData[table] = records;
          console.log(`   ✓ ${table}: ${records.length} enregistrements`);
        }
      } catch (err) {
        // Table n'existe peut-être pas, on continue
      }
    }
    
    console.log(`\n📊 Total: ${Object.values(exportedData).reduce((sum, arr) => sum + arr.length, 0)} enregistrements\n`);

    // ==========================================
    // 2. Créer le schéma sur la nouvelle base
    // ==========================================
    console.log('🏗️  Configuration de kweez/dbkweez...');
    await db.use({ namespace: NEW_NS, database: NEW_DB });

    // Appliquer le schéma complet
    console.log('   Création des tables...');
    
    // Table user
    await db.query(`
      DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;
      DEFINE FIELD OVERWRITE email ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE name ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE nom ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE prenom ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE pseudo ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE password_hash ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE password_code ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE login_code ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE is_admin ON user TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE profile_type ON user TYPE string DEFAULT 'apprenant';
      DEFINE FIELD OVERWRITE tutor_slug ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE created_by_tutor ON user TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE created_by_establishment ON user TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE tutor_student_id ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE global_student_id ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE stripe_customer_id ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE theme_color ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE email_verified ON user TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE classe ON user TYPE option<record<classe>>;
      DEFINE FIELD OVERWRITE avatar ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE current_streak ON user TYPE number DEFAULT 0;
      DEFINE FIELD OVERWRITE best_streak ON user TYPE number DEFAULT 0;
      DEFINE FIELD OVERWRITE total_xp ON user TYPE number DEFAULT 0;
      DEFINE FIELD OVERWRITE level ON user TYPE number DEFAULT 1;
      DEFINE FIELD OVERWRITE created_at ON user TYPE option<datetime>;
      DEFINE FIELD OVERWRITE updated_at ON user TYPE option<datetime>;
      
      DEFINE INDEX IF NOT EXISTS idx_user_email ON user FIELDS email UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_user_tutor_slug ON user FIELDS tutor_slug UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_user_global_student ON user FIELDS global_student_id UNIQUE;
    `);

    // Table session
    await db.query(`
      DEFINE TABLE IF NOT EXISTS session SCHEMAFULL;
      DEFINE FIELD OVERWRITE token ON session TYPE string;
      DEFINE FIELD OVERWRITE user ON session TYPE record<user>;
      DEFINE FIELD OVERWRITE created_at ON session TYPE datetime DEFAULT time::now();
      DEFINE FIELD OVERWRITE expires_at ON session TYPE datetime;
      DEFINE INDEX IF NOT EXISTS idx_session_token ON session FIELDS token UNIQUE;
    `);

    // Table email_verification
    await db.query(`
      DEFINE TABLE IF NOT EXISTS email_verification SCHEMAFULL;
      DEFINE FIELD OVERWRITE token ON email_verification TYPE string;
      DEFINE FIELD OVERWRITE user ON email_verification TYPE record<user>;
      DEFINE FIELD OVERWRITE used ON email_verification TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE created_at ON email_verification TYPE datetime DEFAULT time::now();
      DEFINE FIELD OVERWRITE expires_at ON email_verification TYPE datetime;
      DEFINE INDEX IF NOT EXISTS idx_verification_token ON email_verification FIELDS token UNIQUE;
    `);

    // Table email_log
    await db.query(`
      DEFINE TABLE IF NOT EXISTS email_log SCHEMAFULL;
      DEFINE FIELD OVERWRITE recipient ON email_log TYPE string;
      DEFINE FIELD OVERWRITE subject ON email_log TYPE string;
      DEFINE FIELD OVERWRITE email_type ON email_log TYPE string;
      DEFINE FIELD OVERWRITE status ON email_log TYPE string;
      DEFINE FIELD OVERWRITE resend_id ON email_log TYPE option<string>;
      DEFINE FIELD OVERWRITE error ON email_log TYPE option<string>;
      DEFINE FIELD OVERWRITE sent_at ON email_log TYPE datetime DEFAULT time::now();
    `);

    // Table password_reset
    await db.query(`
      DEFINE TABLE IF NOT EXISTS password_reset SCHEMAFULL;
      DEFINE FIELD OVERWRITE token ON password_reset TYPE string;
      DEFINE FIELD OVERWRITE user ON password_reset TYPE record<user>;
      DEFINE FIELD OVERWRITE used ON password_reset TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE created_at ON password_reset TYPE datetime DEFAULT time::now();
      DEFINE FIELD OVERWRITE expires_at ON password_reset TYPE datetime;
      DEFINE INDEX IF NOT EXISTS idx_reset_token ON password_reset FIELDS token UNIQUE;
    `);

    // Tables quiz/questions
    await db.query(`
      DEFINE TABLE IF NOT EXISTS matiere SCHEMAFULL;
      DEFINE FIELD OVERWRITE name ON matiere TYPE string;
      DEFINE FIELD OVERWRITE slug ON matiere TYPE string;
      DEFINE FIELD OVERWRITE icon ON matiere TYPE option<string>;
      DEFINE FIELD OVERWRITE color ON matiere TYPE option<string>;
      DEFINE FIELD OVERWRITE description ON matiere TYPE option<string>;
      DEFINE FIELD OVERWRITE pos ON matiere TYPE option<number>;
      DEFINE INDEX IF NOT EXISTS idx_matiere_slug ON matiere FIELDS slug UNIQUE;

      DEFINE TABLE IF NOT EXISTS theme SCHEMAFULL;
      DEFINE FIELD OVERWRITE name ON theme TYPE string;
      DEFINE FIELD OVERWRITE slug ON theme TYPE string;
      DEFINE FIELD OVERWRITE matiere ON theme TYPE option<record<matiere>>;
      DEFINE FIELD OVERWRITE icon ON theme TYPE option<string>;
      DEFINE FIELD OVERWRITE description ON theme TYPE option<string>;
      DEFINE FIELD OVERWRITE pos ON theme TYPE option<number>;
      DEFINE INDEX IF NOT EXISTS idx_theme_slug ON theme FIELDS slug UNIQUE;

      DEFINE TABLE IF NOT EXISTS classe SCHEMAFULL;
      DEFINE FIELD OVERWRITE name ON classe TYPE string;
      DEFINE FIELD OVERWRITE slug ON classe TYPE string;
      DEFINE FIELD OVERWRITE category ON classe TYPE option<string>;
      DEFINE FIELD OVERWRITE pos ON classe TYPE option<number>;
      DEFINE INDEX IF NOT EXISTS idx_classe_slug ON classe FIELDS slug UNIQUE;

      DEFINE TABLE IF NOT EXISTS competence SCHEMAFULL;
      DEFINE FIELD OVERWRITE name ON competence TYPE string;
      DEFINE FIELD OVERWRITE slug ON competence TYPE string;
      DEFINE FIELD OVERWRITE description ON competence TYPE option<string>;
      DEFINE INDEX IF NOT EXISTS idx_competence_slug ON competence FIELDS slug UNIQUE;

      DEFINE TABLE IF NOT EXISTS quiz SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS question SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS option SCHEMALESS;
    `);

    // Tables progression
    await db.query(`
      DEFINE TABLE IF NOT EXISTS user_progress SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS user_result SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS user_favorite SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS badge SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS user_badge SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS donation SCHEMALESS;
    `);

    // Tables abonnements
    await db.query(`
      DEFINE TABLE IF NOT EXISTS subscription_plan SCHEMAFULL;
      DEFINE FIELD OVERWRITE slug ON subscription_plan TYPE string;
      DEFINE FIELD OVERWRITE name ON subscription_plan TYPE string;
      DEFINE FIELD OVERWRITE description ON subscription_plan TYPE string;
      DEFINE FIELD OVERWRITE price_monthly ON subscription_plan TYPE number;
      DEFINE FIELD OVERWRITE features ON subscription_plan TYPE array;
      DEFINE FIELD OVERWRITE max_students ON subscription_plan TYPE option<int>;
      DEFINE FIELD OVERWRITE max_tutors ON subscription_plan TYPE option<int>;
      DEFINE FIELD OVERWRITE stripe_price_id ON subscription_plan TYPE option<string>;
      DEFINE FIELD OVERWRITE is_active ON subscription_plan TYPE bool DEFAULT true;
      DEFINE FIELD OVERWRITE created_at ON subscription_plan TYPE datetime DEFAULT time::now();
      DEFINE INDEX IF NOT EXISTS idx_plan_slug ON subscription_plan FIELDS slug UNIQUE;

      DEFINE TABLE IF NOT EXISTS user_subscription SCHEMAFULL;
      DEFINE FIELD OVERWRITE user_id ON user_subscription TYPE record<user>;
      DEFINE FIELD OVERWRITE plan_id ON user_subscription TYPE record<subscription_plan>;
      DEFINE FIELD OVERWRITE status ON user_subscription TYPE string;
      DEFINE FIELD OVERWRITE stripe_subscription_id ON user_subscription TYPE option<string>;
      DEFINE FIELD OVERWRITE stripe_customer_id ON user_subscription TYPE option<string>;
      DEFINE FIELD OVERWRITE current_period_start ON user_subscription TYPE option<datetime>;
      DEFINE FIELD OVERWRITE current_period_end ON user_subscription TYPE option<datetime>;
      DEFINE FIELD OVERWRITE cancel_at_period_end ON user_subscription TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE extra_tutors ON user_subscription TYPE int DEFAULT 0;
      DEFINE FIELD OVERWRITE created_at ON user_subscription TYPE datetime DEFAULT time::now();
      DEFINE FIELD OVERWRITE updated_at ON user_subscription TYPE datetime DEFAULT time::now();
    `);

    // Tables établissement
    await db.query(`
      DEFINE TABLE IF NOT EXISTS establishment_class SCHEMAFULL;
      DEFINE FIELD OVERWRITE establishment ON establishment_class TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE establishment_id ON establishment_class TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE name ON establishment_class TYPE string;
      DEFINE FIELD OVERWRITE description ON establishment_class TYPE option<string>;
      DEFINE FIELD OVERWRITE tutor ON establishment_class TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE level ON establishment_class TYPE option<string>;
      DEFINE FIELD OVERWRITE school_year ON establishment_class TYPE option<string>;
      DEFINE FIELD OVERWRITE created_at ON establishment_class TYPE datetime DEFAULT time::now();

      DEFINE TABLE IF NOT EXISTS class_member SCHEMAFULL;
      DEFINE FIELD OVERWRITE class ON class_member TYPE record<establishment_class>;
      DEFINE FIELD OVERWRITE user ON class_member TYPE record<user>;
      DEFINE FIELD OVERWRITE role ON class_member TYPE option<string>;
      DEFINE FIELD OVERWRITE joined_at ON class_member TYPE datetime DEFAULT time::now();

      DEFINE TABLE IF NOT EXISTS tutor_student SCHEMALESS;
      DEFINE TABLE IF NOT EXISTS user_quiz_library SCHEMALESS;
    `);

    console.log('   ✓ Schéma créé\n');

    // ==========================================
    // 3. Importer les données
    // ==========================================
    console.log('📥 Import des données...');
    
    for (const [table, records] of Object.entries(exportedData)) {
      if (records.length === 0) continue;
      
      let imported = 0;
      for (const record of records) {
        try {
          // Extraire l'ID original
          const recordId = record.id?.toString() || record.id;
          const cleanId = recordId?.includes(':') ? recordId.split(':')[1] : recordId;
          
          // Supprimer l'id du record pour le recréer
          const { id, ...data } = record;
          
          // Créer avec le même ID
          await db.query(`CREATE type::thing($table, $id) CONTENT $data`, {
            table,
            id: cleanId,
            data
          });
          imported++;
        } catch (err) {
          // Ignorer les erreurs de duplication
        }
      }
      console.log(`   ✓ ${table}: ${imported}/${records.length} importés`);
    }

    console.log('\n✨ Migration terminée avec succès !');
    console.log('\n📝 N\'oublie pas de mettre à jour le .env avec:');
    console.log('   SURREAL_NAMESPACE=kweez');
    console.log('   SURREAL_DATABASE=dbkweez');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  } finally {
    await db.close();
  }
}

migrate();
