import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Récupérer toutes les questions avec leurs quizzes associés
    const questionsResult = await db.query(`
      SELECT 
        *,
        quizId.title AS quiz_title,
        quizId.theme AS quiz_theme
      FROM question 
      ORDER BY createdAt DESC
    `);
    
    const rawQuestions = (questionsResult[0] as any[]) || [];
    
    // Formater les questions pour le template
    const questions = rawQuestions.map(q => ({
      id: q.id?.toString() || q.id,
      question: q.question,
      theme_name: q.quiz_theme || q.family || 'Sans thème',
      quiz_title: q.quiz_title || 'Sans quiz',
      level_name: q.difficulty || 'medium',
      type: 'qcm',
      translations: [
        { language: 'fr', title: q.question }
      ],
      default_language: 'fr',
      answers: (q.options || []).map((opt: string, idx: number) => ({
        id: `a${idx + 1}`,
        text: opt,
        points: idx === q.correctAnswer ? 10 : 0,
        is_correct: idx === q.correctAnswer,
        language: 'fr',
        order: idx + 1
      })),
      multiple_answers: false,
      difficulty_weight: q.difficulty === 'hard' ? 7 : q.difficulty === 'easy' ? 3 : 5,
      is_active: q.isActive ?? true,
      created_at: q.createdAt,
      usage_count: 0,
      imageUrl: q.imageUrl
    }));

    // Récupérer les thèmes uniques depuis les quizzes
    const quizzesResult = await db.query(`SELECT theme FROM quiz WHERE theme IS NOT NONE GROUP BY theme`);
    const rawThemes = (quizzesResult[0] as any[]) || [];
    const themes = rawThemes
      .filter(t => t.theme)
      .map((t, idx) => ({
        id: `theme:${idx + 1}`,
        name: t.theme,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'][idx % 5]
      }));

    const levels = [
      { id: 'level:1', name: 'easy', order: 1 },
      { id: 'level:2', name: 'medium', order: 2 },
      { id: 'level:3', name: 'hard', order: 3 },
    ];

    return {
      questions,
      themes,
      levels
    };
  } catch (error) {
    console.error('Error loading questions:', error);
    return {
      questions: [],
      themes: [],
      levels: []
    };
  }
};
