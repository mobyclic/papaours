import { json } from '@sveltejs/kit';
import { getSurrealDB } from '$lib/server/db';
import type { RequestHandler } from './$types';

// GET - Liste tous les grades avec leur cycle
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await getSurrealDB();
    
    const systemFilter = url.searchParams.get('system');
    const cycleFilter = url.searchParams.get('cycle');
    const trackFilter = url.searchParams.get('track');
    
    let query = `
      SELECT 
        id, code, name, slug, short_name, \`order\` as grade_order, is_active,
        cycle.id as cycle_id,
        cycle.code as cycle_code,
        cycle.name as cycle_name,
        cycle.slug as cycle_slug,
        cycle.\`order\` as cycle_order,
        cycle.system.name as system_name,
        cycle.system.code as system_code,
        cycle.system.flag as system_flag,
        track.id as track_id,
        track.name as track_name
      FROM grade
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
    
    if (trackFilter && trackFilter !== 'all') {
      conditions.push('track.code = $track');
      params.track = trackFilter;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY system_code ASC, cycle_order ASC, grade_order ASC';
    
    const gradesResult = await db.query<any[]>(query, params);
    const rawGrades = gradesResult[0] || [];
    
    // Compter les programmes par grade_slug
    const programCounts = await db.query<any[]>(`
      SELECT grade_slug, count() as cnt
      FROM official_program
      GROUP BY grade_slug
    `);
    const countMap: Record<string, number> = {};
    for (const row of (programCounts[0] || [])) {
      if (row.grade_slug) {
        countMap[row.grade_slug] = row.cnt || 0;
      }
    }
    
    // Ajouter le program_count à chaque grade
    const grades = rawGrades.map((g: any) => ({
      ...g,
      id: g.id?.toString() || g.id,
      cycle_id: g.cycle_id?.toString() || g.cycle_id,
      track_id: g.track_id?.toString() || g.track_id,
      program_count: countMap[g.slug] || 0
    }));
    
    // Récupérer les cycles pour le select
    const cycles = await db.query<any[]>(`
      SELECT id, code, name, slug, system.name as system_name, system.flag as system_flag, system.code as system_code, \`order\` as cycle_order
      FROM cycle
      WHERE is_active = true
      ORDER BY system_code ASC, cycle_order ASC
    `);
    
    // Récupérer les tracks pour le select
    const tracks = await db.query<any[]>(`
      SELECT id, code, name, cycle.code as cycle_code, cycle.system.flag as system_flag, cycle.system.code as system_code, cycle.\`order\` as cycle_order, \`order\` as track_order
      FROM track
      WHERE is_active = true
      ORDER BY system_code ASC, cycle_order ASC, track_order ASC
    `);
    
    // Récupérer les systèmes pour le filtre
    const systems = await db.query<any[]>(`
      SELECT code, name, flag
      FROM education_system
      ORDER BY name ASC
    `);
    
    // Sérialiser les IDs
    const serializeCycles = (cycles[0] || []).map((c: any) => ({
      ...c,
      id: c.id?.toString() || c.id
    }));
    
    const serializeTracks = (tracks[0] || []).map((t: any) => ({
      ...t,
      id: t.id?.toString() || t.id
    }));
    
    return json({
      grades,
      cycles: serializeCycles,
      tracks: serializeTracks,
      educationSystems: systems[0] || []
    });
  } catch (error) {
    console.error('Get grades error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un nouveau grade
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = await getSurrealDB();
    const data = await request.json();
    
    const { name, code, short_name, cycle, track } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    if (!cycle) {
      return json({ message: 'Le cycle est requis' }, { status: 400 });
    }
    
    // Générer le code si non fourni
    const finalCode = code || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le code existe déjà
    const existing = await db.query(
      'SELECT id FROM grade WHERE code = $code',
      { code: finalCode }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un niveau avec ce code existe déjà' }, { status: 400 });
    }
    
    // Trouver le max order pour ce cycle
    const maxOrderResult = await db.query<any[]>(
      `SELECT math::max(\`order\`) as max_order FROM grade WHERE cycle = type::thing("cycle", $cycle)`,
      { cycle }
    );
    const maxOrder = maxOrderResult[0]?.[0]?.max_order ?? -1;
    
    // Créer le grade
    let createQuery = `
      CREATE grade CONTENT {
        name: $name,
        code: $code,
        short_name: $short_name,
        cycle: type::thing("cycle", $cycle),
        \`order\`: $order,
        is_active: true
    `;
    
    const createParams: Record<string, any> = {
      name: name.trim(),
      code: finalCode,
      short_name: short_name || null,
      cycle,
      order: maxOrder + 1
    };
    
    if (track) {
      createQuery += `, track: type::thing("track", $track)`;
      createParams.track = track;
    }
    
    createQuery += ` }`;
    
    const created = await db.query<any[]>(createQuery, createParams);
    const grade = created[0]?.[0];
    
    return json({ grade, message: 'Niveau créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create grade error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour l'ordre des grades
export const PUT: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const { grades } = await request.json();
    
    if (!Array.isArray(grades)) {
      return json({ message: 'Format invalide' }, { status: 400 });
    }
    
    // Mettre à jour l'ordre
    for (let i = 0; i < grades.length; i++) {
      const id = grades[i].includes(':') ? grades[i].split(':')[1] : grades[i];
      await db.query(`UPDATE grade SET \`order\` = $order WHERE id = type::thing("grade", $id)`, {
        id,
        order: i
      });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating grade order:', error);
    return json({ message: 'Erreur lors de la mise à jour de l\'ordre' }, { status: 500 });
  }
};
