import Surreal from 'surrealdb';

async function main() {
  const db = new Surreal();
  
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: 'kweez', database: 'dbkweez' });
  
  console.log('🗺️ Ajout de la question carte interactive...');
  
  // Récupérer le thème Géographie
  let themeResult = await db.query('SELECT id FROM theme WHERE name = "Géographie" LIMIT 1');
  let theme = (themeResult[0] as any[])?.[0];
  
  if (!theme) {
    console.log('❌ Thème "Géographie" non trouvé. Exécutez d\'abord create-espaces-contraintes-quiz.ts');
    process.exit(1);
  }
  
  const themeId = theme?.id?.toString()?.includes(':') ? theme.id.toString().split(':')[1] : theme?.id;
  console.log('✅ Thème trouvé:', theme?.id);
  
  // Créer la question carte
  // Les coordonnées sont en % du viewBox 1000x560
  const mapQuestion = {
    question: "Identifie les différentes zones géographiques sur la carte :",
    questionType: "map_labels",
    explanation: "Cette carte montre les principaux espaces à fortes contraintes : déserts chauds (jaune), déserts froids/zones polaires (violet), forêts denses (vert) et hautes montagnes (marron).",
    difficulty: "hard",
    pos: 10,
    zones: [
      // Déserts chauds
      {
        id: "sahara",
        label: "Sahara",
        type: "desert_chaud",
        x: 420,
        y: 200,
        hint: "Plus grand désert chaud du monde",
        path: "M360,170 L380,160 L420,155 L460,160 L500,170 L510,190 L500,220 L480,240 L440,250 L400,245 L370,230 L355,200 Z"
      },
      {
        id: "arabie",
        label: "Désert d'Arabie",
        type: "desert_chaud",
        x: 540,
        y: 200,
        hint: "Péninsule au Moyen-Orient",
        path: "M510,170 L540,165 L570,175 L580,200 L570,230 L545,245 L520,235 L505,210 L510,180 Z"
      },
      {
        id: "gobi",
        label: "Désert de Gobi",
        type: "desert_chaud",
        x: 720,
        y: 140,
        hint: "Grand désert asiatique entre Chine et Mongolie",
        path: "M680,120 L720,115 L760,125 L775,145 L765,165 L730,175 L690,170 L670,150 L675,130 Z"
      },
      {
        id: "kalahari",
        label: "Kalahari",
        type: "desert_chaud",
        x: 470,
        y: 380,
        hint: "Désert d'Afrique australe",
        path: "M450,350 L480,345 L510,355 L515,380 L505,405 L475,415 L450,400 L445,370 Z"
      },
      {
        id: "australien",
        label: "Désert Australien",
        type: "desert_chaud",
        x: 820,
        y: 420,
        hint: "Outback",
        path: "M780,390 L820,385 L860,395 L875,420 L865,450 L830,460 L790,450 L775,425 L780,400 Z"
      },
      // Déserts froids / zones polaires
      {
        id: "arctique_canadien",
        label: "Arctique Canadien",
        type: "desert_froid",
        x: 140,
        y: 50,
        hint: "Nord du Canada",
        path: "M80,30 L140,25 L200,35 L210,55 L195,75 L150,80 L100,70 L75,50 Z"
      },
      {
        id: "groenland",
        label: "Groenland",
        type: "desert_froid",
        x: 280,
        y: 50,
        hint: "Plus grande île du monde",
        path: "M250,30 L280,25 L310,35 L320,60 L305,85 L275,90 L250,75 L245,50 Z"
      },
      {
        id: "siberie",
        label: "Sibérie",
        type: "desert_froid",
        x: 680,
        y: 50,
        hint: "Région de Russie",
        path: "M580,25 L650,20 L750,30 L820,45 L810,70 L740,80 L640,75 L570,60 L575,40 Z"
      },
      // Forêts denses
      {
        id: "amazonie",
        label: "Forêt Amazonienne",
        type: "foret",
        x: 180,
        y: 340,
        hint: "Plus grande forêt tropicale",
        path: "M140,310 L180,305 L230,315 L250,340 L240,375 L200,390 L155,380 L130,350 L135,320 Z"
      },
      {
        id: "congo",
        label: "Forêt du Congo",
        type: "foret",
        x: 460,
        y: 300,
        hint: "Bassin du fleuve Congo en Afrique",
        path: "M435,275 L465,270 L500,280 L510,305 L500,330 L470,340 L440,330 L425,305 L430,280 Z"
      },
      {
        id: "indonesie",
        label: "Forêt Indonésienne",
        type: "foret",
        x: 770,
        y: 320,
        hint: "Archipel d'Asie du Sud-Est",
        path: "M740,300 L770,295 L810,305 L820,325 L810,345 L775,355 L745,345 L735,320 Z"
      },
      // Montagnes
      {
        id: "himalaya",
        label: "Himalaya",
        type: "montagne",
        x: 650,
        y: 170,
        hint: "Plus haute chaîne de montagnes du monde",
        path: "M610,155 L640,145 L680,150 L700,170 L690,190 L655,200 L620,195 L600,175 Z"
      },
      {
        id: "cordillere",
        label: "Cordillère des Andes",
        type: "montagne",
        x: 140,
        y: 400,
        hint: "Plus longue chaîne de montagnes du monde",
        path: "M120,320 L135,315 L150,340 L155,400 L150,460 L140,500 L125,490 L115,430 L110,360 Z"
      }
    ]
  };
  
  console.log('\n📝 Création de la question carte...');
  
  const createQuery = `
    CREATE question SET
      question = $question,
      questionType = $questionType,
      explanation = $explanation,
      difficulty = $difficulty,
      isActive = true,
      pos = $pos,
      theme_ids = [type::thing("theme", $themeId)],
      zones = $zones
  `;
  
  const result = await db.query(createQuery, {
    question: mapQuestion.question,
    questionType: mapQuestion.questionType,
    explanation: mapQuestion.explanation,
    difficulty: mapQuestion.difficulty,
    pos: mapQuestion.pos,
    themeId,
    zones: mapQuestion.zones
  });
  
  const created = (result[0] as any[])?.[0];
  console.log(`  ✅ [map_labels] Question créée -> ${created?.id}`);
  console.log(`     ${mapQuestion.zones.length} zones à identifier`);
  
  await db.close();
  console.log('\n🎉 Question carte ajoutée avec succès !');
  console.log('   Zones: Sahara, Arabie, Gobi, Kalahari, Australien, Arctique, Groenland, Sibérie, Amazonie, Congo, Indonésie, Himalaya, Andes');
}

main().catch(console.error);
