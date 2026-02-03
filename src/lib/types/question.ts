// Types pour le système de questions

export type QuestionType = 
  | 'qcm'           // QCM classique
  | 'qcm_image'     // QCM avec images comme réponses
  | 'qcm_multiple'  // QCM plusieurs bonnes réponses
  | 'true_false'    // Vrai/Faux avec justification
  | 'open_short'    // Question ouverte courte
  | 'open_long'     // Question ouverte longue/argumentée
  | 'fill_blank'    // Texte à trous
  | 'media_analysis'// Analyse de média
  | 'error_spotting'// Repérage d'erreurs
  | 'matching'      // Association/appariement
  | 'ordering'      // Classement/ordonnancement

/**
 * Metadata flexible pour les questions
 * Permet d'ajouter des options de validation et d'affichage
 * sans modifier le schéma de base
 */
export interface QuestionMetadata {
  // === VALIDATION DE RÉPONSE ===
  
  /** Type de réponse attendue pour validation intelligente */
  answerType?: 'text' | 'integer' | 'float' | 'date' | 'year' | 'regex';
  
  /** Pattern regex personnalisé (si answerType = 'regex') */
  pattern?: string; // ex: "^[a-zA-Z0-9]+$"
  
  /** Tolérance pour réponses numériques (ex: 10 pour ±10) */
  tolerance?: number;
  
  /** Type de tolérance: valeur absolue ou pourcentage */
  toleranceType?: 'absolute' | 'percent';
  
  /** Nombre minimum de caractères */
  minChars?: number;
  
  /** Nombre maximum de caractères */
  maxChars?: number;
  
  // === AFFICHAGE / UX ===
  
  /** Placeholder pour l'input */
  inputPlaceholder?: string; // ex: "Année (AAAA)"
  
  /** Texte d'aide sous l'input */
  inputHint?: string; // ex: "Format: AAAA"
  
  /** Type d'input HTML (affecte le clavier mobile) */
  inputType?: 'text' | 'number' | 'tel';
  
  /** Normalisation de la réponse avant comparaison */
  normalize?: 'lowercase' | 'uppercase' | 'trim' | 'none';
  
  /** Accepter des réponses alternatives (synonymes) */
  alternativeAnswers?: string[];
  
  // === FEEDBACK ===
  
  /** Afficher la réponse exacte attendue après validation ? */
  showExpectedAnswer?: boolean;
  
  /** Message personnalisé si réponse proche mais pas exacte */
  nearMatchMessage?: string; // ex: "Tu étais proche !"
  
  /** Unité à afficher (ex: "km", "°C", "ans") */
  unit?: string;
}

/** Presets de metadata pour faciliter la création de questions */
export const METADATA_PRESETS: Record<string, Partial<QuestionMetadata>> = {
  year: {
    answerType: 'year',
    maxChars: 4,
    inputType: 'number',
    inputPlaceholder: 'AAAA',
    inputHint: 'Entre une année (ex: 1789)',
  },
  integer: {
    answerType: 'integer',
    inputType: 'number',
    inputPlaceholder: 'Nombre',
  },
  float: {
    answerType: 'float',
    inputType: 'number',
    inputPlaceholder: 'Nombre décimal',
  },
  percentage: {
    answerType: 'integer',
    inputType: 'number',
    tolerance: 5,
    toleranceType: 'absolute',
    unit: '%',
    inputPlaceholder: 'Pourcentage',
  },
  distance_km: {
    answerType: 'integer',
    inputType: 'number',
    tolerance: 10,
    toleranceType: 'percent',
    unit: 'km',
    inputPlaceholder: 'Distance en km',
  },
  chemical_symbol: {
    answerType: 'text',
    normalize: 'uppercase',
    maxChars: 3,
    inputPlaceholder: 'Symbole',
    inputHint: 'Ex: Au, Fe, O',
  },
  word: {
    answerType: 'text',
    normalize: 'lowercase',
    inputPlaceholder: 'Un mot',
  },
};

export interface Answer {
  id: string;
  text: string;
  points: number;
  is_correct: boolean;
  order: number;
  // Pour Vrai/Faux avec justification
  justification?: string;
  // Pour les médias sur les réponses
  image_url?: string;
}

export interface MatchingPair {
  id: string;
  left: string;       // Élément de gauche (ex: format)
  right: string;      // Élément de droite (ex: usage)
  left_image?: string;
  right_image?: string;
}

export interface OrderingItem {
  id: string;
  text: string;
  correct_position: number;
  image_url?: string;
}

export interface MediaError {
  id: string;
  x: number;          // Position X en % (pour clic sur image)
  y: number;          // Position Y en %
  description: string;
  hint?: string;
}

export interface QuestionTranslation {
  language: string;
  title: string;
  subtitle?: string;
  intro?: string;
  hint?: string;
  explanation?: string;
  // Pour questions ouvertes
  expected_answer?: string;       // Réponse attendue (pour correction)
  answer_guidelines?: string;     // Guidelines de notation
  keywords?: string[];            // Mots-clés attendus
}

export interface Question {
  id: string;
  
  // Classification
  theme_id: string;
  theme_name?: string;
  level_id: string;
  level_name?: string;
  type: QuestionType;
  
  // Multi-language content
  translations: QuestionTranslation[];
  default_language: string;
  
  // QCM / Vrai-Faux
  answers?: Answer[];
  
  // Association (Matching)
  matching_pairs?: MatchingPair[];
  
  // Classement (Ordering)
  ordering_items?: OrderingItem[];
  
  // Analyse de média / Repérage d'erreurs
  media_errors?: MediaError[];
  
  // Media principal
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  
  // Settings
  time_limit?: number;
  difficulty_weight: number;
  points_total: number;
  is_active: boolean;
  
  // Pour questions ouvertes
  min_words?: number;
  max_words?: number;
  require_justification?: boolean;
  
  // Metadata flexible pour options de validation/affichage
  metadata?: QuestionMetadata;
  
  // Tracking
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export interface QuestionStats {
  question_id: string;
  total_attempts: number;
  correct_attempts: number;
  average_time: number;
  success_rate: number;
  // Par tentative (pour suivi progression)
  attempts_history?: {
    user_id: string;
    attempt_number: number;
    is_correct: boolean;
    score: number;
    timestamp: string;
  }[];
}

export const QUESTION_TYPES: { 
  value: QuestionType; 
  label: string; 
  description: string;
  icon: string;
  color: string;
  category: 'knowledge' | 'open' | 'multimedia' | 'interactive';
}[] = [
  // Connaissances factuelles
  { 
    value: 'qcm', 
    label: 'QCM (1 réponse)', 
    description: 'Une seule bonne réponse parmi plusieurs choix',
    icon: '🔘',
    color: 'blue',
    category: 'knowledge'
  },
  { 
    value: 'qcm_image', 
    label: 'QCM Images', 
    description: 'Choisir la bonne image parmi plusieurs',
    icon: '🖼️',
    color: 'pink',
    category: 'knowledge'
  },
  { 
    value: 'qcm_multiple', 
    label: 'QCM (plusieurs réponses)', 
    description: 'Plusieurs bonnes réponses possibles',
    icon: '☑️',
    color: 'indigo',
    category: 'knowledge'
  },
  { 
    value: 'true_false', 
    label: 'Vrai / Faux', 
    description: 'Question binaire avec justification optionnelle',
    icon: '⚖️',
    color: 'green',
    category: 'knowledge'
  },
  
  // Questions ouvertes
  { 
    value: 'open_short', 
    label: 'Réponse courte', 
    description: 'Réponse libre en quelques mots ou phrases',
    icon: '✏️',
    color: 'amber',
    category: 'open'
  },
  { 
    value: 'open_long', 
    label: 'Réponse argumentée', 
    description: 'Réponse développée avec argumentation',
    icon: '📝',
    color: 'orange',
    category: 'open'
  },
  
  // Multimédia
  { 
    value: 'media_analysis', 
    label: 'Analyse de média', 
    description: 'Analyser une image, vidéo, son ou interface',
    icon: '🎬',
    color: 'purple',
    category: 'multimedia'
  },
  { 
    value: 'error_spotting', 
    label: 'Repérage d\'erreurs', 
    description: 'Identifier les erreurs dans un média',
    icon: '🔍',
    color: 'red',
    category: 'multimedia'
  },
  
  // Interactif
  { 
    value: 'matching', 
    label: 'Association', 
    description: 'Relier des concepts entre eux',
    icon: '🔗',
    color: 'cyan',
    category: 'interactive'
  },
  { 
    value: 'ordering', 
    label: 'Classement', 
    description: 'Mettre des éléments dans le bon ordre',
    icon: '📊',
    color: 'teal',
    category: 'interactive'
  },
];

export const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export function getQuestionTypeInfo(type: QuestionType) {
  return QUESTION_TYPES.find(t => t.value === type);
}

export function getTypeColor(type: QuestionType): string {
  const info = getQuestionTypeInfo(type);
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
  };
  return colors[info?.color || 'gray'] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export function createEmptyQuestion(): Partial<Question> {
  return {
    type: 'qcm',
    translations: [{ language: 'fr', title: '' }],
    default_language: 'fr',
    answers: [
      { id: crypto.randomUUID(), text: '', points: 10, is_correct: true, order: 1 },
      { id: crypto.randomUUID(), text: '', points: 0, is_correct: false, order: 2 },
    ],
    difficulty_weight: 5,
    points_total: 10,
    is_active: true,
  };
}
