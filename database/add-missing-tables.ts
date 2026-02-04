/**
 * Script pour ajouter les tables manquantes identifiées dans l'audit
 * Tables à créer: media, audit_log
 * 
 * Usage: bun database/add-missing-tables.ts
 */

import Surreal from 'surrealdb';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement depuis .env
const envPath = join(import.meta.dir, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
}

const SURREAL_URL = env.SURREAL_URL;
const SURREAL_USER = env.SURREAL_USER;
const SURREAL_PASS = env.SURREAL_PASS;
const SURREAL_NAMESPACE = env.SURREAL_NAMESPACE;
const SURREAL_DATABASE = env.SURREAL_DATABASE;

async function getDB() {
  const db = new Surreal();
  await db.connect(`${SURREAL_URL}/rpc`);
  await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
  await db.use({ namespace: SURREAL_NAMESPACE, database: SURREAL_DATABASE });
  return db;
}

async function main() {
  console.log('🔧 Ajout des tables manquantes...');
  console.log(`   URL: ${SURREAL_URL}`);
  console.log(`   Namespace: ${SURREAL_NAMESPACE}`);
  console.log(`   Database: ${SURREAL_DATABASE}\n`);
  
  const db = await getDB();
  
  try {
    // ========================================
    // TABLE: media
    // Pour stocker les médias uploadés (images, vidéos, documents)
    // ========================================
    console.log('📦 Création de la table media...');
    
    await db.query(`
      DEFINE TABLE media TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
      
      -- Informations de base
      DEFINE FIELD title ON media TYPE string PERMISSIONS FULL;
      DEFINE FIELD filename ON media TYPE string PERMISSIONS FULL;
      DEFINE FIELD original_filename ON media TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD mime_type ON media TYPE string PERMISSIONS FULL;
      DEFINE FIELD size ON media TYPE int PERMISSIONS FULL;
      DEFINE FIELD url ON media TYPE string PERMISSIONS FULL;
      
      -- Métadonnées
      DEFINE FIELD alt_text ON media TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD caption ON media TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD description ON media TYPE option<string> PERMISSIONS FULL;
      
      -- Catégorisation
      DEFINE FIELD type ON media TYPE string DEFAULT 'image' ASSERT $value INSIDE ['image', 'video', 'audio', 'document', 'other'] PERMISSIONS FULL;
      DEFINE FIELD folder ON media TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD tags ON media TYPE option<array<string>> PERMISSIONS FULL;
      
      -- Dimensions (pour images/vidéos)
      DEFINE FIELD width ON media TYPE option<int> PERMISSIONS FULL;
      DEFINE FIELD height ON media TYPE option<int> PERMISSIONS FULL;
      DEFINE FIELD duration ON media TYPE option<int> PERMISSIONS FULL;
      
      -- Relations
      DEFINE FIELD uploaded_by ON media TYPE option<record<user | backoffice_user>> PERMISSIONS FULL;
      DEFINE FIELD used_in ON media TYPE option<array<record>> PERMISSIONS FULL;
      
      -- Timestamps
      DEFINE FIELD created_at ON media TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      DEFINE FIELD updated_at ON media TYPE option<datetime> PERMISSIONS FULL;
      
      -- Statut
      DEFINE FIELD is_active ON media TYPE bool DEFAULT true PERMISSIONS FULL;
      DEFINE FIELD is_public ON media TYPE bool DEFAULT false PERMISSIONS FULL;
      
      -- Index
      DEFINE INDEX idx_media_type ON media FIELDS type;
      DEFINE INDEX idx_media_folder ON media FIELDS folder;
      DEFINE INDEX idx_media_created ON media FIELDS created_at;
      DEFINE INDEX idx_media_filename ON media FIELDS filename;
    `);
    console.log('✅ Table media créée');
    
    // ========================================
    // TABLE: audit_log
    // Pour stocker l'historique des actions système
    // ========================================
    console.log('\n📦 Création de la table audit_log...');
    
    await db.query(`
      DEFINE TABLE audit_log TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
      
      -- Type d'événement
      DEFINE FIELD event_type ON audit_log TYPE string ASSERT $value INSIDE ['info', 'success', 'warning', 'error', 'security', 'system'] PERMISSIONS FULL;
      DEFINE FIELD action ON audit_log TYPE string PERMISSIONS FULL;
      DEFINE FIELD message ON audit_log TYPE string PERMISSIONS FULL;
      
      -- Contexte
      DEFINE FIELD entity_type ON audit_log TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD entity_id ON audit_log TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD entity_name ON audit_log TYPE option<string> PERMISSIONS FULL;
      
      -- Utilisateur
      DEFINE FIELD user_id ON audit_log TYPE option<record<user | backoffice_user>> PERMISSIONS FULL;
      DEFINE FIELD user_email ON audit_log TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD user_ip ON audit_log TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD user_agent ON audit_log TYPE option<string> PERMISSIONS FULL;
      
      -- Données supplémentaires
      DEFINE FIELD old_value ON audit_log FLEXIBLE TYPE option<object> PERMISSIONS FULL;
      DEFINE FIELD new_value ON audit_log FLEXIBLE TYPE option<object> PERMISSIONS FULL;
      DEFINE FIELD metadata ON audit_log FLEXIBLE TYPE option<object> PERMISSIONS FULL;
      
      -- Timestamp
      DEFINE FIELD created_at ON audit_log TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      
      -- Index pour requêtes performantes
      DEFINE INDEX idx_audit_type ON audit_log FIELDS event_type;
      DEFINE INDEX idx_audit_action ON audit_log FIELDS action;
      DEFINE INDEX idx_audit_entity ON audit_log FIELDS entity_type, entity_id;
      DEFINE INDEX idx_audit_user ON audit_log FIELDS user_id;
      DEFINE INDEX idx_audit_created ON audit_log FIELDS created_at;
    `);
    console.log('✅ Table audit_log créée');
    
    // ========================================
    // Vérification
    // ========================================
    console.log('\n📊 Vérification des tables...');
    
    const [mediaInfo] = await db.query('INFO FOR TABLE media');
    const [auditInfo] = await db.query('INFO FOR TABLE audit_log');
    
    const mediaFields = Object.keys((mediaInfo as any)?.fields || {}).length;
    const auditFields = Object.keys((auditInfo as any)?.fields || {}).length;
    
    console.log(`   media: ${mediaFields} champs`);
    console.log(`   audit_log: ${auditFields} champs`);
    
    // Insérer quelques logs de test
    console.log('\n📝 Insertion de logs de démonstration...');
    
    await db.query(`
      INSERT INTO audit_log [
        {
          event_type: 'system',
          action: 'table_created',
          message: 'Tables media et audit_log créées',
          entity_type: 'database',
          created_at: time::now()
        },
        {
          event_type: 'info',
          action: 'migration',
          message: 'Migration audit alignement sidebar/DB exécutée',
          entity_type: 'database',
          created_at: time::now()
        }
      ]
    `);
    console.log('✅ Logs de démonstration insérés');
    
    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.close();
  }
}

main().catch(console.error);
