import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Données de test - en production, charger depuis la base de données
  const quizzes = [
    {
      id: 'quiz:1',
      title: 'Les bases des mathématiques',
      subject: 'Mathématique',
      difficulty_level: 'Débutant',
      question_count: 15,
      is_active: true,
      created_at: '2025-01-20T10:00:00Z'
    },
    {
      id: 'quiz:2',
      title: 'Grammaire française',
      subject: 'Français',
      difficulty_level: 'Intermédiaire',
      question_count: 20,
      is_active: true,
      created_at: '2025-01-18T14:30:00Z'
    },
    {
      id: 'quiz:3',
      title: 'Histoire de France',
      subject: 'Histoire',
      difficulty_level: 'Avancé',
      question_count: 25,
      is_active: false,
      created_at: '2025-01-15T09:15:00Z'
    }
  ];

  return {
    quizzes
  };
};
