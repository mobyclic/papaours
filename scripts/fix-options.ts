import { connectDB } from '../src/lib/db';
import { quizQuestions } from '../src/lib/quizData';

function escapeString(s: string): string {
  return s.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

async function fixOptions() {
  try {
    const db = await connectDB();
    
    console.log('\n🔧 Fixing question options...\n');

    // Récupérer toutes les questions
    const result = await db.query('SELECT id, question FROM question WHERE isActive = true');
    const dbQuestions = result[0] as any[];
    
    console.log(`📊 Found ${dbQuestions.length} questions in DB`);
    console.log(`📊 Source data has ${quizQuestions.length} questions\n`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const dbQ of dbQuestions) {
      // Trouver la question correspondante dans quizData
      const sourceQ = quizQuestions.find(q => q.question === dbQ.question);
      
      if (sourceQ) {
        // Construire le tableau d'options en SQL brut
        const optionsArray = sourceQ.options.map(o => `'${escapeString(o)}'`).join(', ');
        const questionId = typeof dbQ.id === 'string' ? dbQ.id : `question:${dbQ.id.id}`;
        
        // Mettre à jour avec SQL brut (les paramètres ne fonctionnent pas bien pour les arrays)
        await db.query(
          `UPDATE ${questionId} SET options = [${optionsArray}]`
        );
        updatedCount++;
        console.log(`✅ Updated: ${dbQ.question.substring(0, 50)}...`);
      } else {
        notFoundCount++;
        console.log(`⚠️ No match found: ${dbQ.question.substring(0, 50)}...`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️ Not found: ${notFoundCount}`);
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOptions();
