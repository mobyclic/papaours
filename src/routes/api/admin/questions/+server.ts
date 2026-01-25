import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer toutes les questions (avec filtre optionnel par quiz)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const quizId = url.searchParams.get('quiz');
    
    let result;
    if (quizId) {
      // Utiliser type::thing pour comparer avec un record<quiz>
      result = await db.query(
        'SELECT * FROM question WHERE quizId = type::thing("quiz", $quizId) ORDER BY order ASC, createdAt DESC',
        { quizId }
      );
    } else {
      result = await db.query('SELECT * FROM question ORDER BY order ASC, createdAt DESC');
    }
    
    return json(result[0] || []);
  } catch (error) {
    console.error('Get questions error:', error);
    return json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
};

// POST - Créer une nouvelle question
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const db = await connectDB();
    
    const questionData: any = {
      question: data.question,
      family: data.family,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      imageUrl: data.imageUrl || null,
      imageCaption: data.imageCaption || null,
      difficulty: data.difficulty || 'medium',
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order || 0
    };
    
    // Ajouter quizId si fourni
    if (data.quizId) {
      questionData.quizId = data.quizId;
    }
    
    const question = await db.create('question', questionData);

    return json(question);
  } catch (error) {
    console.error('Create question error:', error);
    return json({ error: 'Failed to create question' }, { status: 500 });
  }
};
