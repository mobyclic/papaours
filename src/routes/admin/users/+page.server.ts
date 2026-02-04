import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ url }) => {
  try {
    const db = await connectDB();
    
    // On ne charge plus les utilisateurs ici, c'est fait côté client via l'API
    // On charge seulement les données de référence pour les filtres
    
    // Récupérer les grades pour le filtre
    const gradesResult = await db.query(`
      SELECT id, name, code, \`order\`, cycle.code as cycle_code FROM grade ORDER BY \`order\` ASC
    `);
    
    // Récupérer les cycles pour le filtre
    const cyclesResult = await db.query(`
      SELECT id, name, code, \`order\` FROM cycle ORDER BY \`order\` ASC
    `);
    
    const grades = (gradesResult[0] as any[]) || [];
    const cycles = (cyclesResult[0] as any[]) || [];

    return {
      grades: grades.map((g: any) => ({
        id: g.id?.toString() || g.id,
        name: g.name,
        code: g.code,
        cycle_code: g.cycle_code || ''
      })),
      cycles: cycles.map((c: any) => ({
        id: c.id?.toString() || c.id,
        name: c.name,
        code: c.code
      }))
    };
  } catch (error) {
    console.error('Error loading user filters:', error);
    return {
      grades: [],
      cycles: []
    };
  }
};
