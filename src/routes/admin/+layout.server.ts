import type { LayoutServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: LayoutServerLoad = async ({ locals }) => {
  // TODO: Ajouter vérification d'authentification en production
  // if (!locals.user) {
  //   throw new Error('User not authenticated');
  // }

  try {
    const db = await connectDB();

    // Charger les matières avec le nombre de quiz associés
    const matieresResult = await db.query(`
      SELECT id, name FROM matiere ORDER BY name
    `);
    const allMatieres = (matieresResult[0] as any[]) || [];
    
    // Pour chaque matière, compter les quiz actifs
    const themes = await Promise.all(allMatieres.map(async (m: any) => {
      const matiereIdStr = m.id?.toString() || m.id;
      const cleanMatiereId = matiereIdStr.includes(':') ? matiereIdStr.split(':')[1] : matiereIdStr;
      const countResult = await db.query(
        'SELECT count() FROM quiz WHERE matiere_id = type::thing("matiere", $matiereId) AND isActive = true GROUP ALL',
        { matiereId: cleanMatiereId }
      );
      const quizCount = (countResult[0] as any[])?.[0]?.count || 0;
      return {
        name: m.name,
        slug: m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
        quizCount
      };
    }));

    // Charger le nombre de questions par thème via theme_ids
    // On récupère les thèmes avec leurs noms et on compte les questions qui les référencent
    const themeTableResult = await db.query(`
      SELECT id, name FROM theme ORDER BY name
    `);
    const allThemes = (themeTableResult[0] as any[]) || [];
    
    const questionsByTheme: Record<string, number> = {};
    
    // Pour chaque thème, compter les questions qui ont ce thème dans leurs theme_ids
    for (const theme of allThemes) {
      const themeIdStr = theme.id?.toString() || theme.id;
      const cleanThemeId = themeIdStr.includes(':') ? themeIdStr.split(':')[1] : themeIdStr;
      const countResult = await db.query(
        'SELECT count() FROM question WHERE type::thing("theme", $themeId) INSIDE theme_ids AND isActive = true GROUP ALL',
        { themeId: cleanThemeId }
      );
      const count = (countResult[0] as any[])?.[0]?.count || 0;
      if (count > 0) {
        questionsByTheme[theme.name] = count;
      }
    }
    
    const questionThemes = Object.entries(questionsByTheme)
      .map(([name, count]) => ({
        name,
        slug: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
        questionCount: count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Préparer les matières pour le menu Thèmes avec le nombre de thèmes par matière
    const matieres = await Promise.all(allMatieres.map(async (m: any) => {
      const matiereIdStr = m.id?.toString() || m.id;
      const cleanMatiereId = matiereIdStr.includes(':') ? matiereIdStr.split(':')[1] : matiereIdStr;
      // Compter les thèmes qui ont cette matière (dans matiere_id OU matiere_ids)
      const countResult = await db.query(
        `SELECT count() as total FROM theme WHERE 
          (matiere_id = type::thing("matiere", "${cleanMatiereId}") OR type::thing("matiere", "${cleanMatiereId}") INSIDE matiere_ids)
          AND is_active = true GROUP ALL`
      );
      const themeCount = (countResult[0] as any[])?.[0]?.total || 0;
      return {
        id: matiereIdStr,
        name: m.name,
        slug: cleanMatiereId,
        themeCount
      };
    }));
    
    // Charger les catégories de classes avec le nombre d'utilisateurs par catégorie
    const classCategoriesResult = await db.query(`
      SELECT * FROM class_category WHERE is_active = true ORDER BY pos ASC
    `);
    const allClassCategories = (classCategoriesResult[0] as any[]) || [];
    
    const classCategories = await Promise.all(allClassCategories.map(async (cat: any) => {
      const catIdStr = cat.id?.toString() || cat.id;
      // Compter les utilisateurs dont la classe appartient à cette catégorie
      const countResult = await db.query(
        `SELECT count() as total FROM user WHERE classe_id.category_id = type::thing("class_category", $catId) GROUP ALL`,
        { catId: catIdStr.includes(':') ? catIdStr.split(':')[1] : catIdStr }
      );
      const userCount = (countResult[0] as any[])?.[0]?.total || 0;
      return {
        id: catIdStr,
        name: cat.name_fr || cat.name,
        slug: cat.slug,
        userCount
      };
    }));

    return {
      themes,
      questionThemes,
      matieres: matieres.filter(m => m.themeCount > 0),
      classCategories,
      user: locals.user || { email: 'admin@example.com', name: 'Admin' }
    };
  } catch (error) {
    console.error('Error loading layout data:', error);
    return {
      themes: [],
      questionThemes: [],
      matieres: [],
      classCategories: [],
      user: locals.user || { email: 'admin@example.com', name: 'Admin' }
    };
  }
};
