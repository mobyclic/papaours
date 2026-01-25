import type { LayoutServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
  // TODO: Ajouter vérification d'authentification en production
  // if (!locals.user) {
  //   throw new Error('User not authenticated');
  // }

  const db = await getSurrealDB();

  try {
    // Charger les matières (subjects)
    const subjectsResult = await db.query(`SELECT id, name, slug, sort_order FROM subject WHERE is_active = true ORDER BY sort_order ASC`);
    const subjects = Array.isArray(subjectsResult) && Array.isArray(subjectsResult[0])
      ? subjectsResult[0].map((s: any) => ({
          id: String(s.id),
          name: s.name,
          slug: s.slug
        }))
      : [];

    return {
      subjects: subjects,
      user: locals.user || { email: 'admin@example.com', name: 'Admin' }
    };
  } catch (error) {
    console.error('Error loading layout data:', error);
    return {
      subjects: ["Mathématique", "Français", "Histoire", "Sciences", "Anglais"],
      user: locals.user || { email: 'admin@example.com', name: 'Admin' }
    };
  }
};
