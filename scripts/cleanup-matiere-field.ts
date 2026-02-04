/**
 * Migration: Ajouter subject aux thèmes et supprimer le champ matiere obsolète
 * 
 * Ce script :
 * 1. Ajoute le champ subject à la table theme
 * 2. Assigne les subjects aux thèmes basé sur leur nom/contenu
 * 3. Supprime le champ matiere obsolète
 */

import Surreal from "surrealdb";

const db = new Surreal();

// Mapping thème → subject basé sur le nom du thème
const THEME_TO_SUBJECT: Record<string, string> = {
  // Histoire
  "Époque contemporaine": "histoire",
  "Temps modernes": "histoire",
  "Antiquité": "histoire",
  "Moyen Âge": "histoire",
  "Préhistoire": "histoire",
  "Gaulois": "histoire",
  "XXe siècle": "histoire",
  "Napoléon et l'Empire": "histoire",
  "Les causes de la Révolution française": "histoire",
  "Les grandes dates de la Révolution française": "histoire",
  "Les personnages de la Révolution française": "histoire",
  "Les grandes batailles de 14-18": "histoire",
  "Chronologie de la Première Guerre mondiale": "histoire",
  
  // Géographie
  "Reliefs et paysages": "geographie",
  "Climat": "geographie",
  "Population": "geographie",
  "L'Europe": "geographie",
  "La France": "geographie",
  "Le Monde": "geographie",
  "Environnement": "geographie",
  
  // Français
  "Expression écrite": "francais",
  "Vocabulaire": "francais",
  "Grammaire": "francais",
  "Conjugaison": "francais",
  "Orthographe": "francais",
  "Lecture": "francais",
  "Littérature": "francais",
  
  // Mathématiques
  "Géométrie": "mathematiques",
  "Numération": "mathematiques",
  "Mesures": "mathematiques",
  "Calcul": "mathematiques",
  "Problèmes": "mathematiques",
  "Logique": "mathematiques",
  
  // Arts plastiques
  "Peinture": "arts_plastiques",
  "Mouvements artistiques": "arts_plastiques",
  "Architecture": "arts_plastiques",
  "Sculpture": "arts_plastiques",
  "Artistes célèbres": "arts_plastiques",
  
  // Musique
  "orchestre symphonique": "musique",
  "Rythme": "musique",
  "Compositeurs": "musique",
  "Instruments": "musique",
  
  // EMC (Éducation morale et civique)
  "Institutions": "emc",
  "Citoyenneté": "emc",
  "Vivre ensemble": "emc",
  "Droits et devoirs": "emc",
  
  // Sciences
  "Le vivant": "sciences",
  "La matière": "sciences",
  "Technologie": "sciences",
  "Le corps humain": "sciences",
  "L'énergie": "sciences",
  "Cycle de la vie": "sciences",
  
  // Anglais
  "Expression orale": "anglais",
  "Compréhension orale": "anglais",
  "Culture": "anglais",
  
  // Test/Divers
  "Test": "francais", // Par défaut
};

async function main() {
  console.log("🔄 Migration: Ajouter subject aux thèmes\n");

  await db.connect(process.env.SURREAL_URL + "/rpc");
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: "kweez", database: "dbkweez" });

  console.log("✅ Connecté à SurrealDB\n");

  // 1. Ajouter le champ subject à la table theme
  console.log("📝 Étape 1: Ajout du champ subject à theme...");
  await db.query(`
    DEFINE FIELD subject ON theme TYPE option<record<subject>> PERMISSIONS FULL;
    DEFINE INDEX idx_theme_subject ON theme FIELDS subject;
  `);
  console.log("   ✅ Champ subject ajouté\n");

  // 2. Récupérer tous les thèmes
  console.log("📋 Étape 2: Récupération des thèmes...");
  const themes = await db.query("SELECT id, name, slug FROM theme");
  const themeList = (themes[0] as any[]) || [];
  console.log(`   📊 ${themeList.length} thèmes trouvés\n`);

  // 3. Assigner les subjects
  console.log("🔗 Étape 3: Attribution des subjects aux thèmes...");
  let assigned = 0;
  let notFound = 0;
  const notFoundThemes: string[] = [];

  for (const theme of themeList) {
    const subjectCode = THEME_TO_SUBJECT[theme.name];
    
    if (subjectCode) {
      await db.query(
        `UPDATE $themeId SET subject = type::thing("subject", $subjectCode)`,
        { themeId: theme.id, subjectCode }
      );
      assigned++;
      console.log(`   ✅ ${theme.name} → ${subjectCode}`);
    } else {
      notFound++;
      notFoundThemes.push(theme.name);
      console.log(`   ⚠️ Pas de mapping: ${theme.name}`);
    }
  }

  console.log(`\n   📊 Résumé: ${assigned} assignés, ${notFound} sans mapping`);
  
  if (notFoundThemes.length > 0) {
    console.log("\n   ⚠️ Thèmes sans mapping (à ajouter manuellement):");
    notFoundThemes.forEach(t => console.log(`      - "${t}"`));
  }

  // 4. Supprimer le champ matiere obsolète
  console.log("\n🗑️  Étape 4: Suppression du champ matiere obsolète...");
  try {
    await db.query("REMOVE FIELD matiere ON TABLE theme");
    console.log("   ✅ Champ matiere supprimé de la définition");
  } catch (e) {
    console.log("   ℹ️ Erreur:", (e as Error).message);
  }
  
  // Nettoyer les données
  await db.query("UPDATE theme SET matiere = NONE");
  console.log("   ✅ Données matiere nettoyées");

  // 5. Vérification finale
  console.log("\n📊 Vérification finale:");
  const verifyResult = await db.query(`
    SELECT count() as total FROM theme GROUP ALL;
  `);
  const withSubject = await db.query(`
    SELECT count() as c FROM theme WHERE subject != NONE GROUP ALL;
  `);
  
  const total = (verifyResult[0] as any[])?.[0]?.total || 0;
  const withSub = (withSubject[0] as any[])?.[0]?.c || 0;
  
  console.log(`   Total thèmes: ${total}`);
  console.log(`   Avec subject: ${withSub}`);
  console.log(`   Sans subject: ${total - withSub}`);

  // 6. Afficher la structure finale
  console.log("\n📊 Structure finale de la table theme:");
  const finalInfo = await db.query("INFO FOR TABLE theme");
  console.log(JSON.stringify(finalInfo, null, 2));

  // 7. Exemple
  console.log("\n📋 Exemple de thème migré:");
  const example = await db.query("SELECT id, name, subject FROM theme WHERE subject != NONE LIMIT 3");
  console.log(JSON.stringify(example[0], null, 2));

  await db.close();
  console.log("\n✅ Migration terminée !");
}

main().catch(console.error);
