import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET /api/themes - List all themes with optional filters
export const GET: RequestHandler = async ({ url }) => {
  const db = await getSurrealDB();
  
  try {
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const matiereId = url.searchParams.get('matiere_id') || '';
    
    let query = 'SELECT *, matiere_ids FROM theme WHERE is_active = true';
    const params: Record<string, any> = {};
    
    if (search) {
      query += ' AND string::lowercase(name) CONTAINS $search';
      params.search = search;
    }
    
    if (matiereId) {
      // Filter by matiere - check both old matiere_id and new matiere_ids
      query += ' AND (matiere_id = type::thing("matiere", $matiereId) OR $matiereId INSIDE matiere_ids)';
      params.matiereId = matiereId.includes(':') ? matiereId.split(':')[1] : matiereId;
    }
    
    const result = await db.query<any[]>(query, params);
    const themes = (result[0] || []).map((t: any) => ({
      id: t.id?.toString() || t.id,
      name: t.name,
      slug: t.slug,
      matiere_id: t.matiere_id?.toString() || null,
      matiere_ids: (t.matiere_ids || []).map((m: any) => m?.toString() || m),
      is_active: t.is_active ?? true,
      pos: t.pos ?? 0
    })).sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0));
    
    return json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
};

// POST /api/themes - Create a new theme
export const POST: RequestHandler = async ({ request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { name, matiere_ids } = data;
    
    if (!name?.trim()) {
      return json({ error: 'Le nom est obligatoire' }, { status: 400 });
    }
    
    // Generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug exists
    const existing = await db.query<any[]>('SELECT id FROM theme WHERE slug = $slug', { slug });
    if ((existing[0] || []).length > 0) {
      return json({ error: 'Un thème avec ce nom existe déjà' }, { status: 400 });
    }
    
    // Convert matiere_ids to RecordIds
    const matiereIdRecords = (matiere_ids || []).map((id: string) => {
      const cleanId = id?.includes(':') ? id.split(':')[1] : id;
      return `type::thing("matiere", "${cleanId}")`;
    });
    
    // Also set matiere_id for backward compatibility (first one or null)
    const firstMatiereId = matiere_ids?.[0] 
      ? `type::thing("matiere", "${matiere_ids[0].includes(':') ? matiere_ids[0].split(':')[1] : matiere_ids[0]}")`
      : 'NONE';
    
    const query = `
      CREATE theme SET 
        name = $name,
        slug = $slug,
        matiere_ids = [${matiereIdRecords.join(', ')}],
        matiere_id = ${firstMatiereId},
        is_active = true,
        created_at = time::now(),
        updated_at = time::now()
    `;
    
    const result = await db.query<any[]>(query, { name: name.trim(), slug });
    const theme = result[0]?.[0];
    
    if (!theme) {
      return json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
    
    return json({
      theme: {
        id: theme.id?.toString() || theme.id,
        name: theme.name,
        slug: theme.slug,
        matiere_id: theme.matiere_id?.toString() || null,
        matiere_ids: (theme.matiere_ids || []).map((m: any) => m?.toString() || m),
        is_active: theme.is_active
      }
    });
  } catch (error) {
    console.error('Error creating theme:', error);
    return json({ error: 'Failed to create theme' }, { status: 500 });
  }
};
