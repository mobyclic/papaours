import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET - Liste tous les domaines
export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query(`
      SELECT *, (SELECT count() FROM subject WHERE domain = $parent.id GROUP ALL)[0].count as subject_count 
      FROM domain ORDER BY \`order\` ASC, name ASC
    `);
    
    const domains = result[0] || [];
    
    return json({ domains });
  } catch (error) {
    console.error('Get domains error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST - Créer un nouveau domaine
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const data = await request.json();
    
    const { name, description, icon, color, code } = data;
    
    if (!name || name.trim() === '') {
      return json({ message: 'Le nom est requis' }, { status: 400 });
    }
    
    // Générer le code si non fourni
    const domainCode = code || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
    
    // Vérifier si le code existe déjà
    const existing = await db.query(
      'SELECT id FROM domain WHERE code = $code',
      { code: domainCode }
    );
    
    if ((existing[0] as any[])?.length > 0) {
      return json({ message: 'Un domaine avec ce code existe déjà' }, { status: 400 });
    }
    
    // Obtenir le prochain ordre
    const maxOrder = await db.query('SELECT math::max(`order`) as max_order FROM domain');
    const nextOrder = ((maxOrder[0] as any[])?.[0]?.max_order || 0) + 1;
    
    // Créer le domaine
    const created = await db.query(`
      CREATE domain SET
        code = $code,
        name = $name,
        description = $description,
        icon = $icon,
        color = $color,
        \`order\` = $order,
        is_active = true,
        created_at = time::now()
    `, {
      code: domainCode,
      name: name.trim(),
      description: description || null,
      icon: icon || null,
      color: color || '#6366F1',
      order: nextOrder
    });
    
    const domain = (created[0] as any[])?.[0];
    
    return json({ domain, message: 'Domaine créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Create domain error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

// PUT - Mettre à jour l'ordre des domaines (drag & drop)
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const db = await connectDB();
    const { domains } = await request.json();
    
    if (!Array.isArray(domains)) {
      return json({ message: 'Format invalide' }, { status: 400 });
    }
    
    // Mettre à jour l'ordre de chaque domaine
    for (let i = 0; i < domains.length; i++) {
      const domainId = domains[i];
      await db.query(
        'UPDATE type::thing("domain", $id) SET `order` = $order',
        { id: domainId.replace('domain:', ''), order: i + 1 }
      );
    }
    
    return json({ message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Update domains order error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
