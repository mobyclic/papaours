#!/usr/bin/env bun

/**
 * Migration: Système de progression par matière/thème
 * 
 * Ce script ajoute :
 * - Table `matiere` : Les matières scolaires (Français, Maths, Histoire...)
 * - Table `theme` : Les thèmes par matière (ex: Préhistoire pour Histoire)
 * - Table `user_progress` : Progression de chaque utilisateur par matière/thème
 * - Champ `classes` sur quiz : Un quiz peut cibler plusieurs classes (CM2, 6ème...)
 * - Champs utilisateur : nom, prenom, pseudo, classe, date_naissance
 * 
 * Niveaux de progression : débutant → apprenti → confirmé → expert → maître
 * 
 * Usage: bun run scripts/migrate-progress-system.ts
 */

import Surreal from 'surrealdb';

const NIVEAUX = ['débutant', 'apprenti', 'confirmé', 'expert', 'maître'];

const CLASSES = [
  'Petite section',
  'Moyenne section',
  'Grande section',
  'CP',
  'CE1',
  'CE2',
  'CM1',
  'CM2',
  '6ème',
  '5ème',
  '4ème',
  '3ème',
  '2nde',
  '1ère',
  'Terminale',
  'Licence 1',
  'Licence 2',
  'Licence 3',
  'Master 1',
  'Master 2',
  'Doctorat',
  'Autre'
];

// Matières et thèmes par défaut
const MATIERES_THEMES: Record<string, string[]> = {
  'Français': ['Grammaire', 'Conjugaison', 'Orthographe', 'Vocabulaire', 'Lecture', 'Expression écrite', 'Littérature'],
  'Mathématiques': ['Calcul', 'Géométrie', 'Mesures', 'Problèmes', 'Numération', 'Logique'],
  'Histoire': ['Préhistoire', 'Antiquité', 'Moyen Âge', 'Temps modernes', 'Époque contemporaine', 'XXe siècle'],
  'Géographie': ['La France', 'L\'Europe', 'Le Monde', 'Reliefs et paysages', 'Climat', 'Population'],
  'Sciences': ['Le vivant', 'La matière', 'L\'énergie', 'Le corps humain', 'Technologie', 'Environnement'],
  'Anglais': ['Vocabulaire', 'Grammaire', 'Compréhension orale', 'Expression orale', 'Culture'],
  'Musique': ['Instruments', 'Rythme', 'Compositeurs', 'Genres musicaux', 'Solfège', 'Histoire de la musique'],
  'Arts': ['Peinture', 'Sculpture', 'Architecture', 'Artistes célèbres', 'Mouvements artistiques'],
  'Éducation civique': ['Citoyenneté', 'Institutions', 'Droits et devoirs', 'Vivre ensemble']
};

async function main() {
  console.log('🚀 Migration: Système de progression par matière/thème\n');
  
  const db = new Surreal();
  
  try {
    // Connexion
    const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
    await db.connect(`${url}/rpc`, {
      namespace: process.env.SURREAL_NAMESPACE || 'papaours',
      database: process.env.SURREAL_DATABASE || 'dbpapaours',
    });
    await db.signin({
      username: process.env.SURREAL_USER || 'rootuser',
      password: process.env.SURREAL_PASS || 'n1n@S1mone',
    });
    console.log('✅ Connecté à SurrealDB\n');

    // ========================================
    // 1. Table MATIERE
    // ========================================
    console.log('📚 Création de la table matiere...');
    await db.query(`
      DEFINE TABLE matiere SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD name ON matiere TYPE string ASSERT $value != NONE;
      DEFINE FIELD slug ON matiere TYPE string ASSERT $value != NONE;
      DEFINE FIELD description ON matiere TYPE option<string>;
      DEFINE FIELD icon ON matiere TYPE option<string>;
      DEFINE FIELD color ON matiere TYPE option<string>;
      DEFINE FIELD order ON matiere TYPE number DEFAULT 0;
      DEFINE FIELD is_active ON matiere TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON matiere TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON matiere TYPE datetime DEFAULT time::now();
      DEFINE INDEX matiere_slug ON matiere COLUMNS slug UNIQUE;
    `);
    console.log('✅ Table matiere créée\n');

    // ========================================
    // 2. Table THEME (par matière)
    // ========================================
    console.log('🏷️  Création de la table theme...');
    await db.query(`
      DEFINE TABLE theme SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD matiere_id ON theme TYPE record<matiere>;
      DEFINE FIELD name ON theme TYPE string ASSERT $value != NONE;
      DEFINE FIELD slug ON theme TYPE string ASSERT $value != NONE;
      DEFINE FIELD description ON theme TYPE option<string>;
      DEFINE FIELD icon ON theme TYPE option<string>;
      DEFINE FIELD order ON theme TYPE number DEFAULT 0;
      DEFINE FIELD is_active ON theme TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON theme TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON theme TYPE datetime DEFAULT time::now();
      DEFINE INDEX theme_slug ON theme COLUMNS slug UNIQUE;
      DEFINE INDEX theme_matiere ON theme COLUMNS matiere_id;
    `);
    console.log('✅ Table theme créée\n');

    // ========================================
    // 3. Ajouter champs à USER
    // ========================================
    console.log('👤 Ajout des champs utilisateur...');
    await db.query(`
      DEFINE FIELD pseudo ON user TYPE option<string>;
      DEFINE FIELD nom ON user TYPE option<string>;
      DEFINE FIELD prenom ON user TYPE option<string>;
      DEFINE FIELD date_naissance ON user TYPE option<datetime>;
      DEFINE FIELD classe ON user TYPE option<string>;
      DEFINE FIELD avatar_url ON user TYPE option<string>;
      DEFINE INDEX user_pseudo ON user COLUMNS pseudo UNIQUE;
    `);
    console.log('✅ Champs utilisateur ajoutés\n');

    // ========================================
    // 4. Table USER_PROGRESS (progression par matière/thème)
    // ========================================
    console.log('📈 Création de la table user_progress...');
    await db.query(`
      DEFINE TABLE user_progress SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD user_id ON user_progress TYPE record<user>;
      DEFINE FIELD matiere_id ON user_progress TYPE record<matiere>;
      DEFINE FIELD theme_id ON user_progress TYPE record<theme>;
      DEFINE FIELD niveau ON user_progress TYPE string DEFAULT 'débutant' 
        ASSERT $value INSIDE ['débutant', 'apprenti', 'confirmé', 'expert', 'maître'];
      DEFINE FIELD points ON user_progress TYPE number DEFAULT 0;
      DEFINE FIELD quizzes_completed ON user_progress TYPE number DEFAULT 0;
      DEFINE FIELD correct_answers ON user_progress TYPE number DEFAULT 0;
      DEFINE FIELD total_answers ON user_progress TYPE number DEFAULT 0;
      DEFINE FIELD best_score ON user_progress TYPE number DEFAULT 0;
      DEFINE FIELD last_quiz_at ON user_progress TYPE option<datetime>;
      DEFINE FIELD created_at ON user_progress TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON user_progress TYPE datetime DEFAULT time::now();
      
      -- Index unique pour éviter les doublons
      DEFINE INDEX user_progress_unique ON user_progress COLUMNS user_id, matiere_id, theme_id UNIQUE;
      DEFINE INDEX user_progress_user ON user_progress COLUMNS user_id;
      DEFINE INDEX user_progress_matiere ON user_progress COLUMNS matiere_id;
      DEFINE INDEX user_progress_theme ON user_progress COLUMNS theme_id;
    `);
    console.log('✅ Table user_progress créée\n');

    // ========================================
    // 5. Ajouter champs à QUIZ
    // ========================================
    console.log('📝 Ajout des champs quiz...');
    await db.query(`
      DEFINE FIELD classes ON quiz TYPE option<array<string>>;
      DEFINE FIELD matiere_id ON quiz TYPE option<record<matiere>>;
      DEFINE FIELD theme_id ON quiz TYPE option<record<theme>>;
      DEFINE FIELD niveau_requis ON quiz TYPE string DEFAULT 'débutant' 
        ASSERT $value INSIDE ['débutant', 'apprenti', 'confirmé', 'expert', 'maître'];
    `);
    console.log('✅ Champs quiz ajoutés\n');

    // ========================================
    // 6. Table NIVEAU (référentiel des niveaux)
    // ========================================
    console.log('🎯 Création de la table niveau...');
    await db.query(`
      DEFINE TABLE niveau SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD name ON niveau TYPE string ASSERT $value != NONE;
      DEFINE FIELD slug ON niveau TYPE string ASSERT $value != NONE;
      DEFINE FIELD order ON niveau TYPE number DEFAULT 0;
      DEFINE FIELD points_required ON niveau TYPE number DEFAULT 0;
      DEFINE FIELD icon ON niveau TYPE option<string>;
      DEFINE FIELD color ON niveau TYPE option<string>;
      DEFINE INDEX niveau_slug ON niveau COLUMNS slug UNIQUE;
    `);
    console.log('✅ Table niveau créée\n');

    // ========================================
    // 7. Insérer les niveaux de référence
    // ========================================
    console.log('🎯 Insertion des niveaux...');
    const niveauxData = [
      { name: 'Débutant', slug: 'débutant', order: 1, points_required: 0, icon: '🌱', color: '#22c55e' },
      { name: 'Apprenti', slug: 'apprenti', order: 2, points_required: 100, icon: '📖', color: '#3b82f6' },
      { name: 'Confirmé', slug: 'confirmé', order: 3, points_required: 300, icon: '⭐', color: '#a855f7' },
      { name: 'Expert', slug: 'expert', order: 4, points_required: 600, icon: '🏆', color: '#f59e0b' },
      { name: 'Maître', slug: 'maître', order: 5, points_required: 1000, icon: '👑', color: '#ef4444' }
    ];
    
    for (const niveau of niveauxData) {
      await db.query(`
        CREATE niveau CONTENT {
          name: $name,
          slug: $slug,
          order: $order,
          points_required: $points_required,
          icon: $icon,
          color: $color
        }
      `, niveau);
    }
    console.log('✅ Niveaux insérés\n');

    // ========================================
    // 8. Insérer les matières et thèmes par défaut
    // ========================================
    console.log('📚 Insertion des matières et thèmes...');
    
    let matiereOrder = 0;
    for (const [matiereName, themes] of Object.entries(MATIERES_THEMES)) {
      const matiereSlug = matiereName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Créer la matière
      const matiereResult = await db.query(`
        CREATE matiere CONTENT {
          name: $name,
          slug: $slug,
          order: $order,
          is_active: true
        }
      `, { name: matiereName, slug: matiereSlug, order: matiereOrder++ });
      
      const matiere = (matiereResult[0] as any[])?.[0];
      if (!matiere?.id) {
        console.log(`⚠️  Matière ${matiereName} déjà existante ou erreur`);
        continue;
      }
      
      console.log(`  ✓ ${matiereName}`);
      
      // Créer les thèmes pour cette matière
      let themeOrder = 0;
      for (const themeName of themes) {
        const themeSlug = `${matiereSlug}-${themeName.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}`;
        
        await db.query(`
          CREATE theme CONTENT {
            matiere_id: $matiere_id,
            name: $name,
            slug: $slug,
            order: $order,
            is_active: true
          }
        `, { 
          matiere_id: matiere.id, 
          name: themeName, 
          slug: themeSlug, 
          order: themeOrder++ 
        });
        
        console.log(`    - ${themeName}`);
      }
    }
    console.log('\n✅ Matières et thèmes insérés\n');

    // ========================================
    // 9. Table CLASSE (référentiel des classes)
    // ========================================
    console.log('🎒 Création de la table classe...');
    await db.query(`
      DEFINE TABLE classe SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD name ON classe TYPE string ASSERT $value != NONE;
      DEFINE FIELD slug ON classe TYPE string ASSERT $value != NONE;
      DEFINE FIELD category ON classe TYPE string;
      DEFINE FIELD order ON classe TYPE number DEFAULT 0;
      DEFINE FIELD is_active ON classe TYPE bool DEFAULT true;
      DEFINE INDEX classe_slug ON classe COLUMNS slug UNIQUE;
    `);
    
    // Insérer les classes
    const classeCategories: Record<string, string[]> = {
      'Maternelle': ['Petite section', 'Moyenne section', 'Grande section'],
      'Primaire': ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
      'Collège': ['6ème', '5ème', '4ème', '3ème'],
      'Lycée': ['2nde', '1ère', 'Terminale'],
      'Supérieur': ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat', 'Autre']
    };
    
    let classeOrder = 0;
    for (const [category, classes] of Object.entries(classeCategories)) {
      for (const className of classes) {
        const classeSlug = className.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        await db.query(`
          CREATE classe CONTENT {
            name: $name,
            slug: $slug,
            category: $category,
            order: $order,
            is_active: true
          }
        `, { name: className, slug: classeSlug, category, order: classeOrder++ });
      }
    }
    console.log('✅ Table classe créée et remplie\n');

    // ========================================
    // Résumé
    // ========================================
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Tables créées/modifiées :');
    console.log('  • matiere     - Matières scolaires');
    console.log('  • theme       - Thèmes par matière');
    console.log('  • niveau      - Niveaux de progression (débutant → maître)');
    console.log('  • classe      - Classes scolaires (maternelle → supérieur)');
    console.log('  • user        - Ajout: pseudo, nom, prenom, classe, date_naissance');
    console.log('  • quiz        - Ajout: classes[], matiere_id, theme_id, niveau_requis');
    console.log('  • user_progress - Progression par user/matière/thème');
    console.log('\nNiveaux de progression :');
    NIVEAUX.forEach((n, i) => console.log(`  ${i+1}. ${n}`));
    console.log(`\nMatières : ${Object.keys(MATIERES_THEMES).length}`);
    console.log(`Thèmes : ${Object.values(MATIERES_THEMES).flat().length}`);
    console.log(`Classes : ${CLASSES.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

main();
