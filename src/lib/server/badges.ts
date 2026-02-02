/**
 * Service de gestion des badges
 * 
 * Vérifie et attribue automatiquement les badges aux utilisateurs
 * basé sur leurs actions et performances.
 */

import type Surreal from 'surrealdb';

// Types de conditions pour les badges
export interface BadgeCondition {
  type: 'quiz_count' | 'perfect_score' | 'speed_perfect' | 'streak_correct' | 
        'daily_streak' | 'time_of_day' | 'matiere_level' | 'themes_explored' | 
        'multi_matiere_level' | 'special' | 'perfect_epreuve';
  value: any;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'accomplishment' | 'performance' | 'regularity' | 'mastery' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  condition: BadgeCondition;
  is_active: boolean;
}

export interface UserBadge {
  id: string;
  user: string;
  badge: string;
  earned_at: string;
  notified: boolean;
  progress: number;
}

export interface BadgeCheckResult {
  earned: Badge[];
  progress: { badge: Badge; current: number; required: number }[];
}

// Couleurs par rareté pour l'UI
export const RARITY_COLORS = {
  common: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  uncommon: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  legendary: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' }
};

export const RARITY_LABELS = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire'
};

export const CATEGORY_LABELS = {
  accomplishment: 'Accomplissement',
  performance: 'Performance',
  regularity: 'Régularité',
  mastery: 'Maîtrise',
  special: 'Spécial'
};

/**
 * Vérifie et attribue les badges à un utilisateur après une action
 */
export async function checkAndAwardBadges(
  db: Surreal,
  userId: string,
  context: {
    quizCompleted?: boolean;
    isPerfectScore?: boolean;
    isEpreuveMode?: boolean;
    timeSeconds?: number;
    correctStreak?: number;
  }
): Promise<Badge[]> {
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
  const earnedBadges: Badge[] = [];

  try {
    // Récupérer tous les badges actifs non encore obtenus par l'utilisateur
    const [availableBadges] = await db.query<Badge[][]>(`
      SELECT * FROM badge 
      WHERE is_active = true 
      AND id NOT IN (
        SELECT badge FROM user_badge WHERE user = type::thing('user', $userId)
      )
    `, { userId: cleanUserId });

    if (!availableBadges || availableBadges.length === 0) {
      return earnedBadges;
    }

    // Récupérer les stats de l'utilisateur
    const [userStats] = await db.query(`
      LET $uid = type::thing('user', $userId);
      
      -- Nombre de quiz terminés
      LET $quizCount = (SELECT count() FROM quiz_session WHERE user = $uid AND status = 'completed' GROUP ALL)[0].count ?? 0;
      
      -- Nombre de scores parfaits
      LET $perfectCount = (SELECT count() FROM quiz_session 
        WHERE user = $uid AND status = 'completed' AND score = total_questions GROUP ALL)[0].count ?? 0;
      
      -- Score parfait en mode épreuve
      LET $perfectEpreuveCount = (SELECT count() FROM quiz_session 
        WHERE user = $uid AND status = 'completed' AND score = total_questions AND mode = 'epreuve' GROUP ALL)[0].count ?? 0;
      
      -- User data
      LET $userData = (SELECT current_streak, best_streak, last_activity_date FROM user WHERE id = $uid)[0];
      
      RETURN {
        quiz_count: $quizCount,
        perfect_count: $perfectCount,
        perfect_epreuve_count: $perfectEpreuveCount,
        current_streak: $userData.current_streak ?? 0,
        best_streak: $userData.best_streak ?? 0
      };
    `, { userId: cleanUserId });

    const stats = (userStats as any)?.[0] || {};

    // Vérifier chaque badge
    for (const badge of availableBadges) {
      const isEarned = await checkBadgeCondition(badge, stats, context);
      
      if (isEarned) {
        // Attribuer le badge
        await db.query(`
          CREATE user_badge SET
            user = type::thing('user', $userId),
            badge = $badgeId,
            earned_at = time::now(),
            notified = false;
          
          UPDATE type::thing('user', $userId) SET 
            total_badges += 1,
            badge_points += $points;
        `, { 
          userId: cleanUserId, 
          badgeId: badge.id,
          points: badge.points
        });

        earnedBadges.push(badge);
        console.log(`🎖️ Badge attribué: ${badge.icon} ${badge.name} à user:${cleanUserId}`);
      }
    }

    return earnedBadges;

  } catch (error) {
    console.error('Erreur vérification badges:', error);
    return earnedBadges;
  }
}

/**
 * Vérifie si une condition de badge est remplie
 */
async function checkBadgeCondition(
  badge: Badge,
  stats: any,
  context: any
): Promise<boolean> {
  const { type, value } = badge.condition;

  switch (type) {
    case 'quiz_count':
      return stats.quiz_count >= value;

    case 'perfect_score':
      return stats.perfect_count >= value;

    case 'perfect_epreuve':
      return stats.perfect_epreuve_count >= value;

    case 'speed_perfect':
      // Quiz parfait en moins de X secondes
      return context.isPerfectScore && context.timeSeconds && context.timeSeconds <= value;

    case 'streak_correct':
      // Série de réponses correctes
      return context.correctStreak && context.correctStreak >= value;

    case 'daily_streak':
      return stats.current_streak >= value;

    case 'time_of_day':
      const hour = new Date().getHours();
      if (value === 'early') return hour < 8;
      if (value === 'late') return hour >= 22;
      return false;

    // Les badges de maîtrise et spéciaux nécessitent des vérifications plus complexes
    // Ils seront vérifiés par des fonctions dédiées
    case 'matiere_level':
    case 'themes_explored':
    case 'multi_matiere_level':
    case 'special':
      return false; // Géré ailleurs

    default:
      return false;
  }
}

/**
 * Met à jour le streak quotidien d'un utilisateur
 */
export async function updateDailyStreak(db: Surreal, userId: string): Promise<number> {
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const [result] = await db.query(`
      LET $uid = type::thing('user', $userId);
      LET $today = $todayDate;
      LET $user = (SELECT last_activity_date, current_streak, best_streak FROM user WHERE id = $uid)[0];
      
      -- Calculer le nouveau streak
      LET $lastDate = $user.last_activity_date;
      LET $currentStreak = $user.current_streak ?? 0;
      
      -- Si même jour, ne rien changer
      IF $lastDate = $today THEN
        RETURN $currentStreak;
      END;
      
      -- Calculer la différence de jours
      LET $yesterday = time::format(time::now() - 1d, '%Y-%m-%d');
      
      LET $newStreak = IF $lastDate = $yesterday THEN
        $currentStreak + 1
      ELSE
        1
      END;
      
      -- Mettre à jour l'utilisateur
      UPDATE $uid SET 
        last_activity_date = $today,
        current_streak = $newStreak,
        best_streak = math::max([$user.best_streak ?? 0, $newStreak]);
      
      RETURN $newStreak;
    `, { userId: cleanUserId, todayDate: today });

    return (result as any)?.[0] || 1;

  } catch (error) {
    console.error('Erreur mise à jour streak:', error);
    return 0;
  }
}

/**
 * Récupère tous les badges d'un utilisateur
 */
export async function getUserBadges(db: Surreal, userId: string): Promise<{
  earned: (Badge & { earned_at: string })[];
  available: Badge[];
  stats: { total: number; points: number; byCategory: Record<string, number> };
}> {
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

  try {
    const [earnedBadges] = await db.query<any[][]>(`
      SELECT 
        badge.* as badge,
        earned_at
      FROM user_badge 
      WHERE user = type::thing('user', $userId)
      ORDER BY earned_at DESC
      FETCH badge
    `, { userId: cleanUserId });

    const [availableBadges] = await db.query<Badge[][]>(`
      SELECT * FROM badge 
      WHERE is_active = true 
      AND id NOT IN (
        SELECT badge FROM user_badge WHERE user = type::thing('user', $userId)
      )
      ORDER BY rarity, category
    `, { userId: cleanUserId });

    // Calculer les stats
    const earned = (earnedBadges || []).map((ub: any) => ({
      ...ub.badge,
      earned_at: ub.earned_at
    }));

    const byCategory: Record<string, number> = {};
    let totalPoints = 0;

    for (const badge of earned) {
      byCategory[badge.category] = (byCategory[badge.category] || 0) + 1;
      totalPoints += badge.points || 0;
    }

    return {
      earned,
      available: availableBadges || [],
      stats: {
        total: earned.length,
        points: totalPoints,
        byCategory
      }
    };

  } catch (error) {
    console.error('Erreur récupération badges:', error);
    return {
      earned: [],
      available: [],
      stats: { total: 0, points: 0, byCategory: {} }
    };
  }
}

/**
 * Marque les badges comme notifiés (après affichage à l'utilisateur)
 */
export async function markBadgesAsNotified(db: Surreal, userId: string, badgeIds: string[]): Promise<void> {
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

  try {
    await db.query(`
      UPDATE user_badge SET notified = true 
      WHERE user = type::thing('user', $userId) 
      AND badge IN $badgeIds
    `, { userId: cleanUserId, badgeIds });
  } catch (error) {
    console.error('Erreur notification badges:', error);
  }
}

/**
 * Récupère les badges non notifiés d'un utilisateur
 */
export async function getUnnotifiedBadges(db: Surreal, userId: string): Promise<Badge[]> {
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

  try {
    const [badges] = await db.query<any[][]>(`
      SELECT badge.* FROM user_badge 
      WHERE user = type::thing('user', $userId) 
      AND notified = false
      FETCH badge
    `, { userId: cleanUserId });

    return (badges || []).map((ub: any) => ub.badge);
  } catch (error) {
    console.error('Erreur badges non notifiés:', error);
    return [];
  }
}
