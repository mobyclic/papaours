import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Récupérer tous les quizzes avec le nombre de questions
    const quizzesResult = await db.query(`
      SELECT 
        *,
        (SELECT count() FROM question WHERE quizId = $parent.id AND isActive = true)[0].count AS question_count
      FROM quiz
      ORDER BY createdAt DESC
    `);
    
    const quizzes = (quizzesResult[0] as any[]) || [];
    
    // Adapter les noms de champs pour le template
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz.id?.toString() || quiz.id,
      title: quiz.title,
      slug: quiz.slug,
      subject: quiz.theme || quiz.subject,
      difficulty_level: quiz.level || quiz.difficulty_level,
      question_count: quiz.question_count || 0,
      is_active: quiz.isActive ?? quiz.is_active ?? true,
      created_at: quiz.createdAt || quiz.created_at,
      shuffleQuestions: quiz.shuffleQuestions,
      maxQuestions: quiz.maxQuestions
    }));

    return {
      quizzes: formattedQuizzes
    };
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return {
      quizzes: []
    };
  }
};
