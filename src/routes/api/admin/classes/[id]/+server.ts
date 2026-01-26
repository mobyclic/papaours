import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Obtenir une classe par ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    const result = await db.query(
      'SELECT * FROM classe WHERE id = $id',
      { id: `classe:${params.id}` }
    );
    
    const classe = (result[0] as any[])?.[0];
    
    if (!classe) {
      return json({ message: 'Classe non trouvée' }, { status: 404 });
    }
    
    return json({ classe });
  } catch (error) {
    console.error('Get class error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour une classe
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, slug, category_id, pos, is_active } = data;
    
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
    
    // Vérifier si le slug existe déjà pour une autre classe
    const existing = await db.query(
      'SELECT id FROM classe WHERE slug = $slug AND id != $id',
      { slug: finalSlug, id: `classe:${params.id}` }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Une classe avec ce slug existe déjà' }, { status: 400 });
    }
    
    // Mettre à jour
    const updated = await db.query(`
      UPDATE classe:${params.id} SET
        name = $name,
        slug = $slug,
        category_id = type::thing("class_category", $category_id),
        pos = $pos,
        is_active = $is_active
      RETURN AFTER
    `, {
      name: name.trim(),
      slug: finalSlug,
      category_id: category_id,
      pos: pos ?? 0,
      is_active: is_active !== false
    });
    
    const classe = (updated[0] as any[])?.[0];
    
    if (!classe) {
      return json({ message: 'Classe non trouvée' }, { status: 404 });
    }
    
    return json({ classe, message: 'Classe mise à jour avec succès' });
  } catch (error) {
    console.error('Update class error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer une classe
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    // Vérifier si des questions utilisent cette classe
    const questionsCount = await db.query(
      'SELECT count() as count FROM question WHERE classe_id = $id GROUP ALL',
      { id: `classe:${params.id}` }
    );
    
    const count = (questionsCount[0] as any[])?.[0]?.count || 0;
    
    if (count > 0) {
      return json({ 
        message: `Impossible de supprimer : ${count} question(s) utilisent cette classe` 
      }, { status: 400 });
    }
    
    // Supprimer
    await db.query(`DELETE classe:${params.id}`);
    
    return json({ message: 'Classe supprimée avec succès' });
  } catch (error) {
    console.error('Delete class error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
