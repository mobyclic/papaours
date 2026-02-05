import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
  const { grade_slug, grade_id, subject_code, program_name, chapters } = await request.json();

  if ((!grade_slug && !grade_id) || !subject_code || !chapters || !Array.isArray(chapters)) {
    return json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  const db = await getSurrealDB();

  try {
    // Récupérer les infos de la classe (par ID ou slug)
    let gradeResult;
    if (grade_id) {
      const cleanId = grade_id.includes(':') ? grade_id.split(':')[1] : grade_id;
      gradeResult = await db.query<[any[]]>(`
        SELECT id, slug, cycle.id AS cycle_id
        FROM type::thing("grade", $id)
      `, { id: cleanId });
    } else {
      gradeResult = await db.query<[any[]]>(`
        SELECT id, slug, cycle.id AS cycle_id
        FROM grade 
        WHERE slug = $slug
      `, { slug: grade_slug });
    }

    const grade = gradeResult[0]?.[0];
    if (!grade) {
      return json({ error: 'Classe introuvable' }, { status: 404 });
    }

    // Récupérer la matière
    const [subjectResult] = await db.query<[any[]]>(`
      SELECT id, name FROM subject WHERE code = $code
    `, { code: subject_code });

    const subject = subjectResult?.[0];
    if (!subject) {
      return json({ error: 'Matière introuvable' }, { status: 404 });
    }

    const gradeId = grade.id.toString().replace('grade:', '');
    const cycleId = grade.cycle_id?.toString().replace('cycle:', '') || '';
    const subjectId = subject.id.toString().replace('subject:', '');

    // Vérifier si le programme existe déjà
    const [existingResult] = await db.query<[any[]]>(`
      SELECT id FROM official_program 
      WHERE grade = type::thing("grade", $gradeId) 
        AND subject = type::thing("subject", $subjectId)
    `, { gradeId, subjectId });

    let programId: string;

    if (existingResult?.[0]) {
      // Programme existe, on supprime les anciens chapitres
      programId = existingResult[0].id.toString();
      const cleanProgramId = programId.replace('official_program:', '');
      
      await db.query(`
        DELETE chapter WHERE official_program = type::thing("official_program", $id)
      `, { id: cleanProgramId });

      // Mettre à jour le nom si fourni
      if (program_name) {
        await db.query(`
          UPDATE type::thing("official_program", $id) SET name = $name, updated_at = time::now()
        `, { id: cleanProgramId, name: program_name });
      }

    } else {
      // Créer le programme
      const finalName = program_name || `${subject.name} - ${grade.slug}`;
      
      const [createResult] = await db.query<[any[]]>(`
        CREATE official_program SET
          name = $name,
          education_system = type::thing("education_system", "FR"),
          cycle = type::thing("cycle", $cycleId),
          grade = type::thing("grade", $gradeId),
          subject = type::thing("subject", $subjectId),
          is_active = true,
          created_at = time::now()
      `, { 
        name: finalName,
        cycleId,
        gradeId,
        subjectId
      });

      programId = createResult?.[0]?.id?.toString();
      if (!programId) {
        return json({ error: 'Erreur création programme' }, { status: 500 });
      }
    }

    // Créer les chapitres
    const cleanProgramId = programId.replace('official_program:', '');
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const title = chapter.title || chapter.name;
      
      // Générer le slug
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Handle optional description field
      const descriptionValue = chapter.description?.trim();
      const descriptionSet = descriptionValue ? 'description = $description,' : '';

      await db.query(`
        CREATE chapter SET
          official_program = type::thing("official_program", $programId),
          title = $title,
          name = $title,
          slug = $slug,
          ${descriptionSet}
          \`order\` = $order,
          is_active = true,
          created_at = time::now()
      `, {
        programId: cleanProgramId,
        title,
        slug: `${slug}-${i + 1}`,
        description: descriptionValue || undefined,
        order: i + 1
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
