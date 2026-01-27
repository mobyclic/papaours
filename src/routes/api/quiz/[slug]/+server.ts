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
  const optionsWithIndex: { text: string; originalIndex: number }[] = question.options.map((opt: string, idx: number) => ({
    text: opt,
    originalIndex: idx
  }));
  
  // Mélanger
  const shuffledOptions = shuffleArray(optionsWithIndex);
  
  // Trouver le nouvel index de la bonne réponse
  const newCorrectAnswer = shuffledOptions.findIndex(
    (opt) => opt.originalIndex === question.correctAnswer
  );
  
  return {
    ...question,
    options: shuffledOptions.map((opt) => opt.text),
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

    // Récupérer les questions correspondant aux thèmes du quiz (prioritaire) ou à la matière
    let questionsResult;
    
    if (quiz.theme_ids && Array.isArray(quiz.theme_ids) && quiz.theme_ids.length > 0) {
      // Sélectionner par thèmes du quiz
      const themeConditions = quiz.theme_ids.map((tid: any) => {
        const cleanId = tid.toString().split(':')[1] || tid.toString();
        return `type::thing("theme", "${cleanId}") INSIDE theme_ids`;
      }).join(' OR ');
      
      questionsResult = await db.query(
        `SELECT * FROM question WHERE (${themeConditions}) AND isActive = true ORDER BY rand()`
      );
    } else if (quiz.matiere_id) {
      // Fallback: sélectionner par matière
      const cleanMatiereId = quiz.matiere_id.toString().split(':')[1] || quiz.matiere_id.toString();
      questionsResult = await db.query(
        'SELECT * FROM question WHERE matiere_id = type::thing("matiere", $matiereId) AND isActive = true ORDER BY rand()',
        { matiereId: cleanMatiereId }
      );
    } else {
      questionsResult = await db.query(
        'SELECT * FROM question WHERE isActive = true ORDER BY rand()'
      );
    }

    let questions = questionsResult[0] || [];
    
    // Mélanger les questions (toujours activé maintenant)
    questions = shuffleArray(questions as any[]);
    
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
