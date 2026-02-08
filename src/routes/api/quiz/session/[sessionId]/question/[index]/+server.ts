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
    let gradeId = session.gradeId?.toString() || session.gradeId;
    
    // Si pas de gradeId dans la session, essayer de le récupérer depuis l'utilisateur
    if (!gradeId && userId && !userId.startsWith('anonymous_')) {
      const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
      const userResult = await db.query<any[]>(
        'SELECT current_grade FROM type::thing("user", $userId)',
        { userId: cleanUserId }
      );
      const user = (userResult[0] as any[])?.[0];
      if (user?.current_grade) {
        gradeId = user.current_grade.toString();
        // Mettre à jour la session pour les prochaines fois
        const cleanSessionId = params.sessionId;
        await db.query(`UPDATE quiz_session:${cleanSessionId} SET gradeId = $gradeId`, { gradeId });
      }
    }
    
    if (userId && gradeId) {
      await ensureUserProgressForQuestion(userId, gradeId, questionIdStr);
    }

    // Récupérer la question depuis la DB avec les métadonnées
    const questionResult = await db.query<any[]>(
      `SELECT id, question, questionType, type, imageUrl, imageCaption, options, optionImages, difficulty,
              textWithBlanks, correctAnswers, caseSensitive,
              leftItems, rightItems, correctMatches,
              items, correctOrder,
              placeholder, sampleAnswers, expectedKeywords, minWords, maxWords, minLength, maxLength,
              answers, requireJustification,
              svgContent, svg_content, expectedAnswers, expected_answers, choices,
              matiere_id, theme_ids, grade_difficulties,
              matiere_id.name as matiere_name,
              theme_ids.*.name as theme_names
       FROM type::thing("question", $id)`,
      { id: cleanQuestionId }
    );

    const question = (questionResult[0] as any[])?.[0];

    if (!question) {
      return json({ message: 'Question non trouvée dans la base' }, { status: 404 });
    }
    
    // Calculer la difficulté effective (par grade si disponible)
    let effectiveDifficulty = question.difficulty || 'easy';
    if (question.grade_difficulties && gradeId) {
      const cleanGradeId = gradeId.includes(':') ? gradeId.split(':')[1] : gradeId;
      // grade_difficulties est maintenant un tableau d'objets [{grade_id, difficulty, points}]
      const gradeDiff = (question.grade_difficulties || []).find((gd: any) => {
        const gdId = gd.grade_id?.toString() || gd.grade_id;
        return gdId === cleanGradeId || gdId === `grade:${cleanGradeId}`;
      });
      if (gradeDiff) {
        effectiveDifficulty = gradeDiff.difficulty === 1 ? 'easy' : gradeDiff.difficulty === 2 ? 'medium' : 'hard';
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
    const questionType = question.questionType || question.type || 'qcm';
    
    const clientQuestion: any = {
      id: question.id?.toString() || questionIdStr,
      question: question.question,
      questionType: questionType,
      type: questionType,
      options: shuffledOptions,
      optionImages: question.optionImages,
      imageUrl: question.imageUrl,
      imageCaption: question.imageCaption,
      // PAS de correctAnswer pour QCM !
    };
    
    // Ajouter les champs spécifiques selon le type de question
    if (questionType === 'fill_blank') {
      clientQuestion.textWithBlanks = question.textWithBlanks || question.question;
      // Ne pas envoyer correctAnswers au client pour ne pas tricher
      // mais on en a besoin pour l'affichage du format {réponse}
      // Le composant FillBlank extrait les réponses du textWithBlanks si format {réponse}
    }
    
    if (questionType === 'true_false') {
      clientQuestion.requireJustification = question.requireJustification || false;
      // Ne pas envoyer correctAnswer
    }
    
    if (questionType === 'qcm_multiple') {
      // Pour QCM multiple, mélanger les options de manière déterministe
      // Support both formats:
      // 1. options[] + correctAnswers[] (new format)
      // 2. answers[{text, is_correct}] (legacy format)
      
      const answerSeed = `${params.sessionId}-${questionIdStr}`;
      
      if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        // New format: options + correctAnswers
        const originalOptions = question.options;
        const answerShuffleOrder = seededShuffle(originalOptions.length, answerSeed);
        const shuffledOptions = answerShuffleOrder.map((origIdx: number) => originalOptions[origIdx]);
        clientQuestion.options = shuffledOptions;
        // correctAnswers will be recalculated server-side during validation
      } else if (question.answers && Array.isArray(question.answers)) {
        // Legacy format: answers with is_correct
        const originalAnswers = question.answers;
        const answerShuffleOrder = seededShuffle(originalAnswers.length, answerSeed);
        const shuffledAnswers = answerShuffleOrder.map((origIdx: number) => originalAnswers[origIdx]);
        clientQuestion.answers = shuffledAnswers.map((a: any) => ({ text: a.text }));
        clientQuestion.options = shuffledAnswers.map((a: any) => a.text);
      }
    }
    
    if (questionType === 'matching') {
      // Mélanger les items de droite pour rendre la question plus intéressante
      const originalRightItems = question.rightItems || [];
      const rightSeed = `${params.sessionId}-${questionIdStr}-right`;
      const rightShuffleOrder = seededShuffle(originalRightItems.length, rightSeed);
      const shuffledRightItems = rightShuffleOrder.map((origIdx: number) => originalRightItems[origIdx]);
      
      clientQuestion.leftItems = question.leftItems || [];
      clientQuestion.rightItems = shuffledRightItems;
      // Ne pas envoyer correctMatches
    }
    
    if (questionType === 'ordering') {
      // Mélanger les items pour la présentation
      const items = question.items || [];
      const itemSeed = `${params.sessionId}-${questionIdStr}-items`;
      const itemShuffleOrder = seededShuffle(items.length, itemSeed);
      clientQuestion.items = itemShuffleOrder.map((idx: number) => items[idx]);
      clientQuestion.shuffledOrder = clientQuestion.items.map((i: any) => i.id);
      // Ne pas envoyer correctOrder
    }
    
    if (questionType === 'open_short' || questionType === 'open_long') {
      clientQuestion.placeholder = question.placeholder || '';
      clientQuestion.minLength = question.minLength || 0;
      clientQuestion.maxLength = question.maxLength || 0;
      clientQuestion.minWords = question.minWords || 0;
      clientQuestion.maxWords = question.maxWords || 0;
      // Ne pas envoyer sampleAnswers ni expectedKeywords
    }
    
    if (questionType === 'map_labels') {
      // Carte interactive - envoyer le SVG, les zones attendues et les choix
      clientQuestion.svgContent = question.svgContent || question.svg_content || '';
      clientQuestion.expectedAnswers = question.expectedAnswers || question.expected_answers || [];
      clientQuestion.choices = question.choices || [];
      // Ne pas envoyer les réponses correctes (mapping index -> label)
    }

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
        gradeId: gradeId || null
      }
    });

  } catch (error) {
    console.error('Get question error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
