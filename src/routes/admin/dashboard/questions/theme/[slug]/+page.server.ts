import type { ServerLoadEvent } from "@sveltejs/kit";

export const load = async ({ params }: ServerLoadEvent) => {
  const themeSlug = params.slug;
  
  // Convert slug back to theme name (e.g., "géographie" or "geographie" -> "Géographie")
  const themeName = themeSlug
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || '';

  // TODO: Fetch questions filtered by theme from database
  // const db = await getSurrealDB();
  // const questions = await db.query(`
  //   SELECT * FROM question WHERE theme.name = $themeName
  // `, { themeName });

  // Mock data - questions filtered by theme
  const allQuestions = [
    {
      id: 'question:1',
      type: 'qcm',
      theme_id: 'theme:geographie',
      theme_name: 'Géographie',
      level_id: 'level:intermediate',
      level_name: 'Intermédiaire',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'Quelle est la capitale de la France ?' }],
      points_total: 10,
      difficulty_weight: 3,
      is_active: true,
      usage_count: 5
    },
    {
      id: 'question:2',
      type: 'qcm_multiple',
      theme_id: 'theme:geographie',
      theme_name: 'Géographie',
      level_id: 'level:debutant',
      level_name: 'Débutant',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'Quels pays sont limitrophes de la France ?' }],
      points_total: 15,
      difficulty_weight: 4,
      is_active: true,
      usage_count: 3
    },
    {
      id: 'question:3',
      type: 'true_false',
      theme_id: 'theme:histoire',
      theme_name: 'Histoire',
      level_id: 'level:intermediate',
      level_name: 'Intermédiaire',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'La Révolution française a eu lieu en 1789.' }],
      points_total: 10,
      difficulty_weight: 2,
      is_active: true,
      usage_count: 8
    },
    {
      id: 'question:4',
      type: 'matching',
      theme_id: 'theme:mathematiques',
      theme_name: 'Mathématiques',
      level_id: 'level:advanced',
      level_name: 'Avancé',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'Associez chaque opération à son résultat' }],
      points_total: 20,
      difficulty_weight: 6,
      is_active: true,
      usage_count: 2
    },
    {
      id: 'question:5',
      type: 'open_long',
      theme_id: 'theme:francais',
      theme_name: 'Français',
      level_id: 'level:advanced',
      level_name: 'Avancé',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'Analysez le personnage principal de ce texte.' }],
      points_total: 30,
      difficulty_weight: 8,
      is_active: true,
      usage_count: 1
    },
    {
      id: 'question:6',
      type: 'ordering',
      theme_id: 'theme:sciences',
      theme_name: 'Sciences',
      level_id: 'level:intermediate',
      level_name: 'Intermédiaire',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'Classez ces planètes par ordre de distance au Soleil' }],
      points_total: 15,
      difficulty_weight: 5,
      is_active: true,
      usage_count: 4
    },
  ];

  // Filter questions by theme name (case-insensitive, accent-insensitive comparison)
  const normalizeString = (str: string) => 
    str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

  const normalizedSlug = normalizeString(themeSlug || '');
  
  const questions = allQuestions.filter(q => 
    normalizeString(q.theme_name) === normalizedSlug
  );

  const themes = [
    { id: 'theme:geographie', name: 'Géographie' },
    { id: 'theme:mathematiques', name: 'Mathématiques' },
    { id: 'theme:histoire', name: 'Histoire' },
    { id: 'theme:sciences', name: 'Sciences' },
    { id: 'theme:francais', name: 'Français' },
  ];

  const levels = [
    { id: 'level:debutant', name: 'Débutant' },
    { id: 'level:intermediate', name: 'Intermédiaire' },
    { id: 'level:advanced', name: 'Avancé' },
    { id: 'level:expert', name: 'Expert' },
  ];

  // Find the actual theme info
  const currentTheme = themes.find(t => normalizeString(t.name) === normalizedSlug);

  return {
    questions,
    themes,
    levels,
    currentTheme: currentTheme || { id: '', name: themeName },
    themeSlug
  };
};
