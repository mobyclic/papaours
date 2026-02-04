/**
 * Migration: Moderniser le système de compétences
 * 
 * Changes:
 * - Remplace matiere_slug par subject (record<subject>)
 * - Met à jour le type pour inclure 'subject' au lieu de 'matiere'
 * - Migre les données existantes
 * - Améliore user_competence pour un meilleur suivi de progression
 * 
 * Usage: bun run scripts/migration-competences-v2.ts
 */

import Surreal from 'surrealdb';

async function migrate() {
  console.log('🚀 Migration: Modernisation du système de compétences\n');
  
  const db = new Surreal();
  const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
  
  await db.connect(`${url}/rpc`);
  await db.signin({ 
    username: process.env.SURREAL_USER || 'rootuser', 
    password: process.env.SURREAL_PASS || 'n1n@S1mone' 
  });
  await db.use({ 
    namespace: process.env.SURREAL_NAMESPACE || 'kweez', 
    database: process.env.SURREAL_DATABASE || 'dbkweez' 
  });

  try {
    // 1. Récupérer les compétences existantes avant modification
    console.log('📋 Récupération des compétences existantes...');
    const [existingCompetences] = await db.query<[any[]]>('SELECT * FROM competence');
    console.log(`  → ${existingCompetences?.length || 0} compétences existantes`);

    // 2. Récupérer le mapping matiere_slug → subject.code
    console.log('\n📚 Récupération des subjects...');
    const [subjects] = await db.query<[any[]]>('SELECT id, code, name FROM subject');
    console.log(`  → ${subjects?.length || 0} subjects trouvés`);

    // Créer un mapping matiere_slug → subject_id
    const slugToSubject: Record<string, string> = {};
    for (const subject of subjects || []) {
      // Le code du subject correspond généralement au matiere_slug
      slugToSubject[subject.code] = subject.id.toString().replace('subject:', '');
    }
    // Ajouter des mappings alternatifs pour les anciens noms
    slugToSubject['mathematiques'] = slugToSubject['math'] || slugToSubject['mathematiques'];
    slugToSubject['physique-chimie'] = slugToSubject['physics'] || slugToSubject['physique-chimie'];
    slugToSubject['francais'] = slugToSubject['french'] || slugToSubject['francais'];
    slugToSubject['histoire'] = slugToSubject['history'] || slugToSubject['histoire'];
    slugToSubject['geographie'] = slugToSubject['geography'] || slugToSubject['geographie'];
    slugToSubject['sciences'] = slugToSubject['biology'] || slugToSubject['sciences'];
    slugToSubject['anglais'] = slugToSubject['english'] || slugToSubject['anglais'];
    
    console.log('  → Mapping créé:', Object.keys(slugToSubject).length, 'entrées');

    // 3. Modifier le schéma de la table competence
    console.log('\n🔧 Modification du schéma competence...');
    await db.query(`
      -- Supprimer l'ancien index si existe
      REMOVE INDEX IF EXISTS idx_competence_code ON competence;
      REMOVE INDEX IF EXISTS competence_code ON competence;
      REMOVE INDEX IF EXISTS competence_type ON competence;
      REMOVE INDEX IF EXISTS competence_matiere ON competence;
      REMOVE INDEX IF EXISTS competence_subject ON competence;
      
      -- Ajouter le nouveau champ subject (OVERWRITE pour éviter l'erreur si existe)
      DEFINE FIELD OVERWRITE subject ON competence TYPE option<record<subject>> PERMISSIONS FULL;
      
      -- Modifier le type pour accepter 'general' ou 'subject'
      DEFINE FIELD OVERWRITE type ON competence TYPE string PERMISSIONS FULL;
      
      -- Ajouter order si pas présent
      DEFINE FIELD OVERWRITE \`order\` ON competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      
      -- Ajouter is_active
      DEFINE FIELD OVERWRITE is_active ON competence TYPE bool DEFAULT true PERMISSIONS FULL;
      
      -- Créer les nouveaux index (IF NOT EXISTS)
      DEFINE INDEX IF NOT EXISTS idx_competence_code ON competence FIELDS code UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_competence_subject ON competence FIELDS subject;
      DEFINE INDEX IF NOT EXISTS idx_competence_type ON competence FIELDS type;
    `);
    console.log('  ✅ Schéma mis à jour');

    // 4. Migrer les données existantes
    console.log('\n📝 Migration des données...');
    let migratedCount = 0;
    
    for (const comp of existingCompetences || []) {
      const cleanId = comp.id.toString().replace('competence:', '');
      
      // Déterminer le subject_id à partir de matiere_slug
      let subjectId: string | null = null;
      if (comp.matiere_slug && slugToSubject[comp.matiere_slug]) {
        subjectId = slugToSubject[comp.matiere_slug];
      }
      
      // Convertir le type 'matiere' en 'subject'
      const newType = comp.type === 'matiere' ? 'subject' : (comp.type || 'general');
      
      // Mise à jour
      if (subjectId && newType === 'subject') {
        await db.query(`
          UPDATE type::thing("competence", $id) SET
            subject = type::thing("subject", $subjectId),
            type = $type,
            \`order\` = $order,
            is_active = true
        `, {
          id: cleanId,
          subjectId,
          type: newType,
          order: comp.pos || comp.order || 0
        });
      } else {
        await db.query(`
          UPDATE type::thing("competence", $id) SET
            type = $type,
            \`order\` = $order,
            is_active = true
        `, {
          id: cleanId,
          type: newType,
          order: comp.pos || comp.order || 0
        });
      }
      migratedCount++;
    }
    console.log(`  ✅ ${migratedCount} compétences migrées`);

    // 5. Nettoyer les anciens champs (optionnel - on garde pour l'instant pour backup)
    // await db.query('REMOVE FIELD matiere_slug ON competence');
    // await db.query('REMOVE FIELD pos ON competence');

    // 6. Créer/Mettre à jour la table user_competence
    console.log('\n🔧 Configuration de user_competence...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS user_competence SCHEMAFULL PERMISSIONS NONE;
      
      -- Champs principaux
      DEFINE FIELD user ON user_competence TYPE record<user> PERMISSIONS FULL;
      DEFINE FIELD competence ON user_competence TYPE record<competence> PERMISSIONS FULL;
      
      -- Statistiques de réponses
      DEFINE FIELD correct_answers ON user_competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      DEFINE FIELD wrong_answers ON user_competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      DEFINE FIELD total_answers ON user_competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      
      -- Niveau de maîtrise (0-100)
      DEFINE FIELD mastery_level ON user_competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      
      -- Score ELO-like pour le système de progression
      DEFINE FIELD elo_score ON user_competence TYPE int DEFAULT 1000 PERMISSIONS FULL;
      
      -- Streak (série de bonnes réponses consécutives)
      DEFINE FIELD current_streak ON user_competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      DEFINE FIELD best_streak ON user_competence TYPE int DEFAULT 0 PERMISSIONS FULL;
      
      -- Timestamps
      DEFINE FIELD last_practiced ON user_competence TYPE option<datetime> PERMISSIONS FULL;
      DEFINE FIELD created_at ON user_competence TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      DEFINE FIELD updated_at ON user_competence TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      
      -- Index unique pour éviter les doublons
      DEFINE INDEX idx_user_competence_unique ON user_competence FIELDS user, competence UNIQUE;
      DEFINE INDEX idx_user_competence_user ON user_competence FIELDS user;
      DEFINE INDEX idx_user_competence_competence ON user_competence FIELDS competence;
    `);
    console.log('  ✅ Table user_competence configurée');

    // 7. Ajouter le champ competences aux questions si pas présent
    console.log('\n🔧 Configuration du champ competences sur question...');
    await db.query(`
      DEFINE FIELD OVERWRITE competences ON question TYPE option<array<record<competence>>> PERMISSIONS FULL;
    `);
    console.log('  ✅ Champ competences ajouté aux questions');

    // 8. Afficher le résumé
    const [finalCount] = await db.query<[any[]]>('SELECT count() as total FROM competence GROUP ALL');
    const [generalCount] = await db.query<[any[]]>('SELECT count() as total FROM competence WHERE type = "general" GROUP ALL');
    const [subjectCount] = await db.query<[any[]]>('SELECT count() as total FROM competence WHERE type = "subject" GROUP ALL');
    
    console.log('\n📊 Résumé:');
    console.log(`  - Total compétences: ${finalCount?.[0]?.total || 0}`);
    console.log(`  - Compétences générales: ${generalCount?.[0]?.total || 0}`);
    console.log(`  - Compétences par matière: ${subjectCount?.[0]?.total || 0}`);
    
    console.log('\n✨ Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
