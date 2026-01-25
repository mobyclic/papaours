import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Données de test - en production, charger depuis la base de données
  const questions = [
    {
      id: 'question:1',
      theme_id: 'theme:1',
      theme_name: 'Géographie',
      level_id: 'level:1',
      level_name: 'Débutant',
      type: 'qcm',
      translations: [
        { language: 'fr', title: 'Quelle est la capitale de la France ?', subtitle: 'Géographie européenne' }
      ],
      default_language: 'fr',
      answers: [
        { id: 'a1', text: 'Paris', points: 10, is_correct: true, language: 'fr', order: 1 },
        { id: 'a2', text: 'Lyon', points: 0, is_correct: false, language: 'fr', order: 2 },
        { id: 'a3', text: 'Marseille', points: 0, is_correct: false, language: 'fr', order: 3 },
      ],
      multiple_answers: false,
      difficulty_weight: 3,
      is_active: true,
      created_at: '2025-01-20T10:00:00Z',
      usage_count: 5
    },
    {
      id: 'question:2',
      theme_id: 'theme:2',
      theme_name: 'Mathématiques',
      level_id: 'level:2',
      level_name: 'Intermédiaire',
      type: 'qcm',
      translations: [
        { language: 'fr', title: 'Combien font 7 x 8 ?', intro: 'Calculez mentalement' },
        { language: 'en', title: 'What is 7 x 8?', intro: 'Calculate mentally' }
      ],
      default_language: 'fr',
      answers: [
        { id: 'a1', text: '56', points: 10, is_correct: true, language: 'fr', order: 1 },
        { id: 'a2', text: '54', points: 0, is_correct: false, language: 'fr', order: 2 },
        { id: 'a3', text: '58', points: 0, is_correct: false, language: 'fr', order: 3 },
        { id: 'a4', text: '64', points: 0, is_correct: false, language: 'fr', order: 4 },
      ],
      multiple_answers: false,
      difficulty_weight: 5,
      is_active: true,
      created_at: '2025-01-18T14:30:00Z',
      usage_count: 8
    },
    {
      id: 'question:3',
      theme_id: 'theme:3',
      theme_name: 'Histoire',
      level_id: 'level:3',
      level_name: 'Avancé',
      type: 'true_false',
      translations: [
        { language: 'fr', title: 'La Révolution française a eu lieu en 1789', subtitle: 'Histoire de France' }
      ],
      default_language: 'fr',
      answers: [
        { id: 'a1', text: 'Vrai', points: 10, is_correct: true, language: 'fr', order: 1 },
        { id: 'a2', text: 'Faux', points: 0, is_correct: false, language: 'fr', order: 2 },
      ],
      multiple_answers: false,
      difficulty_weight: 4,
      is_active: true,
      created_at: '2025-01-15T09:15:00Z',
      usage_count: 3
    },
    {
      id: 'question:4',
      theme_id: 'theme:1',
      theme_name: 'Géographie',
      level_id: 'level:2',
      level_name: 'Intermédiaire',
      type: 'qcm',
      translations: [
        { language: 'fr', title: 'Quels pays sont frontaliers de la France ?', intro: 'Plusieurs réponses possibles' }
      ],
      default_language: 'fr',
      answers: [
        { id: 'a1', text: 'Espagne', points: 5, is_correct: true, language: 'fr', order: 1 },
        { id: 'a2', text: 'Italie', points: 5, is_correct: true, language: 'fr', order: 2 },
        { id: 'a3', text: 'Allemagne', points: 5, is_correct: true, language: 'fr', order: 3 },
        { id: 'a4', text: 'Portugal', points: 0, is_correct: false, language: 'fr', order: 4 },
        { id: 'a5', text: 'Pologne', points: 0, is_correct: false, language: 'fr', order: 5 },
      ],
      multiple_answers: true,
      difficulty_weight: 6,
      is_active: true,
      created_at: '2025-01-10T11:00:00Z',
      usage_count: 2
    },
  ];

  const themes = [
    { id: 'theme:1', name: 'Géographie', color: '#3B82F6' },
    { id: 'theme:2', name: 'Mathématiques', color: '#10B981' },
    { id: 'theme:3', name: 'Histoire', color: '#F59E0B' },
    { id: 'theme:4', name: 'Sciences', color: '#8B5CF6' },
    { id: 'theme:5', name: 'Français', color: '#EF4444' },
  ];

  const levels = [
    { id: 'level:1', name: 'Débutant', order: 1 },
    { id: 'level:2', name: 'Intermédiaire', order: 2 },
    { id: 'level:3', name: 'Avancé', order: 3 },
    { id: 'level:4', name: 'Expert', order: 4 },
  ];

  return {
    questions,
    themes,
    levels
  };
};
