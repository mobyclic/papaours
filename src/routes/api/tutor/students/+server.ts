import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Générer un code à 4 chiffres
function generateLoginCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Générer un identifiant élève unique
function generateStudentId(prenom: string): string {
  const base = prenom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`;
}

// GET: Liste des élèves du tuteur
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const db = await connectDB();

    // Vérifier la session et récupérer l'utilisateur
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

    const tutor = sessions[0].user;
    if (tutor.profile_type !== 'tuteur') {
      return json({ success: false, message: 'Accès réservé aux tuteurs' }, { status: 403 });
    }

    // Récupérer les élèves créés par ce tuteur
    const studentsResult = await db.query<any[]>(`
      SELECT * FROM user 
      WHERE created_by_tutor = $tutorId
      ORDER BY created_at DESC
    `, { tutorId: tutor.id });

    const students = (studentsResult[0] as any[]) || [];

    // Sérialiser les données
    const serializedStudents = students.map(s => ({
      id: s.id?.toString() || s.id,
      prenom: s.prenom,
      nom: s.nom,
      name: s.name,
      tutor_student_id: s.tutor_student_id,
      global_student_id: s.global_student_id,
      login_code: s.login_code,
      theme_color: s.theme_color || 'gray',
      created_at: s.created_at,
      last_login: s.last_login
    }));

    return json({ success: true, students: serializedStudents });

  } catch (error) {
    console.error('Get tutor students error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST: Créer un nouvel élève
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { prenom, nom } = await request.json();

    if (!prenom || !nom) {
      return json({ success: false, message: 'Prénom et nom requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier la session et récupérer l'utilisateur
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

    const tutor = sessions[0].user;
    if (tutor.profile_type !== 'tuteur') {
      return json({ success: false, message: 'Accès réservé aux tuteurs' }, { status: 403 });
    }

    // Vérifier le quota (max 5 élèves pour tuteur)
    const countResult = await db.query<any[]>(`
      SELECT count() as total FROM user 
      WHERE created_by_tutor = $tutorId
      GROUP ALL
    `, { tutorId: tutor.id });

    const count = countResult[0]?.[0]?.total || 0;
    if (count >= 5) {
      return json({ 
        success: false, 
        message: 'Limite de 5 élèves atteinte. Passez au plan Établissement pour plus.' 
      }, { status: 403 });
    }

    // Générer les identifiants
    let globalStudentId = generateStudentId(prenom);
    let tutorStudentId = `${prenom.toLowerCase().slice(0, 3)}${nom.toLowerCase().slice(0, 1)}`;
    const loginCode = generateLoginCode();

    // Vérifier unicité du global_student_id
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query<any[]>(
        'SELECT * FROM user WHERE global_student_id = $id',
        { id: globalStudentId }
      );
      if (!(existing[0] as any[])?.length) break;
      globalStudentId = generateStudentId(prenom);
      attempts++;
    }

    // Créer l'élève
    const userData = {
      prenom,
      nom,
      name: `${prenom} ${nom}`,
      profile_type: 'apprenant',
      created_by_tutor: tutor.id,
      tutor_student_id: tutorStudentId,
      global_student_id: globalStudentId,
      login_code: loginCode,
      theme_color: 'gray',
      is_admin: false,
      created_at: new Date().toISOString()
    };

    const created = await db.create('user', userData);
    const student = Array.isArray(created) ? created[0] : created;

    return json({
      success: true,
      student: {
        id: student.id?.toString() || student.id,
        prenom: student.prenom,
        nom: student.nom,
        tutor_student_id: student.tutor_student_id,
        global_student_id: student.global_student_id,
        login_code: student.login_code,
        theme_color: student.theme_color
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create student error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
