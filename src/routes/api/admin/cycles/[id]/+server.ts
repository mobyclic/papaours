import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer un cycle
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    
    const result = await db.query(
      'SELECT *, system.* as system_details FROM type::thing("cycle", $id)',
      { id }
    );
    
    const cycle = (result[0] as any[])?.[0];
    
    if (!cycle) {
      return json({ message: 'Cycle non trouvé' }, { status: 404 });
    }
    
    return json({ cycle });
  } catch (error) {
    console.error('Get cycle error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour un cycle
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    const data = await request.json();
    
    const { name, age_min, age_max, is_active } = data;
    
    if (!name) {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    const updated = await db.query(`
      UPDATE type::thing("cycle", $id) SET
        name = $name,
        age_min = $age_min,
        age_max = $age_max,
        is_active = $is_active
    `, {
      id,
      name: name.trim(),
      age_min: age_min || null,
      age_max: age_max || null,
      is_active: is_active !== false
    });
    
    const cycle = (updated[0] as any[])?.[0];
    
    if (!cycle) {
      return json({ message: 'Cycle non trouvé' }, { status: 404 });
    }
    
    return json({ cycle, message: 'Cycle mis à jour' });
  } catch (error) {
    console.error('Update cycle error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un cycle
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    
    // Vérifier s'il y a des grades ou tracks liés
    const grades = await db.query(
      'SELECT count() as count FROM grade WHERE cycle = type::thing("cycle", $id) GROUP ALL',
      { id }
    );
    const tracks = await db.query(
      'SELECT count() as count FROM track WHERE cycle = type::thing("cycle", $id) GROUP ALL',
      { id }
    );
    
    const gradeCount = (grades[0] as any[])?.[0]?.count || 0;
    const trackCount = (tracks[0] as any[])?.[0]?.count || 0;
    
    if (gradeCount > 0 || trackCount > 0) {
      return json({ 
        message: `Impossible de supprimer : ${gradeCount} classe(s) et ${trackCount} filière(s) liée(s)` 
      }, { status: 400 });
    }
    
    await db.query(
      'DELETE type::thing("cycle", $id)',
      { id }
    );
    
    return json({ message: 'Cycle supprimé' });
  } catch (error) {
    console.error('Delete cycle error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
