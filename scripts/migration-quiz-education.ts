/**
 * Migration: Lier les quiz existants aux nouvelles tables subject et grade
 * 
 * Mapping des anciennes matières vers les nouvelles:
 * - matiere:slug -> subject:code
 * 
 * Mapping des anciennes classes vers les nouvelles:
 * - classe:slug -> grade:code (FR_*)
 */

import Surreal from 'surrealdb';

// Mapping ancien slug matière -> nouveau code subject
const MATIERE_TO_SUBJECT: Record<string, string> = {
  'mathematiques': 'math',
  'francais': 'french',
  'histoire': 'history',
  'geographie': 'geography',
  'sciences': 'biology',
  'physique-chimie': 'physics', // ou chemistry selon contexte
  'anglais': 'english',
  'musique': 'music',
  'arts': 'art',
  'education-civique': 'civics',
};

// Mapping ancien slug classe -> nouveau code grade
const CLASSE_TO_GRADE: Record<string, string> = {
  // Maternelle
  'ps': 'FR_PS',
  'ms': 'FR_MS', 
  'gs': 'FR_GS',
  // Primaire
  'cp': 'FR_CP',
  'ce1': 'FR_CE1',
  'ce2': 'FR_CE2',
  'cm1': 'FR_CM1',
  'cm2': 'FR_CM2',
  // Collège
  '6eme': 'FR_6e',
  '5eme': 'FR_5e',
  '4eme': 'FR_4e',
  '3eme': 'FR_3e',
  // Lycée
  '2nde': 'FR_2nde_G',
  '1ere': 'FR_1ere_G',
  'terminale': 'FR_Term_G',
  // Supérieur
  'licence-1': 'FR_L1',
  'licence-2': 'FR_L2',
  'licence-3': 'FR_L3',
  'master-1': 'FR_M1',
  'master-2': 'FR_M2',
};

async function migrate() {
  const db = new Surreal();
  
  try {
    const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
    await db.connect(`${url}/rpc`);
    await db.signin({
      username: process.env.SURREAL_USER || 'rootuser',
      password: process.env.SURREAL_PASS || 'n1n@S1mone',
    });
    await db.use({ 
      namespace: process.env.SURREAL_NAMESPACE || 'kweez', 
      database: process.env.SURREAL_DATABASE || 'dbkweez' 
    });

    console.log('🔌 Connected to SurrealDB');
    console.log('🔄 Migrating quizzes to new education structure...\n');

    // 1. Récupérer toutes les anciennes matières
    const [matieres] = await db.query<any[]>('SELECT id, slug FROM matiere');
    const matiereMap = new Map<string, string>();
    for (const m of matieres || []) {
      matiereMap.set(m.id.toString(), m.slug);
    }
    console.log(`📚 Found ${matiereMap.size} legacy matieres`);

    // 2. Récupérer toutes les anciennes classes
    const [classes] = await db.query<any[]>('SELECT id, slug FROM classe');
    const classeMap = new Map<string, string>();
    for (const c of classes || []) {
      classeMap.set(c.id.toString(), c.slug);
    }
    console.log(`🎓 Found ${classeMap.size} legacy classes`);

    // 3. Récupérer tous les quiz avec leurs anciennes références
    const [quizzes] = await db.query<any[]>(`
      SELECT id, title, matiere_id, classe_id, subject, target_grades 
      FROM quiz
    `);
    console.log(`📝 Found ${quizzes?.length || 0} quizzes to migrate\n`);

    let migratedSubject = 0;
    let migratedGrades = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const quiz of quizzes || []) {
      const quizId = quiz.id.toString();
      const updates: string[] = [];
      const params: Record<string, any> = {};

      // Migrer la matière -> subject
      if (quiz.matiere_id && !quiz.subject) {
        const matiereIdStr = quiz.matiere_id.toString();
        const matiereSlug = matiereMap.get(matiereIdStr);
        
        if (matiereSlug && MATIERE_TO_SUBJECT[matiereSlug]) {
          const subjectCode = MATIERE_TO_SUBJECT[matiereSlug];
          updates.push(`subject = subject:${subjectCode}`);
          migratedSubject++;
        }
      }

      // Migrer la classe -> target_grades
      if (quiz.classe_id && (!quiz.target_grades || quiz.target_grades.length === 0)) {
        const classeIdStr = quiz.classe_id.toString();
        const classeSlug = classeMap.get(classeIdStr);
        
        if (classeSlug && CLASSE_TO_GRADE[classeSlug]) {
          const gradeCode = CLASSE_TO_GRADE[classeSlug];
          updates.push(`target_grades = [grade:${gradeCode}]`);
          migratedGrades++;
        }
      }

      // Appliquer les updates si nécessaire
      if (updates.length > 0) {
        try {
          const updateQuery = `UPDATE ${quizId} SET ${updates.join(', ')}, updated_at = time::now()`;
          await db.query(updateQuery, params);
          console.log(`  ✅ ${quiz.title?.substring(0, 50)}... → ${updates.join(', ')}`);
        } catch (e: any) {
          errors.push(`${quiz.title}: ${e.message}`);
          console.log(`  ❌ ${quiz.title}: ${e.message}`);
        }
      } else {
        skipped++;
      }
    }

    // 4. Extraire les grades depuis les titres des quiz (CE2, 6ème, etc.)
    console.log('\n🔍 Analyzing quiz titles for grade info...');
    
    const titlePatterns: [RegExp, string][] = [
      [/CE2/i, 'FR_CE2'],
      [/CE1/i, 'FR_CE1'],
      [/CM1/i, 'FR_CM1'],
      [/CM2/i, 'FR_CM2'],
      [/CP/i, 'FR_CP'],
      [/6[èe]me/i, 'FR_6e'],
      [/5[èe]me/i, 'FR_5e'],
      [/4[èe]me/i, 'FR_4e'],
      [/3[èe]me/i, 'FR_3e'],
      [/2nde|seconde/i, 'FR_2nde_G'],
      [/1[èe]re|première/i, 'FR_1ere_G'],
      [/terminale/i, 'FR_Term_G'],
    ];

    const [quizzesNoGrade] = await db.query<any[]>(`
      SELECT id, title FROM quiz 
      WHERE target_grades IS NONE OR array::len(target_grades) = 0
    `);

    let titleMatches = 0;
    for (const quiz of quizzesNoGrade || []) {
      for (const [pattern, gradeCode] of titlePatterns) {
        if (pattern.test(quiz.title)) {
          try {
            await db.query(`
              UPDATE ${quiz.id.toString()} SET 
                target_grades = [grade:${gradeCode}],
                updated_at = time::now()
            `);
            console.log(`  ✅ "${quiz.title}" → grade:${gradeCode} (from title)`);
            titleMatches++;
          } catch (e: any) {
            console.log(`  ❌ "${quiz.title}": ${e.message}`);
          }
          break;
        }
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Subjects migrated: ${migratedSubject}`);
    console.log(`   - Grades migrated: ${migratedGrades}`);
    console.log(`   - Grades from titles: ${titleMatches}`);
    console.log(`   - Skipped (already migrated): ${skipped}`);
    if (errors.length > 0) {
      console.log(`   - Errors: ${errors.length}`);
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
