import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return json({ message: 'userId requis' }, { status: 400 });
    }

    const result = await db.query<any[]>(
      'SELECT * FROM quiz_result WHERE userId = $userId ORDER BY completedAt DESC',
      { userId }
    );

    const results = (result[0] as any[]) || [];
    return json({ results });
  } catch (error) {
    console.error('User results error:', error);
    return json({ results: [] });
  }
};
