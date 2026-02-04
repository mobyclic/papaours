import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const cycleId = url.searchParams.get('cycle');
  
  if (!cycleId) {
    return json({ error: 'Missing cycle parameter' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    const cleanId = cycleId.includes(':') ? cycleId.split(':')[1] : cycleId;
    
    const [tracks] = await db.query(`
      SELECT id, code, name, order 
      FROM track 
      WHERE cycle = type::thing("cycle", $cycleId) 
        AND is_active = true 
      ORDER BY \`order\`
    `, { cycleId: cleanId });
    
    return json(tracks || []);
  } catch (error) {
    console.error('Failed to fetch tracks:', error);
    return json([], { status: 500 });
  }
};
