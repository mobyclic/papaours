import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste toutes les classes avec leur catégorie
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query('SELECT *, category_id.* as category FROM classe ORDER BY pos ASC');
    const classes = (result[0] || []) as any[];
    
    return json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer une nouvelle classe
export const POST: RequestHandler = async ({ request }) => {
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
    
    // Vérifier si le slug existe déjà
    const existing = await db.query(
      'SELECT id FROM classe WHERE slug = $slug',
      { slug: finalSlug }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Une classe avec ce slug existe déjà' }, { status: 400 });
    }
    
    // Créer la classe
    const created = await db.query(`
      CREATE classe SET
        name = $name,
        slug = $slug,
        category_id = type::thing("class_category", $category_id),
        pos = $pos,
        is_active = $is_active
    `, {
      name: name.trim(),
      slug: finalSlug,
      category_id: category_id,
      pos: pos ?? 0,
      is_active: is_active !== false
    });
    
    const classe = (created[0] as any[])?.[0];
    
    return json({ classe, message: 'Classe créée avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
