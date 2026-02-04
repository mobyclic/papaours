import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const systemId = url.searchParams.get('system');
  
  if (!systemId) {
    return json({ error: 'Missing system parameter' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    // Extraire l'ID clean (sans le préfixe "education_system:")
    const cleanId = systemId.includes(':') ? systemId.split(':')[1] : systemId;
    
    const [cycles] = await db.query(`
      SELECT id, code, name, order, age_min, age_max 
      FROM cycle 
      WHERE system = type::thing("education_system", $systemId) 
        AND is_active = true 
      ORDER BY \`order\`
    `, { systemId: cleanId });
    
    return json(cycles || []);
  } catch (error) {
    console.error('Failed to fetch cycles:', error);
    return json([], { status: 500 });
  }
};
