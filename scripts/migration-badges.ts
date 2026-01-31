/**
 * Migration: Système de Badges
 * 
 * Crée les tables badge et user_badge pour la gamification.
 * 
 * Types de badges:
 * - Accomplissement (premier quiz, 10 quiz, 100 quiz...)
 * - Performance (série parfaite, score 100%, temps record)
 * - Régularité (streak 3 jours, 7 jours, 30 jours)
 * - Maîtrise (maître d'une matière, expert d'un thème)
 * - Spéciaux (early adopter, événements)
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc';
const SURREAL_USER = process.env.SURREAL_USER || 'rootuser';
const SURREAL_PASS = process.env.SURREAL_PASS || 'n1n@S1mone';
const SURREAL_NS = process.env.SURREAL_NS || 'papaours';
const SURREAL_DB = process.env.SURREAL_DB || 'maindb';

// Définition des badges
const BADGES = [
  // === ACCOMPLISSEMENT ===
  {
    slug: 'first_quiz',
    name: 'Premier Pas',
    description: 'Terminer son premier quiz',
    icon: '🎯',
    category: 'accomplishment',
    rarity: 'common',
    points: 10,
    condition: { type: 'quiz_count', value: 1 }
  },
  {
    slug: 'quiz_10',
    name: 'Apprenti Curieux',
    description: 'Terminer 10 quiz',
    icon: '📚',
    category: 'accomplishment',
    rarity: 'common',
    points: 25,
    condition: { type: 'quiz_count', value: 10 }
  },
  {
    slug: 'quiz_50',
    name: 'Étudiant Assidu',
    description: 'Terminer 50 quiz',
    icon: '🎓',
    category: 'accomplishment',
    rarity: 'uncommon',
    points: 50,
    condition: { type: 'quiz_count', value: 50 }
  },
  {
    slug: 'quiz_100',
    name: 'Centurion',
    description: 'Terminer 100 quiz',
    icon: '💯',
    category: 'accomplishment',
    rarity: 'rare',
    points: 100,
    condition: { type: 'quiz_count', value: 100 }
  },
  {
    slug: 'quiz_500',
    name: 'Maître Érudit',
    description: 'Terminer 500 quiz',
    icon: '🏆',
    category: 'accomplishment',
    rarity: 'epic',
    points: 250,
    condition: { type: 'quiz_count', value: 500 }
  },

  // === PERFORMANCE ===
  {
    slug: 'perfect_quiz',
    name: 'Sans Faute',
    description: 'Obtenir 100% à un quiz',
    icon: '⭐',
    category: 'performance',
    rarity: 'common',
    points: 15,
    condition: { type: 'perfect_score', value: 1 }
  },
  {
    slug: 'perfect_5',
    name: 'Série Parfaite',
    description: 'Obtenir 5 scores parfaits',
    icon: '🌟',
    category: 'performance',
    rarity: 'uncommon',
    points: 40,
    condition: { type: 'perfect_score', value: 5 }
  },
  {
    slug: 'perfect_20',
    name: 'Perfectionniste',
    description: 'Obtenir 20 scores parfaits',
    icon: '💫',
    category: 'performance',
    rarity: 'rare',
    points: 100,
    condition: { type: 'perfect_score', value: 20 }
  },
  {
    slug: 'speed_demon',
    name: 'Éclair',
    description: 'Terminer un quiz en moins de 2 minutes avec 100%',
    icon: '⚡',
    category: 'performance',
    rarity: 'rare',
    points: 75,
    condition: { type: 'speed_perfect', value: 120 }
  },
  {
    slug: 'no_mistakes_10',
    name: 'Concentration',
    description: 'Répondre à 10 questions d\'affilée sans erreur',
    icon: '🎯',
    category: 'performance',
    rarity: 'uncommon',
    points: 30,
    condition: { type: 'streak_correct', value: 10 }
  },
  {
    slug: 'no_mistakes_25',
    name: 'Focus Total',
    description: 'Répondre à 25 questions d\'affilée sans erreur',
    icon: '🔥',
    category: 'performance',
    rarity: 'rare',
    points: 60,
    condition: { type: 'streak_correct', value: 25 }
  },

  // === RÉGULARITÉ ===
  {
    slug: 'streak_3',
    name: 'Régulier',
    description: 'Jouer 3 jours d\'affilée',
    icon: '📅',
    category: 'regularity',
    rarity: 'common',
    points: 20,
    condition: { type: 'daily_streak', value: 3 }
  },
  {
    slug: 'streak_7',
    name: 'Semaine Parfaite',
    description: 'Jouer 7 jours d\'affilée',
    icon: '🗓️',
    category: 'regularity',
    rarity: 'uncommon',
    points: 50,
    condition: { type: 'daily_streak', value: 7 }
  },
  {
    slug: 'streak_30',
    name: 'Mois Héroïque',
    description: 'Jouer 30 jours d\'affilée',
    icon: '🏅',
    category: 'regularity',
    rarity: 'epic',
    points: 200,
    condition: { type: 'daily_streak', value: 30 }
  },
  {
    slug: 'early_bird',
    name: 'Lève-Tôt',
    description: 'Terminer un quiz avant 8h du matin',
    icon: '🌅',
    category: 'regularity',
    rarity: 'uncommon',
    points: 25,
    condition: { type: 'time_of_day', value: 'early' }
  },
  {
    slug: 'night_owl',
    name: 'Noctambule',
    description: 'Terminer un quiz après 22h',
    icon: '🦉',
    category: 'regularity',
    rarity: 'uncommon',
    points: 25,
    condition: { type: 'time_of_day', value: 'late' }
  },

  // === MAÎTRISE ===
  {
    slug: 'matiere_master',
    name: 'Expert de Matière',
    description: 'Atteindre le niveau "maître" dans une matière',
    icon: '👨‍🎓',
    category: 'mastery',
    rarity: 'epic',
    points: 150,
    condition: { type: 'matiere_level', value: 'maître' }
  },
  {
    slug: 'all_themes',
    name: 'Explorateur',
    description: 'Essayer au moins un quiz de chaque thème',
    icon: '🗺️',
    category: 'mastery',
    rarity: 'rare',
    points: 80,
    condition: { type: 'themes_explored', value: 'all' }
  },
  {
    slug: 'polymath',
    name: 'Polymathe',
    description: 'Atteindre le niveau "confirmé" dans 5 matières',
    icon: '🧠',
    category: 'mastery',
    rarity: 'legendary',
    points: 300,
    condition: { type: 'multi_matiere_level', value: { level: 'confirmé', count: 5 } }
  },

  // === SPÉCIAUX ===
  {
    slug: 'early_adopter',
    name: 'Pionnier',
    description: 'Faire partie des premiers utilisateurs',
    icon: '🚀',
    category: 'special',
    rarity: 'legendary',
    points: 100,
    condition: { type: 'special', value: 'early_adopter' }
  },
  {
    slug: 'comeback',
    name: 'Le Retour',
    description: 'Revenir après 30 jours d\'absence',
    icon: '👋',
    category: 'special',
    rarity: 'uncommon',
    points: 30,
    condition: { type: 'special', value: 'comeback' }
  },
  {
    slug: 'perfectionist_epreuve',
    name: 'Examen Parfait',
    description: 'Obtenir 100% en mode épreuve',
    icon: '🎖️',
    category: 'special',
    rarity: 'rare',
    points: 100,
    condition: { type: 'perfect_epreuve', value: 1 }
  }
];

async function migrate() {
  const db = new Surreal();
  
  try {
    console.log('🔌 Connexion à SurrealDB...');
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    console.log('✅ Connecté');

    // 1. Créer la table badge
    console.log('\n📛 Création de la table badge...');
    await db.query(`
      DEFINE TABLE badge SCHEMAFULL PERMISSIONS FULL;
      
      DEFINE FIELD slug ON badge TYPE string ASSERT $value != NONE;
      DEFINE FIELD name ON badge TYPE string ASSERT $value != NONE;
      DEFINE FIELD description ON badge TYPE string ASSERT $value != NONE;
      DEFINE FIELD icon ON badge TYPE string DEFAULT '🏆';
      DEFINE FIELD category ON badge TYPE string 
        ASSERT $value INSIDE ['accomplishment', 'performance', 'regularity', 'mastery', 'special'];
      DEFINE FIELD rarity ON badge TYPE string 
        ASSERT $value INSIDE ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      DEFINE FIELD points ON badge TYPE number DEFAULT 10;
      DEFINE FIELD condition ON badge TYPE object;
      DEFINE FIELD is_active ON badge TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON badge TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX badge_slug ON badge FIELDS slug UNIQUE;
    `);
    console.log('✅ Table badge créée');

    // 2. Créer la table user_badge (relation user <-> badge)
    console.log('\n🎖️ Création de la table user_badge...');
    await db.query(`
      DEFINE TABLE user_badge SCHEMAFULL PERMISSIONS FULL;
      
      DEFINE FIELD user ON user_badge TYPE record<user> ASSERT $value != NONE;
      DEFINE FIELD badge ON user_badge TYPE record<badge> ASSERT $value != NONE;
      DEFINE FIELD earned_at ON user_badge TYPE datetime DEFAULT time::now();
      DEFINE FIELD notified ON user_badge TYPE bool DEFAULT false;
      DEFINE FIELD progress ON user_badge TYPE number DEFAULT 0;
      
      DEFINE INDEX user_badge_unique ON user_badge FIELDS user, badge UNIQUE;
      DEFINE INDEX user_badge_user ON user_badge FIELDS user;
    `);
    console.log('✅ Table user_badge créée');

    // 3. Ajouter champ pour le streak quotidien dans user
    console.log('\n👤 Mise à jour de la table user pour le streak...');
    await db.query(`
      DEFINE FIELD current_streak ON user TYPE number DEFAULT 0;
      DEFINE FIELD best_streak ON user TYPE number DEFAULT 0;
      DEFINE FIELD last_activity_date ON user TYPE option<string>;
      DEFINE FIELD total_badges ON user TYPE number DEFAULT 0;
      DEFINE FIELD badge_points ON user TYPE number DEFAULT 0;
    `);
    console.log('✅ Champs streak ajoutés à user');

    // 4. Insérer les badges
    console.log('\n📥 Insertion des badges...');
    for (const badge of BADGES) {
      try {
        await db.query(`
          CREATE badge SET
            slug = $slug,
            name = $name,
            description = $description,
            icon = $icon,
            category = $category,
            rarity = $rarity,
            points = $points,
            condition = $condition,
            is_active = true
        `, {
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          points: badge.points,
          condition: badge.condition
        });
        console.log(`  ✅ ${badge.icon} ${badge.name}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️ ${badge.icon} ${badge.name} (existe déjà)`);
        } else {
          console.log(`  ❌ ${badge.name}: ${e.message}`);
        }
      }
    }

    // 5. Vérification
    console.log('\n📊 Vérification...');
    const [badges] = await db.query('SELECT count() as total FROM badge GROUP ALL');
    console.log(`Total badges: ${(badges as any)?.[0]?.total || 0}`);

    const badgesByCategory = await db.query(`
      SELECT category, count() as count FROM badge GROUP BY category
    `);
    console.log('Par catégorie:', JSON.stringify(badgesByCategory[0], null, 2));

    console.log('\n✅ Migration badges terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
