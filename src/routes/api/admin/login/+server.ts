import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ message: 'Email et mot de passe requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Récupérer l'admin depuis la DB
    const result = await db.query<any[]>(
      'SELECT * FROM admin WHERE email = $email AND password = $password',
      { email, password }
    );

    // result[0] est déjà le tableau des résultats
    const admins = result[0] as any[];

    if (!admins || admins.length === 0) {
      return json({ message: 'Identifiants incorrects' }, { status: 401 });
    }

    const admin = admins[0];

    // En production, utiliser JWT et hasher les mots de passe!
    return json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
