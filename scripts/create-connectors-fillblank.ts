/**
 * Script pour créer 50 questions à trous sur les connecteurs (and, but, because)
 * Phrases très simples pour les 6ème
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || 'n1n@S1mone';

async function main() {
  const db = new Surreal();
  
  try {
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: 'kweez', database: 'dbkweez' });
    console.log('✅ Connecté à SurrealDB');

    // Trouver le thème "Les connecteurs"
    const themes = await db.query<any[][]>(`
      SELECT id, name FROM theme WHERE name CONTAINS 'connecteur'
    `);
    
    if (!themes[0] || themes[0].length === 0) {
      throw new Error('Thème "Les connecteurs" non trouvé');
    }
    
    const themeId = themes[0][0].id;
    console.log('📚 Thème trouvé:', themeId);

    // Questions avec AND (addition, liaison)
    const andQuestions = [
      { text: "Complete (and, but, because): I like cats {and} dogs.", answer: "and" },
      { text: "Complete (and, but, because): She has a pen {and} a book.", answer: "and" },
      { text: "Complete (and, but, because): Tom {and} Jerry are friends.", answer: "and" },
      { text: "Complete (and, but, because): I eat bread {and} butter.", answer: "and" },
      { text: "Complete (and, but, because): My mum {and} dad love me.", answer: "and" },
      { text: "Complete (and, but, because): I play football {and} tennis.", answer: "and" },
      { text: "Complete (and, but, because): She sings {and} dances.", answer: "and" },
      { text: "Complete (and, but, because): I have a sister {and} a brother.", answer: "and" },
      { text: "Complete (and, but, because): He reads {and} writes.", answer: "and" },
      { text: "Complete (and, but, because): We eat pizza {and} pasta.", answer: "and" },
      { text: "Complete (and, but, because): I like red {and} blue.", answer: "and" },
      { text: "Complete (and, but, because): She has long {and} black hair.", answer: "and" },
      { text: "Complete (and, but, because): He is tall {and} strong.", answer: "and" },
      { text: "Complete (and, but, because): I drink milk {and} juice.", answer: "and" },
      { text: "Complete (and, but, because): My dog is big {and} friendly.", answer: "and" },
      { text: "Complete (and, but, because): We go to school {and} learn.", answer: "and" },
      { text: "Complete (and, but, because): I can run {and} jump.", answer: "and" },
    ];

    // Questions avec BUT (opposition, contraste)
    const butQuestions = [
      { text: "Complete (and, but, because): I want to play {but} it's raining.", answer: "but" },
      { text: "Complete (and, but, because): She is tired {but} happy.", answer: "but" },
      { text: "Complete (and, but, because): I like pizza {but} not pasta.", answer: "but" },
      { text: "Complete (and, but, because): He is young {but} very tall.", answer: "but" },
      { text: "Complete (and, but, because): I'm hungry {but} I have no food.", answer: "but" },
      { text: "Complete (and, but, because): She runs fast {but} I run faster.", answer: "but" },
      { text: "Complete (and, but, because): I want ice cream {but} it's too cold.", answer: "but" },
      { text: "Complete (and, but, because): He can sing {but} he can't dance.", answer: "but" },
      { text: "Complete (and, but, because): It's sunny {but} cold outside.", answer: "but" },
      { text: "Complete (and, but, because): I like cats {but} I prefer dogs.", answer: "but" },
      { text: "Complete (and, but, because): She is nice {but} a bit shy.", answer: "but" },
      { text: "Complete (and, but, because): I have a bike {but} no car.", answer: "but" },
      { text: "Complete (and, but, because): He is smart {but} lazy.", answer: "but" },
      { text: "Complete (and, but, because): I want to help {but} I can't.", answer: "but" },
      { text: "Complete (and, but, because): She sings well {but} quietly.", answer: "but" },
      { text: "Complete (and, but, because): It's late {but} I'm not tired.", answer: "but" },
      { text: "Complete (and, but, because): I tried hard {but} I failed.", answer: "but" },
    ];

    // Questions avec BECAUSE (cause, raison)
    const becauseQuestions = [
      { text: "Complete (and, but, because): I'm happy {because} it's my birthday.", answer: "because" },
      { text: "Complete (and, but, because): She is tired {because} she worked a lot.", answer: "because" },
      { text: "Complete (and, but, because): I stay home {because} I'm sick.", answer: "because" },
      { text: "Complete (and, but, because): He is late {because} he missed the bus.", answer: "because" },
      { text: "Complete (and, but, because): I'm hungry {because} I didn't eat.", answer: "because" },
      { text: "Complete (and, but, because): She smiles {because} she is happy.", answer: "because" },
      { text: "Complete (and, but, because): I wear a coat {because} it's cold.", answer: "because" },
      { text: "Complete (and, but, because): He runs fast {because} he trains every day.", answer: "because" },
      { text: "Complete (and, but, because): I like her {because} she is kind.", answer: "because" },
      { text: "Complete (and, but, because): She cries {because} she is sad.", answer: "because" },
      { text: "Complete (and, but, because): I study hard {because} I want good grades.", answer: "because" },
      { text: "Complete (and, but, because): He eats a lot {because} he is hungry.", answer: "because" },
      { text: "Complete (and, but, because): I love summer {because} it's warm.", answer: "because" },
      { text: "Complete (and, but, because): She can't come {because} she is busy.", answer: "because" },
      { text: "Complete (and, but, because): I drink water {because} I'm thirsty.", answer: "because" },
      { text: "Complete (and, but, because): He sleeps a lot {because} he is tired.", answer: "because" },
    ];

    const allQuestions = [...andQuestions, ...butQuestions, ...becauseQuestions];
    
    console.log(`\n🎯 Création de ${allQuestions.length} questions à trous...`);
    
    let created = 0;
    for (const q of allQuestions) {
      try {
        await db.query(`
          CREATE question SET
            text = $text,
            type = 'fill_blank',
            textWithBlanks = $textWithBlanks,
            correctAnswer = $answer,
            correctAnswers = [$answer],
            explanation = $explanation,
            theme_ids = [$themeId],
            grade_difficulties = [{
              grade_id: type::thing('grade', 'FR_6e'),
              difficulty: 'medium',
              points: 10
            }],
            is_active = true,
            created_at = time::now(),
            updated_at = time::now()
        `, {
          text: q.text,
          textWithBlanks: q.text.replace('Complete (and, but, because): ', ''),
          answer: q.answer,
          explanation: `La bonne réponse est "${q.answer}". ${
            q.answer === 'and' ? '"And" relie deux éléments similaires ou ajoute une information.' :
            q.answer === 'but' ? '"But" exprime une opposition ou un contraste.' :
            '"Because" introduit une cause ou une raison.'
          }`,
          themeId
        });
        console.log('  ✅', q.text.substring(0, 60) + '...');
        created++;
      } catch (e: any) {
        console.log('  ❌', q.text.substring(0, 40) + '...', e.message);
      }
    }

    console.log(`\n🎉 ${created}/${allQuestions.length} questions créées !`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

main();
