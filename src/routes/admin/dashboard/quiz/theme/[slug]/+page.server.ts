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

    // Récupérer les quiz du thème spécifié
    const quizzesResult = await db.query(`
      SELECT 
        *,
        (SELECT count() FROM question WHERE quizId = $parent.id AND isActive = true)[0].count AS question_count
      FROM quiz
      WHERE theme = $themeName
      ORDER BY createdAt DESC
    `, { themeName });
    
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

    // Récupérer tous les thèmes pour le filtre
    const themesResult = await db.query(`SELECT theme FROM quiz WHERE theme IS NOT NONE GROUP BY theme`);
    const rawThemes = (themesResult[0] as any[]) || [];
    const themes = rawThemes
      .filter(t => t.theme)
      .map((t, idx) => ({
        id: `theme:${idx + 1}`,
        name: t.theme,
        slug: t.theme.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
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
