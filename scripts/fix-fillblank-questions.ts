/**
 * Corriger les questions fill_blank créées pour l'anglais
 * Le format doit utiliser {réponse} au lieu de ___ pour que le composant les reconnaisse
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://kweez-db-kweez.aws-eu1.surrealdb.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || 'root';
const SURREAL_NS = process.env.SURREAL_NS || 'kweez';
const SURREAL_DB = process.env.SURREAL_DB || 'dbkweez';

async function main() {
  const db = new Surreal();
  
  try {
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    
    console.log('✅ Connecté à SurrealDB\n');
    
    // Récupérer toutes les questions fill_blank
    const [result] = await db.query<any[]>(`
      SELECT * FROM question WHERE questionType = 'fill_blank'
    `);
    
    const questions = result || [];
    console.log(`📝 ${questions.length} questions fill_blank trouvées\n`);
    
    let updated = 0;
    
    for (const q of questions) {
      const questionText = q.question;
      const correctAnswers = q.correctAnswers || [];
      
      if (!questionText || correctAnswers.length === 0) {
        console.log(`⏭️ Skip question sans réponse: ${q.id}`);
        continue;
      }
      
      // Créer le textWithBlanks en remplaçant ___ par {réponse}
      let textWithBlanks = questionText;
      
      // Si la question contient déjà {}, on garde
      if (!textWithBlanks.includes('{')) {
        // Remplacer le premier ___ par la réponse entre accolades
        for (let i = 0; i < correctAnswers.length; i++) {
          if (textWithBlanks.includes('___')) {
            textWithBlanks = textWithBlanks.replace('___', `{${correctAnswers[i]}}`);
          }
        }
      }
      
      // Si pas de changement (pas de ___), on crée un format basé sur le texte
      if (textWithBlanks === questionText && !textWithBlanks.includes('{')) {
        // On essaie de construire un textWithBlanks
        // Format: "Complete: I love ___ family." -> "I love {my} family."
        const cleanQuestion = questionText.replace(/^Complete:\s*/i, '');
        textWithBlanks = cleanQuestion;
        
        // Si toujours pas de {}, on met la réponse à la place de ___
        for (let i = 0; i < correctAnswers.length; i++) {
          if (textWithBlanks.includes('___')) {
            textWithBlanks = textWithBlanks.replace('___', `{${correctAnswers[i]}}`);
          } else if (textWithBlanks.includes('_')) {
            textWithBlanks = textWithBlanks.replace(/_+/, `{${correctAnswers[i]}}`);
          }
        }
      }
      
      // Mettre à jour la question
      const cleanId = q.id.toString().includes(':') ? q.id.toString().split(':')[1] : q.id.toString();
      
      await db.query(`
        UPDATE type::thing("question", $cleanId) SET
          textWithBlanks = $textWithBlanks
      `, { cleanId, textWithBlanks });
      
      console.log(`✅ Mise à jour: ${questionText.substring(0, 50)}...`);
      console.log(`   → textWithBlanks: ${textWithBlanks}`);
      updated++;
    }
    
    console.log(`\n🎉 ${updated} questions mises à jour !`);
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.close();
  }
}

main();
