import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const result = await db.query<any[]>(`
      SELECT *,
        cycle.name as cycle_name,
        cycle.system.name as system_name
      FROM track 
      WHERE id = type::thing("track", $id)
    `, { id: params.id });
    
    const track = result[0]?.[0];
    if (!track) {
      return json({ message: 'Filière non trouvée' }, { status: 404 });
    }
    
    return json({ track });
  } catch (error) {
    console.error('Error fetching track:', error);
    return json({ message: 'Erreur lors du chargement' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const db = await getSurrealDB();
  
  try {
    const data = await request.json();
    const { name, description, is_active, cycle } = data;
    
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
    
    // Ne permettre le changement de cycle que si pas de spécialités/grades liés
    if (cycle) {
      const linkedSpecialties = await db.query<any[]>(
        `SELECT count() as c FROM specialty WHERE track = type::thing("track", $id)`,
        { id: params.id }
      );
      const linkedGrades = await db.query<any[]>(
        `SELECT count() as c FROM grade WHERE track = type::thing("track", $id)`,
        { id: params.id }
      );
      
      const specCount = linkedSpecialties[0]?.[0]?.c || 0;
      const gradeCount = linkedGrades[0]?.[0]?.c || 0;
      
      if (specCount > 0 || gradeCount > 0) {
        return json({ 
          message: `Impossible de changer le cycle : ${specCount} spécialité(s) et ${gradeCount} classe(s) liée(s)` 
        }, { status: 400 });
      }
      
      updateFields.push('cycle = type::thing("cycle", $cycle)');
      updateParams.cycle = cycle;
    }
    
    const result = await db.query<any[]>(
      `UPDATE track SET ${updateFields.join(', ')} WHERE id = type::thing("track", $id)`,
      updateParams
    );
    
    return json({ track: result[0]?.[0] });
  } catch (error) {
    console.error('Error updating track:', error);
    return json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    // Vérifier les spécialités liées
    const linkedSpecialties = await db.query<any[]>(
      `SELECT count() as c FROM specialty WHERE track = type::thing("track", $id)`,
      { id: params.id }
    );
    
    // Vérifier les grades liés
    const linkedGrades = await db.query<any[]>(
      `SELECT count() as c FROM grade WHERE track = type::thing("track", $id)`,
      { id: params.id }
    );
    
    const specCount = linkedSpecialties[0]?.[0]?.c || 0;
    const gradeCount = linkedGrades[0]?.[0]?.c || 0;
    
    if (specCount > 0 || gradeCount > 0) {
      return json({ 
        message: `Impossible de supprimer : ${specCount} spécialité(s) et ${gradeCount} classe(s) liée(s)` 
      }, { status: 400 });
    }
    
    await db.query(`DELETE type::thing("track", $id)`, { id: params.id });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
};
