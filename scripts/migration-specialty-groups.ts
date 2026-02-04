/**
 * Migration: Ajout des pôles de spécialités et données Voie Professionnelle
 * 
 * Ce script:
 * 1. Crée la table specialty_group (pôles)
 * 2. Ajoute le champ group à specialty
 * 3. Ajoute les grades de la Voie Professionnelle
 * 4. Ajoute les pôles et spécialités professionnelles
 */

import Surreal from 'surrealdb';

async function migrate() {
  const db = new Surreal();
  
  try {
    const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
    await db.connect(`${url}/rpc`);
    await db.signin({
      username: process.env.SURREAL_USER || 'rootuser',
      password: process.env.SURREAL_PASS || 'n1n@S1mone',
    });
    await db.use({ 
      namespace: process.env.SURREAL_NAMESPACE || 'kweez', 
      database: process.env.SURREAL_DATABASE || 'dbkweez' 
    });

    console.log('🔌 Connected to SurrealDB');
    console.log('📦 Starting specialty groups migration...\n');

    // ═══════════════════════════════════════════════════════════
    // 1. CRÉER LA TABLE specialty_group (skip si existe)
    // ═══════════════════════════════════════════════════════════
    
    console.log('📚 Checking specialty_group table...');
    try {
      await db.query(`
        DEFINE TABLE specialty_group SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD code ON specialty_group TYPE string;
        DEFINE FIELD name ON specialty_group TYPE string;
        DEFINE FIELD icon ON specialty_group TYPE option<string>;
        DEFINE FIELD color ON specialty_group TYPE option<string>;
        DEFINE FIELD order ON specialty_group TYPE int DEFAULT 0;
        DEFINE FIELD context ON specialty_group TYPE string DEFAULT "all";
        DEFINE FIELD is_active ON specialty_group TYPE bool DEFAULT true;
        DEFINE FIELD created_at ON specialty_group TYPE datetime DEFAULT time::now();
        DEFINE INDEX idx_specialty_group_code ON specialty_group FIELDS code UNIQUE;
      `);
      console.log('  ✅ specialty_group table created');
    } catch {
      console.log('  ⏭️ specialty_group table already exists');
    }

    // ═══════════════════════════════════════════════════════════
    // 2. AJOUTER LE CHAMP group À specialty
    // ═══════════════════════════════════════════════════════════
    
    console.log('📚 Adding group field to specialty...');
    try {
      await db.query(`
        DEFINE FIELD group ON specialty TYPE option<record<specialty_group>>;
      `);
      console.log('  ✅ group field added to specialty');
    } catch {
      console.log('  ⏭️ group field already exists');
    }

    // ═══════════════════════════════════════════════════════════
    // 3. CRÉER LES GRADES VOIE PROFESSIONNELLE
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n📘 Creating Voie Professionnelle grades...');
    
    const proGrades = [
      { id: 'FR_2nde_Pro', code: '2nde_pro', name: 'Seconde Pro', order: 1, difficulty: 6 },
      { id: 'FR_1ere_Pro', code: '1ere_pro', name: 'Première Pro', order: 2, difficulty: 7 },
      { id: 'FR_Term_Pro', code: 'term_pro', name: 'Terminale Pro', order: 3, difficulty: 8 },
      { id: 'FR_CAP1', code: 'cap1', name: 'CAP 1ère année', order: 4, difficulty: 6 },
      { id: 'FR_CAP2', code: 'cap2', name: 'CAP 2ème année', order: 5, difficulty: 7 },
    ];

    for (const grade of proGrades) {
      try {
        await db.query(`
          CREATE grade:${grade.id} SET
            cycle = cycle:FR_lycee,
            track = track:FR_lycee_pro,
            code = $code,
            name = $name,
            order = $order,
            difficulty_level = $difficulty,
            is_active = true,
            created_at = time::now()
        `, { ...grade, difficulty: grade.difficulty });
        console.log(`  ✅ ${grade.name}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️ ${grade.name} (already exists)`);
        } else {
          console.log(`  ❌ ${grade.name}: ${e.message}`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 4. CRÉER LES PÔLES DE SPÉCIALITÉS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🎯 Creating specialty groups (pôles)...');
    
    const groups = [
      { id: 'services_tertiaire', code: 'services_tertiaire', name: 'Pôle Services et Tertiaire', icon: '🏢', color: 'blue', order: 1, context: 'pro' },
      { id: 'techniques_industriels', code: 'techniques_industriels', name: 'Pôle Techniques et Industriels', icon: '⚙️', color: 'slate', order: 2, context: 'pro' },
      { id: 'btp_bois', code: 'btp_bois', name: 'Pôle BTP et Bois', icon: '🏗️', color: 'amber', order: 3, context: 'pro' },
      { id: 'special', code: 'special', name: 'Cas Spéciaux', icon: '✨', color: 'purple', order: 4, context: 'pro' },
      { id: 'langues_options', code: 'langues_options', name: 'Langues et Options', icon: '🌍', color: 'green', order: 5, context: 'all' },
    ];

    for (const group of groups) {
      try {
        await db.query(`
          CREATE specialty_group:${group.id} SET
            code = $code,
            name = $name,
            icon = $icon,
            color = $color,
            order = $order,
            context = $context,
            is_active = true,
            created_at = time::now()
        `, group);
        console.log(`  ✅ ${group.icon} ${group.name}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️ ${group.name} (already exists)`);
        } else {
          console.log(`  ❌ ${group.name}: ${e.message}`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. CRÉER LES SPÉCIALITÉS PROFESSIONNELLES
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n📋 Creating professional specialties...');
    
    const proSpecialties = [
      // Pôle Services et Tertiaire
      { id: 'FR_pro_relation_client', code: 'relation_client', name: 'Métiers de la relation client', group: 'services_tertiaire', order: 1 },
      { id: 'FR_pro_gestion_admin', code: 'gestion_admin', name: 'Métiers de la gestion administrative, du transport et de la logistique', group: 'services_tertiaire', order: 2 },
      { id: 'FR_pro_hotellerie', code: 'hotellerie', name: 'Métiers de l\'hôtellerie-restauration', group: 'services_tertiaire', order: 3 },
      { id: 'FR_pro_alimentation', code: 'alimentation', name: 'Métiers de l\'alimentation (Boulangerie, Boucherie, Pâtisserie...)', group: 'services_tertiaire', order: 4 },
      { id: 'FR_pro_soins_services', code: 'soins_services', name: 'Métiers des soins et des services à la personne', group: 'services_tertiaire', order: 5 },
      
      // Pôle Techniques et Industriels
      { id: 'FR_pro_maintenance', code: 'maintenance', name: 'Métiers de la maintenance des matériels et des véhicules', group: 'techniques_industriels', order: 1 },
      { id: 'FR_pro_numerique', code: 'numerique', name: 'Métiers du numérique et de la transition énergétique', group: 'techniques_industriels', order: 2 },
      { id: 'FR_pro_aeronautique', code: 'aeronautique', name: 'Métiers de l\'aéronautique', group: 'techniques_industriels', order: 3 },
      { id: 'FR_pro_mecanique', code: 'mecanique', name: 'Métiers de la réalisation d\'ensembles mécaniques et industriels', group: 'techniques_industriels', order: 4 },
      { id: 'FR_pro_automatismes', code: 'automatismes', name: 'Métiers du pilotage et de la maintenance d\'installations automatisées', group: 'techniques_industriels', order: 5 },
      
      // Pôle BTP et Bois
      { id: 'FR_pro_construction', code: 'construction', name: 'Métiers de la construction durable, du bâtiment et des travaux publics', group: 'btp_bois', order: 1 },
      { id: 'FR_pro_menuiserie', code: 'menuiserie', name: 'Métiers de l\'agencement, de la menuiserie et de l\'ameublement', group: 'btp_bois', order: 2 },
      { id: 'FR_pro_bim', code: 'bim', name: 'Métiers des études et de la modélisation numérique du bâtiment', group: 'btp_bois', order: 3 },
      
      // Cas Spéciaux
      { id: 'FR_pro_mode', code: 'mode', name: 'Métiers des industries créatives et de la mode', group: 'special', order: 1 },
    ];

    for (const spe of proSpecialties) {
      try {
        await db.query(`
          CREATE specialty:${spe.id} SET
            track = track:FR_lycee_pro,
            group = specialty_group:${spe.group},
            code = $code,
            name = $name,
            order = $order,
            is_mandatory = false,
            created_at = time::now()
        `, spe);
        console.log(`  ✅ ${spe.name}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️ ${spe.name} (already exists)`);
        } else {
          console.log(`  ❌ ${spe.name}: ${e.message}`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 6. METTRE À JOUR LES SPÉCIALITÉS EXISTANTES (Lycée Général)
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🔄 Updating existing specialties with groups...');
    
    // Ajouter les LV2 au groupe langues_options
    const lv2Specialties = [
      { id: 'FR_spe_espagnol', code: 'espagnol', name: 'Espagnol LV2', order: 10 },
      { id: 'FR_spe_allemand', code: 'allemand', name: 'Allemand LV2', order: 11 },
      { id: 'FR_spe_italien', code: 'italien', name: 'Italien LV2', order: 12 },
      { id: 'FR_spe_latin', code: 'latin', name: 'Latin', order: 13 },
      { id: 'FR_spe_grec', code: 'grec', name: 'Grec ancien', order: 14 },
    ];

    for (const spe of lv2Specialties) {
      try {
        // Essayer de créer, sinon mettre à jour
        await db.query(`
          CREATE specialty:${spe.id} SET
            track = track:FR_lycee_general,
            group = specialty_group:langues_options,
            code = $code,
            name = $name,
            order = $order,
            is_mandatory = false,
            created_at = time::now()
        `, spe);
        console.log(`  ✅ Created: ${spe.name}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          await db.query(`
            UPDATE specialty:${spe.id} SET
              group = specialty_group:langues_options
          `);
          console.log(`  🔄 Updated: ${spe.name}`);
        }
      }
    }

    console.log('\n✨ Migration completed successfully!');

    // Stats
    const stats = await db.query(`
      RETURN {
        specialty_groups: (SELECT count() FROM specialty_group GROUP ALL)[0].count,
        specialties: (SELECT count() FROM specialty GROUP ALL)[0].count,
        pro_grades: (SELECT count() FROM grade WHERE track = track:FR_lycee_pro GROUP ALL)[0].count
      }
    `);
    
    console.log('\n📊 Summary:');
    console.log(JSON.stringify(stats[0], null, 2));

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
