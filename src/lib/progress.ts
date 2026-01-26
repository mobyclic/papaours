import { connectDB } from './db';

/**
 * Système de progression utilisateur par matière/thème
 * 
 * Niveaux : débutant → apprenti → confirmé → expert → maître
 * Points requis : 0 → 100 → 300 → 600 → 1000
 */

export interface UserProgress {
  id: string;
  user_id: string;
  matiere_id: string;
  theme_id: string;
  niveau: 'débutant' | 'apprenti' | 'confirmé' | 'expert' | 'maître';
  points: number;
  quizzes_completed: number;
  correct_answers: number;
  total_answers: number;
  best_score: number;
  last_quiz_at: Date | null;
}

export interface Niveau {
  name: string;
  slug: string;
  order: number;
  points_required: number;
  icon: string;
  color: string;
}

export interface Matiere {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

export interface Theme {
  id: string;
  matiere_id: string;
  name: string;
  slug: string;
}

const NIVEAUX_CONFIG: Record<string, { points_min: number; points_max: number }> = {
  'débutant': { points_min: 0, points_max: 99 },
  'apprenti': { points_min: 100, points_max: 299 },
  'confirmé': { points_min: 300, points_max: 599 },
  'expert': { points_min: 600, points_max: 999 },
  'maître': { points_min: 1000, points_max: Infinity }
};

/**
 * Récupère ou crée la progression d'un utilisateur pour une matière/thème donnée
 */
export async function getOrCreateUserProgress(
  userId: string, 
  matiereId: string, 
  themeId: string
): Promise<UserProgress> {
  const db = await connectDB();
  
  // Chercher la progression existante
  const existing = await db.query<any[]>(`
    SELECT * FROM user_progress 
    WHERE user_id = type::thing('user', $userId) 
      AND matiere_id = type::thing('matiere', $matiereId)
      AND theme_id = type::thing('theme', $themeId)
  `, { 
    userId: userId.includes(':') ? userId.split(':')[1] : userId,
    matiereId: matiereId.includes(':') ? matiereId.split(':')[1] : matiereId,
    themeId: themeId.includes(':') ? themeId.split(':')[1] : themeId
  });
  
  if ((existing[0] as any[])?.length) {
    return (existing[0] as any[])[0] as UserProgress;
  }
  
  // Créer une nouvelle progression (débutant par défaut)
  const created = await db.create('user_progress', {
    user_id: userId.includes(':') ? userId : `user:${userId}`,
    matiere_id: matiereId.includes(':') ? matiereId : `matiere:${matiereId}`,
    theme_id: themeId.includes(':') ? themeId : `theme:${themeId}`,
    niveau: 'débutant',
    points: 0,
    quizzes_completed: 0,
    correct_answers: 0,
    total_answers: 0,
    best_score: 0,
    last_quiz_at: null
  });
  
  return Array.isArray(created) ? created[0] as unknown as UserProgress : created as unknown as UserProgress;
}

/**
 * Met à jour la progression après un quiz complété
 */
export async function updateProgressAfterQuiz(
  userId: string,
  matiereId: string,
  themeId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number
): Promise<UserProgress> {
  const db = await connectDB();
  
  // Calculer les points gagnés (basé sur le pourcentage de bonnes réponses)
  const percentage = (correctAnswers / totalQuestions) * 100;
  let pointsEarned = 0;
  
  if (percentage >= 90) pointsEarned = 25;
  else if (percentage >= 75) pointsEarned = 20;
  else if (percentage >= 60) pointsEarned = 15;
  else if (percentage >= 50) pointsEarned = 10;
  else if (percentage >= 30) pointsEarned = 5;
  else pointsEarned = 2; // Points de participation
  
  // Récupérer la progression actuelle
  const progress = await getOrCreateUserProgress(userId, matiereId, themeId);
  
  // Calculer les nouvelles valeurs
  const newPoints = progress.points + pointsEarned;
  const newQuizzesCompleted = progress.quizzes_completed + 1;
  const newCorrectAnswers = progress.correct_answers + correctAnswers;
  const newTotalAnswers = progress.total_answers + totalQuestions;
  const newBestScore = Math.max(progress.best_score, score);
  
  // Déterminer le nouveau niveau
  let newNiveau = progress.niveau;
  for (const [niveau, config] of Object.entries(NIVEAUX_CONFIG)) {
    if (newPoints >= config.points_min && newPoints <= config.points_max) {
      newNiveau = niveau as UserProgress['niveau'];
      break;
    }
  }
  
  // Mettre à jour dans la base
  const progressId = typeof progress.id === 'string' && progress.id.includes(':') 
    ? progress.id.split(':')[1] 
    : progress.id;
    
  await db.query(`
    UPDATE type::thing('user_progress', $id) SET
      points = $points,
      niveau = $niveau,
      quizzes_completed = $quizzes_completed,
      correct_answers = $correct_answers,
      total_answers = $total_answers,
      best_score = $best_score,
      last_quiz_at = time::now(),
      updated_at = time::now()
  `, {
    id: progressId,
    points: newPoints,
    niveau: newNiveau,
    quizzes_completed: newQuizzesCompleted,
    correct_answers: newCorrectAnswers,
    total_answers: newTotalAnswers,
    best_score: newBestScore
  });
  
  return {
    ...progress,
    points: newPoints,
    niveau: newNiveau,
    quizzes_completed: newQuizzesCompleted,
    correct_answers: newCorrectAnswers,
    total_answers: newTotalAnswers,
    best_score: newBestScore,
    last_quiz_at: new Date()
  };
}

/**
 * Récupère toutes les progressions d'un utilisateur
 */
export async function getUserProgressAll(userId: string): Promise<UserProgress[]> {
  const db = await connectDB();
  
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
  
  const result = await db.query<any[]>(`
    SELECT *, 
           matiere_id.name as matiere_name,
           matiere_id.slug as matiere_slug,
           theme_id.name as theme_name,
           theme_id.slug as theme_slug
    FROM user_progress 
    WHERE user_id = type::thing('user', $userId)
    ORDER BY matiere_id.pos, theme_id.pos
  `, { userId: cleanUserId });
  
  return (result[0] as any[]) || [];
}

/**
 * Récupère le niveau d'un utilisateur pour une matière/thème spécifique
 * Retourne 'débutant' si pas encore de progression
 */
export async function getUserNiveau(
  userId: string, 
  matiereId: string, 
  themeId: string
): Promise<string> {
  const progress = await getOrCreateUserProgress(userId, matiereId, themeId);
  return progress.niveau;
}

/**
 * Récupère toutes les matières
 */
export async function getAllMatieres(): Promise<Matiere[]> {
  const db = await connectDB();
  const result = await db.query<any[]>('SELECT * FROM matiere WHERE is_active = true ORDER BY order');
  return (result[0] as any[]) || [];
}

/**
 * Récupère les thèmes d'une matière
 */
export async function getThemesByMatiere(matiereId: string): Promise<Theme[]> {
  const db = await connectDB();
  const cleanId = matiereId.includes(':') ? matiereId.split(':')[1] : matiereId;
  
  const result = await db.query<any[]>(`
    SELECT * FROM theme 
    WHERE matiere_id = type::thing('matiere', $matiereId) 
      AND is_active = true 
    ORDER BY order
  `, { matiereId: cleanId });
  
  return (result[0] as any[]) || [];
}

/**
 * Récupère tous les niveaux de progression
 */
export async function getAllNiveaux(): Promise<Niveau[]> {
  const db = await connectDB();
  const result = await db.query<any[]>('SELECT * FROM niveau ORDER BY pos');
  return (result[0] as any[]) || [];
}

/**
 * Récupère toutes les classes
 */
export async function getAllClasses(): Promise<{ name: string; slug: string; category_id: string }[]> {
  const db = await connectDB();
  const result = await db.query<any[]>('SELECT * FROM classe WHERE is_active = true ORDER BY pos');
  return (result[0] as any[]) || [];
}
