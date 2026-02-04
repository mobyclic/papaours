/**
 * Script pour créer la table organization
 * Gère les structures : Groupe, Réseau, Campus
 * 
 * Usage: bun database/add-organization-table.ts
 */

import Surreal from 'surrealdb';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
const envPath = join(import.meta.dir, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
}

async function main() {
  console.log('🔧 Création de la table organization...\n');
  
  const db = new Surreal();
  await db.connect(`${env.SURREAL_URL}/rpc`);
  await db.signin({ username: env.SURREAL_USER, password: env.SURREAL_PASS });
  await db.use({ namespace: env.SURREAL_NAMESPACE, database: env.SURREAL_DATABASE });
  
  try {
    // ========================================
    // TABLE: organization
    // Hiérarchie : Groupe > Réseau > Campus
    // ========================================
    console.log('📦 Création de la table organization...');
    
    await db.query(`
      DEFINE TABLE organization TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
      
      -- Informations de base
      DEFINE FIELD name ON organization TYPE string PERMISSIONS FULL;
      DEFINE FIELD slug ON organization TYPE string PERMISSIONS FULL;
      DEFINE FIELD description ON organization TYPE option<string> PERMISSIONS FULL;
      
      -- Type d'organisation (hiérarchie)
      DEFINE FIELD type ON organization TYPE string ASSERT $value INSIDE ['group', 'network', 'campus'] PERMISSIONS FULL;
      
      -- Catégorie d'établissement
      DEFINE FIELD category ON organization TYPE option<string> ASSERT $value == NONE OR $value INSIDE ['school', 'university', 'high_school', 'middle_school', 'primary_school', 'training_center', 'company', 'other'] PERMISSIONS FULL;
      
      -- Hiérarchie (auto-référence)
      DEFINE FIELD parent ON organization TYPE option<record<organization>> PERMISSIONS FULL;
      
      -- Coordonnées
      DEFINE FIELD address ON organization TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD city ON organization TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD postal_code ON organization TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD country ON organization TYPE option<string> DEFAULT 'FR' PERMISSIONS FULL;
      DEFINE FIELD phone ON organization TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD email ON organization TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD website ON organization TYPE option<string> PERMISSIONS FULL;
      
      -- Branding
      DEFINE FIELD logo ON organization TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD color ON organization TYPE option<string> PERMISSIONS FULL;
      
      -- Paramètres
      DEFINE FIELD settings ON organization FLEXIBLE TYPE option<object> PERMISSIONS FULL;
      
      -- Timestamps et statut
      DEFINE FIELD is_active ON organization TYPE bool DEFAULT true PERMISSIONS FULL;
      DEFINE FIELD created_at ON organization TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      DEFINE FIELD updated_at ON organization TYPE option<datetime> PERMISSIONS FULL;
      
      -- Index
      DEFINE INDEX idx_org_slug ON organization FIELDS slug UNIQUE;
      DEFINE INDEX idx_org_type ON organization FIELDS type;
      DEFINE INDEX idx_org_parent ON organization FIELDS parent;
      DEFINE INDEX idx_org_category ON organization FIELDS category;
    `);
    console.log('✅ Table organization créée');
    
    // ========================================
    // Données de démonstration
    // ========================================
    console.log('\n📝 Insertion de données de démonstration...');
    
    await db.query(`
      -- Groupe (niveau supérieur)
      CREATE organization:central SET
        name = 'Central',
        slug = 'central',
        description = 'Groupe Central - Réseau d\\'écoles d\\'ingénieurs',
        type = 'group',
        category = 'university',
        is_active = true;
      
      -- Réseaux (niveau intermédiaire)
      CREATE organization:central_paris SET
        name = 'Central Paris',
        slug = 'central-paris',
        description = 'Réseau Central Île-de-France',
        type = 'network',
        category = 'university',
        parent = organization:central,
        city = 'Paris',
        country = 'FR',
        is_active = true;
      
      CREATE organization:central_lyon SET
        name = 'Central Lyon',
        slug = 'central-lyon',
        description = 'Réseau Central Auvergne-Rhône-Alpes',
        type = 'network',
        category = 'university',
        parent = organization:central,
        city = 'Lyon',
        country = 'FR',
        is_active = true;
      
      -- Campus (niveau le plus bas)
      CREATE organization:campus_saclay SET
        name = 'Campus Saclay',
        slug = 'campus-saclay',
        description = 'Campus principal de Central Paris',
        type = 'campus',
        category = 'university',
        parent = organization:central_paris,
        address = '3 Rue Joliot-Curie',
        city = 'Gif-sur-Yvette',
        postal_code = '91190',
        country = 'FR',
        is_active = true;
      
      CREATE organization:campus_chatenay SET
        name = 'Campus Châtenay',
        slug = 'campus-chatenay',
        description = 'Campus historique de Central Paris',
        type = 'campus',
        category = 'university',
        parent = organization:central_paris,
        address = 'Grande Voie des Vignes',
        city = 'Châtenay-Malabry',
        postal_code = '92290',
        country = 'FR',
        is_active = true;
    `);
    console.log('✅ Données de démonstration insérées');
    
    // ========================================
    // Vérification
    // ========================================
    console.log('\n📊 Vérification...');
    
    const [orgs] = await db.query<any[]>(`
      SELECT name, type, parent.name as parent_name 
      FROM organization 
      ORDER BY type, name
    `);
    
    console.log('\nOrganisations créées:');
    for (const org of orgs || []) {
      const indent = org.type === 'group' ? '' : org.type === 'network' ? '  └─ ' : '      └─ ';
      console.log(`${indent}${org.name} (${org.type})${org.parent_name ? ` ← ${org.parent_name}` : ''}`);
    }
    
    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.close();
  }
}

main().catch(console.error);
