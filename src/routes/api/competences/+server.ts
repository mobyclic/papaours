import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer toutes les compétences
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const matiereId = url.searchParams.get('matiere');
    const type = url.searchParams.get('type'); // 'general' ou 'matiere'
    
    let query = 'SELECT *, matiere_id.name as matiere_name, matiere_id.slug as matiere_slug FROM competence';
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    
    if (type) {
      conditions.push('type = $type');
      params.type = type;
    }
    
    if (matiereId) {
      conditions.push('matiere_id = type::thing("matiere", $matiereId)');
      params.matiereId = matiereId;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY type DESC, matiere_id, `order`';
    
    const result = await db.query(query, params);
    const competences = ((result[0] as any[]) || []).map(c => ({
      id: c.id?.toString(),
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type,
      matiere_id: c.matiere_id?.toString(),
      matiere_name: c.matiere_name,
      matiere_slug: c.matiere_slug,
      color: c.color,
      icon: c.icon,
      order: c.order
    }));
    
    // Grouper par type pour faciliter l'affichage
    const grouped = {
      general: competences.filter(c => c.type === 'general'),
      byMatiere: {} as Record<string, any[]>
    };
    
    competences.filter(c => c.type === 'matiere').forEach(c => {
      const key = c.matiere_slug || c.matiere_id || 'unknown';
      if (!grouped.byMatiere[key]) {
        grouped.byMatiere[key] = [];
      }
      grouped.byMatiere[key].push(c);
    });
    
    return json({ competences, grouped });
  } catch (error) {
    console.error('GET competences error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
