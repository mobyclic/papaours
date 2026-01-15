import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query('SELECT * FROM quiz ORDER BY order ASC, createdAt DESC');
    const quiz = result[0] || [];

    return json({ quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { title, description, slug, questionType = 'qcm', coverImage, isActive = true } = data;

    if (!title || !slug) {
      return json({ message: 'Titre et slug requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier si le slug existe déjà
    const existing = await db.query<any[]>(
      'SELECT * FROM quiz WHERE slug = $slug',
      { slug }
    );

    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Créer le quiz
    const quiz = await db.create('quiz', {
      title,
      description: description || null,
      slug,
      questionType,
      coverImage: coverImage || null,
      isHomepage: false,
      isActive,
      order: 0
    });

    return json({ success: true, quiz: Array.isArray(quiz) ? quiz[0] : quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
