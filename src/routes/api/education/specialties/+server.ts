import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const trackId = url.searchParams.get('track');
  
  if (!trackId) {
    return json({ error: 'Missing track parameter' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    const cleanId = trackId.includes(':') ? trackId.split(':')[1] : trackId;
    
    const [specialties] = await db.query(`
      SELECT id, code, name, order 
      FROM specialty 
      WHERE track = type::thing("track", $trackId)
      ORDER BY order
    `, { trackId: cleanId });
    
    return json(specialties || []);
  } catch (error) {
    console.error('Failed to fetch specialties:', error);
    return json([], { status: 500 });
  }
};
