import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Récupérer tous les quizzes
    const quizzesResult = await db.query(`
      SELECT * FROM quiz ORDER BY createdAt DESC
    `);
    
    const quizzes = (quizzesResult[0] as any[]) || [];
    
    // Pour chaque quiz, compter les questions via theme_ids (prioritaire) ou subject
    const formattedQuizzes = await Promise.all(quizzes.map(async (quiz) => {
      let questionCount = 0;
      
      if (quiz.theme_ids && Array.isArray(quiz.theme_ids) && quiz.theme_ids.length > 0) {
        // Compter par thèmes
        const themeConditions = quiz.theme_ids.map((tid: any) => {
          const cleanId = tid.toString().split(':')[1] || tid.toString();
          return `type::thing("theme", "${cleanId}") INSIDE theme_ids`;
        }).join(' OR ');
        
        const countResult = await db.query(
          `SELECT count() FROM question WHERE (${themeConditions}) AND isActive = true GROUP ALL`
        );
        questionCount = (countResult[0] as any[])?.[0]?.count || 0;
      } else if (quiz.subject) {
        // Fallback par subject
        const subjectCode = quiz.subject.toString().includes(':') 
          ? quiz.subject.toString().split(':')[1] 
          : quiz.subject.toString();
        const countResult = await db.query(
          'SELECT count() FROM question WHERE subject.code = $subjectCode AND isActive = true GROUP ALL',
          { subjectCode }
        );
        questionCount = (countResult[0] as any[])?.[0]?.count || 0;
      }
      
      return {
        id: quiz.id?.toString() || quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        subject: quiz.subject,
        difficulty_level: quiz.difficulty_level,
        question_count: questionCount,
        is_active: quiz.isActive ?? quiz.is_active ?? true,
        created_at: quiz.createdAt || quiz.created_at,
        maxQuestions: quiz.maxQuestions,
        theme_count: quiz.theme_ids?.length || 0
      };
    }));
    
    // Récupérer les subjects (matières) pour le formulaire de création
    const subjectsResult = await db.query(`
      SELECT id, code, name, icon FROM subject WHERE is_active = true ORDER BY name ASC
    `);
    const subjects = (subjectsResult[0] as any[]) || [];
    
    // Récupérer les thèmes groupés par subject pour le sélecteur
    const themesResult = await db.query(`
      SELECT id, name, slug, subject, subject.name as subject_name 
      FROM theme 
      WHERE is_active = true 
      ORDER BY subject_name ASC, name ASC
    `);
    const themes = (themesResult[0] as any[]) || [];

    return {
      quizzes: formattedQuizzes,
      subjects: subjects.map((s: any) => ({
        id: s.id?.toString() || s.id,
        code: s.code,
        name: s.name,
        icon: s.icon
      })),
      themes: themes.map((t: any) => ({
        id: t.id?.toString() || t.id,
        name: t.name,
        slug: t.slug,
        subject_code: t.subject?.toString()?.split(':')[1] || '',
        subject_name: t.subject_name || 'Sans matière'
      }))
    };
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return {
      quizzes: [],
      subjects: [],
      themes: []
    };
  }
};
