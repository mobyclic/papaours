import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    // Le pseudo est passé via le champ "email" depuis le formulaire
    const pseudo = email;

    if (!pseudo) {
      return json({ message: 'Pseudo requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Chercher par pseudo OU par email (compatibilité)
    const result = await db.query<any[]>(
      'SELECT * FROM user WHERE pseudo = $pseudo OR email = $pseudo',
      { pseudo }
    );

    const users = result[0] as any[];

    if (!users || users.length === 0) {
      return json({ message: "Pseudo introuvable. Tu n'as pas encore de compte ?" }, { status: 404 });
    }

    const user = users[0];

    return json({
      success: true,
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        name: user.name,
        nom: user.nom,
        prenom: user.prenom,
        classe: user.classe,
        is_admin: !!user.is_admin
      }
    });
  } catch (error) {
    console.error('Auth login error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
