import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { entityType, language, translations } = data;
  
  if (!entityType || !language || !translations) {
    return json({ error: 'Données incomplètes' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    let savedCount = 0;
    
    for (const [key, fields] of Object.entries(translations as Record<string, Record<string, string>>)) {
      // key format: "entityType:entityId"
      const [type, entityId] = key.split(':');
      
      // Ne traiter que les traductions du bon type
      if (type !== entityType) continue;
      
      for (const [field, value] of Object.entries(fields)) {
        if (!value || value.trim() === '') {
          // Supprimer la traduction si vide
          await db.query(`
            DELETE FROM translation 
            WHERE entity_type = $entityType 
              AND entity_id = $entityId 
              AND field = $field 
              AND language = language:${language}
          `, { entityType, entityId, field });
        } else {
          // Upsert la traduction
          // D'abord chercher si elle existe
          const [existing] = await db.query<any[]>(`
            SELECT id FROM translation 
            WHERE entity_type = $entityType 
              AND entity_id = $entityId 
              AND field = $field 
              AND language = language:${language}
          `, { entityType, entityId, field });
          
          if (existing && existing.length > 0) {
            // Update
            await db.query(`
              UPDATE $id SET value = $value, updated_at = time::now()
            `, { id: existing[0].id, value: value.trim() });
          } else {
            // Create
            await db.query(`
              CREATE translation SET
                entity_type = $entityType,
                entity_id = $entityId,
                field = $field,
                language = language:${language},
                value = $value,
                created_at = time::now()
            `, { entityType, entityId, field, value: value.trim() });
          }
          savedCount++;
        }
      }
    }
    
    return json({ success: true, savedCount });
  } catch (error) {
    console.error('Failed to save translations:', error);
    return json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
};

// GET: Récupérer les traductions pour une entité spécifique
export const GET: RequestHandler = async ({ url }) => {
  const entityType = url.searchParams.get('type');
  const entityId = url.searchParams.get('id');
  const language = url.searchParams.get('lang');
  
  if (!entityType) {
    return json({ error: 'Type d\'entité requis' }, { status: 400 });
  }
  
  const db = await getSurrealDB();
  
  try {
    let query = `SELECT * FROM translation WHERE entity_type = $entityType`;
    const params: Record<string, any> = { entityType };
    
    if (entityId) {
      query += ` AND entity_id = $entityId`;
      params.entityId = entityId;
    }
    
    if (language) {
      query += ` AND language = language:${language}`;
    }
    
    const [translations] = await db.query<any[]>(query, params);
    
    return json(translations || []);
  } catch (error) {
    console.error('Failed to fetch translations:', error);
    return json([], { status: 500 });
  }
};
