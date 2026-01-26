import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste toutes les matières
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query(`
      SELECT * FROM matiere ORDER BY pos ASC, name ASC
    `);
    
    const subjects = result[0] || [];
    
    return json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer une nouvelle matière
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, description, icon, color } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Générer le slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le slug existe déjà
    const existing = await db.query(
      'SELECT id FROM matiere WHERE slug = $slug',
      { slug }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Une matière avec ce nom existe déjà' }, { status: 400 });
    }
    
    // Obtenir le prochain ordre
    const maxPos = await db.query('SELECT math::max(pos) as max_pos FROM matiere');
    const nextPos = ((maxPos[0] as any[])?.[0]?.max_pos || 0) + 1;
    
    // Créer la matière
    const created = await db.query(`
      CREATE matiere SET
        name = $name,
        slug = $slug,
        description = $description,
        icon = $icon,
        color = $color,
        pos = $pos,
        is_active = true
    `, {
      name: name.trim(),
      slug,
      description: description || null,
      icon: icon || null,
      color: color || '#6366F1',
      pos: nextPos
    });
    
    const subject = (created[0] as any[])?.[0];
    
    return json({ subject, message: 'Matière créée avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create subject error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
