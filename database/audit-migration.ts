/**
 * Migration: Audit Schema Improvements
 * 
 * Ce script implémente les recommandations de l'audit du modèle de données.
 * À exécuter étape par étape, avec validation entre chaque phase.
 * 
 * Usage: bun run database/audit-migration.ts --phase=1
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://kweez-db-yabfmebc.aws-euw1.surreal.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'rootuser';
const SURREAL_PASS = process.env.SURREAL_PASS || '';

async function getDB() {
  const db = new Surreal();
  await db.connect(`${SURREAL_URL}/rpc`);
  await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
  await db.use({ namespace: 'kweez', database: 'maindb' });
  return db;
}

// ============================================================================
// PHASE 1: Schéma de la table question
// ============================================================================

async function phase1_question_schema(db: Surreal) {
  console.log('\n📦 Phase 1: Définition du schéma question...');
  
  const schema = `
    -- Convertir en SCHEMAFULL tout en préservant les données existantes
    -- Note: SurrealDB permet de définir un schéma sur une table existante
    
    DEFINE TABLE question TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
    
    -- Champs communs
    DEFINE FIELD question ON question TYPE string PERMISSIONS FULL;
    DEFINE FIELD questionType ON question TYPE string ASSERT $value INSIDE ['qcm', 'qcm_multiple', 'qcm_image', 'true_false', 'fill_blank', 'matching', 'ordering', 'open_short', 'open_long'] PERMISSIONS FULL;
    DEFINE FIELD difficulty ON question TYPE string DEFAULT 'medium' ASSERT $value INSIDE ['easy', 'medium', 'hard'] PERMISSIONS FULL;
    DEFINE FIELD explanation ON question TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD subject ON question TYPE option<record<subject>> PERMISSIONS FULL;
    DEFINE FIELD isActive ON question TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD is_public ON question TYPE bool DEFAULT false PERMISSIONS FULL;
    DEFINE FIELD createdAt ON question TYPE option<datetime> PERMISSIONS FULL;
    DEFINE FIELD updatedAt ON question TYPE option<datetime> PERMISSIONS FULL;
    DEFINE FIELD createdBy ON question TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD family ON question TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD pos ON question TYPE option<int> PERMISSIONS FULL;
    
    -- Médias
    DEFINE FIELD imageUrl ON question TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD imageCaption ON question TYPE option<string> PERMISSIONS FULL;
    
    -- Liens avec themes
    DEFINE FIELD theme_ids ON question TYPE option<array<record<theme>>> PERMISSIONS FULL;
    
    -- Grade difficulties (structure flexible car objet complexe)
    DEFINE FIELD grade_difficulties ON question FLEXIBLE TYPE option<array> PERMISSIONS FULL;
    
    -- QCM fields
    DEFINE FIELD options ON question TYPE option<array<string>> PERMISSIONS FULL;
    DEFINE FIELD optionImages ON question TYPE option<array<string>> PERMISSIONS FULL;
    DEFINE FIELD correctAnswer ON question FLEXIBLE TYPE option<string | int | array<int>> PERMISSIONS FULL;
    
    -- QCM multiple
    DEFINE FIELD answers ON question FLEXIBLE TYPE option<array> PERMISSIONS FULL;
    
    -- Fill blank
    DEFINE FIELD textWithBlanks ON question TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD correctAnswers ON question TYPE option<array<string>> PERMISSIONS FULL;
    DEFINE FIELD caseSensitive ON question TYPE option<bool> PERMISSIONS FULL;
    
    -- Matching
    DEFINE FIELD leftItems ON question FLEXIBLE TYPE option<array> PERMISSIONS FULL;
    DEFINE FIELD rightItems ON question FLEXIBLE TYPE option<array> PERMISSIONS FULL;
    DEFINE FIELD correctMatches ON question FLEXIBLE TYPE option<object> PERMISSIONS FULL;
    
    -- Ordering
    DEFINE FIELD items ON question FLEXIBLE TYPE option<array> PERMISSIONS FULL;
    DEFINE FIELD correctOrder ON question TYPE option<array<string>> PERMISSIONS FULL;
    
    -- Open questions
    DEFINE FIELD expectedKeywords ON question TYPE option<array<string>> PERMISSIONS FULL;
    DEFINE FIELD sampleAnswers ON question TYPE option<array<string>> PERMISSIONS FULL;
    DEFINE FIELD minWords ON question TYPE option<int> PERMISSIONS FULL;
    DEFINE FIELD maxWords ON question TYPE option<int> PERMISSIONS FULL;
    DEFINE FIELD placeholder ON question TYPE option<string> PERMISSIONS FULL;
    
    -- Index
    DEFINE INDEX idx_question_type ON question FIELDS questionType;
    DEFINE INDEX idx_question_subject ON question FIELDS subject;
    DEFINE INDEX idx_question_active ON question FIELDS isActive;
  `;
  
  await db.query(schema);
  console.log('✅ Schéma question défini');
  
  // Vérification
  const count = await db.query('SELECT count() FROM question GROUP ALL');
  console.log(`   ${JSON.stringify(count[0])} questions existantes préservées`);
}

// ============================================================================
// PHASE 2: Schéma de la table quiz
// ============================================================================

async function phase2_quiz_schema(db: Surreal) {
  console.log('\n📦 Phase 2: Définition du schéma quiz...');
  
  const schema = `
    DEFINE TABLE quiz TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
    
    DEFINE FIELD title ON quiz TYPE string PERMISSIONS FULL;
    DEFINE FIELD slug ON quiz TYPE string PERMISSIONS FULL;
    DEFINE FIELD description ON quiz TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD difficulty ON quiz TYPE int DEFAULT 5 PERMISSIONS FULL;
    DEFINE FIELD isActive ON quiz TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD isHomepage ON quiz TYPE option<bool> DEFAULT false PERMISSIONS FULL;
    DEFINE FIELD visibility ON quiz TYPE option<string> DEFAULT 'private' ASSERT $value == NONE OR $value INSIDE ['public', 'private', 'unlisted'] PERMISSIONS FULL;
    
    DEFINE FIELD subject ON quiz TYPE option<record<subject>> PERMISSIONS FULL;
    DEFINE FIELD theme_ids ON quiz TYPE option<array<record<theme>>> PERMISSIONS FULL;
    DEFINE FIELD target_grades ON quiz TYPE option<array<record<grade>>> PERMISSIONS FULL;
    DEFINE FIELD skills ON quiz TYPE option<array<record<skill>>> PERMISSIONS FULL;
    DEFINE FIELD topics ON quiz TYPE option<array<record<topic>>> PERMISSIONS FULL;
    
    DEFINE FIELD maxQuestions ON quiz TYPE option<int> PERMISSIONS FULL;
    DEFINE FIELD questionType ON quiz TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD shuffleQuestions ON quiz TYPE option<bool> DEFAULT true PERMISSIONS FULL;
    
    DEFINE FIELD allowModeChoice ON quiz TYPE option<bool> DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD allowTimeChoice ON quiz TYPE option<bool> DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD defaultMode ON quiz TYPE option<string> DEFAULT 'revision' PERMISSIONS FULL;
    
    DEFINE FIELD approved_public ON quiz TYPE option<bool> DEFAULT false PERMISSIONS FULL;
    DEFINE FIELD favorite_count ON quiz TYPE option<int> DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD order ON quiz TYPE option<int> DEFAULT 0 PERMISSIONS FULL;
    
    DEFINE FIELD createdAt ON quiz TYPE option<datetime> PERMISSIONS FULL;
    DEFINE FIELD updatedAt ON quiz TYPE option<datetime> PERMISSIONS FULL;
    DEFINE FIELD created_at ON quiz TYPE option<datetime> PERMISSIONS FULL;
    DEFINE FIELD updated_at ON quiz TYPE option<datetime> PERMISSIONS FULL;
    
    DEFINE INDEX idx_quiz_slug ON quiz FIELDS slug UNIQUE;
    DEFINE INDEX idx_quiz_visibility ON quiz FIELDS visibility;
    DEFINE INDEX idx_quiz_subject ON quiz FIELDS subject;
  `;
  
  await db.query(schema);
  console.log('✅ Schéma quiz défini');
}

// ============================================================================
// PHASE 3: Relation completes (user -> quiz)
// ============================================================================

async function phase3_completes_relation(db: Surreal) {
  console.log('\n📦 Phase 3: Création de la relation completes...');
  
  const schema = `
    -- Relation: user completes quiz
    DEFINE TABLE completes SCHEMAFULL TYPE RELATION
      FROM user
      TO quiz
      PERMISSIONS NONE;
    
    DEFINE FIELD score ON completes TYPE number PERMISSIONS FULL;
    DEFINE FIELD total_questions ON completes TYPE int PERMISSIONS FULL;
    DEFINE FIELD correct_answers ON completes TYPE int PERMISSIONS FULL;
    DEFINE FIELD duration_seconds ON completes TYPE option<int> PERMISSIONS FULL;
    DEFINE FIELD mode ON completes TYPE string DEFAULT 'revision' ASSERT $value INSIDE ['revision', 'exam', 'practice'] PERMISSIONS FULL;
    DEFINE FIELD completed_at ON completes TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    DEFINE FIELD grade ON completes TYPE option<record<grade>> PERMISSIONS FULL;
    DEFINE FIELD answers ON completes FLEXIBLE TYPE option<array> PERMISSIONS FULL;
    
    DEFINE INDEX idx_completes_user ON completes FIELDS in;
    DEFINE INDEX idx_completes_quiz ON completes FIELDS out;
    DEFINE INDEX idx_completes_date ON completes FIELDS completed_at;
  `;
  
  await db.query(schema);
  console.log('✅ Relation completes créée');
}

// ============================================================================
// PHASE 4: Migration quiz_session -> completes
// ============================================================================

async function phase4_migrate_sessions(db: Surreal) {
  console.log('\n📦 Phase 4: Migration quiz_session vers completes...');
  
  // Récupérer les sessions complétées
  const sessions = await db.query<any[]>(`
    SELECT * FROM quiz_session WHERE status = 'completed'
  `);
  
  if (!sessions[0] || sessions[0].length === 0) {
    console.log('   Aucune session complétée à migrer');
    return;
  }
  
  console.log(`   ${sessions[0].length} sessions à migrer...`);
  
  let migrated = 0;
  for (const session of sessions[0]) {
    try {
      // Extraire les IDs propres
      const userId = typeof session.userId === 'string' 
        ? session.userId.replace('user:', '') 
        : session.userId?.id || session.userId;
      const quizId = typeof session.quizId === 'string'
        ? session.quizId.replace('quiz:', '')
        : session.quizId?.id || session.quizId;
      const gradeId = typeof session.gradeId === 'string'
        ? session.gradeId
        : session.gradeId?.id || null;
      
      // Calculer la durée
      const startedAt = new Date(session.startedAt);
      const completedAt = new Date(session.completedAt);
      const duration = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
      
      // Compter les bonnes réponses
      const correctAnswers = session.answers?.filter((a: any) => a.isCorrect)?.length || 0;
      
      // Créer la relation
      await db.query(`
        RELATE user:${userId} -> completes -> quiz:${quizId} SET
          score = $score,
          total_questions = $total,
          correct_answers = $correct,
          duration_seconds = $duration,
          mode = $mode,
          completed_at = $completedAt,
          grade = ${gradeId ? `type::thing("grade", "${gradeId.replace('grade:', '')}")` : 'NONE'},
          answers = $answers
      `, {
        score: session.score || 0,
        total: session.totalQuestions || 0,
        correct: correctAnswers,
        duration: duration,
        mode: session.mode || 'revision',
        completedAt: session.completedAt,
        answers: session.answers || []
      });
      
      migrated++;
    } catch (e) {
      console.log(`   ⚠️ Erreur migration session ${session.id}:`, e);
    }
  }
  
  console.log(`✅ ${migrated}/${sessions[0].length} sessions migrées vers completes`);
}

// ============================================================================
// PHASE 5: Relations masters et studies (progression)
// ============================================================================

async function phase5_progress_relations(db: Surreal) {
  console.log('\n📦 Phase 5: Création des relations de progression...');
  
  const schema = `
    -- Relation: user masters subject
    DEFINE TABLE masters SCHEMAFULL TYPE RELATION
      FROM user
      TO subject
      PERMISSIONS NONE;
    
    DEFINE FIELD level ON masters TYPE string DEFAULT 'débutant' ASSERT $value INSIDE ['débutant', 'intermédiaire', 'confirmé', 'expert'] PERMISSIONS FULL;
    DEFINE FIELD total_xp ON masters TYPE number DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD quizzes_completed ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD correct_answers ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD total_answers ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD best_streak ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD updated_at ON masters TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    
    DEFINE INDEX idx_masters_unique ON masters FIELDS in, out UNIQUE;
    
    -- Relation: user studies theme
    DEFINE TABLE studies SCHEMAFULL TYPE RELATION
      FROM user
      TO theme
      PERMISSIONS NONE;
    
    DEFINE FIELD mastery_level ON studies TYPE number DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD questions_seen ON studies TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD correct_count ON studies TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD last_practiced ON studies TYPE option<datetime> PERMISSIONS FULL;
    
    DEFINE INDEX idx_studies_unique ON studies FIELDS in, out UNIQUE;
  `;
  
  await db.query(schema);
  console.log('✅ Relations masters et studies créées');
}

// ============================================================================
// PHASE 6: Relation earns (badges)
// ============================================================================

async function phase6_badge_relation(db: Surreal) {
  console.log('\n📦 Phase 6: Schéma badge et relation earns...');
  
  const schema = `
    -- Schéma badge
    DEFINE TABLE badge TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
    
    DEFINE FIELD name ON badge TYPE string PERMISSIONS FULL;
    DEFINE FIELD description ON badge TYPE string PERMISSIONS FULL;
    DEFINE FIELD icon ON badge TYPE string PERMISSIONS FULL;
    DEFINE FIELD category ON badge TYPE string ASSERT $value INSIDE ['progress', 'performance', 'streak', 'xp', 'special'] PERMISSIONS FULL;
    DEFINE FIELD condition_type ON badge TYPE string PERMISSIONS FULL;
    DEFINE FIELD condition_value ON badge TYPE number PERMISSIONS FULL;
    DEFINE FIELD points ON badge TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD is_active ON badge TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD created_at ON badge TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    
    -- Relation: user earns badge
    DEFINE TABLE earns SCHEMAFULL TYPE RELATION
      FROM user
      TO badge
      PERMISSIONS NONE;
    
    DEFINE FIELD earned_at ON earns TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    DEFINE FIELD context ON earns FLEXIBLE TYPE option<object> PERMISSIONS FULL;
    
    DEFINE INDEX idx_earns_user ON earns FIELDS in;
    DEFINE INDEX idx_earns_badge ON earns FIELDS out;
  `;
  
  await db.query(schema);
  console.log('✅ Schéma badge et relation earns créés');
}

// ============================================================================
// PHASE 7: Relation tutors
// ============================================================================

async function phase7_tutors_relation(db: Surreal) {
  console.log('\n📦 Phase 7: Création de la relation tutors...');
  
  const schema = `
    -- Relation: user (tutor) tutors user (student)
    DEFINE TABLE tutors SCHEMAFULL TYPE RELATION
      FROM user
      TO user
      PERMISSIONS NONE;
    
    DEFINE FIELD role ON tutors TYPE string DEFAULT 'tutor' ASSERT $value INSIDE ['tutor', 'parent', 'teacher'] PERMISSIONS FULL;
    DEFINE FIELD created_at ON tutors TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    DEFINE FIELD is_active ON tutors TYPE bool DEFAULT true PERMISSIONS FULL;
  `;
  
  await db.query(schema);
  console.log('✅ Relation tutors créée');
}

// ============================================================================
// PHASE 8: Schémas complémentaires
// ============================================================================

async function phase8_additional_schemas(db: Surreal) {
  console.log('\n📦 Phase 8: Schémas complémentaires...');
  
  const schema = `
    -- Schéma chapter
    DEFINE TABLE chapter TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
    
    DEFINE FIELD name ON chapter TYPE string PERMISSIONS FULL;
    DEFINE FIELD slug ON chapter TYPE string PERMISSIONS FULL;
    DEFINE FIELD description ON chapter TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD official_program ON chapter TYPE option<record<official_program>> PERMISSIONS FULL;
    DEFINE FIELD order ON chapter TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD is_active ON chapter TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD created_at ON chapter TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    
    -- Schéma subject
    DEFINE TABLE subject TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
    
    DEFINE FIELD code ON subject TYPE string PERMISSIONS FULL;
    DEFINE FIELD name ON subject TYPE string PERMISSIONS FULL;
    DEFINE FIELD icon ON subject TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD color ON subject TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD domain ON subject TYPE option<record<domain>> PERMISSIONS FULL;
    DEFINE FIELD hours_per_week ON subject TYPE option<number> PERMISSIONS FULL;
    DEFINE FIELD is_active ON subject TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD created_at ON subject TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    DEFINE FIELD order ON subject TYPE option<int> DEFAULT 0 PERMISSIONS FULL;
    
    DEFINE INDEX idx_subject_code ON subject FIELDS code UNIQUE;
    DEFINE INDEX idx_subject_domain ON subject FIELDS domain;
    
    -- Schéma quiz_session (garder pour historique, mais marquer comme legacy)
    DEFINE TABLE quiz_session TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
    
    DEFINE FIELD userId ON quiz_session TYPE record<user> PERMISSIONS FULL;
    DEFINE FIELD quizId ON quiz_session TYPE record<quiz> PERMISSIONS FULL;
    DEFINE FIELD gradeId ON quiz_session TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD mode ON quiz_session TYPE string DEFAULT 'revision' PERMISSIONS FULL;
    DEFINE FIELD status ON quiz_session TYPE string DEFAULT 'in_progress' ASSERT $value INSIDE ['in_progress', 'completed', 'abandoned'] PERMISSIONS FULL;
    DEFINE FIELD score ON quiz_session TYPE number DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD totalQuestions ON quiz_session TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD currentQuestionIndex ON quiz_session TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD questionIds ON quiz_session TYPE array PERMISSIONS FULL;
    DEFINE FIELD answers ON quiz_session FLEXIBLE TYPE array DEFAULT [] PERMISSIONS FULL;
    DEFINE FIELD savedAnswers ON quiz_session FLEXIBLE TYPE object DEFAULT {} PERMISSIONS FULL;
    DEFINE FIELD startedAt ON quiz_session TYPE datetime PERMISSIONS FULL;
    DEFINE FIELD completedAt ON quiz_session TYPE option<datetime> PERMISSIONS FULL;
    DEFINE FIELD lastActivityAt ON quiz_session TYPE datetime PERMISSIONS FULL;
    
    DEFINE INDEX idx_quiz_session_user ON quiz_session FIELDS userId;
    DEFINE INDEX idx_quiz_session_status ON quiz_session FIELDS status;
  `;
  
  await db.query(schema);
  console.log('✅ Schémas complémentaires définis');
}

// ============================================================================
// PHASE 9: Nettoyage
// ============================================================================

async function phase9_cleanup(db: Surreal) {
  console.log('\n📦 Phase 9: Nettoyage...');
  
  // Supprimer la table option (vide)
  try {
    await db.query('REMOVE TABLE option');
    console.log('   ✅ Table option supprimée');
  } catch (e) {
    console.log('   ⚠️ Table option déjà supprimée ou erreur');
  }
  
  // Vérifier les tables orphelines
  const tables = await db.query('INFO FOR DB');
  console.log('   Tables restantes:', Object.keys((tables[0] as any)?.tables || {}));
  
  console.log('✅ Nettoyage terminé');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const phase = process.argv.find(a => a.startsWith('--phase='))?.split('=')[1];
  
  console.log('🚀 Migration Audit Schema');
  console.log('========================');
  
  const db = await getDB();
  
  try {
    if (!phase || phase === 'all') {
      await phase1_question_schema(db);
      await phase2_quiz_schema(db);
      await phase3_completes_relation(db);
      await phase4_migrate_sessions(db);
      await phase5_progress_relations(db);
      await phase6_badge_relation(db);
      await phase7_tutors_relation(db);
      await phase8_additional_schemas(db);
      await phase9_cleanup(db);
    } else {
      const phases: Record<string, (db: Surreal) => Promise<void>> = {
        '1': phase1_question_schema,
        '2': phase2_quiz_schema,
        '3': phase3_completes_relation,
        '4': phase4_migrate_sessions,
        '5': phase5_progress_relations,
        '6': phase6_badge_relation,
        '7': phase7_tutors_relation,
        '8': phase8_additional_schemas,
        '9': phase9_cleanup,
      };
      
      if (phases[phase]) {
        await phases[phase](db);
      } else {
        console.log(`Phase inconnue: ${phase}`);
        console.log('Phases disponibles: 1-9 ou "all"');
      }
    }
    
    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
