import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET /api/themes/[id] - Get a single theme
export const GET: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const themeId = params.id.includes(':') ? params.id : `theme:${params.id}`;
    const result = await db.query<any[]>('SELECT * FROM type::thing("theme", $id)', { 
      id: params.id.includes(':') ? params.id.split(':')[1] : params.id 
    });
    
    const theme = result[0]?.[0];
    if (!theme) {
      return json({ error: 'Theme not found' }, { status: 404 });
    }
    
    return json({
      theme: {
        id: theme.id?.toString() || theme.id,
        name: theme.name,
        slug: theme.slug,
        matiere_id: theme.matiere_id?.toString() || null,
        matiere_ids: (theme.matiere_ids || []).map((m: any) => m?.toString() || m),
        is_active: theme.is_active ?? true,
        pos: theme.pos ?? 0
      }
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return json({ error: 'Failed to fetch theme' }, { status: 500 });
  }
};

// PATCH /api/themes/[id] - Update a theme
export const PATCH: RequestHandler = async ({ params, request }) => {
  return updateTheme(params, request);
};

// PUT /api/themes/[id] - Update a theme (alias for PATCH)
export const PUT: RequestHandler = async ({ params, request }) => {
  return updateTheme(params, request);
};

// Shared update function
async function updateTheme(params: { id: string }, request: Request) {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { name, matiere_ids, is_active } = data;
    const cleanId = params.id.includes(':') ? params.id.split(':')[1] : params.id;
    
    // Check if theme exists
    const existing = await db.query<any[]>('SELECT * FROM type::thing("theme", $id)', { id: cleanId });
    if ((existing[0] || []).length === 0) {
      return json({ error: 'Theme not found' }, { status: 404 });
    }
    
    const updates: string[] = ['updated_at = time::now()'];
    const queryParams: Record<string, any> = { id: cleanId };
    
    if (name !== undefined) {
      // Generate new slug if name changed
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug exists for another theme
      const slugExists = await db.query<any[]>(
        'SELECT id FROM theme WHERE slug = $slug AND id != type::thing("theme", $id)', 
        { slug, id: cleanId }
      );
      if ((slugExists[0] || []).length > 0) {
        return json({ error: 'Un thème avec ce nom existe déjà' }, { status: 400 });
      }
      
      updates.push('name = $name');
      updates.push('slug = $slug');
      queryParams.name = name.trim();
      queryParams.slug = slug;
    }
    
    if (matiere_ids !== undefined) {
      // Convert matiere_ids to RecordIds array
      const matiereIdRecords = (matiere_ids || []).map((id: string) => {
        const mid = id?.includes(':') ? id.split(':')[1] : id;
        return `type::thing("matiere", "${mid}")`;
      });
      
      // Build the array literal
      updates.push(`matiere_ids = [${matiereIdRecords.join(', ')}]`);
      
      // Update matiere_id for backward compatibility
      if (matiere_ids.length > 0) {
        const firstId = matiere_ids[0].includes(':') ? matiere_ids[0].split(':')[1] : matiere_ids[0];
        updates.push(`matiere_id = type::thing("matiere", "${firstId}")`);
      } else {
        updates.push('matiere_id = NONE');
      }
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = $is_active');
      queryParams.is_active = is_active;
    }
    
    const query = `UPDATE type::thing("theme", $id) SET ${updates.join(', ')}`;
    const result = await db.query<any[]>(query, queryParams);
    const theme = result[0]?.[0];
    
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
    console.error('Error updating theme:', error);
    return json({ error: 'Failed to update theme' }, { status: 500 });
  }
};

// DELETE /api/themes/[id] - Delete a theme
export const DELETE: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const cleanId = params.id.includes(':') ? params.id.split(':')[1] : params.id;
    
    // Check if theme is used by any questions
    const usedBy = await db.query<any[]>(`
      SELECT count() as count FROM question WHERE type::thing("theme", $themeId) INSIDE theme_ids GROUP ALL
    `, { themeId: cleanId });
    
    const usageCount = (usedBy[0] as any[])?.[0]?.count || 0;
    if (usageCount > 0) {
      return json({ 
        error: `Ce thème est utilisé par ${usageCount} question(s). Retirez-le des questions avant de le supprimer.` 
      }, { status: 400 });
    }
    
    await db.query('DELETE type::thing("theme", $id)', { id: cleanId });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return json({ error: 'Failed to delete theme' }, { status: 500 });
  }
};
