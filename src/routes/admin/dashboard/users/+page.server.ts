import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    // Récupérer tous les utilisateurs
    const usersResult = await db.query(`
      SELECT * FROM user ORDER BY createdAt DESC
    `);
    
    const rawUsers = (usersResult[0] as any[]) || [];
    
    // Formater les utilisateurs pour le template
    const users = rawUsers.map(user => ({
      id: user.id?.toString() || user.id,
      first_name: user.firstName || user.first_name || user.username || 'Sans nom',
      last_name: user.lastName || user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      level: user.level || 'Débutant',
      points: user.points || user.totalPoints || 0,
      is_active: user.isActive ?? user.is_active ?? true,
      is_admin: user.isAdmin ?? user.is_admin ?? false,
      created_at: user.createdAt || user.created_at
    }));

    return {
      users
    };
  } catch (error) {
    console.error('Error loading users:', error);
    return {
      users: []
    };
  }
};
