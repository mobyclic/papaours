import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const cycleId = url.searchParams.get('cycle');
  const trackId = url.searchParams.get('track');
  
  if (!cycleId) {
    return json({ error: 'Missing cycle parameter' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    const cleanCycleId = cycleId.includes(':') ? cycleId.split(':')[1] : cycleId;
    
    let query: string;
    let params: Record<string, string>;
    
    if (trackId) {
      // Si une filière est spécifiée, filtrer par filière
      const cleanTrackId = trackId.includes(':') ? trackId.split(':')[1] : trackId;
      query = `
        SELECT id, code, name, order, difficulty_level 
        FROM grade 
        WHERE cycle = type::thing("cycle", $cycleId) 
          AND track = type::thing("track", $trackId)
          AND is_active = true 
        ORDER BY order
      `;
      params = { cycleId: cleanCycleId, trackId: cleanTrackId };
    } else {
      // Sinon, retourner les classes sans filière OU toutes si pas de filières dans ce cycle
      query = `
        SELECT id, code, name, order, difficulty_level 
        FROM grade 
        WHERE cycle = type::thing("cycle", $cycleId) 
          AND (track IS NONE OR track IS NULL)
          AND is_active = true 
        ORDER BY order
      `;
      params = { cycleId: cleanCycleId };
    }
    
    const [grades] = await db.query(query, params);
    
    return json(grades || []);
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return json([], { status: 500 });
  }
};
