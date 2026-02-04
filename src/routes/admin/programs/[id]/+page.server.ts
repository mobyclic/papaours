import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;
  
  try {
    const db = await getSurrealDB();
    
    // Récupérer le programme avec toutes ses relations
    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at,
        education_system.name AS education_system_name,
        cycle.id AS cycle_id,
        cycle.name AS cycle_name,
        cycle.slug AS cycle_slug,
        grade.id AS grade_id,
        grade.name AS grade_name,
        grade.slug AS grade_slug,
        subject.id AS subject_id,
        subject.name AS subject_name,
        subject.code AS subject_code,
        subject.icon AS subject_icon,
        subject.color AS subject_color
      FROM type::thing("official_program", $id)
    `, { id });

    if (!programs || programs.length === 0) {
      throw error(404, 'Programme non trouvé');
    }

    const program = programs[0];

    // Récupérer les chapitres du programme
    const [chapters] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        slug,
        description,
        \`order\`,
        is_active,
        created_at,
        (SELECT count() FROM quiz WHERE chapter = $parent.id) AS quizzes_count,
        (SELECT count() FROM question WHERE chapter = $parent.id) AS questions_count
      FROM chapter 
      WHERE official_program = type::thing("official_program", $id)
      ORDER BY \`order\` ASC, created_at ASC
    `, { id });

    // Sérialiser
    const serializedProgram = {
      ...program,
      id: program.id?.toString() || program.id,
      cycle_id: program.cycle_id?.toString() || program.cycle_id,
      grade_id: program.grade_id?.toString() || program.grade_id,
      subject_id: program.subject_id?.toString() || program.subject_id,
      created_at: program.created_at?.toISOString?.() || program.created_at,
      updated_at: program.updated_at?.toISOString?.() || program.updated_at
    };

    const serializedChapters = (chapters || []).map(ch => ({
      ...ch,
      id: ch.id?.toString() || ch.id,
      quizzes_count: ch.quizzes_count?.[0]?.count || 0,
      questions_count: ch.questions_count?.[0]?.count || 0,
      created_at: ch.created_at?.toISOString?.() || ch.created_at
    }));

    return {
      program: serializedProgram,
      chapters: serializedChapters
    };
  } catch (err: any) {
    console.error('Erreur chargement programme:', err);
    if (err.status === 404) throw err;
    throw error(500, 'Erreur serveur');
  }
};
