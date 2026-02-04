/**
 * Migration: Ajouter track et specialty à official_program
 * 
 * Permet de distinguer les programmes selon :
 * - track : voie Générale / Technologique / Professionnelle
 * - specialty : spécialités du lycée (Maths, Physique, NSI, etc.)
 */

import Surreal from "surrealdb";

const db = new Surreal();

async function main() {
  console.log("🔄 Migration: Ajout track/specialty à official_program\n");

  await db.connect(process.env.SURREAL_URL + "/rpc");
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: "kweez", database: "dbkweez" });

  console.log("✅ Connecté à SurrealDB\n");

  // ========================================
  // 1. Afficher la structure actuelle
  // ========================================
  console.log("📊 Structure actuelle de official_program:");
  const currentInfo = await db.query("INFO FOR TABLE official_program");
  const currentFields = Object.keys((currentInfo[0] as any)?.fields || {});
  console.log("   Champs:", currentFields.join(", "));
  
  const currentIndexes = Object.keys((currentInfo[0] as any)?.indexes || {});
  console.log("   Index:", currentIndexes.join(", "));

  // ========================================
  // 2. Ajouter les nouveaux champs
  // ========================================
  console.log("\n📝 Ajout des champs track et specialty...");

  // Champ track (optionnel) - pour distinguer Général/Techno/Pro
  await db.query(`
    DEFINE FIELD track ON official_program TYPE option<record<track>> PERMISSIONS FULL;
  `);
  console.log("   ✅ Champ track ajouté");

  // Champ specialty (optionnel) - pour les spécialités lycée
  await db.query(`
    DEFINE FIELD specialty ON official_program TYPE option<record<specialty>> PERMISSIONS FULL;
  `);
  console.log("   ✅ Champ specialty ajouté");

  // ========================================
  // 3. Mettre à jour l'index unique
  // ========================================
  console.log("\n🔑 Mise à jour de l'index unique...");
  
  // Supprimer l'ancien index
  try {
    await db.query("REMOVE INDEX idx_official_program_unique ON TABLE official_program");
    console.log("   ✅ Ancien index supprimé");
  } catch (e) {
    console.log("   ℹ️ Pas d'index existant à supprimer");
  }

  // Créer le nouvel index incluant track et specialty
  // Note: On ne peut pas inclure des champs optionnels dans un index UNIQUE directement
  // car NULL != NULL en SQL. On garde donc l'index sur les champs obligatoires
  // et on ajoute un index composite pour les recherches.
  await db.query(`
    DEFINE INDEX idx_official_program_unique ON official_program 
      FIELDS education_system, cycle, grade, subject UNIQUE;
  `);
  console.log("   ✅ Index unique recréé (champs obligatoires)");

  // Index pour les recherches avec track/specialty
  await db.query(`
    DEFINE INDEX idx_official_program_track ON official_program FIELDS track;
    DEFINE INDEX idx_official_program_specialty ON official_program FIELDS specialty;
  `);
  console.log("   ✅ Index de recherche ajoutés (track, specialty)");

  // ========================================
  // 4. Mettre à jour les programmes lycée existants avec leur track
  // ========================================
  console.log("\n🔄 Mise à jour des programmes lycée existants...");

  // Récupérer les grades lycée avec leur track
  const gradesWithTrack = await db.query(`
    SELECT id, track FROM grade WHERE cycle = cycle:FR_lycee AND track != NONE
  `);
  
  let updatedCount = 0;
  for (const grade of (gradesWithTrack[0] as any[])) {
    // Mettre à jour les programmes de ce grade avec son track
    const result = await db.query(`
      UPDATE official_program SET track = $track WHERE grade = $gradeId
    `, { track: grade.track, gradeId: grade.id });
    
    const affected = (result[0] as any[])?.length || 0;
    if (affected > 0) {
      console.log(`   ✅ ${affected} programme(s) mis à jour pour ${grade.id} → ${grade.track}`);
      updatedCount += affected;
    }
  }
  console.log(`   📊 Total: ${updatedCount} programmes mis à jour avec leur track`);

  // ========================================
  // 5. Vérification finale
  // ========================================
  console.log("\n📊 Vérification finale:");
  
  const finalInfo = await db.query("INFO FOR TABLE official_program");
  const finalFields = Object.keys((finalInfo[0] as any)?.fields || {});
  console.log("   Champs:", finalFields.join(", "));
  
  const finalIndexes = Object.keys((finalInfo[0] as any)?.indexes || {});
  console.log("   Index:", finalIndexes.join(", "));

  // Exemple de programme avec track
  console.log("\n📋 Exemple de programme lycée avec track:");
  const example = await db.query(`
    SELECT id, name, grade, track, specialty 
    FROM official_program 
    WHERE track != NONE 
    LIMIT 2
  `);
  console.log(JSON.stringify(example[0], null, 2));

  // Stats
  console.log("\n📊 Statistiques:");
  const stats = await db.query(`
    SELECT 
      count() as total,
      count(track != NONE) as with_track,
      count(specialty != NONE) as with_specialty
    FROM official_program
    GROUP ALL
  `);
  const s = (stats[0] as any[])?.[0] || {};
  console.log(`   Total programmes: ${s.total || 0}`);
  console.log(`   Avec track: ${s.with_track || 0}`);
  console.log(`   Avec specialty: ${s.with_specialty || 0}`);

  await db.close();
  console.log("\n✅ Migration terminée !");
  console.log("\n💡 Pour créer un programme de spécialité:");
  console.log('   CREATE official_program:FR_1ere_G_spe_maths SET');
  console.log('     name = "Mathématiques - Spécialité 1ère",');
  console.log('     education_system = education_system:FR,');
  console.log('     cycle = cycle:FR_lycee,');
  console.log('     grade = grade:FR_1ere_G,');
  console.log('     track = track:FR_lycee_general,');
  console.log('     specialty = specialty:FR_spe_maths,');
  console.log('     subject = subject:mathematiques');
}

main().catch(console.error);
