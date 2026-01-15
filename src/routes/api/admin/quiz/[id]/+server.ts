import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    const result = await db.query<any[]>(
      'SELECT * FROM $id',
      { id: `quiz:${params.id}` }
    );

    const quiz = (result[0] as any[])?.[0];

    if (!quiz) {
      return json({ message: 'Quiz non trouvé' }, { status: 404 });
    }

    return json({ quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { title, description, slug, questionType, coverImage, isActive, order } = data;

    const db = await connectDB();

    // Vérifier si le slug existe déjà pour un autre quiz
    if (slug) {
      const existing = await db.query<any[]>(
        'SELECT * FROM quiz WHERE slug = $slug AND id != $id',
        { slug, id: `quiz:${params.id}` }
      );

      if ((existing[0] as any[])?.length > 0) {
        return json({ message: 'Ce slug existe déjà' }, { status: 400 });
      }
    }

    // Mise à jour
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;
    if (questionType !== undefined) updateData.questionType = questionType;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const result = await db.query<any[]>(
      'UPDATE $id MERGE $data RETURN AFTER',
      { id: `quiz:${params.id}`, data: updateData }
    );

    const quiz = (result[0] as any[])?.[0];

    return json({ success: true, quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { action } = await request.json();

    if (action !== 'setHomepage') {
      return json({ message: 'Action non supportée' }, { status: 400 });
    }

    const db = await connectDB();

    // Retirer isHomepage de tous les quiz
    await db.query('UPDATE quiz SET isHomepage = false');

    // Définir ce quiz comme homepage
    const result = await db.query<any[]>(
      'UPDATE $id SET isHomepage = true RETURN AFTER',
      { id: `quiz:${params.id}` }
    );

    const quiz = (result[0] as any[])?.[0];

    return json({ success: true, quiz });
  } catch (error) {
    console.error('Set homepage error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();

    // Supprimer les questions associées
    await db.query(
      'DELETE FROM question WHERE quizId = $quizId',
      { quizId: `quiz:${params.id}` }
    );

    // Supprimer le quiz
    await db.delete(`quiz:${params.id}`);

    return json({ success: true });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
