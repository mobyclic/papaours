import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Récupérer un chapitre spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await getSurrealDB();
    const { id } = params;
    
    const [chapter] = await db.query<[any[]]>(`
      SELECT * FROM type::thing("chapter", $id)
    `, { id });

    if (!chapter || chapter.length === 0) {
      return json({ error: 'Chapitre non trouvé' }, { status: 404 });
    }

    return json({ chapter: chapter[0] });
  } catch (error) {
    console.error('Erreur récupération chapitre:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier un chapitre
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await getSurrealDB();
    const { id } = params;
    const data = await request.json();
    const { title, name, description, order } = data;

    // Supporter title ou name
    const chapterTitle = title || name;

    if (!chapterTitle) {
      return json({ error: 'Titre requis' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateParams: Record<string, any> = { id };

    updateFields.push('title = $title');
    updateParams.title = chapterTitle;

    // Aussi mettre à jour name pour compatibilité
    updateFields.push('name = $title');

    if (description !== undefined) {
      if (description === null || description === '') {
        updateFields.push('description = NONE');
      } else {
        updateFields.push('description = $description');
        updateParams.description = description;
      }
    }

    if (order !== undefined) {
      updateFields.push('`order` = $order');
      updateParams.order = order;
    }

    updateFields.push('updated_at = time::now()');

    const [updated] = await db.query<[any[]]>(`
      UPDATE type::thing("chapter", $id) SET ${updateFields.join(', ')}
    `, updateParams);

    return json({ success: true, chapter: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification chapitre:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un chapitre
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await getSurrealDB();
    const { id } = params;

    await db.query(`
      DELETE type::thing("chapter", $id)
    `, { id });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression chapitre:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
