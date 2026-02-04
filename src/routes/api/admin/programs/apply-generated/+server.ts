import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { grade_slug, subject_code, chapters } = await request.json();

  if (!grade_slug || !subject_code || !chapters || !Array.isArray(chapters)) {
    return json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  const db = await getSurrealDB();

  try {
    // Récupérer les infos de la classe
    const gradeResult = await db.query<[any[]]>(`
      SELECT *, cycle.slug as cycle_slug 
      FROM grade 
      WHERE slug = $slug
      FETCH cycle
    `, { slug: grade_slug });

    const grade = gradeResult[0]?.[0];
    if (!grade) {
      return json({ error: 'Classe introuvable' }, { status: 404 });
    }

    const cycle_slug = grade.cycle_slug || grade.cycle?.slug;

    // Vérifier si le programme existe déjà
    const existingResult = await db.query<[any[]]>(`
      SELECT id FROM official_program 
      WHERE grade_slug = $grade_slug AND subject_code = $subject_code
    `, { grade_slug, subject_code });

    let programId: string;

    if (existingResult[0]?.[0]) {
      // Programme existe, on le met à jour
      programId = existingResult[0][0].id;
      
      // Supprimer les anciens chapitres
      await db.query(`
        DELETE FROM chapter WHERE program = type::thing('official_program', $id)
      `, { id: programId.replace('official_program:', '') });

    } else {
      // Créer le programme
      const createResult = await db.query<[any[]]>(`
        CREATE official_program SET
          cycle_slug = $cycle_slug,
          grade_slug = $grade_slug,
          subject_code = $subject_code,
          is_active = true,
          created_at = time::now(),
          updated_at = time::now()
      `, { cycle_slug, grade_slug, subject_code });

      programId = createResult[0]?.[0]?.id;
      if (!programId) {
        return json({ error: 'Erreur création programme' }, { status: 500 });
      }
    }

    // Créer les chapitres
    const cleanProgramId = programId.toString().replace('official_program:', '');
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      await db.query(`
        CREATE chapter SET
          program = type::thing('official_program', $program_id),
          name = $name,
          description = $description,
          sort_order = $sort_order,
          is_active = true,
          created_at = time::now(),
          updated_at = time::now()
      `, {
        program_id: cleanProgramId,
        name: chapter.name,
        description: chapter.description || null,
        sort_order: i + 1
      });
    }

    return json({
      success: true,
      program_id: programId,
      chapters_created: chapters.length
    });

  } catch (error) {
    console.error('Erreur application programme généré:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Erreur lors de l\'application' 
    }, { status: 500 });
  }
};
