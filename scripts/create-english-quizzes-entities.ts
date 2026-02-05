/**
 * Créer les 4 entités quiz pour l'anglais 6ème
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
    
    // Récupérer les thèmes d'anglais créés
    const themes = [
      { slug: 'determinants-possessifs', title: 'Les déterminants possessifs', maxQuestions: 15 },
      { slug: 'genitif', title: 'Le génitif', maxQuestions: 15 },
      { slug: 'present-simple', title: 'Le présent simple', maxQuestions: 15 },
      { slug: 'connecteurs', title: 'Les connecteurs (and, but, because)', maxQuestions: 15 }
    ];
    
    for (const t of themes) {
      // Récupérer l'ID du thème
      const [themeResult] = await db.query<any[]>('SELECT id FROM theme WHERE slug = $slug', { slug: t.slug });
      const theme = themeResult?.[0];
      
      if (!theme) {
        console.log('❌ Thème non trouvé:', t.slug);
        continue;
      }
      
      const themeId = theme.id.toString();
      const cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
      
      // Vérifier si le quiz existe déjà
      const [existingQuiz] = await db.query<any[]>('SELECT id FROM quiz WHERE slug = $slug', { slug: t.slug });
      
      if (existingQuiz?.[0]) {
        console.log('⏭️ Quiz existe déjà:', t.title);
        continue;
      }
      
      // Créer le quiz
      await db.query(`
        CREATE quiz SET
          title = $title,
          slug = $slug,
          description = $description,
          questionType = 'mixed',
          isHomepage = false,
          isActive = true,
          shuffleQuestions = true,
          maxQuestions = $maxQuestions,
          order = 0,
          theme_ids = [type::thing('theme', $cleanThemeId)]
      `, { 
        title: t.title, 
        slug: t.slug, 
        description: `Quiz d'anglais niveau 6ème : ${t.title}`,
        maxQuestions: t.maxQuestions,
        cleanThemeId 
      });
      
      console.log('✅ Quiz créé:', t.title);
    }
    
    console.log('\n🎉 Terminé !');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.close();
  }
}

main();
