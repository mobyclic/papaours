/**
 * Script pour ajouter les 4 quiz d'anglais 6ème à la bibliothèque de alistair@mobyclic.com
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
    
    if (!users[0] || users[0].length === 0) {
      throw new Error('Utilisateur alistair@mobyclic.com non trouvé');
    }
    
    const userId = users[0][0].id;
    console.log('👤 Utilisateur trouvé:', userId);

    // Les 4 quiz d'anglais 6ème à ajouter
    const englishQuizIds = [
      'quiz:e010okt4y6gd5082rr86', // Les déterminants possessifs
      'quiz:4w3mirpkg6ba3mfyvliz', // Le génitif
      'quiz:myamf83qd56daeh921y8', // Les connecteurs (and, but, because)
      'quiz:40jf0sxp78qrtn9hbgc7', // Le présent simple
    ];

    console.log('\n📚 Ajout des 4 quiz d\'anglais à la bibliothèque...');
    
    for (const quizId of englishQuizIds) {
      // Récupérer le titre du quiz
      const quizInfo = await db.query<any[][]>(`SELECT title FROM ${quizId}`);
      const title = quizInfo[0]?.[0]?.title || quizId;
      
      try {
        await db.query(`
          INSERT INTO user_quiz_library {
            user_id: $userId,
            quiz_id: type::thing('quiz', $quizIdClean),
            added_at: time::now(),
            is_favorite: false,
            play_count: 0
          }
        `, { userId, quizIdClean: quizId.replace('quiz:', '') });
        console.log('  ✅', title);
      } catch (e: any) {
        if (e.message?.includes('unique') || e.message?.includes('UNIQUE') || e.message?.includes('already exists')) {
          console.log('  ℹ️', title, '- déjà dans la bibliothèque');
        } else {
          console.log('  ❌', title, '-', e.message);
        }
      }
    }

    // Vérifier la bibliothèque
    const library = await db.query<any[][]>(`
      SELECT quiz_id.title as title, added_at FROM user_quiz_library WHERE user_id = $userId
    `, { userId });
    
    console.log('\n📖 Bibliothèque de l\'utilisateur:');
    if (library[0] && library[0].length > 0) {
      for (const item of library[0]) {
        console.log('  -', item.title);
      }
    } else {
      console.log('  (vide)');
    }

    console.log('\n🎉 Terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

main();
