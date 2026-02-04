import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { RecordId } from 'surrealdb';

// Helper to serialize RecordId and Date objects
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
    
    // Paramètres de filtrage
    const eventType = url.searchParams.get('type') || '';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;
    
    // Construire la requête avec filtres
    let whereClause = '';
    const conditions: string[] = [];
    
    if (eventType) {
      conditions.push(`event_type = '${eventType}'`);
    }
    if (search) {
      conditions.push(`(message CONTAINS '${search}' OR action CONTAINS '${search}')`);
    }
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    // Récupérer les logs
    const [logs] = await db.query<any[]>(`
      SELECT * FROM audit_log 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} START ${offset}
    `);
    
    // Compter le total pour la pagination
    const [countResult] = await db.query<any[]>(`
      SELECT count() as total FROM audit_log ${whereClause} GROUP ALL
    `);
    const total = countResult?.[0]?.total || 0;
    
    return {
      logs: serialize(logs || []),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        eventType,
        search
      }
    };
  } catch (error) {
    console.error('Error loading audit logs:', error);
    return {
      logs: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      filters: { eventType: '', search: '' }
    };
  }
};
