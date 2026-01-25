import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer les sessions en cours d'un utilisateur
export const GET: RequestHandler = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return json({ message: 'userId requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Récupérer les sessions en cours (status = 'in_progress')
    const sessionsResult = await db.query<any[]>(
      `SELECT * FROM quiz_session 
       WHERE userId = $userId 
       AND status = 'in_progress' 
       ORDER BY lastActivityAt DESC`,
      { userId }
    );

    const sessions = (sessionsResult[0] as any[]) || [];

    // Sérialiser les IDs
    const serializedSessions = sessions.map(s => ({
      ...s,
      id: s.id?.toString(),
      quizId: s.quizId?.toString(),
      progress: s.answers?.length || 0,
      totalQuestions: s.totalQuestions || s.questions?.length || 0
    }));

    return json({ sessions: serializedSessions });

  } catch (error) {
    console.error('Get user sessions error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
