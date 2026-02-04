import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

// GET - Liste des compétences
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type'); // 'general' | 'subject' | null (all)
    const subjectId = url.searchParams.get('subject_id');
    
    const db = await getSurrealDB();
    
    let query = `
      SELECT 
        id,
        code,
        name,
        description,
        type,
        subject.id AS subject_id,
        subject.code AS subject_code,
        subject.name AS subject_name,
        subject.icon AS subject_icon,
        color,
        \`order\`,
        is_active,
        created_at
      FROM competence
    `;
    
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    
    if (type) {
      conditions.push('type = $type');
      params.type = type;
    }
    
    if (subjectId) {
      const cleanSubjectId = subjectId.includes(':') ? subjectId.split(':')[1] : subjectId;
      conditions.push('subject = type::thing("subject", $subjectId)');
      params.subjectId = cleanSubjectId;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY type ASC, subject_name ASC, `order` ASC';
    
    const [competences] = await db.query<[any[]]>(query, params);

    // Sérialiser
    const serialized = (competences || []).map(c => ({
      ...c,
      id: c.id?.toString() || c.id,
      subject_id: c.subject_id?.toString() || c.subject_id,
      created_at: c.created_at?.toISOString?.() || c.created_at
    }));

    return json({ competences: serialized });
  } catch (error) {
    console.error('Erreur récupération compétences:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer une compétence
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, name, description, type, subject_id, color, order, is_active } = data;

    if (!code || !name || !type) {
      return json({ error: 'Code, nom et type requis' }, { status: 400 });
    }

    if (!['general', 'subject'].includes(type)) {
      return json({ error: 'Type invalide (general ou subject)' }, { status: 400 });
    }

    if (type === 'subject' && !subject_id) {
      return json({ error: 'Matière requise pour une compétence de type subject' }, { status: 400 });
    }

    const db = await getSurrealDB();

    // Vérifier unicité du code
    const [existing] = await db.query<[any[]]>(
      'SELECT id FROM competence WHERE code = $code',
      { code }
    );

    if (existing && existing.length > 0) {
      return json({ error: 'Ce code existe déjà' }, { status: 400 });
    }

    // Créer la compétence
    let query = `
      CREATE competence SET
        code = $code,
        name = $name,
        description = $description,
        type = $type,
        color = $color,
        \`order\` = $order,
        is_active = $is_active,
        created_at = time::now()
    `;

    const params: Record<string, any> = {
      code,
      name,
      description: description || null,
      type,
      color: color || null,
      order: order || 0,
      is_active: is_active ?? true
    };

    if (type === 'subject' && subject_id) {
      const cleanSubjectId = subject_id.includes(':') ? subject_id.split(':')[1] : subject_id;
      query = `
        CREATE competence SET
          code = $code,
          name = $name,
          description = $description,
          type = $type,
          subject = type::thing("subject", $subjectId),
          color = $color,
          \`order\` = $order,
          is_active = $is_active,
          created_at = time::now()
      `;
      params.subjectId = cleanSubjectId;
    }

    const [created] = await db.query<[any[]]>(query, params);

    return json({ success: true, competence: created?.[0] });
  } catch (error) {
    console.error('Erreur création compétence:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Modifier une compétence
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, code, name, description, type, subject_id, color, order, is_active } = data;

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Construire la requête dynamiquement
    const updates: string[] = [];
    const params: Record<string, any> = { cleanId };

    if (code !== undefined) {
      // Vérifier unicité du code
      const [existing] = await db.query<[any[]]>(
        'SELECT id FROM competence WHERE code = $code AND id != type::thing("competence", $cleanId)',
        { code, cleanId }
      );
      if (existing && existing.length > 0) {
        return json({ error: 'Ce code existe déjà' }, { status: 400 });
      }
      updates.push('code = $code');
      params.code = code;
    }
    if (name !== undefined) {
      updates.push('name = $name');
      params.name = name;
    }
    if (description !== undefined) {
      if (description === null || description === '') {
        updates.push('description = NONE');
      } else {
        updates.push('description = $description');
        params.description = description;
      }
    }
    if (type !== undefined) {
      updates.push('type = $type');
      params.type = type;
    }
    if (subject_id !== undefined) {
      if (subject_id === null) {
        updates.push('subject = NONE');
      } else {
        const cleanSubjectId = subject_id.includes(':') ? subject_id.split(':')[1] : subject_id;
        updates.push('subject = type::thing("subject", $subjectId)');
        params.subjectId = cleanSubjectId;
      }
    }
    if (color !== undefined) {
      if (color === null || color === '') {
        updates.push('color = NONE');
      } else {
        updates.push('color = $color');
        params.color = color;
      }
    }
    if (order !== undefined) {
      updates.push('`order` = $order');
      params.order = order;
    }
    if (is_active !== undefined) {
      updates.push('is_active = $is_active');
      params.is_active = is_active;
    }

    updates.push('updated_at = time::now()');

    const [updated] = await db.query<[any[]]>(
      `UPDATE type::thing("competence", $cleanId) SET ${updates.join(', ')}`,
      params
    );

    return json({ success: true, competence: updated?.[0] });
  } catch (error) {
    console.error('Erreur modification compétence:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer une compétence
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID requis' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = id.includes(':') ? id.split(':')[1] : id;

    // Vérifier si utilisée dans des questions
    const [usedInQuestions] = await db.query<[any[]]>(
      `SELECT count() as total FROM question WHERE competences CONTAINS type::thing("competence", $cleanId) GROUP ALL`,
      { cleanId }
    );

    if (usedInQuestions?.[0]?.total > 0) {
      return json({ 
        error: `Cette compétence est utilisée dans ${usedInQuestions[0].total} question(s). Dissociez-la d'abord.` 
      }, { status: 400 });
    }

    // Supprimer les progressions associées
    await db.query(
      `DELETE user_competence WHERE competence = type::thing("competence", $cleanId)`,
      { cleanId }
    );

    // Supprimer la compétence
    await db.query(`DELETE type::thing("competence", $cleanId)`, { cleanId });

    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression compétence:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
