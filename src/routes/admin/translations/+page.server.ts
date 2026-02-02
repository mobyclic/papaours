import { getSurrealDB } from '$lib/server/db';
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

export async function load({ url }: { url: URL }) {
  const db = await getSurrealDB();
  const entityType = url.searchParams.get('type') || 'subject';
  const lang = url.searchParams.get('lang') || 'en';
  
  try {
    // Récupérer les langues disponibles
    const [languages] = await db.query<any[]>(`
      SELECT id, code, name, native_name FROM language WHERE is_active = true ORDER BY code
    `);

    // Récupérer les entités selon le type
    let entities: any[] = [];
    
    switch (entityType) {
      case 'domain':
        const [domains] = await db.query<any[]>(`
          SELECT * FROM domain WHERE is_active = true
        `);
        entities = domains || [];
        break;
        
      case 'subject':
        const [subjects] = await db.query<any[]>(`
          SELECT *, domain.name as domain_name 
          FROM subject WHERE is_active = true
        `);
        entities = subjects || [];
        break;
        
      case 'cycle':
        const [cycles] = await db.query<any[]>(`
          SELECT *, system.name as system_name 
          FROM cycle WHERE is_active = true
        `);
        entities = cycles || [];
        break;
        
      case 'grade':
        const [grades] = await db.query<any[]>(`
          SELECT *, cycle.name as cycle_name 
          FROM grade WHERE is_active = true
        `);
        entities = grades || [];
        break;
        
      case 'track':
        const [tracks] = await db.query<any[]>(`
          SELECT *, cycle.name as cycle_name 
          FROM track WHERE is_active = true
        `);
        entities = tracks || [];
        break;
        
      case 'specialty':
        const [specialties] = await db.query<any[]>(`
          SELECT *, track.name as track_name 
          FROM specialty
        `);
        entities = specialties || [];
        break;
    }

    // Récupérer les traductions existantes pour cette langue
    const [translations] = await db.query<any[]>(`
      SELECT entity_type, entity_id, field, value 
      FROM translation 
      WHERE language = language:${lang}
    `);

    // Créer une map des traductions
    const translationMap: Record<string, Record<string, string>> = {};
    for (const t of translations || []) {
      const key = `${t.entity_type}:${t.entity_id}`;
      if (!translationMap[key]) translationMap[key] = {};
      translationMap[key][t.field] = t.value;
    }

    return {
      entityType,
      selectedLang: lang,
      languages: serialize(languages || []),
      entities: serialize(entities),
      translations: translationMap,
      entityTypes: [
        { code: 'domain', name: 'Domaines', icon: '📚' },
        { code: 'subject', name: 'Matières', icon: '📘' },
        { code: 'cycle', name: 'Cycles', icon: '🎓' },
        { code: 'grade', name: 'Classes', icon: '🏫' },
        { code: 'track', name: 'Filières', icon: '🛤️' },
        { code: 'specialty', name: 'Spécialités', icon: '⭐' },
      ]
    };
  } catch (error) {
    console.error('Failed to load translations data:', error);
    return {
      entityType,
      selectedLang: lang,
      languages: [],
      entities: [],
      translations: {},
      entityTypes: []
    };
  }
};
