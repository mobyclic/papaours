import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Obtenir une matière par ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    const result = await db.query(
      'SELECT * FROM matiere WHERE id = $id',
      { id: `matiere:${params.id}` }
    );
    
    const subject = (result[0] as any[])?.[0];
    
    if (!subject) {
      return json({ message: 'Matière non trouvée' }, { status: 404 });
    }
    
    return json({ subject });
  } catch (error) {
    console.error('Get subject error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour une matière
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, description, icon, color, is_active, order } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Générer le nouveau slug si le nom change
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le slug existe déjà pour une autre matière
    const existing = await db.query(
      'SELECT id FROM matiere WHERE slug = $slug AND id != $id',
      { slug, id: `matiere:${params.id}` }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Une matière avec ce nom existe déjà' }, { status: 400 });
    }
    
    // Mettre à jour
    const updated = await db.query(`
      UPDATE matiere:${params.id} SET
        name = $name,
        slug = $slug,
        description = $description,
        icon = $icon,
        color = $color,
        is_active = $is_active,
        order = $order,
        updated_at = time::now()
      RETURN AFTER
    `, {
      name: name.trim(),
      slug,
      description: description || null,
      icon: icon || null,
      color: color || '#6366F1',
      is_active: is_active !== false,
      order: order || 0
    });
    
    const subject = (updated[0] as any[])?.[0];
    
    if (!subject) {
      return json({ message: 'Matière non trouvée' }, { status: 404 });
    }
    
    return json({ subject, message: 'Matière mise à jour avec succès' });
  } catch (error) {
    console.error('Update subject error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer une matière
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    // Vérifier si des thèmes utilisent cette matière
    const themesCount = await db.query(
      'SELECT count() as count FROM theme WHERE matiere_id = $id GROUP ALL',
      { id: `matiere:${params.id}` }
    );
    
    const count = (themesCount[0] as any[])?.[0]?.count || 0;
    
    if (count > 0) {
      return json({ 
        message: `Impossible de supprimer : ${count} thème(s) utilisent cette matière` 
      }, { status: 400 });
    }
    
    // Supprimer
    await db.query(`DELETE matiere:${params.id}`);
    
    return json({ message: 'Matière supprimée avec succès' });
  } catch (error) {
    console.error('Delete subject error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
