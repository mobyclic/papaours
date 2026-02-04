import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';
import { connectDB } from '$lib/db';

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';

// Types de questions supportés
const QUESTION_TYPES = {
  qcm: 'Question à choix multiples avec 4 options (une seule bonne réponse)',
  qcm_multiple: 'Question à choix multiples avec plusieurs bonnes réponses possibles',
  true_false: 'Question Vrai ou Faux avec justification',
  fill_blank: 'Question à trous (texte avec blancs à compléter)',
  matching: 'Question d\'association (relier des éléments entre eux)',
  ordering: 'Question de classement/ordonnancement'
};

interface GenerateRequest {
  topic: string;
  matiere?: string;
  matiereId?: string;
  theme?: string;
  themeId?: string;
  classe?: string;
  difficulty?: number;
  questionType?: string;
  count?: number;
  additionalInstructions?: string;
}

// Fonction pour calculer la similarité entre deux textes (Jaccard)
function textSimilarity(text1: string, text2: string): number {
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// Vérifier si une question est un doublon
function isDuplicate(newQuestion: string, existingQuestions: string[], threshold = 0.7): { isDuplicate: boolean; similarity: number; matchedQuestion?: string } {
  for (const existing of existingQuestions) {
    const similarity = textSimilarity(newQuestion, existing);
    if (similarity >= threshold) {
      return { isDuplicate: true, similarity, matchedQuestion: existing };
    }
  }
  return { isDuplicate: false, similarity: 0 };
}

export const POST: RequestHandler = async ({ request }) => {
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    return json({ 
      error: 'Token GitHub non configuré. Ajoutez GITHUB_TOKEN dans .env' 
    }, { status: 500 });
  }

  try {
    const body: GenerateRequest = await request.json();
    const { 
      topic, 
      matiere,
      matiereId,
      theme,
      themeId, 
      classe, 
      difficulty = 1, 
      questionType = 'qcm',
      count = 1,
      additionalInstructions = ''
    } = body;

    if (!topic || topic.trim().length < 3) {
      return json({ error: 'Le sujet doit contenir au moins 3 caractères' }, { status: 400 });
    }

    // Récupérer les questions existantes pour éviter les doublons
    let existingQuestions: string[] = [];
    try {
      const db = await connectDB();
      
      // Construire la requête selon les filtres
      let whereClause = 'WHERE isActive = true';
      const params: Record<string, any> = {};
      
      if (matiereId) {
        whereClause += ' AND matiere_id = type::thing("subject", $matiereId)';
        params.matiereId = matiereId.includes(':') ? matiereId.split(':')[1] : matiereId;
      }
      
      if (themeId) {
        whereClause += ' AND type::thing("theme", $themeId) INSIDE theme_ids';
        params.themeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
      }
      
      if (questionType) {
        whereClause += ' AND questionType = $questionType';
        params.questionType = questionType;
      }
      
      // Limiter à 100 questions pour le contexte
      const result = await db.query<any[][]>(
        `SELECT question FROM question ${whereClause} LIMIT 100`,
        params
      );
      
      existingQuestions = (result[0] || []).map(q => q.question);
      console.log(`Found ${existingQuestions.length} existing questions for context`);
    } catch (dbError) {
      console.warn('Could not fetch existing questions:', dbError);
      // Continue sans les questions existantes
    }

    const difficultyLabel = difficulty === 1 ? 'facile' : difficulty === 2 ? 'moyen' : 'difficile';
    const typeDescription = QUESTION_TYPES[questionType as keyof typeof QUESTION_TYPES] || QUESTION_TYPES.qcm;

    const systemPrompt = `Tu es un expert en création de questions pédagogiques pour une application éducative française appelée "Kweez". 
Tu dois générer des questions de qualité, adaptées au niveau demandé.

RÈGLES IMPORTANTES:
- Les questions doivent être claires, précises et sans ambiguïté
- Les mauvaises réponses (distracteurs) doivent être plausibles mais clairement fausses
- L'explication doit être pédagogique et aider à comprendre
- Le contenu doit être adapté au niveau scolaire français
- Utilise un français correct et accessible
- Pour les QCM, propose toujours 4 options
- L'index correctAnswer est 0-based (0 = première option)
- TRÈS IMPORTANT: Ne génère PAS de questions trop similaires à celles déjà existantes

Tu dois TOUJOURS répondre en JSON valide selon le format demandé.`;

    const userPrompt = buildUserPrompt({
      topic,
      matiere,
      theme,
      classe,
      difficultyLabel,
      typeDescription,
      questionType,
      count,
      additionalInstructions,
      existingQuestions
    });

    const response = await fetch(GITHUB_MODELS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub Models API error:', errorText);
      return json({ 
        error: `Erreur API GitHub Models: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return json({ error: 'Réponse vide du modèle' }, { status: 500 });
    }

    // Parser le JSON de la réponse
    let questions;
    try {
      const parsed = JSON.parse(content);
      questions = parsed.questions || [parsed];
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      return json({ 
        error: 'Erreur de parsing de la réponse',
        raw: content
      }, { status: 500 });
    }

    // Valider et normaliser les questions
    let validatedQuestions = questions.map((q: any, index: number) => 
      validateAndNormalizeQuestion(q, questionType, index)
    ).filter(Boolean);

    if (validatedQuestions.length === 0) {
      return json({ 
        error: 'Aucune question valide générée',
        raw: content
      }, { status: 500 });
    }

    // Vérifier les doublons parmi les questions existantes
    let duplicatesCount = 0;
    validatedQuestions = validatedQuestions.map((q: any) => {
      const duplicateCheck = isDuplicate(q.question, existingQuestions, 0.6);
      if (duplicateCheck.isDuplicate) {
        duplicatesCount++;
        return {
          ...q,
          isPotentialDuplicate: true,
          duplicateSimilarity: Math.round(duplicateCheck.similarity * 100),
          similarTo: duplicateCheck.matchedQuestion
        };
      }
      return { ...q, isPotentialDuplicate: false };
    });

    return json({ 
      success: true,
      questions: validatedQuestions,
      duplicatesFound: duplicatesCount,
      existingQuestionsCount: existingQuestions.length,
      metadata: {
        topic,
        matiere,
        theme,
        classe,
        difficulty,
        questionType,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate questions error:', error);
    return json({ 
      error: 'Erreur lors de la génération',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
};

function buildUserPrompt(params: {
  topic: string;
  matiere?: string;
  theme?: string;
  classe?: string;
  difficultyLabel: string;
  typeDescription: string;
  questionType: string;
  count: number;
  additionalInstructions: string;
  existingQuestions?: string[];
}): string {
  const { topic, matiere, theme, classe, difficultyLabel, typeDescription, questionType, count, additionalInstructions, existingQuestions = [] } = params;

  let prompt = `Génère ${count} question(s) pédagogique(s) sur le sujet suivant:

SUJET: ${topic}`;

  if (matiere) prompt += `\nMATIÈRE: ${matiere}`;
  if (theme) prompt += `\nTHÈME: ${theme}`;
  if (classe) prompt += `\nNIVEAU SCOLAIRE: ${classe}`;

  // Ajouter les questions existantes comme contexte à éviter
  if (existingQuestions.length > 0) {
    prompt += `\n\n⚠️ QUESTIONS DÉJÀ EXISTANTES (à NE PAS reproduire ou paraphraser):`;
    // Limiter à 30 questions pour ne pas surcharger le contexte
    const questionsToShow = existingQuestions.slice(0, 30);
    questionsToShow.forEach((q, i) => {
      prompt += `\n${i + 1}. "${q}"`;
    });
    if (existingQuestions.length > 30) {
      prompt += `\n... et ${existingQuestions.length - 30} autres questions similaires`;
    }
    prompt += `\n\nGénère des questions DIFFÉRENTES et ORIGINALES qui n'existent pas encore.`;
  }
  
  prompt += `
DIFFICULTÉ: ${difficultyLabel}
TYPE DE QUESTION: ${typeDescription}`;

  if (additionalInstructions) {
    prompt += `\n\nINSTRUCTIONS SUPPLÉMENTAIRES: ${additionalInstructions}`;
  }

  // Format de sortie selon le type
  prompt += `\n\nRéponds UNIQUEMENT en JSON valide avec la structure suivante:
{
  "questions": [`;

  switch (questionType) {
    case 'qcm':
    case 'qcm_multiple':
      prompt += `
    {
      "question": "Texte de la question",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,  // Index de la bonne réponse (0-3)${questionType === 'qcm_multiple' ? `
      "correctAnswers": [0, 2],  // Indices des bonnes réponses pour QCM multiple` : ''}
      "explanation": "Explication pédagogique de la réponse",
      "difficulty": "${difficultyLabel}"
    }`;
      break;
    
    case 'true_false':
      prompt += `
    {
      "question": "Affirmation à évaluer",
      "correctAnswer": true,  // true ou false
      "explanation": "Explication de pourquoi c'est vrai ou faux",
      "difficulty": "${difficultyLabel}"
    }`;
      break;
    
    case 'fill_blank':
      prompt += `
    {
      "question": "Texte avec {{blank}} pour les trous",
      "blanks": ["réponse1", "réponse2"],  // Réponses dans l'ordre des trous
      "explanation": "Explication pédagogique",
      "difficulty": "${difficultyLabel}"
    }`;
      break;
    
    case 'matching':
      prompt += `
    {
      "question": "Consigne d'association",
      "leftItems": ["Item gauche 1", "Item gauche 2", "Item gauche 3"],
      "rightItems": ["Item droit 1", "Item droit 2", "Item droit 3"],
      "correctMatches": {"0": "1", "1": "0", "2": "2"},  // gauche index -> droite index
      "explanation": "Explication pédagogique",
      "difficulty": "${difficultyLabel}"
    }`;
      break;
    
    case 'ordering':
      prompt += `
    {
      "question": "Consigne de classement",
      "items": ["Item 1", "Item 2", "Item 3", "Item 4"],
      "correctOrder": [2, 0, 3, 1],  // Indices dans le bon ordre
      "explanation": "Explication pédagogique",
      "difficulty": "${difficultyLabel}"
    }`;
      break;
    
    default:
      prompt += `
    {
      "question": "Texte de la question",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Explication pédagogique",
      "difficulty": "${difficultyLabel}"
    }`;
  }

  prompt += `
  ]
}`;

  return prompt;
}

function validateAndNormalizeQuestion(q: any, questionType: string, index: number): any | null {
  if (!q || !q.question) return null;

  const base = {
    question: q.question,
    explanation: q.explanation || 'Pas d\'explication fournie.',
    difficulty: q.difficulty || 'facile',
    questionType
  };

  switch (questionType) {
    case 'qcm':
      if (!Array.isArray(q.options) || q.options.length < 2) return null;
      return {
        ...base,
        options: q.options,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
      };
    
    case 'qcm_multiple':
      if (!Array.isArray(q.options) || q.options.length < 2) return null;
      return {
        ...base,
        options: q.options,
        correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [0]
      };
    
    case 'true_false':
      return {
        ...base,
        correctAnswer: q.correctAnswer === true || q.correctAnswer === 'true'
      };
    
    case 'fill_blank':
      if (!Array.isArray(q.blanks) || q.blanks.length === 0) return null;
      return {
        ...base,
        blanks: q.blanks
      };
    
    case 'matching':
      if (!Array.isArray(q.leftItems) || !Array.isArray(q.rightItems)) return null;
      return {
        ...base,
        leftItems: q.leftItems,
        rightItems: q.rightItems,
        correctMatches: q.correctMatches || {}
      };
    
    case 'ordering':
      if (!Array.isArray(q.items) || q.items.length < 2) return null;
      return {
        ...base,
        items: q.items,
        correctOrder: Array.isArray(q.correctOrder) ? q.correctOrder : q.items.map((_: any, i: number) => i)
      };
    
    default:
      return {
        ...base,
        options: q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: q.correctAnswer || 0
      };
  }
}
