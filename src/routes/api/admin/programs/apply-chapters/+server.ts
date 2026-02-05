import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { program_id, chapters, replace = true } = await request.json();

  if (!program_id || !chapters || !Array.isArray(chapters)) {
    return json({ error: 'Programme et chapitres requis' }, { status: 400 });
  }

  const db = await getSurrealDB();

  try {
    const cleanProgramId = program_id.includes(':') ? program_id.split(':')[1] : program_id;

    // Vérifier que le programme existe
    const [programCheck] = await db.query<[any[]]>(`
      SELECT id FROM type::thing("official_program", $id)
    `, { id: cleanProgramId });

    if (!programCheck || programCheck.length === 0) {
      return json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    // Supprimer les chapitres existants si replace = true
    if (replace) {
      await db.query(`
        DELETE chapter WHERE official_program = type::thing("official_program", $programId)
      `, { programId: cleanProgramId });
    }

    // Créer les nouveaux chapitres
    const createdChapters = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const title = chapter.title || chapter.name;
      
      if (!title) continue;

      // Générer le slug
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Handle optional description field
      const descriptionValue = chapter.description?.trim();
      const descriptionSet = descriptionValue ? 'description = $description,' : '';

      const [created] = await db.query<[any[]]>(`
        CREATE chapter SET
          title = $title,
          name = $title,
          slug = $slug,
          ${descriptionSet}
          official_program = type::thing("official_program", $programId),
          \`order\` = $order,
          is_active = true,
          created_at = time::now()
      `, {
        title,
        slug: `${slug}-${i + 1}`,
        description: descriptionValue || undefined,
        programId: cleanProgramId,
        order: chapter.order || i + 1
      });

      if (created?.[0]) {
        createdChapters.push(created[0]);
      }
    }

    return json({ 
      success: true, 
      created_count: createdChapters.length,
      chapters: createdChapters.map(c => ({
        id: c.id?.toString() || c.id,
        title: c.title,
        order: c.order
      }))
    });
  } catch (error) {
    console.error('Erreur application chapitres:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
