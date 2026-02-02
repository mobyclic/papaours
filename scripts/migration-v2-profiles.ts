/**
 * Migration V2 - Refonte complète du système utilisateur
 * 
 * Nouveaux concepts :
 * - 3 profils : apprenant (gratuit), tuteur (5€/mois), établissement (20€/mois)
 * - Abonnements Stripe
 * - Apprenants créés par tuteur (login via code 4 chiffres)
 * - Supports pédagogiques
 * - Classes pour établissements
 */
import { connectDB } from '../src/lib/db';

async function migrate() {
  console.log('🚀 Migration V2 - Refonte profils et abonnements\n');
  
  const db = await connectDB();
  
  try {
    // ================================================
    // 1. TABLE SUBSCRIPTION_PLAN - Plans d'abonnement
    // ================================================
    console.log('📦 Création table subscription_plan...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS subscription_plan SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE slug ON subscription_plan TYPE string;
      DEFINE FIELD OVERWRITE name ON subscription_plan TYPE string;
      DEFINE FIELD OVERWRITE description ON subscription_plan TYPE string;
      DEFINE FIELD OVERWRITE price_monthly ON subscription_plan TYPE number;
      DEFINE FIELD OVERWRITE features ON subscription_plan TYPE array<string>;
      DEFINE FIELD OVERWRITE max_students ON subscription_plan TYPE option<int>;
      DEFINE FIELD OVERWRITE max_tutors ON subscription_plan TYPE option<int>;
      DEFINE FIELD OVERWRITE stripe_price_id ON subscription_plan TYPE option<string>;
      DEFINE FIELD OVERWRITE is_active ON subscription_plan TYPE bool DEFAULT true;
      DEFINE FIELD OVERWRITE created_at ON subscription_plan TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_plan_slug ON subscription_plan FIELDS slug UNIQUE;
    `);
    console.log('✅ Table subscription_plan créée');

    // ================================================
    // 2. TABLE USER_SUBSCRIPTION - Abonnements utilisateurs
    // ================================================
    console.log('📦 Création table user_subscription...');
    await db.query(`
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
      
      DEFINE INDEX IF NOT EXISTS idx_sub_user ON user_subscription FIELDS user_id;
      DEFINE INDEX IF NOT EXISTS idx_sub_stripe ON user_subscription FIELDS stripe_subscription_id;
    `);
    console.log('✅ Table user_subscription créée');

    // ================================================
    // 3. MODIFICATION TABLE USER
    // ================================================
    console.log('📦 Modification table user...');
    await db.query(`
      DEFINE FIELD OVERWRITE profile_type ON user TYPE string DEFAULT 'apprenant';
      DEFINE FIELD OVERWRITE tutor_slug ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE created_by_tutor ON user TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE tutor_student_id ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE global_student_id ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE login_code ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE created_by_establishment ON user TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE email ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE password_hash ON user TYPE option<string>;
      DEFINE FIELD OVERWRITE stripe_customer_id ON user TYPE option<string>;
      
      DEFINE INDEX IF NOT EXISTS idx_user_tutor_slug ON user FIELDS tutor_slug UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_user_global_student ON user FIELDS global_student_id UNIQUE;
    `);
    console.log('✅ Table user modifiée');

    // ================================================
    // 4. TABLE ESTABLISHMENT_CLASS - Classes d'établissement
    // ================================================
    console.log('📦 Création table establishment_class...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS establishment_class SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE establishment_id ON establishment_class TYPE record<user>;
      DEFINE FIELD OVERWRITE name ON establishment_class TYPE string;
      DEFINE FIELD OVERWRITE description ON establishment_class TYPE option<string>;
      DEFINE FIELD OVERWRITE level ON establishment_class TYPE option<string>;
      DEFINE FIELD OVERWRITE school_year ON establishment_class TYPE option<string>;
      DEFINE FIELD OVERWRITE created_at ON establishment_class TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_class_establishment ON establishment_class FIELDS establishment_id;
    `);
    console.log('✅ Table establishment_class créée');

    // ================================================
    // 5. TABLE CLASS_MEMBER - Membres d'une classe
    // ================================================
    console.log('📦 Création table class_member...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS class_member SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE class_id ON class_member TYPE record<establishment_class>;
      DEFINE FIELD OVERWRITE user_id ON class_member TYPE record<user>;
      DEFINE FIELD OVERWRITE role ON class_member TYPE string DEFAULT 'student';
      DEFINE FIELD OVERWRITE joined_at ON class_member TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_class_member ON class_member FIELDS class_id, user_id UNIQUE;
    `);
    console.log('✅ Table class_member créée');

    // ================================================
    // 6. TABLE SUPPORT - Supports pédagogiques
    // ================================================
    console.log('📦 Création table support...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS support SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE title ON support TYPE string;
      DEFINE FIELD OVERWRITE slug ON support TYPE string;
      DEFINE FIELD OVERWRITE description ON support TYPE option<string>;
      DEFINE FIELD OVERWRITE content ON support TYPE option<string>;
      DEFINE FIELD OVERWRITE matiere_id ON support TYPE option<record<matiere>>;
      DEFINE FIELD OVERWRITE owner_id ON support TYPE option<record<user>>;
      DEFINE FIELD OVERWRITE visibility ON support TYPE string DEFAULT 'private';
      DEFINE FIELD OVERWRITE is_published ON support TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE created_at ON support TYPE datetime DEFAULT time::now();
      DEFINE FIELD OVERWRITE updated_at ON support TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_support_slug ON support FIELDS slug;
      DEFINE INDEX IF NOT EXISTS idx_support_owner ON support FIELDS owner_id;
    `);
    console.log('✅ Table support créée');

    // ================================================
    // 7. TABLE SUPPORT_MEDIA - Médias des supports
    // ================================================
    console.log('📦 Création table support_media...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS support_media SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE support_id ON support_media TYPE record<support>;
      DEFINE FIELD OVERWRITE media_type ON support_media TYPE string;
      DEFINE FIELD OVERWRITE url ON support_media TYPE string;
      DEFINE FIELD OVERWRITE filename ON support_media TYPE option<string>;
      DEFINE FIELD OVERWRITE size_bytes ON support_media TYPE option<int>;
      DEFINE FIELD OVERWRITE mime_type ON support_media TYPE option<string>;
      DEFINE FIELD OVERWRITE position ON support_media TYPE int DEFAULT 0;
      DEFINE FIELD OVERWRITE created_at ON support_media TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_support_media ON support_media FIELDS support_id;
    `);
    console.log('✅ Table support_media créée');

    // ================================================
    // 8. TABLE SUPPORT_THEME - Thèmes des supports (many-to-many)
    // ================================================
    console.log('📦 Création table support_theme...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS support_theme SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE support_id ON support_theme TYPE record<support>;
      DEFINE FIELD OVERWRITE theme_id ON support_theme TYPE record<theme>;
      
      DEFINE INDEX IF NOT EXISTS idx_support_theme ON support_theme FIELDS support_id, theme_id UNIQUE;
    `);
    console.log('✅ Table support_theme créée');

    // ================================================
    // 9. TABLE EXAM - Examens en ligne (établissements)
    // ================================================
    console.log('📦 Création table exam...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS exam SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE title ON exam TYPE string;
      DEFINE FIELD OVERWRITE description ON exam TYPE option<string>;
      DEFINE FIELD OVERWRITE establishment_id ON exam TYPE record<user>;
      DEFINE FIELD OVERWRITE class_id ON exam TYPE option<record<establishment_class>>;
      DEFINE FIELD OVERWRITE quiz_id ON exam TYPE record<quiz>;
      DEFINE FIELD OVERWRITE start_at ON exam TYPE datetime;
      DEFINE FIELD OVERWRITE end_at ON exam TYPE datetime;
      DEFINE FIELD OVERWRITE duration_minutes ON exam TYPE option<int>;
      DEFINE FIELD OVERWRITE is_active ON exam TYPE bool DEFAULT true;
      DEFINE FIELD OVERWRITE shuffle_questions ON exam TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE shuffle_options ON exam TYPE bool DEFAULT false;
      DEFINE FIELD OVERWRITE show_results ON exam TYPE bool DEFAULT true;
      DEFINE FIELD OVERWRITE created_at ON exam TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX IF NOT EXISTS idx_exam_establishment ON exam FIELDS establishment_id;
      DEFINE INDEX IF NOT EXISTS idx_exam_class ON exam FIELDS class_id;
    `);
    console.log('✅ Table exam créée');

    // ================================================
    // 10. TABLE EXAM_RESULT - Résultats d'examen
    // ================================================
    console.log('📦 Création table exam_result...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS exam_result SCHEMAFULL;
      
      DEFINE FIELD OVERWRITE exam_id ON exam_result TYPE record<exam>;
      DEFINE FIELD OVERWRITE user_id ON exam_result TYPE record<user>;
      DEFINE FIELD OVERWRITE started_at ON exam_result TYPE datetime;
      DEFINE FIELD OVERWRITE completed_at ON exam_result TYPE option<datetime>;
      DEFINE FIELD OVERWRITE score ON exam_result TYPE option<number>;
      DEFINE FIELD OVERWRITE max_score ON exam_result TYPE option<number>;
      DEFINE FIELD OVERWRITE answers ON exam_result TYPE option<object>;
      
      DEFINE INDEX IF NOT EXISTS idx_exam_result ON exam_result FIELDS exam_id, user_id UNIQUE;
    `);
    console.log('✅ Table exam_result créée');

    // ================================================
    // 11. INSERTION DES PLANS D'ABONNEMENT
    // ================================================
    console.log('📦 Insertion des plans d\'abonnement...');
    
    // Supprimer les anciens plans incomplets et recréer
    await db.query(`DELETE FROM subscription_plan`);
    await db.query(`
        CREATE subscription_plan SET
          slug = 'free',
          name = 'Apprenant',
          description = 'Accès gratuit à tous les quiz publics',
          price_monthly = 0,
          features = ['Accès illimité aux quiz publics', 'Suivi de progression', 'Badges et récompenses'],
          max_students = 0,
          max_tutors = 0,
          is_active = true;
        
        CREATE subscription_plan SET
          slug = 'tutor',
          name = 'Tuteur',
          description = 'Créez et gérez vos propres apprenants',
          price_monthly = 500,
          features = ['Tout le plan Apprenant', 'Créer jusqu\\'à 5 apprenants', 'Créer vos propres quiz', 'Suivi de progression des apprenants', 'Page tuteur personnalisée'],
          max_students = 5,
          max_tutors = 0,
          is_active = true;
        
        CREATE subscription_plan SET
          slug = 'establishment',
          name = 'Établissement',
          description = 'Solution complète pour les écoles',
          price_monthly = 2000,
          features = ['Tout le plan Tuteur', 'Créer des tuteurs illimités', 'Gestion des classes', 'Examens en ligne', 'Statistiques avancées', '5 tuteurs inclus, +5€/tuteur supplémentaire'],
          max_students = 0,
          max_tutors = 5,
          is_active = true;
      `);
    console.log('✅ Plans d\'abonnement créés');

    // ================================================
    // 12. MIGRATION DES UTILISATEURS EXISTANTS
    // ================================================
    console.log('📦 Migration des utilisateurs existants...');
    // Juste mettre à jour profile_type, ne pas toucher password_hash (option<string> accepte NONE)
    await db.query(`
      UPDATE user SET 
        profile_type = 'apprenant'
      WHERE profile_type = NONE OR profile_type = ''
    `);
    console.log('✅ Utilisateurs existants migrés vers profil apprenant');

    console.log('\n✅ Migration V2 terminée avec succès!');
    console.log('\n📋 Résumé des tables créées/modifiées:');
    console.log('   - subscription_plan (plans d\'abonnement)');
    console.log('   - user_subscription (abonnements utilisateurs)');
    console.log('   - user (nouveaux champs: profile_type, tutor_slug, etc.)');
    console.log('   - establishment_class (classes d\'établissement)');
    console.log('   - class_member (membres de classe)');
    console.log('   - support (supports pédagogiques)');
    console.log('   - support_media (médias des supports)');
    console.log('   - support_theme (thèmes des supports)');
    console.log('   - exam (examens en ligne)');
    console.log('   - exam_result (résultats d\'examen)');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
