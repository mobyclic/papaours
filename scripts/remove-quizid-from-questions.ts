/**
 * Migration: Remove quizId from question table
 * 
 * Now that quizzes select questions dynamically via theme_id/matiere_id,
 * the quizId field on questions is no longer needed.
 * 
 * Run with: bun run scripts/remove-quizid-from-questions.ts
 */

import Surreal from 'surrealdb';

async function removeQuizIdFromQuestions() {
  const db = new Surreal();
  
  try {
    console.log('🔌 Connecting to SurrealDB...');
    await db.connect(process.env.SURREAL_URL + '/rpc');
    await db.signin({
      username: process.env.SURREAL_USER!,
      password: process.env.SURREAL_PASS!
    });
    await db.use({ namespace: 'papaours', database: 'dbpapaours' });
    console.log('✅ Connected!');

    // 1. Count questions with quizId
    const countResult = await db.query<any[]>('SELECT count() FROM question WHERE quizId != NONE GROUP ALL');
    const countWithQuizId = (countResult[0] as any[])?.[0]?.count || 0;
    console.log(`📊 Questions with quizId: ${countWithQuizId}`);

    if (countWithQuizId === 0) {
      console.log('✅ No questions have quizId, nothing to migrate.');
      
      // Still try to remove the field definition
      console.log('🔄 Removing quizId field definition from schema...');
      try {
        await db.query('REMOVE FIELD quizId ON question');
        console.log('✅ Field definition removed');
      } catch (e: any) {
        if (e.message?.includes('not found') || e.message?.includes('does not exist')) {
          console.log('ℹ️  Field definition was already removed');
        } else {
          console.log('⚠️  Could not remove field definition:', e.message);
        }
      }
      
      await db.close();
      return;
    }

    // 2. First, remove the field definition, then recreate as optional
    console.log('🔄 Removing current quizId field definition...');
    try {
      await db.query('REMOVE FIELD quizId ON question');
      console.log('✅ Field definition removed');
    } catch (e: any) {
      console.log('⚠️  Could not remove field:', e.message);
    }
    
    console.log('🔄 Recreating quizId field as optional type...');
    await db.query('DEFINE FIELD quizId ON question TYPE option<record<quiz>>');
    console.log('✅ Field type changed to optional');

    // 3. Remove the quizId field from all questions by setting to NONE
    console.log('🔄 Removing quizId values from all questions...');
    const updateResult = await db.query(`
      UPDATE question SET quizId = NONE WHERE quizId != NONE
    `);
    
    const updatedQuestions = (updateResult[0] as any[]) || [];
    console.log(`✅ Updated ${updatedQuestions.length} questions`);

    // 4. Remove the field definition from the schema entirely
    console.log('🔄 Removing quizId field definition from schema...');
    try {
      await db.query('REMOVE FIELD quizId ON question');
      console.log('✅ Field definition removed');
    } catch (e: any) {
      if (e.message?.includes('not found') || e.message?.includes('does not exist')) {
        console.log('ℹ️  Field definition was already removed');
      } else {
        console.log('⚠️  Could not remove field definition:', e.message);
      }
    }

    // 5. Verify no questions have quizId anymore
    const verifyResult = await db.query<any[]>('SELECT count() FROM question WHERE quizId != NONE GROUP ALL');
    const remaining = (verifyResult[0] as any[])?.[0]?.count || 0;
    
    if (remaining === 0) {
      console.log('✅ Migration complete! No questions have quizId anymore.');
    } else {
      console.log(`⚠️  ${remaining} questions still have quizId`);
    }

    // 6. Show sample of updated questions to verify
    const sampleResult = await db.query<any[]>('SELECT id, question, matiere_id, theme_ids FROM question LIMIT 3');
    const samples = (sampleResult[0] as any[]) || [];
    console.log('\n📋 Sample questions after migration:');
    for (const q of samples) {
      console.log(`  - ${q.id?.toString()}: "${q.question?.substring(0, 50)}..."`);
      console.log(`    matiere_id: ${q.matiere_id?.toString() || 'none'}`);
      console.log(`    theme_ids: ${JSON.stringify(q.theme_ids?.map((t: any) => t?.toString()) || [])}`);
    }

    await db.close();
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

removeQuizIdFromQuestions();
