import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// PUT - Mettre à jour une question
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const db = await connectDB();
    
    const updated = await db.merge(params.id, {
      question: data.question,
      family: data.family,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      imageUrl: data.imageUrl || null,
      imageCaption: data.imageCaption || null,
      difficulty: data.difficulty,
      isActive: data.isActive,
      order: data.order,
      updatedAt: new Date().toISOString()
    });

    return json(updated);
  } catch (error) {
    console.error('Update question error:', error);
    return json({ error: 'Failed to update question' }, { status: 500 });
  }
};

// DELETE - Supprimer une question
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    await db.delete(params.id);
    
    return json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    return json({ error: 'Failed to delete question' }, { status: 500 });
  }
};
