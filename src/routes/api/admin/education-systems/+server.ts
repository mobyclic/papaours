import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste tous les systèmes éducatifs
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query(`
      SELECT 
        *,
        default_language.* as language_details,
        (SELECT count() FROM cycle WHERE system = $parent.id GROUP ALL)[0].count as cycle_count
      FROM education_system 
      ORDER BY name ASC
    `);
    
    // Récupérer aussi les langues disponibles
    const languages = await db.query('SELECT * FROM language ORDER BY name ASC');
    
    return json({ 
      educationSystems: result[0] || [],
      languages: languages[0] || []
    });
  } catch (error) {
    console.error('Get education systems error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un nouveau système éducatif
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, code, country_code, flag, default_language } = data;
    
    if (!name || !code) {
      return json({ message: 'Le nom et le code sont requis' }, { status: 400 });
    }
    
    // Vérifier si le code existe déjà
    const existing = await db.query(
      'SELECT id FROM education_system WHERE code = $code',
      { code }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un système éducatif avec ce code existe déjà' }, { status: 400 });
    }
    
    // Créer le système éducatif
    const created = await db.query(`
      CREATE education_system:${code} SET
        code = $code,
        name = $name,
        country_code = $country_code,
        flag = $flag,
        default_language = type::thing("language", $lang),
        is_active = true,
        created_at = time::now()
    `, {
      code,
      name: name.trim(),
      country_code: country_code || code,
      flag: flag || null,
      lang: default_language || 'fr'
    });
    
    const educationSystem = (created[0] as any[])?.[0];
    
    return json({ educationSystem, message: 'Système éducatif créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create education system error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
