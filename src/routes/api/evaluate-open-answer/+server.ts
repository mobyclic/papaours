import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

/**
 * Endpoint pour évaluer les réponses ouvertes
 * 
 * Mode gratuit : Évaluation par mots-clés + auto-évaluation
 * Mode premium : Évaluation par IA (GPT-4o-mini via GitHub Models) + feedback personnalisé
 */

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';

interface EvaluationRequest {
  question: string;
  answer: string;
  expectedKeywords?: string[];
  sampleAnswers?: string[];
  minWords?: number;
  maxWords?: number;
  isPremium?: boolean;
  questionContext?: string; // Matière, niveau, etc.
}

interface KeywordEvaluation {
  mode: 'keywords';
  score: number; // 0-100
  foundKeywords: string[];
  missingKeywords: string[];
  wordCount: number;
  wordCountValid: boolean;
  feedback: string;
  sampleAnswers: string[];
}

interface AIEvaluation {
  mode: 'ai';
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  correctedAnswer?: string;
}

type EvaluationResult = KeywordEvaluation | AIEvaluation;

// Évaluation par mots-clés (gratuit)
function evaluateWithKeywords(
  answer: string,
  expectedKeywords: string[],
  sampleAnswers: string[],
  minWords: number,
  maxWords: number
): KeywordEvaluation {
  const answerLower = answer.toLowerCase().trim();
  const words = answerLower.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Vérifier les mots-clés
  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];
  
  for (const keyword of expectedKeywords) {
    if (answerLower.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }
  
  // Calculer le score basé sur les mots-clés
  const keywordScore = expectedKeywords.length > 0
    ? Math.round((foundKeywords.length / expectedKeywords.length) * 100)
    : 50; // Score neutre si pas de mots-clés définis
  
  // Vérifier le nombre de mots
  const wordCountValid = 
    (minWords === 0 || wordCount >= minWords) &&
    (maxWords === 0 || wordCount <= maxWords);
  
  // Ajuster le score si le nombre de mots n'est pas respecté
  let score = keywordScore;
  if (!wordCountValid) {
    score = Math.max(0, score - 20);
  }
  
  // Générer le feedback
  let feedback = '';
  if (foundKeywords.length === expectedKeywords.length && expectedKeywords.length > 0) {
    feedback = '🎉 Excellent ! Tu as mentionné tous les points clés attendus.';
  } else if (foundKeywords.length > 0) {
    feedback = `👍 Bien ! Tu as mentionné ${foundKeywords.length}/${expectedKeywords.length} points clés.`;
    if (missingKeywords.length > 0) {
      feedback += ` Il manque : ${missingKeywords.join(', ')}.`;
    }
  } else if (expectedKeywords.length > 0) {
    feedback = `💡 Ta réponse ne contient pas les points clés attendus. Essaie de mentionner : ${expectedKeywords.slice(0, 3).join(', ')}...`;
  } else {
    feedback = '✅ Réponse enregistrée. Compare-la avec les exemples ci-dessous.';
  }
  
  if (!wordCountValid) {
    if (wordCount < minWords) {
      feedback += ` ⚠️ Ta réponse est trop courte (${wordCount}/${minWords} mots minimum).`;
    } else if (wordCount > maxWords) {
      feedback += ` ⚠️ Ta réponse est trop longue (${wordCount}/${maxWords} mots maximum).`;
    }
  }
  
  return {
    mode: 'keywords',
    score,
    foundKeywords,
    missingKeywords,
    wordCount,
    wordCountValid,
    feedback,
    sampleAnswers
  };
}

// Évaluation par IA (premium) via GitHub Models API
async function evaluateWithAI(
  question: string,
  answer: string,
  expectedKeywords: string[],
  sampleAnswers: string[],
  questionContext?: string
): Promise<AIEvaluation> {
  const systemPrompt = `Tu es un correcteur pédagogique bienveillant pour enfants (6-12 ans). 
Tu dois évaluer une réponse à une question ouverte.
Sois encourageant mais honnête. Utilise un langage simple adapté aux enfants.
Réponds UNIQUEMENT en JSON valide, sans markdown ni code blocks.`;

  const userPrompt = `Question : ${question}
${questionContext ? `Contexte : ${questionContext}` : ''}
${expectedKeywords.length > 0 ? `Points clés attendus : ${expectedKeywords.join(', ')}` : ''}
${sampleAnswers.length > 0 ? `Exemples de bonnes réponses : ${sampleAnswers.slice(0, 2).join(' | ')}` : ''}

Réponse de l'élève : ${answer}

Évalue cette réponse et réponds en JSON :
{
  "score": <nombre de 0 à 100>,
  "feedback": "<feedback encourageant et constructif en 1-2 phrases>",
  "strengths": ["<point positif 1>", "<point positif 2>"],
  "improvements": ["<suggestion d'amélioration 1>"],
  "correctedAnswer": "<version améliorée courte si score < 70, sinon null>"
}`;

  try {
    const response = await fetch(GITHUB_MODELS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modèle léger et rapide
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub Models API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from API');
    }
    
    // Parser la réponse JSON (nettoyer les éventuels code blocks)
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const evaluation = JSON.parse(cleanedContent);
    
    return {
      mode: 'ai',
      score: Math.min(100, Math.max(0, evaluation.score || 50)),
      feedback: evaluation.feedback || 'Réponse évaluée.',
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      correctedAnswer: evaluation.correctedAnswer || undefined
    };
  } catch (error) {
    console.error('AI evaluation error:', error);
    // Fallback sur évaluation par mots-clés en cas d'erreur
    const keywordEval = evaluateWithKeywords(answer, expectedKeywords, sampleAnswers, 0, 0);
    return {
      mode: 'ai',
      score: keywordEval.score,
      feedback: keywordEval.feedback + ' (Évaluation automatique)',
      strengths: keywordEval.foundKeywords.length > 0 
        ? [`Tu as mentionné : ${keywordEval.foundKeywords.join(', ')}`] 
        : [],
      improvements: keywordEval.missingKeywords.length > 0
        ? [`Pense à mentionner : ${keywordEval.missingKeywords.join(', ')}`]
        : []
    };
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body: EvaluationRequest = await request.json();
    
    const {
      question,
      answer,
      expectedKeywords = [],
      sampleAnswers = [],
      minWords = 0,
      maxWords = 0,
      isPremium = false,
      questionContext
    } = body;
    
    if (!question || !answer) {
      return json({ error: 'Question et réponse requises' }, { status: 400 });
    }
    
    let result: EvaluationResult;
    
    if (isPremium) {
      // Évaluation IA pour les utilisateurs premium
      result = await evaluateWithAI(
        question,
        answer,
        expectedKeywords,
        sampleAnswers,
        questionContext
      );
    } else {
      // Évaluation par mots-clés pour les utilisateurs gratuits
      result = evaluateWithKeywords(
        answer,
        expectedKeywords,
        sampleAnswers,
        minWords,
        maxWords
      );
    }
    
    return json(result);
    
  } catch (error) {
    console.error('Evaluation error:', error);
    return json({ error: 'Erreur lors de l\'évaluation' }, { status: 500 });
  }
};
