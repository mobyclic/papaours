/**
 * API de gestion des sessions backoffice
 */

import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { RequestHandler } from './$types';

const SESSION_DURATION_DAYS = 7;
const COOKIE_NAME = 'backoffice_session';

// POST - Login
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Chercher l'utilisateur
    const [users] = await db.query<[any[]]>(
      'SELECT * FROM backoffice_user WHERE email = $email AND is_active = true',
      { email: email.toLowerCase().trim() }
    );

    const user = users?.[0];
    if (!user) {
      return json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    // Créer une session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    const userId = user.id.toString();
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

    await db.query(`
      CREATE backoffice_session SET
        user_id = type::thing('backoffice_user', $userId),
        session_token = $sessionToken,
        expires_at = type::datetime($expiresAt)
    `, {
      userId: cleanUserId,
      sessionToken,
      expiresAt: expiresAt.toISOString()
    });

    // Mettre à jour last_login
    await db.query(`
      UPDATE backoffice_user SET last_login = time::now() 
      WHERE id = type::thing('backoffice_user', $userId)
    `, { userId: cleanUserId });

    // Définir le cookie
    cookies.set(COOKIE_NAME, sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS
    });

    return json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Logout
export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get(COOKIE_NAME);
    
    if (sessionToken) {
      const db = await connectDB();
      await db.query('DELETE backoffice_session WHERE session_token = $sessionToken', { sessionToken });
    }

    cookies.delete(COOKIE_NAME, { path: '/' });

    return json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// GET - Vérifier la session actuelle
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get(COOKIE_NAME);
    
    if (!sessionToken) {
      return json({ authenticated: false });
    }

    const db = await connectDB();

    // Vérifier la session
    const [sessions] = await db.query<[any[]]>(`
      SELECT 
        user_id.id as user_id,
        user_id.email as email,
        user_id.name as name,
        user_id.role as role,
        user_id.assigned_themes as assigned_themes,
        user_id.assigned_matieres as assigned_matieres,
        expires_at
      FROM backoffice_session 
      WHERE session_token = $sessionToken
    `, { sessionToken });

    const session = sessions?.[0];
    
    if (!session) {
      cookies.delete(COOKIE_NAME, { path: '/' });
      return json({ authenticated: false });
    }

    // Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      await db.query('DELETE backoffice_session WHERE session_token = $sessionToken', { sessionToken });
      cookies.delete(COOKIE_NAME, { path: '/' });
      return json({ authenticated: false, reason: 'expired' });
    }

    return json({
      authenticated: true,
      user: {
        id: session.user_id?.toString(),
        email: session.email,
        name: session.name,
        role: session.role,
        assigned_themes: session.assigned_themes || [],
        assigned_matieres: session.assigned_matieres || []
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    return json({ authenticated: false, error: 'Erreur serveur' }, { status: 500 });
  }
};
