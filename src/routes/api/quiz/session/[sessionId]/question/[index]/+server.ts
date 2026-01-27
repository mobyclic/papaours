import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { ensureUserProgressForQuestion } from '$lib/progress';
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
 * GET /api/quiz/session/[sessionId]/question/[index]
 * Récupère une question pour le client SANS la bonne réponse
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { sessionId, index } = params;
    const questionIndex = parseInt(index, 10);

    if (isNaN(questionIndex) || questionIndex < 0) {
      return json({ message: 'Index de question invalide' }, { status: 400 });
    }

    // Récupérer la session
    const sessionResult = await db.query<any[]>(
      'SELECT * FROM type::thing("quiz_session", $sessionId)',
      { sessionId }
    );

    const session = (sessionResult[0] as any[])?.[0];

    if (!session) {
      return json({ message: 'Session non trouvée' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return json({ message: 'Cette session est terminée' }, { status: 400 });
    }

    // Vérifier que l'index est valide
    if (questionIndex >= (session.questionIds?.length || 0)) {
      return json({ message: 'Index de question hors limites' }, { status: 400 });
    }

    // Récupérer l'ID de la question
    const questionId = session.questionIds[questionIndex];
    if (!questionId) {
      return json({ message: 'Question non trouvée' }, { status: 404 });
    }

    const questionIdStr = questionId?.toString() || questionId;
    const cleanQuestionId = questionIdStr.includes(':') ? questionIdStr.split(':')[1] : questionIdStr;

    // S'assurer que les entrées user_progress existent pour cette question
    // (pour chaque thème de la question)
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
        const cleanSessionId = params.sessionId;
        await db.query(`UPDATE quiz_session:${cleanSessionId} SET classeId = $classeId`, { classeId });
      }
    }
    
    if (userId && classeId) {
      await ensureUserProgressForQuestion(userId, classeId, questionIdStr);
    }

    // Récupérer la question depuis la DB avec les métadonnées
    const questionResult = await db.query<any[]>(
      `SELECT id, question, type, imageUrl, imageCaption, options, difficulty, 
              matiere_id, theme_ids, class_difficulties,
              matiere_id.name as matiere_name,
              theme_ids.*.name as theme_names
       FROM type::thing("question", $id)`,
      { id: cleanQuestionId }
    );

    const question = (questionResult[0] as any[])?.[0];

    if (!question) {
      return json({ message: 'Question non trouvée dans la base' }, { status: 404 });
    }
    
    // Calculer la difficulté effective (par classe si disponible)
    let effectiveDifficulty = question.difficulty || 'easy';
    if (question.class_difficulties && classeId) {
      const cleanClasseId = classeId.includes(':') ? classeId.split(':')[1] : classeId;
      const classDiff = question.class_difficulties[cleanClasseId] || question.class_difficulties[`classe:${cleanClasseId}`];
      if (classDiff) {
        effectiveDifficulty = classDiff === 1 ? 'easy' : classDiff === 2 ? 'medium' : 'hard';
      }
    }

    // Générer l'ordre de mélange de manière déterministe
    // Le seed est basé sur sessionId + questionId pour être unique et reproductible
    const seed = `${params.sessionId}-${questionIdStr}`;
    const shuffleOrder = seededShuffle(question.options?.length || 0, seed);
    
    // Appliquer le mélange aux options
    const originalOptions = question.options || [];
    const shuffledOptions = shuffleOrder.map((origIdx: number) => originalOptions[origIdx]);
    
    // Construire la question pour le client
    const clientQuestion = {
      id: question.id?.toString() || questionIdStr,
      question: question.question,
      type: question.type || 'qcm',
      options: shuffledOptions,
      imageUrl: question.imageUrl,
      imageCaption: question.imageCaption,
      // PAS de correctAnswer !
    };

    // Vérifier si cette question a déjà été répondue
    const existingAnswer = session.answers?.find((a: any) => a.questionIndex === questionIndex);
    
    // Préparer les noms des thèmes
    const themeNames: string[] = question.theme_names || [];

    return json({
      question: clientQuestion,
      questionIndex,
      totalQuestions: session.totalQuestions,
      alreadyAnswered: !!existingAnswer,
      previousAnswer: existingAnswer || null,
      // Métadonnées pour l'affichage
      metadata: {
        difficulty: effectiveDifficulty,
        matiere: question.matiere_name || null,
        themes: themeNames,
        classeId: classeId || null
      }
    });

  } catch (error) {
    console.error('Get question error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
