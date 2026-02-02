/**
 * Migration pour le système d'abonnements
 * 
 * Types d'abonnements :
 * - free : Apprenant gratuit (par défaut)
 * - tutor : Tuteur (5€/mois)
 * - tutor_vip : Tuteur VIP (gratuit, attribué par admin)
 * - establishment : Établissement (20€/mois)
 * - establishment_vip : Établissement VIP (gratuit, attribué par admin)
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'rootuser';
const SURREAL_PASS = process.env.SURREAL_PASS || 'n1n@S1mone';
const SURREAL_NS = process.env.SURREAL_NAMESPACE || 'kweez';
const SURREAL_DB = process.env.SURREAL_DATABASE || 'dbkweez';

async function migrate() {
  const db = new Surreal();
  
  try {
    console.log('🔌 Connexion à SurrealDB...');
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    console.log('✅ Connecté à SurrealDB');

    // 1. Créer la table subscription_plan pour stocker les plans
    console.log('\n📋 Création de la table subscription_plan...');
    try {
      await db.query(`
        DEFINE TABLE IF NOT EXISTS subscription_plan SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD IF NOT EXISTS code ON subscription_plan TYPE string;
        DEFINE FIELD IF NOT EXISTS name ON subscription_plan TYPE string;
        DEFINE FIELD IF NOT EXISTS description ON subscription_plan TYPE string;
        DEFINE FIELD IF NOT EXISTS price_monthly ON subscription_plan TYPE number;
        DEFINE FIELD IF NOT EXISTS features ON subscription_plan TYPE array<string>;
        DEFINE FIELD IF NOT EXISTS is_vip ON subscription_plan TYPE bool DEFAULT false;
        DEFINE FIELD IF NOT EXISTS max_students ON subscription_plan TYPE option<number>;
        DEFINE FIELD IF NOT EXISTS is_active ON subscription_plan TYPE bool DEFAULT true;
        DEFINE FIELD IF NOT EXISTS created_at ON subscription_plan TYPE datetime DEFAULT time::now();
        DEFINE INDEX IF NOT EXISTS subscription_plan_code ON subscription_plan COLUMNS code UNIQUE;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table subscription_plan existe déjà');
    }

    // 2. Insérer les plans d'abonnement (upsert)
    console.log('\n📝 Insertion des plans d\'abonnement...');
    
    // Plan gratuit (apprenant)
    try {
      await db.query(`
        UPSERT subscription_plan:free SET
          code = 'free',
          name = 'Apprenant',
          description = 'Accès gratuit pour les apprenants',
          price_monthly = 0,
          features = ['Accès à tous les quiz', 'Suivi de progression', 'Badges et récompenses'],
          is_vip = false,
          max_students = NONE,
          is_active = true
      `);
    } catch { console.log('  - Plan free existe déjà'); }

    // Plan Tuteur
    try {
      await db.query(`
        UPSERT subscription_plan:tutor SET
          code = 'tutor',
          name = 'Tuteur',
          description = 'Pour les parents et tuteurs',
          price_monthly = 5,
          features = ['Toutes les fonctionnalités Apprenant', 'Ajout d\\'apprenants', 'Tableau de bord tuteur', 'Suivi détaillé des apprenants', 'Rapports de progression'],
          is_vip = false,
          max_students = 5,
          is_active = true
      `);
    } catch { console.log('  - Plan tutor existe déjà'); }

    // Plan Tuteur VIP
    try {
      await db.query(`
        UPSERT subscription_plan:tutor_vip SET
          code = 'tutor_vip',
          name = 'Tuteur VIP',
          description = 'Tuteur gratuit (attribué par admin)',
          price_monthly = 0,
          features = ['Toutes les fonctionnalités Tuteur', 'Gratuit à vie', 'Support prioritaire'],
          is_vip = true,
          max_students = 10,
          is_active = true
      `);
    } catch { console.log('  - Plan tutor_vip existe déjà'); }

    // Plan Établissement
    try {
      await db.query(`
        UPSERT subscription_plan:establishment SET
          code = 'establishment',
          name = 'Établissement',
          description = 'Pour les écoles et établissements',
          price_monthly = 20,
          features = ['Toutes les fonctionnalités Tuteur', 'Gestion multi-classes', 'Import CSV d\\'élèves', 'Statistiques établissement', 'Personnalisation'],
          is_vip = false,
          max_students = 100,
          is_active = true
      `);
    } catch { console.log('  - Plan establishment existe déjà'); }

    // Plan Établissement VIP
    try {
      await db.query(`
        UPSERT subscription_plan:establishment_vip SET
          code = 'establishment_vip',
          name = 'Établissement VIP',
          description = 'Établissement gratuit (attribué par admin)',
          price_monthly = 0,
          features = ['Toutes les fonctionnalités Établissement', 'Gratuit à vie', 'Support prioritaire', 'Élèves illimités'],
          is_vip = true,
          max_students = NONE,
          is_active = true
      `);
    } catch { console.log('  - Plan establishment_vip existe déjà'); }

    // 3. Ajouter les champs d'abonnement à la table user
    console.log('\n👤 Ajout des champs d\'abonnement à la table user...');
    await db.query(`
      DEFINE FIELD IF NOT EXISTS subscription_plan ON user TYPE option<string> DEFAULT 'free';
      DEFINE FIELD IF NOT EXISTS subscription_started_at ON user TYPE option<datetime>;
      DEFINE FIELD IF NOT EXISTS subscription_expires_at ON user TYPE option<datetime>;
      DEFINE FIELD IF NOT EXISTS subscription_auto_renew ON user TYPE bool DEFAULT true;
      DEFINE FIELD IF NOT EXISTS subscription_assigned_by ON user TYPE option<record<user>>;
      DEFINE FIELD IF NOT EXISTS subscription_history ON user FLEXIBLE TYPE option<array>;
    `);

    // 4. Créer la table subscription_transaction pour l'historique des paiements
    console.log('\n💳 Création de la table subscription_transaction...');
    try {
      await db.query(`
        DEFINE TABLE IF NOT EXISTS subscription_transaction SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD IF NOT EXISTS user ON subscription_transaction TYPE record<user>;
        DEFINE FIELD IF NOT EXISTS plan ON subscription_transaction TYPE string;
        DEFINE FIELD IF NOT EXISTS amount ON subscription_transaction TYPE number;
        DEFINE FIELD IF NOT EXISTS currency ON subscription_transaction TYPE string DEFAULT 'EUR';
        DEFINE FIELD IF NOT EXISTS status ON subscription_transaction TYPE string;
        DEFINE FIELD IF NOT EXISTS payment_method ON subscription_transaction TYPE option<string>;
        DEFINE FIELD IF NOT EXISTS payment_id ON subscription_transaction TYPE option<string>;
        DEFINE FIELD IF NOT EXISTS period_start ON subscription_transaction TYPE datetime;
        DEFINE FIELD IF NOT EXISTS period_end ON subscription_transaction TYPE datetime;
        DEFINE FIELD IF NOT EXISTS created_at ON subscription_transaction TYPE datetime DEFAULT time::now();
        DEFINE INDEX IF NOT EXISTS subscription_transaction_user ON subscription_transaction COLUMNS user;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table subscription_transaction existe déjà');
    }

    // 5. Mettre à jour les utilisateurs existants avec le plan gratuit
    console.log('\n🔄 Mise à jour des utilisateurs existants...');
    await db.query(`
      UPDATE user SET 
        subscription_plan = 'free',
        subscription_auto_renew = true
      WHERE subscription_plan IS NONE OR subscription_plan = NONE
    `);

    console.log('\n✅ Migration terminée avec succès !');
    
    // Afficher les plans créés
    const [plans] = await db.query('SELECT code, name, price_monthly, is_vip FROM subscription_plan ORDER BY price_monthly');
    console.log('\n📋 Plans d\'abonnement créés :');
    console.table(plans);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
