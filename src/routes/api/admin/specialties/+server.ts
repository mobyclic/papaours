import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const db = await getSurrealDB();
  
  try {
    const trackFilter = url.searchParams.get('track');
    
    let query = `
      SELECT 
        id, code, name, description, \`order\`, is_active,
        track.id as track_id,
        track.code as track_code,
        track.name as track_name,
        track.cycle.name as cycle_name,
        track.cycle.system.name as system_name,
        track.cycle.system.flag as system_flag,
        track.cycle.system.code as system_code,
        track.cycle.\`order\` as cycle_order,
        track.\`order\` as track_order,
        (SELECT count() FROM official_program WHERE specialty = $parent.id) as program_count
      FROM specialty
    `;
    
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    
    if (trackFilter && trackFilter !== 'all') {
      conditions.push('track.code = $track');
      params.track = trackFilter;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY system_code ASC, cycle_order ASC, track_order ASC, `order` ASC';
    
    const specialties = await db.query<any[]>(query, params);
    
    // Récupérer les tracks pour le select
    const tracks = await db.query<any[]>(`
      SELECT id, code, name, 
        cycle.name as cycle_name, 
        cycle.system.flag as system_flag,
        cycle.system.name as system_name,
        cycle.system.code as system_code,
        cycle.\`order\` as cycle_order,
        \`order\` as track_order
      FROM track
      WHERE is_active = true
      ORDER BY system_code ASC, cycle_order ASC, track_order ASC
    `);
    
    return json({
      specialties: specialties[0] || [],
      tracks: tracks[0] || []
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    return json({ error: 'Failed to fetch specialties' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { code, name, description, track } = data;
    
    if (!code || !name || !track) {
      return json({ message: 'Code, nom et filière sont requis' }, { status: 400 });
    }
    
    // Vérifier unicité du code
    const existing = await db.query<any[]>(`SELECT id FROM specialty WHERE code = $code`, { code });
    if (existing[0]?.length > 0) {
      return json({ message: 'Ce code existe déjà' }, { status: 400 });
    }
    
    // Trouver le max order pour cette filière
    const maxOrderResult = await db.query<any[]>(
      `SELECT math::max(\`order\`) as max_order FROM specialty WHERE track = type::thing("track", $track)`,
      { track }
    );
    const maxOrder = maxOrderResult[0]?.[0]?.max_order ?? -1;
    
    const newSpecialty = await db.query<any[]>(`
      CREATE specialty CONTENT {
        code: $code,
        name: $name,
        description: $description,
        track: type::thing("track", $track),
        \`order\`: $order,
        is_active: true
      }
    `, { 
      code: code.toLowerCase(), 
      name, 
      description: description || null,
      track,
      order: maxOrder + 1
    });
    
    return json({ specialty: newSpecialty[0]?.[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating specialty:', error);
    return json({ message: 'Erreur lors de la création' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const { specialties } = await request.json();
    
    if (!Array.isArray(specialties)) {
      return json({ message: 'Format invalide' }, { status: 400 });
    }
    
    // Mettre à jour l'ordre
    for (let i = 0; i < specialties.length; i++) {
      const id = specialties[i].includes(':') ? specialties[i].split(':')[1] : specialties[i];
      await db.query(`UPDATE specialty SET \`order\` = $order WHERE id = type::thing("specialty", $id)`, {
        id,
        order: i
      });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating specialty order:', error);
    return json({ message: 'Erreur lors de la mise à jour de l\'ordre' }, { status: 500 });
  }
};
