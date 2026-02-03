import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste tous les grades avec leur cycle
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query('SELECT *, cycle.* as cycle_data FROM grade ORDER BY order ASC');
    const grades = (result[0] || []) as any[];
    
    return json({ grades });
  } catch (error) {
    console.error('Get grades error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un nouveau grade
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, code, cycle_id, order, is_active } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Générer le code si non fourni
    const finalCode = code || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le code existe déjà
    const existing = await db.query(
      'SELECT id FROM grade WHERE code = $code',
      { code: finalCode }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un niveau avec ce code existe déjà' }, { status: 400 });
    }
    
    // Créer le grade
    const created = await db.query(`
      CREATE grade SET
        name = $name,
        code = $code,
        cycle = type::thing("cycle", $cycle_id),
        \`order\` = $order,
        is_active = $is_active
    `, {
      name: name.trim(),
      code: finalCode,
      cycle_id: cycle_id,
      order: order ?? 0,
      is_active: is_active !== false
    });
    
    const grade = (created[0] as any[])?.[0];
    
    return json({ grade, message: 'Niveau créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create grade error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
