/**
 * Script de nettoyage - Supprimer la table matiere
 * 
 * Ce script:
 * 1. Supprime le champ matiere_id des questions qui ont déjà un subject
 * 2. Supprime le champ matiere_id des quiz qui ont déjà un subject
 * 3. Supprime tous les enregistrements de la table matiere
 * 4. Supprime la table matiere
 */

import Surreal from 'surrealdb';

async function cleanup() {
  const db = new Surreal();
  
  try {
    const url = process.env.SURREAL_URL || 'wss://kweez-drzq63tf02tq58uy.aws-euw1.surreal.cloud';
    console.log('🔌 Connexion à SurrealDB...');
    await db.connect(`${url}/rpc`);
    
    await db.signin({
      username: process.env.SURREAL_USER || 'root',
      password: process.env.SURREAL_PASS || 'root'
    });
    
    await db.use({ namespace: 'kweez', database: 'dbkweez' });
    console.log('✅ Connecté à SurrealDB');

    // 1. Vérifier combien de questions ont matiere_id
    const questionsWithMatiere = await db.query(`
      SELECT count() FROM question WHERE matiere_id != NONE GROUP ALL
    `);
    const qCount = (questionsWithMatiere[0] as any[])?.[0]?.count || 0;
    console.log(`📊 ${qCount} questions ont encore matiere_id`);

    // 2. Vérifier combien de quiz ont matiere_id
    const quizWithMatiere = await db.query(`
      SELECT count() FROM quiz WHERE matiere_id != NONE GROUP ALL
    `);
    const quizCount = (quizWithMatiere[0] as any[])?.[0]?.count || 0;
    console.log(`📊 ${quizCount} quiz ont encore matiere_id`);

    // 3. Supprimer matiere_id des questions qui ont un subject
    console.log('\n🔄 Suppression de matiere_id des questions avec subject...');
    const updateQuestions = await db.query(`
      UPDATE question SET matiere_id = NONE WHERE subject != NONE AND matiere_id != NONE
    `);
    console.log(`✅ Questions mises à jour`);

    // 4. Supprimer matiere_id des quiz qui ont un subject
    console.log('🔄 Suppression de matiere_id des quiz avec subject...');
    const updateQuiz = await db.query(`
      UPDATE quiz SET matiere_id = NONE WHERE subject != NONE AND matiere_id != NONE
    `);
    console.log(`✅ Quiz mis à jour`);

    // 5. Vérifier s'il reste des questions sans subject
    const questionsWithoutSubject = await db.query(`
      SELECT id, text, matiere_id FROM question WHERE subject = NONE LIMIT 10
    `);
    const orphans = (questionsWithoutSubject[0] as any[]) || [];
    if (orphans.length > 0) {
      console.log(`\n⚠️  ${orphans.length}+ questions sans subject (à migrer manuellement):`);
      orphans.forEach((q: any) => {
        console.log(`   - ${q.id}: ${q.text?.substring(0, 50)}... (matiere: ${q.matiere_id})`);
      });
      console.log('\n❌ Impossible de supprimer la table matiere tant que des questions en dépendent.');
      console.log('   Exécutez d\'abord: bun run scripts/migrate-matiere-to-subject.ts');
    } else {
      // 6. Supprimer tous les enregistrements de matiere
      console.log('\n🗑️  Suppression des enregistrements de la table matiere...');
      await db.query('DELETE FROM matiere');
      console.log('✅ Tous les enregistrements matiere supprimés');

      // 7. Supprimer la table matiere
      console.log('🗑️  Suppression de la table matiere...');
      await db.query('REMOVE TABLE matiere');
      console.log('✅ Table matiere supprimée');
    }

    // 8. Vérifier l'état final
    console.log('\n📊 État final:');
    const subjectCount = await db.query('SELECT count() FROM subject GROUP ALL');
    const questionCount = await db.query('SELECT count() FROM question WHERE subject != NONE GROUP ALL');
    const quizCountFinal = await db.query('SELECT count() FROM quiz WHERE subject != NONE GROUP ALL');
    
    console.log(`   - ${(subjectCount[0] as any[])?.[0]?.count || 0} subjects`);
    console.log(`   - ${(questionCount[0] as any[])?.[0]?.count || 0} questions avec subject`);
    console.log(`   - ${(quizCountFinal[0] as any[])?.[0]?.count || 0} quiz avec subject`);

    console.log('\n✅ Nettoyage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.close();
  }
}

cleanup().catch(console.error);
