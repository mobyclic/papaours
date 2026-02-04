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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const load: PageServerLoad = async ({ url }) => {
  try {
    const db = await connectDB();
    
    const typeFilter = url.searchParams.get('type') || '';
    const search = url.searchParams.get('search') || '';
    
    // Construire la requête
    let whereClause = 'WHERE is_active = true';
    if (typeFilter) {
      whereClause += ` AND type = '${typeFilter}'`;
    }
    if (search) {
      whereClause += ` AND (title CONTAINS '${search}' OR filename CONTAINS '${search}')`;
    }
    
    // Récupérer les médias depuis la table media
    const [mediaResults] = await db.query<any[]>(`
      SELECT * FROM media 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    const medias = (mediaResults || []).map((m: any) => ({
      ...m,
      id: m.id?.toString() || '',
      size: formatFileSize(m.size || 0),
      sizeBytes: m.size || 0
    }));
    
    // Si pas de médias dans la table, récupérer aussi les images des questions
    if (medias.length === 0) {
      const [questionsWithMedia] = await db.query<any[]>(`
        SELECT id, question, imageUrl, imageCaption, createdAt 
        FROM question 
        WHERE imageUrl != NONE AND imageUrl != ''
        ORDER BY createdAt DESC
        LIMIT 50
      `);
      
      const questionMedias = (questionsWithMedia || []).map((q: any, idx: number) => ({
        id: `question_media:${idx + 1}`,
        title: q.imageCaption || q.question?.substring(0, 50) || 'Image sans titre',
        filename: q.imageUrl?.split('/').pop() || 'image',
        type: 'image',
        url: q.imageUrl,
        size: 'N/A',
        created_at: q.createdAt,
        source: 'question',
        question_id: q.id?.toString()
      }));
      
      return {
        medias: serialize([...medias, ...questionMedias])
      };
    }

    return {
      medias: serialize(medias)
    };
  } catch (error) {
    console.error('Error loading medias:', error);
    return {
      medias: []
    };
  }
};
