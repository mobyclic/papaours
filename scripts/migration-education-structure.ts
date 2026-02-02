/**
 * Migration: Tables structure éducative et contenu pédagogique
 * 
 * Ce script crée les tables pour:
 * - Internationalisation (language, translation)
 * - Structure éducative (education_system, cycle, track, grade, specialty)
 * - Contenu pédagogique (domain, subject, subject_alias, topic, skill)
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
    console.log('📦 Creating educational structure tables...\n');

    // ═══════════════════════════════════════════════════════════
    // 1. INTERNATIONALISATION (i18n)
    // ═══════════════════════════════════════════════════════════
    
    console.log('📚 Creating language table...');
    await db.query(`
      DEFINE TABLE language SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON language TYPE string;
      DEFINE FIELD name ON language TYPE string;
      DEFINE FIELD native_name ON language TYPE string;
      DEFINE FIELD direction ON language TYPE string DEFAULT "ltr";
      DEFINE FIELD is_active ON language TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON language TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_language_code ON language FIELDS code UNIQUE;
    `);
    console.log('  ✅ language table created');

    console.log('📚 Creating translation table...');
    await db.query(`
      DEFINE TABLE translation SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD entity_type ON translation TYPE string;
      DEFINE FIELD entity_id ON translation TYPE string;
      DEFINE FIELD language ON translation TYPE record<language>;
      DEFINE FIELD field_name ON translation TYPE string;
      DEFINE FIELD value ON translation TYPE string;
      DEFINE FIELD created_at ON translation TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON translation TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_translation ON translation FIELDS entity_type, entity_id, language, field_name UNIQUE;
    `);
    console.log('  ✅ translation table created');

    // ═══════════════════════════════════════════════════════════
    // 2. STRUCTURE ÉDUCATIVE
    // ═══════════════════════════════════════════════════════════

    console.log('📚 Creating education_system table...');
    await db.query(`
      DEFINE TABLE education_system SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON education_system TYPE string;
      DEFINE FIELD name ON education_system TYPE string;
      DEFINE FIELD country_code ON education_system TYPE string;
      DEFINE FIELD flag ON education_system TYPE option<string>;
      DEFINE FIELD default_language ON education_system TYPE record<language>;
      DEFINE FIELD is_active ON education_system TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON education_system TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_edu_system_code ON education_system FIELDS code UNIQUE;
    `);
    console.log('  ✅ education_system table created');

    console.log('📚 Creating cycle table...');
    await db.query(`
      DEFINE TABLE cycle SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD system ON cycle TYPE record<education_system>;
      DEFINE FIELD code ON cycle TYPE string;
      DEFINE FIELD name ON cycle TYPE string;
      DEFINE FIELD order ON cycle TYPE int DEFAULT 0;
      DEFINE FIELD age_min ON cycle TYPE option<int>;
      DEFINE FIELD age_max ON cycle TYPE option<int>;
      DEFINE FIELD is_active ON cycle TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON cycle TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_cycle ON cycle FIELDS system, code UNIQUE;
    `);
    console.log('  ✅ cycle table created');

    console.log('📚 Creating track table...');
    await db.query(`
      DEFINE TABLE track SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD cycle ON track TYPE record<cycle>;
      DEFINE FIELD code ON track TYPE string;
      DEFINE FIELD name ON track TYPE string;
      DEFINE FIELD order ON track TYPE int DEFAULT 0;
      DEFINE FIELD is_active ON track TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON track TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_track ON track FIELDS cycle, code UNIQUE;
    `);
    console.log('  ✅ track table created');

    console.log('📚 Creating grade table...');
    await db.query(`
      DEFINE TABLE grade SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD track ON grade TYPE option<record<track>>;
      DEFINE FIELD cycle ON grade TYPE record<cycle>;
      DEFINE FIELD code ON grade TYPE string;
      DEFINE FIELD name ON grade TYPE string;
      DEFINE FIELD order ON grade TYPE int DEFAULT 0;
      DEFINE FIELD difficulty_level ON grade TYPE int DEFAULT 5;
      DEFINE FIELD is_active ON grade TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON grade TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_grade ON grade FIELDS cycle, code UNIQUE;
    `);
    console.log('  ✅ grade table created');

    console.log('📚 Creating specialty table...');
    await db.query(`
      DEFINE TABLE specialty SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD track ON specialty TYPE record<track>;
      DEFINE FIELD code ON specialty TYPE string;
      DEFINE FIELD name ON specialty TYPE string;
      DEFINE FIELD is_mandatory ON specialty TYPE bool DEFAULT false;
      DEFINE FIELD order ON specialty TYPE int DEFAULT 0;
      DEFINE FIELD created_at ON specialty TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_specialty ON specialty FIELDS track, code UNIQUE;
    `);
    console.log('  ✅ specialty table created');

    // ═══════════════════════════════════════════════════════════
    // 3. CONTENU PÉDAGOGIQUE
    // ═══════════════════════════════════════════════════════════

    console.log('📚 Creating domain table...');
    await db.query(`
      DEFINE TABLE domain SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON domain TYPE string;
      DEFINE FIELD name ON domain TYPE string;
      DEFINE FIELD icon ON domain TYPE option<string>;
      DEFINE FIELD color ON domain TYPE option<string>;
      DEFINE FIELD order ON domain TYPE int DEFAULT 0;
      DEFINE FIELD is_active ON domain TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON domain TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_domain_code ON domain FIELDS code UNIQUE;
    `);
    console.log('  ✅ domain table created');

    console.log('📚 Creating subject table...');
    await db.query(`
      DEFINE TABLE subject SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD domain ON subject TYPE record<domain>;
      DEFINE FIELD code ON subject TYPE string;
      DEFINE FIELD name ON subject TYPE string;
      DEFINE FIELD icon ON subject TYPE option<string>;
      DEFINE FIELD color ON subject TYPE option<string>;
      DEFINE FIELD order ON subject TYPE int DEFAULT 0;
      DEFINE FIELD is_active ON subject TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON subject TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_subject_code ON subject FIELDS code UNIQUE;
    `);
    console.log('  ✅ subject table created');

    console.log('📚 Creating subject_alias table...');
    await db.query(`
      DEFINE TABLE subject_alias SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD subject ON subject_alias TYPE record<subject>;
      DEFINE FIELD system ON subject_alias TYPE record<education_system>;
      DEFINE FIELD cycle ON subject_alias TYPE option<record<cycle>>;
      DEFINE FIELD local_name ON subject_alias TYPE string;
      DEFINE FIELD created_at ON subject_alias TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_subject_alias ON subject_alias FIELDS subject, system, cycle UNIQUE;
    `);
    console.log('  ✅ subject_alias table created');

    console.log('📚 Creating topic table...');
    await db.query(`
      DEFINE TABLE topic SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD subject ON topic TYPE record<subject>;
      DEFINE FIELD parent ON topic TYPE option<record<topic>>;
      DEFINE FIELD code ON topic TYPE string;
      DEFINE FIELD name ON topic TYPE string;
      DEFINE FIELD order ON topic TYPE int DEFAULT 0;
      DEFINE FIELD difficulty_min ON topic TYPE int DEFAULT 1;
      DEFINE FIELD difficulty_max ON topic TYPE int DEFAULT 10;
      DEFINE FIELD is_active ON topic TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON topic TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_topic ON topic FIELDS subject, code UNIQUE;
    `);
    console.log('  ✅ topic table created');

    console.log('📚 Creating skill table...');
    await db.query(`
      DEFINE TABLE skill SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON skill TYPE string;
      DEFINE FIELD name ON skill TYPE string;
      DEFINE FIELD domain ON skill TYPE option<record<domain>>;
      DEFINE FIELD is_active ON skill TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON skill TYPE datetime DEFAULT time::now();
      DEFINE INDEX idx_skill_code ON skill FIELDS code UNIQUE;
    `);
    console.log('  ✅ skill table created');

    // ═══════════════════════════════════════════════════════════
    // 4. ENRICHIR LA TABLE USER
    // ═══════════════════════════════════════════════════════════

    console.log('📚 Adding education fields to user table...');
    await db.query(`
      DEFINE FIELD preferred_language ON user TYPE option<record<language>>;
      DEFINE FIELD education_system ON user TYPE option<record<education_system>>;
      DEFINE FIELD current_cycle ON user TYPE option<record<cycle>>;
      DEFINE FIELD current_grade ON user TYPE option<record<grade>>;
      DEFINE FIELD current_track ON user TYPE option<record<track>>;
      DEFINE FIELD specialties ON user TYPE option<array<record<specialty>>>;
      DEFINE FIELD onboarding_completed ON user TYPE bool DEFAULT false;
    `);
    console.log('  ✅ user table enriched');

    // ═══════════════════════════════════════════════════════════
    // 5. ENRICHIR LA TABLE QUIZ
    // ═══════════════════════════════════════════════════════════

    console.log('📚 Adding content fields to quiz table...');
    await db.query(`
      DEFINE FIELD subject ON quiz TYPE option<record<subject>>;
      DEFINE FIELD topics ON quiz TYPE option<array<record<topic>>>;
      DEFINE FIELD difficulty ON quiz TYPE int DEFAULT 5;
      DEFINE FIELD target_grades ON quiz TYPE option<array<record<grade>>>;
      DEFINE FIELD skills ON quiz TYPE option<array<record<skill>>>;
    `);
    console.log('  ✅ quiz table enriched');

    console.log('\n✨ All tables created successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate();
