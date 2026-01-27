import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { updateProgressAfterAnswer } from '$lib/progress';
import type { RequestHandler } from './$types';

/**
 * Génère un ordre de mélange déterministe basé sur un seed
 * Le même seed produira toujours le même ordre
 */
function seededShuffle(length: number, seed: string): number[] {
  // Simple hash du seed pour obtenir un nombre
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Générateur pseudo-aléatoire déterministe (LCG)
  const random = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
  
  // Fisher-Yates shuffle avec notre générateur
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  return indices;
}

/**
 * Vérifie une réponse côté serveur
 * Utilise le mélange déterministe basé sur sessionId + questionId
 */
async function verifyAnswer(db: any, sessionId: string, questionId: string, selectedAnswer: number, optionsLength: number): Promise<{ isCorrect: boolean; correctAnswer: number; explanation?: string }> {
  const cleanId = questionId.includes(':') ? questionId.split(':')[1] : questionId;
  
  const result = await db.query(
    'SELECT correctAnswer, explanation, options FROM type::thing("question", $id)',
    { id: cleanId }
  );
  
  const question = (result[0] as any[])?.[0];
  if (!question) {
    return { isCorrect: false, correctAnswer: -1 };
  }
  
  const originalCorrectIndex = question.correctAnswer;
  
  // Recalculer le même mélange déterministe
  const seed = `${sessionId}-${questionId}`;
  const shuffleOrder = seededShuffle(question.options?.length || optionsLength, seed);
  
  // Trouver l'index de la bonne réponse après mélange
  // shuffleOrder[i] = index original de l'option à la position i
  const shuffledCorrectIndex = shuffleOrder.findIndex((origIdx: number) => origIdx === originalCorrectIndex);
  
  return {
    isCorrect: selectedAnswer === shuffledCorrectIndex,
    correctAnswer: shuffledCorrectIndex,
    explanation: question.explanation
  };
}

// POST - Enregistrer une réponse
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const { questionIndex, selectedAnswer } = await request.json();

    if (typeof questionIndex !== 'number' || typeof selectedAnswer !== 'number') {
      return json({ message: 'questionIndex et selectedAnswer requis' }, { status: 400 });
    }

    // Récupérer la session
    const sessionResult = await db.query<any[]>(
      'SELECT * FROM type::thing("quiz_session", $sessionId)',
      { sessionId: params.sessionId }
    );

    const session = (sessionResult[0] as any[])?.[0];

    if (!session) {
      return json({ message: 'Session non trouvée' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return json({ message: 'Cette session est déjà terminée' }, { status: 400 });
    }

    // Vérifier que la question n'a pas déjà été répondue
    const alreadyAnswered = session.answers?.some(
      (a: any) => a.questionIndex === questionIndex
    );

    if (alreadyAnswered) {
      return json({ message: 'Cette question a déjà été répondue' }, { status: 400 });
    }

    // Récupérer l'ID de la question depuis la session
    const questionId = session.questionIds?.[questionIndex];
    if (!questionId) {
      return json({ message: 'Question non trouvée dans la session' }, { status: 404 });
    }

    // Vérifier la réponse côté serveur (sécurité !)
    // On utilise un mélange déterministe basé sur sessionId + questionId
    const verification = await verifyAnswer(
      db, 
      params.sessionId!, 
      questionId.toString(), 
      selectedAnswer,
      4 // Nombre d'options standard (sera recalculé depuis la question si nécessaire)
    );
    
    // Mettre à jour la progression utilisateur (points par thème)
    const userId = session.userId?.toString() || session.userId;
    let classeId = session.classeId?.toString() || session.classeId;
    
    // Si pas de classeId dans la session, essayer de le récupérer depuis l'utilisateur
    if (!classeId && userId && !userId.startsWith('anonymous_')) {
      const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
      const userResult = await db.query<any[]>(
        'SELECT classe_id FROM type::thing("user", $userId)',
        { userId: cleanUserId }
      );
      const user = (userResult[0] as any[])?.[0];
      if (user?.classe_id) {
        classeId = user.classe_id.toString();
        // Mettre à jour la session pour les prochaines fois
        await db.query(`UPDATE quiz_session:${params.sessionId} SET classeId = $classeId`, { classeId });
      }
    }
    
    if (userId && classeId) {
      await updateProgressAfterAnswer(userId, classeId, questionId.toString(), verification.isCorrect);
    }
    
    // Créer l'objet réponse
    const answerRecord = {
      questionIndex,
      questionId: questionId.toString(),
      selectedAnswer,
      correctAnswer: verification.correctAnswer,
      isCorrect: verification.isCorrect,
      answeredAt: new Date().toISOString()
    };

    // Calculer le nouveau score
    const newScore = session.score + (verification.isCorrect ? 1 : 0);
    const newAnswers = [...(session.answers || []), answerRecord];
    const newQuestionIndex = questionIndex + 1;

    // Vérifier si le quiz est terminé
    const isCompleted = newAnswers.length >= session.totalQuestions;
    const newStatus = isCompleted ? 'completed' : 'in_progress';

    // Mettre à jour la session
    const updateQuery = isCompleted
      ? `UPDATE type::thing("quiz_session", $sessionId) SET 
           answers = $answers,
           score = $score,
           currentQuestionIndex = $currentQuestionIndex,
           status = $status,
           completedAt = time::now(),
           lastActivityAt = time::now()
         RETURN AFTER`
      : `UPDATE type::thing("quiz_session", $sessionId) SET 
           answers = $answers,
           score = $score,
           currentQuestionIndex = $currentQuestionIndex,
           status = $status,
           lastActivityAt = time::now()
         RETURN AFTER`;

    const answersJson = JSON.stringify(newAnswers);
    const rawQuery = isCompleted
      ? `UPDATE type::thing("quiz_session", "${params.sessionId}") SET 
           answers = ${answersJson},
           score = ${newScore},
           currentQuestionIndex = ${newQuestionIndex},
           status = "${newStatus}",
           completedAt = time::now(),
           lastActivityAt = time::now()
         RETURN AFTER`
      : `UPDATE type::thing("quiz_session", "${params.sessionId}") SET 
           answers = ${answersJson},
           score = ${newScore},
           currentQuestionIndex = ${newQuestionIndex},
           status = "${newStatus}",
           lastActivityAt = time::now()
         RETURN AFTER`;

    const updateResult = await db.query<any[]>(rawQuery);
    const updatedSession = (updateResult[0] as any[])?.[0];

    return json({
      answer: answerRecord,
      isCorrect: verification.isCorrect,
      correctAnswer: verification.correctAnswer,
      explanation: verification.explanation,
      session: {
        ...updatedSession,
        id: updatedSession?.id?.toString()
      },
      isCompleted,
      score: newScore,
      totalQuestions: session.totalQuestions
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// GET - Récupérer les détails de la session
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();

    const sessionResult = await db.query<any[]>(
      'SELECT * FROM type::thing("quiz_session", $sessionId)',
      { sessionId: params.sessionId }
    );

    const session = (sessionResult[0] as any[])?.[0];

    if (!session) {
      return json({ message: 'Session non trouvée' }, { status: 404 });
    }

    // Récupérer les infos du quiz
    const quizId = session.quizId?.toString().split(':')[1] || session.quizId;
    const quizResult = await db.query<any[]>(
      'SELECT * FROM type::thing("quiz", $quizId)',
      { quizId }
    );

    const quiz = (quizResult[0] as any[])?.[0];

    // Préparer la session pour le client SANS le shuffleMapping (sécurité)
    const clientSession = {
      id: session.id?.toString(),
      userId: session.userId,
      quizId: session.quizId?.toString(),
      questionIds: session.questionIds,
      currentQuestionIndex: session.currentQuestionIndex,
      answers: session.answers,
      score: session.score,
      totalQuestions: session.totalQuestions,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt
      // PAS de shuffleMapping !
    };

    return json({
      session: clientSession,
      quiz: quiz ? {
        ...quiz,
        id: quiz.id?.toString()
      } : null
    });

  } catch (error) {
    console.error('Get session error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Abandonner une session
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();

    await db.query(
      `UPDATE type::thing("quiz_session", $sessionId) SET 
         status = 'abandoned',
         lastActivityAt = time::now()`,
      { sessionId: params.sessionId }
    );

    return json({ success: true });

  } catch (error) {
    console.error('Abandon session error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
