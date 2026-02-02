import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Liste des cycles
export const GET: RequestHandler = async () => {
  try {
    const db = await getSurrealDB();
    
    const [cycles] = await db.query<[any[]]>(`
      SELECT * FROM cycle ORDER BY order ASC
    `);

    return json({ cycles: cycles || [] });
  } catch (error) {
    console.error('Erreur récupération cycles:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un cycle
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, slug, description, order, is_active } = data;

    if (!name || !slug) {
      return json({ error: 'Nom et slug requis' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Vérifier si le slug existe déjà
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM cycle WHERE slug = $slug
    `, { slug });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Créer le cycle
    const [created] = await db.query<[any[]]>(`
      CREATE cycle SET
        name = $name,
        slug = $slug,
        description = $description,
        order = $order,
        is_active = $is_active,
        created_at = time::now()
    `, {
      name,
      slug,
      description: description || null,
      order: order || 0,
      is_active: is_active ?? true
    });

    return json({ success: true, cycle: created?.[0] });
  } catch (error) {
    console.error('Erreur création cycle:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier un cycle
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, name, slug, description, order, is_active } = data;

    if (!id || !name || !slug) {
      return json({ error: 'ID, nom et slug requis' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Extraire l'ID propre
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Vérifier si le slug existe déjà pour un autre cycle
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM cycle WHERE slug = $slug AND id != type::thing("cycle", $cleanId)
    `, { slug, cleanId });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Mettre à jour
    const [updated] = await db.query<[any[]]>(`
      UPDATE type::thing("cycle", $cleanId) SET
        name = $name,
        slug = $slug,
        description = $description,
        order = $order,
        is_active = $is_active,
        updated_at = time::now()
    `, {
      cleanId,
      name,
      slug,
      description: description || null,
      order: order || 0,
      is_active: is_active ?? true
    });

    return json({ success: true, cycle: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification cycle:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un cycle
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Vérifier s'il y a des classes liées
    const [grades] = await db.query<[any[]]>(`
      SELECT id FROM grade WHERE cycle = type::thing("cycle", $cleanId)
    `, { cleanId });

    if (grades && grades.length > 0) {
      return json({ error: 'Impossible de supprimer : des classes sont liées à ce cycle' }, { status: 400 });
    }

    // Supprimer
    await db.query(`DELETE type::thing("cycle", $cleanId)`, { cleanId });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression cycle:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
