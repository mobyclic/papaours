import Surreal from 'surrealdb';

/**
 * Migration: Système de favoris
 * Ajoute la table user_favorite pour sauvegarder les quiz préférés
 */

async function migrate() {
  const db = new Surreal();
  
  try {
    await db.connect('wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc', {
      namespace: 'papaours',
      database: 'dbpapaours',
    });
    await db.signin({ username: 'rootuser', password: 'n1n@S1mone' });

    console.log('🔧 Migration: Système de favoris\n');

    // 1. Créer la table user_favorite
    console.log('📋 Création de la table user_favorite...');
    await db.query(`
      DEFINE TABLE user_favorite SCHEMAFULL PERMISSIONS FULL;
      
      -- Clés de relation
      DEFINE FIELD user_id ON user_favorite TYPE record<user> ASSERT $value != NONE;
      DEFINE FIELD quiz_id ON user_favorite TYPE record<quiz> ASSERT $value != NONE;
      
      -- Métadonnées
      DEFINE FIELD created_at ON user_favorite TYPE datetime DEFAULT time::now();
      DEFINE FIELD notes ON user_favorite TYPE option<string>;
      
      -- Index unique pour éviter les doublons
      DEFINE INDEX user_favorite_unique ON user_favorite COLUMNS user_id, quiz_id UNIQUE;
      
      -- Index pour recherche rapide
      DEFINE INDEX user_favorite_user ON user_favorite COLUMNS user_id;
    `);
    console.log('✅ Table user_favorite créée\n');

    // 2. Ajouter compteur de favoris sur quiz (optionnel pour affichage)
    console.log('📊 Ajout du champ favorite_count sur quiz...');
    try {
      await db.query(`
        DEFINE FIELD favorite_count ON quiz TYPE number DEFAULT 0;
      `);
      console.log('✅ Champ favorite_count ajouté\n');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('ℹ️  Champ favorite_count existe déjà\n');
      } else {
        throw e;
      }
    }

    console.log('✅ Migration terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

migrate();
