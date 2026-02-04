import { json } from '@sveltejs/kit';
import { getSurrealDB } from '$lib/server/db';
import type { RequestHandler } from './$types';

// GET - Obtenir un grade par ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await getSurrealDB();
    
    const result = await db.query(
      'SELECT * FROM grade WHERE id = $id',
      { id: `grade:${params.id}` }
    );
    
    const grade = (result[0] as any[])?.[0];
    
    if (!grade) {
      return json({ message: 'Niveau non trouvé' }, { status: 404 });
    }
    
    return json({ grade });
  } catch (error) {
    console.error('Get grade error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour un grade
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const db = await getSurrealDB();
    const data = await request.json();
    
    const { name, code, cycle_id, order, is_active } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Générer le code si non fourni
    const finalCode = code || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le code existe déjà pour un autre grade
    const existing = await db.query(
      'SELECT id FROM grade WHERE code = $code AND id != $id',
      { code: finalCode, id: `grade:${params.id}` }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un niveau avec ce code existe déjà' }, { status: 400 });
    }
    
    // Mettre à jour
    const updated = await db.query(`
      UPDATE grade:${params.id} SET
        name = $name,
        code = $code,
        cycle = type::thing("cycle", $cycle_id),
        \`order\` = $order,
        is_active = $is_active
      RETURN AFTER
    `, {
      name: name.trim(),
      code: finalCode,
      cycle_id: cycle_id,
      order: order ?? 0,
      is_active: is_active !== false
    });
    
    const grade = (updated[0] as any[])?.[0];
    
    if (!grade) {
      return json({ message: 'Niveau non trouvé' }, { status: 404 });
    }
    
    return json({ grade, message: 'Niveau mis à jour avec succès' });
  } catch (error) {
    console.error('Update grade error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// DELETE - Supprimer un grade
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await getSurrealDB();
    
    // Vérifier si des questions utilisent ce grade (via grade_difficulties)
    const questionsCount = await db.query(`
      SELECT count() as count FROM question 
      WHERE grade_difficulties != NONE 
        AND $gradeId INSIDE grade_difficulties.grade_id 
      GROUP ALL
    `, { gradeId: `grade:${params.id}` });
    
    const count = (questionsCount[0] as any[])?.[0]?.count || 0;
    
    if (count > 0) {
      return json({ 
        message: `Ce niveau est utilisé par ${count} question(s). Veuillez d'abord retirer ces questions.` 
      }, { status: 400 });
    }
    
    // Supprimer
    await db.query('DELETE grade WHERE id = $id', { id: `grade:${params.id}` });
    
    return json({ message: 'Niveau supprimé avec succès' });
  } catch (error) {
    console.error('Delete grade error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
