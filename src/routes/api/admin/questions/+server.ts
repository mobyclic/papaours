import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer toutes les questions (avec filtre optionnel par thème ou matière)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const themeId = url.searchParams.get('theme');
    const matiereId = url.searchParams.get('matiere');
    
    let result;
    if (themeId) {
      // Filtrer par thème (le thème est dans theme_ids)
      const cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
      result = await db.query(
        'SELECT * FROM question WHERE type::thing("theme", $themeId) INSIDE theme_ids ORDER BY pos ASC, createdAt DESC',
        { themeId: cleanThemeId }
      );
    } else if (matiereId) {
      // Filtrer par matière
      const cleanMatiereId = matiereId.includes(':') ? matiereId.split(':')[1] : matiereId;
      result = await db.query(
        'SELECT * FROM question WHERE matiere_id = type::thing("subject", $matiereId) ORDER BY pos ASC, createdAt DESC',
        { matiereId: cleanMatiereId }
      );
    } else {
      result = await db.query('SELECT * FROM question ORDER BY pos ASC, createdAt DESC');
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
      optionImages: data.optionImages || [],
      questionType: data.questionType || 'qcm',
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      imageUrl: data.imageUrl || null,
      imageCaption: data.imageCaption || null,
      difficulty: data.difficulty || 'medium',
      isActive: data.isActive !== undefined ? data.isActive : true,
      pos: data.pos || 0
    };
    
    // Ajouter matiere_id et theme_ids si fournis
    if (data.matiere_id) {
      questionData.matiere_id = data.matiere_id;
    }
    if (data.theme_ids && Array.isArray(data.theme_ids)) {
      questionData.theme_ids = data.theme_ids;
    }
    
    // Metadata pour options de validation avancées (questions ouvertes)
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      questionData.metadata = data.metadata;
    }
    
    // Champs spécifiques aux questions ouvertes
    if (data.sampleAnswers) {
      questionData.sampleAnswers = data.sampleAnswers;
    }
    if (data.expectedKeywords) {
      questionData.expectedKeywords = data.expectedKeywords;
    }
    
    // Champs spécifiques aux questions carte (map_labels)
    if (data.svgContent) {
      questionData.svgContent = data.svgContent;
    }
    if (data.expectedAnswers && Array.isArray(data.expectedAnswers)) {
      questionData.expectedAnswers = data.expectedAnswers;
    }
    
    // Champs texte à trous
    if (data.textWithBlanks) {
      questionData.textWithBlanks = data.textWithBlanks;
    }
    if (data.correctAnswers && Array.isArray(data.correctAnswers)) {
      questionData.correctAnswers = data.correctAnswers;
    }
    
    const question = await db.create('question', questionData);

    return json(question);
  } catch (error) {
    console.error('Create question error:', error);
    return json({ error: 'Failed to create question' }, { status: 500 });
  }
};
