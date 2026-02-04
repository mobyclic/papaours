import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await getSurrealDB();
    
    // Récupérer les compétences avec leurs relations
    const [competences] = await db.query<[any[]]>(`
      SELECT 
        id,
        code,
        name,
        description,
        type,
        subject.id AS subject_id,
        subject.code AS subject_code,
        subject.name AS subject_name,
        subject.icon AS subject_icon,
        color,
        \`order\`,
        is_active,
        created_at,
        (SELECT count() FROM question WHERE competences CONTAINS $parent.id) AS questions_count,
        (SELECT count() FROM user_competence WHERE competence = $parent.id) AS users_count
      FROM competence
      ORDER BY type ASC, subject_name ASC, \`order\` ASC
    `);

    // Récupérer les matières pour le formulaire
    const [subjects] = await db.query<[any[]]>(`
      SELECT id, code, name, icon, color 
      FROM subject 
      WHERE is_active = true 
      ORDER BY name ASC
    `);

    // Sérialiser
    const serializedCompetences = (competences || []).map(c => ({
      ...c,
      id: c.id?.toString() || c.id,
      subject_id: c.subject_id?.toString() || c.subject_id,
      questions_count: c.questions_count?.[0]?.count || 0,
      users_count: c.users_count?.[0]?.count || 0,
      created_at: c.created_at?.toISOString?.() || c.created_at
    }));

    const serializedSubjects = (subjects || []).map(s => ({
      ...s,
      id: s.id?.toString() || s.id
    }));

    // Grouper par type puis par matière
    const grouped = {
      general: serializedCompetences.filter(c => c.type === 'general'),
      bySubject: {} as Record<string, typeof serializedCompetences>
    };

    for (const comp of serializedCompetences.filter(c => c.type === 'subject')) {
      const key = comp.subject_code || 'other';
      if (!grouped.bySubject[key]) {
        grouped.bySubject[key] = [];
      }
      grouped.bySubject[key].push(comp);
    }

    return {
      competences: serializedCompetences,
      subjects: serializedSubjects,
      grouped
    };
  } catch (error) {
    console.error('Erreur chargement compétences:', error);
    return {
      competences: [],
      subjects: [],
      grouped: { general: [], bySubject: {} }
    };
  }
};
