import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query('SELECT * FROM quiz ORDER BY order ASC, createdAt DESC');
    const quiz = result[0] || [];

    return json({ quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { 
      title, 
      description, 
      slug, 
      questionType = 'qcm', 
      coverImage, 
      isActive = true, 
      theme_ids,
      shuffleQuestions = false, 
      maxQuestions 
    } = data;

    if (!title || !slug) {
      return json({ message: 'Titre et slug requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier si le slug existe déjà
    const existing = await db.query<any[]>(
      'SELECT * FROM quiz WHERE slug = $slug',
      { slug }
    );

    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Ce slug existe déjà' }, { status: 400 });
    }

    // Créer le quiz - Ne pas inclure les champs optionnels s'ils sont vides
    const quizData: any = {
      title,
      slug,
      questionType,
      isHomepage: false,
      isActive,
      shuffleQuestions,
      order: 0
    };
    
    // Ajouter les champs optionnels seulement s'ils ont une valeur
    if (description) {
      quizData.description = description;
    }
    if (coverImage) {
      quizData.coverImage = coverImage;
    }
    
    // Ajouter maxQuestions seulement si défini
    if (maxQuestions && maxQuestions > 0) {
      quizData.maxQuestions = maxQuestions;
    }
    
    // Si theme_ids fourni, utiliser une requête SQL pour créer les références correctement
    if (theme_ids && Array.isArray(theme_ids) && theme_ids.length > 0) {
      // Nettoyer les IDs
      const cleanThemeIds = theme_ids.map((tid: string) => 
        tid.includes(':') ? tid.split(':')[1] : tid
      );
      
      // Construire le tableau de références avec type::thing()
      const themeRefsStr = cleanThemeIds.map(id => `type::thing("theme", "${id}")`).join(', ');
      
      // Créer le quiz avec une requête SQL pour gérer les références
      const createResult = await db.query(`
        CREATE quiz SET
          title = $title,
          slug = $slug,
          questionType = $questionType,
          isHomepage = $isHomepage,
          isActive = $isActive,
          shuffleQuestions = $shuffleQuestions,
          order = $order,
          ${description ? 'description = $description,' : ''}
          ${coverImage ? 'coverImage = $coverImage,' : ''}
          ${maxQuestions ? 'maxQuestions = $maxQuestions,' : ''}
          theme_ids = [${themeRefsStr}]
      `, {
        title: quizData.title,
        slug: quizData.slug,
        questionType: quizData.questionType,
        isHomepage: quizData.isHomepage,
        isActive: quizData.isActive,
        shuffleQuestions: quizData.shuffleQuestions,
        order: quizData.order,
        ...(description && { description }),
        ...(coverImage && { coverImage }),
        ...(maxQuestions && { maxQuestions })
      });
      
      const quiz = (createResult[0] as any[])?.[0];
      return json({ success: true, quiz });
    }
    
    const quiz = await db.create('quiz', quizData);

    return json({ success: true, quiz: Array.isArray(quiz) ? quiz[0] : quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};