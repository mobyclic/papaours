import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Liste des classes
export const GET: RequestHandler = async () => {
  try {
    const db = await getSurrealDB();
    
    const [grades] = await db.query<[any[]]>(`
      SELECT 
        *,
        cycle.name AS cycle_name,
        cycle.slug AS cycle_slug,
        cycle.\`order\` AS cycle_order
      FROM grade 
      ORDER BY cycle_order ASC, \`order\` ASC
    `);

    return json({ grades: grades || [] });
  } catch (error) {
    console.error('Erreur récupération classes:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer une classe
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, slug, description, cycle_slug, order, is_active } = data;

    if (!name || !slug || !cycle_slug) {
      return json({ error: 'Nom, slug et cycle requis' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Récupérer le cycle par slug
    const [cycleResult] = await db.query<[any[]]>(`
      SELECT id FROM cycle WHERE slug = $cycle_slug
    `, { cycle_slug });

    if (!cycleResult || cycleResult.length === 0) {
      return json({ error: 'Cycle non trouvé' }, { status: 400 });
    }

    // Vérifier si le slug existe déjà
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM grade WHERE slug = $slug
    `, { slug });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Créer la classe
    const cycleId = cycleResult[0].id.toString().replace('cycle:', '');
    const [created] = await db.query<[any[]]>(`
      CREATE grade SET
        name = $name,
        slug = $slug,
        description = $description,
        cycle = type::thing("cycle", $cycleId),
        order = $order,
        is_active = $is_active,
        created_at = time::now()
    `, {
      name,
      slug,
      description: description || null,
      cycleId,
      order: order || 0,
      is_active: is_active ?? true
    });

    return json({ success: true, grade: created?.[0] });
  } catch (error) {
    console.error('Erreur création classe:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier une classe
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, name, slug, description, cycle_slug, order, is_active } = data;

    if (!id || !name || !slug || !cycle_slug) {
      return json({ error: 'ID, nom, slug et cycle requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Récupérer le cycle par slug
    const [cycleResult] = await db.query<[any[]]>(`
      SELECT id FROM cycle WHERE slug = $cycle_slug
    `, { cycle_slug });

    if (!cycleResult || cycleResult.length === 0) {
      return json({ error: 'Cycle non trouvé' }, { status: 400 });
    }

    // Vérifier si le slug existe déjà pour une autre classe
    const [existing] = await db.query<[any[]]>(`
      SELECT id FROM grade WHERE slug = $slug AND id != type::thing("grade", $cleanId)
    `, { slug, cleanId });

    if (existing && existing.length > 0) {
      return json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Mettre à jour
    const cycleId = cycleResult[0].id.toString().replace('cycle:', '');
    const [updated] = await db.query<[any[]]>(`
      UPDATE type::thing("grade", $cleanId) SET
        name = $name,
        slug = $slug,
        description = $description,
        cycle = type::thing("cycle", $cycleId),
        order = $order,
        is_active = $is_active,
        updated_at = time::now()
    `, {
      cleanId,
      name,
      slug,
      description: description || null,
      cycleId,
      order: order || 0,
      is_active: is_active ?? true
    });

    return json({ success: true, grade: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification classe:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer une classe
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Vérifier s'il y a des utilisateurs ou programmes liés
    const [users] = await db.query<[any[]]>(`
      SELECT id FROM user WHERE current_grade = type::thing("grade", $cleanId) LIMIT 1
    `, { cleanId });

    if (users && users.length > 0) {
      return json({ error: 'Impossible de supprimer : des utilisateurs sont dans cette classe' }, { status: 400 });
    }

    // Supprimer
    await db.query(`DELETE type::thing("grade", $cleanId)`, { cleanId });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression classe:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
