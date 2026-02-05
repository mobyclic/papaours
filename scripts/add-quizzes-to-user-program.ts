/**
 * Script pour ajouter les 4 quiz d'anglais à user_program (Ma sélection)
 * et supprimer les éventuels quiz fantômes
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
    const userIdClean = userId.toString().replace('user:', '');
    console.log('👤 Utilisateur:', userId);

    // 2. Voir le contenu actuel de user_program
    console.log('\n📖 Contenu actuel de user_program:');
    const currentProgram = await db.query<any[][]>(`
      SELECT * FROM user_program WHERE user = $userId
    `, { userId });
    
    if (currentProgram[0] && currentProgram[0].length > 0) {
      for (const item of currentProgram[0]) {
        console.log('  - ID:', item.id);
        console.log('    quiz:', item.quiz);
        
        // Vérifier si le quiz existe
        if (item.quiz) {
          const quizCheck = await db.query<any[][]>(`SELECT id, title FROM $quizId`, { quizId: item.quiz });
          if (quizCheck[0] && quizCheck[0].length > 0) {
            console.log('    ✅ Quiz existe:', quizCheck[0][0].title);
          } else {
            console.log('    ❌ QUIZ FANTÔME - suppression...');
            await db.query(`DELETE $itemId`, { itemId: item.id });
            console.log('    ✅ Supprimé');
          }
        } else {
          console.log('    ❌ quiz est null - suppression...');
          await db.query(`DELETE $itemId`, { itemId: item.id });
          console.log('    ✅ Supprimé');
        }
      }
    } else {
      console.log('  (vide)');
    }

    // 3. Ajouter les 4 quiz d'anglais
    console.log('\n📚 Ajout des 4 quiz d\'anglais à Ma sélection...');
    
    const englishQuizzes = [
      { id: 'e010okt4y6gd5082rr86', name: 'Les déterminants possessifs' },
      { id: '4w3mirpkg6ba3mfyvliz', name: 'Le génitif' },
      { id: 'myamf83qd56daeh921y8', name: 'Les connecteurs (and, but, because)' },
      { id: '40jf0sxp78qrtn9hbgc7', name: 'Le présent simple' },
    ];
    
    for (const quiz of englishQuizzes) {
      try {
        // Vérifier d'abord si déjà présent
        const existing = await db.query<any[][]>(`
          SELECT id FROM user_program 
          WHERE user = type::thing("user", $userId) 
            AND quiz = type::thing("quiz", $quizId)
        `, { userId: userIdClean, quizId: quiz.id });
        
        if (existing[0] && existing[0].length > 0) {
          console.log('  ℹ️', quiz.name, '- déjà dans Ma sélection');
        } else {
          await db.query(`
            CREATE user_program SET
              user = type::thing("user", $userId),
              quiz = type::thing("quiz", $quizId),
              added_at = time::now(),
              completed = false
          `, { userId: userIdClean, quizId: quiz.id });
          console.log('  ✅', quiz.name);
        }
      } catch (e: any) {
        if (e.message?.includes('already exists') || e.message?.includes('unique')) {
          console.log('  ℹ️', quiz.name, '- déjà dans Ma sélection');
        } else {
          console.log('  ❌', quiz.name, '-', e.message);
        }
      }
    }

    // 4. Afficher le contenu final
    console.log('\n📖 Contenu final de Ma sélection:');
    const finalProgram = await db.query<any[][]>(`
      SELECT quiz.title as title FROM user_program WHERE user = type::thing("user", $userId)
    `, { userId: userIdClean });
    
    if (finalProgram[0] && finalProgram[0].length > 0) {
      for (const item of finalProgram[0]) {
        console.log('  -', item.title);
      }
    }

    console.log('\n🎉 Terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

main();
