import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Récupérer les questions qui ont des images
    const questionsWithMedia = await db.query(`
      SELECT id, question, imageUrl, imageCaption, createdAt 
      FROM question 
      WHERE imageUrl != NONE AND imageUrl != ''
      ORDER BY createdAt DESC
    `);
    
    const rawQuestions = (questionsWithMedia[0] as any[]) || [];
    
    // Formater comme médias
    const medias = rawQuestions.map((q, idx) => ({
      id: `media:${idx + 1}`,
      title: q.imageCaption || q.question?.substring(0, 50) || 'Image sans titre',
      type: 'image',
      url: q.imageUrl,
      size: 'N/A',
      created_at: q.createdAt,
      question_id: q.id?.toString()
    }));

    return {
      medias
    };
  } catch (error) {
    console.error('Error loading medias:', error);
    return {
      medias: []
    };
  }
};
