/**
 * API pour récupérer la liste des donateurs publics
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export interface Donor {
  id: string;
  donor_name: string | null;
  message: string | null;
  amount: number;
  created_at: string;
}

export const GET: RequestHandler = async ({ url }) => {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  
  try {
    const db = await getSurrealDB();
    
    // Récupérer les dons publics, triés par date (plus récents en premier)
    const result = await db.query<Donor[][]>(`
      SELECT 
        id,
        donor_name,
        message,
        amount,
        created_at
      FROM donation 
      WHERE is_public = true
      ORDER BY created_at DESC
      LIMIT $limit
    `, { limit });

    const donors = result[0] || [];

    // Statistiques globales
    const statsResult = await db.query<{ total_amount: number; total_count: number }[][]>(`
      SELECT 
        math::sum(amount) as total_amount,
        count() as total_count
      FROM donation
      GROUP ALL
    `);

    const stats = statsResult[0]?.[0] || { total_amount: 0, total_count: 0 };

    return json({
      donors,
      stats: {
        totalAmount: stats.total_amount || 0,
        totalDonors: stats.total_count || 0
      }
    });
  } catch (error) {
    console.error('Erreur récupération donateurs:', error);
    return json({ 
      donors: [],
      stats: { totalAmount: 0, totalDonors: 0 }
    });
  }
};
