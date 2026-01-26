/**
 * Migration: Renommer 'order' en 'pos' dans toutes les tables
 * Tables concernées: niveau, matiere, theme
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL!;
const SURREAL_USER = process.env.SURREAL_USER!;
const SURREAL_PASS = process.env.SURREAL_PASS!;

async function migrate() {
  const db = new Surreal();
  
  try {
    console.log('🔄 Connexion à SurrealDB...');
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: 'papaours', database: 'dbpapaours' });
    console.log('✅ Connecté!\n');

    const tables = ['niveau', 'matiere', 'theme'];

    for (const table of tables) {
      console.log(`\n📦 Migration de la table ${table}...`);
      
      // Récupérer tous les enregistrements
      const records = await db.query<any[]>(`SELECT * FROM ${table}`);
      const items = records[0] || [];
      console.log(`  📊 ${items.length} enregistrements trouvés`);

      // Ajouter le champ pos
      await db.query(`DEFINE FIELD pos ON ${table} TYPE int DEFAULT 0;`);
      console.log(`  ✓ Champ 'pos' ajouté`);

      // Migrer les données
      for (const item of items) {
        const pos = item.order ?? 0;
        await db.query(`UPDATE $id SET pos = $pos`, { id: item.id, pos });
      }
      console.log(`  ✓ Données migrées (order → pos)`);

      // Supprimer l'ancien champ
      await db.query(`UPDATE ${table} UNSET order`);
      console.log(`  ✓ Champ 'order' supprimé`);
    }

    // Vérification
    console.log('\n🔍 Vérification finale...');
    for (const table of tables) {
      const sample = await db.query<any[]>(`SELECT * FROM ${table} ORDER BY pos LIMIT 2`);
      console.log(`\n${table}:`, JSON.stringify(sample[0], null, 2));
    }

    console.log('\n✅ Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
