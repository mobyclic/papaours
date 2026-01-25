import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    const result = await db.query<any[]>('SELECT id, email, name, is_admin, createdAt FROM user');
    const users = (result[0] as any[]) || [];
    return json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return json({ users: [] });
  }
};
