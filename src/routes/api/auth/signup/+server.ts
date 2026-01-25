import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password, name, nom, prenom, dateNaissance, classe } = await request.json();

    // Le pseudo est passé via le champ "email" depuis le formulaire
    const pseudo = email;

    if (!pseudo) {
      return json({ message: 'Pseudo requis' }, { status: 400 });
    }

    if (!prenom || !nom) {
      return json({ message: 'Prénom et nom requis' }, { status: 400 });
    }

    if (!classe) {
      return json({ message: 'Classe requise' }, { status: 400 });
    }

    const db = await connectDB();

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

    // Créer l'utilisateur avec tous les champs, sans passwordHash si non fourni
    const userData: any = {
      email: `${pseudo}@papaours.local`, // email fictif basé sur le pseudo
      pseudo,
      nom,
      prenom,
      name: `${prenom} ${nom}`,
      date_naissance: dateNaissanceParsed,
      classe,
      is_admin: false
    };
    if (password) {
      // Ici tu dois hasher le mot de passe si besoin (ex: bcrypt)
      userData.passwordHash = password; // Remplace par le hash si tu utilises bcrypt
    }
    const created = await db.create('user', userData);

    const user = Array.isArray(created) ? created[0] : created;

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
    }, { status: 201 });
  } catch (error) {
    console.error('Auth signup error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
