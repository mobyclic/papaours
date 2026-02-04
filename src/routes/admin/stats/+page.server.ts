import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { RecordId } from 'surrealdb';

function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Statistiques globales
    const [userCount] = await db.query('SELECT count() FROM user GROUP ALL');
    const [questionCount] = await db.query('SELECT count() FROM question GROUP ALL');
    const [quizCount] = await db.query('SELECT count() FROM quiz GROUP ALL');
    const [quizSessionCount] = await db.query('SELECT count() FROM quiz_session GROUP ALL');
    const [badgeCount] = await db.query('SELECT count() FROM badge GROUP ALL');
    const [orgCount] = await db.query('SELECT count() FROM organization GROUP ALL');
    
    // Stats par type d'utilisateur (basé sur le champ role s'il existe)
    const [usersByRole] = await db.query(`
      SELECT role, count() as total FROM user GROUP BY role
    `);
    
    // Quiz sessions récentes
    const [recentSessions] = await db.query(`
      SELECT *, user.email as user_email, quiz.title as quiz_title
      FROM quiz_session 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    return {
      stats: {
        users: (userCount as any)?.[0]?.count || 0,
        questions: (questionCount as any)?.[0]?.count || 0,
        quizzes: (quizCount as any)?.[0]?.count || 0,
        sessions: (quizSessionCount as any)?.[0]?.count || 0,
        badges: (badgeCount as any)?.[0]?.count || 0,
        organizations: (orgCount as any)?.[0]?.count || 0,
      },
      usersByRole: serialize(usersByRole || []),
      recentSessions: serialize(recentSessions || [])
    };
  } catch (error) {
    console.error('Error loading stats:', error);
    return {
      stats: { users: 0, questions: 0, quizzes: 0, sessions: 0, badges: 0, organizations: 0 },
      usersByRole: [],
      recentSessions: []
    };
  }
};
