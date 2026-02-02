import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { student_id, login_code } = await request.json();

    if (!student_id || !login_code) {
      return json({ success: false, message: 'Identifiant et code requis' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Chercher l'utilisateur par son global_student_id ou tutor_student_id et login_code
    const result = await db.query<any[][]>(`
      SELECT * FROM user 
      WHERE (global_student_id = $student_id OR tutor_student_id = $student_id)
        AND login_code = $login_code
        AND created_by_tutor IS NOT NONE
      LIMIT 1
    `, { 
      student_id: student_id.toLowerCase().trim(),
      login_code: login_code 
    });

    const users = result[0];
    if (!users || users.length === 0) {
      return json({ success: false, message: 'Identifiant ou code incorrect' }, { status: 401 });
    }

    const user = users[0];

    // Mettre à jour last_login
    await db.query(`
      UPDATE $userId SET last_login = time::now()
    `, { userId: user.id });

    // Créer une session simple (token dans cookie)
    const sessionToken = crypto.randomUUID();
    
    // Stocker la session
    await db.query(`
      CREATE session SET 
        session_token = $sessionToken,
        user = $userId,
        created_at = time::now(),
        expires_at = time::now() + 30d
    `, { 
      sessionToken: sessionToken,
      userId: user.id 
    });

    // Définir le cookie de session
    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 jours
    });

    // Retourner les infos utilisateur (sans mot de passe)
    const { password_hash, login_code: code, ...safeUser } = user;

    // Sérialiser les RecordIds
    const serializedUser = JSON.parse(JSON.stringify(safeUser, (key, value) => {
      if (value && typeof value === 'object' && value.tb && value.id) {
        return `${value.tb}:${value.id}`;
      }
      return value;
    }));

    return json({ 
      success: true, 
      user: serializedUser,
      message: 'Connexion réussie' 
    });

  } catch (error) {
    console.error('Student login error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
