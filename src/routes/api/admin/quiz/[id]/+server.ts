import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    
    const result = await db.query<any[]>(
      'SELECT * FROM type::thing("quiz", $id)',
      { id: params.id }
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
    const { title, description, slug, coverImage, isActive, maxQuestions, matiere_id, theme_ids } = data;

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
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (maxQuestions !== undefined) updateData.maxQuestions = maxQuestions > 0 ? maxQuestions : null;
    
    // matiere_id doit être traité avec une requête séparée car c'est un record
    let recordUpdates = '';
    if (matiere_id !== undefined) {
      if (matiere_id && matiere_id !== 'null') {
        const cleanMatiereId = matiere_id.includes(':') ? matiere_id.split(':')[1] : matiere_id;
        recordUpdates += `, matiere_id = type::thing("matiere", "${cleanMatiereId}")`;
      } else {
        recordUpdates += ', matiere_id = NONE';
      }
    }
    
    // theme_ids - tableau de records
    if (theme_ids !== undefined) {
      if (Array.isArray(theme_ids) && theme_ids.length > 0) {
        const themeRecords = theme_ids.map(tid => {
          const cleanId = tid.includes(':') ? tid.split(':')[1] : tid;
          return `type::thing("theme", "${cleanId}")`;
        }).join(', ');
        recordUpdates += `, theme_ids = [${themeRecords}]`;
      } else {
        recordUpdates += ', theme_ids = NONE';
      }
    }

    // Construire les champs à mettre à jour
    const updateFields = Object.entries(updateData)
      .map(([key, value]) => {
        if (typeof value === 'string') return `${key} = "${value}"`;
        if (typeof value === 'boolean') return `${key} = ${value}`;
        if (value === null) return `${key} = NONE`;
        return `${key} = ${value}`;
      })
      .join(', ');

    const result = await db.query<any[]>(
      `UPDATE quiz:${params.id} SET ${updateFields}${recordUpdates} RETURN AFTER`
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

    // Note: Les questions ne sont plus supprimées avec le quiz
    // car elles sont liées par thème et peuvent être partagées entre plusieurs quizs

    // Supprimer le quiz
    await db.delete(`quiz:${params.id}`);

    return json({ success: true });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
