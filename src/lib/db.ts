import Surreal from 'surrealdb';

// Configuration de la connexion SurrealDB
const db = new Surreal();

let isConnected = false;

export async function connectDB() {
  if (isConnected) return db;

  try {
    const url = import.meta.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
    await db.connect(`${url}/rpc`, {
      namespace: import.meta.env.SURREAL_NAMESPACE || 'papaours',
      database: import.meta.env.SURREAL_DATABASE || 'dbpapaours',
    });

    await db.signin({
      username: import.meta.env.SURREAL_USER || 'rootuser',
      password: import.meta.env.SURREAL_PASS || 'n1n@S1mone',
    });

    isConnected = true;
    console.log('✅ Connected to SurrealDB');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to SurrealDB:', error);
    throw error;
  }
}

// Alias pour compatibilité
export const initDB = connectDB;

export async function initializeSchema() {
  try {
    await connectDB();

    // Création de la table des utilisateurs admins (avec IF NOT EXISTS implicite via OVERWRITE)
    try {
      await db.query(`
        DEFINE TABLE admin SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD email ON admin TYPE string ASSERT $value != NONE;
        DEFINE FIELD password ON admin TYPE string ASSERT $value != NONE;
        DEFINE FIELD name ON admin TYPE string;
        DEFINE FIELD role ON admin TYPE string DEFAULT 'admin';
        DEFINE FIELD createdAt ON admin TYPE datetime DEFAULT time::now();
        DEFINE FIELD updatedAt ON admin TYPE datetime DEFAULT time::now();
        DEFINE INDEX admin_email ON admin COLUMNS email UNIQUE;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table admin exists, skipping...');
    }

    // Création de la table des quiz
    try {
      await db.query(`
        DEFINE TABLE quiz SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD title ON quiz TYPE string ASSERT $value != NONE;
        DEFINE FIELD description ON quiz TYPE option<string>;
        DEFINE FIELD slug ON quiz TYPE string ASSERT $value != NONE;
        DEFINE FIELD isHomepage ON quiz TYPE bool DEFAULT false;
        DEFINE FIELD isActive ON quiz TYPE bool DEFAULT true;
        DEFINE FIELD coverImage ON quiz TYPE option<string>;
        DEFINE FIELD questionType ON quiz TYPE string DEFAULT 'qcm' ASSERT $value INSIDE ['qcm', 'vrai-faux', 'texte-libre'];
        DEFINE FIELD order ON quiz TYPE number DEFAULT 0;
        DEFINE FIELD createdAt ON quiz TYPE datetime DEFAULT time::now();
        DEFINE FIELD updatedAt ON quiz TYPE datetime DEFAULT time::now();
        DEFINE FIELD createdBy ON quiz TYPE option<string>;
        DEFINE INDEX quiz_slug ON quiz COLUMNS slug UNIQUE;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table quiz exists, skipping...');
    }

    // Création de la table des questions
    try {
      await db.query(`
        DEFINE TABLE question SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD quizId ON question TYPE record<quiz>;
        DEFINE FIELD question ON question TYPE string ASSERT $value != NONE;
        DEFINE FIELD family ON question TYPE string ASSERT $value INSIDE ['cordes', 'bois', 'cuivres', 'percussions', 'general'];
        DEFINE FIELD options ON question TYPE array ASSERT $value != NONE AND array::len($value) >= 2;
        DEFINE FIELD correctAnswer ON question TYPE number ASSERT $value != NONE AND $value >= 0;
        DEFINE FIELD explanation ON question TYPE string ASSERT $value != NONE;
        DEFINE FIELD imageUrl ON question TYPE option<string>;
        DEFINE FIELD imageCaption ON question TYPE option<string>;
        DEFINE FIELD imageCloudflareId ON question TYPE option<string>;
        DEFINE FIELD difficulty ON question TYPE string DEFAULT 'medium' ASSERT $value INSIDE ['easy', 'medium', 'hard'];
        DEFINE FIELD isActive ON question TYPE bool DEFAULT true;
        DEFINE FIELD order ON question TYPE number DEFAULT 0;
        DEFINE FIELD createdAt ON question TYPE datetime DEFAULT time::now();
        DEFINE FIELD updatedAt ON question TYPE datetime DEFAULT time::now();
        DEFINE FIELD createdBy ON question TYPE option<string>;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table question exists, skipping...');
    }

    // Création de la table des images
    try {
      await db.query(`
        DEFINE TABLE media SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD filename ON media TYPE string ASSERT $value != NONE;
        DEFINE FIELD cloudflareId ON media TYPE option<string>;
        DEFINE FIELD publicUrl ON media TYPE string ASSERT $value != NONE;
        DEFINE FIELD mimeType ON media TYPE option<string>;
        DEFINE FIELD size ON media TYPE option<number>;
        DEFINE FIELD width ON media TYPE option<number>;
        DEFINE FIELD height ON media TYPE option<number>;
        DEFINE FIELD alt ON media TYPE option<string>;
        DEFINE FIELD createdAt ON media TYPE datetime DEFAULT time::now();
        DEFINE FIELD uploadedBy ON media TYPE option<string>;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table media exists, skipping...');
    }

    // Création de la table des résultats de quiz
    try {
      await db.query(`
        DEFINE TABLE quiz_result SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD userId ON quiz_result TYPE string;
        DEFINE FIELD score ON quiz_result TYPE number ASSERT $value != NONE;
        DEFINE FIELD totalQuestions ON quiz_result TYPE number ASSERT $value != NONE;
        DEFINE FIELD answers ON quiz_result TYPE array;
        DEFINE FIELD completedAt ON quiz_result TYPE datetime DEFAULT time::now();
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
      console.log('ℹ️  Table quiz_result exists, skipping...');
    }

    console.log('✅ Database schema initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize schema:', error);
    throw error;
  }
}

// Fonction pour créer l'utilisateur admin initial
export async function createInitialAdmin() {
  try {
    await connectDB();

    // Vérifier si l'admin existe déjà
    const existingAdmin = await db.query<any[]>(
      'SELECT * FROM admin WHERE email = $email',
      { email: 'alistair.marca@gmail.com' }
    );

    if (existingAdmin[0]?.length > 0) {
      console.log('✅ Admin user already exists');
      return existingAdmin[0];
    }

    // Créer l'admin (en production, hasher le mot de passe avec bcrypt!)
    const admin = await db.create('admin', {
      email: 'alistair.marca@gmail.com',
      password: 'n1n@S1mone', // ⚠️ À hasher en production!
      name: 'Alistair Marca',
      role: 'admin'
    });

    console.log('✅ Admin user created:', Array.isArray(admin) ? admin : [admin]);
    return Array.isArray(admin) ? admin : [admin];
  } catch (error: any) {
    // Si l'erreur est due à l'index unique (admin existe déjà)
    if (error.message?.includes('already contains')) {
      console.log('✅ Admin user already exists (caught from error)');
      const existingAdmin = await db.query<any[]>(
        'SELECT * FROM admin WHERE email = $email',
        { email: 'alistair.marca@gmail.com' }
      );
      return existingAdmin[0] || [];
    }
    console.error('❌ Failed to create admin:', error);
    throw error;
  }
}

export { db };
