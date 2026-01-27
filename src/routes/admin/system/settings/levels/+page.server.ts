import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Get all levels
    const result = await db.query<any[]>('SELECT * FROM niveau ORDER BY pos ASC');
    const levels = result[0] || [];
    
    // Count users at each level
    const usersResult = await db.query<any[]>(`
      SELECT niveau_id, count() as count 
      FROM user_progress 
      WHERE niveau_id != NONE 
      GROUP BY niveau_id
    `);
    
    const userCounts: Record<string, number> = {};
    for (const row of (usersResult[0] || [])) {
      const key = typeof row.niveau_id === 'object' ? row.niveau_id.toString() : row.niveau_id;
      userCounts[key] = row.count || 0;
    }
    
    // Enrich levels with user count
    const enrichedLevels = levels.map((level: any) => ({
      ...level,
      id: typeof level.id === 'object' ? level.id.toString() : level.id,
      user_count: userCounts[typeof level.id === 'object' ? level.id.toString() : level.id] || 0
    }));
    
    return { levels: enrichedLevels };
  } catch (error) {
    console.error('Error loading levels:', error);
    return { levels: [] };
  }
};
