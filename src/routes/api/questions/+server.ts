import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

// GET - List all questions
export const GET = async ({ url }: RequestEvent) => {
  // Parse query params for filtering
  const themeId = url.searchParams.get('theme');
  const levelId = url.searchParams.get('level');
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('q');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  // TODO: Replace with actual database query
  // const db = await getSurrealDB();
  // let query = 'SELECT * FROM question';
  // Add filters...

  // Mock data
  const questions = [
    {
      id: 'question:1',
      type: 'qcm',
      theme_id: 'theme:cinema-technique',
      theme_name: 'Technique cinéma',
      level_id: 'level:intermediate',
      level_name: 'Intermédiaire',
      default_language: 'fr',
      translations: [{ language: 'fr', title: 'Question test 1' }],
      points_total: 10,
      difficulty_weight: 5,
      is_active: true,
      usage_count: 3
    }
  ];

  return json({
    questions,
    pagination: {
      page,
      limit,
      total: questions.length,
      totalPages: Math.ceil(questions.length / limit)
    }
  });
};

// POST - Create a new question
export const POST = async ({ request }: RequestEvent) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.type) {
      return error(400, { message: 'Type de question requis' });
    }
    if (!data.theme_id) {
      return error(400, { message: 'Thème requis' });
    }
    if (!data.level_id) {
      return error(400, { message: 'Niveau requis' });
    }
    if (!data.translations || data.translations.length === 0) {
      return error(400, { message: 'Au moins une traduction requise' });
    }

    // TODO: Save to database
    // const db = await getSurrealDB();
    // const result = await db.create('question', {
    //   type: data.type,
    //   theme_id: data.theme_id,
    //   level_id: data.level_id,
    //   ...
    // });

    // Mock response
    const newQuestion = {
      id: 'question:' + crypto.randomUUID().split('-')[0],
      ...data,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating question:', newQuestion);

    return json(newQuestion, { status: 201 });
  } catch (e) {
    console.error('Error creating question:', e);
    return error(500, { message: 'Erreur lors de la création' });
  }
};
