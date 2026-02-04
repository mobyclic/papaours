/**
 * Nettoyage du schéma éducatif
 * 
 * Ce script :
 * 1. Supprime la table `matiere` obsolète
 * 2. Crée le schéma et l'enregistrement `language:fr`
 * 3. Vérifie/crée les tables `skill` et `topic` si référencées
 */

import Surreal from "surrealdb";

const db = new Surreal();

async function main() {
  console.log("🧹 Nettoyage du schéma éducatif\n");

  await db.connect(process.env.SURREAL_URL + "/rpc");
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: "kweez", database: "dbkweez" });

  console.log("✅ Connecté à SurrealDB\n");

  // ========================================
  // 1. Supprimer la table matiere obsolète
  // ========================================
  console.log("🗑️  Étape 1: Suppression de la table matiere obsolète...");
  try {
    // Vérifier si elle existe et est vide
    const matiereCount = await db.query("SELECT count() as c FROM matiere GROUP ALL");
    const count = (matiereCount[0] as any[])?.[0]?.c || 0;
    
    if (count > 0) {
      console.log(`   ⚠️ La table matiere contient ${count} enregistrements !`);
      console.log("   ⚠️ Suppression annulée par sécurité.");
    } else {
      await db.query("REMOVE TABLE matiere");
      console.log("   ✅ Table matiere supprimée");
    }
  } catch (e) {
    console.log("   ℹ️ Table matiere n'existe pas ou erreur:", (e as Error).message);
  }

  // ========================================
  // 2. Créer le schéma language et language:fr
  // ========================================
  console.log("\n🌍 Étape 2: Création du schéma et données language...");
  
  // Définir le schéma de la table language
  await db.query(`
    DEFINE TABLE language SCHEMAFULL PERMISSIONS FULL;
    DEFINE FIELD code ON language TYPE string PERMISSIONS FULL;
    DEFINE FIELD name ON language TYPE string PERMISSIONS FULL;
    DEFINE FIELD native_name ON language TYPE string PERMISSIONS FULL;
    DEFINE FIELD flag ON language TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD is_active ON language TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD created_at ON language TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    DEFINE INDEX idx_language_code ON language FIELDS code UNIQUE;
  `);
  console.log("   ✅ Schéma language défini");

  // Créer les langues principales
  const languages = [
    { id: "fr", code: "fr", name: "French", native_name: "Français", flag: "🇫🇷" },
    { id: "en", code: "en", name: "English", native_name: "English", flag: "🇬🇧" },
    { id: "es", code: "es", name: "Spanish", native_name: "Español", flag: "🇪🇸" },
    { id: "de", code: "de", name: "German", native_name: "Deutsch", flag: "🇩🇪" },
    { id: "it", code: "it", name: "Italian", native_name: "Italiano", flag: "🇮🇹" },
    { id: "pt", code: "pt", name: "Portuguese", native_name: "Português", flag: "🇵🇹" },
    { id: "ar", code: "ar", name: "Arabic", native_name: "العربية", flag: "🇸🇦" },
    { id: "zh", code: "zh", name: "Chinese", native_name: "中文", flag: "🇨🇳" },
  ];

  for (const lang of languages) {
    try {
      await db.query(`
        CREATE language:${lang.id} CONTENT {
          code: $code,
          name: $name,
          native_name: $native_name,
          flag: $flag,
          is_active: true,
          created_at: time::now()
        }
      `, { code: lang.code, name: lang.name, native_name: lang.native_name, flag: lang.flag });
      console.log(`   ✅ Créé language:${lang.id} (${lang.native_name})`);
    } catch (e) {
      // Probablement existe déjà
      console.log(`   ℹ️ language:${lang.id} existe déjà ou erreur`);
    }
  }

  // Vérifier que language:fr existe maintenant
  const langFr = await db.query("SELECT * FROM language:fr");
  if ((langFr[0] as any[])?.length > 0) {
    console.log("   ✅ language:fr vérifié et existant");
  } else {
    console.log("   ❌ Erreur: language:fr non créé !");
  }

  // ========================================
  // 3. Vérifier/créer les tables skill et topic
  // ========================================
  console.log("\n📚 Étape 3: Vérification des tables skill et topic...");

  // Vérifier si skill existe
  try {
    const skillInfo = await db.query("INFO FOR TABLE skill");
    const skillFields = Object.keys((skillInfo[0] as any)?.fields || {});
    if (skillFields.length === 0) {
      console.log("   ⚠️ Table skill existe mais sans schéma, création du schéma...");
      await db.query(`
        DEFINE TABLE skill SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD code ON skill TYPE string PERMISSIONS FULL;
        DEFINE FIELD name ON skill TYPE string PERMISSIONS FULL;
        DEFINE FIELD description ON skill TYPE option<string> PERMISSIONS FULL;
        DEFINE FIELD subject ON skill TYPE option<record<subject>> PERMISSIONS FULL;
        DEFINE FIELD order ON skill TYPE int DEFAULT 0 PERMISSIONS FULL;
        DEFINE FIELD is_active ON skill TYPE bool DEFAULT true PERMISSIONS FULL;
        DEFINE FIELD created_at ON skill TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
        DEFINE INDEX idx_skill_code ON skill FIELDS code UNIQUE;
      `);
      console.log("   ✅ Schéma skill créé");
    } else {
      console.log("   ✅ Table skill existe avec schéma");
    }
  } catch (e) {
    console.log("   ℹ️ Table skill n'existe pas, création...");
    await db.query(`
      DEFINE TABLE skill SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON skill TYPE string PERMISSIONS FULL;
      DEFINE FIELD name ON skill TYPE string PERMISSIONS FULL;
      DEFINE FIELD description ON skill TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD subject ON skill TYPE option<record<subject>> PERMISSIONS FULL;
      DEFINE FIELD order ON skill TYPE int DEFAULT 0 PERMISSIONS FULL;
      DEFINE FIELD is_active ON skill TYPE bool DEFAULT true PERMISSIONS FULL;
      DEFINE FIELD created_at ON skill TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      DEFINE INDEX idx_skill_code ON skill FIELDS code UNIQUE;
    `);
    console.log("   ✅ Table skill créée");
  }

  // Vérifier si topic existe
  try {
    const topicInfo = await db.query("INFO FOR TABLE topic");
    const topicFields = Object.keys((topicInfo[0] as any)?.fields || {});
    if (topicFields.length === 0) {
      console.log("   ⚠️ Table topic existe mais sans schéma, création du schéma...");
      await db.query(`
        DEFINE TABLE topic SCHEMAFULL PERMISSIONS FULL;
        DEFINE FIELD code ON topic TYPE string PERMISSIONS FULL;
        DEFINE FIELD name ON topic TYPE string PERMISSIONS FULL;
        DEFINE FIELD description ON topic TYPE option<string> PERMISSIONS FULL;
        DEFINE FIELD theme ON topic TYPE option<record<theme>> PERMISSIONS FULL;
        DEFINE FIELD order ON topic TYPE int DEFAULT 0 PERMISSIONS FULL;
        DEFINE FIELD is_active ON topic TYPE bool DEFAULT true PERMISSIONS FULL;
        DEFINE FIELD created_at ON topic TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
        DEFINE INDEX idx_topic_code ON topic FIELDS code UNIQUE;
      `);
      console.log("   ✅ Schéma topic créé");
    } else {
      console.log("   ✅ Table topic existe avec schéma");
    }
  } catch (e) {
    console.log("   ℹ️ Table topic n'existe pas, création...");
    await db.query(`
      DEFINE TABLE topic SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON topic TYPE string PERMISSIONS FULL;
      DEFINE FIELD name ON topic TYPE string PERMISSIONS FULL;
      DEFINE FIELD description ON topic TYPE option<string> PERMISSIONS FULL;
      DEFINE FIELD theme ON topic TYPE option<record<theme>> PERMISSIONS FULL;
      DEFINE FIELD order ON topic TYPE int DEFAULT 0 PERMISSIONS FULL;
      DEFINE FIELD is_active ON topic TYPE bool DEFAULT true PERMISSIONS FULL;
      DEFINE FIELD created_at ON topic TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      DEFINE INDEX idx_topic_code ON topic FIELDS code UNIQUE;
    `);
    console.log("   ✅ Table topic créée");
  }

  // ========================================
  // 4. Vérification finale
  // ========================================
  console.log("\n📊 Vérification finale...");

  // Vérifier que matiere n'existe plus
  try {
    await db.query("INFO FOR TABLE matiere");
    console.log("   ⚠️ Table matiere existe encore");
  } catch (e) {
    console.log("   ✅ Table matiere supprimée");
  }

  // Vérifier language:fr
  const verifyLang = await db.query("SELECT id, code, native_name, flag FROM language:fr");
  console.log("   ✅ language:fr:", JSON.stringify((verifyLang[0] as any[])?.[0] || "Non trouvé"));

  // Vérifier education_system pointe vers language:fr
  const verifyEs = await db.query("SELECT id, name, default_language FROM education_system:FR");
  console.log("   ✅ education_system:FR:", JSON.stringify((verifyEs[0] as any[])?.[0] || "Non trouvé"));

  // Résumé des tables
  console.log("\n📋 Tables du système éducatif:");
  const tables = ["education_system", "language", "cycle", "track", "grade", "specialty", "skill", "topic"];
  for (const table of tables) {
    const count = await db.query(`SELECT count() as c FROM ${table} GROUP ALL`);
    const c = (count[0] as any[])?.[0]?.c || 0;
    console.log(`   - ${table}: ${c} enregistrement(s)`);
  }

  await db.close();
  console.log("\n✅ Nettoyage terminé !");
}

main().catch(console.error);
