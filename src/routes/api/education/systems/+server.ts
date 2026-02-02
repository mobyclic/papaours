import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  const db = await getSurrealDB();
  
  try {
    const [systems] = await db.query(`
      SELECT id, code, name, flag 
      FROM education_system 
      WHERE is_active = true 
      ORDER BY name
    `);
    
    return json(systems || []);
  } catch (error) {
    console.error('Failed to fetch education systems:', error);
    return json([], { status: 500 });
  }
};
