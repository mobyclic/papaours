/**
 * Script pour mettre à jour toutes les questions avec :
 * - Une matière appropriée
 * - Des thèmes appropriés
 * - Classe 6ème + difficulté facile (1)
 */

import Surreal from "surrealdb";

const db = new Surreal();

// IDs connus
const CLASSE_6EME = "classe:dshov2xhwt040r1u3irj";

const MATIERES = {
  sciences: "matiere:m84fe7jbm6ijjxofjmtf",
  physiqueChimie: "matiere:kwjelyx82lnn60jgo5am",
  musique: "matiere:hlxzaet972q69ky7k9ut",
  histoire: "matiere:u8jbp4i76by5cqyqvnok",
};

const THEMES = {
  // Sciences / Physique-Chimie
  matiere: "theme:rubkejhj72hwzewe304i", // La matière
  environnement: "theme:1tk9d5sz8jw1i2u56dkt", // Environnement
  technologie: "theme:uuracqri96zkwa6ohq66", // Technologie
  // Musique
  instruments: "theme:lcxetf364kcha3qsyazi", // Instruments
  orchestre: "theme:4d9btyhtiw4hp8ghon6h", // Orchestre symphonique
  // Histoire
  antiquite: "theme:8ao80kcbys1dx15ncq5w", // Antiquité
};

// Classification des questions par mots-clés
function classifyQuestion(questionText: string): {
  matiere_id: string;
  theme_ids: string[];
} {
  const q = questionText.toLowerCase();

  // MUSIQUE - instruments, orchestre
  if (
    q.includes("instrument") ||
    q.includes("trompette") ||
    q.includes("violon") ||
    q.includes("flûte") ||
    q.includes("orchestre") ||
    q.includes("cuivre") ||
    q.includes("percussion") ||
    q.includes("archet") ||
    q.includes("musicien") ||
    q.includes("cordes") ||
    q.includes("bois") ||
    q.includes("pavillon") ||
    q.includes("piston") ||
    q.includes("anche") ||
    q.includes("coulisse")
  ) {
    const themes = [THEMES.instruments];
    if (q.includes("orchestre") || q.includes("section")) {
      themes.push(THEMES.orchestre);
    }
    return { matiere_id: MATIERES.musique, theme_ids: themes };
  }

  // HISTOIRE - Égypte, Grèce, Rome, Gaule, Antiquité
  if (
    q.includes("égypte") ||
    q.includes("pharaon") ||
    q.includes("pharaons") ||
    q.includes("égyptien") ||
    q.includes("gaulois") ||
    q.includes("gaule") ||
    q.includes("romain") ||
    q.includes("romains") ||
    q.includes("rome") ||
    q.includes("césar") ||
    q.includes("vercingétorix") ||
    q.includes("antiquité") ||
    q.includes("grèce") ||
    q.includes("grec") ||
    q.includes("zeus") ||
    q.includes("olymp") ||
    q.includes("athènes") ||
    q.includes("parthénon") ||
    q.includes("gladiateur") ||
    q.includes("aqueduc") ||
    q.includes("alésia") ||
    q.includes("pyramide") ||
    q.includes("hiéroglyphes") ||
    q.includes("nil") ||
    q.includes("phénicien") ||
    q.includes("alphabet") ||
    q.includes("empire") ||
    q.includes("arène") ||
    q.includes("amphithéâtre") ||
    q.includes("temple") ||
    q.includes("voies") ||
    q.includes("routes pavées") ||
    q.includes("oppidum") ||
    q.includes("siège")
  ) {
    return { matiere_id: MATIERES.histoire, theme_ids: [THEMES.antiquite] };
  }

  // SCIENCES / PHYSIQUE-CHIMIE - états de la matière, matériaux, recyclage, mesures
  // C'est le cas par défaut pour les questions restantes (matériaux, états de la matière, etc.)

  const themes: string[] = [];

  // Environnement / Recyclage
  if (
    q.includes("recyclable") ||
    q.includes("biodégradable") ||
    q.includes("tri des déchets") ||
    q.includes("poubelle") ||
    q.includes("déchet")
  ) {
    themes.push(THEMES.environnement);
  }

  // Matériaux / fabrication
  if (
    q.includes("matériau") ||
    q.includes("papier") ||
    q.includes("verre") ||
    q.includes("plastique") ||
    q.includes("pétrole") ||
    q.includes("métallique") ||
    q.includes("fer") ||
    q.includes("conducteur")
  ) {
    themes.push(THEMES.technologie);
  }

  // États de la matière / mesures
  if (
    q.includes("solide") ||
    q.includes("liquide") ||
    q.includes("gazeux") ||
    q.includes("gaz") ||
    q.includes("fusion") ||
    q.includes("ébullition") ||
    q.includes("évaporation") ||
    q.includes("condensation") ||
    q.includes("solidification") ||
    q.includes("masse") ||
    q.includes("volume") ||
    q.includes("bécher") ||
    q.includes("erlenmeyer") ||
    q.includes("filtrer") ||
    q.includes("température") ||
    q.includes("chauffe") ||
    q.includes("glace") ||
    q.includes("états de la matière") ||
    q.includes("état") ||
    q.includes("passage")
  ) {
    themes.push(THEMES.matiere);
  }

  // Sécurité / expérience
  if (q.includes("sécurité") || q.includes("expérience")) {
    if (!themes.includes(THEMES.matiere)) {
      themes.push(THEMES.matiere);
    }
  }

  // Si aucun thème trouvé, mettre "La matière" par défaut
  if (themes.length === 0) {
    themes.push(THEMES.matiere);
  }

  // Utiliser Sciences ou Physique/Chimie selon le contenu
  const matiere =
    q.includes("masse") ||
    q.includes("volume") ||
    q.includes("température") ||
    q.includes("état") ||
    q.includes("fusion") ||
    q.includes("bécher") ||
    q.includes("erlenmeyer") ||
    q.includes("gaz")
      ? MATIERES.physiqueChimie
      : MATIERES.sciences;

  return { matiere_id: matiere, theme_ids: [...new Set(themes)] };
}

async function main() {
  try {
    console.log("Connexion à la base de données...");
    await db.connect(process.env.SURREAL_URL + "/rpc");
    await db.signin({
      username: process.env.SURREAL_USER!,
      password: process.env.SURREAL_PASS!,
    });
    await db.use({ namespace: "papaours", database: "dbpapaours" });

    // Récupérer toutes les questions
    const result = await db.query<
      Array<{ id: { toString(): string }; question: string }>[]
    >("SELECT id, question FROM question");
    const questions = result[0] || [];

    console.log(`\n${questions.length} questions à traiter...\n`);

    let musique = 0,
      histoire = 0,
      sciences = 0,
      physiqueChimie = 0;
    let updated = 0,
      errors = 0;

    for (const q of questions) {
      const classification = classifyQuestion(q.question);

      // Compter par catégorie
      if (classification.matiere_id === MATIERES.musique) musique++;
      else if (classification.matiere_id === MATIERES.histoire) histoire++;
      else if (classification.matiere_id === MATIERES.physiqueChimie)
        physiqueChimie++;
      else sciences++;

      try {
        // Utiliser les RecordId directement dans l'array avec la syntaxe SurrealQL
        const themeRefs = classification.theme_ids.join(", ");

        await db.query(`
          UPDATE ${q.id.toString()}
          SET 
            matiere_id = ${classification.matiere_id},
            theme_ids = [${themeRefs}],
            class_difficulties = [{
              classe_id: ${CLASSE_6EME},
              difficulty: 1,
              points: 10
            }]
        `);

        updated++;
        process.stdout.write(`\r✅ ${updated}/${questions.length} questions mises à jour`);
      } catch (err) {
        errors++;
        console.error(`\n❌ Erreur pour ${q.id}: ${err}`);
      }
    }

    console.log("\n\n=== RÉSUMÉ ===");
    console.log(`✅ ${updated} questions mises à jour`);
    console.log(`❌ ${errors} erreurs`);
    console.log("\n📊 Répartition par matière:");
    console.log(`  - Musique: ${musique}`);
    console.log(`  - Histoire: ${histoire}`);
    console.log(`  - Sciences: ${sciences}`);
    console.log(`  - Physique/Chimie: ${physiqueChimie}`);

    // Vérification
    console.log("\n🔍 Vérification d'une question...");
    const check = await db.query(
      "SELECT id, question, matiere_id, theme_ids, class_difficulties FROM question LIMIT 1"
    );
    console.log(JSON.stringify(check[0], null, 2));
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
