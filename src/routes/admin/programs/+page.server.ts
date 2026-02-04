import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await getSurrealDB();
    
    // Récupérer les programmes officiels avec leurs relations
    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        education_system.name AS education_system_name,
        cycle.name AS cycle_name,
        cycle.slug AS cycle_slug,
        cycle.\`order\` AS cycle_order,
        grade.name AS grade_name,
        grade.slug AS grade_slug,
        grade.\`order\` AS grade_order,
        subject.name AS subject_name,
        subject.code AS subject_code,
        subject.icon AS subject_icon,
        description,
        is_active,
        created_at,
        (SELECT count() FROM chapter WHERE official_program = $parent.id) AS chapters_count
      FROM official_program
      ORDER BY cycle_order ASC, grade_order ASC, subject_name ASC
    `);

    // Récupérer les cycles et classes pour le formulaire
    const [cycles] = await db.query<[any[]]>(`
      SELECT id, name, slug, \`order\` AS cycle_order FROM cycle WHERE is_active = true ORDER BY cycle_order ASC
    `);

    const [grades] = await db.query<[any[]]>(`
      SELECT 
        id, name, slug, 
        cycle.slug AS cycle_slug,
        cycle.\`order\` AS cycle_order,
        \`order\` AS grade_order
      FROM grade 
      WHERE is_active = true 
      ORDER BY cycle_order ASC, grade_order ASC
    `);

    // Récupérer les matières
    const [subjects] = await db.query<[any[]]>(`
      SELECT id, code, name, icon FROM subject ORDER BY name ASC
    `);

    // Sérialiser
    const serializePrograms = (programs || []).map(p => ({
      ...p,
      id: p.id?.toString() || p.id,
      chapters_count: p.chapters_count?.[0]?.count || 0
    }));

    const serializeCycles = (cycles || []).map(c => ({
      ...c,
      id: c.id?.toString() || c.id
    }));

    const serializeGrades = (grades || []).map(g => ({
      ...g,
      id: g.id?.toString() || g.id
    }));

    const serializeSubjects = (subjects || []).map(s => ({
      ...s,
      id: s.id?.toString() || s.id
    }));

    return {
      programs: serializePrograms,
      cycles: serializeCycles,
      grades: serializeGrades,
      subjects: serializeSubjects
    };
  } catch (error) {
    console.error('Erreur chargement programmes:', error);
    return {
      programs: [],
      cycles: [],
      grades: [],
      subjects: []
    };
  }
};
