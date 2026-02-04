import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer toutes les compétences
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const subjectCode = url.searchParams.get('subject') || url.searchParams.get('matiere');
    const type = url.searchParams.get('type'); // 'general' ou 'subject'
    
    let query = 'SELECT *, subject.name as subject_name, subject.code as subject_code FROM competence';
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    
    if (type) {
      conditions.push('type = $type');
      params.type = type === 'matiere' ? 'subject' : type; // Rétrocompat
    }
    
    if (subjectCode) {
      conditions.push('subject.code = $subjectCode');
      params.subjectCode = subjectCode;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY type DESC, subject, `order`';
    
    const result = await db.query(query, params);
    const competences = ((result[0] as any[]) || []).map(c => ({
      id: c.id?.toString(),
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type,
      subject_id: c.subject?.toString(),
      subject_name: c.subject_name,
      subject_code: c.subject_code,
      color: c.color,
      icon: c.icon,
      order: c.order
    }));
    
    // Grouper par type pour faciliter l'affichage
    const grouped = {
      general: competences.filter(c => c.type === 'general'),
      bySubject: {} as Record<string, any[]>
    };
    
    competences.filter(c => c.type === 'subject' || c.type === 'matiere').forEach(c => {
      const key = c.subject_code || c.subject_id || 'unknown';
      if (!grouped.bySubject[key]) {
        grouped.bySubject[key] = [];
      }
      grouped.bySubject[key].push(c);
    });
    
    return json({ competences, grouped });
  } catch (error) {
    console.error('GET competences error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
