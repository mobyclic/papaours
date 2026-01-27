import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query<any[]>('SELECT * FROM matiere ORDER BY name ASC');
    const matieres = (result[0] as any[]) || [];
    
    return json(matieres);
  } catch (error) {
    console.error('Get matieres error:', error);
    return json({ error: 'Failed to fetch matieres' }, { status: 500 });
  }
};
