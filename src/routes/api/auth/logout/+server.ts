import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    
    if (sessionToken) {
      const db = await connectDB();
      // Supprimer la session de la base de données
      await db.query('DELETE session WHERE session_token = $sessionToken', { sessionToken });
    }

    // Supprimer le cookie
    cookies.delete('session', { path: '/' });

    return json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    // Même en cas d'erreur, on supprime le cookie
    cookies.delete('session', { path: '/' });
    return json({ success: true });
  }
};
