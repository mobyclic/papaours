import Surreal from 'surrealdb';

const db = new Surreal();

async function main() {
  await db.connect('wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc', {
    namespace: 'papaours',
    database: 'dbpapaours',
  });
  await db.signin({ username: 'rootuser', password: 'n1n@S1mone' });

  console.log('=== THEMES ===');
  const themes = await db.query('SELECT * FROM theme');
  console.log(JSON.stringify(themes[0], null, 2));

  console.log('\n=== MATIERES ===');
  const matieres = await db.query('SELECT * FROM matiere');
  console.log(JSON.stringify(matieres[0], null, 2));

  console.log('\n=== NIVEAUX ===');
  const niveaux = await db.query('SELECT * FROM niveau');
  console.log(JSON.stringify(niveaux[0], null, 2));

  console.log('\n=== CLASSES ===');
  const classes = await db.query('SELECT * FROM classe');
  console.log(JSON.stringify(classes[0], null, 2));

  console.log('\n=== QUIZ ===');
  const quiz = await db.query('SELECT id, title, theme, level FROM quiz');
  console.log(JSON.stringify(quiz[0], null, 2));

  console.log('\n=== SAMPLE QUESTION ===');
  const q = await db.query('SELECT * FROM question LIMIT 1');
  console.log(JSON.stringify(q[0], null, 2));

  await db.close();
}

main().catch(console.error);
