import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ params }) => {
  const themeSlug = params.slug;
  
  // Convertir le slug en nom de thème (ex: "histoire" -> "Histoire", "physique-chimie" -> "Physique/Chimie")
  const themeName = themeSlug
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('/') || '';

  try {
    const db = await connectDB();

    // Récupérer les quiz avec matiere_id correspondant au thème
    // On filtre par le nom de la matière via une sous-requête
    const quizzesResult = await db.query(`
      SELECT * FROM quiz WHERE matiere_id.name = $themeName ORDER BY createdAt DESC
    `, { themeName });
    
    const quizzes = (quizzesResult[0] as any[]) || [];
    
    // Pour chaque quiz, compter les questions via theme_ids (prioritaire) ou matiere_id
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
      } else if (quiz.matiere_id) {
        // Fallback par matière
        const cleanMatiereId = quiz.matiere_id.toString().split(':')[1] || quiz.matiere_id.toString();
        const countResult = await db.query(
          'SELECT count() FROM question WHERE matiere_id = type::thing("subject", $matiereId) AND isActive = true GROUP ALL',
          { matiereId: cleanMatiereId }
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

    // Récupérer toutes les matières pour le filtre
    const matieresResult = await db.query(`SELECT id, name FROM subject ORDER BY name`);
    const rawMatieres = (matieresResult[0] as any[]) || [];
    const themes = rawMatieres.map((m) => ({
      id: m.id?.toString() || m.id,
      name: m.name,
      slug: m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    }));

    // Trouver le thème actuel
    const currentTheme = themes.find(t => t.slug === themeSlug);

    return {
      quizzes: formattedQuizzes,
      themes,
      currentTheme: currentTheme || { id: '', name: themeName, slug: themeSlug },
      themeSlug
    };
  } catch (error) {
    console.error('Error loading quizzes for theme:', error);
    return {
      quizzes: [],
      themes: [],
      currentTheme: { id: '', name: themeName, slug: themeSlug },
      themeSlug
    };
  }
};
