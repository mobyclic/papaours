import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const db = await getSurrealDB();
  
  try {
    // Récupérer l'utilisateur via la session
    const sessionResult = await db.query<[{ user: string, profile_type: string }[]]>(
      `SELECT user, user.profile_type as profile_type FROM session WHERE id = $sessionId AND expires_at > time::now()`,
      { sessionId }
    );
    
    if (!sessionResult[0]?.[0]?.user) {
      return json({ error: 'Session invalide' }, { status: 401 });
    }
    
    const tutorId = sessionResult[0][0].user;
    
    // Vérifier que l'utilisateur est tuteur
    const userResult = await db.query<[{ profile_type: string }[]]>(
      `SELECT profile_type FROM $tutorId`,
      { tutorId }
    );
    
    if (userResult[0]?.[0]?.profile_type !== 'tuteur') {
      return json({ error: 'Vous devez être tuteur pour créer des profils' }, { status: 403 });
    }
    
    // Récupérer les données du formulaire
    const body = await request.json();
    const { firstName, lastName, birthYear, gradeId, profileType } = body;
    
    if (!firstName?.trim()) {
      return json({ error: 'Le prénom est requis' }, { status: 400 });
    }
    
    if (!gradeId) {
      return json({ error: 'Le niveau scolaire est requis' }, { status: 400 });
    }
    
    // Créer le profil enfant/élève
    const profileId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await db.query(
      `CREATE child_profile SET
        id = $profileId,
        tutor = $tutorId,
        first_name = $firstName,
        last_name = $lastName,
        birth_year = $birthYear,
        grade = type::thing('classe', $gradeId),
        profile_type = $profileType,
        xp = 0,
        level = 1,
        created_at = time::now(),
        updated_at = time::now()
      `,
      {
        profileId,
        tutorId,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        birthYear: birthYear ? parseInt(birthYear) : null,
        gradeId: gradeId.includes(':') ? gradeId.split(':')[1] : gradeId,
        profileType: profileType || 'child'
      }
    );
    
    return json({ 
      success: true, 
      message: 'Profil créé avec succès',
      profileId 
    });
    
  } catch (error) {
    console.error('Erreur création profil:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
