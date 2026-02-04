import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer un système éducatif
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    
    const result = await db.query(
      'SELECT *, default_language.* as language_details FROM type::thing("education_system", $id)',
      { id }
    );
    
    const educationSystem = (result[0] as any[])?.[0];
    
    if (!educationSystem) {
      return json({ message: 'Système éducatif non trouvé' }, { status: 404 });
    }
    
    return json({ educationSystem });
  } catch (error) {
    console.error('Get education system error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour un système éducatif
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    const data = await request.json();
    
    const { name, country_code, flag, default_language, is_active } = data;
    
    if (!name) {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    const updated = await db.query(`
      UPDATE type::thing("education_system", $id) SET
        name = $name,
        country_code = $country_code,
        flag = $flag,
        default_language = type::thing("language", $lang),
        is_active = $is_active
    `, {
      id,
      name: name.trim(),
      country_code: country_code || id,
      flag: flag || null,
      lang: default_language || 'fr',
      is_active: is_active !== false
    });
    
    const educationSystem = (updated[0] as any[])?.[0];
    
    if (!educationSystem) {
      return json({ message: 'Système éducatif non trouvé' }, { status: 404 });
    }
    
    return json({ educationSystem, message: 'Système éducatif mis à jour' });
  } catch (error) {
    console.error('Update education system error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un système éducatif
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const { id } = params;
    
    // Vérifier s'il y a des cycles liés
    const cycles = await db.query(
      'SELECT count() as count FROM cycle WHERE system = type::thing("education_system", $id) GROUP ALL',
      { id }
    );
    
    const cycleCount = (cycles[0] as any[])?.[0]?.count || 0;
    
    if (cycleCount > 0) {
      return json({ 
        message: `Impossible de supprimer : ${cycleCount} cycle(s) lié(s)` 
      }, { status: 400 });
    }
    
    await db.query(
      'DELETE type::thing("education_system", $id)',
      { id }
    );
    
    return json({ message: 'Système éducatif supprimé' });
  } catch (error) {
    console.error('Delete education system error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
