import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
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

// Mélange les options d'une question et met à jour correctAnswer
function shuffleQuestionOptions(question: any): any {
  if (!question.options || !Array.isArray(question.options)) {
    return question;
  }
  
  const optionsWithIndex: { text: string; originalIndex: number }[] = question.options.map((opt: string, idx: number) => ({
    text: opt,
    originalIndex: idx
  }));
  
  const shuffledOptions = shuffleArray(optionsWithIndex);
  
  const newCorrectAnswer = shuffledOptions.findIndex(
    (opt) => opt.originalIndex === question.correctAnswer
  );
  
  return {
    ...question,
    id: question.id?.toString() || question.id,
    options: shuffledOptions.map((opt) => opt.text),
    correctAnswer: newCorrectAnswer
  };
}

// POST - Démarrer une nouvelle session de quiz
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || `anonymous_${crypto.randomUUID()}`;
    
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
    const existingSessionResult = await db.query<any[]>(
      `SELECT * FROM quiz_session 
       WHERE userId = $userId 
       AND quizId = type::thing("quiz", $quizId) 
       AND status = 'in_progress'
       ORDER BY startedAt DESC
       LIMIT 1`,
      { userId, quizId: quiz.id.toString().split(':')[1] }
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

    // Récupérer toutes les questions actives du quiz
    const quizIdClean = quiz.id.toString().split(':')[1] || quiz.id.toString();
    const questionsResult = await db.query(
      'SELECT * FROM question WHERE quizId = type::thing("quiz", $quizId) AND isActive = true ORDER BY order ASC',
      { quizId: quizIdClean }
    );

    let allQuestions = (questionsResult[0] as any[]) || [];

    if (allQuestions.length === 0) {
      return json({ message: 'Aucune question disponible pour ce quiz' }, { status: 400 });
    }

    // Mélanger les questions si l'option est activée
    if (quiz.shuffleQuestions) {
      allQuestions = shuffleArray(allQuestions);
    }

    // Limiter le nombre de questions si maxQuestions est défini
    let selectedQuestions = allQuestions;
    if (quiz.maxQuestions && quiz.maxQuestions > 0 && quiz.maxQuestions < allQuestions.length) {
      selectedQuestions = allQuestions.slice(0, quiz.maxQuestions);
    }

    // Mélanger les options de chaque question et sérialiser les IDs
    const preparedQuestions = selectedQuestions.map(q => shuffleQuestionOptions(q));
    const questionIds = preparedQuestions.map(q => q.id);

    // Créer la session avec SQL brut car db.create() ne gère pas bien les arrays complexes
    const questionsJson = JSON.stringify(preparedQuestions);
    const questionIdsJson = JSON.stringify(questionIds);
    
    const createQuery = `
      CREATE quiz_session SET
        userId = "${userId}",
        quizId = quiz:${quizIdClean},
        questionIds = ${questionIdsJson},
        questions = ${questionsJson},
        currentQuestionIndex = 0,
        answers = [],
        score = 0,
        totalQuestions = ${preparedQuestions.length},
        status = 'in_progress'
    `;
    
    const sessionResult = await db.query<any[]>(createQuery);
    const session = (sessionResult[0] as any[])?.[0];

    if (!session) {
      console.error('Session creation failed');
      return json({ message: 'Erreur lors de la création de la session' }, { status: 500 });
    }

    return json({ 
      session: {
        ...session,
        id: session.id?.toString()
      },
      quiz: {
        ...quiz,
        id: quiz.id?.toString()
      },
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

    // Compter les questions disponibles
    const countResult = await db.query<any[]>(
      'SELECT count() FROM question WHERE quizId = $quizId AND isActive = true',
      { quizId: quiz.id }
    );
    
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
