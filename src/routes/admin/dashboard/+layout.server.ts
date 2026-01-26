import type { LayoutServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: LayoutServerLoad = async ({ locals }) => {
  // TODO: Ajouter vérification d'authentification en production
  // if (!locals.user) {
  //   throw new Error('User not authenticated');
  // }

  try {
    const db = await connectDB();

    // Charger les thèmes de quiz avec le nombre de quiz par thème
    const themesResult = await db.query(`
      SELECT theme, count() as quiz_count 
      FROM quiz 
      WHERE isActive = true 
      GROUP BY theme
      ORDER BY theme
    `);
    
    const themes = Array.isArray(themesResult) && Array.isArray(themesResult[0])
      ? themesResult[0].map((t: any) => ({
          name: t.theme,
          slug: t.theme.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
          quizCount: t.quiz_count
        }))
      : [];

    // Charger le nombre de questions par thème
    // SurrealDB ne groupe pas bien sur quizId.theme, donc on récupère toutes les questions et on compte en JS
    const questionsResult = await db.query(`
      SELECT quizId.theme as theme FROM question WHERE isActive = true
    `);
    
    const questionsByTheme: Record<string, number> = {};
    if (Array.isArray(questionsResult) && Array.isArray(questionsResult[0])) {
      for (const q of questionsResult[0] as any[]) {
        const theme = q.theme;
        if (theme) {
          questionsByTheme[theme] = (questionsByTheme[theme] || 0) + 1;
        }
      }
    }
    
    const questionThemes = Object.entries(questionsByTheme)
      .map(([name, count]) => ({
        name,
        slug: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
        questionCount: count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      themes,
      questionThemes,
      user: locals.user || { email: 'admin@example.com', name: 'Admin' }
    };
  } catch (error) {
    console.error('Error loading layout data:', error);
    return {
      themes: [],
      questionThemes: [],
      user: locals.user || { email: 'admin@example.com', name: 'Admin' }
    };
  }
};
