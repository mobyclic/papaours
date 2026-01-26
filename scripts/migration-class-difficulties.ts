/**
 * Migration: Add class_difficulties field to question table
 * 
 * This replaces the single classe_id and difficulty fields with a 
 * class_difficulties array that allows multiple classe/difficulty/points combinations.
 * 
 * Example: class_difficulties = [
 *   { classe_id: classe:6eme, difficulty: 'easy', points: 10 },
 *   { classe_id: classe:cm2, difficulty: 'medium', points: 20 }
 * ]
 */

import Surreal from 'surrealdb';

async function migrate() {
  const db = new Surreal();
  
  try {
    // Connect
    const url = process.env.SURREAL_URL;
    if (!url) throw new Error('SURREAL_URL not set');
    
    await db.connect(url + '/rpc');
    await db.signin({
      username: process.env.SURREAL_USER!,
      password: process.env.SURREAL_PASS!
    });
    await db.use({ namespace: 'papaours', database: 'dbpapaours' });
    console.log('✅ Connected to SurrealDB');
    
    // Add the class_difficulties field to question table
    console.log('\n📦 Adding class_difficulties field to question table...');
    
    await db.query(`
      DEFINE FIELD class_difficulties ON question TYPE option<array<object>> FLEXIBLE;
    `);
    console.log('✅ Field defined');
    
    // Migrate existing questions that have classe_id and difficulty
    console.log('\n🔄 Migrating existing questions...');
    
    const questions = await db.query<any[]>(`
      SELECT id, classe_id, difficulty FROM question 
      WHERE classe_id != NONE OR difficulty != NONE
    `);
    
    const questionsToMigrate = questions[0] || [];
    console.log(`Found ${questionsToMigrate.length} questions to migrate`);
    
    let migratedCount = 0;
    for (const q of questionsToMigrate) {
      if (q.classe_id) {
        const difficulty = q.difficulty || 'medium';
        const points = difficulty === 'easy' ? 10 : difficulty === 'hard' ? 30 : 20;
        
        // Create the class_difficulties array with the existing classe_id
        await db.query(`
          UPDATE $id SET class_difficulties = [
            { classe_id: $classeId, difficulty: $difficulty, points: $points }
          ]
        `, {
          id: q.id,
          classeId: q.classe_id,
          difficulty: difficulty,
          points: points
        });
        migratedCount++;
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} questions`);
    
    // Summary
    const summary = await db.query(`
      SELECT count() as total FROM question WHERE class_difficulties != NONE GROUP ALL
    `);
    console.log(`\n📊 Summary: ${(summary[0] as any[])?.[0]?.total || 0} questions now have class_difficulties`);
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
