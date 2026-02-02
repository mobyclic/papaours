/**
 * API: Statistiques avancées d'un utilisateur
 * GET /api/users/[userId]/stats
 * 
 * Retourne des statistiques détaillées sur l'activité de l'utilisateur:
 * - Progression dans le temps
 * - Performance par matière/thème
 * - Temps de réponse moyen
 * - Historique des sessions
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, url }) => {
  const { userId } = params;
  
  if (!userId) {
    return json({ error: 'userId requis' }, { status: 400 });
  }

  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
  const period = url.searchParams.get('period') || '30'; // Jours
  const periodDays = parseInt(period);

  const db = await getSurrealDB();

  try {
    // 1. Stats générales
    const [generalStats] = await db.query(`
      LET $uid = type::thing('user', $userId);
      
      LET $sessions = SELECT * FROM quiz_session 
        WHERE user = $uid AND status = 'completed';
      
      LET $totalQuizzes = count($sessions);
      LET $totalScore = math::sum($sessions.score);
      LET $totalQuestions = math::sum($sessions.total_questions);
      LET $avgScore = IF $totalQuestions > 0 THEN 
        math::round(($totalScore / $totalQuestions) * 100) 
      ELSE 0 END;
      
      LET $perfectScores = count(
        SELECT * FROM $sessions WHERE score = total_questions
      );
      
      LET $userData = (SELECT current_streak, best_streak, total_badges, badge_points 
        FROM user WHERE id = $uid)[0];
      
      RETURN {
        totalQuizzes: $totalQuizzes,
        totalScore: $totalScore,
        totalQuestions: $totalQuestions,
        avgScore: $avgScore,
        perfectScores: $perfectScores,
        currentStreak: $userData.current_streak ?? 0,
        bestStreak: $userData.best_streak ?? 0,
        totalBadges: $userData.total_badges ?? 0,
        badgePoints: $userData.badge_points ?? 0
      };
    `, { userId: cleanUserId });

    // 2. Progression dans le temps (derniers X jours)
    const [progressionData] = await db.query(`
      LET $uid = type::thing('user', $userId);
      LET $startDate = time::now() - ${periodDays}d;
      
      SELECT 
        time::format(completedAt, '%Y-%m-%d') as date,
        count() as quizzes,
        math::sum(score) as score,
        math::sum(total_questions) as questions
      FROM quiz_session
      WHERE user = $uid 
        AND status = 'completed'
        AND completedAt > $startDate
      GROUP BY date
      ORDER BY date ASC
    `, { userId: cleanUserId });

    // 3. Performance par matière
    const [matiereStats] = await db.query(`
      LET $uid = type::thing('user', $userId);
      
      SELECT 
        quiz.matiere_id as matiere,
        count() as quiz_count,
        math::sum(score) as total_score,
        math::sum(total_questions) as total_questions,
        math::round((math::sum(score) / math::sum(total_questions)) * 100) as success_rate
      FROM quiz_session
      WHERE user = $uid 
        AND status = 'completed'
        AND quiz.matiere_id != NONE
      GROUP BY quiz.matiere_id
      ORDER BY quiz_count DESC
      FETCH matiere
    `, { userId: cleanUserId });

    // 4. Performance par thème
    const [themeStats] = await db.query(`
      LET $uid = type::thing('user', $userId);
      
      SELECT 
        quiz.theme_ids[0] as theme,
        count() as quiz_count,
        math::sum(score) as total_score,
        math::sum(total_questions) as total_questions,
        math::round((math::sum(score) / math::sum(total_questions)) * 100) as success_rate
      FROM quiz_session
      WHERE user = $uid 
        AND status = 'completed'
        AND quiz.theme_ids != NONE
      GROUP BY quiz.theme_ids[0]
      ORDER BY quiz_count DESC
      LIMIT 10
      FETCH theme
    `, { userId: cleanUserId });

    // 5. Historique des sessions récentes
    const [recentSessions] = await db.query(`
      SELECT 
        id,
        quiz.title as quiz_title,
        quiz.slug as quiz_slug,
        score,
        total_questions,
        mode,
        completedAt,
        math::round((score / total_questions) * 100) as percentage
      FROM quiz_session
      WHERE user = type::thing('user', $userId)
        AND status = 'completed'
      ORDER BY completedAt DESC
      LIMIT 20
      FETCH quiz
    `, { userId: cleanUserId });

    // 6. Distribution des scores - simplifié sans GROUP BY complexe
    const [allScores] = await db.query(`
      SELECT 
        score,
        total_questions,
        math::round((score / total_questions) * 100) as percentage
      FROM quiz_session
      WHERE user = type::thing('user', $userId)
        AND status = 'completed'
        AND total_questions > 0
    `, { userId: cleanUserId });
    
    // Calculer la distribution côté JS
    const scoreDistribution = (() => {
      const buckets: Record<number, number> = {};
      const scores = Array.isArray(allScores) ? allScores : [];
      for (const s of scores) {
        const bucket = Math.floor((s.percentage || 0) / 10) * 10;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      }
      return Object.entries(buckets)
        .map(([range, count]) => ({ score_range: parseInt(range), count }))
        .sort((a, b) => a.score_range - b.score_range);
    })();

    // 7. Stats par jour de la semaine
    const [weekdayStats] = await db.query(`
      LET $uid = type::thing('user', $userId);
      
      SELECT 
        time::format(completedAt, '%w') as weekday,
        count() as count,
        math::round(math::mean((score / total_questions) * 100)) as avg_score
      FROM quiz_session
      WHERE user = $uid 
        AND status = 'completed'
      GROUP BY weekday
      ORDER BY weekday ASC
    `, { userId: cleanUserId });

    // 8. Stats par heure
    const [hourlyStats] = await db.query(`
      LET $uid = type::thing('user', $userId);
      
      SELECT 
        time::format(completedAt, '%H') as hour,
        count() as count,
        math::round(math::mean((score / total_questions) * 100)) as avg_score
      FROM quiz_session
      WHERE user = $uid 
        AND status = 'completed'
      GROUP BY hour
      ORDER BY hour ASC
    `, { userId: cleanUserId });

    return json({
      general: (generalStats as any)?.[0] || {},
      progression: (progressionData as any[]) || [],
      byMatiere: (matiereStats as any[]) || [],
      byTheme: (themeStats as any[]) || [],
      recentSessions: ((recentSessions as any[]) || []).map(s => ({
        ...s,
        id: s.id?.toString()
      })),
      scoreDistribution: (scoreDistribution as any[]) || [],
      weekdayStats: (weekdayStats as any[]) || [],
      hourlyStats: (hourlyStats as any[]) || []
    });

  } catch (error) {
    console.error('Erreur API stats:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
