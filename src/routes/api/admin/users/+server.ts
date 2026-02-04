import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const db = await connectDB();
    const result = await db.query<any[]>('SELECT id, email, name, is_admin, createdAt FROM user');
    const users = (result[0] as any[]) || [];
    return json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return json({ users: [] });
  }
};

// POST - Fetch users with server-side pagination, sorting, and filtering
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      page = 1,
      pageSize = 20,
      search = '',
      sortColumn = 'createdAt',
      sortDirection = 'desc',
      filters = {}
    } = body;

    const db = await connectDB();
    
    // Construire la requête avec filtres
    let whereClause = 'WHERE 1=1';
    const queryParams: Record<string, any> = {};
    
    // Filtre par rôle/type d'utilisateur
    if (filters.role) {
      if (filters.role === 'student') {
        whereClause += ' AND profile_type = "apprenant"';
      } else if (filters.role === 'tutor') {
        whereClause += ' AND profile_type = "tuteur"';
      } else if (filters.role === 'teacher') {
        whereClause += ' AND profile_type = "professeur"';
      }
    }
    
    // Filtre par cycle
    if (filters.cycle) {
      whereClause += ' AND current_grade.cycle.code = $cycleCode';
      queryParams.cycleCode = filters.cycle;
    }
    
    // Filtre par grade
    if (filters.grade) {
      whereClause += ' AND current_grade = type::thing("grade", $gradeId)';
      queryParams.gradeId = filters.grade.includes(':') ? filters.grade.split(':')[1] : filters.grade;
    }
    
    // Filtre par recherche
    if (search) {
      whereClause += ' AND (name ~ $search OR prenom ~ $search OR nom ~ $search OR pseudo ~ $search OR email ~ $search)';
      queryParams.search = search;
    }
    
    // Construire ORDER BY
    const validSortColumns = ['name', 'email', 'pseudo', 'createdAt', 'prenom', 'nom'];
    const safeColumn = validSortColumns.includes(sortColumn) ? sortColumn : 'createdAt';
    const safeDirection = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const orderBy = `ORDER BY ${safeColumn} ${safeDirection}`;
    
    // Pagination
    const offset = (page - 1) * pageSize;
    queryParams.limit = pageSize;
    queryParams.offset = offset;
    
    // Requête principale avec pagination
    const dataQuery = `
      SELECT 
        id,
        name,
        prenom,
        nom,
        pseudo,
        email,
        profile_type,
        isActive,
        isAdmin,
        createdAt,
        current_grade,
        current_grade.name as grade_name,
        current_grade.code as grade_code,
        current_grade.cycle.code as cycle_code,
        current_grade.cycle.name as cycle_name
      FROM user 
      ${whereClause}
      ${orderBy}
      LIMIT $limit START $offset
    `;
    
    // Requête pour le comptage total
    const countQuery = `
      SELECT count() FROM user ${whereClause} GROUP ALL
    `;
    
    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, queryParams),
      db.query(countQuery, queryParams)
    ]);
    
    const rawUsers = (dataResult[0] as any[]) || [];
    const totalCount = (countResult[0] as any[])?.[0]?.count || 0;
    
    // Formater les données
    const rows = rawUsers.map(user => ({
      id: user.id?.toString() || user.id,
      name: user.name || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Sans nom',
      prenom: user.prenom || '',
      nom: user.nom || '',
      pseudo: user.pseudo || '',
      email: user.email || '',
      profile_type: user.profile_type || 'apprenant',
      grade_id: user.current_grade?.toString() || '',
      grade_name: user.grade_name || '',
      grade_code: user.grade_code || '',
      cycle_code: user.cycle_code || '',
      cycle_name: user.cycle_name || '',
      is_active: user.isActive ?? true,
      is_admin: user.isAdmin ?? false,
      created_at: user.createdAt
    }));
    
    return json({
      rows,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ 
      error: 'Erreur serveur',
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    }, { status: 500 });
  }
};