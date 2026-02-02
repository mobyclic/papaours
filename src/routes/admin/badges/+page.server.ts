import type { PageServerLoad } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  // Catégories de badges (statique)
  const categories = [
    { id: 'progress', name: 'Progression', icon: '📈' },
    { id: 'streak', name: 'Série', icon: '🔥' },
    { id: 'mastery', name: 'Maîtrise', icon: '🎯' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'special', name: 'Spécial', icon: '⭐' }
  ];

  try {
    const db = await getSurrealDB();
    
    // Vérifier si la table badge existe, sinon retourner liste vide
    const [badges] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        slug,
        description,
        icon,
        category,
        condition_type,
        condition_value,
        points,
        is_active,
        created_at
      FROM badge
      ORDER BY category ASC, points ASC
    `);

    // Sérialiser les badges
    const serializedBadges = (badges || []).map(badge => ({
      ...badge,
      id: badge.id?.toString() || badge.id,
      users_count: 0 // Simplifié pour éviter les erreurs
    }));

    return {
      badges: serializedBadges,
      categories
    };
  } catch (error) {
    console.error('Erreur chargement badges:', error);
    return {
      badges: [],
      categories
    };
  }
};
