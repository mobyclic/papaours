import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { sendVerificationEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

// Hash simple pour le mot de passe (en production, utiliser bcrypt ou argon2)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kweez_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Générer un slug unique pour le tuteur
function generateTutorSlug(prenom: string, nom: string): string {
  const base = `${prenom}-${nom}`.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}-${random}`;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password, nom, prenom, theme_color, profile_type = 'apprenant' } = body;

    // ========== VALIDATION ==========
    if (!prenom || !nom) {
      return json({ message: 'Prénom et nom requis' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ message: 'Email valide requis' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return json({ message: 'Mot de passe de 8 caractères minimum requis' }, { status: 400 });
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return json({ message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier si l'email existe déjà
    const existingEmail = await db.query<any[]>(
      'SELECT * FROM user WHERE email = $email',
      { email: email.toLowerCase().trim() }
    );

    if ((existingEmail[0] as any[])?.length) {
      return json({ message: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Générer un identifiant global unique
    const globalStudentId = `${prenom.toLowerCase().slice(0, 4)}${Math.floor(1000 + Math.random() * 9000)}`;

    // Générer un tutor_slug si c'est un tuteur ou établissement
    let tutorSlug = null;
    if (profile_type === 'tuteur' || profile_type === 'etablissement') {
      tutorSlug = generateTutorSlug(prenom, nom);
      
      // Vérifier unicité du slug
      let counter = 0;
      while (true) {
        const existingSlug = await db.query<any[]>(
          'SELECT * FROM user WHERE tutor_slug = $slug',
          { slug: counter === 0 ? tutorSlug : `${tutorSlug}-${counter}` }
        );
        if (!(existingSlug[0] as any[])?.length) {
          if (counter > 0) tutorSlug = `${tutorSlug}-${counter}`;
          break;
        }
        counter++;
      }
    }

    // Générer un token de vérification email
    const verificationToken = crypto.randomUUID();

    const userData: any = {
      email: email.toLowerCase().trim(),
      nom,
      prenom,
      name: `${prenom} ${nom}`,
      theme_color: 'gray',
      is_admin: false,
      profile_type: profile_type,
      password_hash: passwordHash,
      global_student_id: globalStudentId,
      email_verified: false,
      created_at: new Date()
    };

    // Ajouter tutor_slug seulement si défini (SurrealDB n'accepte pas null pour option<string>)
    if (tutorSlug) {
      userData.tutor_slug = tutorSlug;
    }

    const created = await db.create('user', userData);
    const user = Array.isArray(created) ? created[0] : created;

    // Créer le token de vérification email
    await db.query(`
      CREATE email_verification SET 
        verification_token = $verificationToken,
        user = $userId,
        created_at = time::now(),
        expires_at = time::now() + 24h
    `, { 
      verificationToken: verificationToken,
      userId: user.id 
    });

    // Envoyer l'email de vérification
    await sendVerificationEmail(email.toLowerCase().trim(), prenom, verificationToken);

    // Ne pas créer de session tant que l'email n'est pas vérifié
    // L'utilisateur devra cliquer sur le lien de vérification puis se connecter

    return json({
      success: true,
      requiresVerification: true,
      message: 'Compte créé ! Vérifiez votre email pour activer votre compte.'
    }, { status: 201 });

  } catch (error) {
    console.error('Auth signup error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
