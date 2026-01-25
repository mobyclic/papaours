import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Données de test - en production, charger depuis la base de données
  const users = [
    {
      id: 'user:1',
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie.dupont@example.com',
      level: 'Intermédiaire',
      points: 1250,
      is_active: true,
      created_at: '2025-01-15T10:00:00Z'
    },
    {
      id: 'user:2',
      first_name: 'Pierre',
      last_name: 'Martin',
      email: 'pierre.martin@example.com',
      level: 'Débutant',
      points: 450,
      is_active: true,
      created_at: '2025-01-10T14:30:00Z'
    },
    {
      id: 'user:3',
      first_name: 'Sophie',
      last_name: 'Bernard',
      email: 'sophie.bernard@example.com',
      level: 'Avancé',
      points: 3200,
      is_active: true,
      created_at: '2025-01-05T09:15:00Z'
    }
  ];

  return {
    users
  };
};
