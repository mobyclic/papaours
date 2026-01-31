import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Récupérer les compétences d'un utilisateur
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    
    // Récupérer les compétences de l'utilisateur avec les détails
    const result = await db.query(`
      SELECT 
        *,
        competence_id.code as competence_code,
        competence_id.name as competence_name,
        competence_id.description as competence_description,
        competence_id.type as competence_type,
        competence_id.color as competence_color,
        competence_id.matiere_id as competence_matiere_id,
        competence_id.matiere_id.name as matiere_name,
        competence_id.matiere_id.slug as matiere_slug
      FROM user_competence 
      WHERE user_id = type::thing("user", $userId)
      ORDER BY competence_id.type DESC, competence_id.order
    `, { userId });
    
    const userCompetences = ((result[0] as any[]) || []).map(uc => ({
      id: uc.id?.toString(),
      competence_id: uc.competence_id?.toString(),
      code: uc.competence_code,
      name: uc.competence_name,
      description: uc.competence_description,
      type: uc.competence_type,
      color: uc.competence_color,
      matiere_id: uc.competence_matiere_id?.toString(),
      matiere_name: uc.matiere_name,
      matiere_slug: uc.matiere_slug,
      correct_answers: uc.correct_answers || 0,
      total_answers: uc.total_answers || 0,
      mastery_level: uc.mastery_level || 0,
      last_practiced: uc.last_practiced
    }));
    
    // Calculer les stats globales
    const totalCorrect = userCompetences.reduce((sum, uc) => sum + uc.correct_answers, 0);
    const totalAnswers = userCompetences.reduce((sum, uc) => sum + uc.total_answers, 0);
    const avgMastery = userCompetences.length > 0 
      ? Math.round(userCompetences.reduce((sum, uc) => sum + uc.mastery_level, 0) / userCompetences.length)
      : 0;
    
    // Grouper par type
    const general = userCompetences.filter(uc => uc.type === 'general');
    const byMatiere: Record<string, any[]> = {};
    
    userCompetences.filter(uc => uc.type === 'matiere').forEach(uc => {
      const key = uc.matiere_slug || uc.matiere_id || 'unknown';
      if (!byMatiere[key]) {
        byMatiere[key] = [];
      }
      byMatiere[key].push(uc);
    });
    
    // Calculer les stats par matière
    const matiereStats: Record<string, { name: string; avgMastery: number; totalAnswers: number }> = {};
    Object.entries(byMatiere).forEach(([key, competences]) => {
      const name = competences[0]?.matiere_name || key;
      const avgM = competences.length > 0 
        ? Math.round(competences.reduce((sum, c) => sum + c.mastery_level, 0) / competences.length)
        : 0;
      const total = competences.reduce((sum, c) => sum + c.total_answers, 0);
      matiereStats[key] = { name, avgMastery: avgM, totalAnswers: total };
    });
    
    return json({
      competences: userCompetences,
      general,
      byMatiere,
      matiereStats,
      stats: {
        totalCompetences: userCompetences.length,
        totalCorrect,
        totalAnswers,
        avgMastery,
        successRate: totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0
      }
    });
  } catch (error) {
    console.error('GET user competences error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
