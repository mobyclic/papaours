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
      // Multi-grade difficulties
      grade_difficulties: questionData.grade_difficulties || [],
      // Multi-themes
      theme_ids: (questionData.theme_ids || []).map((t: any) => t?.toString?.() || t),
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
    
    // Récupérer les grades disponibles
    const gradesResult = await db.query<any[]>(`
      SELECT id, name, code FROM grade
    `);
    
    const grades = (gradesResult[0] as any[])?.map((g: any) => ({
      id: g.id?.toString(),
      name: g.name,
      code: g.code
    })) || [];
    
    return {
      question,
      themes,
      grades
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
    const is_active = formData.get('is_active') === 'on';
    const explanation = formData.get('explanation') as string;
    
    // Récupérer les thèmes multiples
    const themeIdsJson = formData.get('theme_ids') as string;
    const themeIds: string[] = themeIdsJson ? JSON.parse(themeIdsJson) : [];
    
    // Récupérer les difficultés par grade
    const gradeDifficultiesJson = formData.get('grade_difficulties') as string;
    const gradeDifficulties: Array<{grade_id: string, difficulty: number, points: number}> = 
      gradeDifficultiesJson ? JSON.parse(gradeDifficultiesJson) : [];
    
    if (!questionText?.trim()) {
      return fail(400, { error: 'La question est requise' });
    }
    
    try {
      const db = await connectDB();
      
      // Construire les références aux thèmes
      const themeRefs = themeIds.map(id => {
        const cleanThemeId = id.includes(':') ? id.split(':')[1] : id;
        return `type::thing("theme", "${cleanThemeId}")`;
      }).join(', ');
      
      // Construire la query de mise à jour
      let updateQuery = `
        UPDATE type::thing("question", $cleanId) SET
          question = $question,
          isActive = $is_active,
          explanation = $explanation,
          grade_difficulties = $grade_difficulties,
          theme_ids = [${themeRefs}],
          updatedAt = time::now()
      `;
      
      const queryParams: Record<string, any> = {
        cleanId,
        question: questionText.trim(),
        is_active,
        explanation: explanation?.trim() || null,
        grade_difficulties: gradeDifficulties
      };
      
      await db.query(updateQuery, queryParams);
      
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
