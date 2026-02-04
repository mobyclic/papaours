import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Liste des chapitres d'un programme
export const GET: RequestHandler = async ({ url }) => {
  try {
    const programId = url.searchParams.get('program_id');
    
    const db = await getSurrealDB();
    
    let query = `
      SELECT 
        id,
        name,
        slug,
        description,
        \`order\`,
        is_active,
        created_at,
        official_program
      FROM chapter
    `;
    
    if (programId) {
      const cleanProgramId = programId.includes(':') ? programId.split(':')[1] : programId;
      query += ` WHERE official_program = type::thing("official_program", "${cleanProgramId}")`;
    }
    
    query += ` ORDER BY \`order\` ASC`;
    
    const [chapters] = await db.query<[any[]]>(query);

    return json({ chapters: chapters || [] });
  } catch (error) {
    console.error('Erreur récupération chapitres:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un chapitre
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { program_id, name, slug, description, order, is_active } = data;

    if (!program_id || !name) {
      return json({ error: 'Programme et nom requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanProgramId = program_id.includes(':') ? program_id.split(':')[1] : program_id;

    // Vérifier que le programme existe
    const [programCheck] = await db.query<[any[]]>(
      `SELECT id FROM type::thing("official_program", $id)`,
      { id: cleanProgramId }
    );

    if (!programCheck || programCheck.length === 0) {
      return json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    // Générer le slug si non fourni
    const finalSlug = slug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Créer le chapitre
    const [created] = await db.query<[any[]]>(`
      CREATE chapter SET
        name = $name,
        slug = $slug,
        description = $description,
        official_program = type::thing("official_program", $programId),
        \`order\` = $order,
        is_active = $is_active,
        created_at = time::now()
    `, {
      name,
      slug: finalSlug,
      description: description || null,
      programId: cleanProgramId,
      order: order || 1,
      is_active: is_active ?? true
    });

    return json({ success: true, chapter: created?.[0] });
  } catch (error) {
    console.error('Erreur création chapitre:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier un chapitre
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, name, slug, description, order, is_active } = data;

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Construire la requête de mise à jour dynamiquement
    const updates: string[] = [];
    const params: Record<string, any> = { cleanId };

    if (name !== undefined) {
      updates.push('name = $name');
      params.name = name;
    }
    if (slug !== undefined) {
      updates.push('slug = $slug');
      params.slug = slug;
    }
    if (description !== undefined) {
      if (description === null || description === '') {
        updates.push('description = NONE');
      } else {
        updates.push('description = $description');
        params.description = description;
      }
    }
    if (order !== undefined) {
      updates.push('`order` = $order');
      params.order = order;
    }
    if (is_active !== undefined) {
      updates.push('is_active = $is_active');
      params.is_active = is_active;
    }

    updates.push('updated_at = time::now()');

    const [updated] = await db.query<[any[]]>(
      `UPDATE type::thing("chapter", $cleanId) SET ${updates.join(', ')}`,
      params
    );

    return json({ success: true, chapter: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification chapitre:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un chapitre
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Dissocier les quiz liés (ne pas supprimer, juste retirer le chapitre)
    await db.query(`UPDATE quiz SET chapter = NONE WHERE chapter = type::thing("chapter", $cleanId)`, { cleanId });

    // Dissocier les questions liées
    await db.query(`UPDATE question SET chapter = NONE WHERE chapter = type::thing("chapter", $cleanId)`, { cleanId });

    // Supprimer le chapitre
    await db.query(`DELETE type::thing("chapter", $cleanId)`, { cleanId });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression chapitre:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
