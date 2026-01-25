import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    const theme = url.searchParams.get('theme');
    const levelParam = url.searchParams.get('level');
    const level = levelParam ? Number(levelParam) : undefined;

    let query = 'SELECT * FROM quiz WHERE isActive = true';
    const params: Record<string, unknown> = {};

    if (theme) {
      query += ' AND theme = $theme';
      params.theme = theme;
    }
    if (typeof level === 'number' && !Number.isNaN(level)) {
      query += ' AND level = $level';
      params.level = level;
    }

    query += ' ORDER BY theme ASC, level ASC, order ASC';

    const result = await db.query<any[]>(query, params);
    const quizzes = (result[0] as any[]) || [];

    return json({ quizzes });
  } catch (error) {
    console.error('List quizzes error:', error);
    return json({ quizzes: [] });
  }
};
