import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();

    // Récupérer les statistiques
    const quizResult = await db.query<any[]>('SELECT * FROM quiz');
    const quizList = quizResult[0] as any[] || [];
    const totalQuiz = quizList.length;
    const activeQuiz = quizList.filter((q: any) => q.isActive).length;
    
    const questionsResult = await db.query<any[]>('SELECT count() FROM question GROUP ALL');
    const activeQuestionsResult = await db.query<any[]>('SELECT count() FROM question WHERE isActive = true GROUP ALL');
    const mediaResult = await db.query<any[]>('SELECT count() FROM media GROUP ALL');
    const recentResultsResult = await db.query<any[]>('SELECT count() FROM quiz_result WHERE completedAt > time::now() - 7d GROUP ALL');

    return json({
      totalQuiz,
      activeQuiz,
      totalQuestions: (questionsResult[0] as any[])?.[0]?.count || 0,
      activeQuestions: (activeQuestionsResult[0] as any[])?.[0]?.count || 0,
      totalMedia: (mediaResult[0] as any[])?.[0]?.count || 0,
      recentResults: (recentResultsResult[0] as any[])?.[0]?.count || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    return json({
      totalQuiz: 0,
      activeQuiz: 0,
      totalQuestions: 0,
      activeQuestions: 0,
      totalMedia: 0,
      recentResults: 0
    });
  }
};
