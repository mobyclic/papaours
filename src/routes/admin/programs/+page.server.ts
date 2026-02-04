import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
  try {
    const db = await getSurrealDB();
    
    // Paramètres de filtre depuis l'URL
    const selectedCycle = url.searchParams.get('cycle') || null;
    const selectedGrade = url.searchParams.get('grade') || null;
    
    // Récupérer les programmes officiels avec leurs relations
    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        education_system.name AS education_system_name,
        cycle.id AS cycle_id,
        cycle.name AS cycle_name,
        cycle.slug AS cycle_slug,
        cycle.\`order\` AS cycle_order,
        grade.id AS grade_id,
        grade.name AS grade_name,
        grade.slug AS grade_slug,
        grade.\`order\` AS grade_order,
        subject.id AS subject_id,
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

    // Récupérer les cycles avec compteurs
    const [cycles] = await db.query<[any[]]>(`
      SELECT 
        id, 
        name, 
        slug, 
        \`order\` AS cycle_order,
        (SELECT count() FROM grade WHERE cycle = $parent.id AND is_active = true) AS grades_count
      FROM cycle 
      WHERE is_active = true 
      ORDER BY cycle_order ASC
    `);

    // Récupérer les classes avec leur cycle et track
    const [grades] = await db.query<[any[]]>(`
      SELECT 
        id, 
        name, 
        slug, 
        code,
        cycle.id AS cycle_id,
        cycle.slug AS cycle_slug,
        cycle.name AS cycle_name,
        cycle.\`order\` AS cycle_order,
        track.id AS track_id,
        track.name AS track_name,
        track.slug AS track_slug,
        \`order\` AS grade_order
      FROM grade 
      WHERE is_active = true 
      ORDER BY cycle_order ASC, grade_order ASC
    `);

    // Récupérer les matières actives
    const [subjects] = await db.query<[any[]]>(`
      SELECT id, code, name, icon, color FROM subject WHERE is_active = true ORDER BY name ASC
    `);

    // Calculer les stats de couverture
    const serializedGrades = (grades || []).map(g => {
      const gradeId = g.id?.toString() || g.id;
      const gradePrograms = (programs || []).filter(p => 
        (p.grade_id?.toString() || p.grade_id) === gradeId
      );
      const programsWithChapters = gradePrograms.filter(p => 
        (p.chapters_count?.[0]?.count || 0) > 0
      );
      
      return {
        id: gradeId,
        name: g.name,
        slug: g.slug,
        code: g.code,
        cycle_id: g.cycle_id?.toString() || g.cycle_id,
        cycle_slug: g.cycle_slug,
        cycle_name: g.cycle_name,
        cycle_order: g.cycle_order,
        track_id: g.track_id?.toString() || g.track_id,
        track_name: g.track_name,
        track_slug: g.track_slug,
        grade_order: g.grade_order,
        programs_count: gradePrograms.length,
        programs_with_chapters: programsWithChapters.length,
        has_programs: gradePrograms.length > 0
      };
    });

    // Stats globales
    const totalGrades = serializedGrades.length;
    const gradesWithPrograms = serializedGrades.filter(g => g.has_programs).length;
    const gradesWithoutPrograms = totalGrades - gradesWithPrograms;
    const totalPrograms = (programs || []).length;
    const programsWithChapters = (programs || []).filter(p => 
      (p.chapters_count?.[0]?.count || 0) > 0
    ).length;
    const totalChapters = (programs || []).reduce((acc, p) => 
      acc + (p.chapters_count?.[0]?.count || 0), 0
    );

    // Sérialiser les programmes
    const serializePrograms = (programs || []).map(p => ({
      id: p.id?.toString() || p.id,
      name: p.name,
      cycle_id: p.cycle_id?.toString() || p.cycle_id,
      cycle_name: p.cycle_name,
      cycle_slug: p.cycle_slug,
      grade_id: p.grade_id?.toString() || p.grade_id,
      grade_name: p.grade_name,
      grade_slug: p.grade_slug,
      subject_id: p.subject_id?.toString() || p.subject_id,
      subject_name: p.subject_name,
      subject_code: p.subject_code,
      subject_icon: p.subject_icon,
      description: p.description,
      is_active: p.is_active,
      chapters_count: p.chapters_count?.[0]?.count || 0
    }));

    const serializeCycles = (cycles || []).map(c => ({
      id: c.id?.toString() || c.id,
      name: c.name,
      slug: c.slug,
      cycle_order: c.cycle_order,
      grades_count: c.grades_count?.[0]?.count || 0
    }));

    const serializeSubjects = (subjects || []).map(s => ({
      id: s.id?.toString() || s.id,
      code: s.code,
      name: s.name,
      icon: s.icon,
      color: s.color
    }));

    return {
      programs: serializePrograms,
      cycles: serializeCycles,
      grades: serializedGrades,
      subjects: serializeSubjects,
      selectedCycle,
      selectedGrade,
      stats: {
        totalGrades,
        gradesWithPrograms,
        gradesWithoutPrograms,
        totalPrograms,
        programsWithChapters,
        programsWithoutChapters: totalPrograms - programsWithChapters,
        totalChapters,
        totalSubjects: serializeSubjects.length
      }
    };
  } catch (error) {
    console.error('Erreur chargement programmes:', error);
    return {
      programs: [],
      cycles: [],
      grades: [],
      subjects: [],
      selectedCycle: null,
      selectedGrade: null,
      stats: {
        totalGrades: 0,
        gradesWithPrograms: 0,
        gradesWithoutPrograms: 0,
        totalPrograms: 0,
        programsWithChapters: 0,
        programsWithoutChapters: 0,
        totalChapters: 0,
        totalSubjects: 0
      }
    };
  }
};
