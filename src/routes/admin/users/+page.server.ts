import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ url }) => {
  try {
    const db = await connectDB();
    
    // Récupérer le filtre catégorie depuis l'URL
    const categorySlug = url.searchParams.get('category') || '';
    
    // Récupérer tous les utilisateurs avec leur classe et catégorie (via relation)
    const usersResult = await db.query(`
      SELECT *, 
        classe_id.name as classe_name, 
        classe_id.slug as classe_slug,
        classe_id.category_id as category_id,
        classe_id.category_id.slug as category_slug,
        classe_id.category_id.name_fr as category_name
      FROM user ORDER BY createdAt DESC
    `);
    
    // Récupérer les classes pour le filtre
    const classesResult = await db.query(`
      SELECT id, name, slug, pos FROM classe WHERE is_active = true ORDER BY pos ASC
    `);
    
    // Récupérer les catégories pour le filtre
    const categoriesResult = await db.query(`
      SELECT id, name_fr as name, slug, pos FROM class_category WHERE is_active = true ORDER BY pos ASC
    `);
    
    const rawUsers = (usersResult[0] as any[]) || [];
    const classes = (classesResult[0] as any[]) || [];
    const categories = (categoriesResult[0] as any[]) || [];
    
    // Formater les utilisateurs pour le template
    const users = rawUsers.map(user => ({
      id: user.id?.toString() || user.id,
      name: user.name || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Sans nom',
      prenom: user.prenom || '',
      nom: user.nom || '',
      pseudo: user.pseudo || '',
      email: user.email || '',
      classe_id: user.classe_id?.toString() || '',
      classe_name: user.classe_name || user.classe || '',
      classe_slug: user.classe_slug || '',
      category_id: user.category_id?.toString() || '',
      category_slug: user.category_slug || '',
      category_name: user.category_name || '',
      date_naissance: user.date_naissance,
      is_active: user.isActive ?? user.is_active ?? true,
      is_admin: user.isAdmin ?? user.is_admin ?? false,
      created_at: user.createdAt || user.created_at
    }));

    return {
      users,
      classes: classes.map((c: any) => ({
        id: c.id?.toString() || c.id,
        name: c.name,
        slug: c.slug
      })),
      categories: categories.map((c: any) => ({
        id: c.id?.toString() || c.id,
        name: c.name,
        slug: c.slug
      })),
      initialCategorySlug: categorySlug
    };
  } catch (error) {
    console.error('Error loading users:', error);
    return {
      users: [],
      classes: [],
      categories: [],
      initialCategorySlug: ''
    };
  }
};
