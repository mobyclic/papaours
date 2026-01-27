/**
 * Migration : Ajouter classe_id à user_progress
 * 
 * Cette migration modifie la table user_progress pour tracker la progression
 * par matière/thème ET par classe (niveau scolaire).
 * 
 * L'index unique devient : user_id + matiere_id + theme_id + classe_id
 */

import Surreal from 'surrealdb';

async function migrate() {
  const db = new Surreal();

  try {
    console.log('🔌 Connexion à SurrealDB...');
    await db.connect(process.env.SURREAL_URL || 'wss://papaours-db-1gz8g1jc0ogg8.aws-eu-west-1.surrealdb.cloud/rpc');
    await db.signin({ 
      username: process.env.SURREAL_USER || 'root', 
      password: process.env.SURREAL_PASS || 'root' 
    });
    await db.use({ namespace: 'papaours', database: 'papaours' });

    console.log('✅ Connecté à SurrealDB');

    // Supprimer l'ancien index unique
    console.log('📝 Suppression de l\'ancien index unique...');
    await db.query(`REMOVE INDEX IF EXISTS user_progress_unique ON user_progress`);

    // Ajouter le champ classe_id
    console.log('📝 Ajout du champ classe_id...');
    await db.query(`
      DEFINE FIELD classe_id ON user_progress TYPE record<classe> PERMISSIONS FULL;
    `);

    // Créer le nouvel index unique avec classe_id
    console.log('📝 Création du nouvel index unique...');
    await db.query(`
      DEFINE INDEX user_progress_unique ON user_progress 
      FIELDS user_id, matiere_id, theme_id, classe_id UNIQUE;
    `);

    // Ajouter un index sur classe_id
    console.log('📝 Ajout de l\'index sur classe_id...');
    await db.query(`
      DEFINE INDEX user_progress_classe ON user_progress FIELDS classe_id;
    `);

    console.log('✅ Migration terminée avec succès !');

    // Vérifier la structure finale
    const info = await db.query('INFO FOR TABLE user_progress');
    console.log('\n📋 Structure finale de user_progress:');
    console.log(JSON.stringify(info[0], null, 2));

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
