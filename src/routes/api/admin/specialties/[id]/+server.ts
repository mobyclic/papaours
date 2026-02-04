import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const result = await db.query<any[]>(`
      SELECT *,
        track.name as track_name,
        track.cycle.name as cycle_name,
        track.cycle.system.name as system_name
      FROM specialty 
      WHERE id = type::thing("specialty", $id)
    `, { id: params.id });
    
    const specialty = result[0]?.[0];
    if (!specialty) {
      return json({ message: 'Spécialité non trouvée' }, { status: 404 });
    }
    
    return json({ specialty });
  } catch (error) {
    console.error('Error fetching specialty:', error);
    return json({ message: 'Erreur lors du chargement' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { name, description, is_active, track } = data;
    
    if (!name) {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Construire l'update dynamiquement
    let updateFields = ['name = $name', 'description = $description', 'is_active = $is_active'];
    const updateParams: Record<string, any> = {
      id: params.id,
      name,
      description: description || null,
      is_active: is_active ?? true
    };
    
    // Ne permettre le changement de track que si pas de programmes liés
    if (track) {
      const linkedPrograms = await db.query<any[]>(
        `SELECT count() as c FROM official_program WHERE specialty = type::thing("specialty", $id)`,
        { id: params.id }
      );
      
      const progCount = linkedPrograms[0]?.[0]?.c || 0;
      
      if (progCount > 0) {
        return json({ 
          message: `Impossible de changer la filière : ${progCount} programme(s) lié(s)` 
        }, { status: 400 });
      }
      
      updateFields.push('track = type::thing("track", $track)');
      updateParams.track = track;
    }
    
    const result = await db.query<any[]>(
      `UPDATE specialty SET ${updateFields.join(', ')} WHERE id = type::thing("specialty", $id)`,
      updateParams
    );
    
    return json({ specialty: result[0]?.[0] });
  } catch (error) {
    console.error('Error updating specialty:', error);
    return json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    // Vérifier les programmes liés
    const linkedPrograms = await db.query<any[]>(
      `SELECT count() as c FROM official_program WHERE specialty = type::thing("specialty", $id)`,
      { id: params.id }
    );
    
    const progCount = linkedPrograms[0]?.[0]?.c || 0;
    
    if (progCount > 0) {
      return json({ 
        message: `Impossible de supprimer : ${progCount} programme(s) lié(s)` 
      }, { status: 400 });
    }
    
    await db.query(`DELETE type::thing("specialty", $id)`, { id: params.id });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting specialty:', error);
    return json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
};
