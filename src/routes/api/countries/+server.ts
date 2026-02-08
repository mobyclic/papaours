import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  const db = await getSurrealDB();
  
  try {
    const [countries] = await db.query(`
      SELECT id, code, name, native_name, flag, default_language, slug 
      FROM country 
      WHERE is_active = true 
      ORDER BY name
    `);
    
    return json(countries || []);
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return json([], { status: 500 });
  }
};
