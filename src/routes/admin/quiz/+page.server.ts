import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Pour maintenant, retourner des données de test
  // En production, charger depuis la base de données
  const quizzes = [
    {
      id: 'quiz:1',
      title: 'Les bases de mathématiques',
      subject: 'Mathématique',
      difficulty_level: 'Débutant',
      question_count: 15,
      is_active: true
    },
    {
      id: 'quiz:2',
      title: 'Grammaire française',
      subject: 'Français',
      difficulty_level: 'Intermédiaire',
      question_count: 20,
      is_active: true
    }
  ];

  return {
    quizzes
  };
};
