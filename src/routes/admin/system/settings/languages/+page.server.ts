import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const db = await connectDB();
    
    const result = await db.query<any[]>('SELECT * FROM language WHERE is_active = true');
    const languages = (result[0] || []).sort((a: any, b: any) => {
      // Default language first, then alphabetically
      if (a.is_default) return -1;
      if (b.is_default) return 1;
      return (a.name || a.native_name || '').localeCompare(b.name || b.native_name || '');
    });
    
    // Serialize RecordIds
    const serializedLanguages = languages.map((lang: any) => ({
      ...lang,
      id: typeof lang.id === 'object' ? lang.id.toString() : lang.id
    }));
    
    return { languages: serializedLanguages };
  } catch (error) {
    console.error('Error loading languages:', error);
    return { languages: [] };
  }
};
