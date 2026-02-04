import type { LayoutServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params, parent }) => {
  const { code } = params;
  
  try {
    const db = await connectDB();
    
    // Récupérer le subject
    const subjectResult = await db.query<any[]>(`
      SELECT * FROM subject WHERE code = $code AND is_active = true
    `, { code });
    
    const subject = (subjectResult[0] as any[])?.[0];
    
    if (!subject) {
      throw error(404, `Matière "${code}" non trouvée`);
    }
    
    // Compter les questions, thèmes et quiz pour ce subject
    const [questionsCount, themesCount, quizCount] = await Promise.all([
      db.query<any[]>('SELECT count() FROM question WHERE subject.code = $code GROUP ALL', { code }),
      db.query<any[]>('SELECT count() FROM theme WHERE subject.code = $code AND is_active = true GROUP ALL', { code }),
      db.query<any[]>('SELECT count() FROM quiz WHERE subject.code = $code AND isActive = true GROUP ALL', { code })
    ]);
    
    // Récupérer les thèmes de ce subject
    const themesResult = await db.query<any[]>(`
      SELECT id, name, slug, description, is_active 
      FROM theme 
      WHERE subject.code = $code AND is_active = true
      ORDER BY name ASC
    `, { code });
    
    const parentData = await parent();
    
    return {
      ...parentData,
      currentSubject: {
        id: subject.id?.toString(),
        code: subject.code,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
        domain: subject.domain,
        questionCount: (questionsCount[0] as any[])?.[0]?.count || 0,
        themeCount: (themesCount[0] as any[])?.[0]?.count || 0,
        quizCount: (quizCount[0] as any[])?.[0]?.count || 0
      },
      subjectThemes: (themesResult[0] as any[])?.map((t: any) => ({
        id: t.id?.toString(),
        name: t.name,
        slug: t.slug,
        description: t.description
      })) || []
    };
  } catch (err: any) {
    if (err.status === 404) throw err;
    console.error('Error loading subject:', err);
    throw error(500, 'Erreur lors du chargement de la matière');
  }
};
