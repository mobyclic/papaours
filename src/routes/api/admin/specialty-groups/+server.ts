import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  const db = await getSurrealDB();
  
  try {
    const [groups] = await db.query(`
      SELECT 
        id, code, name, icon, color, context, \`order\`, is_active,
        (SELECT count() FROM specialty WHERE group = $parent.id) as specialty_count
      FROM specialty_group
      ORDER BY \`order\` ASC
    `) as [any[]];
    
    return json({
      groups: groups || []
    });
  } catch (error) {
    console.error('Error fetching specialty groups:', error);
    return json({ error: 'Failed to fetch specialty groups' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { code, name, icon, color, context } = data;
    
    if (!code || !name) {
      return json({ message: 'Code et nom sont requis' }, { status: 400 });
    }
    
    // Vérifier unicité du code
    const [existing] = await db.query(`SELECT id FROM specialty_group WHERE code = $code`, { code }) as [any[]];
    if (existing?.length > 0) {
      return json({ message: 'Ce code existe déjà' }, { status: 400 });
    }
    
    // Trouver le max order
    const [maxOrderResult] = await db.query(`
      SELECT math::max(\`order\`) as max_order FROM specialty_group
    `) as [any[]];
    const maxOrder = maxOrderResult?.[0]?.max_order ?? -1;
    
    const [newGroup] = await db.query(`
      CREATE specialty_group CONTENT {
        code: $code,
        name: $name,
        icon: $icon,
        color: $color,
        context: $context,
        \`order\`: $order,
        is_active: true,
        created_at: time::now()
      }
    `, { 
      code: code.toLowerCase().trim(),
      name: name.trim(),
      icon: icon || '📚',
      color: color || 'gray',
      context: context || 'all',
      order: maxOrder + 1
    }) as [any[]];
    
    return json({ 
      success: true, 
      group: newGroup?.[0] 
    });
  } catch (error) {
    console.error('Error creating specialty group:', error);
    return json({ message: 'Erreur lors de la création' }, { status: 500 });
  }
};

// Réordonner les groupes
export const PUT: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const { groups: orderedIds } = await request.json();
    
    if (!Array.isArray(orderedIds)) {
      return json({ message: 'Liste de groupes requise' }, { status: 400 });
    }
    
    // Mettre à jour l'ordre
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i].includes(':') ? orderedIds[i] : `specialty_group:${orderedIds[i]}`;
      await db.query(`UPDATE $id SET \`order\` = $order`, { id, order: i });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error reordering groups:', error);
    return json({ message: 'Erreur lors de la réorganisation' }, { status: 500 });
  }
};
