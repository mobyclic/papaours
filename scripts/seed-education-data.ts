/**
 * Seed: Données de base - Langues, Domaines, Matières, Système éducatif France
 */

import Surreal from 'surrealdb';

async function seed() {
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
    console.log('🌱 Seeding base data...\n');

    // ═══════════════════════════════════════════════════════════
    // 1. LANGUES
    // ═══════════════════════════════════════════════════════════
    
    console.log('🌍 Creating languages...');
    
    const languages = [
      { id: 'fr', code: 'fr', name: 'French', native_name: 'Français', direction: 'ltr' },
      { id: 'en', code: 'en', name: 'English', native_name: 'English', direction: 'ltr' },
      { id: 'es', code: 'es', name: 'Spanish', native_name: 'Español', direction: 'ltr' },
      { id: 'ar', code: 'ar', name: 'Arabic', native_name: 'العربية', direction: 'rtl' },
    ];

    for (const lang of languages) {
      await db.query(`
        CREATE language:${lang.id} SET
          code = $code,
          name = $name,
          native_name = $native_name,
          direction = $direction,
          is_active = true,
          created_at = time::now()
      `, lang);
      console.log(`  ✅ ${lang.native_name} (${lang.code})`);
    }

    // ═══════════════════════════════════════════════════════════
    // 2. DOMAINES (catégories universelles)
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n📚 Creating domains...');
    
    const domains = [
      { id: 'sciences', code: 'sciences', name: 'Sciences & Logique', icon: '🔬', color: 'blue', order: 1 },
      { id: 'languages', code: 'languages', name: 'Langues & Lettres', icon: '📖', color: 'purple', order: 2 },
      { id: 'humanities', code: 'humanities', name: 'Sciences Humaines', icon: '🌍', color: 'amber', order: 3 },
      { id: 'arts', code: 'arts', name: 'Arts & Sport', icon: '🎨', color: 'pink', order: 4 },
      { id: 'professional', code: 'professional', name: 'Professionnel & Technique', icon: '⚙️', color: 'gray', order: 5 },
      { id: 'preschool', code: 'preschool', name: 'Éveil', icon: '🧒', color: 'green', order: 6 },
    ];

    for (const domain of domains) {
      await db.query(`
        CREATE domain:${domain.id} SET
          code = $code,
          name = $name,
          icon = $icon,
          color = $color,
          order = $order,
          is_active = true,
          created_at = time::now()
      `, domain);
      console.log(`  ✅ ${domain.icon} ${domain.name}`);
    }

    // ═══════════════════════════════════════════════════════════
    // 3. MATIÈRES UNIVERSELLES
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n📘 Creating subjects...');
    
    const subjects = [
      // Sciences & Logique
      { id: 'math', domain: 'sciences', code: 'math', name: 'Mathématiques', icon: '🔢', color: 'blue', order: 1 },
      { id: 'physics', domain: 'sciences', code: 'physics', name: 'Physique', icon: '⚡', color: 'yellow', order: 2 },
      { id: 'chemistry', domain: 'sciences', code: 'chemistry', name: 'Chimie', icon: '🧪', color: 'green', order: 3 },
      { id: 'biology', domain: 'sciences', code: 'biology', name: 'SVT', icon: '🌿', color: 'emerald', order: 4 },
      { id: 'computer_science', domain: 'sciences', code: 'computer_science', name: 'Informatique', icon: '💻', color: 'cyan', order: 5 },
      { id: 'technology', domain: 'sciences', code: 'technology', name: 'Technologie', icon: '🔧', color: 'slate', order: 6 },
      
      // Langues & Lettres
      { id: 'french', domain: 'languages', code: 'french', name: 'Français', icon: '🇫🇷', color: 'blue', order: 1 },
      { id: 'literature', domain: 'languages', code: 'literature', name: 'Littérature', icon: '📚', color: 'purple', order: 2 },
      { id: 'english', domain: 'languages', code: 'english', name: 'Anglais', icon: '🇬🇧', color: 'red', order: 3 },
      { id: 'spanish', domain: 'languages', code: 'spanish', name: 'Espagnol', icon: '🇪🇸', color: 'orange', order: 4 },
      { id: 'german', domain: 'languages', code: 'german', name: 'Allemand', icon: '🇩🇪', color: 'yellow', order: 5 },
      { id: 'italian', domain: 'languages', code: 'italian', name: 'Italien', icon: '🇮🇹', color: 'green', order: 6 },
      { id: 'latin', domain: 'languages', code: 'latin', name: 'Latin', icon: '🏛️', color: 'amber', order: 7 },
      { id: 'greek', domain: 'languages', code: 'greek', name: 'Grec ancien', icon: '🏺', color: 'sky', order: 8 },
      
      // Sciences Humaines
      { id: 'history', domain: 'humanities', code: 'history', name: 'Histoire', icon: '🏰', color: 'amber', order: 1 },
      { id: 'geography', domain: 'humanities', code: 'geography', name: 'Géographie', icon: '🗺️', color: 'green', order: 2 },
      { id: 'philosophy', domain: 'humanities', code: 'philosophy', name: 'Philosophie', icon: '🤔', color: 'purple', order: 3 },
      { id: 'economics', domain: 'humanities', code: 'economics', name: 'Économie', icon: '📈', color: 'emerald', order: 4 },
      { id: 'civics', domain: 'humanities', code: 'civics', name: 'EMC', icon: '🏛️', color: 'blue', order: 5 },
      { id: 'sociology', domain: 'humanities', code: 'sociology', name: 'Sociologie', icon: '👥', color: 'indigo', order: 6 },
      { id: 'psychology', domain: 'humanities', code: 'psychology', name: 'Psychologie', icon: '🧠', color: 'pink', order: 7 },
      
      // Arts & Sport
      { id: 'art', domain: 'arts', code: 'art', name: 'Arts plastiques', icon: '🎨', color: 'pink', order: 1 },
      { id: 'music', domain: 'arts', code: 'music', name: 'Musique', icon: '🎵', color: 'violet', order: 2 },
      { id: 'sports', domain: 'arts', code: 'sports', name: 'EPS', icon: '⚽', color: 'orange', order: 3 },
      { id: 'theater', domain: 'arts', code: 'theater', name: 'Théâtre', icon: '🎭', color: 'red', order: 4 },
      { id: 'cinema', domain: 'arts', code: 'cinema', name: 'Cinéma', icon: '🎬', color: 'slate', order: 5 },
      
      // Professionnel
      { id: 'law', domain: 'professional', code: 'law', name: 'Droit', icon: '⚖️', color: 'slate', order: 1 },
      { id: 'management', domain: 'professional', code: 'management', name: 'Management', icon: '💼', color: 'blue', order: 2 },
      { id: 'marketing', domain: 'professional', code: 'marketing', name: 'Marketing', icon: '📊', color: 'pink', order: 3 },
      { id: 'accounting', domain: 'professional', code: 'accounting', name: 'Comptabilité', icon: '🧮', color: 'green', order: 4 },
      { id: 'health', domain: 'professional', code: 'health', name: 'Santé', icon: '🏥', color: 'red', order: 5 },
      
      // Éveil (Maternelle)
      { id: 'motor_skills', domain: 'preschool', code: 'motor_skills', name: 'Motricité', icon: '🏃', color: 'orange', order: 1 },
      { id: 'oral_language', domain: 'preschool', code: 'oral_language', name: 'Langage oral', icon: '🗣️', color: 'blue', order: 2 },
      { id: 'discovery', domain: 'preschool', code: 'discovery', name: 'Découverte du monde', icon: '🌈', color: 'rainbow', order: 3 },
      { id: 'numbers_shapes', domain: 'preschool', code: 'numbers_shapes', name: 'Nombres et formes', icon: '🔵', color: 'purple', order: 4 },
    ];

    for (const subject of subjects) {
      await db.query(`
        CREATE subject:${subject.id} SET
          domain = domain:${subject.domain},
          code = $code,
          name = $name,
          icon = $icon,
          color = $color,
          order = $order,
          is_active = true,
          created_at = time::now()
      `, subject);
      console.log(`  ✅ ${subject.icon} ${subject.name}`);
    }

    // ═══════════════════════════════════════════════════════════
    // 4. SYSTÈME ÉDUCATIF FRANÇAIS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🇫🇷 Creating French education system...');
    
    // Système
    await db.query(`
      CREATE education_system:FR SET
        code = 'FR',
        name = 'France',
        country_code = 'FR',
        flag = '🇫🇷',
        default_language = language:fr,
        is_active = true,
        created_at = time::now()
    `);
    console.log('  ✅ Education system: France');

    // Cycles
    const cycles = [
      { id: 'FR_maternelle', code: 'maternelle', name: 'Maternelle', order: 1, age_min: 3, age_max: 5 },
      { id: 'FR_primaire', code: 'primaire', name: 'Primaire', order: 2, age_min: 6, age_max: 10 },
      { id: 'FR_college', code: 'college', name: 'Collège', order: 3, age_min: 11, age_max: 14 },
      { id: 'FR_lycee', code: 'lycee', name: 'Lycée', order: 4, age_min: 15, age_max: 17 },
      { id: 'FR_superieur', code: 'superieur', name: 'Supérieur', order: 5, age_min: 18, age_max: 25 },
    ];

    for (const cycle of cycles) {
      await db.query(`
        CREATE cycle:${cycle.id} SET
          system = education_system:FR,
          code = $code,
          name = $name,
          order = $order,
          age_min = $age_min,
          age_max = $age_max,
          is_active = true,
          created_at = time::now()
      `, cycle);
      console.log(`  ✅ Cycle: ${cycle.name}`);
    }

    // Filières Lycée
    console.log('\n📚 Creating Lycée tracks...');
    const lyceetracks = [
      { id: 'FR_lycee_general', code: 'general', name: 'Voie Générale', order: 1 },
      { id: 'FR_lycee_techno', code: 'techno', name: 'Voie Technologique', order: 2 },
      { id: 'FR_lycee_pro', code: 'pro', name: 'Voie Professionnelle', order: 3 },
    ];

    for (const track of lyceetracks) {
      await db.query(`
        CREATE track:${track.id} SET
          cycle = cycle:FR_lycee,
          code = $code,
          name = $name,
          order = $order,
          is_active = true,
          created_at = time::now()
      `, track);
      console.log(`  ✅ Track: ${track.name}`);
    }

    // Classes - Maternelle
    console.log('\n👶 Creating Maternelle grades...');
    const maternelleGrades = [
      { id: 'FR_PS', code: 'PS', name: 'Petite Section', order: 1, difficulty: 1 },
      { id: 'FR_MS', code: 'MS', name: 'Moyenne Section', order: 2, difficulty: 1 },
      { id: 'FR_GS', code: 'GS', name: 'Grande Section', order: 3, difficulty: 2 },
    ];

    for (const grade of maternelleGrades) {
      await db.query(`
        CREATE grade:${grade.id} SET
          cycle = cycle:FR_maternelle,
          code = $code,
          name = $name,
          order = $order,
          difficulty_level = $difficulty,
          is_active = true,
          created_at = time::now()
      `, { ...grade, difficulty: grade.difficulty });
      console.log(`  ✅ ${grade.name} (${grade.code})`);
    }

    // Classes - Primaire
    console.log('\n📕 Creating Primaire grades...');
    const primaireGrades = [
      { id: 'FR_CP', code: 'CP', name: 'CP', order: 1, difficulty: 2 },
      { id: 'FR_CE1', code: 'CE1', name: 'CE1', order: 2, difficulty: 2 },
      { id: 'FR_CE2', code: 'CE2', name: 'CE2', order: 3, difficulty: 3 },
      { id: 'FR_CM1', code: 'CM1', name: 'CM1', order: 4, difficulty: 3 },
      { id: 'FR_CM2', code: 'CM2', name: 'CM2', order: 5, difficulty: 4 },
    ];

    for (const grade of primaireGrades) {
      await db.query(`
        CREATE grade:${grade.id} SET
          cycle = cycle:FR_primaire,
          code = $code,
          name = $name,
          order = $order,
          difficulty_level = $difficulty,
          is_active = true,
          created_at = time::now()
      `, { ...grade, difficulty: grade.difficulty });
      console.log(`  ✅ ${grade.name}`);
    }

    // Classes - Collège
    console.log('\n📗 Creating Collège grades...');
    const collegeGrades = [
      { id: 'FR_6e', code: '6e', name: 'Sixième', order: 1, difficulty: 4 },
      { id: 'FR_5e', code: '5e', name: 'Cinquième', order: 2, difficulty: 5 },
      { id: 'FR_4e', code: '4e', name: 'Quatrième', order: 3, difficulty: 5 },
      { id: 'FR_3e', code: '3e', name: 'Troisième', order: 4, difficulty: 6 },
    ];

    for (const grade of collegeGrades) {
      await db.query(`
        CREATE grade:${grade.id} SET
          cycle = cycle:FR_college,
          code = $code,
          name = $name,
          order = $order,
          difficulty_level = $difficulty,
          is_active = true,
          created_at = time::now()
      `, { ...grade, difficulty: grade.difficulty });
      console.log(`  ✅ ${grade.name}`);
    }

    // Classes - Lycée Général
    console.log('\n📘 Creating Lycée Général grades...');
    const lyceeGenGrades = [
      { id: 'FR_2nde_G', code: '2nde', name: 'Seconde Générale', order: 1, difficulty: 6 },
      { id: 'FR_1ere_G', code: '1ere', name: 'Première Générale', order: 2, difficulty: 7 },
      { id: 'FR_Term_G', code: 'terminale', name: 'Terminale Générale', order: 3, difficulty: 8 },
    ];

    for (const grade of lyceeGenGrades) {
      await db.query(`
        CREATE grade:${grade.id} SET
          cycle = cycle:FR_lycee,
          track = track:FR_lycee_general,
          code = $code,
          name = $name,
          order = $order,
          difficulty_level = $difficulty,
          is_active = true,
          created_at = time::now()
      `, { ...grade, difficulty: grade.difficulty });
      console.log(`  ✅ ${grade.name}`);
    }

    // Spécialités Lycée Général
    console.log('\n🎯 Creating specialties for Lycée Général...');
    const specialties = [
      { id: 'FR_spe_maths', code: 'maths', name: 'Mathématiques', order: 1 },
      { id: 'FR_spe_physique', code: 'physique', name: 'Physique-Chimie', order: 2 },
      { id: 'FR_spe_svt', code: 'svt', name: 'SVT', order: 3 },
      { id: 'FR_spe_nsi', code: 'nsi', name: 'NSI (Numérique)', order: 4 },
      { id: 'FR_spe_ses', code: 'ses', name: 'SES', order: 5 },
      { id: 'FR_spe_hggsp', code: 'hggsp', name: 'HGGSP', order: 6 },
      { id: 'FR_spe_hlp', code: 'hlp', name: 'HLP', order: 7 },
      { id: 'FR_spe_llce', code: 'llce', name: 'LLCE (Langues)', order: 8 },
      { id: 'FR_spe_arts', code: 'arts', name: 'Arts', order: 9 },
    ];

    for (const spe of specialties) {
      await db.query(`
        CREATE specialty:${spe.id} SET
          track = track:FR_lycee_general,
          code = $code,
          name = $name,
          order = $order,
          is_mandatory = false,
          created_at = time::now()
      `, spe);
      console.log(`  ✅ Spécialité: ${spe.name}`);
    }

    // Classes - Lycée Techno (exemples)
    console.log('\n📙 Creating Lycée Techno grades...');
    const lyceeTechGrades = [
      { id: 'FR_2nde_T', code: '2nde_t', name: 'Seconde Techno', order: 1, difficulty: 6 },
      { id: 'FR_1ere_STMG', code: '1ere_stmg', name: 'Première STMG', order: 2, difficulty: 7 },
      { id: 'FR_Term_STMG', code: 'term_stmg', name: 'Terminale STMG', order: 3, difficulty: 8 },
      { id: 'FR_1ere_STI2D', code: '1ere_sti2d', name: 'Première STI2D', order: 4, difficulty: 7 },
      { id: 'FR_Term_STI2D', code: 'term_sti2d', name: 'Terminale STI2D', order: 5, difficulty: 8 },
    ];

    for (const grade of lyceeTechGrades) {
      await db.query(`
        CREATE grade:${grade.id} SET
          cycle = cycle:FR_lycee,
          track = track:FR_lycee_techno,
          code = $code,
          name = $name,
          order = $order,
          difficulty_level = $difficulty,
          is_active = true,
          created_at = time::now()
      `, { ...grade, difficulty: grade.difficulty });
      console.log(`  ✅ ${grade.name}`);
    }

    // Supérieur (exemples)
    console.log('\n🎓 Creating Supérieur grades...');
    const supGrades = [
      { id: 'FR_L1', code: 'L1', name: 'Licence 1', order: 1, difficulty: 8 },
      { id: 'FR_L2', code: 'L2', name: 'Licence 2', order: 2, difficulty: 8 },
      { id: 'FR_L3', code: 'L3', name: 'Licence 3', order: 3, difficulty: 9 },
      { id: 'FR_M1', code: 'M1', name: 'Master 1', order: 4, difficulty: 9 },
      { id: 'FR_M2', code: 'M2', name: 'Master 2', order: 5, difficulty: 10 },
      { id: 'FR_BTS1', code: 'BTS1', name: 'BTS 1ère année', order: 6, difficulty: 8 },
      { id: 'FR_BTS2', code: 'BTS2', name: 'BTS 2ème année', order: 7, difficulty: 8 },
      { id: 'FR_CPGE1', code: 'CPGE1', name: 'Prépa 1ère année', order: 8, difficulty: 9 },
      { id: 'FR_CPGE2', code: 'CPGE2', name: 'Prépa 2ème année', order: 9, difficulty: 10 },
    ];

    for (const grade of supGrades) {
      await db.query(`
        CREATE grade:${grade.id} SET
          cycle = cycle:FR_superieur,
          code = $code,
          name = $name,
          order = $order,
          difficulty_level = $difficulty,
          is_active = true,
          created_at = time::now()
      `, { ...grade, difficulty: grade.difficulty });
      console.log(`  ✅ ${grade.name}`);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. ALIAS LOCAUX POUR LES MATIÈRES (exemples)
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🏷️ Creating subject aliases...');
    
    const aliases = [
      // Maths
      { subject: 'math', system: 'FR', cycle: 'FR_maternelle', local_name: 'Découvrir les nombres' },
      { subject: 'math', system: 'FR', cycle: 'FR_primaire', local_name: 'Mathématiques' },
      { subject: 'math', system: 'FR', cycle: 'FR_college', local_name: 'Mathématiques' },
      { subject: 'math', system: 'FR', cycle: 'FR_lycee', local_name: 'Maths' },
      
      // SVT
      { subject: 'biology', system: 'FR', cycle: 'FR_primaire', local_name: 'Sciences' },
      { subject: 'biology', system: 'FR', cycle: 'FR_college', local_name: 'SVT' },
      { subject: 'biology', system: 'FR', cycle: 'FR_lycee', local_name: 'Sciences de la Vie et de la Terre' },
    ];

    for (const alias of aliases) {
      const id = `${alias.subject}_${alias.system}_${alias.cycle}`;
      await db.query(`
        CREATE subject_alias:${id} SET
          subject = subject:${alias.subject},
          system = education_system:${alias.system},
          cycle = cycle:${alias.cycle},
          local_name = $local_name,
          created_at = time::now()
      `, alias);
      console.log(`  ✅ ${alias.local_name} (${alias.cycle})`);
    }

    console.log('\n✨ Seed completed successfully!');

    // Stats
    const stats = await db.query(`
      RETURN {
        languages: (SELECT count() FROM language GROUP ALL)[0].count,
        domains: (SELECT count() FROM domain GROUP ALL)[0].count,
        subjects: (SELECT count() FROM subject GROUP ALL)[0].count,
        cycles: (SELECT count() FROM cycle GROUP ALL)[0].count,
        grades: (SELECT count() FROM grade GROUP ALL)[0].count,
        tracks: (SELECT count() FROM track GROUP ALL)[0].count,
        specialties: (SELECT count() FROM specialty GROUP ALL)[0].count
      }
    `);
    
    console.log('\n📊 Summary:');
    console.log(JSON.stringify(stats[0], null, 2));

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

seed();
