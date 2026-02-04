import type { PageServerLoad, Actions } from './$types';
import { connectDB } from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const { code, id } = params;
  
  // Extract clean ID (remove "question:" prefix if present)
  const cleanId = id.includes(':') ? id.split(':')[1] : id;
  
  try {
    const db = await connectDB();
    
    // Récupérer la question
    const questionResult = await db.query<any[]>(`
      SELECT 
        *,
        theme.name AS theme_name,
        theme.slug AS theme_slug,
        subject.name AS subject_name,
        subject.code AS subject_code
      FROM type::thing("question", $cleanId)
    `, { cleanId });
    
    const questionData = (questionResult[0] as any[])?.[0];
    
    if (!questionData) {
      return redirect(302, `/admin/subjects/${code}/questions`);
    }
    
    // Vérifier que la question appartient à la bonne matière
    if (questionData.subject_code && questionData.subject_code !== code) {
      return redirect(302, `/admin/subjects/${questionData.subject_code}/questions/${id}`);
    }
    
    // Serializer les données
    const question = {
      id: questionData.id?.toString(),
      question: questionData.question,
      type: questionData.type || questionData.questionType,
      difficulty: questionData.difficulty,
      is_active: questionData.is_active ?? questionData.isActive ?? true,
      explanation: questionData.explanation,
      image_url: questionData.imageUrl || questionData.image_url,
      image_caption: questionData.imageCaption || questionData.image_caption,
      // QCM fields
      options: questionData.options,
      option_images: questionData.optionImages || questionData.option_images,
      correct_answer: questionData.correctAnswer ?? questionData.correct_answer,
      correct_answers: questionData.correctAnswers || questionData.correct_answers,
      // True/False
      answers: questionData.answers,
      // Fill blank
      text_with_blanks: questionData.textWithBlanks || questionData.text_with_blanks,
      // Matching
      left_items: questionData.leftItems || questionData.left_items,
      right_items: questionData.rightItems || questionData.right_items,
      correct_matches: questionData.correctMatches || questionData.correct_matches,
      // Ordering
      items: questionData.items,
      correct_order: questionData.correctOrder || questionData.correct_order,
      // Open
      sample_answers: questionData.sampleAnswers || questionData.sample_answers,
      expected_keywords: questionData.expectedKeywords || questionData.expected_keywords,
      // Metadata
      metadata: questionData.metadata,
      theme_name: questionData.theme_name,
      theme_slug: questionData.theme_slug,
      subject_name: questionData.subject_name,
      created_at: questionData.created_at?.toISOString?.() || questionData.createdAt?.toISOString?.() || null,
      updated_at: questionData.updated_at?.toISOString?.() || questionData.updatedAt?.toISOString?.() || null
    };
    
    // Récupérer les thèmes disponibles pour cette matière
    const themesResult = await db.query<any[]>(`
      SELECT id, name, slug FROM theme WHERE subject.code = $code ORDER BY name
    `, { code });
    
    const themes = (themesResult[0] as any[])?.map((t: any) => ({
      id: t.id?.toString(),
      name: t.name,
      slug: t.slug
    })) || [];
    
    return {
      question,
      themes
    };
  } catch (err) {
    console.error('Error loading question:', err);
    return redirect(302, `/admin/subjects/${code}/questions`);
  }
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const { code, id } = params;
    const cleanId = id.includes(':') ? id.split(':')[1] : id;
    const formData = await request.formData();
    
    const questionText = formData.get('question') as string;
    const type = formData.get('type') as string;
    const difficulty = parseInt(formData.get('difficulty') as string) || 1;
    const is_active = formData.get('is_active') === 'on';
    const explanation = formData.get('explanation') as string;
    const theme_slug = formData.get('theme_slug') as string;
    
    if (!questionText?.trim()) {
      return fail(400, { error: 'La question est requise' });
    }
    
    try {
      const db = await connectDB();
      
      // Construire la query de mise à jour
      let updateFields = `
        question = $question,
        questionType = $type,
        difficulty = $difficulty,
        isActive = $is_active,
        explanation = $explanation,
        updatedAt = time::now()
      `;
      
      const queryParams: Record<string, any> = {
        cleanId,
        question: questionText.trim(),
        type,
        difficulty,
        is_active,
        explanation: explanation?.trim() || null
      };
      
      // Mettre à jour le thème si fourni
      if (theme_slug) {
        updateFields += `, theme = (SELECT id FROM theme WHERE slug = $theme_slug LIMIT 1)[0]`;
        queryParams.theme_slug = theme_slug;
      }
      
      await db.query(`
        UPDATE type::thing("question", $cleanId) SET ${updateFields}
      `, queryParams);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating question:', err);
      return fail(500, { error: 'Erreur lors de la mise à jour' });
    }
  },
  
  delete: async ({ params }) => {
    const { code, id } = params;
    const cleanId = id.includes(':') ? id.split(':')[1] : id;
    
    try {
      const db = await connectDB();
      
      await db.query(`
        DELETE type::thing("question", $cleanId)
      `, { cleanId });
      
      return redirect(302, `/admin/subjects/${code}/questions`);
    } catch (err) {
      console.error('Error deleting question:', err);
      return fail(500, { error: 'Erreur lors de la suppression' });
    }
  }
};
