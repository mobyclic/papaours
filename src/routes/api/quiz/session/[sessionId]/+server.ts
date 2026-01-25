import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

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

    // Récupérer la question de la session
    const question = session.questions[questionIndex];
    if (!question) {
      return json({ message: 'Question non trouvée dans la session' }, { status: 404 });
    }

    // Vérifier si la réponse est correcte
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    // Créer l'objet réponse
    const answerRecord = {
      questionIndex,
      questionId: question.id,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      answeredAt: new Date().toISOString()
    };

    // Calculer le nouveau score
    const newScore = session.score + (isCorrect ? 1 : 0);
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
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
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

    return json({
      session: {
        ...session,
        id: session.id?.toString()
      },
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
