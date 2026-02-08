import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const db = await connectDB();
  const { id } = params;
  
  const cleanId = id.includes(':') ? id.split(':')[1] : id;

  try {
    // Récupérer la question
    const [questionResult] = await db.query<[any[]]>(`
      SELECT 
        *,
        matiere_id.name as matiere_name,
        matiere_id.code as matiere_code
      FROM type::thing("question", $id)
    `, { id: cleanId });

    const question = questionResult?.[0];
    if (!question) {
      throw error(404, 'Question non trouvée');
    }

    // Sérialiser les RecordIds
    const serializedQuestion = {
      id: question.id?.toString() || question.id,
      question: question.question || '',
      questionType: question.questionType || 'qcm',
      difficulty: question.difficulty || 'medium',
      isActive: question.isActive ?? true,
      explanation: question.explanation || '',
      imageUrl: question.imageUrl,
      imageCaption: question.imageCaption,
      // QCM
      options: question.options || [],
      optionImages: question.optionImages || [],
      correctAnswer: question.correctAnswer,
      correctAnswers: question.correctAnswers || [],
      answers: question.answers || [],
      // Fill blank
      textWithBlanks: question.textWithBlanks || '',
      // Matching
      leftItems: question.leftItems || [],
      rightItems: question.rightItems || [],
      correctMatches: question.correctMatches || {},
      // Ordering
      items: question.items || [],
      correctOrder: question.correctOrder || [],
      // Open
      sampleAnswers: question.sampleAnswers || [],
      expectedKeywords: question.expectedKeywords || [],
      // Map Labels
      svgContent: question.svgContent || '',
      expectedAnswers: question.expectedAnswers || [],
      // Metadata
      metadata: question.metadata || {},
      matiere_id: question.matiere_id?.toString(),
      matiere_name: question.matiere_name,
      matiere_code: question.matiere_code,
      theme_ids: (question.theme_ids || []).map((t: any) => t?.toString()),
      grade_difficulties: (question.grade_difficulties || []).map((gd: any) => ({
        grade_id: gd.grade_id?.toString() || gd.grade_id,
        difficulty: gd.difficulty,
        points: gd.points
      })),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };

    // Charger les matières pour le sélecteur
    const [matieres] = await db.query<[any[]]>(`
      SELECT id, code, name, icon FROM subject WHERE is_active = true ORDER BY name ASC
    `);

    // Charger les thèmes
    const [themes] = await db.query<[any[]]>(`
      SELECT id, name, subject.code as subject_code FROM theme WHERE is_active = true ORDER BY name ASC
    `);

    // Charger les grades
    const [grades] = await db.query<[any[]]>(`
      SELECT id, name, code, order FROM grade ORDER BY \`order\` ASC, name ASC
    `);

    // Stats de la question (à enrichir plus tard)
    const stats = {
      views: 0,
      attempts: 0,
      correctAttempts: 0,
      successRate: 0
    };

    return {
      question: serializedQuestion,
      matieres: (matieres || []).map((m: any) => ({
        id: m.id?.toString(),
        code: m.code,
        name: m.name,
        icon: m.icon
      })),
      themes: (themes || []).map((t: any) => ({
        id: t.id?.toString(),
        name: t.name,
        subject_code: t.subject_code
      })),
      grades: (grades || []).map((g: any) => ({
        id: g.id?.toString(),
        name: g.name,
        code: g.code
      })),
      stats
    };
  } catch (e) {
    console.error('Erreur chargement question:', e);
    if ((e as any).status === 404) throw e;
    throw error(500, 'Erreur lors du chargement de la question');
  }
};
