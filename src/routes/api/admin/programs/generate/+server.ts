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

// GET - Liste des modèles disponibles
export const GET: RequestHandler = async () => {
  const models = Object.entries(AVAILABLE_MODELS).map(([id, info]) => ({
    id,
    name: info.name,
    provider: info.provider
  }));
  return json({ models });
};

// POST - Générer un programme complet (une ou toutes les matières)
export const POST: RequestHandler = async ({ request }) => {
  const { 
    grade_id,
    subject_codes, // array de codes, ou ['all'] pour toutes
    custom_prompt,
    model = 'gpt-4o-mini',
    existing_programs // programmes existants pour comparaison
  } = await request.json();

  if (!grade_id) {
    return json({ error: 'Classe requise' }, { status: 400 });
  }

  const githubToken = env.GITHUB_TOKEN;
  if (!githubToken) {
    return json({ error: 'GITHUB_TOKEN non configuré. Ajoutez votre token GitHub dans les variables d\'environnement.' }, { status: 500 });
  }

  const db = await getSurrealDB();

  try {
    // Récupérer les infos de la classe
    const cleanId = grade_id.includes(':') ? grade_id.split(':')[1] : grade_id;
    const [gradeResult] = await db.query<[any[]]>(`
      SELECT *, cycle.name as cycle_name, education_system.name as system_name
      FROM type::thing("grade", $id)
      FETCH cycle, education_system
    `, { id: cleanId });

    const grade = gradeResult?.[0];
    if (!grade) {
      return json({ error: 'Classe introuvable' }, { status: 404 });
    }

    // Récupérer les matières
    let subjects: any[] = [];
    if (subject_codes && subject_codes.length > 0 && subject_codes[0] !== 'all') {
      const [subjectResult] = await db.query<[any[]]>(`
        SELECT * FROM subject WHERE code IN $codes AND is_active = true
      `, { codes: subject_codes });
      subjects = subjectResult || [];
    } else {
      // Toutes les matières actives
      const [subjectResult] = await db.query<[any[]]>(`
        SELECT * FROM subject WHERE is_active = true ORDER BY name ASC
      `);
      subjects = subjectResult || [];
    }

    if (subjects.length === 0) {
      return json({ error: 'Aucune matière trouvée' }, { status: 400 });
    }

    // Construire le prompt
    const prompt = buildPrompt(grade, subjects, custom_prompt, existing_programs);

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
            content: `Tu es un expert en programmes scolaires français. Tu connais parfaitement les programmes officiels de l'Éducation Nationale.
Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.
Le JSON doit suivre exactement le format demandé.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur GitHub Models:', errorText);
      return json({ error: `Erreur API IA: ${response.status} ${response.statusText}` }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return json({ error: 'Réponse IA vide' }, { status: 500 });
    }

    // Parser le JSON de la réponse
    let programs;
    try {
      let cleanContent = content.trim();
      // Nettoyer les balises markdown
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      const parsed = JSON.parse(cleanContent.trim());
      programs = parsed.programs || [parsed];
    } catch (e) {
      console.error('Erreur parsing JSON:', content);
      return json({ error: 'Erreur parsing réponse IA. Réessayez.' }, { status: 500 });
    }

    // Formater la réponse
    const formattedPrograms = programs.map((p: any) => {
      const existingProgram = existing_programs?.find((ep: any) => ep.subject_code === (p.subject_code || p.code));
      
      return {
        subject_code: p.subject_code || p.code,
        subject_name: p.subject_name || p.subject || subjects.find((s: any) => s.code === p.subject_code)?.name,
        action: p.action || (existingProgram ? 'update' : 'create'),
        existing_program: existingProgram ? {
          id: existingProgram.id,
          name: existingProgram.name,
          chapters: existingProgram.chapters
        } : null,
        chapters: (p.chapters || []).map((c: any, i: number) => {
          // Chercher si ce chapitre existe dans le programme existant
          const existingChapter = existingProgram?.chapters?.find((ec: any) => 
            ec.title?.toLowerCase() === c.title?.toLowerCase() || 
            ec.title?.toLowerCase() === c.original_title?.toLowerCase()
          );
          
          return {
            id: `gen-${Date.now()}-${i}`,
            order: c.order || i + 1,
            title: c.title || c.name,
            description: c.description || null,
            action: c.action || (existingChapter ? 'update' : 'create'),
            original_title: c.original_title || existingChapter?.title || null,
            existing_id: existingChapter?.id || null,
            enabled: c.action !== 'delete'
          };
        })
      };
    });

    return json({
      success: true,
      grade: {
        id: grade.id?.toString(),
        name: grade.name,
        cycle_name: grade.cycle_name
      },
      programs: formattedPrograms,
      model_used: selectedModel,
      usage: result.usage
    });

  } catch (error) {
    console.error('Erreur génération programme:', error);
    return json({ error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Inconnue') }, { status: 500 });
  }
};

function buildPrompt(
  grade: any, 
  subjects: any[], 
  customPrompt?: string,
  existingPrograms?: any[]
): string {
  const subjectsList = subjects.map(s => `- ${s.name} (code: ${s.code})`).join('\n');
  
  let existingContext = '';
  if (existingPrograms && existingPrograms.length > 0) {
    existingContext = `

PROGRAMMES EXISTANTS pour cette classe (à prendre en compte pour proposer des modifications) :
${existingPrograms.map(p => `
### ${p.subject_name} (${p.subject_code})
Chapitres actuels:
${p.chapters?.map((c: any, i: number) => `${i + 1}. ${c.title}${c.description ? ' - ' + c.description : ''}`).join('\n') || 'Aucun chapitre'}
`).join('\n')}

Pour les programmes existants, tu peux proposer :
- action: "keep" = garder tel quel
- action: "update" = modifier (avec les nouveaux chapitres)
- action: "delete" = supprimer ce programme

Pour les chapitres existants dans un programme modifié :
- action: "keep" = garder ce chapitre
- action: "update" = modifier le titre/description
- action: "delete" = supprimer ce chapitre
- action: "create" = nouveau chapitre à ajouter`;
  }

  const basePrompt = customPrompt || `Génère le programme scolaire officiel français avec tous les chapitres nécessaires.`;

  return `${basePrompt}

CONTEXTE :
- Classe : ${grade.name}
- Cycle : ${grade.cycle_name || 'Non spécifié'}
- Système éducatif : ${grade.system_name || 'Français'}

MATIÈRES À TRAITER :
${subjectsList}
${existingContext}

INSTRUCTIONS :
1. Pour chaque matière, génère les chapitres du programme officiel français
2. Les chapitres doivent être dans l'ordre pédagogique logique
3. Inclus une description courte pour chaque chapitre
4. Sois précis et fidèle aux programmes officiels de l'Éducation Nationale

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "programs": [
    {
      "subject_code": "CODE",
      "subject_name": "Nom de la matière",
      "action": "create",
      "chapters": [
        {
          "order": 1,
          "title": "Titre du chapitre",
          "description": "Description courte",
          "action": "create"
        }
      ]
    }
  ]
}`;
}
