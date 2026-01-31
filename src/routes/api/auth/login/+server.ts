import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Hash simple pour le mot de passe (doit correspondre à celui du signup)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kwizy_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { user_type = 'apprenant' } = body;

    const db = await connectDB();

    if (user_type === 'apprenant') {
      // ========== CONNEXION APPRENANT ==========
      const { pseudo, password_code } = body;

      if (!pseudo) {
        return json({ message: 'Pseudo requis' }, { status: 400 });
      }

      // Chercher par pseudo
      const result = await db.query<any[]>(
        `SELECT *, classe_id.name as classe_name FROM user WHERE pseudo = $pseudo`,
        { pseudo }
      );

      const users = result[0] as any[];

      if (!users || users.length === 0) {
        return json({ message: "Pseudo introuvable. Tu n'as pas encore de compte ?" }, { status: 404 });
      }

      const user = users[0];

      // Vérifier le code secret si défini
      if (user.password_code && user.password_code !== password_code) {
        return json({ message: 'Code secret incorrect' }, { status: 401 });
      }

      return json({
        success: true,
        user: {
          id: user.id?.toString() || user.id,
          pseudo: user.pseudo,
          email: user.email,
          name: user.name,
          nom: user.nom,
          prenom: user.prenom,
          classe: user.classe,
          classe_id: user.classe_id?.toString() || user.classe_id || null,
          classe_name: user.classe_name || null,
          theme_color: user.theme_color || 'gray',
          user_type: user.user_type || 'apprenant',
          tutor_id: user.tutor_id?.toString() || user.tutor_id || null,
          is_admin: !!user.is_admin
        }
      });

    } else if (user_type === 'tuteur') {
      // ========== CONNEXION TUTEUR ==========
      const { email, password } = body;

      if (!email) {
        return json({ message: 'Email requis' }, { status: 400 });
      }

      if (!password) {
        return json({ message: 'Mot de passe requis' }, { status: 400 });
      }

      // Chercher par email
      const result = await db.query<any[]>(
        `SELECT * FROM user WHERE email = $email AND user_type = 'tuteur'`,
        { email }
      );

      const users = result[0] as any[];

      if (!users || users.length === 0) {
        return json({ message: "Email introuvable ou compte non tuteur" }, { status: 404 });
      }

      const user = users[0];

      // Vérifier le mot de passe
      const passwordHash = await hashPassword(password);
      if (user.password_hash !== passwordHash) {
        return json({ message: 'Mot de passe incorrect' }, { status: 401 });
      }

      return json({
        success: true,
        user: {
          id: user.id?.toString() || user.id,
          pseudo: user.pseudo,
          email: user.email,
          name: user.name,
          nom: user.nom,
          prenom: user.prenom,
          theme_color: user.theme_color || 'gray',
          user_type: user.user_type || 'tuteur',
          is_admin: !!user.is_admin
        }
      });

    } else {
      return json({ message: 'Type d\'utilisateur invalide' }, { status: 400 });
    }

  } catch (error) {
    console.error('Auth login error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
