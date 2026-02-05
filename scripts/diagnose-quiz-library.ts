/**
 * Script pour diagnostiquer et corriger la bibliothèque de quiz de alistair@mobyclic.com
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || 'n1n@S1mone';

async function main() {
  const db = new Surreal();
  
  try {
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: 'kweez', database: 'dbkweez' });
    console.log('✅ Connecté à SurrealDB');

    // 1. Trouver l'utilisateur
    const users = await db.query<any[][]>(`
      SELECT id FROM user WHERE email = 'alistair@mobyclic.com'
    `);
    const userId = users[0][0].id;
    console.log('👤 Utilisateur:', userId);

    // 2. Voir tous les éléments de sa bibliothèque
    console.log('\n📖 Contenu de user_quiz_library:');
    const library = await db.query<any[][]>(`
      SELECT * FROM user_quiz_library WHERE user_id = $userId
    `, { userId });
    
    if (library[0]) {
      for (const item of library[0]) {
        console.log('  - ID:', item.id);
        console.log('    quiz_id:', item.quiz_id);
        console.log('    added_at:', item.added_at);
        
        // Vérifier si le quiz existe
        if (item.quiz_id) {
          const quizCheck = await db.query<any[][]>(`
            SELECT id, title FROM $quizId
          `, { quizId: item.quiz_id });
          
          if (quizCheck[0] && quizCheck[0].length > 0) {
            console.log('    ✅ Quiz existe:', quizCheck[0][0].title);
          } else {
            console.log('    ❌ QUIZ FANTÔME - n\'existe plus !');
            console.log('    🗑️  Suppression...');
            await db.query(`DELETE $itemId`, { itemId: item.id });
            console.log('    ✅ Supprimé');
          }
        } else {
          console.log('    ❌ quiz_id est null/undefined');
        }
      }
    }

    // 3. Vérifier les 4 quiz anglais
    console.log('\n📚 Vérification des 4 quiz anglais:');
    const englishQuizIds = [
      'quiz:e010okt4y6gd5082rr86', // Les déterminants possessifs
      'quiz:4w3mirpkg6ba3mfyvliz', // Le génitif
      'quiz:myamf83qd56daeh921y8', // Les connecteurs (and, but, because)
      'quiz:40jf0sxp78qrtn9hbgc7', // Le présent simple
    ];
    
    for (const quizId of englishQuizIds) {
      const quiz = await db.query<any[][]>(`SELECT id, title FROM ${quizId}`);
      if (quiz[0] && quiz[0].length > 0) {
        console.log('  ✅', quiz[0][0].title);
      } else {
        console.log('  ❌', quizId, '- non trouvé');
      }
    }

    // 4. Voir le programme d'anglais 6ème
    console.log('\n🎓 Programme d\'anglais 6ème:');
    const programs = await db.query<any[][]>(`
      SELECT id, name, subject_id, grade_id, chapters FROM program 
      WHERE grade_id = grade:FR_6e AND (name CONTAINS 'Anglais' OR name CONTAINS 'anglais')
    `);
    
    if (programs[0] && programs[0].length > 0) {
      for (const prog of programs[0]) {
        console.log('  📘', prog.name, '-', prog.id);
        console.log('     chapters:', JSON.stringify(prog.chapters, null, 2));
      }
    } else {
      console.log('  ⚠️ Aucun programme d\'anglais 6ème trouvé');
      
      // Lister tous les programmes
      console.log('\n📋 Tous les programmes:');
      const allProgs = await db.query<any[][]>(`SELECT id, name, grade_id FROM program`);
      if (allProgs[0]) {
        for (const p of allProgs[0]) {
          console.log('  -', p.name, '(', p.grade_id, ')');
        }
      }
    }

    // 5. Voir les thèmes anglais et leurs quiz
    console.log('\n🏷️ Thèmes d\'anglais avec quiz:');
    const themes = await db.query<any[][]>(`
      SELECT id, name, subject_id FROM theme 
      WHERE subject_id.code = 'anglais' OR subject_id.name CONTAINS 'Anglais'
    `);
    
    if (themes[0]) {
      for (const theme of themes[0]) {
        console.log('  📁', theme.name, '-', theme.id);
        
        // Quiz de ce thème
        const quizzes = await db.query<any[][]>(`
          SELECT id, title FROM quiz WHERE theme_id = $themeId
        `, { themeId: theme.id });
        
        if (quizzes[0]) {
          for (const q of quizzes[0]) {
            console.log('      📝', q.title);
          }
        }
      }
    }

    console.log('\n🎉 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

main();
