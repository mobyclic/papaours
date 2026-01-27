import Surreal from 'surrealdb';

async function migrate() {
  const db = new Surreal();
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({ username: process.env.SURREAL_USER!, password: process.env.SURREAL_PASS! });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });

  // Récupérer toutes les classes pour créer un mapping nom -> id
  const classesResult = await db.query<any[]>('SELECT id, name FROM classe');
  const classesMap = new Map<string, string>();
  for (const c of (classesResult[0] as any[])) {
    classesMap.set(c.name, c.id.toString());
  }
  console.log('Mapping créé:', classesMap.size, 'classes');

  // Récupérer tous les utilisateurs avec une classe en dur
  const users = await db.query<any[]>('SELECT id, classe, classe_id FROM user WHERE classe != NONE');

  let updated = 0;
  for (const user of (users[0] as any[])) {
    const classeName = user.classe;
    const classeId = classesMap.get(classeName);
    
    if (classeId && !user.classe_id) {
      const cleanClasseId = classeId.split(':')[1];
      const cleanUserId = user.id.toString().split(':')[1];
      
      await db.query(
        `UPDATE type::thing("user", $userId) SET classe_id = type::thing("classe", $classeId)`,
        { userId: cleanUserId, classeId: cleanClasseId }
      );
      console.log('✅ Updated', user.id.toString(), ':', classeName, '->', classeId);
      updated++;
    } else if (!classeId) {
      console.log('⚠️ Classe non trouvée pour:', user.id.toString(), '-', classeName);
    } else {
      console.log('⏭️ Déjà à jour:', user.id.toString());
    }
  }

  console.log('\n🎉 Migration terminée:', updated, 'utilisateurs mis à jour');

  // Vérifier
  const check = await db.query<any[]>('SELECT id, name, classe, classe_id, classe_id.name as classe_name FROM user');
  console.log('\n=== Vérification ===');
  for (const u of (check[0] as any[])) {
    console.log('-', u.name, ':', u.classe, '->', u.classe_id?.toString(), '(', u.classe_name, ')');
  }

  await db.close();
}

migrate().catch(console.error);
