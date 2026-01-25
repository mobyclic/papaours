import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Compter les quiz
    const quizCountResult = await db.query(`SELECT count() FROM quiz`);
    const totalQuiz = (quizCountResult[0] as any[])?.[0]?.count || 0;
    
    const activeQuizResult = await db.query(`SELECT count() FROM quiz WHERE isActive = true`);
    const activeQuiz = (activeQuizResult[0] as any[])?.[0]?.count || 0;
    
    // Compter les questions
    const questionCountResult = await db.query(`SELECT count() FROM question`);
    const totalQuestions = (questionCountResult[0] as any[])?.[0]?.count || 0;
    
    const activeQuestionsResult = await db.query(`SELECT count() FROM question WHERE isActive = true`);
    const activeQuestions = (activeQuestionsResult[0] as any[])?.[0]?.count || 0;
    
    // Compter les médias (questions avec images)
    const mediaCountResult = await db.query(`SELECT count() FROM question WHERE imageUrl != NONE AND imageUrl != ''`);
    const totalMedia = (mediaCountResult[0] as any[])?.[0]?.count || 0;
    
    // Compter les résultats récents (cette semaine)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentResultsResult = await db.query(
      `SELECT count() FROM quiz_result WHERE completedAt >= $date`,
      { date: oneWeekAgo.toISOString() }
    );
    const recentResults = (recentResultsResult[0] as any[])?.[0]?.count || 0;
    
    // Compter les utilisateurs
    const userCountResult = await db.query(`SELECT count() FROM user`);
    const totalUsers = (userCountResult[0] as any[])?.[0]?.count || 0;

    return {
      stats: {
        totalQuiz,
        activeQuiz,
        totalQuestions,
        activeQuestions,
        totalMedia,
        recentResults,
        totalUsers
      }
    };
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return {
      stats: {
        totalQuiz: 0,
        activeQuiz: 0,
        totalQuestions: 0,
        activeQuestions: 0,
        totalMedia: 0,
        recentResults: 0,
        totalUsers: 0
      }
    };
  }
};
