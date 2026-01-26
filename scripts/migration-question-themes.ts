import Surreal from 'surrealdb';

const db = new Surreal();

async function main() {
  await db.connect('wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc', {
    namespace: 'papaours',
    database: 'dbpapaours',
  });
  await db.signin({ username: 'rootuser', password: 'n1n@S1mone' });

  console.log('🔧 Migration: Ajout des champs matiere_id, theme_ids, classe_id à question...\n');

  // 1. Ajouter les nouveaux champs à question
  console.log('📝 Ajout des champs à la table question...');
  await db.query(`
    -- Matière liée à la question
    DEFINE FIELD matiere_id ON question TYPE option<record<matiere>>;
    
    -- Thèmes multiples (plusieurs tags thématiques)
    DEFINE FIELD theme_ids ON question TYPE option<array<record<theme>>>;
    
    -- Classe scolaire (niveau)
    DEFINE FIELD classe_id ON question TYPE option<record<classe>>;
    
    -- Index pour recherche rapide
    DEFINE INDEX question_matiere ON question COLUMNS matiere_id;
    DEFINE INDEX question_classe ON question COLUMNS classe_id;
  `);
  console.log('✅ Champs ajoutés\n');

  // 2. Migration des questions existantes basée sur quiz.theme
  console.log('🔄 Migration des questions existantes...');
  
  // Récupérer les quiz avec leur theme
  const quizzes = await db.query<any[]>('SELECT id, theme FROM quiz');
  console.log(`   Found ${quizzes[0]?.length || 0} quizzes`);

  // Mapping theme string -> matiere_id
  const matieres = await db.query<any[]>('SELECT id, name, slug FROM matiere');
  const matiereMap = new Map<string, string>();
  for (const m of (matieres[0] || [])) {
    matiereMap.set(m.name.toLowerCase(), m.id.toString());
    matiereMap.set(m.slug.toLowerCase(), m.id.toString());
  }
  console.log('   Matiere map:', Array.from(matiereMap.entries()).slice(0, 5));

  // Pour chaque quiz, mettre à jour ses questions avec la matiere correspondante
  for (const quiz of (quizzes[0] || [])) {
    if (!quiz.theme) continue;
    
    const themeLower = quiz.theme.toLowerCase();
    let matiereId = matiereMap.get(themeLower);
    
    // Try to match partial
    if (!matiereId) {
      for (const [key, id] of matiereMap) {
        if (themeLower.includes(key) || key.includes(themeLower)) {
          matiereId = id;
          break;
        }
      }
    }

    if (matiereId) {
      const result = await db.query(
        `UPDATE question SET matiere_id = type::thing("matiere", $matiereId) WHERE quizId = $quizId`,
        { 
          matiereId: matiereId.includes(':') ? matiereId.split(':')[1] : matiereId,
          quizId: quiz.id.toString()
        }
      );
      console.log(`   Updated questions for quiz "${quiz.theme}" -> ${matiereId}`);
    } else {
      console.log(`   ⚠️ No matiere found for quiz theme: "${quiz.theme}"`);
    }
  }

  // 3. Vérification
  console.log('\n📊 Vérification...');
  const questionsWithMatiere = await db.query('SELECT count() FROM question WHERE matiere_id != NONE GROUP ALL');
  const questionsTotal = await db.query('SELECT count() FROM question GROUP ALL');
  console.log(`   Questions avec matière: ${JSON.stringify(questionsWithMatiere[0])}`);
  console.log(`   Questions total: ${JSON.stringify(questionsTotal[0])}`);

  console.log('\n✅ Migration terminée!');
  await db.close();
}

main().catch(console.error);
