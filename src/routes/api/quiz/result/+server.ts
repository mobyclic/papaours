import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, quizId, score, totalQuestions, answers } = await request.json();
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
    return json({ success: true, result });
  } catch (error) {
    console.error('Create quiz result error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
