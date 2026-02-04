import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://kweez-db-yabfmebc.aws-euw1.surreal.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'rootuser';
const SURREAL_PASS = process.env.SURREAL_PASS || '';

async function main() {
  const db = new Surreal();
  await db.connect(`${SURREAL_URL}/rpc`);
  await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
  await db.use({ namespace: 'kweez', database: 'maindb' });

  const info = await db.query('INFO FOR DB');
  console.log('📊 Tables et Relations:');
  console.log('=======================');
  const tables = Object.keys(info[0]?.tables || {});
  console.log(`\nTables (${tables.length}):`);
  tables.sort().forEach(t => console.log(`  • ${t}`));

  const relations = tables.filter(t => ['completes', 'masters', 'studies', 'earns', 'tutors', 'covers'].includes(t));
  console.log(`\n✨ Relations Graph: ${relations.length > 0 ? relations.join(', ') : 'aucune'}`);

  // Check question schema
  const questionInfo = await db.query('INFO FOR TABLE question');
  console.log('\n📋 Schéma question:');
  const fields = Object.keys(questionInfo[0]?.fields || {});
  console.log(`   ${fields.length} champs définis`);
  
  await db.close();
}

main().catch(console.error);
