/**
 * Migration: Créer la table domain et lier subject.domain
 * 
 * Transforme le champ domain (string) en record<domain> pour :
 * - Ordonner les domaines (humanités > langues > sciences > arts)
 * - Avoir des métadonnées (nom, icône, couleur)
 */

import Surreal from "surrealdb";

const db = new Surreal();

// Définition des domaines avec leur ordre de priorité
const DOMAINS = [
  { 
    id: "humanites", 
    code: "humanites",
    name: "Humanités", 
    description: "Histoire, Géographie, EMC, Philosophie",
    icon: "📜",
    color: "amber",
    order: 1 
  },
  { 
    id: "langues", 
    code: "langues",
    name: "Langues", 
    description: "Français, Anglais, Espagnol, Allemand...",
    icon: "🗣️",
    color: "blue",
    order: 2 
  },
  { 
    id: "sciences", 
    code: "sciences",
    name: "Sciences", 
    description: "Mathématiques, Physique-Chimie, SVT, NSI",
    icon: "🔬",
    color: "green",
    order: 3 
  },
  { 
    id: "arts", 
    code: "arts",
    name: "Arts & Sport", 
    description: "Arts plastiques, Musique, EPS",
    icon: "🎨",
    color: "purple",
    order: 4 
  },
];

async function main() {
  console.log("🔄 Migration: Création de la table domain\n");

  await db.connect(process.env.SURREAL_URL + "/rpc");
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: "kweez", database: "dbkweez" });

  console.log("✅ Connecté à SurrealDB\n");

  // ========================================
  // 1. Créer la table domain
  // ========================================
  console.log("📝 Étape 1: Création de la table domain...");
  
  await db.query(`
    DEFINE TABLE domain SCHEMAFULL PERMISSIONS FULL;
    DEFINE FIELD code ON domain TYPE string PERMISSIONS FULL;
    DEFINE FIELD name ON domain TYPE string PERMISSIONS FULL;
    DEFINE FIELD description ON domain TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD icon ON domain TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD color ON domain TYPE option<string> PERMISSIONS FULL;
    DEFINE FIELD order ON domain TYPE int DEFAULT 0 PERMISSIONS FULL;
    DEFINE FIELD is_active ON domain TYPE bool DEFAULT true PERMISSIONS FULL;
    DEFINE FIELD created_at ON domain TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
    DEFINE INDEX idx_domain_code ON domain FIELDS code UNIQUE;
  `);
  console.log("   ✅ Table domain créée");

  // ========================================
  // 2. Insérer les domaines
  // ========================================
  console.log("\n📝 Étape 2: Insertion des domaines...");
  
  for (const domain of DOMAINS) {
    try {
      await db.query(`
        CREATE domain:${domain.id} CONTENT {
          code: $code,
          name: $name,
          description: $description,
          icon: $icon,
          color: $color,
          \`order\`: $order,
          is_active: true,
          created_at: time::now()
        }
      `, {
        code: domain.code,
        name: domain.name,
        description: domain.description,
        icon: domain.icon,
        color: domain.color,
        order: domain.order,
      });
      console.log(`   ✅ Créé domain:${domain.id} (${domain.icon} ${domain.name}, order:${domain.order})`);
    } catch (e) {
      console.log(`   ℹ️ domain:${domain.id} existe déjà`);
    }
  }

  // ========================================
  // 3. Sauvegarder les anciens domaines (string) des subjects
  // ========================================
  console.log("\n📋 Étape 3: Récupération des domaines actuels des subjects...");
  
  const subjects = await db.query("SELECT id, code, name, domain FROM subject");
  const subjectDomains: Record<string, string> = {};
  
  for (const s of (subjects[0] as any[])) {
    if (s.domain) {
      subjectDomains[s.id.toString()] = s.domain;
      console.log(`   📌 ${s.code} → ${s.domain}`);
    }
  }

  // ========================================
  // 4. Modifier le champ domain dans subject (string → record<domain>)
  // ========================================
  console.log("\n📝 Étape 4: Modification du type de subject.domain...");
  
  // D'abord, supprimer l'ancien champ
  await db.query("REMOVE FIELD domain ON TABLE subject");
  console.log("   ✅ Ancien champ domain (string) supprimé");
  
  // Créer le nouveau champ avec le type record<domain>
  await db.query(`
    DEFINE FIELD domain ON subject TYPE option<record<domain>> PERMISSIONS FULL;
    DEFINE INDEX idx_subject_domain ON subject FIELDS domain;
  `);
  console.log("   ✅ Nouveau champ domain (record<domain>) créé");

  // ========================================
  // 5. Migrer les données
  // ========================================
  console.log("\n🔄 Étape 5: Migration des données...");
  
  for (const [subjectId, domainCode] of Object.entries(subjectDomains)) {
    await db.query(`
      UPDATE $subjectId SET domain = type::thing("domain", $domainCode)
    `, { subjectId, domainCode });
    console.log(`   ✅ ${subjectId} → domain:${domainCode}`);
  }

  // ========================================
  // 6. Vérification finale
  // ========================================
  console.log("\n📊 Vérification finale:");
  
  // Structure domain
  console.log("\n   📋 Table domain:");
  const domainData = await db.query("SELECT id, name, icon, `order` FROM domain ORDER BY `order`");
  for (const d of (domainData[0] as any[])) {
    console.log(`      ${d.order}. ${d.icon} ${d.name} (${d.id})`);
  }

  // Structure subject mise à jour
  console.log("\n   📋 Subjects avec leur domain:");
  const subjectData = await db.query(`
    SELECT id, code, name, domain.name as domain_name, domain.order as domain_order 
    FROM subject 
    ORDER BY domain.order, name
  `);
  for (const s of (subjectData[0] as any[])) {
    console.log(`      [${s.domain_order || "?"}] ${s.code}: ${s.name} → ${s.domain_name || "Aucun"}`);
  }

  // Stats
  console.log("\n   📊 Statistiques:");
  const stats = await db.query(`
    SELECT domain.name as domain, count() as nb 
    FROM subject 
    WHERE domain != NONE 
    GROUP BY domain
    ORDER BY domain.order
  `);
  for (const s of (stats[0] as any[])) {
    console.log(`      - ${s.domain}: ${s.nb} matière(s)`);
  }

  await db.close();
  console.log("\n✅ Migration terminée !");
}

main().catch(console.error);
