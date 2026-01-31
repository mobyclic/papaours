import Surreal from 'surrealdb';

async function main() {
  const db = new Surreal();
  
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });
  
  console.log('🖼️ Création d\'une question QCM Image de test...');
  
  // Récupérer un thème existant (Sciences par exemple)
  const themesResult = await db.query('SELECT id, name FROM theme WHERE name CONTAINS "vie" OR name CONTAINS "Science" LIMIT 1');
  const theme = (themesResult[0] as any[])?.[0];
  
  if (!theme) {
    console.log('❌ Aucun thème trouvé, utilisation d\'un thème par défaut');
  }
  
  // Récupérer une matière
  const matieresResult = await db.query('SELECT id, name FROM matiere WHERE name CONTAINS "Science" LIMIT 1');
  const matiere = (matieresResult[0] as any[])?.[0];
  
  // Récupérer une classe
  const classesResult = await db.query('SELECT id, name FROM classe LIMIT 1');
  const classe = (classesResult[0] as any[])?.[0];
  
  console.log('Thème:', theme?.name || 'aucun');
  console.log('Matière:', matiere?.name || 'aucune');
  console.log('Classe:', classe?.name || 'aucune');
  
  // Images d'exemple (des animaux pour un quiz "Quel est cet animal ?")
  const question = {
    question: "Quel est cet animal ?",
    questionType: "qcm_image",
    options: ["Un lion", "Un tigre", "Un léopard", "Un guépard"],
    optionImages: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/1200px-Lion_waiting_in_Namibia.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Walking_tiger_female.jpg/1200px-Walking_tiger_female.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/African_leopard_male_%28cropped%29.jpg/1200px-African_leopard_male_%28cropped%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Gepard_steht.jpg/1200px-Gepard_steht.jpg"
    ],
    correctAnswer: 0, // Le lion
    explanation: "Le lion est reconnaissable à sa crinière majestueuse chez le mâle. Il est le seul félin à vivre en groupe (appelé une troupe). Son rugissement peut être entendu jusqu'à 8 km !",
    difficulty: "easy",
    isActive: true,
    pos: 0
  };
  
  // Créer la question avec SQL pour bien gérer les RecordId
  const themeId = theme?.id?.toString()?.split(':')[1] || theme?.id;
  const matiereId = matiere?.id?.toString()?.split(':')[1] || matiere?.id;
  const classeId = classe?.id?.toString()?.split(':')[1] || classe?.id;
  
  const optionsJson = JSON.stringify(question.options);
  const optionImagesJson = JSON.stringify(question.optionImages);
  
  let createQuery = `
    CREATE question SET
      question = $question,
      questionType = $questionType,
      options = ${optionsJson},
      optionImages = ${optionImagesJson},
      correctAnswer = $correctAnswer,
      explanation = $explanation,
      difficulty = $difficulty,
      isActive = $isActive,
      pos = $pos
  `;
  
  // Ajouter les références si disponibles
  if (matiereId) {
    createQuery += `, matiere_id = type::thing("matiere", "${matiereId}")`;
  }
  if (themeId) {
    createQuery += `, theme_ids = [type::thing("theme", "${themeId}")]`;
  }
  if (classeId) {
    createQuery += `, class_difficulties = [{ classe_id: type::thing("classe", "${classeId}"), difficulty: "easy", points: 10 }]`;
  }
  
  const result = await db.query(createQuery, {
    question: question.question,
    questionType: question.questionType,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    difficulty: question.difficulty,
    isActive: question.isActive,
    pos: question.pos
  });
  
  const created = (result[0] as any[])?.[0];
  console.log('\n✅ Question QCM Image créée:', created?.id || created);
  console.log('Question:', question.question);
  console.log('Type:', question.questionType);
  console.log('Options (images):', question.optionImages.length, 'images');
  console.log('Bonne réponse:', question.options[question.correctAnswer]);
  
  await db.close();
  console.log('\n🎉 Terminé ! Testez dans le quiz admin.');
}

main().catch(console.error);
