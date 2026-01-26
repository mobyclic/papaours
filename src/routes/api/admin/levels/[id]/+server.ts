import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Obtenir un niveau par ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    const result = await db.query(
      'SELECT * FROM niveau WHERE id = $id',
      { id: `niveau:${params.id}` }
    );
    
    const level = (result[0] as any[])?.[0];
    
    if (!level) {
      return json({ message: 'Niveau non trouvé' }, { status: 404 });
    }
    
    return json({ level });
  } catch (error) {
    console.error('Get level error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour un niveau
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, slug, pos, points_required, icon, color } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Générer le slug si non fourni
    const finalSlug = slug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le slug existe déjà pour un autre niveau
    const existing = await db.query(
      'SELECT id FROM niveau WHERE slug = $slug AND id != $id',
      { slug: finalSlug, id: `niveau:${params.id}` }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un niveau avec ce slug existe déjà' }, { status: 400 });
    }
    
    // Mettre à jour
    const updated = await db.query(`
      UPDATE niveau:${params.id} SET
        name = $name,
        slug = $slug,
        pos = $pos,
        points_required = $points_required,
        icon = $icon,
        color = $color
      RETURN AFTER
    `, {
      name: name.trim(),
      slug: finalSlug,
      pos: pos ?? 0,
      points_required: points_required ?? 0,
      icon: icon || null,
      color: color || null
    });
    
    const level = (updated[0] as any[])?.[0];
    
    if (!level) {
      return json({ message: 'Niveau non trouvé' }, { status: 404 });
    }
    
    return json({ level, message: 'Niveau mis à jour avec succès' });
  } catch (error) {
    console.error('Update level error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un niveau
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    // Vérifier si des utilisateurs ont ce niveau
    const usersCount = await db.query(
      'SELECT count() as count FROM user_progress WHERE niveau_id = $id GROUP ALL',
      { id: `niveau:${params.id}` }
    );
    
    const count = (usersCount[0] as any[])?.[0]?.count || 0;
    
    if (count > 0) {
      return json({ 
        message: `Impossible de supprimer : ${count} utilisateur(s) ont ce niveau` 
      }, { status: 400 });
    }
    
    // Supprimer
    await db.query(`DELETE niveau:${params.id}`);
    
    return json({ message: 'Niveau supprimé avec succès' });
  } catch (error) {
    console.error('Delete level error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
