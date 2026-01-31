/**
 * API: Classement / Leaderboard
 * GET /api/leaderboard
 * 
 * Paramètres:
 * - type: 'points' | 'badges' | 'streak' | 'quizzes' (default: 'points')
 * - period: 'all' | 'week' | 'month' (default: 'all')
 * - matiere: slug de la matière (optionnel)
 * - classe: id de la classe (optionnel)
 * - limit: nombre de résultats (default: 50)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const type = url.searchParams.get('type') || 'points';
  const period = url.searchParams.get('period') || 'all';
  const matiere = url.searchParams.get('matiere');
  const classe = url.searchParams.get('classe');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  const db = await getSurrealDB();

  try {
    // Calculer la date de début selon la période
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND qs.completedAt > time::now() - 7d';
    } else if (period === 'month') {
      dateFilter = 'AND qs.completedAt > time::now() - 30d';
    }

    let leaderboard: any[] = [];

    if (type === 'points') {
      // Classement par points totaux (basé sur les quiz complétés)
      const query = `
        SELECT 
          user.id as user_id,
          user.name as name,
          user.email as email,
          user.avatar_url as avatar_url,
          user.current_streak as current_streak,
          user.best_streak as best_streak,
          user.total_badges as total_badges,
          user.badge_points as badge_points,
          count() as quiz_count,
          math::sum(score) as total_score,
          math::sum(total_questions) as total_questions,
          math::round((math::sum(score) / math::sum(total_questions)) * 100) as success_rate
        FROM quiz_session as qs
        WHERE qs.status = 'completed' 
          AND qs.user != NONE
          ${dateFilter}
          ${matiere ? `AND qs.quiz.matiere_id.slug = '${matiere}'` : ''}
          ${classe ? `AND qs.classeId = '${classe}'` : ''}
        GROUP BY user
        ORDER BY total_score DESC
        LIMIT ${limit}
        FETCH user
      `;
      
      const [results] = await db.query(query);
      leaderboard = (results as any[]) || [];
      
    } else if (type === 'badges') {
      // Classement par nombre de badges
      const query = `
        SELECT 
          id as user_id,
          name,
          email,
          avatar_url,
          current_streak,
          best_streak,
          total_badges,
          badge_points
        FROM user
        WHERE total_badges > 0
        ORDER BY badge_points DESC, total_badges DESC
        LIMIT ${limit}
      `;
      
      const [results] = await db.query(query);
      leaderboard = (results as any[]) || [];
      
    } else if (type === 'streak') {
      // Classement par streak actuel
      const query = `
        SELECT 
          id as user_id,
          name,
          email,
          avatar_url,
          current_streak,
          best_streak,
          total_badges,
          badge_points
        FROM user
        WHERE current_streak > 0
        ORDER BY current_streak DESC, best_streak DESC
        LIMIT ${limit}
      `;
      
      const [results] = await db.query(query);
      leaderboard = (results as any[]) || [];
      
    } else if (type === 'quizzes') {
      // Classement par nombre de quiz terminés
      const query = `
        SELECT 
          user.id as user_id,
          user.name as name,
          user.email as email,
          user.avatar_url as avatar_url,
          user.current_streak as current_streak,
          user.total_badges as total_badges,
          count() as quiz_count,
          math::sum(score) as total_score,
          math::sum(total_questions) as total_questions
        FROM quiz_session as qs
        WHERE qs.status = 'completed'
          AND qs.user != NONE
          ${dateFilter}
          ${matiere ? `AND qs.quiz.matiere_id.slug = '${matiere}'` : ''}
        GROUP BY user
        ORDER BY quiz_count DESC
        LIMIT ${limit}
        FETCH user
      `;
      
      const [results] = await db.query(query);
      leaderboard = (results as any[]) || [];
    }

    // Ajouter le rang à chaque entrée
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id?.toString() || entry.id?.toString(),
      name: entry.name || 'Anonyme',
      email: entry.email,
      avatarUrl: entry.avatar_url,
      currentStreak: entry.current_streak || 0,
      bestStreak: entry.best_streak || 0,
      totalBadges: entry.total_badges || 0,
      badgePoints: entry.badge_points || 0,
      quizCount: entry.quiz_count || 0,
      totalScore: entry.total_score || 0,
      totalQuestions: entry.total_questions || 0,
      successRate: entry.success_rate || 0
    }));

    // Récupérer les stats globales
    const [globalStats] = await db.query(`
      SELECT 
        count() as total_users
      FROM user
      WHERE id != NONE
      GROUP ALL
    `);

    const [quizStats] = await db.query(`
      SELECT 
        count() as total_completed,
        math::sum(score) as global_score
      FROM quiz_session
      WHERE status = 'completed'
      GROUP ALL
    `);

    return json({
      leaderboard: rankedLeaderboard,
      meta: {
        type,
        period,
        matiere,
        classe,
        total: rankedLeaderboard.length
      },
      globalStats: {
        totalUsers: (globalStats as any)?.[0]?.total_users || 0,
        totalQuizCompleted: (quizStats as any)?.[0]?.total_completed || 0,
        globalScore: (quizStats as any)?.[0]?.global_score || 0
      }
    });

  } catch (error) {
    console.error('Erreur API leaderboard:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
