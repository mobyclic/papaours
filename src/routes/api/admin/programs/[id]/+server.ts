import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Récupérer un programme spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await getSurrealDB();
    const { id } = params;
    
    const [program] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        description,
        is_active,
        cycle.name AS cycle_name,
        grade.name AS grade_name,
        subject.name AS subject_name,
        subject.code AS subject_code
      FROM type::thing("official_program", $id)
    `, { id });

    if (!program || program.length === 0) {
      return json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    return json({ program: program[0] });
  } catch (error) {
    console.error('Erreur récupération programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier un programme
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await getSurrealDB();
    const { id } = params;
    const data = await request.json();
    const { name, description, is_active } = data;

    const [updated] = await db.query<[any[]]>(`
      UPDATE type::thing("official_program", $id) SET
        name = $name,
        description = $description,
        is_active = $is_active,
        updated_at = time::now()
    `, {
      id,
      name,
      description: description || null,
      is_active: is_active ?? true
    });

    return json({ success: true, program: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un programme et ses chapitres
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await getSurrealDB();
    const { id } = params;

    // Supprimer d'abord les chapitres associés
    await db.query(`
      DELETE chapter WHERE official_program = type::thing("official_program", $id)
    `, { id });

    // Supprimer le programme
    await db.query(`
      DELETE type::thing("official_program", $id)
    `, { id });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression programme:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
