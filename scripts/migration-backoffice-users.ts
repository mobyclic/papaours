/**
 * Migration: Création de la table backoffice_user
 * 
 * Structure:
 * - superadmin: accès complet à tout le backoffice
 * - admin: accès limité aux thèmes qui leur sont assignés
 */

import Surreal from 'surrealdb';
import bcrypt from 'bcryptjs';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://kweez-db-8glp.surrealdb.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || '';
const SURREAL_NS = process.env.SURREAL_NS || 'papaours';
const SURREAL_DB = process.env.SURREAL_DB || 'dbpapaours';

async function migrate() {
  const db = new Surreal();
  
  try {
    console.log('🔌 Connexion à SurrealDB...');
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    console.log('✅ Connecté');

    // 1. Supprimer l'ancienne table backoffice_user si elle existe
    console.log('\n📋 Création de la table backoffice_user...');
    
    await db.query(`
      REMOVE TABLE IF EXISTS backoffice_user;
      
      DEFINE TABLE backoffice_user SCHEMAFULL;
      
      -- Champs principaux
      DEFINE FIELD email ON backoffice_user TYPE string ASSERT $value != NONE AND string::is::email($value);
      DEFINE FIELD password ON backoffice_user TYPE string ASSERT $value != NONE;
      DEFINE FIELD name ON backoffice_user TYPE string;
      
      -- Rôle: superadmin ou admin
      DEFINE FIELD role ON backoffice_user TYPE string 
        ASSERT $value INSIDE ['superadmin', 'admin'] 
        DEFAULT 'admin';
      
      -- Thèmes assignés (pour les admins non-superadmin)
      -- Un admin ne peut gérer que les quiz/questions des thèmes qui lui sont assignés
      DEFINE FIELD assigned_themes ON backoffice_user TYPE option<array<record<theme>>>;
      
      -- Matières assignées (optionnel, pour accès à toutes les questions d'une matière)
      DEFINE FIELD assigned_matieres ON backoffice_user TYPE option<array<record<matiere>>>;
      
      -- Statut
      DEFINE FIELD is_active ON backoffice_user TYPE bool DEFAULT true;
      
      -- Métadonnées
      DEFINE FIELD last_login ON backoffice_user TYPE option<datetime>;
      DEFINE FIELD created_at ON backoffice_user TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON backoffice_user TYPE datetime DEFAULT time::now();
      
      -- Index unique sur email
      DEFINE INDEX backoffice_user_email ON backoffice_user FIELDS email UNIQUE;
    `);
    console.log('✅ Table backoffice_user créée');

    // 2. Créer la table de session admin
    console.log('\n📋 Création de la table backoffice_session...');
    await db.query(`
      REMOVE TABLE IF EXISTS backoffice_session;
      
      DEFINE TABLE backoffice_session SCHEMAFULL;
      
      DEFINE FIELD user_id ON backoffice_session TYPE record<backoffice_user>;
      DEFINE FIELD token ON backoffice_session TYPE string ASSERT $value != NONE;
      DEFINE FIELD expires_at ON backoffice_session TYPE datetime;
      DEFINE FIELD created_at ON backoffice_session TYPE datetime DEFAULT time::now();
      DEFINE FIELD ip_address ON backoffice_session TYPE option<string>;
      DEFINE FIELD user_agent ON backoffice_session TYPE option<string>;
      
      DEFINE INDEX backoffice_session_token ON backoffice_session FIELDS token UNIQUE;
    `);
    console.log('✅ Table backoffice_session créée');

    // 3. Migrer les admins existants
    console.log('\n📋 Migration des admins existants...');
    
    // Récupérer les admins de l'ancienne table
    const [existingAdmins] = await db.query<[any[]]>('SELECT * FROM admin');
    
    for (const admin of existingAdmins || []) {
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      
      // Créer dans la nouvelle table
      await db.query(`
        CREATE backoffice_user SET
          email = $email,
          password = $password,
          name = $name,
          role = 'superadmin',
          is_active = true
      `, {
        email: admin.email,
        password: hashedPassword,
        name: admin.name || admin.email.split('@')[0]
      });
      
      console.log(`  ✅ Migré: ${admin.email} -> superadmin`);
    }

    // 4. Ajouter ton compte principal comme superadmin s'il n'existe pas
    const [existing] = await db.query<[any[]]>(
      "SELECT * FROM backoffice_user WHERE email = 'alistair@mobyclic.com'"
    );
    
    if (!existing || existing.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await db.query(`
        CREATE backoffice_user SET
          email = 'alistair@mobyclic.com',
          password = $password,
          name = 'Alistair Marca',
          role = 'superadmin',
          is_active = true
      `, { password: hashedPassword });
      console.log('  ✅ Créé: alistair@mobyclic.com -> superadmin (mot de passe: admin123)');
    }

    // 5. Vérifier
    console.log('\n📋 Vérification...');
    const [users] = await db.query<[any[]]>('SELECT id, email, name, role FROM backoffice_user');
    console.log('Utilisateurs backoffice:');
    users?.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
    });

    console.log('\n✅ Migration terminée !');
    console.log('\n⚠️  IMPORTANT: Change ton mot de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
