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
  
  // Récupérer les catégories
  const categoriesResult = await db.query<any[]>('SELECT * FROM class_category ORDER BY pos ASC');
  const categories = (categoriesResult[0] || []);
  
  // Récupérer les classes avec leur catégorie
  const result = await db.query<any[]>('SELECT *, category_id.* as category FROM classe ORDER BY pos ASC');
  const classes = (result[0] || []);
  
  // Compter le nombre de questions par classe
  const questionsResult = await db.query<any[]>('SELECT classe_id, count() as count FROM question WHERE classe_id != NONE GROUP BY classe_id');
  const questionCounts: Record<string, number> = {};
  for (const q of (questionsResult[0] || [])) {
    if (q.classe_id) {
      questionCounts[q.classe_id.toString()] = q.count;
    }
  }
  
  // Enrichir les classes avec le compte de questions
  const enrichedClasses = classes.map((c: any) => ({
    ...serialize(c),
    question_count: questionCounts[c.id?.toString()] || 0
  }));
  
  return {
    classes: enrichedClasses,
    categories: serialize(categories)
  };
};
