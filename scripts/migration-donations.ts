/**
 * Migration: Créer la table des dons
 */
import Surreal from 'surrealdb';

async function migrate() {
  const db = new Surreal();
  
  try {
    console.log('🔄 Connexion à SurrealDB...');
    await db.connect(process.env.SURREAL_URL + '/rpc');
    await db.signin({
      username: process.env.SURREAL_USER!,
      password: process.env.SURREAL_PASS!
    });
    await db.use({
      namespace: process.env.SURREAL_NAMESPACE!,
      database: process.env.SURREAL_DATABASE!
    });
    
    console.log('📦 Création de la table donation...');

    // Table des dons
    await db.query(`
      DEFINE TABLE donation SCHEMAFULL;
      
      -- Champs
      DEFINE FIELD stripe_session_id ON donation TYPE string;
      DEFINE FIELD amount ON donation TYPE int;           -- en centimes
      DEFINE FIELD donor_name ON donation TYPE option<string>;
      DEFINE FIELD donor_email ON donation TYPE option<string>;
      DEFINE FIELD message ON donation TYPE option<string>;
      DEFINE FIELD is_public ON donation TYPE bool DEFAULT true;  -- afficher dans la liste
      DEFINE FIELD created_at ON donation TYPE datetime DEFAULT time::now();
      
      -- Index unique sur la session Stripe
      DEFINE INDEX donation_stripe_session ON donation FIELDS stripe_session_id UNIQUE;
      
      -- Index pour trier par date
      DEFINE INDEX donation_created ON donation FIELDS created_at;
    `);
    
    console.log('✅ Table donation créée !');

    // Vérifier
    const tables = await db.query('INFO FOR DB');
    console.log('📊 Tables disponibles:', Object.keys((tables[0] as any).tables || {}));

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

migrate();
