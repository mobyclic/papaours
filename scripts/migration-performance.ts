#!/usr/bin/env bun

/**
 * Migration pour améliorer les performances SurrealDB
 * 
 * Ce script ajoute :
 * - Index manquants pour les requêtes fréquentes
 * - Fonctions SurrealDB pour les calculs de niveau
 * 
 * Usage: bun run scripts/migration-performance.ts
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc';
const SURREAL_USER = process.env.SURREAL_USER || 'papaours';
const SURREAL_PASS = process.env.SURREAL_PASS || 'n1n@S1mone';
const SURREAL_NS = process.env.SURREAL_NS || 'papaours';
const SURREAL_DB = process.env.SURREAL_DB || 'dbpapaours';

async function main() {
  console.log('🚀 Migration Performance SurrealDB\n');

  const db = new Surreal();

  try {
    // Connexion
    console.log('📡 Connexion à SurrealDB...');
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    console.log('✅ Connecté\n');

    // ============================================
    // 1. INDEX POUR LES REQUÊTES FRÉQUENTES
    // ============================================
    console.log('📋 Création des index manquants...\n');

    const indexes = [
      // Quiz - recherche par matière et statut actif
      {
        name: 'quiz_matiere_active',
        table: 'quiz',
        fields: 'matiere_id, isActive',
        description: 'Recherche quiz par matière (explore)'
      },
      // Quiz - recherche par thème
      {
        name: 'quiz_theme_ids',
        table: 'quiz',
        fields: 'theme_ids',
        description: 'Recherche quiz par thèmes'
      },
      // Quiz sessions - par utilisateur et statut
      {
        name: 'session_user_status',
        table: 'quiz_session',
        fields: 'userId, status',
        description: 'Sessions en cours par utilisateur'
      },
      // Quiz sessions - par date de création
      {
        name: 'session_created',
        table: 'quiz_session',
        fields: 'createdAt',
        description: 'Sessions récentes'
      },
      // Quiz results - par utilisateur et date
      {
        name: 'result_user_date',
        table: 'quiz_result',
        fields: 'userId, completedAt',
        description: 'Résultats récents par utilisateur'
      },
      // Quiz results - par quiz
      {
        name: 'result_quiz',
        table: 'quiz_result',
        fields: 'quizId',
        description: 'Résultats par quiz (stats)'
      },
      // Questions - par matière
      {
        name: 'question_matiere',
        table: 'question',
        fields: 'matiere_id',
        description: 'Questions par matière'
      },
      // Questions - par difficulté et statut
      {
        name: 'question_difficulty_active',
        table: 'question',
        fields: 'difficulty, isActive',
        description: 'Questions par difficulté'
      },
      // Questions - par type
      {
        name: 'question_type',
        table: 'question',
        fields: 'questionType',
        description: 'Questions par type'
      },
      // User - par classe (pour le classement)
      {
        name: 'user_classe',
        table: 'user',
        fields: 'classe_id',
        description: 'Utilisateurs par classe'
      }
    ];

    for (const idx of indexes) {
      try {
        await db.query(`DEFINE INDEX ${idx.name} ON ${idx.table} FIELDS ${idx.fields}`);
        console.log(`  ✅ Index ${idx.name} créé (${idx.description})`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️  Index ${idx.name} existe déjà`);
        } else {
          console.error(`  ❌ Erreur index ${idx.name}:`, e.message);
        }
      }
    }

    // ============================================
    // 2. FONCTIONS SURREALDB
    // ============================================
    console.log('\n📋 Création des fonctions SurrealDB...\n');

    // Fonction: Calculer le niveau basé sur les points
    try {
      await db.query(`
        DEFINE FUNCTION fn::calculate_niveau($points: int) {
          RETURN IF $points >= 1000 THEN 'maître'
            ELSE IF $points >= 600 THEN 'expert'
            ELSE IF $points >= 300 THEN 'confirmé'
            ELSE IF $points >= 100 THEN 'apprenti'
            ELSE 'débutant'
          END;
        };
      `);
      console.log('  ✅ Fonction fn::calculate_niveau créée');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⏭️  Fonction fn::calculate_niveau existe déjà');
      } else {
        console.error('  ❌ Erreur fn::calculate_niveau:', e.message);
      }
    }

    // Fonction: Calculer le pourcentage de score
    try {
      await db.query(`
        DEFINE FUNCTION fn::score_percentage($score: int, $total: int) {
          RETURN IF $total = 0 THEN 0
            ELSE math::round(($score * 100) / $total)
          END;
        };
      `);
      console.log('  ✅ Fonction fn::score_percentage créée');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⏭️  Fonction fn::score_percentage existe déjà');
      } else {
        console.error('  ❌ Erreur fn::score_percentage:', e.message);
      }
    }

    // Fonction: Obtenir l'emoji selon le score
    try {
      await db.query(`
        DEFINE FUNCTION fn::score_emoji($percentage: int) {
          RETURN IF $percentage >= 100 THEN '🏆'
            ELSE IF $percentage >= 80 THEN '🌟'
            ELSE IF $percentage >= 60 THEN '👍'
            ELSE IF $percentage >= 40 THEN '💪'
            ELSE '🌱'
          END;
        };
      `);
      console.log('  ✅ Fonction fn::score_emoji créée');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⏭️  Fonction fn::score_emoji existe déjà');
      } else {
        console.error('  ❌ Erreur fn::score_emoji:', e.message);
      }
    }

    // Fonction: Points requis pour le prochain niveau
    try {
      await db.query(`
        DEFINE FUNCTION fn::points_to_next_level($points: int) {
          RETURN IF $points >= 1000 THEN 0
            ELSE IF $points >= 600 THEN 1000 - $points
            ELSE IF $points >= 300 THEN 600 - $points
            ELSE IF $points >= 100 THEN 300 - $points
            ELSE 100 - $points
          END;
        };
      `);
      console.log('  ✅ Fonction fn::points_to_next_level créée');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⏭️  Fonction fn::points_to_next_level existe déjà');
      } else {
        console.error('  ❌ Erreur fn::points_to_next_level:', e.message);
      }
    }

    // Fonction: Stats utilisateur agrégées
    try {
      await db.query(`
        DEFINE FUNCTION fn::user_stats($user_id: string) {
          LET $results = (SELECT score, totalQuestions, completedAt FROM quiz_result WHERE userId = $user_id);
          LET $total_quizzes = array::len($results);
          LET $total_score = math::sum($results.score);
          LET $total_questions = math::sum($results.totalQuestions);
          LET $avg_percentage = IF $total_questions > 0 THEN math::round(($total_score * 100) / $total_questions) ELSE 0 END;
          
          RETURN {
            total_quizzes: $total_quizzes,
            total_score: $total_score,
            total_questions: $total_questions,
            average_percentage: $avg_percentage,
            niveau: fn::calculate_niveau($total_score)
          };
        };
      `);
      console.log('  ✅ Fonction fn::user_stats créée');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⏭️  Fonction fn::user_stats existe déjà');
      } else {
        console.error('  ❌ Erreur fn::user_stats:', e.message);
      }
    }

    // ============================================
    // 3. TEST DES FONCTIONS
    // ============================================
    console.log('\n📋 Test des fonctions...\n');

    try {
      const testResults = await db.query(`
        RETURN {
          niveau_0: fn::calculate_niveau(0),
          niveau_50: fn::calculate_niveau(50),
          niveau_150: fn::calculate_niveau(150),
          niveau_400: fn::calculate_niveau(400),
          niveau_700: fn::calculate_niveau(700),
          niveau_1200: fn::calculate_niveau(1200),
          score_pct: fn::score_percentage(8, 10),
          emoji_100: fn::score_emoji(100),
          emoji_75: fn::score_emoji(75),
          next_level_50: fn::points_to_next_level(50),
          next_level_250: fn::points_to_next_level(250)
        };
      `);
      console.log('  ✅ Tests des fonctions:');
      console.log('     ', JSON.stringify(testResults[0], null, 2).replace(/\n/g, '\n      '));
    } catch (e: any) {
      console.error('  ❌ Erreur lors des tests:', e.message);
    }

    // ============================================
    // 4. RÉSUMÉ
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration terminée !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Récapitulatif:');
    console.log(`   • ${indexes.length} index créés/vérifiés`);
    console.log('   • 5 fonctions SurrealDB créées/vérifiées');
    console.log('\n💡 Utilisation des fonctions:');
    console.log('   SELECT fn::calculate_niveau(points) FROM user_progress;');
    console.log('   SELECT fn::score_percentage(score, totalQuestions) FROM quiz_result;');
    console.log('   SELECT fn::user_stats($userId);');
    console.log('\n');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    await db.close();
    process.exit(1);
  }
}

main();
