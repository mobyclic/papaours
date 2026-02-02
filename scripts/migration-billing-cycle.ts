/**
 * Migration pour ajouter le champ subscription_billing_cycle aux utilisateurs
 * et mettre à jour les prix annuels dans subscription_plan
 */

import Surreal from "surrealdb";

const SURREAL_URL = process.env.SURREAL_URL || "https://kweez-db-cqdpui4smmbbs.aws-euw1.surreal.cloud";
const SURREAL_USER = process.env.SURREAL_USER || "rootuser";
const SURREAL_PASS = process.env.SURREAL_PASS || "n1n@S1mone";

async function migrate() {
  const db = new Surreal();

  try {
    console.log("🔌 Connexion à SurrealDB...");
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: "kweez", database: "dbkweez" });
    console.log("✅ Connecté à SurrealDB");

    // 1. Ajouter le champ subscription_billing_cycle à la table user
    console.log("\n📝 Ajout du champ subscription_billing_cycle à la table user...");
    try {
      await db.query(`
        DEFINE FIELD subscription_billing_cycle ON TABLE user TYPE option<string> 
        ASSERT $value == NONE OR $value IN ['monthly', 'yearly']
        DEFAULT 'monthly'
      `);
      console.log("✅ Champ subscription_billing_cycle ajouté");
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log("ℹ️ Champ subscription_billing_cycle existe déjà");
      } else {
        throw e;
      }
    }

    // 2. Mettre à jour les plans existants pour ajouter le prix annuel
    console.log("\n📝 Mise à jour des prix annuels dans subscription_plan...");
    
    const plans = [
      { code: 'free', price_yearly: 0 },
      { code: 'tutor', price_yearly: 50 },  // 5€/mois x 10 = 50€/an (2 mois gratuits)
      { code: 'tutor_vip', price_yearly: 0 },
      { code: 'establishment', price_yearly: 200 },  // 20€/mois x 10 = 200€/an (2 mois gratuits)
      { code: 'establishment_vip', price_yearly: 0 }
    ];

    for (const plan of plans) {
      try {
        await db.query(`
          UPDATE subscription_plan SET price_yearly = $priceYearly WHERE code = $code
        `, { code: plan.code, priceYearly: plan.price_yearly });
        console.log(`  ✅ ${plan.code}: ${plan.price_yearly}€/an`);
      } catch (e) {
        console.log(`  ⚠️ Erreur mise à jour ${plan.code}:`, e);
      }
    }

    // 3. Définir le champ price_yearly sur la table subscription_plan
    console.log("\n📝 Définition du champ price_yearly...");
    try {
      await db.query(`
        DEFINE FIELD price_yearly ON TABLE subscription_plan TYPE option<number> DEFAULT 0
      `);
      console.log("✅ Champ price_yearly défini");
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log("ℹ️ Champ price_yearly existe déjà");
      } else {
        throw e;
      }
    }

    // 4. Vérification
    console.log("\n📊 Vérification des plans...");
    const [plansResult] = await db.query(`SELECT code, name, price_monthly, price_yearly FROM subscription_plan`);
    console.log("Plans actuels:");
    console.table(plansResult);

    console.log("\n✅ Migration terminée avec succès!");

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
