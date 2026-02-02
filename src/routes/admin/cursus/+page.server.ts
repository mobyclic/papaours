import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await getSurrealDB();
    
    // Récupérer tous les cycles avec le nombre de classes
    const [cycles] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        slug,
        description,
        order,
        is_active,
        (SELECT count() FROM grade WHERE cycle = $parent.id) AS grades_count
      FROM cycle
      ORDER BY order ASC
    `);

    // Récupérer toutes les classes avec leur cycle
    const [grades] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        slug,
        description,
        order,
        is_active,
        cycle.name AS cycle_name,
        cycle.slug AS cycle_slug
      FROM grade
      ORDER BY cycle.order ASC, order ASC
    `);

    // Sérialiser les RecordId
    const serializeCycles = (cycles || []).map(c => ({
      ...c,
      id: c.id?.toString() || c.id,
      grades_count: c.grades_count?.[0]?.count || 0
    }));

    const serializeGrades = (grades || []).map(g => ({
      ...g,
      id: g.id?.toString() || g.id
    }));

    return {
      cycles: serializeCycles,
      grades: serializeGrades
    };
  } catch (error) {
    console.error('Erreur chargement cursus:', error);
    return {
      cycles: [],
      grades: []
    };
  }
};
