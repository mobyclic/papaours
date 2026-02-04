import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const db = await connectDB();
    const userId = params.id;
    
    // Récupérer l'utilisateur avec son grade
    const userResult = await db.query(`
      SELECT *, 
        current_grade.name as grade_name, 
        current_grade.code as grade_code,
        current_grade.cycle.name as cycle_name
      FROM user 
      WHERE id = type::thing("user", $userId)
    `, { userId });
    
    const user = (userResult[0] as any[])?.[0];
    
    if (!user) {
      throw error(404, 'Utilisateur non trouvé');
    }
    
    // Récupérer les résultats de quiz de l'utilisateur
    const quizResultsResult = await db.query(`
      SELECT *, 
        quizId.title as quiz_title,
        quizId.slug as quiz_slug
      FROM quiz_result 
      WHERE userId = $visitorId
      ORDER BY completedAt DESC
      LIMIT 20
    `, { visitorId: `user:${userId}` });
    
    const quizResults = (quizResultsResult[0] as any[]) || [];
    
    // Récupérer la progression par thème depuis user_progress
    const progressResult = await db.query(`
      SELECT *, 
        theme_id.name as theme_name,
        theme_id.slug as theme_slug,
        matiere_id.name as matiere_name,
        matiere_id.slug as matiere_slug
      FROM user_progress 
      WHERE user_id = type::thing("user", $userId)
      ORDER BY points DESC
    `, { userId });
    
    const themeProgress = (progressResult[0] as any[]) || [];
    
    // Calculer les points par matière (agrégation des thèmes)
    const pointsByMatiere: Record<string, { 
      name: string, 
      points: number, 
      themes: number,
      quizzes_completed: number,
      correct_answers: number,
      total_answers: number,
      best_niveau: string
    }> = {};
    
    const niveauOrder = ['débutant', 'apprenti', 'confirmé', 'expert', 'maître'];
    
    for (const progress of themeProgress) {
      const matiereId = progress.matiere_id?.toString() || 'unknown';
      const matiereName = progress.matiere_name || 'Non classé';
      
      if (!pointsByMatiere[matiereId]) {
        pointsByMatiere[matiereId] = { 
          name: matiereName, 
          points: 0, 
          themes: 0,
          quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          best_niveau: 'débutant'
        };
      }
      
      pointsByMatiere[matiereId].points += progress.points || 0;
      pointsByMatiere[matiereId].themes += 1;
      pointsByMatiere[matiereId].quizzes_completed += progress.quizzes_completed || 0;
      pointsByMatiere[matiereId].correct_answers += progress.correct_answers || 0;
      pointsByMatiere[matiereId].total_answers += progress.total_answers || 0;
      
      // Garder le meilleur niveau
      const currentNiveau = progress.niveau || 'débutant';
      if (niveauOrder.indexOf(currentNiveau) > niveauOrder.indexOf(pointsByMatiere[matiereId].best_niveau)) {
        pointsByMatiere[matiereId].best_niveau = currentNiveau;
      }
    }
    
    const matiereProgress = Object.values(pointsByMatiere).sort((a, b) => b.points - a.points);
    
    // Calculer les stats globales
    const totalPoints = themeProgress.reduce((sum: number, p: any) => sum + (p.points || 0), 0);
    const totalQuizCompleted = themeProgress.reduce((sum: number, p: any) => sum + (p.quizzes_completed || 0), 0);
    const totalCorrect = themeProgress.reduce((sum: number, p: any) => sum + (p.correct_answers || 0), 0);
    const totalAnswers = themeProgress.reduce((sum: number, p: any) => sum + (p.total_answers || 0), 0);
    const avgScore = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
    
    // Calculer le niveau global (basé sur les points totaux)
    let globalLevel = 'débutant';
    if (totalPoints >= 5000) globalLevel = 'maître';
    else if (totalPoints >= 2000) globalLevel = 'expert';
    else if (totalPoints >= 500) globalLevel = 'confirmé';
    else if (totalPoints >= 100) globalLevel = 'apprenti';

    return {
      user: {
        id: user.id?.toString() || user.id,
        name: user.name || `${user.prenom || ''} ${user.nom || ''}`.trim(),
        prenom: user.prenom || '',
        nom: user.nom || '',
        pseudo: user.pseudo || '',
        email: user.email || '',
        grade_name: user.grade_name || user.classe_name || user.classe || '',
        classe_category: user.classe_category || '',
        date_naissance: user.date_naissance,
        is_active: user.is_active ?? true,
        is_admin: user.is_admin ?? false,
        created_at: user.createdAt || user.created_at
      },
      stats: {
        totalPoints,
        totalQuizCompleted,
        avgScore,
        themesWithProgress: themeProgress.length,
        globalLevel
      },
      themeProgress: themeProgress.map((p: any) => ({
        id: p.id?.toString(),
        theme_name: p.theme_name || 'Thème inconnu',
        theme_slug: p.theme_slug || '',
        matiere_name: p.matiere_name || '',
        points: p.points || 0,
        niveau: p.niveau || 'débutant',
        quizzes_completed: p.quizzes_completed || 0,
        correct_answers: p.correct_answers || 0,
        total_answers: p.total_answers || 0,
        best_score: p.best_score || 0
      })),
      matiereProgress,
      recentQuizResults: quizResults.slice(0, 10).map((r: any) => ({
        id: r.id?.toString() || r.id,
        quiz_title: r.quiz_title || 'Quiz inconnu',
        score: r.score || 0,
        total_questions: r.totalQuestions || r.total_questions || 0,
        completed_at: r.completedAt || r.completed_at
      }))
    };
  } catch (err: any) {
    if (err?.status === 404) throw err;
    console.error('Error loading user profile:', err);
    throw error(500, 'Erreur lors du chargement du profil');
  }
};
