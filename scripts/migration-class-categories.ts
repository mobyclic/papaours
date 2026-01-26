/**
 * Migration: Création de la table class_category et mise à jour de la table classe
 * - Crée la table class_category avec les catégories de classes (Maternelle, Primaire, etc.)
 * - Renomme la colonne 'order' en 'pos' dans la table classe
 * - Relie les classes à leur catégorie via category_id
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL!;
const SURREAL_USER = process.env.SURREAL_USER!;
const SURREAL_PASS = process.env.SURREAL_PASS!;

async function migrate() {
  const db = new Surreal();
  
  try {
    console.log('🔄 Connexion à SurrealDB...');
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: 'papaours', database: 'dbpapaours' });
    console.log('✅ Connecté!\n');

    // 1. Créer la table class_category
    console.log('📦 Création de la table class_category...');
    await db.query(`
      DEFINE TABLE class_category SCHEMAFULL;
      DEFINE FIELD slug ON class_category TYPE string;
      DEFINE FIELD name_fr ON class_category TYPE string;
      DEFINE FIELD name_en ON class_category TYPE string;
      DEFINE FIELD pos ON class_category TYPE int DEFAULT 0;
      DEFINE FIELD is_active ON class_category TYPE bool DEFAULT true;
      DEFINE INDEX idx_class_category_slug ON class_category FIELDS slug UNIQUE;
    `);
    console.log('✅ Table class_category créée\n');

    // 2. Insérer les catégories
    console.log('📥 Insertion des catégories...');
    const categories = [
      { slug: 'maternelle', name_fr: 'Maternelle', name_en: 'Kindergarten', pos: 0 },
      { slug: 'primaire', name_fr: 'Primaire', name_en: 'Primary School', pos: 1 },
      { slug: 'college', name_fr: 'Collège', name_en: 'Middle School', pos: 2 },
      { slug: 'lycee', name_fr: 'Lycée', name_en: 'High School', pos: 3 },
      { slug: 'superieur', name_fr: 'Supérieur', name_en: 'Higher Education', pos: 4 },
    ];

    for (const cat of categories) {
      await db.query(`
        CREATE class_category SET
          slug = $slug,
          name_fr = $name_fr,
          name_en = $name_en,
          pos = $pos,
          is_active = true
      `, cat);
      console.log(`  ✓ ${cat.name_fr} (${cat.name_en})`);
    }
    console.log('✅ Catégories créées\n');

    // 3. Récupérer les mapping catégories
    const categoryResult = await db.query<any[]>('SELECT * FROM class_category');
    const categoryMap: Record<string, string> = {};
    for (const cat of (categoryResult[0] || [])) {
      // Map both old category names (French) and slugs to category IDs
      categoryMap[cat.name_fr] = cat.id.toString();
      categoryMap[cat.slug] = cat.id.toString();
    }
    console.log('📋 Mapping des catégories:', categoryMap);

    // 4. Mettre à jour la table classe - ajouter category_id et pos, migrer les données
    console.log('\n📝 Mise à jour de la structure de la table classe...');
    
    // D'abord récupérer toutes les classes actuelles
    const classesResult = await db.query<any[]>('SELECT * FROM classe');
    const classes = classesResult[0] || [];
    console.log(`  📊 ${classes.length} classes trouvées`);

    // Ajouter les nouveaux champs
    await db.query(`
      DEFINE FIELD category_id ON classe TYPE option<record<class_category>>;
      DEFINE FIELD pos ON classe TYPE int DEFAULT 0;
    `);
    console.log('  ✓ Nouveaux champs ajoutés (category_id, pos)');

    // Migrer les données pour chaque classe
    for (const classe of classes) {
      const oldCategory = classe.category || 'Primaire';
      const categoryId = categoryMap[oldCategory];
      const pos = classe.order ?? 0;
      
      if (categoryId) {
        // Extraire juste l'ID sans le préfixe de table
        const catIdPart = categoryId.split(':')[1];
        await db.query(`
          UPDATE $id SET 
            category_id = type::thing("class_category", $catId),
            pos = $pos
        `, { 
          id: classe.id, 
          catId: catIdPart,
          pos: pos 
        });
        console.log(`  ✓ ${classe.name}: category_id=${categoryId}, pos=${pos}`);
      } else {
        console.log(`  ⚠️ ${classe.name}: catégorie "${oldCategory}" non trouvée, utilisation de Primaire`);
        const primaryCatId = categoryMap['primaire'] || categoryMap['Primaire'];
        if (primaryCatId) {
          const catIdPart = primaryCatId.split(':')[1];
          await db.query(`
            UPDATE $id SET 
              category_id = type::thing("class_category", $catId),
              pos = $pos
          `, { 
            id: classe.id, 
            catId: catIdPart,
            pos: pos 
          });
        }
      }
    }

    // 5. Supprimer l'ancienne colonne 'order' et 'category' (string)
    console.log('\n🗑️ Suppression des anciennes colonnes...');
    await db.query(`
      REMOVE FIELD order ON classe;
      REMOVE FIELD category ON classe;
    `);
    console.log('  ✓ Colonnes "order" et "category" supprimées');

    // 6. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const verifyClasses = await db.query<any[]>(`
      SELECT *, category_id.* as category_data FROM classe ORDER BY pos
    `);
    console.log('\n📋 Classes après migration:');
    for (const c of (verifyClasses[0] || [])) {
      const catName = c.category_data?.name_fr || 'N/A';
      console.log(`  • ${c.name} (pos: ${c.pos}, catégorie: ${catName})`);
    }

    const verifyCategories = await db.query<any[]>('SELECT * FROM class_category ORDER BY pos');
    console.log('\n📋 Catégories créées:');
    for (const cat of (verifyCategories[0] || [])) {
      console.log(`  • ${cat.name_fr} / ${cat.name_en} (slug: ${cat.slug}, pos: ${cat.pos})`);
    }

    console.log('\n✅ Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
