import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Compter les quiz (GROUP ALL pour avoir un seul résultat agrégé)
    const quizCountResult = await db.query(`SELECT count() as total FROM quiz GROUP ALL`);
    const totalQuiz = (quizCountResult[0] as any)?.[0]?.total || 0;
    
    const activeQuizResult = await db.query(`SELECT count() as total FROM quiz WHERE isActive = true GROUP ALL`);
    const activeQuiz = (activeQuizResult[0] as any)?.[0]?.total || 0;
    
    // Compter les questions
    const questionCountResult = await db.query(`SELECT count() as total FROM question GROUP ALL`);
    const totalQuestions = (questionCountResult[0] as any)?.[0]?.total || 0;
    
    const activeQuestionsResult = await db.query(`SELECT count() as total FROM question WHERE isActive = true GROUP ALL`);
    const activeQuestions = (activeQuestionsResult[0] as any)?.[0]?.total || 0;
    
    // Compter les médias (questions avec images)
    const mediaCountResult = await db.query(`SELECT count() as total FROM question WHERE imageUrl != NONE GROUP ALL`);
    const totalMedia = (mediaCountResult[0] as any)?.[0]?.total || 0;
    
    // Compter les thèmes
    const themeCountResult = await db.query(`SELECT count() as total FROM theme WHERE is_active = true GROUP ALL`);
    const totalThemes = (themeCountResult[0] as any)?.[0]?.total || 0;
    
    // Compter les matières
    const matiereCountResult = await db.query(`SELECT count() as total FROM matiere WHERE is_active = true GROUP ALL`);
    const totalMatieres = (matiereCountResult[0] as any)?.[0]?.total || 0;
    
    // Compter les résultats récents (cette semaine)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentResultsResult = await db.query(
      `SELECT count() as total FROM quiz_result WHERE completedAt >= $date GROUP ALL`,
      { date: oneWeekAgo.toISOString() }
    );
    const recentResults = (recentResultsResult[0] as any)?.[0]?.total || 0;
    
    // Compter les utilisateurs
    const userCountResult = await db.query(`SELECT count() as total FROM user GROUP ALL`);
    const totalUsers = (userCountResult[0] as any)?.[0]?.total || 0;

    return {
      stats: {
        totalQuiz,
        activeQuiz,
        totalQuestions,
        activeQuestions,
        totalMedia,
        totalThemes,
        totalMatieres,
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
        totalThemes: 0,
        totalMatieres: 0,
        recentResults: 0,
        totalUsers: 0
      }
    };
  }
};
