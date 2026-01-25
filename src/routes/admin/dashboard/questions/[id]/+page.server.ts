import type { ServerLoadEvent } from "@sveltejs/kit";

export const load = async ({ params }: ServerLoadEvent) => {
  // TODO: Fetch question from database with full details
  
  // Mock data for now - representing different question types for testing
  const question = {
    id: params.id,
    type: 'qcm' as const,
    theme_id: 'theme:cinema-technique',
    theme_name: 'Technique cinéma',
    level_id: 'level:intermediate',
    level_name: 'Intermédiaire',
    default_language: 'fr',
    translations: [
      { 
        language: 'fr', 
        title: 'Quel est le format standard de projection numérique en salle de cinéma ?',
        subtitle: 'Formats cinéma',
        intro: 'Le format de projection est crucial pour l\'expérience cinématographique.',
        hint: 'Ce format est utilisé dans les multiplexes',
        explanation: 'Le DCP (Digital Cinema Package) est le format standard pour la projection numérique en salle. Il utilise une résolution 2K ou 4K avec une compression JPEG2000.'
      },
      { 
        language: 'en', 
        title: 'What is the standard digital projection format in movie theaters?',
        subtitle: 'Cinema formats',
        intro: 'The projection format is crucial for the cinematic experience.',
        hint: 'This format is used in multiplexes',
        explanation: 'DCP (Digital Cinema Package) is the standard format for digital projection in theaters. It uses 2K or 4K resolution with JPEG2000 compression.'
      }
    ],
    answers: [
      { id: '1', text: 'DCP (Digital Cinema Package)', points: 10, is_correct: true, order: 1 },
      { id: '2', text: 'MOV (QuickTime)', points: 0, is_correct: false, order: 2 },
      { id: '3', text: 'MP4 (MPEG-4)', points: 0, is_correct: false, order: 3 },
      { id: '4', text: 'AVI (Audio Video Interleave)', points: 0, is_correct: false, order: 4 },
    ],
    points_total: 10,
    difficulty_weight: 6,
    is_active: true,
    time_limit: 30,
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    usage_count: 12,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-18T14:22:00Z'
  };

  // Quizzes using this question
  const usedInQuizzes = [
    { id: 'quiz:1', name: 'Quiz Technique Niveau 1', usage_date: '2025-01-16' },
    { id: 'quiz:2', name: 'Formation Assistant Réalisateur', usage_date: '2025-01-17' },
    { id: 'quiz:3', name: 'Examen Final Janvier 2025', usage_date: '2025-01-18' },
  ];

  return {
    question,
    usedInQuizzes
  };
};
