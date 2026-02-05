import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const db = await getSurrealDB();
  const { id } = params;
  
  // Nettoyer l'ID (enlever le préfixe si présent)
  const cleanId = id.includes(':') ? id.split(':')[1] : id;

  try {
    // Récupérer les infos de la classe
    const [gradeResult] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        slug,
        code,
        short_name,
        \`order\`,
        is_active,
        cycle.id AS cycle_id,
        cycle.name AS cycle_name,
        cycle.slug AS cycle_slug,
        cycle.\`order\` AS cycle_order,
        track.id AS track_id,
        track.name AS track_name,
        track.slug AS track_slug,
        education_system.id AS system_id,
        education_system.name AS system_name,
        education_system.code AS system_code
      FROM type::thing("grade", $id)
      FETCH cycle, track, education_system
    `, { id: cleanId });

    const grade = gradeResult?.[0];
    if (!grade) {
      throw error(404, 'Classe non trouvée');
    }

    // Récupérer les programmes officiels pour cette classe
    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        description,
        is_active,
        subject.id AS subject_id,
        subject.name AS subject_name,
        subject.code AS subject_code,
        subject.icon AS subject_icon,
        subject.color AS subject_color,
        (SELECT count() FROM chapter WHERE official_program = $parent.id) AS chapters_count
      FROM official_program
      WHERE grade = type::thing("grade", $id)
      ORDER BY subject_name ASC
    `, { id: cleanId });

    // Récupérer toutes les matières pour pouvoir en ajouter
    const [subjects] = await db.query<[any[]]>(`
      SELECT id, code, name, icon, color 
      FROM subject 
      WHERE is_active = true 
      ORDER BY name ASC
    `);

    // Récupérer les chapitres pour chaque programme
    const programsWithChapters = await Promise.all(
      (programs || []).map(async (p) => {
        const programId = p.id?.toString() || p.id;
        const [chapters] = await db.query<[any[]]>(`
          SELECT id, title, name, \`order\`, sort_order, description
          FROM chapter
          WHERE official_program = type::thing("official_program", $programId)
          ORDER BY \`order\` ASC, sort_order ASC
        `, { programId: programId.replace('official_program:', '') });

        return {
          id: programId,
          name: p.name,
          description: p.description,
          is_active: p.is_active,
          subject_id: p.subject_id?.toString() || p.subject_id,
          subject_name: p.subject_name,
          subject_code: p.subject_code,
          subject_icon: p.subject_icon,
          subject_color: p.subject_color,
          chapters_count: p.chapters_count?.[0]?.count || 0,
          chapters: (chapters || []).map(c => ({
            id: c.id?.toString() || c.id,
            title: c.title || c.name || 'Sans titre',
            order: c.order ?? c.sort_order ?? 0,
            description: c.description
          }))
        };
      })
    );

    // Stats
    const totalPrograms = programsWithChapters.length;
    const programsWithChaptersCount = programsWithChapters.filter(p => p.chapters_count > 0).length;
    const totalChapters = programsWithChapters.reduce((acc, p) => acc + p.chapters_count, 0);
    const subjectsWithProgram = new Set(programsWithChapters.map(p => p.subject_code)).size;
    const subjectsCovered = programsWithChapters.filter(p => p.chapters_count > 0).map(p => p.subject_code);

    // Matières disponibles (sans programme encore)
    const existingSubjectCodes = programsWithChapters.map(p => p.subject_code);
    const availableSubjects = (subjects || [])
      .filter(s => !existingSubjectCodes.includes(s.code))
      .map(s => ({
        id: s.id?.toString() || s.id,
        code: s.code,
        name: s.name,
        icon: s.icon,
        color: s.color
      }));

    return {
      grade: {
        id: grade.id?.toString() || grade.id,
        name: grade.name,
        slug: grade.slug,
        code: grade.code,
        short_name: grade.short_name,
        order: grade.order,
        is_active: grade.is_active,
        cycle_id: grade.cycle_id?.toString() || grade.cycle_id,
        cycle_name: grade.cycle_name,
        cycle_slug: grade.cycle_slug,
        track_id: grade.track_id?.toString() || grade.track_id,
        track_name: grade.track_name,
        system_name: grade.system_name,
        system_code: grade.system_code
      },
      programs: programsWithChapters,
      subjects: availableSubjects,
      allSubjects: (subjects || []).map(s => ({
        id: s.id?.toString() || s.id,
        code: s.code,
        name: s.name,
        icon: s.icon,
        color: s.color
      })),
      stats: {
        totalPrograms,
        programsWithChapters: programsWithChaptersCount,
        programsWithoutChapters: totalPrograms - programsWithChaptersCount,
        totalChapters,
        subjectsWithProgram,
        subjectsCovered: subjectsCovered.length,
        totalSubjects: (subjects || []).length
      }
    };
  } catch (e) {
    console.error('Erreur chargement classe:', e);
    if ((e as any).status === 404) throw e;
    throw error(500, 'Erreur lors du chargement de la classe');
  }
};
