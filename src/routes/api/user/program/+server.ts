import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// Helper pour valider la session
async function getAuthenticatedUserId(cookies: any, db: any): Promise<string | null> {
  const sessionToken = cookies.get('session');
  if (!sessionToken) return null;

  const [sessions] = await db.query(`
    SELECT user FROM session 
    WHERE session_token = $sessionToken 
      AND expires_at > time::now()
  `, { sessionToken }) as [any[]];

  if (!sessions || sessions.length === 0) return null;

  const userId = sessions[0].user?.toString();
  if (!userId) return null;

  return userId.includes(':') ? userId.split(':')[1] : userId;
}

// GET - Récupérer le programme de l'utilisateur avec progression
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const db = await getSurrealDB();
    const userId = await getAuthenticatedUserId(cookies, db);

    if (!userId) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        quiz.id AS quiz_id,
        quiz.title AS quiz_title,
        quiz.slug AS quiz_slug,
        quiz.difficulty AS quiz_difficulty,
        quiz.maxQuestions AS quiz_max_questions,
        quiz.description AS quiz_description,
        quiz.subject.name AS subject_name,
        quiz.theme AS quiz_theme,
        added_at,
        completed,
        completed_at
      FROM user_program
      WHERE user = type::thing("user", $userId)
      ORDER BY added_at DESC
    `, { userId });

    // Récupérer les sessions de quiz pour calculer la progression
    const [sessions] = await db.query<[any[]]>(`
      SELECT 
        quizId,
        status,
        currentQuestionIndex,
        totalQuestions,
        score,
        completedAt,
        startedAt
      FROM quiz_session
      WHERE userId = type::thing("user", $userId)
      ORDER BY startedAt DESC
    `, { userId });

    // Créer une map des sessions par quiz ID (dernière session + meilleur score)
    const sessionsByQuiz = new Map<string, { latest: any, bestScore: number | null }>();
    (sessions || []).forEach((session: any) => {
      const quizId = session.quizId?.toString();
      if (!quizId) return;
      
      const existing = sessionsByQuiz.get(quizId);
      const sessionScore = session.score ?? null;
      
      if (!existing) {
        // Première session pour ce quiz
        sessionsByQuiz.set(quizId, { 
          latest: session, 
          bestScore: sessionScore 
        });
      } else {
        // Mettre à jour le meilleur score si nécessaire
        if (sessionScore !== null && (existing.bestScore === null || sessionScore > existing.bestScore)) {
          existing.bestScore = sessionScore;
        }
      }
    });

    const programsWithProgress = (programs || []).map(p => {
      const quizId = p.quiz_id?.toString();
      const sessionData = sessionsByQuiz.get(quizId);
      const session = sessionData?.latest;
      
      let progress = 0;
      let hasStarted = false;
      let isCompleted = false;
      let lastScore = null;
      let bestScore = sessionData?.bestScore ?? null;
      
      if (session) {
        hasStarted = true;
        isCompleted = session.status === 'completed';
        
        if (isCompleted || session.currentQuestionIndex >= session.totalQuestions) {
          progress = 100;
          isCompleted = true; // Marquer comme complété si toutes les questions sont répondues
          lastScore = session.score;
        } else if (session.totalQuestions > 0) {
          progress = Math.round((session.currentQuestionIndex / session.totalQuestions) * 100);
        }
      }
      
      return {
        id: p.id?.toString(),
        quizId,
        title: p.quiz_title,
        slug: p.quiz_slug,
        difficulty: p.quiz_difficulty,
        maxQuestions: p.quiz_max_questions,
        description: p.quiz_description,
        subject: p.subject_name,
        theme: p.quiz_theme,
        addedAt: p.added_at,
        completed: p.completed || isCompleted,
        completedAt: p.completed_at,
        // Nouvelles données de progression
        progress,
        hasStarted,
        isCompleted,
        lastScore,
        bestScore
      };
    });

    // Calculer la progression globale
    const totalProgress = programsWithProgress.length > 0
      ? Math.round(programsWithProgress.reduce((sum, p) => sum + p.progress, 0) / programsWithProgress.length)
      : 0;

    return json({ 
      programs: programsWithProgress,
      globalProgress: totalProgress
    });

  } catch (error) {
    console.error('Erreur récupération programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Ajouter un quiz au programme
export const POST: RequestHandler = async ({ cookies, request }) => {
  try {
    const db = await getSurrealDB();
    const userId = await getAuthenticatedUserId(cookies, db);

    if (!userId) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { quizId } = await request.json();
    
    if (!quizId) {
      return json({ error: 'Quiz ID requis' }, { status: 400 });
    }

    // Nettoyer l'ID du quiz
    const cleanQuizId = quizId.includes(':') ? quizId.split(':')[1] : quizId;

    // Vérifier que le quiz existe
    const [quizCheck] = await db.query<[any[]]>(`
      SELECT id FROM quiz WHERE id = type::thing("quiz", $quizId)
    `, { quizId: cleanQuizId });

    if (!quizCheck || quizCheck.length === 0) {
      return json({ error: 'Quiz non trouvé' }, { status: 404 });
    }

    // Ajouter au programme (l'index unique empêchera les doublons)
    try {
      await db.query(`
        CREATE user_program SET
          user = type::thing("user", $userId),
          quiz = type::thing("quiz", $quizId),
          added_at = time::now(),
          completed = false
      `, { userId, quizId: cleanQuizId });

      return json({ success: true, message: 'Quiz ajouté à Ma sélection' });
    } catch (e: any) {
      // Si doublon (index unique violation)
      if (e.message?.includes('already exists') || e.message?.includes('unique')) {
        return json({ error: 'Ce quiz est déjà dans ton programme' }, { status: 409 });
      }
      throw e;
    }

  } catch (error) {
    console.error('Erreur ajout programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Retirer un quiz du programme
export const DELETE: RequestHandler = async ({ cookies, request }) => {
  try {
    const db = await getSurrealDB();
    const userId = await getAuthenticatedUserId(cookies, db);

    if (!userId) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { quizId } = await request.json();
    
    if (!quizId) {
      return json({ error: 'Quiz ID requis' }, { status: 400 });
    }

    // Nettoyer l'ID du quiz
    const cleanQuizId = quizId.includes(':') ? quizId.split(':')[1] : quizId;

    // Supprimer du programme
    const [result] = await db.query<[any[]]>(`
      DELETE user_program 
      WHERE user = type::thing("user", $userId) 
        AND quiz = type::thing("quiz", $quizId)
      RETURN BEFORE
    `, { userId, quizId: cleanQuizId });

    if (!result || result.length === 0) {
      return json({ error: 'Quiz non trouvé dans ton programme' }, { status: 404 });
    }

    return json({ success: true, message: 'Quiz retiré de Ma sélection' });

  } catch (error) {
    console.error('Erreur suppression programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
