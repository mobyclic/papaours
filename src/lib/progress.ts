import { connectDB } from './db';

/**
 * Système de progression utilisateur par matière/thème/grade
 * 
 * Niveaux : débutant → apprenti → confirmé → expert → maître
 * Points requis : 0 → 100 → 300 → 600 → 1000
 * 
 * Sélection des questions selon le niveau :
 * - Débutant : 100% faciles (difficulty 1)
 * - Apprenti : 70% faciles + 30% moyennes (difficulty 1-2)
 * - Confirmé : 20% faciles + 60% moyennes + 20% difficiles (difficulty 1-3)
 * - Expert : 10% faciles + 30% moyennes + 60% difficiles (difficulty 2-3)
 * - Maître : 100% difficiles (difficulty 3)
 */

export interface UserProgress {
  id: string;
  user_id: string;
  matiere_id: string;
  theme_id: string;
  grade_id: string;
  niveau: 'débutant' | 'apprenti' | 'confirmé' | 'expert' | 'maître';
  points: number;
  quizzes_completed: number;
  correct_answers: number;
  total_answers: number;
  best_score: number;
  last_quiz_at: Date | null;
}

/**
 * Configuration des distributions de difficulté par niveau
 * difficulty: 1 = facile, 2 = moyen, 3 = difficile
 */
export const DIFFICULTY_DISTRIBUTION: Record<string, { easy: number; medium: number; hard: number }> = {
  'débutant': { easy: 100, medium: 0, hard: 0 },
  'apprenti': { easy: 70, medium: 30, hard: 0 },
  'confirmé': { easy: 20, medium: 60, hard: 20 },
  'expert': { easy: 10, medium: 30, hard: 60 },
  'maître': { easy: 0, medium: 20, hard: 80 }
};

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
 * Récupère ou crée la progression d'un utilisateur pour une matière/thème/grade donnée
 */
export async function getOrCreateUserProgress(
  userId: string, 
  matiereId: string, 
  themeId: string,
  gradeId: string
): Promise<UserProgress> {
  const db = await connectDB();
  
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
  const cleanMatiereId = matiereId.includes(':') ? matiereId.split(':')[1] : matiereId;
  const cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
  const cleanGradeId = gradeId.includes(':') ? gradeId.split(':')[1] : gradeId;
  
  // Chercher la progression existante (l'index unique est sur user_id, matiere_id, theme_id)
  const existing = await db.query<any[]>(`
    SELECT * FROM user_progress 
    WHERE user_id = type::thing('user', $userId) 
      AND matiere_id = type::thing('matiere', $matiereId)
      AND theme_id = type::thing('theme', $themeId)
  `, { 
    userId: cleanUserId,
    matiereId: cleanMatiereId,
    themeId: cleanThemeId
  });
  
  if ((existing[0] as any[])?.length) {
    const progress = (existing[0] as any[])[0] as UserProgress;
    // Mettre à jour grade_id si différent (l'utilisateur a changé de niveau)
    if (progress.grade_id?.toString() !== `grade:${cleanGradeId}`) {
      await db.query(`
        UPDATE type::thing('user_progress', $id) SET grade_id = type::thing('grade', $gradeId)
      `, { 
        id: progress.id?.toString().split(':')[1] || progress.id,
        gradeId: cleanGradeId 
      });
    }
    return progress;
  }
  
  // Créer une nouvelle progression (débutant par défaut)
  try {
    const createResult = await db.query<any[]>(`
      CREATE user_progress SET
        user_id = type::thing('user', $userId),
        matiere_id = type::thing('matiere', $matiereId),
        theme_id = type::thing('theme', $themeId),
        grade_id = type::thing('grade', $gradeId),
        niveau = 'débutant',
        points = 0,
        quizzes_completed = 0,
        correct_answers = 0,
        total_answers = 0,
        best_score = 0,
        last_quiz_at = NONE,
        created_at = time::now(),
        updated_at = time::now()
    `, {
      userId: cleanUserId,
      matiereId: cleanMatiereId,
      themeId: cleanThemeId,
      gradeId: cleanGradeId
    });
    
    const created = (createResult[0] as any[])?.[0];
    return created as UserProgress;
  } catch (error: any) {
    // Si doublon (race condition), récupérer l'existant
    if (error.message?.includes('already contains')) {
      const retry = await db.query<any[]>(`
        SELECT * FROM user_progress 
        WHERE user_id = type::thing('user', $userId) 
          AND matiere_id = type::thing('matiere', $matiereId)
          AND theme_id = type::thing('theme', $themeId)
      `, { userId: cleanUserId, matiereId: cleanMatiereId, themeId: cleanThemeId });
      
      if ((retry[0] as any[])?.length) {
        return (retry[0] as any[])[0] as UserProgress;
      }
    }
    throw error;
  }
}

/**
 * Met à jour la progression après un quiz complété
 */
export async function updateProgressAfterQuiz(
  userId: string,
  matiereId: string,
  themeId: string,
  gradeId: string,
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
  const progress = await getOrCreateUserProgress(userId, matiereId, themeId, gradeId);
  
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
           matiere_id.pos as matiere_pos,
           theme_id.name as theme_name,
           theme_id.slug as theme_slug,
           theme_id.pos as theme_pos
    FROM user_progress 
    WHERE user_id = type::thing('user', $userId)
    ORDER BY matiere_pos ASC, theme_pos ASC
  `, { userId: cleanUserId });
  
  return (result[0] as any[]) || [];
}

/**
 * Récupère le niveau d'un utilisateur pour une matière/thème/grade spécifique
 * Retourne 'débutant' si pas encore de progression
 */
export async function getUserNiveau(
  userId: string, 
  matiereId: string, 
  themeId: string,
  gradeId: string
): Promise<string> {
  const progress = await getOrCreateUserProgress(userId, matiereId, themeId, gradeId);
  return progress.niveau;
}

/**
 * Récupère les progressions d'un utilisateur pour tous les thèmes d'une matière et grade donnée
 * Utile pour savoir quels niveaux utiliser pour sélectionner les questions
 */
export async function getUserProgressByThemes(
  userId: string,
  gradeId: string,
  themeIds: string[]
): Promise<Map<string, UserProgress>> {
  const db = await connectDB();
  const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
  const cleanGradeId = gradeId.includes(':') ? gradeId.split(':')[1] : gradeId;
  
  // Construire la requête pour récupérer toutes les progressions des thèmes concernés
  const themeConditions = themeIds.map((_, i) => `theme_id = type::thing('theme', $theme${i})`).join(' OR ');
  const params: Record<string, string> = {
    userId: cleanUserId,
    gradeId: cleanGradeId
  };
  themeIds.forEach((id, i) => {
    params[`theme${i}`] = id.includes(':') ? id.split(':')[1] : id;
  });
  
  const result = await db.query<any[]>(`
    SELECT * FROM user_progress 
    WHERE user_id = type::thing('user', $userId)
      AND grade_id = type::thing('grade', $gradeId)
      AND (${themeConditions})
  `, params);
  
  const progressMap = new Map<string, UserProgress>();
  for (const p of (result[0] as any[]) || []) {
    const themeId = p.theme_id?.toString() || p.theme_id;
    progressMap.set(themeId, p as UserProgress);
  }
  
  return progressMap;
}

/**
 * Sélectionne des questions adaptées au niveau de l'utilisateur
 * 
 * @param allQuestions - Toutes les questions disponibles
 * @param userNiveau - Le niveau de l'utilisateur (ou le niveau moyen pour plusieurs thèmes)
 * @param gradeId - L'ID du grade pour filtrer les difficultés
 * @param maxQuestions - Nombre max de questions à retourner
 * @returns Questions sélectionnées et mélangées
 */
export function selectQuestionsForLevel(
  allQuestions: any[],
  userNiveau: string,
  gradeId: string,
  maxQuestions: number
): any[] {
  const distribution = DIFFICULTY_DISTRIBUTION[userNiveau] || DIFFICULTY_DISTRIBUTION['débutant'];
  const cleanGradeId = gradeId.includes(':') ? gradeId : `grade:${gradeId}`;
  
  // Séparer les questions par difficulté pour ce grade
  const easyQuestions: any[] = [];
  const mediumQuestions: any[] = [];
  const hardQuestions: any[] = [];
  
  for (const q of allQuestions) {
    // Trouver la difficulté pour ce grade (chercher dans grade_difficulties ou class_difficulties pour rétrocompatibilité)
    const gradeDiff = (q.grade_difficulties || q.class_difficulties || []).find((gd: any) => {
      const gdGradeId = gd.grade_id?.toString() || gd.classe_id?.toString() || gd.grade_id || gd.classe_id;
      return gdGradeId === cleanGradeId || gdGradeId === gradeId;
    });
    
    if (!gradeDiff) {
      // Si pas de difficulté définie pour ce grade, considérer comme facile
      easyQuestions.push(q);
      continue;
    }
    
    const difficulty = gradeDiff.difficulty || 1;
    if (difficulty === 1) easyQuestions.push(q);
    else if (difficulty === 2) mediumQuestions.push(q);
    else hardQuestions.push(q);
  }
  
  // Calculer le nombre de questions par difficulté
  const totalAvailable = easyQuestions.length + mediumQuestions.length + hardQuestions.length;
  const targetCount = Math.min(maxQuestions, totalAvailable);
  
  let easyCount = Math.round((distribution.easy / 100) * targetCount);
  let mediumCount = Math.round((distribution.medium / 100) * targetCount);
  let hardCount = Math.round((distribution.hard / 100) * targetCount);
  
  // Ajuster si pas assez de questions d'une difficulté
  // Redistribuer vers des difficultés adjacentes
  if (easyCount > easyQuestions.length) {
    const excess = easyCount - easyQuestions.length;
    easyCount = easyQuestions.length;
    mediumCount += excess;
  }
  if (mediumCount > mediumQuestions.length) {
    const excess = mediumCount - mediumQuestions.length;
    mediumCount = mediumQuestions.length;
    // Redistribuer vers facile ou difficile selon le niveau
    if (distribution.easy > distribution.hard) {
      easyCount = Math.min(easyCount + excess, easyQuestions.length);
      hardCount += (excess - (easyCount - Math.min(easyCount, easyQuestions.length)));
    } else {
      hardCount += excess;
    }
  }
  if (hardCount > hardQuestions.length) {
    const excess = hardCount - hardQuestions.length;
    hardCount = hardQuestions.length;
    mediumCount = Math.min(mediumCount + excess, mediumQuestions.length);
  }
  
  // S'assurer qu'on ne dépasse pas le nombre de questions disponibles
  easyCount = Math.min(easyCount, easyQuestions.length);
  mediumCount = Math.min(mediumCount, mediumQuestions.length);
  hardCount = Math.min(hardCount, hardQuestions.length);
  
  // Mélanger et sélectionner
  const shuffleArray = <T>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const selectedEasy = shuffleArray(easyQuestions).slice(0, easyCount);
  const selectedMedium = shuffleArray(mediumQuestions).slice(0, mediumCount);
  const selectedHard = shuffleArray(hardQuestions).slice(0, hardCount);
  
  // Combiner et mélanger le résultat final
  const selected = [...selectedEasy, ...selectedMedium, ...selectedHard];
  return shuffleArray(selected);
}

/**
 * Détermine le niveau moyen à utiliser pour un quiz avec plusieurs thèmes
 */
export function getAverageNiveau(progressMap: Map<string, UserProgress>, themeIds: string[]): string {
  const niveauOrder = ['débutant', 'apprenti', 'confirmé', 'expert', 'maître'];
  let totalScore = 0;
  let count = 0;
  
  for (const themeId of themeIds) {
    const progress = progressMap.get(themeId) || progressMap.get(`theme:${themeId}`);
    const niveau = progress?.niveau || 'débutant';
    totalScore += niveauOrder.indexOf(niveau);
    count++;
  }
  
  if (count === 0) return 'débutant';
  
  const avgIndex = Math.floor(totalScore / count);
  return niveauOrder[avgIndex] || 'débutant';
}

/**
 * Récupère toutes les matières
 */
export async function getAllMatieres(): Promise<Matiere[]> {
  const db = await connectDB();
  const result = await db.query<any[]>('SELECT * FROM matiere WHERE is_active = true ORDER BY `order`');
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
    ORDER BY \`order\`
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
 * Récupère tous les grades
 */
export async function getAllGrades(): Promise<{ name: string; code: string; cycle: string }[]> {
  const db = await connectDB();
  const result = await db.query<any[]>('SELECT * FROM grade ORDER BY `order`');
  return (result[0] as any[]) || [];
}

/**
 * Configuration des points par difficulté de question
 */
export const POINTS_PER_DIFFICULTY: Record<number, number> = {
  1: 5,   // Facile : 5 points
  2: 10,  // Moyen : 10 points
  3: 15   // Difficile : 15 points
};

/**
 * S'assure que les entrées user_progress existent pour tous les thèmes d'une question
 * Appelé au début de chaque question (avant de l'afficher)
 */
export async function ensureUserProgressForQuestion(
  userId: string,
  gradeId: string,
  questionId: string
): Promise<void> {
  // Ignorer les utilisateurs anonymes
  if (userId.startsWith('anonymous_')) return;
  
  const db = await connectDB();
  const cleanQuestionId = questionId.includes(':') ? questionId.split(':')[1] : questionId;
  
  // Récupérer la question avec ses thèmes et matière
  const questionResult = await db.query<any[]>(
    'SELECT matiere_id, theme_ids FROM type::thing("question", $id)',
    { id: cleanQuestionId }
  );
  
  const question = (questionResult[0] as any[])?.[0];
  if (!question || !question.matiere_id || !question.theme_ids?.length) return;
  
  const matiereId = question.matiere_id?.toString() || question.matiere_id;
  
  // Créer une entrée pour chaque thème de la question
  for (const themeId of question.theme_ids) {
    const themeIdStr = themeId?.toString() || themeId;
    await getOrCreateUserProgress(userId, matiereId, themeIdStr, gradeId);
  }
}

/**
 * Met à jour les points de progression après une réponse
 * +points si correct, -moitié si faux
 */
export async function updateProgressAfterAnswer(
  userId: string,
  gradeId: string,
  questionId: string,
  isCorrect: boolean
): Promise<void> {
  // Ignorer les utilisateurs anonymes
  if (userId.startsWith('anonymous_')) return;
  
  const db = await connectDB();
  const cleanQuestionId = questionId.includes(':') ? questionId.split(':')[1] : questionId;
  
  // Récupérer la question avec ses thèmes, matière et difficulté
  const questionResult = await db.query<any[]>(
    'SELECT matiere_id, theme_ids, difficulty, grade_difficulties FROM type::thing("question", $id)',
    { id: cleanQuestionId }
  );
  
  const question = (questionResult[0] as any[])?.[0];
  if (!question || !question.matiere_id || !question.theme_ids?.length) return;
  
  // Déterminer la difficulté (soit par grade, soit globale)
  let difficulty = question.difficulty || 1;
  if (question.grade_difficulties && gradeId) {
    const cleanGradeId = gradeId.includes(':') ? gradeId.split(':')[1] : gradeId;
    const gradeDiff = (question.grade_difficulties || []).find((gd: any) => {
      const gdId = gd.grade_id?.toString() || gd.grade_id;
      return gdId === `grade:${cleanGradeId}` || gdId === cleanGradeId;
    });
    if (gradeDiff) difficulty = gradeDiff.difficulty || difficulty;
  }
  
  // Calculer les points
  const basePoints = POINTS_PER_DIFFICULTY[difficulty] || 5;
  const pointsChange = isCorrect ? basePoints : -Math.floor(basePoints / 2);
  
  const matiereId = question.matiere_id?.toString() || question.matiere_id;
  const cleanMatiereId = matiereId.includes(':') ? matiereId.split(':')[1] : matiereId;
  const cleanGradeId = gradeId.includes(':') ? gradeId.split(':')[1] : gradeId;
  
  // Mettre à jour chaque thème
  for (const themeId of question.theme_ids) {
    const themeIdStr = themeId?.toString() || themeId;
    const cleanThemeId = themeIdStr.includes(':') ? themeIdStr.split(':')[1] : themeIdStr;
    
    // Récupérer ou créer la progression
    const progress = await getOrCreateUserProgress(userId, matiereId, themeIdStr, gradeId);
    
    // Calculer les nouveaux points (minimum 0)
    const newPoints = Math.max(0, progress.points + pointsChange);
    const newCorrectAnswers = progress.correct_answers + (isCorrect ? 1 : 0);
    const newTotalAnswers = progress.total_answers + 1;
    
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
        correct_answers = $correct_answers,
        total_answers = $total_answers,
        updated_at = time::now()
    `, {
      id: progressId,
      points: newPoints,
      niveau: newNiveau,
      correct_answers: newCorrectAnswers,
      total_answers: newTotalAnswers
    });
    
    console.log(`📊 Progress updated: user=${userId}, theme=${cleanThemeId}, points=${progress.points}→${newPoints} (${isCorrect ? '+' : ''}${pointsChange}), niveau=${newNiveau}`);
  }
}
