import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { 
    program_id,
    chapters_count = 6, 
    include_descriptions = true,
    model = 'gpt-4o-mini' 
  } = await request.json();

  if (!program_id) {
    return json({ error: 'ID du programme requis' }, { status: 400 });
  }

  const githubToken = env.GITHUB_TOKEN;
  if (!githubToken) {
    return json({ error: 'GITHUB_TOKEN non configuré' }, { status: 500 });
  }

  const db = await getSurrealDB();

  try {
    // Récupérer les infos du programme
    const cleanId = program_id.includes(':') ? program_id.split(':')[1] : program_id;
    const [programResult] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        grade.name AS grade_name,
        grade.slug AS grade_slug,
        cycle.name AS cycle_name,
        subject.name AS subject_name,
        subject.code AS subject_code
      FROM type::thing("official_program", $id)
    `, { id: cleanId });

    const program = programResult?.[0];
    if (!program) {
      return json({ error: 'Programme introuvable' }, { status: 404 });
    }

    // Construire le prompt
    const prompt = buildChaptersPrompt(program, chapters_count, include_descriptions);

    // Appeler GitHub Models API
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
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
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur GitHub Models:', errorText);
      return json({ error: 'Erreur API IA: ' + response.statusText }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return json({ error: 'Réponse IA vide' }, { status: 500 });
    }

    // Parser le JSON de la réponse
    let chapters;
    try {
      // Nettoyer la réponse (enlever les balises markdown si présentes)
      let cleanContent = content.trim();
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
      chapters = parsed.chapters || parsed;
    } catch (e) {
      console.error('Erreur parsing JSON:', content);
      return json({ error: 'Erreur parsing réponse IA' }, { status: 500 });
    }

    return json({
      success: true,
      program_id: program_id,
      program_name: program.name,
      subject_name: program.subject_name,
      chapters: chapters.map((c: any, i: number) => ({
        order: i + 1,
        title: c.title || c.name,
        description: c.description || null
      }))
    });
  } catch (error) {
    console.error('Erreur génération chapitres:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

function buildChaptersPrompt(program: any, chaptersCount: number, includeDescriptions: boolean): string {
  return `Génère ${chaptersCount} chapitres pour le programme scolaire suivant:
- Classe: ${program.grade_name} (${program.cycle_name})
- Matière: ${program.subject_name}
- Programme: ${program.name}

Les chapitres doivent:
- Correspondre au programme officiel français
- Être dans un ordre pédagogique logique
- Couvrir les compétences essentielles de cette matière pour ce niveau

Réponds UNIQUEMENT avec un objet JSON valide au format:
{
  "chapters": [
    {
      "title": "Titre du chapitre",
      ${includeDescriptions ? '"description": "Description courte du contenu"' : '"description": null'}
    }
  ]
}`;
}
