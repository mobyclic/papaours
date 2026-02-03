import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { getBackofficeUser, type BackofficeUser } from '$lib/server/backoffice-auth';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  // Vérifier l'authentification backoffice
  const backofficeUser = await getBackofficeUser(cookies);
  
  // Si pas connecté, rediriger vers la page de login (sauf si on y est déjà)
  if (!backofficeUser && !url.pathname.startsWith('/admin/login')) {
    throw redirect(302, '/admin/login');
  }

  // Si on est sur la page de login et déjà connecté, rediriger vers le dashboard
  if (backofficeUser && url.pathname === '/admin/login') {
    throw redirect(302, '/admin');
  }

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
    
    // Charger les cycles avec le nombre d'utilisateurs par cycle
    const cyclesResult = await db.query(`
      SELECT * FROM cycle ORDER BY order ASC
    `);
    const allCycles = (cyclesResult[0] as any[]) || [];
    
    const cycles = await Promise.all(allCycles.map(async (cycle: any) => {
      const cycleIdStr = cycle.id?.toString() || cycle.id;
      const cleanCycleId = cycleIdStr.includes(':') ? cycleIdStr.split(':')[1] : cycleIdStr;
      // Compter les utilisateurs dont le grade appartient à ce cycle
      const countResult = await db.query(
        `SELECT count() as total FROM user WHERE current_grade.cycle = type::thing("cycle", $cycleId) GROUP ALL`,
        { cycleId: cleanCycleId }
      );
      const userCount = (countResult[0] as any[])?.[0]?.total || 0;
      return {
        id: cycleIdStr,
        name: cycle.name,
        code: cycle.code,
        userCount
      };
    }));

    return {
      themes,
      questionThemes,
      matieres: matieres.filter(m => m.themeCount > 0),
      cycles,
      backofficeUser,
      user: backofficeUser || { email: 'admin@example.com', name: 'Admin' }
    };
  } catch (error) {
    console.error('Error loading layout data:', error);
    return {
      themes: [],
      questionThemes: [],
      matieres: [],
      cycles: [],
      backofficeUser,
      user: backofficeUser || { email: 'admin@example.com', name: 'Admin' }
    };
  }
};
