/**
 * API: Gestion des classes d'un établissement
 * GET /api/establishment/classes - Liste des classes
 * POST /api/establishment/classes - Créer une classe
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET: Liste des classes de l'établissement
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const db = await connectDB();

    // Vérifier la session
    const sessionResult = await db.query<any[]>(`
      SELECT user.* FROM session 
      WHERE session_token = $sessionToken 
      AND expires_at > time::now()
      FETCH user
    `, { sessionToken: sessionToken });

    const sessions = sessionResult[0] as any[];
    if (!sessions || sessions.length === 0) {
      return json({ success: false, message: 'Session invalide' }, { status: 401 });
    }

    const establishment = sessions[0].user;
    if (establishment.profile_type !== 'etablissement') {
      return json({ success: false, message: 'Accès réservé aux établissements' }, { status: 403 });
    }

    // Récupérer les classes avec le nombre d'élèves
    const classesResult = await db.query<any[]>(`
      SELECT 
        id, name, description, tutor, created_at,
        (SELECT count() FROM class_member WHERE class = $parent.id GROUP ALL)[0].count as students_count
      FROM establishment_class 
      WHERE establishment = $establishmentId
      ORDER BY name ASC
    `, { establishmentId: establishment.id });

    const classes = (classesResult[0] as any[]) || [];

    // Récupérer les infos des tuteurs
    const classesWithTutors = await Promise.all(classes.map(async (cls) => {
      let tutorInfo = null;
      if (cls.tutor) {
        const tutorResult = await db.query<any[]>(`
          SELECT name FROM user WHERE id = $tutorId
        `, { tutorId: cls.tutor });
        if ((tutorResult[0] as any[])?.length > 0) {
          tutorInfo = {
            id: cls.tutor.toString(),
            name: (tutorResult[0] as any[])[0].name
          };
        }
      }
      return {
        id: cls.id?.toString() || cls.id,
        name: cls.name,
        description: cls.description,
        tutor: tutorInfo,
        students_count: cls.students_count || 0,
        created_at: cls.created_at
      };
    }));

    return json({ success: true, classes: classesWithTutors });

  } catch (error) {
    console.error('Get establishment classes error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST: Créer une nouvelle classe
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { name, description, tutor_id } = await request.json();

    if (!name) {
      return json({ success: false, message: 'Nom de la classe requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier la session
    const sessionResult = await db.query<any[]>(`
      SELECT user.* FROM session 
      WHERE session_token = $sessionToken 
      AND expires_at > time::now()
      FETCH user
    `, { sessionToken: sessionToken });

    const sessions = sessionResult[0] as any[];
    if (!sessions || sessions.length === 0) {
      return json({ success: false, message: 'Session invalide' }, { status: 401 });
    }

    const establishment = sessions[0].user;
    if (establishment.profile_type !== 'etablissement') {
      return json({ success: false, message: 'Accès réservé aux établissements' }, { status: 403 });
    }

    // Préparer les données de la classe
    const classData: any = {
      name,
      establishment: establishment.id,
      created_at: new Date().toISOString()
    };

    if (description) classData.description = description;

    // Ajouter le tuteur si fourni
    if (tutor_id) {
      const cleanTutorId = tutor_id.includes(':') ? tutor_id.split(':')[1] : tutor_id;
      // Vérifier que le tuteur appartient à cet établissement
      const tutorCheck = await db.query<any[]>(`
        SELECT * FROM user 
        WHERE id = type::thing("user", $tutorId)
        AND created_by_establishment = $establishmentId
      `, { tutorId: cleanTutorId, establishmentId: establishment.id });

      if ((tutorCheck[0] as any[])?.length > 0) {
        classData.tutor = (tutorCheck[0] as any[])[0].id;
      }
    }

    const created = await db.create('establishment_class', classData);
    const newClass = Array.isArray(created) ? created[0] : created;

    return json({
      success: true,
      class: {
        id: newClass.id?.toString() || newClass.id,
        name: newClass.name,
        description: newClass.description
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create class error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
