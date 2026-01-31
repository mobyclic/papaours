import Surreal from 'surrealdb';

async function main() {
  const db = new Surreal();
  
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });
  
  console.log('🔧 Ajout du support QCM Image...');
  
  // 1. Ajouter le champ questionType à la table question (pour différencier qcm, qcm_image, etc.)
  console.log('📝 Ajout du champ questionType...');
  await db.query(`
    DEFINE FIELD questionType ON question TYPE string DEFAULT 'qcm';
  `);
  
  // 2. Ajouter le champ optionImages pour stocker les URLs des images des options
  console.log('📝 Ajout du champ optionImages...');
  await db.query(`
    DEFINE FIELD optionImages ON question TYPE option<array<string>>;
  `);
  
  // 3. Mettre à jour toutes les questions existantes avec questionType = 'qcm' si pas défini
  console.log('📝 Mise à jour des questions existantes...');
  const result = await db.query(`
    UPDATE question SET questionType = 'qcm' WHERE questionType = NONE
  `);
  console.log('Questions mises à jour:', (result[0] as any[])?.length || 0);
  
  // 4. Vérifier le schéma
  const info = await db.query('INFO FOR TABLE question');
  console.log('\n📋 Schéma de la table question:');
  console.log(JSON.stringify(info[0], null, 2));
  
  await db.close();
  console.log('\n✅ Migration terminée !');
}

main().catch(console.error);
