import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Hash simple pour le mot de passe (en production, utiliser bcrypt ou argon2)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kwizy_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { user_type = 'apprenant', nom, prenom, theme_color } = body;

    if (!prenom || !nom) {
      return json({ message: 'Prénom et nom requis' }, { status: 400 });
    }

    const db = await connectDB();

    if (user_type === 'apprenant') {
      // ========== INSCRIPTION APPRENANT ==========
      const { pseudo, password_code, dateNaissance, classe } = body;

      if (!pseudo) {
        return json({ message: 'Pseudo requis' }, { status: 400 });
      }

      if (!password_code || !/^\d{4}$/.test(password_code)) {
        return json({ message: 'Code secret à 4 chiffres requis' }, { status: 400 });
      }

      // Vérifier si le pseudo existe déjà
      const existingPseudo = await db.query<any[]>(
        'SELECT * FROM user WHERE pseudo = $pseudo',
        { pseudo }
      );

      if ((existingPseudo[0] as any[])?.length) {
        return json({ message: 'Ce pseudo est déjà pris, choisis-en un autre !' }, { status: 409 });
      }

      // Parser la date de naissance si fournie
      let dateNaissanceParsed = null;
      if (dateNaissance) {
        dateNaissanceParsed = new Date(dateNaissance);
      }

      const userData: any = {
        email: `${pseudo}@kwizy.local`,
        pseudo,
        nom,
        prenom,
        name: `${prenom} ${nom}`,
        date_naissance: dateNaissanceParsed,
        classe: classe || null,
        theme_color: theme_color || 'blue',
        is_admin: false,
        user_type: 'apprenant',
        password_code: password_code
      };

      const created = await db.create('user', userData);
      const user = Array.isArray(created) ? created[0] : created;

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
          theme_color: user.theme_color,
          user_type: user.user_type,
          is_admin: !!user.is_admin
        }
      }, { status: 201 });

    } else if (user_type === 'tuteur') {
      // ========== INSCRIPTION TUTEUR ==========
      const { email, password } = body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ message: 'Email valide requis' }, { status: 400 });
      }

      if (!password || password.length < 8) {
        return json({ message: 'Mot de passe de 8 caractères minimum requis' }, { status: 400 });
      }

      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return json({ message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre' }, { status: 400 });
      }

      // Vérifier si l'email existe déjà
      const existingEmail = await db.query<any[]>(
        'SELECT * FROM user WHERE email = $email',
        { email }
      );

      if ((existingEmail[0] as any[])?.length) {
        return json({ message: 'Cet email est déjà utilisé' }, { status: 409 });
      }

      // Hasher le mot de passe
      const passwordHash = await hashPassword(password);

      // Générer un pseudo basé sur le prénom/nom
      const basePseudo = `${prenom.toLowerCase()}.${nom.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
      let pseudo = basePseudo;
      let counter = 1;
      
      // Vérifier unicité du pseudo
      while (true) {
        const existingPseudo = await db.query<any[]>(
          'SELECT * FROM user WHERE pseudo = $pseudo',
          { pseudo }
        );
        if (!(existingPseudo[0] as any[])?.length) break;
        pseudo = `${basePseudo}${counter}`;
        counter++;
      }

      const userData: any = {
        email,
        pseudo,
        nom,
        prenom,
        name: `${prenom} ${nom}`,
        theme_color: theme_color || 'blue',
        is_admin: false,
        user_type: 'tuteur',
        password_hash: passwordHash
      };

      const created = await db.create('user', userData);
      const user = Array.isArray(created) ? created[0] : created;

      return json({
        success: true,
        user: {
          id: user.id?.toString() || user.id,
          pseudo: user.pseudo,
          email: user.email,
          name: user.name,
          nom: user.nom,
          prenom: user.prenom,
          theme_color: user.theme_color,
          user_type: user.user_type,
          is_admin: !!user.is_admin
        }
      }, { status: 201 });

    } else {
      return json({ message: 'Type d\'utilisateur invalide' }, { status: 400 });
    }

  } catch (error) {
    console.error('Auth signup error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
