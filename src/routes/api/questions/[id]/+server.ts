import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { connectDB } from "$lib/db";
import { RecordId } from "surrealdb";

// Helper to serialize RecordId and Date objects
function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

// GET - Get a single question
export const GET = async ({ params }: RequestEvent) => {
  const { id } = params;
  
  try {
    const db = await connectDB();
    
    // Parse the ID - might be "question:xxx" or just "xxx"
    const cleanId = id?.includes(':') ? id.split(':')[1] : id;
    
    const result = await db.query<any[]>(
      `SELECT * FROM type::thing("question", $id)`,
      { id: cleanId }
    );
    
    const question = result[0]?.[0];
    
    if (!question) {
      return error(404, { message: 'Question non trouvée' });
    }

    return json(serialize(question));
  } catch (e) {
    console.error('Error fetching question:', e);
    return error(500, { message: 'Erreur lors de la récupération' });
  }
};

// PUT - Update a question
export const PUT = async ({ params, request }: RequestEvent) => {
  const { id } = params;
  
  try {
    const data = await request.json();
    const db = await connectDB();
    
    // Parse the ID
    const cleanId = id?.includes(':') ? id.split(':')[1] : id;

    // Validate required fields
    if (!data.question?.trim()) {
      return error(400, { message: 'Question text requis' });
    }
    if (!data.matiere_id) {
      return error(400, { message: 'Matière requise' });
    }
    if (!data.options || data.options.length < 2) {
      return error(400, { message: 'Au moins 2 options requises' });
    }
    if (!data.class_difficulties || data.class_difficulties.length === 0) {
      return error(400, { message: 'Au moins un niveau scolaire avec difficulté requis' });
    }

    // Build the update query
    // We need to handle the RecordId conversion for matiere_id, theme_ids
    const matiereIdClean = data.matiere_id?.includes(':') 
      ? data.matiere_id.split(':')[1] 
      : data.matiere_id;

    // Build theme_ids array for SurrealQL
    const themeIdsClauses = (data.theme_ids || []).map((tid: string) => {
      const clean = tid.includes(':') ? tid.split(':')[1] : tid;
      return `type::thing("theme", "${clean}")`;
    });
    const themeIdsArray = themeIdsClauses.length > 0 
      ? `[${themeIdsClauses.join(', ')}]` 
      : '[]';

    // Build class_difficulties array - convert classe_id to RecordId
    const classDifficultiesFormatted = (data.class_difficulties || []).map((cd: any) => {
      const classeIdClean = cd.classe_id?.includes(':') 
        ? cd.classe_id.split(':')[1] 
        : cd.classe_id;
      return {
        classe_id: classeIdClean, // Will be converted to RecordId in query
        difficulty: cd.difficulty || 'medium',
        points: cd.points ?? 20
      };
    });

    // Build the class_difficulties SurrealQL array
    const classDiffClauses = classDifficultiesFormatted.map((cd: any) => 
      `{ classe_id: type::thing("classe", "${cd.classe_id}"), difficulty: "${cd.difficulty}", points: ${cd.points} }`
    );
    const classDiffArray = `[${classDiffClauses.join(', ')}]`;

    // Update query with class_difficulties
    const updateQuery = `
      UPDATE type::thing("question", $id) SET
        question = $question,
        explanation = $explanation,
        options = $options,
        correctAnswer = $correctAnswer,
        isActive = $isActive,
        matiere_id = type::thing("matiere", $matiereId),
        theme_ids = ${themeIdsArray},
        class_difficulties = ${classDiffArray},
        updatedAt = time::now()
    `;

    const result = await db.query<any[]>(updateQuery, {
      id: cleanId,
      question: data.question,
      explanation: data.explanation || '',
      options: data.options,
      correctAnswer: data.correctAnswer ?? 0,
      isActive: data.isActive ?? true,
      matiereId: matiereIdClean
    });

    const updatedQuestion = result[0]?.[0];
    
    if (!updatedQuestion) {
      return error(404, { message: 'Question non trouvée' });
    }

    console.log('Updated question:', cleanId);

    return json(serialize(updatedQuestion));
  } catch (e) {
    console.error('Error updating question:', e);
    return error(500, { message: 'Erreur lors de la mise à jour: ' + (e as Error).message });
  }
};

// DELETE - Delete a question
export const DELETE = async ({ params }: RequestEvent) => {
  const { id } = params;

  try {
    const db = await connectDB();
    
    // Parse the ID
    const cleanId = id?.includes(':') ? id.split(':')[1] : id;
    
    await db.query(
      `DELETE type::thing("question", $id)`,
      { id: cleanId }
    );

    console.log('Deleted question:', cleanId);

    return json({ success: true, message: 'Question supprimée' });
  } catch (e) {
    console.error('Error deleting question:', e);
    return error(500, { message: 'Erreur lors de la suppression' });
  }
};

// PATCH - Partial update (for auto-save of specific fields)
export const PATCH = async ({ params, request }: RequestEvent) => {
  const { id } = params;
  
  try {
    const data = await request.json();
    const db = await connectDB();
    
    // Parse the ID
    const cleanId = id?.includes(':') ? id.split(':')[1] : id;

    const updates: string[] = ['updatedAt = time::now()'];
    const queryParams: Record<string, any> = { id: cleanId };

    // Handle matiere_id update
    if (data.matiere_id !== undefined) {
      const matiereIdClean = data.matiere_id?.includes(':') 
        ? data.matiere_id.split(':')[1] 
        : data.matiere_id;
      if (matiereIdClean) {
        updates.push(`matiere_id = type::thing("matiere", "${matiereIdClean}")`);
      }
    }

    // Handle theme_ids update
    if (data.theme_ids !== undefined) {
      const themeIdsClauses = (data.theme_ids || []).map((tid: string) => {
        const clean = tid.includes(':') ? tid.split(':')[1] : tid;
        return `type::thing("theme", "${clean}")`;
      });
      const themeIdsArray = themeIdsClauses.length > 0 
        ? `[${themeIdsClauses.join(', ')}]` 
        : '[]';
      updates.push(`theme_ids = ${themeIdsArray}`);
    }

    // Handle class_difficulties update
    if (data.class_difficulties !== undefined) {
      const classDifficultiesFormatted = (data.class_difficulties || []).map((cd: any) => {
        const classeIdClean = cd.classe_id?.includes(':') 
          ? cd.classe_id.split(':')[1] 
          : cd.classe_id;
        return {
          classe_id: classeIdClean,
          difficulty: cd.difficulty || 'medium',
          points: cd.points ?? 20
        };
      });

      const classDiffClauses = classDifficultiesFormatted.map((cd: any) => 
        `{ classe_id: type::thing("classe", "${cd.classe_id}"), difficulty: "${cd.difficulty}", points: ${cd.points} }`
      );
      const classDiffArray = classDiffClauses.length > 0 ? `[${classDiffClauses.join(', ')}]` : '[]';
      updates.push(`class_difficulties = ${classDiffArray}`);
    }

    if (updates.length === 1) {
      // Only updatedAt, nothing to update
      return json({ success: true, message: 'Rien à mettre à jour' });
    }

    const updateQuery = `UPDATE type::thing("question", $id) SET ${updates.join(', ')}`;
    
    const result = await db.query<any[]>(updateQuery, queryParams);
    const updatedQuestion = result[0]?.[0];
    
    if (!updatedQuestion) {
      return error(404, { message: 'Question non trouvée' });
    }

    console.log('Patched question:', cleanId, 'fields:', updates.map(u => u.split('=')[0].trim()));

    return json({ success: true, question: serialize(updatedQuestion) });
  } catch (e) {
    console.error('Error patching question:', e);
    return error(500, { message: 'Erreur lors de la mise à jour: ' + (e as Error).message });
  }
};
