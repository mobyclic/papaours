/**
 * Migration: Unifier matiere vers subject
 * 
 * Cette migration :
 * 1. Crée les subjects manquants (physique_chimie)
 * 2. Ajoute un champ subject aux questions, quiz, themes
 * 3. Migre les données de matiere_id vers subject
 * 4. Garde matiere_id temporairement pour compatibilité
 */

import Surreal from "surrealdb";

const db = new Surreal();

// Mapping matiere slug → subject code
const MATIERE_TO_SUBJECT: Record<string, string> = {
  "anglais": "anglais",
  "arts": "arts_plastiques",
  "francais": "francais",
  "geographie": "geographie",
  "histoire": "histoire",
  "mathematiques": "mathematiques",
  "musique": "musique",
  "physique-chimie": "physique_chimie", // À créer
  "sciences": "sciences",
  "education-civique": "emc",
};

async function main() {
  console.log("🚀 Migration: matiere → subject\n");

  await db.connect(process.env.SURREAL_URL + "/rpc");
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: "kweez", database: "dbkweez" });

  console.log("✅ Connecté à SurrealDB\n");

  // 1. Créer le subject physique_chimie s'il n'existe pas
  console.log("📝 Étape 1: Vérification/création des subjects manquants...");
  
  const existingPhysique = await db.query("SELECT id FROM subject WHERE code = 'physique_chimie'");
  if ((existingPhysique[0] as any[])?.length === 0) {
    await db.query(`
      CREATE subject:physique_chimie SET
        code = "physique_chimie",
        name = "Physique-Chimie",
        icon = "⚗️",
        color = "violet",
        domain = "sciences",
        order = 3,
        is_active = true,
        created_at = time::now()
    `);
    console.log("   ✅ Créé subject:physique_chimie");
  } else {
    console.log("   ℹ️ subject:physique_chimie existe déjà");
  }

  // 2. Récupérer le mapping matiere_id → subject
  console.log("\n📝 Étape 2: Construction du mapping matiere → subject...");
  
  const matieres = await db.query("SELECT id, slug FROM matiere");
  const matiereToSubjectMap: Record<string, string> = {};
  
  for (const m of (matieres[0] as any[])) {
    const matiereId = m.id.toString();
    const slug = m.slug;
    const subjectCode = MATIERE_TO_SUBJECT[slug];
    
    if (subjectCode) {
      matiereToSubjectMap[matiereId] = `subject:${subjectCode}`;
      console.log(`   ${matiereId} → subject:${subjectCode}`);
    } else {
      console.log(`   ⚠️ Pas de mapping pour: ${slug}`);
    }
  }

  // 3. Migrer les questions
  console.log("\n📝 Étape 3: Migration des questions...");
  
  const questions = await db.query("SELECT id, matiere_id FROM question WHERE matiere_id != NONE");
  let questionCount = 0;
  
  for (const q of (questions[0] as any[])) {
    const matiereId = q.matiere_id?.toString();
    const subjectId = matiereToSubjectMap[matiereId];
    
    if (subjectId) {
      const cleanSubjectCode = subjectId.replace("subject:", "");
      await db.query(
        `UPDATE $questionId SET subject = type::thing("subject", $subjectCode)`,
        { questionId: q.id, subjectCode: cleanSubjectCode }
      );
      questionCount++;
    }
  }
  console.log(`   ✅ ${questionCount} questions migrées`);

  // 4. Migrer les quiz
  console.log("\n📝 Étape 4: Migration des quiz...");
  
  const quizzes = await db.query("SELECT id, matiere_id FROM quiz WHERE matiere_id != NONE");
  let quizCount = 0;
  
  for (const quiz of (quizzes[0] as any[])) {
    const matiereId = quiz.matiere_id?.toString();
    const subjectId = matiereToSubjectMap[matiereId];
    
    if (subjectId) {
      const cleanSubjectCode = subjectId.replace("subject:", "");
      await db.query(
        `UPDATE $quizId SET subject = type::thing("subject", $subjectCode)`,
        { quizId: quiz.id, subjectCode: cleanSubjectCode }
      );
      quizCount++;
    }
  }
  console.log(`   ✅ ${quizCount} quiz migrés`);

  // 5. Migrer les thèmes
  console.log("\n📝 Étape 5: Migration des thèmes...");
  
  const themes = await db.query("SELECT id, matiere_id, matiere_ids FROM theme");
  let themeCount = 0;
  
  for (const theme of (themes[0] as any[])) {
    // Gérer matiere_id simple
    if (theme.matiere_id) {
      const matiereId = theme.matiere_id.toString();
      const subjectId = matiereToSubjectMap[matiereId];
      
      if (subjectId) {
        const cleanSubjectCode = subjectId.replace("subject:", "");
        await db.query(
          `UPDATE $themeId SET subject = type::thing("subject", $subjectCode)`,
          { themeId: theme.id, subjectCode: cleanSubjectCode }
        );
        themeCount++;
      }
    }
    
    // Gérer matiere_ids (array)
    if (theme.matiere_ids && Array.isArray(theme.matiere_ids) && theme.matiere_ids.length > 0) {
      const subjectIds: string[] = [];
      for (const mid of theme.matiere_ids) {
        const matiereId = mid.toString();
        const subjectId = matiereToSubjectMap[matiereId];
        if (subjectId) {
          subjectIds.push(subjectId.replace("subject:", ""));
        }
      }
      
      if (subjectIds.length > 0) {
        // Utiliser le premier comme subject principal
        await db.query(
          `UPDATE $themeId SET subject = type::thing("subject", $subjectCode)`,
          { themeId: theme.id, subjectCode: subjectIds[0] }
        );
        if (!theme.matiere_id) themeCount++;
      }
    }
  }
  console.log(`   ✅ ${themeCount} thèmes migrés`);

  // 6. Vérification
  console.log("\n📊 Vérification finale...");
  
  const verifyQuestions = await db.query("SELECT count() as c FROM question WHERE subject != NONE GROUP ALL");
  const verifyQuiz = await db.query("SELECT count() as c FROM quiz WHERE subject != NONE GROUP ALL");
  const verifyThemes = await db.query("SELECT count() as c FROM theme WHERE subject != NONE GROUP ALL");
  
  console.log(`   Questions avec subject: ${(verifyQuestions[0] as any[])?.[0]?.c || 0}`);
  console.log(`   Quiz avec subject: ${(verifyQuiz[0] as any[])?.[0]?.c || 0}`);
  console.log(`   Thèmes avec subject: ${(verifyThemes[0] as any[])?.[0]?.c || 0}`);

  // 7. Afficher un exemple
  console.log("\n📋 Exemple de question migrée:");
  const example = await db.query("SELECT id, question, matiere_id, subject FROM question WHERE subject != NONE LIMIT 1");
  console.log(JSON.stringify(example[0], null, 2));

  await db.close();
  console.log("\n✅ Migration terminée !");
  console.log("\n⚠️ Note: Les champs matiere_id sont conservés pour compatibilité.");
  console.log("   Une fois le code mis à jour, vous pourrez les supprimer.");
}

main().catch(console.error);
