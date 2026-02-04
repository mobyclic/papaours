import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const trackId = url.searchParams.get('track');
  const cycleId = url.searchParams.get('cycle');
  const includeGroups = url.searchParams.get('includeGroups') === 'true';
  
  if (!trackId && !cycleId) {
    return json({ error: 'Missing track or cycle parameter' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    let specialties: any[] = [];
    let groups: any[] = [];
    
    if (trackId) {
      // Get specialties for specific track
      const cleanTrackId = trackId.includes(':') ? trackId.split(':')[1] : trackId;
      
      const [results] = await db.query(`
        SELECT id, code, name, \`order\`, is_mandatory, 
               group.id as group_id, 
               group.name as group_name,
               group.icon as group_icon,
               group.color as group_color,
               group.order as group_order
        FROM specialty 
        WHERE track = type::thing("track", $trackId)
        ORDER BY group.order, \`order\`
      `, { trackId: cleanTrackId }) as [any[]];
      
      specialties = results || [];
      
      // Get groups for this track's context
      if (includeGroups) {
        const [groupResults] = await db.query(`
          SELECT id, code, name, icon, color, \`order\`, context
          FROM specialty_group
          WHERE is_active = true
          ORDER BY \`order\`
        `) as [any[]];
        groups = groupResults || [];
      }
    } else if (cycleId) {
      // Get all specialties for all tracks in this cycle
      const cleanCycleId = cycleId.includes(':') ? cycleId.split(':')[1] : cycleId;
      
      const [results] = await db.query(`
        SELECT id, code, name, \`order\`, is_mandatory, 
               track.name as track_name,
               group.id as group_id,
               group.name as group_name,
               group.icon as group_icon,
               group.color as group_color,
               group.order as group_order
        FROM specialty 
        WHERE track.cycle = type::thing("cycle", $cycleId)
        ORDER BY group.order, track_name, \`order\`
      `, { cycleId: cleanCycleId }) as [any[]];
      
      specialties = results || [];
      
      // Get all groups
      if (includeGroups) {
        const [groupResults] = await db.query(`
          SELECT id, code, name, icon, color, \`order\`, context
          FROM specialty_group
          WHERE is_active = true
          ORDER BY \`order\`
        `) as [any[]];
        groups = groupResults || [];
      }
    }
    
    // Return with or without groups based on parameter
    if (includeGroups) {
      return json({ specialties, groups });
    }
    
    return json(specialties);
  } catch (error) {
    console.error('Failed to fetch specialties:', error);
    return json(includeGroups ? { specialties: [], groups: [] } : [], { status: 500 });
  }
};
