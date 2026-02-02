import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Liste des badges
export const GET: RequestHandler = async () => {
  try {
    const db = await getSurrealDB();
    
    const [badges] = await db.query<[any[]]>(`
      SELECT * FROM badge ORDER BY category ASC, points ASC
    `);

    return json({ badges: badges || [] });
  } catch (error) {
    console.error('Erreur récupération badges:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un badge
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, slug, description, icon, category, condition_type, condition_value, points, is_active } = data;

    if (!name || !slug) {
      return json({ error: 'Nom et slug requis' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Vérifier si le slug existe déjà
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM badge WHERE slug = $slug
    `, { slug });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Créer le badge
    const [created] = await db.query<[any[]]>(`
      CREATE badge SET
        name = $name,
        slug = $slug,
        description = $description,
        icon = $icon,
        category = $category,
        condition_type = $condition_type,
        condition_value = $condition_value,
        points = $points,
        is_active = $is_active,
        created_at = time::now()
    `, {
      name,
      slug,
      description: description || null,
      icon: icon || '🏆',
      category: category || 'progress',
      condition_type: condition_type || 'quiz_count',
      condition_value: condition_value || 1,
      points: points || 10,
      is_active: is_active ?? true
    });

    return json({ success: true, badge: created?.[0] });
  } catch (error) {
    console.error('Erreur création badge:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier un badge
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, name, slug, description, icon, category, condition_type, condition_value, points, is_active } = data;

    if (!id || !name || !slug) {
      return json({ error: 'ID, nom et slug requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Vérifier si le slug existe déjà pour un autre badge
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM badge WHERE slug = $slug AND id != type::thing("badge", $cleanId)
    `, { slug, cleanId });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Mettre à jour
    const [updated] = await db.query<[any[]]>(`
      UPDATE type::thing("badge", $cleanId) SET
        name = $name,
        slug = $slug,
        description = $description,
        icon = $icon,
        category = $category,
        condition_type = $condition_type,
        condition_value = $condition_value,
        points = $points,
        is_active = $is_active,
        updated_at = time::now()
    `, {
      cleanId,
      name,
      slug,
      description: description || null,
      icon: icon || '🏆',
      category: category || 'progress',
      condition_type: condition_type || 'quiz_count',
      condition_value: condition_value || 1,
      points: points || 10,
      is_active: is_active ?? true
    });

    return json({ success: true, badge: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification badge:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un badge
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Supprimer les user_badge liés
    await db.query(`DELETE user_badge WHERE badge = type::thing("badge", $cleanId)`, { cleanId });

    // Supprimer le badge
    await db.query(`DELETE type::thing("badge", $cleanId)`, { cleanId });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression badge:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
