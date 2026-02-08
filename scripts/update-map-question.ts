import Surreal from 'surrealdb';

/**
 * Script pour mettre à jour une question carte interactive avec le nouveau format
 * 
 * Format attendu du SVG:
 * - Le SVG doit contenir des éléments avec id="rep_0", "rep_1", etc.
 * - Ces éléments peuvent être: path, rect, circle, polygon, ellipse ou g
 * - Les zones seront automatiquement rendues cliquables
 */

async function main() {
  const db = new Surreal();
  
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({
    username: process.env.SURREAL_USER!,
    password: process.env.SURREAL_PASS!,
  });
  await db.use({ namespace: 'kweez', database: 'dbkweez' });
  
  console.log('🗺️ Mise à jour de la question carte avec le nouveau format...');
  
  // SVG exemple simple pour test (à remplacer par le vrai SVG)
  const svgContent = `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond de carte simplifié -->
  <rect width="800" height="500" fill="#87CEEB"/>
  
  <!-- Continents simplifiés -->
  <path d="M50,100 L200,80 L250,150 L200,250 L100,280 L30,200 Z" fill="#c5c5c5" stroke="#888"/>
  <path d="M100,300 L180,280 L220,350 L180,450 L100,440 L70,380 Z" fill="#c5c5c5" stroke="#888"/>
  <path d="M280,50 L500,40 L600,100 L650,250 L600,350 L500,400 L350,380 L280,300 L260,200 L280,100 Z" fill="#c5c5c5" stroke="#888"/>
  <path d="M620,300 L720,280 L780,350 L750,420 L680,440 L620,380 Z" fill="#c5c5c5" stroke="#888"/>
  
  <!-- Zones à identifier (id="rep_X") -->
  <!-- Sahara -->
  <ellipse id="rep_0" cx="380" cy="180" rx="60" ry="40" fill="#fbbf24" fill-opacity="0.3" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5,3"/>
  
  <!-- Amazonie -->
  <ellipse id="rep_1" cx="150" cy="340" rx="45" ry="50" fill="#22c55e" fill-opacity="0.3" stroke="#22c55e" stroke-width="2" stroke-dasharray="5,3"/>
  
  <!-- Himalaya -->
  <path id="rep_2" d="M520,120 L580,110 L600,140 L570,170 L520,165 L500,140 Z" fill="#92400e" fill-opacity="0.3" stroke="#92400e" stroke-width="2" stroke-dasharray="5,3"/>
  
  <!-- Sibérie (zone polaire) -->
  <ellipse id="rep_3" cx="500" cy="60" rx="80" ry="30" fill="#9333ea" fill-opacity="0.3" stroke="#9333ea" stroke-width="2" stroke-dasharray="5,3"/>
  
  <!-- Désert australien -->
  <ellipse id="rep_4" cx="680" cy="360" rx="50" ry="40" fill="#fbbf24" fill-opacity="0.3" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5,3"/>
  
  <!-- Légende -->
  <rect x="20" y="420" width="180" height="70" rx="5" fill="rgba(0,0,0,0.7)"/>
  <text x="30" y="440" fill="white" font-size="10" font-weight="bold">Légende :</text>
  <rect x="30" y="450" width="12" height="8" fill="#fbbf24" fill-opacity="0.5"/>
  <text x="48" y="457" fill="white" font-size="9">Désert chaud</text>
  <rect x="110" y="450" width="12" height="8" fill="#9333ea" fill-opacity="0.5"/>
  <text x="128" y="457" fill="white" font-size="9">Zone polaire</text>
  <rect x="30" y="465" width="12" height="8" fill="#22c55e" fill-opacity="0.5"/>
  <text x="48" y="472" fill="white" font-size="9">Forêt dense</text>
  <rect x="110" y="465" width="12" height="8" fill="#92400e" fill-opacity="0.5"/>
  <text x="128" y="472" fill="white" font-size="9">Montagne</text>
</svg>`;
  
  // Réponses attendues
  const expectedAnswers = [
    { index: 0, label: "Sahara", hint: "Plus grand désert chaud du monde, en Afrique du Nord" },
    { index: 1, label: "Forêt Amazonienne", hint: "Plus grande forêt tropicale, en Amérique du Sud" },
    { index: 2, label: "Himalaya", hint: "Plus haute chaîne de montagnes du monde, en Asie" },
    { index: 3, label: "Sibérie", hint: "Vaste région froide du nord de la Russie" },
    { index: 4, label: "Désert Australien", hint: "Grand désert au centre de l'Australie (l'Outback)" }
  ];
  
  // Chercher la question existante ou en créer une nouvelle
  const existingResult = await db.query(`
    SELECT * FROM question WHERE questionType = "map_labels" LIMIT 1
  `);
  
  const existing = (existingResult[0] as any[])?.[0];
  
  if (existing) {
    console.log('📝 Mise à jour de la question existante:', existing.id);
    
    await db.query(`
      UPDATE $id SET
        svgContent = $svgContent,
        expectedAnswers = $expectedAnswers,
        question = $question,
        explanation = $explanation
    `, {
      id: existing.id,
      svgContent,
      expectedAnswers,
      question: "Identifie les différentes zones géographiques sur la carte :",
      explanation: "Cette carte montre les principaux espaces à fortes contraintes : le Sahara (désert chaud), la forêt Amazonienne (forêt dense), l'Himalaya (haute montagne), la Sibérie (zone polaire) et le désert Australien."
    });
    
    console.log('✅ Question mise à jour !');
  } else {
    console.log('📝 Création d\'une nouvelle question carte...');
    
    // Récupérer le thème Géographie
    const themeResult = await db.query('SELECT id FROM theme WHERE name = "Géographie" LIMIT 1');
    const theme = (themeResult[0] as any[])?.[0];
    const themeId = theme?.id?.toString()?.includes(':') ? theme.id.toString().split(':')[1] : theme?.id;
    
    const createQuery = themeId ? `
      CREATE question SET
        question = $question,
        questionType = "map_labels",
        explanation = $explanation,
        difficulty = "medium",
        isActive = true,
        svgContent = $svgContent,
        expectedAnswers = $expectedAnswers,
        theme_ids = [type::thing("theme", $themeId)]
    ` : `
      CREATE question SET
        question = $question,
        questionType = "map_labels",
        explanation = $explanation,
        difficulty = "medium",
        isActive = true,
        svgContent = $svgContent,
        expectedAnswers = $expectedAnswers
    `;
    
    const result = await db.query(createQuery, {
      question: "Identifie les différentes zones géographiques sur la carte :",
      explanation: "Cette carte montre les principaux espaces à fortes contraintes : le Sahara (désert chaud), la forêt Amazonienne (forêt dense), l'Himalaya (haute montagne), la Sibérie (zone polaire) et le désert Australien.",
      svgContent,
      expectedAnswers,
      themeId
    });
    
    const created = (result[0] as any[])?.[0];
    console.log('✅ Question créée:', created?.id);
  }
  
  await db.close();
  console.log('\n🎉 Terminé !');
  console.log('   5 zones à identifier : Sahara, Amazonie, Himalaya, Sibérie, Désert Australien');
}

main().catch(console.error);
