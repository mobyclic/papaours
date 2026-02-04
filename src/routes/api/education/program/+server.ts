import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const sessionToken = cookies.get('session');
  const subjectCode = url.searchParams.get('subject');
  
  console.log('[Program API] sessionToken:', sessionToken ? 'present' : 'missing');
  
  if (!sessionToken) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const db = await getSurrealDB();
    
    // Valider la session et récupérer l'utilisateur
    const [sessions] = await db.query<any[]>(`
      SELECT user FROM session 
      WHERE session_token = $sessionToken 
        AND expires_at > time::now()
    `, { sessionToken });
    
    if (!sessions || sessions.length === 0) {
      return json({ error: 'Session expirée' }, { status: 401 });
    }
    
    const userId = sessions[0].user?.toString();
    if (!userId) {
      return json({ error: 'Session invalide' }, { status: 401 });
    }
    
    console.log('[Program API] userId from session:', userId);
    
    // Extraire l'ID clean (sans "user:")
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
    
    // Récupérer l'utilisateur avec son contexte éducatif
    const [userResult] = await db.query<[any[]]>(`
      SELECT 
        current_grade,
        education_system
      FROM type::thing("user", $userId)
    `, { userId: cleanUserId });

    console.log('[Program API] userResult:', JSON.stringify(userResult));

    // userResult est un tableau, on prend le premier élément
    const userData = userResult?.[0];

    console.log('[Program API] userData:', JSON.stringify(userData));

    if (!userData || !userData.current_grade) {
      console.log('[Program API] No userData or current_grade');
      return json({ subjects: [] });
    }

    // Extraire le gradeId - peut être un RecordId ou une string
    let gradeId: string;
    if (typeof userData.current_grade === 'string') {
      gradeId = userData.current_grade.replace('grade:', '');
    } else if (userData.current_grade.id) {
      // RecordId object
      gradeId = userData.current_grade.id;
    } else {
      gradeId = String(userData.current_grade);
    }

    console.log('[Program API] gradeId:', gradeId);

    // Si on demande les détails d'une matière spécifique
    if (subjectCode) {
      return await getSubjectDetails(db, gradeId, subjectCode);
    }

    // Récupérer le programme officiel pour cette classe
    const [programs] = await db.query<[any[]]>(`
      SELECT 
        id,
        subject.name AS subject_name,
        subject.code AS subject_code,
        subject.icon AS subject_icon,
        subject.color AS subject_color,
        subject.domain AS subject_domain,
        subject.hours_per_week AS hours_per_week,
        (SELECT count() FROM chapter WHERE official_program = $parent.id GROUP ALL)[0].count AS chapters_count
      FROM official_program
      WHERE grade = type::thing("grade", $gradeId)
        AND is_active = true
    `, { gradeId });

    console.log('[Program API] programs found:', programs?.length);

    if (!programs || programs.length === 0) {
      return json({ subjects: [], grade: gradeId });
    }

    // Mapper les résultats et grouper par domaine
    const subjects = programs.map(p => ({
      code: p.subject_code,
      name: p.subject_name,
      icon: p.subject_icon,
      color: p.subject_color,
      domain: p.subject_domain,
      hoursPerWeek: p.hours_per_week,
      chaptersCount: p.chapters_count || 0
    }));

    // Grouper par domaine pour l'affichage
    const byDomain: Record<string, typeof subjects> = {};
    for (const subject of subjects) {
      const domain = subject.domain || 'autre';
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(subject);
    }

    return json({ subjects, byDomain, grade: gradeId });
    
  } catch (error) {
    console.error('Erreur récupération programme:', error);
    return json({ subjects: [] });
  }
};

async function getSubjectDetails(db: any, gradeId: string, subjectCode: string) {
  try {
    // Récupérer le programme officiel pour cette matière
    const [programs] = await db.query(`
      SELECT 
        id,
        name,
        description,
        subject.name AS subject_name,
        subject.code AS subject_code,
        subject.icon AS subject_icon,
        subject.color AS subject_color,
        subject.hours_per_week AS hours_per_week
      FROM official_program
      WHERE grade = type::thing("grade", $gradeId)
        AND subject.code = $subjectCode
        AND is_active = true
      LIMIT 1
    `, { gradeId, subjectCode }) as [any[]];

    if (!programs || programs.length === 0) {
      return json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    const program = programs[0];
    const programId = program.id.toString();

    // Mapping des nouveaux codes subject vers les anciens slugs matiere
    const subjectToMatiereSlugs: Record<string, string[]> = {
      'sciences': ['sciences', 'physique-chimie'],
      'francais': ['francais'],
      'mathematiques': ['mathematiques'],
      'histoire': ['histoire'],
      'geographie': ['geographie'],
      'anglais': ['anglais'],
      'emc': ['education-civique'],
      'musique': ['musique'],
      'arts_plastiques': ['arts'],
      'eps': ['eps', 'sport']
    };
    
    const matiereSlugList = subjectToMatiereSlugs[subjectCode] || [subjectCode];

    // Récupérer les chapitres de ce programme
    // Les quiz sont matchés par theme (slug) + matière, pas par lien direct
    const [chapters] = await db.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        order
      FROM chapter
      WHERE official_program = type::thing("official_program", $programId)
        AND is_active = true
      ORDER BY \`order\` ASC
    `, { programId: programId.replace('official_program:', '') }) as [any[]];

    // Pour chaque chapter, trouver les quiz correspondants par theme + matière
    const chaptersWithQuizzes = await Promise.all((chapters || []).map(async (chapter: any) => {
      const [quizzes] = await db.query(`
        SELECT id, title, slug, difficulty, maxQuestions, favorite_count
        FROM quiz
        WHERE theme = $chapterSlug
          AND (matiere_id.slug IN $matiereSlugList OR subject.code = $subjectCode)
          AND isActive = true
          AND visibility = 'public'
        ORDER BY favorite_count DESC
        LIMIT 10
      `, { 
        chapterSlug: chapter.slug, 
        matiereSlugList,
        subjectCode 
      }) as [any[]];
      
      return {
        ...chapter,
        id: chapter.id?.toString(),
        quizzes: (quizzes || []).map((q: any) => ({
          ...q,
          id: q.id?.toString()
        }))
      };
    }));

    // Récupérer aussi les quiz sans theme (legacy) - ceux qui ne sont pas liés à un chapitre
    const [unassignedQuizzes] = await db.query(`
      SELECT 
        id,
        title,
        slug,
        description,
        difficulty,
        maxQuestions,
        favorite_count
      FROM quiz
      WHERE (
        matiere_id.slug IN $matiereSlugList
        OR subject.code = $subjectCode
      )
        AND (theme IS NONE OR theme IS NULL OR theme = '')
        AND isActive = true
        AND visibility = 'public'
      ORDER BY favorite_count DESC
      LIMIT 10
    `, { subjectCode, matiereSlugList }) as [any[]];

    return json({
      program: {
        id: programId,
        name: program.name,
        description: program.description,
        subject: {
          code: program.subject_code,
          name: program.subject_name,
          icon: program.subject_icon,
          color: program.subject_color,
          hoursPerWeek: program.hours_per_week
        }
      },
      chapters: chaptersWithQuizzes,
      quizzes: (unassignedQuizzes || []).map((q: any) => ({
        ...q,
        id: q.id?.toString()
      }))
    });

  } catch (error) {
    console.error('Erreur détails matière:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
