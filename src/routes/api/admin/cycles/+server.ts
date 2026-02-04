import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste tous les cycles
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const systemId = url.searchParams.get('system');
    
    let query = `
      SELECT 
        *,
        system.name as system_name,
        system.flag as system_flag,
        (SELECT count() FROM grade WHERE cycle = $parent.id GROUP ALL)[0].count as grade_count,
        (SELECT count() FROM track WHERE cycle = $parent.id GROUP ALL)[0].count as track_count
      FROM cycle 
    `;
    
    const params: Record<string, any> = {};
    
    if (systemId) {
      query += ' WHERE system = type::thing("education_system", $systemId)';
      params.systemId = systemId;
    }
    
    query += ' ORDER BY system, `order` ASC';
    
    const result = await db.query(query, params);
    
    // Récupérer aussi les systèmes éducatifs
    const systems = await db.query('SELECT * FROM education_system ORDER BY name ASC');
    
    return json({ 
      cycles: result[0] || [],
      educationSystems: systems[0] || []
    });
  } catch (error) {
    console.error('Get cycles error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un nouveau cycle
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, code, system, age_min, age_max } = data;
    
    if (!name || !code || !system) {
      return json({ message: 'Le nom, le code et le système sont requis' }, { status: 400 });
    }
    
    // Générer l'ID unique
    const cycleId = `${system}_${code}`;
    
    // Vérifier si le cycle existe déjà
    const existing = await db.query(
      'SELECT id FROM cycle WHERE id = type::thing("cycle", $id)',
      { id: cycleId }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un cycle avec ce code existe déjà pour ce système' }, { status: 400 });
    }
    
    // Obtenir le prochain ordre
    const maxOrder = await db.query(
      'SELECT math::max(`order`) as max_order FROM cycle WHERE system = type::thing("education_system", $system)',
      { system }
    );
    const nextOrder = ((maxOrder[0] as any[])?.[0]?.max_order || 0) + 1;
    
    // Créer le cycle
    const created = await db.query(`
      CREATE cycle:${cycleId} SET
        code = $code,
        name = $name,
        system = type::thing("education_system", $system),
        age_min = $age_min,
        age_max = $age_max,
        \`order\` = $order,
        is_active = true,
        created_at = time::now()
    `, {
      code,
      name: name.trim(),
      system,
      age_min: age_min || null,
      age_max: age_max || null,
      order: nextOrder
    });
    
    const cycle = (created[0] as any[])?.[0];
    
    return json({ cycle, message: 'Cycle créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create cycle error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour l'ordre des cycles (drag & drop)
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const { cycles } = await request.json();
    
    if (!Array.isArray(cycles)) {
      return json({ message: 'Format invalide' }, { status: 400 });
    }
    
    for (let i = 0; i < cycles.length; i++) {
      const cycleId = cycles[i].replace('cycle:', '');
      await db.query(
        'UPDATE type::thing("cycle", $id) SET `order` = $order',
        { id: cycleId, order: i + 1 }
      );
    }
    
    return json({ message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Update cycles order error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
