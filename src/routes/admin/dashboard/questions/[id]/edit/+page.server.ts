import type { ServerLoadEvent } from "@sveltejs/kit";

export const load = async ({ params }: ServerLoadEvent) => {
  // TODO: Fetch question from database
  // const db = await getSurrealDB();
  // const question = await db.select(`question:${params.id}`);

  // Mock data for now
  const question = {
    id: params.id,
    type: 'qcm' as const,
    theme_id: 'theme:cinema-technique',
    level_id: 'level:intermediate',
    default_language: 'fr',
    translations: [
      { 
        language: 'fr', 
        title: 'Question de test',
        subtitle: 'Sous-titre',
        hint: 'Un indice',
        explanation: "L'explication"
      }
    ],
    answers: [
      { id: '1', text: 'Réponse A', points: 10, is_correct: true, order: 1 },
      { id: '2', text: 'Réponse B', points: 0, is_correct: false, order: 2 },
      { id: '3', text: 'Réponse C', points: 0, is_correct: false, order: 3 },
    ],
    points_total: 10,
    difficulty_weight: 5,
    is_active: true
  };

  const themes = [
    { id: 'theme:cinema-technique', name: 'Technique cinéma' },
    { id: 'theme:histoire-cinema', name: 'Histoire du cinéma' },
    { id: 'theme:post-production', name: 'Post-production' },
    { id: 'theme:son', name: 'Son' },
    { id: 'theme:lumiere', name: 'Lumière' },
    { id: 'theme:realisation', name: 'Réalisation' },
  ];

  const levels = [
    { id: 'level:debutant', name: 'Débutant' },
    { id: 'level:intermediate', name: 'Intermédiaire' },
    { id: 'level:advanced', name: 'Avancé' },
    { id: 'level:expert', name: 'Expert' },
  ];

  return {
    question,
    themes,
    levels
  };
};
