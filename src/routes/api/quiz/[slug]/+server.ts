import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    // Récupérer le quiz par slug
    const quizResult = await db.query<any[]>(
      'SELECT * FROM quiz WHERE slug = $slug AND isActive = true',
      { slug: params.slug }
    );

    const quiz = (quizResult[0] as any[])?.[0];

    if (!quiz) {
      return json({ message: 'Quiz non trouvé' }, { status: 404 });
    }

    // Récupérer les questions du quiz
    const questionsResult = await db.query(
      'SELECT * FROM question WHERE quizId = $quizId AND isActive = true ORDER BY order ASC',
      { quizId: quiz.id }
    );

    const questions = questionsResult[0] || [];

    return json({ 
      quiz,
      questions 
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
