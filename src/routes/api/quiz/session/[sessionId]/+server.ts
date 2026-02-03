import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { updateProgressAfterAnswer } from '$lib/progress';
import { checkAndAwardBadges, updateDailyStreak } from '$lib/server/badges';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';

/**
 * Met à jour les compétences utilisateur après une réponse
 */
async function updateUserCompetences(db: any, userId: string, questionId: string, isCorrect: boolean) {
  try {
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
    const cleanQuestionId = questionId.includes(':') ? questionId.split(':')[1] : questionId;
    
    // Récupérer les competence_ids de la question
    const questionResult = await db.query(
      'SELECT competence_ids FROM type::thing("question", $questionId)',
      { questionId: cleanQuestionId }
    );
    
    const question = (questionResult[0] as any[])?.[0];
    const competenceIds = question?.competence_ids || [];
    
    if (competenceIds.length === 0) {
      return; // Pas de compétences associées à cette question
    }
    
    // Pour chaque compétence, mettre à jour ou créer l'entrée user_competence
    for (const competenceId of competenceIds) {
      const cleanCompetenceId = competenceId?.toString()?.includes(':') 
        ? competenceId.toString().split(':')[1] 
        : competenceId?.toString();
      
      if (!cleanCompetenceId) continue;
      
      // Vérifier si l'entrée existe déjà
      const existingResult = await db.query(`
        SELECT * FROM user_competence 
        WHERE user_id = type::thing("user", $userId) 
        AND competence_id = type::thing("competence", $competenceId)
      `, { userId: cleanUserId, competenceId: cleanCompetenceId });
      
      const existing = (existingResult[0] as any[])?.[0];
      
      if (existing) {
        // Mettre à jour l'existant
        const newCorrect = (existing.correct_answers || 0) + (isCorrect ? 1 : 0);
        const newTotal = (existing.total_answers || 0) + 1;
        const masteryLevel = Math.round((newCorrect / newTotal) * 100);
        
        await db.query(`
          UPDATE type::thing("user_competence", $id) SET
            correct_answers = $correct,
            total_answers = $total,
            mastery_level = $mastery,
            last_practiced = time::now()
        `, { 
          id: existing.id?.toString()?.includes(':') ? existing.id.toString().split(':')[1] : existing.id, 
          correct: newCorrect, 
          total: newTotal, 
          mastery: masteryLevel 
        });
      } else {
        // Créer une nouvelle entrée
        const newCorrect = isCorrect ? 1 : 0;
        const masteryLevel = isCorrect ? 100 : 0;
        
        await db.query(`
          CREATE user_competence SET
            user_id = type::thing("user", $userId),
            competence_id = type::thing("competence", $competenceId),
            correct_answers = $correct,
            total_answers = 1,
            mastery_level = $mastery,
            last_practiced = time::now()
        `, { 
          userId: cleanUserId, 
          competenceId: cleanCompetenceId, 
          correct: newCorrect, 
          mastery: masteryLevel 
        });
      }
    }
  } catch (error) {
    console.error('Error updating user competences:', error);
    // Ne pas faire échouer la requête principale si la mise à jour des compétences échoue
  }
}

/**
 * Évalue une réponse ouverte avec l'IA (pour utilisateurs premium/tutorés)
 */
async function evaluateOpenAnswerWithAI(
  question: string,
  answer: string,
  expectedKeywords: string[],
  sampleAnswers: string[],
  questionContext?: string
): Promise<{
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  correctedAnswer?: string;
}> {
  const systemPrompt = `Tu es un correcteur pédagogique bienveillant pour enfants (6-12 ans). 
Tu dois évaluer une réponse à une question ouverte.
Sois encourageant mais honnête. Utilise un langage simple adapté aux enfants.
Réponds UNIQUEMENT en JSON valide, sans markdown ni code blocks.`;

  const userPrompt = `Question : ${question}
${questionContext ? `Contexte : ${questionContext}` : ''}
${expectedKeywords.length > 0 ? `Points clés attendus : ${expectedKeywords.join(', ')}` : ''}
${sampleAnswers.length > 0 ? `Exemples de bonnes réponses : ${sampleAnswers.slice(0, 2).join(' | ')}` : ''}

Réponse de l'élève : ${answer}

Évalue cette réponse et réponds en JSON :
{
  "score": <nombre de 0 à 100>,
  "feedback": "<feedback encourageant et constructif en 1-2 phrases>",
  "strengths": ["<point positif 1>", "<point positif 2>"],
  "improvements": ["<suggestion d'amélioration 1>"],
  "correctedAnswer": "<version améliorée courte si score < 70, sinon null>"
}`;

  try {
    const response = await fetch(GITHUB_MODELS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub Models API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from API');
    }

    // Nettoyer et parser le JSON
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const evaluation = JSON.parse(cleanedContent);

    return {
      score: Math.min(100, Math.max(0, evaluation.score || 50)),
      feedback: evaluation.feedback || 'Réponse évaluée.',
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      correctedAnswer: evaluation.correctedAnswer || undefined
    };
  } catch (error) {
    console.error('AI evaluation error:', error);
    // Fallback : retourne un résultat neutre
    return {
      score: 50,
      feedback: 'Évaluation automatique. Vérifie avec ton tuteur.',
      strengths: [],
      improvements: []
    };
  }
}

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

/**
 * Vérifie une réponse multi-type côté serveur
 */
async function verifyAnswerMultiType(
  db: any, 
  sessionId: string, 
  questionId: string, 
  questionType: string,
  answer: any,
  isPremium: boolean = false
): Promise<{ 
  isCorrect: boolean; 
  correctAnswer: any; 
  explanation?: string; 
  partialScore?: number;
  aiEvaluation?: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    correctedAnswer?: string;
  };
}> {
  const cleanId = questionId.includes(':') ? questionId.split(':')[1] : questionId;
  
  const result = await db.query(
    'SELECT * FROM type::thing("question", $id)',
    { id: cleanId }
  );
  
  const question = (result[0] as any[])?.[0];
  if (!question) {
    return { isCorrect: false, correctAnswer: null };
  }
  
  const explanation = question.explanation;
  
  switch (questionType) {
    case 'qcm':
    case 'qcm_image': {
      // Mélange déterministe pour les QCM
      const originalCorrectIndex = question.correctAnswer;
      const seed = `${sessionId}-${questionId}`;
      const shuffleOrder = seededShuffle(question.options?.length || 4, seed);
      const shuffledCorrectIndex = shuffleOrder.findIndex((origIdx: number) => origIdx === originalCorrectIndex);
      
      return {
        isCorrect: answer === shuffledCorrectIndex,
        correctAnswer: shuffledCorrectIndex,
        explanation
      };
    }
    
    case 'qcm_multiple': {
      // Plusieurs bonnes réponses possibles
      // Les options ont été mélangées côté client, il faut recalculer les indices corrects
      const originalAnswers = question.answers || [];
      const seed = `${sessionId}-${questionId}`;
      const shuffleOrder = seededShuffle(originalAnswers.length, seed);
      
      // shuffleOrder[i] = index original de l'option affichée à la position i
      // On doit trouver les positions mélangées des bonnes réponses
      const correctShuffledIndices: number[] = [];
      for (let shuffledIdx = 0; shuffledIdx < shuffleOrder.length; shuffledIdx++) {
        const originalIdx = shuffleOrder[shuffledIdx];
        if (originalAnswers[originalIdx]?.is_correct) {
          correctShuffledIndices.push(shuffledIdx);
        }
      }
      
      const selectedSet = new Set(answer || []);
      const correctSet = new Set(correctShuffledIndices);
      
      // Vérifier si les sets sont identiques
      const isExactMatch = selectedSet.size === correctSet.size && 
        [...selectedSet].every(i => correctSet.has(i));
      
      // Score partiel: combien de bonnes réponses sur le total
      const correctSelected = [...selectedSet].filter(i => correctSet.has(i)).length;
      const incorrectSelected = [...selectedSet].filter(i => !correctSet.has(i)).length;
      const partialScore = Math.max(0, (correctSelected - incorrectSelected) / correctShuffledIndices.length);
      
      return {
        isCorrect: isExactMatch,
        correctAnswer: correctShuffledIndices,
        explanation,
        partialScore
      };
    }
    
    case 'true_false': {
      const userAnswer = typeof answer === 'object' ? answer.answer : answer;
      const isCorrect = userAnswer === question.correctAnswer;
      
      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation
      };
    }
    
    case 'fill_blank': {
      const correctAnswers = question.correctAnswers || [];
      const userAnswers = answer || [];
      const caseSensitive = question.caseSensitive || false;
      
      let correctCount = 0;
      for (let i = 0; i < correctAnswers.length; i++) {
        const userAns = (userAnswers[i] || '').trim();
        const correctAns = (correctAnswers[i] || '').trim();
        
        const match = caseSensitive 
          ? userAns === correctAns 
          : userAns.toLowerCase() === correctAns.toLowerCase();
        
        if (match) correctCount++;
      }
      
      const isCorrect = correctCount === correctAnswers.length;
      const partialScore = correctAnswers.length > 0 ? correctCount / correctAnswers.length : 0;
      
      return {
        isCorrect,
        correctAnswer: correctAnswers,
        explanation,
        partialScore
      };
    }
    
    case 'matching': {
      const correctMatches = question.correctMatches || {};
      const userMatches = answer || {};
      
      let correctCount = 0;
      const totalPairs = Object.keys(correctMatches).length;
      
      for (const [left, right] of Object.entries(correctMatches)) {
        if (userMatches[left] === right) correctCount++;
      }
      
      const isCorrect = correctCount === totalPairs;
      const partialScore = totalPairs > 0 ? correctCount / totalPairs : 0;
      
      return {
        isCorrect,
        correctAnswer: correctMatches,
        explanation,
        partialScore
      };
    }
    
    case 'ordering': {
      const correctOrder = question.correctOrder || [];
      const userOrder = answer || [];
      
      let correctCount = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (userOrder[i] === correctOrder[i]) correctCount++;
      }
      
      const isCorrect = correctCount === correctOrder.length;
      const partialScore = correctOrder.length > 0 ? correctCount / correctOrder.length : 0;
      
      return {
        isCorrect,
        correctAnswer: correctOrder,
        explanation,
        partialScore
      };
    }
    
    case 'open_short':
    case 'open_long': {
      // Pour les questions ouvertes
      const expectedKeywords = question.expectedKeywords || [];
      const sampleAnswers = question.sampleAnswers || [];
      const metadata = question.metadata || {};
      let userAnswer = (answer || '').trim();
      
      // Appliquer la normalisation si définie dans metadata
      if (metadata.normalize === 'lowercase') {
        userAnswer = userAnswer.toLowerCase();
      } else if (metadata.normalize === 'uppercase') {
        userAnswer = userAnswer.toUpperCase();
      }
      
      // === Validation avancée basée sur metadata ===
      if (metadata.answerType && sampleAnswers.length > 0) {
        const expectedAnswer = sampleAnswers[0]; // Première réponse = réponse principale
        const alternatives = metadata.alternativeAnswers || [];
        
        // Normaliser aussi la réponse attendue
        let normalizedExpected = expectedAnswer.trim();
        if (metadata.normalize === 'lowercase') {
          normalizedExpected = normalizedExpected.toLowerCase();
        } else if (metadata.normalize === 'uppercase') {
          normalizedExpected = normalizedExpected.toUpperCase();
        }
        
        let isCorrect = false;
        let partialScore = 0;
        let nearMatch = false;
        
        switch (metadata.answerType) {
          case 'integer':
          case 'float':
          case 'year': {
            // Validation numérique avec tolérance
            const userNum = parseFloat(userAnswer.replace(',', '.'));
            const expectedNum = parseFloat(normalizedExpected.replace(',', '.'));
            
            if (!isNaN(userNum) && !isNaN(expectedNum)) {
              const tolerance = metadata.tolerance || 0;
              let allowedDiff = tolerance;
              
              if (metadata.toleranceType === 'percent') {
                allowedDiff = Math.abs(expectedNum * tolerance / 100);
              }
              
              const diff = Math.abs(userNum - expectedNum);
              isCorrect = diff <= allowedDiff;
              
              // Score partiel basé sur la proximité
              if (isCorrect) {
                partialScore = 1;
              } else if (diff <= allowedDiff * 2) {
                // Proche mais pas dans la tolérance
                nearMatch = true;
                partialScore = 0.5;
              } else {
                partialScore = Math.max(0, 1 - (diff / Math.max(Math.abs(expectedNum), 1)));
              }
            }
            break;
          }
          
          case 'date': {
            // Validation de date (formats: JJ/MM/AAAA, AAAA-MM-JJ)
            const normalizeDate = (d: string) => d.replace(/[\/\-\.]/g, '');
            isCorrect = normalizeDate(userAnswer) === normalizeDate(normalizedExpected);
            partialScore = isCorrect ? 1 : 0;
            break;
          }
          
          case 'regex': {
            // Validation par regex
            if (metadata.pattern) {
              try {
                const regex = new RegExp(metadata.pattern, 'i');
                isCorrect = regex.test(userAnswer);
                partialScore = isCorrect ? 1 : 0;
              } catch {
                // Regex invalide, fallback vers comparaison texte
                isCorrect = userAnswer.toLowerCase() === normalizedExpected.toLowerCase();
              }
            }
            break;
          }
          
          case 'text':
          default: {
            // Comparaison texte (avec ou sans normalisation)
            const userLower = metadata.normalize ? userAnswer : userAnswer.toLowerCase();
            const expectedLower = metadata.normalize ? normalizedExpected : normalizedExpected.toLowerCase();
            
            isCorrect = userLower === expectedLower;
            
            // Vérifier les alternatives
            if (!isCorrect && alternatives.length > 0) {
              for (const alt of alternatives) {
                const altNormalized = metadata.normalize === 'uppercase' 
                  ? alt.toUpperCase() 
                  : metadata.normalize === 'lowercase' 
                    ? alt.toLowerCase() 
                    : alt.toLowerCase();
                if (userLower === altNormalized) {
                  isCorrect = true;
                  break;
                }
              }
            }
            
            partialScore = isCorrect ? 1 : 0;
          }
        }
        
        return {
          isCorrect,
          correctAnswer: sampleAnswers,
          explanation,
          partialScore,
          nearMatch: nearMatch ? { message: metadata.nearMatchMessage || 'Tu étais proche !' } : undefined
        };
      }
      
      // === Mode classique : évaluation IA ou mots-clés ===
      const userAnswerLower = userAnswer.toLowerCase();
      
      // Si l'utilisateur est premium (a un tuteur), utiliser l'évaluation IA
      if (isPremium && userAnswer.length > 0) {
        try {
          const aiResult = await evaluateOpenAnswerWithAI(
            question.text || question.question || '',
            answer,
            expectedKeywords,
            sampleAnswers,
            question.matiere?.name || undefined
          );
          
          // Score >= 70 = considéré comme correct
          const isCorrect = aiResult.score >= 70;
          const partialScore = aiResult.score / 100;
          
          return {
            isCorrect,
            correctAnswer: sampleAnswers,
            explanation,
            partialScore,
            aiEvaluation: aiResult
          };
        } catch (error) {
          console.error('AI evaluation failed, falling back to keywords:', error);
          // Continuer avec l'évaluation par mots-clés
        }
      }
      
      // Évaluation par mots-clés (mode gratuit ou fallback)
      let keywordCount = 0;
      for (const keyword of expectedKeywords) {
        if (userAnswerLower.includes(keyword.toLowerCase())) {
          keywordCount++;
        }
      }
      
      // Score basé sur les mots-clés trouvés
      const partialScore = expectedKeywords.length > 0 
        ? keywordCount / expectedKeywords.length 
        : undefined; // undefined indique qu'il faudra une correction manuelle
      
      // Considéré comme "correct" si tous les mots-clés sont présents
      const isCorrect = expectedKeywords.length > 0 && keywordCount === expectedKeywords.length;
      
      return {
        isCorrect: expectedKeywords.length > 0 ? isCorrect : false,
        correctAnswer: sampleAnswers,
        explanation,
        partialScore
      };
    }
    
    default: {
      // Fallback vers QCM classique
      const originalCorrectIndex = question.correctAnswer;
      const seed = `${sessionId}-${questionId}`;
      const shuffleOrder = seededShuffle(question.options?.length || 4, seed);
      const shuffledCorrectIndex = shuffleOrder.findIndex((origIdx: number) => origIdx === originalCorrectIndex);
      
      return {
        isCorrect: answer === shuffledCorrectIndex,
        correctAnswer: shuffledCorrectIndex,
        explanation
      };
    }
  }
}

// POST - Enregistrer une réponse (mode révision) ou sauvegarder/soumettre (mode épreuve)
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const body = await request.json();
    const { questionIndex, selectedAnswer, action, questionType, answer } = body;
    
    // action peut être:
    // - undefined ou 'answer': répondre à une question (mode révision classique)
    // - 'save': sauvegarder une réponse sans valider (mode épreuve)
    // - 'submit': soumettre toutes les réponses (mode épreuve, fin de quiz)
    
    // Support pour les anciens et nouveaux formats
    const actualAnswer = answer !== undefined ? answer : selectedAnswer;
    const actualQuestionType = questionType || 'qcm';

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

    const isEpreuveMode = session.mode === 'epreuve';

    // === ACTION: SAVE (Mode épreuve uniquement) ===
    if (action === 'save') {
      if (!isEpreuveMode) {
        return json({ message: 'Action "save" disponible uniquement en mode épreuve' }, { status: 400 });
      }
      
      if (typeof questionIndex !== 'number' || typeof selectedAnswer !== 'number') {
        return json({ message: 'questionIndex et selectedAnswer requis' }, { status: 400 });
      }

      // Sauvegarder la réponse sans la valider
      const savedAnswers = { ...(session.savedAnswers || {}), [questionIndex]: selectedAnswer };
      
      await db.query(`
        UPDATE type::thing("quiz_session", "${params.sessionId}") SET 
          savedAnswers = ${JSON.stringify(savedAnswers)},
          lastActivityAt = time::now()
      `);

      return json({
        success: true,
        savedAnswers,
        answeredCount: Object.keys(savedAnswers).length,
        totalQuestions: session.totalQuestions
      });
    }

    // === ACTION: SUBMIT (Mode épreuve - soumettre tout) ===
    if (action === 'submit') {
      if (!isEpreuveMode) {
        return json({ message: 'Action "submit" disponible uniquement en mode épreuve' }, { status: 400 });
      }

      const savedAnswers = session.savedAnswers || {};
      const questionIds = session.questionIds || [];
      
      // Vérifier toutes les réponses sauvegardées
      const answers: any[] = [];
      let score = 0;

      for (let i = 0; i < questionIds.length; i++) {
        const questionId = questionIds[i];
        const selectedAns = savedAnswers[i];
        
        if (typeof selectedAns === 'number') {
          const verification = await verifyAnswer(
            db,
            params.sessionId!,
            questionId.toString(),
            selectedAns,
            4
          );

          if (verification.isCorrect) score++;

          answers.push({
            questionIndex: i,
            questionId: questionId.toString(),
            selectedAnswer: selectedAns,
            correctAnswer: verification.correctAnswer,
            isCorrect: verification.isCorrect,
            explanation: verification.explanation,
            answeredAt: new Date().toISOString()
          });
          
          // Mettre à jour progression et compétences
          const userId = session.userId?.toString() || session.userId;
          let classeId = session.classeId?.toString() || session.classeId;
          
          if (userId && classeId) {
            await updateProgressAfterAnswer(userId, classeId, questionId.toString(), verification.isCorrect);
          }
          if (userId && !userId.startsWith('anonymous_')) {
            await updateUserCompetences(db, userId, questionId.toString(), verification.isCorrect);
          }
        } else {
          // Question non répondue
          const cleanId = questionId.toString().includes(':') ? questionId.toString().split(':')[1] : questionId.toString();
          const qResult = await db.query(
            'SELECT correctAnswer, explanation FROM type::thing("question", $id)',
            { id: cleanId }
          );
          const q = (qResult[0] as any[])?.[0];
          
          answers.push({
            questionIndex: i,
            questionId: questionId.toString(),
            selectedAnswer: null,
            correctAnswer: q?.correctAnswer ?? 0,
            isCorrect: false,
            explanation: q?.explanation,
            answeredAt: new Date().toISOString(),
            skipped: true
          });
        }
      }

      // Mettre à jour la session comme terminée
      const answersJson = JSON.stringify(answers);
      await db.query(`
        UPDATE type::thing("quiz_session", "${params.sessionId}") SET 
          answers = ${answersJson},
          score = ${score},
          status = 'completed',
          completedAt = time::now(),
          lastActivityAt = time::now()
      `);

      // Vérifier et attribuer les badges
      let earnedBadges: any[] = [];
      const quizUserId = session.userId?.toString() || session.userId;
      if (quizUserId && !quizUserId.startsWith('anonymous_')) {
        await updateDailyStreak(db, quizUserId);
        const isPerfect = score === session.totalQuestions;
        earnedBadges = await checkAndAwardBadges(db, quizUserId, {
          quizCompleted: true,
          isPerfectScore: isPerfect,
          isEpreuveMode: true
        });
      }

      return json({
        success: true,
        isCompleted: true,
        score,
        totalQuestions: session.totalQuestions,
        answers,
        percentage: Math.round((score / session.totalQuestions) * 100),
        earnedBadges: earnedBadges.map(b => ({ slug: b.slug, name: b.name, icon: b.icon, description: b.description, rarity: b.rarity, points: b.points }))
      });
    }

    // === ACTION: ANSWER (Mode révision - comportement classique) ===
    if (typeof questionIndex !== 'number' || actualAnswer === undefined || actualAnswer === null) {
      return json({ message: 'questionIndex et answer requis' }, { status: 400 });
    }

    // En mode révision, on ne peut pas répondre deux fois à la même question
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

    // Vérifier si l'utilisateur a un tuteur (premium = évaluation IA pour questions ouvertes)
    let isPremiumUser = false;
    const userId = session.userId?.toString() || session.userId;
    if (userId && !userId.startsWith('anonymous_')) {
      const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
      const userResult = await db.query<any[]>(
        'SELECT tutor_id FROM type::thing("user", $userId)',
        { userId: cleanUserId }
      );
      const userForTutor = (userResult[0] as any[])?.[0];
      isPremiumUser = !!userForTutor?.tutor_id;
    }

    // Vérifier la réponse côté serveur (sécurité !)
    // Utilise la nouvelle fonction multi-type avec support IA pour premium
    const verification = await verifyAnswerMultiType(
      db, 
      params.sessionId!, 
      questionId.toString(), 
      actualQuestionType,
      actualAnswer,
      isPremiumUser
    );
    
    // Mettre à jour la progression utilisateur (points par thème)
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
        await db.query(`UPDATE quiz_session:${params.sessionId} SET gradeId = $gradeId`, { gradeId });
      }
    }
    
    if (userId && gradeId) {
      await updateProgressAfterAnswer(userId, gradeId, questionId.toString(), verification.isCorrect);
    }
    
    // Mettre à jour les compétences de l'utilisateur
    if (userId && !userId.startsWith('anonymous_')) {
      await updateUserCompetences(db, userId, questionId.toString(), verification.isCorrect);
    }
    
    // Créer l'objet réponse
    const answerRecord: any = {
      questionIndex,
      questionId: questionId.toString(),
      questionType: actualQuestionType,
      selectedAnswer: actualAnswer,
      correctAnswer: verification.correctAnswer,
      isCorrect: verification.isCorrect,
      partialScore: verification.partialScore,
      answeredAt: new Date().toISOString()
    };
    
    // Ajouter l'évaluation IA si disponible (pour questions ouvertes premium)
    if (verification.aiEvaluation) {
      answerRecord.aiEvaluation = verification.aiEvaluation;
    }

    // Calculer le nouveau score
    // Score partiel possible pour certains types de questions
    const scoreIncrement = verification.isCorrect 
      ? 1 
      : (verification.partialScore ? Math.round(verification.partialScore * 100) / 100 : 0);
    const newScore = session.score + scoreIncrement;
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

    // Vérifier et attribuer les badges si le quiz est terminé (mode révision)
    let earnedBadges: any[] = [];
    if (isCompleted && userId && !userId.startsWith('anonymous_')) {
      await updateDailyStreak(db, userId);
      const isPerfect = newScore === session.totalQuestions;
      earnedBadges = await checkAndAwardBadges(db, userId, {
        quizCompleted: true,
        isPerfectScore: isPerfect,
        isEpreuveMode: false,
        correctStreak: newAnswers.filter((a: any) => a.isCorrect).length
      });
    }

    return json({
      answer: answerRecord,
      isCorrect: verification.isCorrect,
      correctAnswer: verification.correctAnswer,
      explanation: verification.explanation,
      aiEvaluation: verification.aiEvaluation,
      session: {
        ...updatedSession,
        id: updatedSession?.id?.toString()
      },
      isCompleted,
      score: newScore,
      totalQuestions: session.totalQuestions,
      earnedBadges: isCompleted ? earnedBadges.map(b => ({ slug: b.slug, name: b.name, icon: b.icon, description: b.description, rarity: b.rarity, points: b.points })) : undefined
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
      completedAt: session.completedAt,
      // Champs mode et timer
      mode: session.mode || 'revision',
      timeLimit: session.timeLimit || null,
      timeRemaining: session.timeRemaining || null,
      timerStartedAt: session.timerStartedAt || null,
      savedAnswers: session.savedAnswers || {}
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
