import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer un domaine
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    
    const result = await db.query(
      'SELECT * FROM type::thing("domain", $id)',
      { id }
    );
    
    const domain = (result[0] as any[])?.[0];
    
    if (!domain) {
      return json({ message: 'Domaine non trouvé' }, { status: 404 });
    }
    
    return json({ domain });
  } catch (error) {
    console.error('Get domain error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour un domaine
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    const data = await request.json();
    
    const { name, description, icon, color, is_active } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    const updated = await db.query(`
      UPDATE type::thing("domain", $id) SET
        name = $name,
        description = $description,
        icon = $icon,
        color = $color,
        is_active = $is_active
    `, {
      id,
      name: name.trim(),
      description: description || null,
      icon: icon || null,
      color: color || '#6366F1',
      is_active: is_active !== false
    });
    
    const domain = (updated[0] as any[])?.[0];
    
    if (!domain) {
      return json({ message: 'Domaine non trouvé' }, { status: 404 });
    }
    
    return json({ domain, message: 'Domaine mis à jour' });
  } catch (error) {
    console.error('Update domain error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un domaine
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    
    // Vérifier s'il y a des subjects liés
    const subjects = await db.query(
      'SELECT count() as count FROM subject WHERE domain = type::thing("domain", $id) GROUP ALL',
      { id }
    );
    
    const subjectCount = (subjects[0] as any[])?.[0]?.count || 0;
    
    if (subjectCount > 0) {
      return json({ 
        message: `Impossible de supprimer : ${subjectCount} matière(s) liée(s)` 
      }, { status: 400 });
    }
    
    await db.query(
      'DELETE type::thing("domain", $id)',
      { id }
    );
    
    return json({ message: 'Domaine supprimé' });
  } catch (error) {
    console.error('Delete domain error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
