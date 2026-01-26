/**
 * Migration: Change theme.matiere_id to theme.matiere_ids (array)
 * This allows themes to be associated with multiple subjects
 */

import Surreal from 'surrealdb';

async function migrate() {
  const db = new Surreal();
  
  try {
    const url = process.env.SURREAL_URL;
    if (!url) throw new Error('SURREAL_URL not set');
    
    await db.connect(url + '/rpc');
    await db.signin({
      username: process.env.SURREAL_USER!,
      password: process.env.SURREAL_PASS!
    });
    await db.use({ namespace: 'papaours', database: 'dbpapaours' });
    console.log('✅ Connected to SurrealDB');
    
    // Add the new matiere_ids field
    console.log('\n📦 Adding matiere_ids field to theme table...');
    await db.query(`
      DEFINE FIELD matiere_ids ON theme TYPE option<array> FLEXIBLE;
    `);
    console.log('✅ Field defined');
    
    // Migrate existing themes: copy matiere_id to matiere_ids array
    console.log('\n🔄 Migrating existing themes...');
    
    const themes = await db.query<any[]>('SELECT id, matiere_id FROM theme WHERE matiere_id != NONE');
    const themesToMigrate = themes[0] || [];
    console.log(`Found ${themesToMigrate.length} themes to migrate`);
    
    let migratedCount = 0;
    for (const theme of themesToMigrate) {
      if (theme.matiere_id) {
        await db.query(`
          UPDATE $id SET matiere_ids = [$matiereId]
        `, {
          id: theme.id,
          matiereId: theme.matiere_id
        });
        migratedCount++;
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} themes`);
    
    // Summary
    const summary = await db.query(`
      SELECT count() as total FROM theme WHERE matiere_ids != NONE AND array::len(matiere_ids) > 0 GROUP ALL
    `);
    console.log(`\n📊 Summary: ${(summary[0] as any[])?.[0]?.total || 0} themes now have matiere_ids`);
    
    console.log('\n✅ Migration complete!');
    console.log('Note: The old matiere_id field is kept for backward compatibility');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
