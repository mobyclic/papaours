import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste tous les niveaux de difficulté
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query('SELECT * FROM niveau ORDER BY pos ASC');
    const levels = (result[0] || []) as any[];
    
    return json({ levels });
  } catch (error) {
    console.error('Get levels error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un nouveau niveau
export const POST: RequestHandler = async ({ request }) => {
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
    
    // Vérifier si le slug existe déjà
    const existing = await db.query(
      'SELECT id FROM niveau WHERE slug = $slug',
      { slug: finalSlug }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un niveau avec ce slug existe déjà' }, { status: 400 });
    }
    
    // Créer le niveau
    const created = await db.query(`
      CREATE niveau SET
        name = $name,
        slug = $slug,
        pos = $pos,
        points_required = $points_required,
        icon = $icon,
        color = $color
    `, {
      name: name.trim(),
      slug: finalSlug,
      pos: pos ?? 0,
      points_required: points_required ?? 0,
      icon: icon || null,
      color: color || null
    });
    
    const level = (created[0] as any[])?.[0];
    
    return json({ level, message: 'Niveau créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create level error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
