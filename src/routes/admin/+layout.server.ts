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

    // Charger les subjects (matières unifiées) avec leurs stats
    const subjectsResult = await db.query(`
      SELECT id, code, name, icon, color, domain, pos FROM subject WHERE is_active = true ORDER BY pos ASC, name ASC
    `);
    const allSubjects = (subjectsResult[0] as any[]) || [];
    
    // Pour chaque subject, compter les questions et thèmes
    const subjects = await Promise.all(allSubjects.map(async (s: any) => {
      const subjectCode = s.code;
      
      // Compter les questions avec ce subject
      const questionCountResult = await db.query(
        `SELECT count() as total FROM question WHERE subject.code = $code GROUP ALL`,
        { code: subjectCode }
      );
      const questionCount = (questionCountResult[0] as any[])?.[0]?.total || 0;
      
      // Compter les thèmes avec ce subject
      const themeCountResult = await db.query(
        `SELECT count() as total FROM theme WHERE subject.code = $code AND is_active = true GROUP ALL`,
        { code: subjectCode }
      );
      const themeCount = (themeCountResult[0] as any[])?.[0]?.total || 0;
      
      // Compter les quiz avec ce subject
      const quizCountResult = await db.query(
        `SELECT count() as total FROM quiz WHERE subject.code = $code AND isActive = true GROUP ALL`,
        { code: subjectCode }
      );
      const quizCount = (quizCountResult[0] as any[])?.[0]?.total || 0;
      
      return {
        id: s.id?.toString() || s.id,
        code: subjectCode,
        name: s.name,
        slug: subjectCode, // On utilise le code comme slug
        icon: s.icon || null,
        color: s.color || null,
        domain: s.domain?.toString() || s.domain || null,
        themeCount,
        questionCount,
        quizCount
      };
    }));

    // Charger les thèmes pour les menus (questions par thème)
    const themeTableResult = await db.query(`
      SELECT id, name, subject.code as subject_code FROM theme WHERE is_active = true ORDER BY name
    `);
    const allThemes = (themeTableResult[0] as any[]) || [];
    
    const questionsByTheme: Record<string, { name: string; count: number; subjectCode: string }> = {};
    
    for (const theme of allThemes) {
      const themeIdStr = theme.id?.toString() || theme.id;
      const cleanThemeId = themeIdStr.includes(':') ? themeIdStr.split(':')[1] : themeIdStr;
      const countResult = await db.query(
        'SELECT count() FROM question WHERE type::thing("theme", $themeId) INSIDE theme_ids AND isActive = true GROUP ALL',
        { themeId: cleanThemeId }
      );
      const count = (countResult[0] as any[])?.[0]?.count || 0;
      if (count > 0) {
        questionsByTheme[theme.name] = {
          name: theme.name,
          count,
          subjectCode: theme.subject_code || ''
        };
      }
    }
    
    const questionThemes = Object.values(questionsByTheme)
      .map(({ name, count, subjectCode }) => ({
        name,
        slug: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
        questionCount: count,
        subjectCode
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Charger les cycles avec le nombre d'utilisateurs par cycle
    const cyclesResult = await db.query(`
      SELECT * FROM cycle ORDER BY \`order\` ASC
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
      subjects, // Remplace matieres - table unifiée
      questionThemes,
      cycles,
      backofficeUser,
      user: backofficeUser || { email: 'admin@example.com', name: 'Admin' }
    };
  } catch (error) {
    console.error('Error loading layout data:', error);
    return {
      subjects: [],
      questionThemes: [],
      cycles: [],
      backofficeUser,
      user: backofficeUser || { email: 'admin@example.com', name: 'Admin' }
    };
  }
};
