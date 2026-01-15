import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query<any[]>(
      'SELECT * FROM quiz WHERE isHomepage = true AND isActive = true LIMIT 1'
    );

    const quiz = (result[0] as any[])?.[0];

    if (!quiz) {
      return json({ message: 'Aucun quiz défini pour la homepage' }, { status: 404 });
    }

    return json({ quiz });
  } catch (error) {
    console.error('Get homepage quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
