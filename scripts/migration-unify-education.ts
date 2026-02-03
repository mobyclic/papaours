/**
 * Migration complète pour unifier les tables éducation
 * 
 * Actions:
 * 1. Supprimer les tables vides/inutilisées
 * 2. Migrer classe → grade (avec mapping)
 * 3. Garder matiere, supprimer subject (moins utilisé)
 * 4. Nettoyer les références dans quiz, question, user_progress
 */

import Surreal from "surrealdb";

const SURREAL_URL = process.env.SURREAL_URL || "wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud";
const SURREAL_USER = process.env.SURREAL_USER || "rootuser";
const SURREAL_PASS = process.env.SURREAL_PASS || "n1n@S1mone";

// Mapping classe.name → grade.id
const CLASSE_TO_GRADE: Record<string, string> = {
  // Maternelle
  'PS': 'FR_PS',
  'Petite Section': 'FR_PS',
  'MS': 'FR_MS',
  'Moyenne Section': 'FR_MS',
  'GS': 'FR_GS',
  'Grande Section': 'FR_GS',
  
  // Primaire
  'CP': 'FR_CP',
  'CE1': 'FR_CE1',
  'CE2': 'FR_CE2',
  'CM1': 'FR_CM1',
  'CM2': 'FR_CM2',
  
  // Collège
  '6ème': 'FR_6e',
  '6e': 'FR_6e',
  '5ème': 'FR_5e',
  '5e': 'FR_5e',
  '4ème': 'FR_4e',
  '4e': 'FR_4e',
  '3ème': 'FR_3e',
  '3e': 'FR_3e',
  
  // Lycée
  '2nde': 'FR_2nde_G',
  'Seconde': 'FR_2nde_G',
  '1ère': 'FR_1ere_G',
  'Première': 'FR_1ere_G',
  'Terminale': 'FR_Tle_G',
  'Tle': 'FR_Tle_G',
  
  // Supérieur
  'Licence 1': 'FR_L1',
  'L1': 'FR_L1',
  'Licence 2': 'FR_L2',
  'L2': 'FR_L2',
  'Licence 3': 'FR_L3',
  'L3': 'FR_L3',
  'Master 1': 'FR_M1',
  'M1': 'FR_M1',
  'Master 2': 'FR_M2',
  'M2': 'FR_M2',
  'Doctorat': 'FR_Doctorat',
};

async function migrate() {
  const db = new Surreal();

  try {
    console.log("🔌 Connexion à SurrealDB...");
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: "kweez", database: "dbkweez" });
    console.log("✅ Connecté à SurrealDB\n");

    // ============================================
    // PHASE 1: Supprimer les tables vides/inutilisées
    // ============================================
    console.log("═══════════════════════════════════════");
    console.log("📦 PHASE 1: Suppression des tables inutilisées");
    console.log("═══════════════════════════════════════\n");

    const tablesToDelete = [
      'topic',
      'skill', 
      'subject_alias',
      'translation',
      'language',
      'chapter',
      'chapter_theme',
    ];

    for (const table of tablesToDelete) {
      try {
        // Vérifier si la table existe et est vide
        const [count] = await db.query(`SELECT count() as c FROM ${table} GROUP ALL`);
        const recordCount = (count as any)?.c || 0;
        
        if (recordCount === 0) {
          await db.query(`REMOVE TABLE ${table}`);
          console.log(`  ✅ Table '${table}' supprimée (était vide)`);
        } else {
          console.log(`  ⚠️ Table '${table}' a ${recordCount} records - non supprimée`);
        }
      } catch (e: any) {
        if (e.message?.includes('not exist')) {
          console.log(`  ℹ️ Table '${table}' n'existe pas`);
        } else {
          console.log(`  ❌ Erreur sur '${table}': ${e.message}`);
        }
      }
    }

    // ============================================
    // PHASE 2: Créer le mapping classe → grade
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("🔗 PHASE 2: Mapping classe → grade");
    console.log("═══════════════════════════════════════\n");

    // Récupérer toutes les classes
    const [classes] = await db.query<any[]>('SELECT id, name FROM classe');
    const classeMapping: Record<string, string> = {};
    
    console.log("  Création du mapping:");
    for (const classe of (classes || [])) {
      const classeId = classe.id.toString();
      const classeName = classe.name;
      
      // Trouver le grade correspondant
      let gradeId = CLASSE_TO_GRADE[classeName];
      
      if (!gradeId) {
        // Essayer de trouver par approximation
        const normalizedName = classeName.toLowerCase().replace(/[èéê]/g, 'e').replace(/[àâ]/g, 'a');
        for (const [key, value] of Object.entries(CLASSE_TO_GRADE)) {
          if (key.toLowerCase().replace(/[èéê]/g, 'e').replace(/[àâ]/g, 'a') === normalizedName) {
            gradeId = value;
            break;
          }
        }
      }
      
      if (gradeId) {
        classeMapping[classeId] = gradeId;
        console.log(`    ${classeName} (${classeId}) → grade:${gradeId}`);
      } else {
        console.log(`    ⚠️ ${classeName} (${classeId}) → PAS DE MAPPING`);
      }
    }

    // ============================================
    // PHASE 3: Migrer les questions
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("📝 PHASE 3: Migration des questions");
    console.log("═══════════════════════════════════════\n");

    // Récupérer les questions avec class_difficulties
    const [questions] = await db.query<any[]>('SELECT id, class_difficulties FROM question WHERE class_difficulties != NONE');
    let questionsUpdated = 0;
    
    for (const question of (questions || [])) {
      if (!question.class_difficulties || question.class_difficulties.length === 0) continue;
      
      const newDifficulties: any[] = [];
      let needsUpdate = false;
      
      for (const cd of question.class_difficulties) {
        const classeId = cd.classe_id?.toString() || cd.classe_id;
        if (!classeId) continue;
        
        const gradeId = classeMapping[classeId];
        if (gradeId) {
          newDifficulties.push({
            grade_id: `grade:${gradeId}`,
            difficulty: cd.difficulty,
            points: cd.points
          });
          needsUpdate = true;
        } else {
          // Garder l'ancien format si pas de mapping
          newDifficulties.push(cd);
        }
      }
      
      if (needsUpdate && newDifficulties.length > 0) {
        const questionId = question.id.toString().replace('question:', '');
        await db.query(`
          UPDATE type::thing("question", $id) SET 
            grade_difficulties = $gradeDiff,
            class_difficulties = NONE
        `, { id: questionId, gradeDiff: newDifficulties });
        questionsUpdated++;
      }
    }
    console.log(`  ✅ ${questionsUpdated} questions migrées (class_difficulties → grade_difficulties)`);

    // ============================================
    // PHASE 4: Migrer les quiz
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("🎯 PHASE 4: Migration des quiz");
    console.log("═══════════════════════════════════════\n");

    // Récupérer les quiz avec classe_id
    const [quizzes] = await db.query<any[]>('SELECT id, classe_id, target_grades FROM quiz');
    let quizzesUpdated = 0;
    
    for (const quiz of (quizzes || [])) {
      const quizId = quiz.id.toString().replace('quiz:', '');
      const updates: string[] = [];
      const params: Record<string, any> = { id: quizId };
      
      // Migrer classe_id vers target_grades si pas déjà fait
      if (quiz.classe_id && (!quiz.target_grades || quiz.target_grades.length === 0)) {
        const classeId = quiz.classe_id.toString();
        const gradeId = classeMapping[classeId];
        
        if (gradeId) {
          updates.push('target_grades = $targetGrades');
          params.targetGrades = [`grade:${gradeId}`];
        }
      }
      
      // Supprimer classe_id et subject (on garde matiere_id)
      if (quiz.classe_id) {
        updates.push('classe_id = NONE');
      }
      
      if (updates.length > 0) {
        await db.query(`UPDATE type::thing("quiz", $id) SET ${updates.join(', ')}`, params);
        quizzesUpdated++;
      }
    }
    console.log(`  ✅ ${quizzesUpdated} quiz migrés`);

    // Supprimer le champ subject des quiz (on garde matiere_id)
    await db.query('UPDATE quiz SET subject = NONE WHERE subject != NONE');
    console.log(`  ✅ Champ 'subject' supprimé des quiz`);

    // ============================================
    // PHASE 5: Ajouter grade_id aux user_progress
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("📊 PHASE 5: Migration user_progress");
    console.log("═══════════════════════════════════════\n");

    // Les user_progress utilisent déjà matiere_id et theme_id, pas de classe
    // On vérifie juste
    const [progressCount] = await db.query('SELECT count() as c FROM user_progress GROUP ALL');
    console.log(`  ℹ️ ${(progressCount as any)?.c || 0} user_progress (pas de migration nécessaire)`);

    // ============================================
    // PHASE 6: Définir les nouveaux champs
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("🔧 PHASE 6: Définition des champs");
    console.log("═══════════════════════════════════════\n");

    // Ajouter grade_difficulties à question
    try {
      await db.query(`DEFINE FIELD grade_difficulties ON TABLE question TYPE option<array>`);
      console.log(`  ✅ Champ 'grade_difficulties' défini sur question`);
    } catch (e) {
      console.log(`  ℹ️ Champ 'grade_difficulties' existe déjà`);
    }

    // ============================================
    // PHASE 7: Supprimer la table subject
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("🗑️ PHASE 7: Suppression de 'subject'");
    console.log("═══════════════════════════════════════\n");

    try {
      // Vérifier les dépendances
      const [subjectRefs] = await db.query('SELECT count() as c FROM quiz WHERE subject != NONE GROUP ALL');
      if ((subjectRefs as any)?.c > 0) {
        console.log(`  ⚠️ ${(subjectRefs as any).c} quiz ont encore un subject - nettoyage...`);
        await db.query('UPDATE quiz SET subject = NONE');
      }
      
      await db.query('REMOVE TABLE subject');
      console.log(`  ✅ Table 'subject' supprimée`);
    } catch (e: any) {
      console.log(`  ⚠️ Impossible de supprimer 'subject': ${e.message}`);
    }

    // ============================================
    // PHASE 8: Supprimer la table classe
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("🗑️ PHASE 8: Suppression de 'classe'");
    console.log("═══════════════════════════════════════\n");

    try {
      // Vérifier les dépendances
      const [classeRefs] = await db.query('SELECT count() as c FROM quiz WHERE classe_id != NONE GROUP ALL');
      if ((classeRefs as any)?.c > 0) {
        console.log(`  ⚠️ ${(classeRefs as any).c} quiz ont encore une classe_id - nettoyage...`);
        await db.query('UPDATE quiz SET classe_id = NONE');
      }
      
      await db.query('REMOVE TABLE classe');
      console.log(`  ✅ Table 'classe' supprimée`);
    } catch (e: any) {
      console.log(`  ⚠️ Impossible de supprimer 'classe': ${e.message}`);
    }

    // ============================================
    // PHASE 9: Supprimer domain (plus utilisé sans subject)
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("🗑️ PHASE 9: Suppression de 'domain'");
    console.log("═══════════════════════════════════════\n");

    try {
      await db.query('REMOVE TABLE domain');
      console.log(`  ✅ Table 'domain' supprimée`);
    } catch (e: any) {
      console.log(`  ⚠️ Impossible de supprimer 'domain': ${e.message}`);
    }

    // ============================================
    // RÉSUMÉ FINAL
    // ============================================
    console.log("\n═══════════════════════════════════════");
    console.log("📋 RÉSUMÉ FINAL");
    console.log("═══════════════════════════════════════\n");

    // Lister les tables restantes
    const [info] = await db.query('INFO FOR DB');
    const remainingTables = Object.keys((info as any)?.tables || {}).sort();
    
    console.log("Tables restantes:");
    for (const table of remainingTables) {
      const [count] = await db.query(`SELECT count() as c FROM ${table} GROUP ALL`);
      console.log(`  - ${table}: ${(count as any)?.c || 0} records`);
    }

    console.log("\n✅ Migration terminée avec succès!");
    console.log("\n⚠️ IMPORTANT: Mettez à jour le code pour utiliser:");
    console.log("   - grade au lieu de classe");
    console.log("   - grade_difficulties au lieu de class_difficulties");
    console.log("   - matiere au lieu de subject");

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
