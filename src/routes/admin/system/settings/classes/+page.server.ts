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
  
  // Récupérer les cycles (remplace les catégories)
  const cyclesResult = await db.query<any[]>('SELECT * FROM cycle ORDER BY order ASC');
  const cycles = (cyclesResult[0] || []);
  
  // Récupérer les grades avec leur cycle
  const result = await db.query<any[]>('SELECT *, cycle.* as cycle_data FROM grade ORDER BY order ASC');
  const grades = (result[0] || []);
  
  // Compter le nombre de questions par grade (via grade_difficulties)
  const questionsResult = await db.query<any[]>(`
    SELECT grade_difficulties.grade_id as grade_id, count() as count 
    FROM question 
    WHERE grade_difficulties != NONE AND array::len(grade_difficulties) > 0
    GROUP BY grade_difficulties.grade_id
  `);
  const questionCounts: Record<string, number> = {};
  for (const q of (questionsResult[0] || [])) {
    if (q.grade_id) {
      const gradeIds = Array.isArray(q.grade_id) ? q.grade_id : [q.grade_id];
      for (const gId of gradeIds) {
        const key = gId?.toString() || '';
        questionCounts[key] = (questionCounts[key] || 0) + (q.count || 0);
      }
    }
  }
  
  // Enrichir les grades avec le compte de questions
  const enrichedGrades = grades.map((g: any) => ({
    ...serialize(g),
    question_count: questionCounts[g.id?.toString()] || 0
  }));
  
  return {
    grades: enrichedGrades,
    cycles: serialize(cycles)
  };
};
