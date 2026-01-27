import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { updateProgressAfterQuiz } from '$lib/progress';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, quizId, classeId, score, totalQuestions, answers, correctAnswers } = await request.json();
    if (!quizId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return json({ message: 'quizId, score et totalQuestions requis' }, { status: 400 });
    }
    const db = await connectDB();
    
    // Extraire l'ID clean du quiz (sans le préfixe "quiz:")
    const cleanQuizId = quizId.includes(':') ? quizId.split(':')[1] : quizId;
    
    // Utiliser une requête SQL brute pour time::now() et les arrays
    const answersJson = JSON.stringify(Array.isArray(answers) ? answers : []);
    const query = `
      CREATE quiz_result SET
        userId = $userId,
        quizId = type::thing("quiz", $quizId),
        score = $score,
        totalQuestions = $totalQuestions,
        answers = ${answersJson},
        completedAt = time::now()
    `;
    
    const created = await db.query(query, {
      userId: userId || 'anonymous',
      quizId: cleanQuizId,
      score,
      totalQuestions
    });
    
    const result = Array.isArray(created[0]) ? created[0][0] : created[0];
    
    // Mettre à jour la progression si l'utilisateur n'est pas anonyme et a une classe
    let progressUpdates: any[] = [];
    if (userId && !userId.startsWith('anonymous_') && classeId) {
      // Récupérer le quiz pour obtenir ses theme_ids et matiere_id
      const quizResult = await db.query<any[]>(
        'SELECT theme_ids, matiere_id FROM type::thing("quiz", $quizId)',
        { quizId: cleanQuizId }
      );
      const quiz = (quizResult[0] as any[])?.[0];
      
      // Récupérer les questions via les theme_ids du quiz (prioritaire) ou matiere_id
      let questionsResult;
      if (quiz?.theme_ids && Array.isArray(quiz.theme_ids) && quiz.theme_ids.length > 0) {
        // Sélectionner par thèmes du quiz
        const themeConditions = quiz.theme_ids.map((tid: any) => {
          const cleanId = tid.toString().split(':')[1] || tid.toString();
          return `type::thing("theme", "${cleanId}") INSIDE theme_ids`;
        }).join(' OR ');
        
        questionsResult = await db.query<any[]>(
          `SELECT matiere_id, theme_ids FROM question WHERE (${themeConditions})`
        );
      } else if (quiz?.matiere_id) {
        const cleanMatiereId = quiz.matiere_id.toString().split(':')[1] || quiz.matiere_id.toString();
        questionsResult = await db.query<any[]>(
          'SELECT matiere_id, theme_ids FROM question WHERE matiere_id = type::thing("matiere", $matiereId)',
          { matiereId: cleanMatiereId }
        );
      } else {
        questionsResult = [[]];
      }
      
      const questions = (questionsResult[0] as any[]) || [];
      
      // Extraire les combinaisons uniques matière/thème
      const themeMatierePairs = new Map<string, string>();
      for (const q of questions) {
        const matiereId = q.matiere_id?.toString() || q.matiere_id;
        for (const tid of (q.theme_ids || [])) {
          const themeId = tid?.toString() || tid;
          if (themeId && matiereId) {
            themeMatierePairs.set(themeId, matiereId);
          }
        }
      }
      
      // Calculer le nombre de bonnes réponses
      const numCorrect = typeof correctAnswers === 'number' 
        ? correctAnswers 
        : Math.round((score / 100) * totalQuestions);
      
      // Mettre à jour la progression pour chaque thème
      for (const [themeId, matiereId] of themeMatierePairs) {
        try {
          const progress = await updateProgressAfterQuiz(
            userId,
            matiereId,
            themeId,
            classeId,
            score,
            totalQuestions,
            numCorrect
          );
          progressUpdates.push({
            themeId,
            matiereId,
            niveau: progress.niveau,
            points: progress.points
          });
        } catch (err) {
          console.error(`Erreur mise à jour progression theme=${themeId}:`, err);
        }
      }
    }
    
    return json({ success: true, result, progressUpdates });
  } catch (error) {
    console.error('Create quiz result error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
