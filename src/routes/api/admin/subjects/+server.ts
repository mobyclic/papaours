import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';
import { RecordId } from 'surrealdb';

// Helper to serialize RecordId
function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

// GET - Liste toutes les matières
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query(`
      SELECT * FROM subject ORDER BY pos ASC, name ASC
    `);
    
    const subjects = serialize(result[0] || []);
    
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
    
    // Générer le code (slug)
    const code = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
    
    // Vérifier si le code existe déjà
    const existing = await db.query(
      'SELECT id FROM subject WHERE code = $code',
      { code }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Une matière avec ce nom existe déjà' }, { status: 400 });
    }
    
    // Obtenir le prochain ordre
    const maxPos = await db.query('SELECT math::max(pos) as max_pos FROM subject');
    const nextPos = ((maxPos[0] as any[])?.[0]?.max_pos || 0) + 1;
    
    // Créer la matière
    const created = await db.query(`
      CREATE subject SET
        name = $name,
        code = $code,
        slug = $code,
        description = $description,
        icon = $icon,
        color = $color,
        pos = $pos,
        is_active = true
    `, {
      name: name.trim(),
      code,
      description: description || null,
      icon: icon || null,
      color: color || '#6366F1',
      pos: nextPos
    });
    
    const subject = serialize((created[0] as any[])?.[0]);
    
    return json({ subject, message: 'Matière créée avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create subject error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PATCH - Réordonner les matières
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { orders } = data; // Array of { id: string, pos: number }
    
    if (!Array.isArray(orders)) {
      return json({ message: 'Format invalide: orders doit être un tableau' }, { status: 400 });
    }
    
    // Mettre à jour chaque position
    for (const item of orders) {
      const cleanId = item.id?.includes(':') ? item.id.split(':')[1] : item.id;
      await db.query(
        `UPDATE subject:${cleanId} SET pos = $pos`,
        { pos: item.pos }
      );
    }
    
    // Récupérer la liste mise à jour
    const result = await db.query(`
      SELECT * FROM subject ORDER BY pos ASC, name ASC
    `);
    
    const subjects = serialize(result[0] || []);
    
    return json({ subjects, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Reorder subjects error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
