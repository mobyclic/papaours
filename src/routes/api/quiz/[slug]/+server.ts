import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Mélange les options d'une question et met à jour correctAnswer
function shuffleQuestionOptions(question: any): any {
  if (!question.options || !Array.isArray(question.options)) {
    return question;
  }
  
  // Créer un tableau d'indices avec les options
  const optionsWithIndex = question.options.map((opt: string, idx: number) => ({
    text: opt,
    originalIndex: idx
  }));
  
  // Mélanger
  const shuffledOptions = shuffleArray(optionsWithIndex);
  
  // Trouver le nouvel index de la bonne réponse
  const newCorrectAnswer = shuffledOptions.findIndex(
    opt => opt.originalIndex === question.correctAnswer
  );
  
  return {
    ...question,
    options: shuffledOptions.map(opt => opt.text),
    correctAnswer: newCorrectAnswer
  };
}

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

    let questions = questionsResult[0] || [];
    
    // Mélanger les questions si l'option est activée
    if (quiz.shuffleQuestions) {
      questions = shuffleArray(questions as any[]);
    }
    
    // Limiter le nombre de questions si maxQuestions est défini
    if (quiz.maxQuestions && quiz.maxQuestions > 0) {
      questions = (questions as any[]).slice(0, quiz.maxQuestions);
    }
    
    // Mélanger les options de chaque question
    questions = (questions as any[]).map(shuffleQuestionOptions);

    return json({ 
      quiz,
      questions 
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
