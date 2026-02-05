/**
 * Nettoyer les textWithBlanks avec les doublons (verbe) après {verbe}
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
    
    // Récupérer les questions avec textWithBlanks contenant des parenthèses
    const [result] = await db.query<any[]>(`
      SELECT id, textWithBlanks FROM question 
      WHERE questionType = 'fill_blank' AND textWithBlanks != NONE
    `);
    
    let fixed = 0;
    
    for (const q of (result || [])) {
      if (!q.textWithBlanks) continue;
      
      let original = q.textWithBlanks;
      
      // Supprimer les (verbe) après {verbe}
      // Ex: "He {has} (have) a dog" -> "He {has} a dog"
      let cleaned = original.replace(/\{([^}]+)\}\s*\([^)]+\)/g, '{$1}');
      
      if (cleaned !== original) {
        const cleanId = q.id.toString().includes(':') ? q.id.toString().split(':')[1] : q.id.toString();
        await db.query(`
          UPDATE type::thing("question", $cleanId) SET textWithBlanks = $cleaned
        `, { cleanId, cleaned });
        console.log(`✅ Nettoyé: "${original.substring(0, 50)}..." → "${cleaned.substring(0, 50)}..."`);
        fixed++;
      }
    }
    
    console.log(`\n🎉 ${fixed} questions nettoyées !`);
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.close();
  }
}

main();
