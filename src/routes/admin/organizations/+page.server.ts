import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { RecordId } from 'surrealdb';

function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

export const load: PageServerLoad = async ({ url }) => {
  try {
    const db = await connectDB();
    
    const typeFilter = url.searchParams.get('type') || '';
    
    // Construire la requête
    let whereClause = 'WHERE is_active = true';
    if (typeFilter) {
      whereClause += ` AND type = '${typeFilter}'`;
    }
    
    // Récupérer les organisations avec leur parent
    const [organizations] = await db.query<any[]>(`
      SELECT *, parent.name as parent_name, parent.type as parent_type
      FROM organization 
      ${whereClause}
      ORDER BY type, name
    `);
    
    // Compter par type
    const [countByType] = await db.query<any[]>(`
      SELECT type, count() as total FROM organization WHERE is_active = true GROUP BY type
    `);
    
    return {
      organizations: serialize(organizations || []),
      countByType: serialize(countByType || []),
      currentType: typeFilter
    };
  } catch (error) {
    console.error('Error loading organizations:', error);
    return {
      organizations: [],
      countByType: [],
      currentType: ''
    };
  }
};
