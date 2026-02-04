import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { env } from '$env/dynamic/private';

// Modèles disponibles via GitHub Models (gratuit)
const AVAILABLE_MODELS = {
  'gpt-4o': { name: 'GPT-4o', provider: 'openai' },
  'gpt-4o-mini': { name: 'GPT-4o Mini (rapide)', provider: 'openai' },
  'gpt-4.1': { name: 'GPT-4.1', provider: 'openai' },
  'gpt-4.1-mini': { name: 'GPT-4.1 Mini', provider: 'openai' },
  'o3-mini': { name: 'o3-mini (raisonnement)', provider: 'openai' },
  'DeepSeek-R1': { name: 'DeepSeek R1', provider: 'deepseek' },
  'Llama-3.3-70B-Instruct': { name: 'Llama 3.3 70B', provider: 'meta' },
  'Mistral-Large-2411': { name: 'Mistral Large', provider: 'mistral' },
  'Phi-4': { name: 'Phi-4 (Microsoft)', provider: 'microsoft' },
} as const;

type ModelId = keyof typeof AVAILABLE_MODELS;

// Endpoint pour lister les modèles disponibles
export const GET: RequestHandler = async () => {
  const models = Object.entries(AVAILABLE_MODELS).map(([id, info]) => ({
    id,
    name: info.name,
    provider: info.provider
  }));
  return json({ models });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { 
    grade_slug, 
    subject_code, 
    chapters_count = 6, 
    include_descriptions = true,
    model = 'gpt-4o-mini' 
  } = await request.json();

  if (!grade_slug || !subject_code) {
    return json({ error: 'Classe et matière requises' }, { status: 400 });
  }

  const githubToken = env.GITHUB_TOKEN;
  if (!githubToken) {
    return json({ error: 'GITHUB_TOKEN non configuré' }, { status: 500 });
  }

  const db = await getSurrealDB();

  try {
    // Récupérer les infos de la classe et de la matière
    const [gradeResult, subjectResult] = await Promise.all([
      db.query<[any[]]>(`
        SELECT *, cycle.name as cycle_name 
        FROM grade 
        WHERE slug = $slug
        FETCH cycle
      `, { slug: grade_slug }),
      db.query<[any[]]>(`
        SELECT * FROM subject WHERE code = $code
      `, { code: subject_code })
    ]);

    const grade = gradeResult[0]?.[0];
    const subject = subjectResult[0]?.[0];

    if (!grade || !subject) {
      return json({ error: 'Classe ou matière introuvable' }, { status: 404 });
    }

    // Construire le prompt
    const prompt = buildPrompt(grade, subject, chapters_count, include_descriptions);

    // Appeler GitHub Models API
    const selectedModel = model in AVAILABLE_MODELS ? model : 'gpt-4o-mini';
    
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en programmes scolaires français. Tu réponds uniquement en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub Models error:', errorText);
      return json({ error: `Erreur API GitHub Models: ${response.status}` }, { status: 500 });
    }

    const result = await response.json();
    const textContent = result.choices?.[0]?.message?.content;

    if (!textContent) {
      return json({ error: 'Réponse vide de l\'IA' }, { status: 500 });
    }

    const chapters = parseChaptersFromResponse(textContent, chapters_count);

    return json({
      success: true,
      model: selectedModel,
      grade: {
        name: grade.name,
        cycle_name: grade.cycle_name || grade.cycle?.name
      },
      subject: {
        name: subject.name,
        code: subject.code
      },
      chapters
    });

  } catch (error) {
    console.error('Erreur génération IA:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Erreur lors de la génération' 
    }, { status: 500 });
  }
};

function buildPrompt(grade: any, subject: any, chaptersCount: number, includeDescriptions: boolean): string {
  const cycleName = grade.cycle_name || grade.cycle?.name || '';
  
  return `Génère une liste de ${chaptersCount} chapitres pour le programme officiel français de **${subject.name}** en **${grade.name}** (${cycleName}).

IMPORTANT:
- Base-toi sur les programmes officiels du Bulletin Officiel de l'Éducation Nationale
- Les chapitres doivent être dans l'ordre logique d'enseignement sur une année scolaire
- Utilise des titres concis et clairs
${includeDescriptions ? '- Inclus une brève description (1-2 phrases) pour chaque chapitre' : '- Ne pas inclure de descriptions'}

FORMAT DE RÉPONSE (JSON strict):
{
  "chapters": [
    {
      "name": "Titre du chapitre"${includeDescriptions ? ',\n      "description": "Description brève du contenu"' : ''}
    }
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

function parseChaptersFromResponse(text: string, expectedCount: number): Array<{ name: string; description?: string }> {
  try {
    // Nettoyer le texte (enlever markdown code blocks si présents)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Essayer de parser le JSON directement
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.chapters && Array.isArray(parsed.chapters)) {
        return parsed.chapters.map((ch: any, index: number) => ({
          name: ch.name || ch.title || `Chapitre ${index + 1}`,
          description: ch.description || undefined
        }));
      }
    }
  } catch (e) {
    console.error('Erreur parsing JSON:', e);
  }

  // Fallback: essayer de parser manuellement
  const chapters: Array<{ name: string; description?: string }> = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    const match = line.match(/^[\d\-\*\.]+\s*(.+)/);
    if (match && chapters.length < expectedCount) {
      chapters.push({ name: match[1].trim() });
    }
  }

  return chapters.length > 0 ? chapters : [
    { name: 'Chapitre 1 - À définir' },
    { name: 'Chapitre 2 - À définir' }
  ];
}
