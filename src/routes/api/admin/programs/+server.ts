import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Liste des programmes
export const GET: RequestHandler = async () => {
  try {
    const db = await getSurrealDB();
    
    const [programs] = await db.query<[any[]]>(`
      SELECT *, grade.\`order\` as grade_order FROM official_program ORDER BY grade_order ASC
    `);

    return json({ programs: programs || [] });
  } catch (error) {
    console.error('Erreur récupération programmes:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un programme
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, cycle_slug, grade_slug, grade_id, subject_code, description, is_active } = data;

    if ((!grade_slug && !grade_id) || !subject_code) {
      return json({ error: 'Classe et matière requis' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Récupérer le grade (par ID ou slug)
    let gradeResult;
    if (grade_id) {
      const cleanGradeId = grade_id.includes(':') ? grade_id.split(':')[1] : grade_id;
      gradeResult = await db.query<[any[]]>(`SELECT id, slug, cycle.id AS cycle_id FROM type::thing("grade", $id)`, { id: cleanGradeId });
    } else {
      gradeResult = await db.query<[any[]]>(`SELECT id, slug, cycle.id AS cycle_id FROM grade WHERE slug = $slug`, { slug: grade_slug });
    }

    const [subjectResult] = await db.query<[any[]]>(`SELECT id, name FROM subject WHERE code = $code`, { code: subject_code });

    if (!gradeResult?.[0]?.length || !subjectResult?.length) {
      return json({ error: 'Classe ou matière non trouvée' }, { status: 400 });
    }

    const grade = gradeResult[0][0];
    const gradeId = grade.id.toString().replace('grade:', '');
    const cycleId = grade.cycle_id?.toString().replace('cycle:', '') || '';
    const subjectId = subjectResult[0].id.toString().replace('subject:', '');
    const subjectName = subjectResult[0].name;

    // Vérifier si le programme existe déjà
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM official_program 
      WHERE grade = type::thing("grade", $gradeId) 
        AND subject = type::thing("subject", $subjectId)
    `, { gradeId, subjectId });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce programme existe déjà pour cette classe et matière' }, { status: 400 });
    }

    // Générer le nom si non fourni
    const programName = name || `${subjectName} - ${grade.slug || gradeId}`;

    // Créer le programme
    const [created] = await db.query<[any[]]>(`
      CREATE official_program SET
        name = $name,
        education_system = type::thing("education_system", "FR"),
        cycle = type::thing("cycle", $cycleId),
        grade = type::thing("grade", $gradeId),
        subject = type::thing("subject", $subjectId),
        description = $description,
        is_active = $is_active,
        created_at = time::now()
    `, {
      name: programName,
      cycleId,
      gradeId,
      subjectId,
      description: description || null,
      is_active: is_active ?? true
    });

    return json({ success: true, program: created?.[0] });
  } catch (error) {
    console.error('Erreur création programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier un programme
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, name, cycle_slug, grade_slug, subject_code, description, is_active } = data;

    if (!id || !cycle_slug || !grade_slug || !subject_code) {
      return json({ error: 'ID, cycle, classe et matière requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Récupérer les IDs des relations
    const [cycleResult] = await db.query<[any[]]>(`SELECT id FROM cycle WHERE slug = $slug`, { slug: cycle_slug });
    const [gradeResult] = await db.query<[any[]]>(`SELECT id FROM grade WHERE slug = $slug`, { slug: grade_slug });
    const [subjectResult] = await db.query<[any[]]>(`SELECT id, name FROM subject WHERE code = $code`, { code: subject_code });

    if (!cycleResult?.length || !gradeResult?.length || !subjectResult?.length) {
      return json({ error: 'Cycle, classe ou matière non trouvé' }, { status: 400 });
    }

    const cycleId = cycleResult[0].id.toString().replace('cycle:', '');
    const gradeId = gradeResult[0].id.toString().replace('grade:', '');
    const subjectId = subjectResult[0].id.toString().replace('subject:', '');
    const subjectName = subjectResult[0].name;

    // Vérifier unicité
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM official_program 
      WHERE grade = type::thing("grade", $gradeId) 
        AND subject = type::thing("subject", $subjectId)
        AND id != type::thing("official_program", $cleanId)
    `, { gradeId, subjectId, cleanId });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce programme existe déjà pour cette classe et matière' }, { status: 400 });
    }

    const programName = name || `${subjectName} - ${grade_slug}`;

    // Mettre à jour
    const [updated] = await db.query<[any[]]>(`
      UPDATE type::thing("official_program", $cleanId) SET
        name = $name,
        cycle = type::thing("cycle", $cycleId),
        grade = type::thing("grade", $gradeId),
        subject = type::thing("subject", $subjectId),
        description = $description,
        is_active = $is_active,
        updated_at = time::now()
    `, {
      cleanId,
      name: programName,
      cycleId,
      gradeId,
      subjectId,
      description: description || null,
      is_active: is_active ?? true
    });

    return json({ success: true, program: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un programme
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Supprimer les chapitres liés
    await db.query(`DELETE chapter WHERE official_program = type::thing("official_program", $cleanId)`, { cleanId });

    // Supprimer le programme
    await db.query(`DELETE type::thing("official_program", $cleanId)`, { cleanId });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
