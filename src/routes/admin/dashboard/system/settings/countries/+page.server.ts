import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query<any[]>('SELECT * FROM pays WHERE is_active = true');
    const countries = (result[0] || []).sort((a: any, b: any) => 
      (a.name_fr || '').localeCompare(b.name_fr || '')
    );
    
    // TODO: Count users per country when user table has country_id
    // For now, just return the countries
    
    // Serialize RecordIds
    const serializedCountries = countries.map((country: any) => ({
      ...country,
      id: typeof country.id === 'object' ? country.id.toString() : country.id,
      user_count: 0 // Placeholder until users have countries
    }));
    
    return { countries: serializedCountries };
  } catch (error) {
    console.error('Error loading countries:', error);
    return { countries: [] };
  }
};
