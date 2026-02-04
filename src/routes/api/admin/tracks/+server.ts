import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const db = await getSurrealDB();
  
  try {
    const systemFilter = url.searchParams.get('system');
    const cycleFilter = url.searchParams.get('cycle');
    
    let query = `
      SELECT 
        id, code, name, description, \`order\`, is_active,
        cycle.id as cycle_id,
        cycle.name as cycle_name,
        cycle.system.name as system_name,
        cycle.system.flag as system_flag,
        cycle.system.code as system_code,
        cycle.\`order\` as cycle_order,
        (SELECT count() FROM specialty WHERE track = $parent.id) as specialty_count,
        (SELECT count() FROM grade WHERE track = $parent.id) as grade_count
      FROM track
    `;
    
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    
    if (systemFilter && systemFilter !== 'all') {
      conditions.push('cycle.system.code = $system');
      params.system = systemFilter;
    }
    
    if (cycleFilter && cycleFilter !== 'all') {
      conditions.push('cycle.code = $cycle');
      params.cycle = cycleFilter;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY system_code ASC, cycle_order ASC, `order` ASC';
    
    const tracks = await db.query<any[]>(query, params);
    
    // Récupérer les cycles pour le select
    const cycles = await db.query<any[]>(`
      SELECT id, code, name, system.name as system_name, system.flag as system_flag, system.code as system_code, \`order\` as cycle_order
      FROM cycle
      WHERE is_active = true
      ORDER BY system_code ASC, cycle_order ASC
    `);
    
    // Récupérer les systèmes pour le filtre
    const systems = await db.query<any[]>(`
      SELECT code, name, flag
      FROM education_system
      ORDER BY name ASC
    `);
    
    return json({
      tracks: tracks[0] || [],
      cycles: cycles[0] || [],
      educationSystems: systems[0] || []
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { code, name, description, cycle } = data;
    
    if (!code || !name || !cycle) {
      return json({ message: 'Code, nom et cycle sont requis' }, { status: 400 });
    }
    
    // Vérifier unicité du code
    const existing = await db.query<any[]>(`SELECT id FROM track WHERE code = $code`, { code });
    if (existing[0]?.length > 0) {
      return json({ message: 'Ce code existe déjà' }, { status: 400 });
    }
    
    // Trouver le max order pour ce cycle
    const maxOrderResult = await db.query<any[]>(
      `SELECT math::max(\`order\`) as max_order FROM track WHERE cycle = type::thing("cycle", $cycle)`,
      { cycle }
    );
    const maxOrder = maxOrderResult[0]?.[0]?.max_order ?? -1;
    
    const newTrack = await db.query<any[]>(`
      CREATE track CONTENT {
        code: $code,
        name: $name,
        description: $description,
        cycle: type::thing("cycle", $cycle),
        \`order\`: $order,
        is_active: true
      }
    `, { 
      code: code.toLowerCase(), 
      name, 
      description: description || null,
      cycle,
      order: maxOrder + 1
    });
    
    return json({ track: newTrack[0]?.[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating track:', error);
    return json({ message: 'Erreur lors de la création' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const { tracks } = await request.json();
    
    if (!Array.isArray(tracks)) {
      return json({ message: 'Format invalide' }, { status: 400 });
    }
    
    // Mettre à jour l'ordre
    for (let i = 0; i < tracks.length; i++) {
      const id = tracks[i].includes(':') ? tracks[i].split(':')[1] : tracks[i];
      await db.query(`UPDATE track SET \`order\` = $order WHERE id = type::thing("track", $id)`, {
        id,
        order: i
      });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating track order:', error);
    return json({ message: 'Erreur lors de la mise à jour de l\'ordre' }, { status: 500 });
  }
};
