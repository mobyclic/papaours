import type { ServerLoadEvent } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { connectDB } from "$lib/db";
import { RecordId } from "surrealdb";

// Helper to serialize RecordId and Date objects
function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

export const load = async ({ params }: ServerLoadEvent) => {
  const db = await connectDB();
  
  // Parse the question ID - it might be "question:xxx" or just "xxx"
  const questionId = params.id?.includes(':') ? params.id : `question:${params.id}`;
  
  // Fetch the question from database
  const questionResult = await db.query<any[]>(
    `SELECT * FROM type::thing("question", $id)`,
    { id: questionId.split(':')[1] }
  );
  
  const question = questionResult[0]?.[0];
  
  if (!question) {
    throw error(404, 'Question non trouvée');
  }
  
  // Fetch all reference data in parallel
  const [matieresResult, themesResult, classesResult, niveauxResult] = await Promise.all([
    db.query<any[]>('SELECT * FROM matiere WHERE is_active = true ORDER BY pos ASC'),
    db.query<any[]>('SELECT * FROM theme WHERE is_active = true'),
    db.query<any[]>('SELECT *, category_id.* as category FROM classe WHERE is_active = true ORDER BY pos ASC'),
    db.query<any[]>('SELECT * FROM niveau ORDER BY pos ASC'),
  ]);
  
  // Sort themes in JavaScript
  const matieres = matieresResult[0] || [];
  const themes = (themesResult[0] || []).sort((a: any, b: any) => {
    // Sort by matiere_id first, then by pos
    const matiereCompare = String(a.matiere_id || '').localeCompare(String(b.matiere_id || ''));
    if (matiereCompare !== 0) return matiereCompare;
    return (a.pos || 0) - (b.pos || 0);
  });
  const classes = classesResult[0] || [];
  const niveaux = niveauxResult[0] || [];
  
  // Group themes by matiere (now supports multiple matiere_ids)
  const themesByMatiere: Record<string, any[]> = {};
  for (const theme of themes) {
    const serializedTheme = serialize(theme);
    
    // Add theme to all its matiere_ids
    const matiereIds = theme.matiere_ids && theme.matiere_ids.length > 0 
      ? theme.matiere_ids 
      : (theme.matiere_id ? [theme.matiere_id] : []);
    
    for (const matiereId of matiereIds) {
      const key = matiereId?.toString() || 'none';
      if (!themesByMatiere[key]) {
        themesByMatiere[key] = [];
      }
      // Avoid duplicates
      if (!themesByMatiere[key].some((t: any) => t.id === serializedTheme.id)) {
        themesByMatiere[key].push(serializedTheme);
      }
    }
    
    // Also add to 'none' if no matiere assigned (for universal themes)
    if (matiereIds.length === 0) {
      if (!themesByMatiere['none']) {
        themesByMatiere['none'] = [];
      }
      themesByMatiere['none'].push(serializedTheme);
    }
  }
  
  // Group classes by category (category is fetched via JOIN)
  const classesByCategory: Record<string, any[]> = {};
  const categoryNames: Record<string, string> = {}; // Map category_id to name_fr
  
  for (const classe of classes) {
    // La catégorie est récupérée via le JOIN category_id.* as category
    const catId = classe.category_id?.toString() || 'other';
    const catName = classe.category?.name_fr || 'Autre';
    
    if (!classesByCategory[catName]) {
      classesByCategory[catName] = [];
    }
    classesByCategory[catName].push(serialize(classe));
    categoryNames[catId] = catName;
  }
  
  // Ordre des catégories
  const categoryOrder = ['Maternelle', 'Primaire', 'Collège', 'Lycée', 'Supérieur', 'Autre'];
  
  return {
    question: serialize(question),
    matieres: serialize(matieres),
    themes: serialize(themes),
    themesByMatiere,
    classes: serialize(classes),
    classesByCategory,
    categoryOrder,
    niveaux: serialize(niveaux)
  };
};
