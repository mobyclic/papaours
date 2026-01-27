import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { RecordId } from 'surrealdb';

function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

export const load: PageServerLoad = async () => {
  const db = await connectDB();
  
  // Récupérer les thèmes avec leurs matières
  const themesResult = await db.query<any[]>(`
    SELECT *, matiere_ids.*.name as matiere_names FROM theme ORDER BY name ASC
  `);
  
  // Récupérer les matières pour le filtre
  const matieresResult = await db.query<any[]>('SELECT id, name, slug, color, pos FROM matiere WHERE is_active = true ORDER BY pos ASC');
  
  // Compter le nombre de questions par thème
  const questionsResult = await db.query<any[]>(`
    SELECT theme_ids, count() as count FROM question WHERE theme_ids != NONE GROUP ALL
  `);
  
  // Calculer le compte par thème
  const questionCounts: Record<string, number> = {};
  const questions = await db.query<any[]>('SELECT id, theme_ids FROM question');
  for (const q of (questions[0] || [])) {
    for (const themeId of (q.theme_ids || [])) {
      const id = themeId?.toString() || themeId;
      questionCounts[id] = (questionCounts[id] || 0) + 1;
    }
  }
  
  const themes = (themesResult[0] || []).map((t: any) => ({
    ...serialize(t),
    question_count: questionCounts[t.id?.toString()] || 0
  }));
  
  const matieres = serialize(matieresResult[0] || []);
  
  return {
    themes,
    matieres
  };
};
