import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
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
    themes,
    levels,
    question: null // New question
  };
};
