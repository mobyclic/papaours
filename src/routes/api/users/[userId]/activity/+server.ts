import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const userId = `user:${params.userId}`;
    
    // Get recent quiz results
    const [quizResults] = await db.query<[{
      id: string;
      quiz_title: string;
      score: number;
      total_questions: number;
      completed_at: string;
    }[]]>(`
      SELECT 
        id,
        quiz.title as quiz_title,
        score,
        total_questions,
        completed_at
      FROM user_result 
      WHERE user = $userId
      ORDER BY completed_at DESC
      LIMIT 10
    `, { userId });
    
    // Get recent badges
    const [recentBadges] = await db.query<[{
      badge_name: string;
      badge_icon: string;
      earned_at: string;
    }[]]>(`
      SELECT 
        badge.name as badge_name,
        badge.icon as badge_icon,
        earned_at
      FROM user_badge 
      WHERE user = $userId
      ORDER BY earned_at DESC
      LIMIT 5
    `, { userId });
    
    // Build activity list
    const activities: any[] = [];
    
    // Add quiz completions
    for (const result of quizResults || []) {
      const scorePercent = result.total_questions > 0 
        ? Math.round((result.score / result.total_questions) * 100) 
        : 0;
      
      activities.push({
        id: result.id?.toString() || `quiz_${Date.now()}`,
        type: 'quiz_completed',
        title: result.quiz_title || 'Quiz',
        subtitle: `${result.score}/${result.total_questions} bonnes réponses`,
        date: result.completed_at,
        score: scorePercent,
        icon: '📝'
      });
    }
    
    // Add badge earnings
    for (const badge of recentBadges || []) {
      activities.push({
        id: `badge_${badge.earned_at}`,
        type: 'badge_earned',
        title: `Badge obtenu: ${badge.badge_name}`,
        date: badge.earned_at,
        icon: badge.badge_icon || '🏆'
      });
    }
    
    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return json({
      activities: activities.slice(0, 10)
    });
    
  } catch (error) {
    console.error('Erreur récupération activité:', error);
    return json({ activities: [] });
  }
};
