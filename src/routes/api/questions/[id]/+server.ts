import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

// GET - Get a single question
export const GET = async ({ params }: RequestEvent) => {
  const { id } = params;

  // TODO: Fetch from database
  // const db = await getSurrealDB();
  // const question = await db.select(`question:${id}`);

  // Mock data
  const question = {
    id: `question:${id}`,
    type: 'qcm',
    theme_id: 'theme:cinema-technique',
    theme_name: 'Technique cinéma',
    level_id: 'level:intermediate',
    level_name: 'Intermédiaire',
    default_language: 'fr',
    translations: [
      { language: 'fr', title: 'Question de test', hint: 'Un indice' }
    ],
    answers: [
      { id: '1', text: 'Réponse A', points: 10, is_correct: true, order: 1 },
      { id: '2', text: 'Réponse B', points: 0, is_correct: false, order: 2 },
    ],
    points_total: 10,
    difficulty_weight: 5,
    is_active: true,
    usage_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!question) {
    return error(404, { message: 'Question non trouvée' });
  }

  return json(question);
};

// PUT - Update a question
export const PUT = async ({ params, request }: RequestEvent) => {
  const { id } = params;
  
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

    // TODO: Update in database
    // const db = await getSurrealDB();
    // const result = await db.merge(`question:${id}`, {
    //   ...data,
    //   updated_at: new Date().toISOString()
    // });

    // Mock response
    const updatedQuestion = {
      id: `question:${id}`,
      ...data,
      updated_at: new Date().toISOString()
    };

    console.log('Updating question:', updatedQuestion);

    return json(updatedQuestion);
  } catch (e) {
    console.error('Error updating question:', e);
    return error(500, { message: 'Erreur lors de la mise à jour' });
  }
};

// DELETE - Delete a question
export const DELETE = async ({ params }: RequestEvent) => {
  const { id } = params;

  // TODO: Check if question is used in any quiz
  // If used, maybe soft delete or prevent deletion

  // TODO: Delete from database
  // const db = await getSurrealDB();
  // await db.delete(`question:${id}`);

  console.log('Deleting question:', id);

  return json({ success: true, message: 'Question supprimée' });
};
