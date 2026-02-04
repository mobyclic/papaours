import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const [result] = await db.query(`
      SELECT 
        id, code, name, icon, color, context, \`order\`, is_active,
        (SELECT count() FROM specialty WHERE group = $parent.id) as specialty_count
      FROM specialty_group:$id
    `, { id: params.id }) as [any[]];
    
    if (!result?.[0]) {
      return json({ message: 'Groupe non trouvé' }, { status: 404 });
    }
    
    return json({ group: result[0] });
  } catch (error) {
    console.error('Error fetching specialty group:', error);
    return json({ error: 'Failed to fetch specialty group' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { name, icon, color, context, is_active } = data;
    
    if (!name) {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    const id = `specialty_group:${params.id}`;
    
    const [updated] = await db.query(`
      UPDATE $id SET
        name = $name,
        icon = $icon,
        color = $color,
        context = $context,
        is_active = $is_active
      RETURN AFTER
    `, {
      id,
      name: name.trim(),
      icon: icon || '📚',
      color: color || 'gray',
      context: context || 'all',
      is_active: is_active !== false
    }) as [any[]];
    
    return json({ 
      success: true, 
      group: updated?.[0] 
    });
  } catch (error) {
    console.error('Error updating specialty group:', error);
    return json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const id = `specialty_group:${params.id}`;
    
    // Vérifier s'il y a des spécialités liées
    const [specialties] = await db.query(`
      SELECT count() as count FROM specialty WHERE group = $id GROUP ALL
    `, { id }) as [any[]];
    
    if (specialties?.[0]?.count > 0) {
      return json({ 
        message: `Impossible de supprimer ce pôle : ${specialties[0].count} spécialité(s) sont liées` 
      }, { status: 400 });
    }
    
    await db.query(`DELETE $id`, { id });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting specialty group:', error);
    return json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
};
