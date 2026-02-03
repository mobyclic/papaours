import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ url }) => {
  try {
    const db = await connectDB();
    
    // Récupérer le filtre cycle depuis l'URL
    const cycleCode = url.searchParams.get('cycle') || '';
    
    // Récupérer tous les utilisateurs avec leur grade et cycle (via relation)
    const usersResult = await db.query(`
      SELECT *, 
        current_grade.name as grade_name, 
        current_grade.code as grade_code,
        current_grade.cycle as cycle_id,
        current_grade.cycle.code as cycle_code,
        current_grade.cycle.name as cycle_name
      FROM user ORDER BY createdAt DESC
    `);
    
    // Récupérer les grades pour le filtre
    const gradesResult = await db.query(`
      SELECT id, name, code, \`order\` FROM grade ORDER BY \`order\` ASC
    `);
    
    // Récupérer les cycles pour le filtre
    const cyclesResult = await db.query(`
      SELECT id, name, code, \`order\` FROM cycle ORDER BY \`order\` ASC
    `);
    
    const rawUsers = (usersResult[0] as any[]) || [];
    const grades = (gradesResult[0] as any[]) || [];
    const cycles = (cyclesResult[0] as any[]) || [];
    
    // Formater les utilisateurs pour le template
    const users = rawUsers.map(user => ({
      id: user.id?.toString() || user.id,
      name: user.name || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Sans nom',
      prenom: user.prenom || '',
      nom: user.nom || '',
      pseudo: user.pseudo || '',
      email: user.email || '',
      grade_id: user.current_grade?.toString() || '',
      grade_name: user.grade_name || '',
      grade_code: user.grade_code || '',
      cycle_id: user.cycle_id?.toString() || '',
      cycle_code: user.cycle_code || '',
      cycle_name: user.cycle_name || '',
      date_naissance: user.date_naissance,
      is_active: user.isActive ?? user.is_active ?? true,
      is_admin: user.isAdmin ?? user.is_admin ?? false,
      created_at: user.createdAt || user.created_at
    }));

    return {
      users,
      grades: grades.map((g: any) => ({
        id: g.id?.toString() || g.id,
        name: g.name,
        code: g.code
      })),
      cycles: cycles.map((c: any) => ({
        id: c.id?.toString() || c.id,
        name: c.name,
        code: c.code
      })),
      initialCycleCode: cycleCode
    };
  } catch (error) {
    console.error('Error loading users:', error);
    return {
      users: [],
      grades: [],
      cycles: [],
      initialCycleCode: ''
    };
  }
};
