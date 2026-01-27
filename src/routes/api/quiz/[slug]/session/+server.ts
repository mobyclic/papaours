import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { 
  getOrCreateUserProgress, 
  getUserProgressByThemes, 
  selectQuestionsForLevel, 
  getAverageNiveau 
} from '$lib/progress';
import type { RequestHandler } from './$types';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}



// POST - Démarrer une nouvelle session de quiz
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || `anonymous_${crypto.randomUUID()}`;
    const classeId = body.classeId; // Classe de l'utilisateur (obligatoire pour le système adaptatif)
    
    // Récupérer le quiz par slug
    const quizResult = await db.query<any[]>(
      'SELECT * FROM quiz WHERE slug = $slug AND isActive = true',
      { slug: params.slug }
    );

    const quiz = (quizResult[0] as any[])?.[0];

    if (!quiz) {
      return json({ message: 'Quiz non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur a déjà une session en cours pour ce quiz
    const isAnonymousUser = userId.startsWith('anonymous_');
    const userIdClean = userId.includes(':') ? userId.split(':')[1] : userId;
    const quizIdClean = quiz.id.toString().includes(':') ? quiz.id.toString().split(':')[1] : quiz.id.toString();
    
    const existingSessionQuery = isAnonymousUser 
      ? `SELECT * FROM quiz_session 
         WHERE userId = $userId 
         AND quizId = type::thing("quiz", $quizId) 
         AND status = 'in_progress'
         ORDER BY startedAt DESC
         LIMIT 1`
      : `SELECT * FROM quiz_session 
         WHERE userId = type::thing("user", $userIdClean) 
         AND quizId = type::thing("quiz", $quizId) 
         AND status = 'in_progress'
         ORDER BY startedAt DESC
         LIMIT 1`;
    
    const existingSessionResult = await db.query<any[]>(
      existingSessionQuery,
      { userId, userIdClean, quizId: quiz.id.toString().split(':')[1] }
    );

    const existingSession = (existingSessionResult[0] as any[])?.[0];

    // Si une session existe, la retourner
    if (existingSession) {
      return json({ 
        session: {
          ...existingSession,
          id: existingSession.id?.toString()
        },
        quiz: {
          ...quiz,
          id: quiz.id?.toString()
        },
        resumed: true
      });
    }

    // Récupérer toutes les questions actives correspondant aux thèmes du quiz
    // Les questions sont liées via theme_ids (prioritaire) ou matiere_id (fallback)
    let questionsResult;
    
    if (quiz.theme_ids && Array.isArray(quiz.theme_ids) && quiz.theme_ids.length > 0) {
      // Sélectionner par thèmes du quiz
      // On cherche les questions dont au moins un theme_id est dans les theme_ids du quiz
      const themeConditions = quiz.theme_ids.map((tid: any) => {
        const cleanId = tid.toString().split(':')[1] || tid.toString();
        return `type::thing("theme", "${cleanId}") INSIDE theme_ids`;
      }).join(' OR ');
      
      questionsResult = await db.query(
        `SELECT * FROM question WHERE (${themeConditions}) AND isActive = true ORDER BY rand()`
      );
    } else if (quiz.matiere_id) {
      // Fallback: sélectionner par matière
      const cleanMatiereId = quiz.matiere_id.toString().split(':')[1] || quiz.matiere_id.toString();
      questionsResult = await db.query(
        'SELECT * FROM question WHERE matiere_id = type::thing("matiere", $matiereId) AND isActive = true ORDER BY rand()',
        { matiereId: cleanMatiereId }
      );
    } else {
      // Pas de critère, prendre toutes les questions actives
      questionsResult = await db.query(
        'SELECT * FROM question WHERE isActive = true ORDER BY rand()'
      );
    }

    let allQuestions = (questionsResult[0] as any[]) || [];

    if (allQuestions.length === 0) {
      return json({ message: 'Aucune question disponible pour ce quiz' }, { status: 400 });
    }

    // Déterminer le nombre de questions à sélectionner
    const maxQuestions = (quiz.maxQuestions && quiz.maxQuestions > 0) 
      ? Math.min(quiz.maxQuestions, allQuestions.length)
      : allQuestions.length;

    let selectedQuestions: any[];
    let userNiveau = 'débutant';

    // Si l'utilisateur a une classe et n'est pas anonyme, utiliser le système adaptatif
    if (classeId && !userId.startsWith('anonymous_')) {
      // Extraire les thèmes uniques des questions
      const themeIdsSet = new Set<string>();
      const matiereIdsSet = new Set<string>();
      
      for (const q of allQuestions) {
        if (q.theme_ids) {
          for (const tid of q.theme_ids) {
            themeIdsSet.add(tid?.toString() || tid);
          }
        }
        if (q.matiere_id) {
          matiereIdsSet.add(q.matiere_id?.toString() || q.matiere_id);
        }
      }
      
      const themeIds = Array.from(themeIdsSet);
      const matiereIds = Array.from(matiereIdsSet);
      
      // Créer/récupérer les progressions pour chaque thème (initialise à débutant si nouveau)
      for (const themeId of themeIds) {
        // Prendre la première matière associée à ce thème
        const matiereId = matiereIds[0] || 'unknown';
        await getOrCreateUserProgress(userId, matiereId, themeId, classeId);
      }
      
      // Récupérer les progressions existantes
      const progressMap = await getUserProgressByThemes(userId, classeId, themeIds);
      
      // Calculer le niveau moyen
      userNiveau = getAverageNiveau(progressMap, themeIds);
      
      // Sélectionner les questions adaptées au niveau
      selectedQuestions = selectQuestionsForLevel(allQuestions, userNiveau, classeId, maxQuestions);
      
      console.log(`📊 Quiz adaptatif: user=${userId}, classe=${classeId}, niveau=${userNiveau}, questions=${selectedQuestions.length}`);
    } else {
      // Mode non-adaptatif (utilisateur anonyme ou pas de classe)
      // Toujours mélanger les questions
      allQuestions = shuffleArray(allQuestions);
      selectedQuestions = allQuestions.slice(0, maxQuestions);
    }

    // Extraire les IDs des questions sélectionnées
    const questionIds: string[] = selectedQuestions.map(q => q.id?.toString() || q.id);

    // Créer la session - le mélange des options se fera de manière déterministe
    // en utilisant un seed basé sur sessionId + questionId (pas besoin de stocker)
    const questionIdsJson = JSON.stringify(questionIds);
    
    const createQuery = `
      CREATE quiz_session SET
        userId = ${isAnonymousUser ? `"${userId}"` : `type::thing("user", "${userIdClean}")`},
        quizId = quiz:${quizIdClean},
        classeId = ${classeId ? `"${classeId}"` : 'NONE'},
        questionIds = ${questionIdsJson},
        currentQuestionIndex = 0,
        answers = [],
        score = 0,
        totalQuestions = ${selectedQuestions.length},
        status = 'in_progress',
        startedAt = time::now()
    `;
    
    const sessionResult = await db.query<any[]>(createQuery);
    const session = (sessionResult[0] as any[])?.[0];

    if (!session) {
      console.error('Session creation failed');
      return json({ message: 'Erreur lors de la création de la session' }, { status: 500 });
    }

    // Préparer la session pour le client
    const clientSession = {
      id: session.id?.toString(),
      userId: session.userId,
      quizId: session.quizId?.toString(),
      questionIds: session.questionIds,
      currentQuestionIndex: session.currentQuestionIndex,
      answers: session.answers,
      score: session.score,
      totalQuestions: session.totalQuestions,
      status: session.status
    };

    return json({ 
      session: clientSession,
      quiz: {
        ...quiz,
        id: quiz.id?.toString()
      },
      userNiveau, // Retourner le niveau utilisé pour cette session
      resumed: false
    });

  } catch (error) {
    console.error('Start quiz session error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// GET - Récupérer une session existante ou les infos du quiz
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const db = await connectDB();
    const sessionId = url.searchParams.get('session');

    // Si on demande une session spécifique
    if (sessionId) {
      const sessionResult = await db.query<any[]>(
        'SELECT * FROM type::thing("quiz_session", $sessionId)',
        { sessionId }
      );

      const session = (sessionResult[0] as any[])?.[0];

      if (!session) {
        return json({ message: 'Session non trouvée' }, { status: 404 });
      }

      return json({ 
        session: {
          ...session,
          id: session.id?.toString()
        }
      });
    }

    // Sinon, retourner les infos du quiz (pour affichage avant démarrage)
    const quizResult = await db.query<any[]>(
      'SELECT * FROM quiz WHERE slug = $slug AND isActive = true',
      { slug: params.slug }
    );

    const quiz = (quizResult[0] as any[])?.[0];

    if (!quiz) {
      return json({ message: 'Quiz non trouvé' }, { status: 404 });
    }

    // Compter les questions disponibles via matiere_id
    let countResult;
    if (quiz.matiere_id) {
      const cleanMatiereId = quiz.matiere_id.toString().split(':')[1] || quiz.matiere_id.toString();
      countResult = await db.query<any[]>(
        'SELECT count() FROM question WHERE matiere_id = type::thing("matiere", $matiereId) AND isActive = true GROUP ALL',
        { matiereId: cleanMatiereId }
      );
    } else {
      countResult = [[{ count: 0 }]];
    }
    
    const totalAvailableQuestions = (countResult[0] as any[])?.[0]?.count || 0;

    return json({ 
      quiz: {
        ...quiz,
        id: quiz.id?.toString(),
        totalAvailableQuestions
      }
    });

  } catch (error) {
    console.error('Get quiz/session error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
