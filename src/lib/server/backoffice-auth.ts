/**
 * Utilitaires pour l'authentification backoffice
 */

import { connectDB } from '$lib/db';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'backoffice_session';

export interface BackofficeUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  assigned_themes: string[];
  assigned_matieres: string[];
}

/**
 * Récupère l'utilisateur backoffice depuis la session
 */
export async function getBackofficeUser(cookies: Cookies): Promise<BackofficeUser | null> {
  const sessionToken = cookies.get(COOKIE_NAME);
  
  if (!sessionToken) {
    return null;
  }

  try {
    const db = await connectDB();

    const [sessions] = await db.query<[any[]]>(`
      SELECT 
        user_id.id as user_id,
        user_id.email as email,
        user_id.name as name,
        user_id.role as role,
        user_id.assigned_themes as assigned_themes,
        user_id.assigned_matieres as assigned_matieres,
        user_id.is_active as is_active,
        expires_at
      FROM backoffice_session 
      WHERE session_token = $sessionToken
    `, { sessionToken });

    const session = sessions?.[0];
    
    if (!session || !session.is_active) {
      return null;
    }

    // Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      await db.query('DELETE backoffice_session WHERE session_token = $sessionToken', { sessionToken });
      return null;
    }

    return {
      id: session.user_id?.toString() || '',
      email: session.email,
      name: session.name,
      role: session.role,
      assigned_themes: (session.assigned_themes || []).map((t: any) => t?.toString() || t),
      assigned_matieres: (session.assigned_matieres || []).map((m: any) => m?.toString() || m)
    };

  } catch (error) {
    console.error('getBackofficeUser error:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est superadmin
 */
export function isSuperadmin(user: BackofficeUser | null): boolean {
  return user?.role === 'superadmin';
}

/**
 * Vérifie si l'utilisateur a accès à un thème spécifique
 */
export function canAccessTheme(user: BackofficeUser | null, themeId: string): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  
  const cleanThemeId = themeId.includes(':') ? themeId : `theme:${themeId}`;
  return user.assigned_themes.some(t => {
    const cleanAssigned = t.includes(':') ? t : `theme:${t}`;
    return cleanAssigned === cleanThemeId;
  });
}

/**
 * Vérifie si l'utilisateur a accès à une matière spécifique
 */
export function canAccessMatiere(user: BackofficeUser | null, matiereId: string): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  
  const cleanMatiereId = matiereId.includes(':') ? matiereId : `matiere:${matiereId}`;
  return user.assigned_matieres.some(m => {
    const cleanAssigned = m.includes(':') ? m : `matiere:${m}`;
    return cleanAssigned === cleanMatiereId;
  });
}

/**
 * Vérifie si l'utilisateur a accès à un quiz
 * Un admin a accès si le quiz appartient à un de ses thèmes ou matières assignés
 */
export async function canAccessQuiz(user: BackofficeUser | null, quizId: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'superadmin') return true;

  try {
    const db = await connectDB();
    const cleanQuizId = quizId.includes(':') ? quizId.split(':')[1] : quizId;
    
    const [quizzes] = await db.query<[any[]]>(`
      SELECT theme_ids, matiere_id FROM quiz 
      WHERE id = type::thing('quiz', $quizId)
    `, { quizId: cleanQuizId });

    const quiz = quizzes?.[0];
    if (!quiz) return false;

    // Vérifier les thèmes
    const quizThemes = (quiz.theme_ids || []).map((t: any) => t?.toString() || t);
    for (const themeId of quizThemes) {
      if (canAccessTheme(user, themeId)) return true;
    }

    // Vérifier la matière
    if (quiz.matiere_id && canAccessMatiere(user, quiz.matiere_id.toString())) {
      return true;
    }

    return false;

  } catch (error) {
    console.error('canAccessQuiz error:', error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur a accès à une question
 */
export async function canAccessQuestion(user: BackofficeUser | null, questionId: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'superadmin') return true;

  try {
    const db = await connectDB();
    const cleanQuestionId = questionId.includes(':') ? questionId.split(':')[1] : questionId;
    
    const [questions] = await db.query<[any[]]>(`
      SELECT theme_ids, matiere_id FROM question 
      WHERE id = type::thing('question', $questionId)
    `, { questionId: cleanQuestionId });

    const question = questions?.[0];
    if (!question) return false;

    // Vérifier les thèmes
    const questionThemes = (question.theme_ids || []).map((t: any) => t?.toString() || t);
    for (const themeId of questionThemes) {
      if (canAccessTheme(user, themeId)) return true;
    }

    // Vérifier la matière
    if (question.matiere_id && canAccessMatiere(user, question.matiere_id.toString())) {
      return true;
    }

    return false;

  } catch (error) {
    console.error('canAccessQuestion error:', error);
    return false;
  }
}
