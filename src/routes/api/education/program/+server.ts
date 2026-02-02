import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ cookies }) => {
  const userId = cookies.get('userId');
  
  if (!userId) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const db = await getSurrealDB();
    
    // Récupérer l'utilisateur avec son contexte éducatif
    const [user] = await db.query<[any[]]>(`
      SELECT 
        current_grade,
        education_system
      FROM type::thing("user", $userId)
    `, { userId });

    if (!user || user.length === 0) {
      return json({ subjects: [] });
    }

    const userData = user[0];
    
    if (!userData.current_grade) {
      return json({ subjects: [] });
    }

    const gradeId = typeof userData.current_grade === 'string'
      ? userData.current_grade.replace('grade:', '')
      : userData.current_grade.id || userData.current_grade;

    // Récupérer le programme officiel pour cette classe
    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        subject.name AS subject_name,
        subject.code AS subject_code,
        subject.icon AS subject_icon,
        (SELECT count() FROM chapter WHERE official_program = $parent.id) AS chapters_count
      FROM official_program
      WHERE grade = type::thing("grade", $gradeId)
        AND is_active = true
    `, { gradeId });

    if (!programs || programs.length === 0) {
      // Retourner les matières par défaut si pas de programme officiel
      return json({
        subjects: [
          { code: 'history', name: 'Histoire', icon: '🏰', chaptersCount: 0 },
          { code: 'geography', name: 'Géographie', icon: '🌍', chaptersCount: 0 },
          { code: 'french', name: 'Français', icon: '📚', chaptersCount: 0 },
          { code: 'math', name: 'Mathématiques', icon: '🔢', chaptersCount: 0 },
          { code: 'svt', name: 'SVT', icon: '🌿', chaptersCount: 0 },
        ]
      });
    }

    // Mapper les résultats
    const subjects = programs.map(p => ({
      code: p.subject_code,
      name: p.subject_name,
      icon: p.subject_icon,
      chaptersCount: p.chapters_count?.[0]?.count || 0
    }));

    return json({ subjects });
    
  } catch (error) {
    console.error('Erreur récupération programme:', error);
    return json({ subjects: [] });
  }
};
