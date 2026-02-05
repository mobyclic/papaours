/**
 * Création de 50 questions à trous pour le présent simple en anglais
 * Variété de verbes, sujets et contextes
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://kweez-db-kweez.aws-eu1.surrealdb.cloud';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || 'root';
const SURREAL_NS = process.env.SURREAL_NS || 'kweez';
const SURREAL_DB = process.env.SURREAL_DB || 'dbkweez';

async function main() {
  const db = new Surreal();
  
  try {
    await db.connect(`${SURREAL_URL}/rpc`);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    
    console.log('✅ Connecté à SurrealDB\n');
    
    // Récupérer la matière anglais
    const [subjectResult] = await db.query<any[]>(`
      SELECT id FROM subject WHERE code = 'anglais' LIMIT 1
    `);
    const subjectId = subjectResult?.[0]?.id;
    
    // Récupérer le thème présent simple
    const [themeResult] = await db.query<any[]>(`
      SELECT id FROM theme WHERE slug = 'present-simple' LIMIT 1
    `);
    const themeId = themeResult?.[0]?.id?.toString();
    const cleanThemeId = themeId?.includes(':') ? themeId.split(':')[1] : themeId;
    
    if (!themeId) {
      console.error('❌ Thème "present-simple" non trouvé');
      return;
    }
    
    console.log(`📚 Thème trouvé: ${themeId}\n`);
    
    // 50 questions variées sur le présent simple
    const questions = [
      // Verbe TO BE
      { text: "I {am} a student.", answer: "am", hint: "be", explanation: "Avec 'I', on utilise 'am' (I am = je suis)." },
      { text: "She {is} very happy today.", answer: "is", hint: "be", explanation: "Avec 'she', on utilise 'is' (she is = elle est)." },
      { text: "They {are} my best friends.", answer: "are", hint: "be", explanation: "Avec 'they', on utilise 'are' (they are = ils sont)." },
      { text: "My cat {is} black and white.", answer: "is", hint: "be", explanation: "My cat = it, donc 'is'." },
      { text: "We {are} in the classroom.", answer: "are", hint: "be", explanation: "Avec 'we', on utilise 'are'." },
      
      // Verbe TO HAVE
      { text: "He {has} a big dog.", answer: "has", hint: "have", explanation: "Avec 'he', 'have' devient 'has'." },
      { text: "I {have} two sisters.", answer: "have", hint: "have", explanation: "Avec 'I', on garde 'have'." },
      { text: "She {has} blue eyes.", answer: "has", hint: "have", explanation: "Avec 'she', 'have' devient 'has'." },
      { text: "They {have} a new car.", answer: "have", hint: "have", explanation: "Avec 'they', on garde 'have'." },
      { text: "My father {has} a beard.", answer: "has", hint: "have", explanation: "My father = he, donc 'has'." },
      
      // Verbes réguliers - 3ème personne (ajout de -s)
      { text: "She {plays} tennis every Saturday.", answer: "plays", hint: "play", explanation: "Avec 'she', on ajoute -s : plays." },
      { text: "He {works} in a hospital.", answer: "works", hint: "work", explanation: "Avec 'he', on ajoute -s : works." },
      { text: "My mother {cooks} dinner every evening.", answer: "cooks", hint: "cook", explanation: "My mother = she, donc on ajoute -s." },
      { text: "The dog {barks} at strangers.", answer: "barks", hint: "bark", explanation: "The dog = it, donc on ajoute -s." },
      { text: "Tom {reads} books every night.", answer: "reads", hint: "read", explanation: "Tom = he, donc on ajoute -s." },
      
      // Verbes réguliers - autres personnes (pas de -s)
      { text: "I {play} football with my friends.", answer: "play", hint: "play", explanation: "Avec 'I', pas de -s : I play." },
      { text: "We {eat} breakfast at 7 am.", answer: "eat", hint: "eat", explanation: "Avec 'we', pas de -s : we eat." },
      { text: "You {speak} English very well.", answer: "speak", hint: "speak", explanation: "Avec 'you', pas de -s : you speak." },
      { text: "They {live} in London.", answer: "live", hint: "live", explanation: "Avec 'they', pas de -s : they live." },
      { text: "My parents {work} in an office.", answer: "work", hint: "work", explanation: "My parents = they, donc pas de -s." },
      
      // Verbes en -es (ch, sh, s, x, o)
      { text: "She {watches} TV every evening.", answer: "watches", hint: "watch", explanation: "Les verbes en -ch prennent -es : watches." },
      { text: "He {goes} to school by bus.", answer: "goes", hint: "go", explanation: "Les verbes en -o prennent -es : goes." },
      { text: "My sister {washes} the dishes.", answer: "washes", hint: "wash", explanation: "Les verbes en -sh prennent -es : washes." },
      { text: "The teacher {teaches} maths.", answer: "teaches", hint: "teach", explanation: "Les verbes en -ch prennent -es : teaches." },
      { text: "She {does} her homework every day.", answer: "does", hint: "do", explanation: "'Do' devient 'does' avec he/she/it." },
      
      // Verbes en -ies (consonne + y)
      { text: "He {studies} English at school.", answer: "studies", hint: "study", explanation: "Consonne + y → -ies : studies." },
      { text: "She {tries} to be nice.", answer: "tries", hint: "try", explanation: "Consonne + y → -ies : tries." },
      { text: "The baby {cries} a lot.", answer: "cries", hint: "cry", explanation: "Consonne + y → -ies : cries." },
      { text: "My brother {carries} his bag.", answer: "carries", hint: "carry", explanation: "Consonne + y → -ies : carries." },
      { text: "She {worries} about exams.", answer: "worries", hint: "worry", explanation: "Consonne + y → -ies : worries." },
      
      // Verbes en -ays, -eys, -oys (voyelle + y → juste -s)
      { text: "He {plays} video games.", answer: "plays", hint: "play", explanation: "Voyelle + y → juste -s : plays." },
      { text: "She {enjoys} reading books.", answer: "enjoys", hint: "enjoy", explanation: "Voyelle + y → juste -s : enjoys." },
      { text: "My cat {stays} at home.", answer: "stays", hint: "stay", explanation: "Voyelle + y → juste -s : stays." },
      
      // Actions quotidiennes variées
      { text: "I {wake} up at 7 o'clock.", answer: "wake", hint: "wake", explanation: "Avec 'I', le verbe reste à la base : wake." },
      { text: "She {gets} up early every morning.", answer: "gets", hint: "get", explanation: "Avec 'she', on ajoute -s : gets." },
      { text: "We {brush} our teeth twice a day.", answer: "brush", hint: "brush", explanation: "Avec 'we', pas de -s : brush." },
      { text: "He {takes} a shower every morning.", answer: "takes", hint: "take", explanation: "Avec 'he', on ajoute -s : takes." },
      { text: "My sister {drinks} coffee for breakfast.", answer: "drinks", hint: "drink", explanation: "My sister = she, donc drinks." },
      
      // Sujets variés
      { text: "The sun {rises} in the east.", answer: "rises", hint: "rise", explanation: "The sun = it, donc on ajoute -s." },
      { text: "Water {boils} at 100 degrees.", answer: "boils", hint: "boil", explanation: "Water = it, donc on ajoute -s." },
      { text: "Birds {fly} in the sky.", answer: "fly", hint: "fly", explanation: "Birds = they, donc pas de modification." },
      { text: "The Earth {rotates} around the Sun.", answer: "rotates", hint: "rotate", explanation: "The Earth = it, donc on ajoute -s." },
      { text: "Fish {swim} in the ocean.", answer: "swim", hint: "swim", explanation: "Fish (pluriel) = they, donc pas de -s." },
      
      // Contextes scolaires
      { text: "The lesson {starts} at 9 am.", answer: "starts", hint: "start", explanation: "The lesson = it, donc starts." },
      { text: "Students {learn} new things every day.", answer: "learn", hint: "learn", explanation: "Students = they, donc pas de -s." },
      { text: "The teacher {explains} the rules.", answer: "explains", hint: "explain", explanation: "The teacher = he/she, donc -s." },
      { text: "We {write} in our notebooks.", answer: "write", hint: "write", explanation: "Avec 'we', pas de -s." },
      { text: "She {answers} all the questions.", answer: "answers", hint: "answer", explanation: "Avec 'she', on ajoute -s." },
      
      // Loisirs et hobbies
      { text: "I {love} chocolate ice cream.", answer: "love", hint: "love", explanation: "Avec 'I', pas de modification." },
      { text: "He {listens} to music every day.", answer: "listens", hint: "listen", explanation: "Avec 'he', on ajoute -s." },
      { text: "They {dance} at parties.", answer: "dance", hint: "dance", explanation: "Avec 'they', pas de -s." },
      { text: "My friend {sings} very well.", answer: "sings", hint: "sing", explanation: "My friend = he/she, donc sings." },
      { text: "We {meet} every weekend.", answer: "meet", hint: "meet", explanation: "Avec 'we', pas de -s." },
    ];
    
    console.log('🎯 Création de 50 questions à trous...\n');
    
    let created = 0;
    
    for (const q of questions) {
      try {
        // Le textWithBlanks contient déjà la réponse entre accolades
        await db.query(`
          CREATE question SET
            subject = $subject,
            question = $questionDisplay,
            textWithBlanks = $textWithBlanks,
            questionType = 'fill_blank',
            correctAnswers = $correctAnswers,
            explanation = $explanation,
            grade_difficulties = [{ grade_id: 'grade:FR_6e', difficulty: 2, points: 10 }],
            theme_ids = [type::thing('theme', $cleanThemeId)],
            isActive = true,
            is_public = true,
            createdAt = time::now(),
            updatedAt = time::now()
        `, {
          subject: subjectId,
          // Pour l'affichage du titre, on remplace {réponse} par ___ (hint)
          questionDisplay: q.text.replace(/\{[^}]+\}/, `___ (${q.hint})`),
          textWithBlanks: q.text,
          correctAnswers: [q.answer],
          explanation: q.explanation,
          cleanThemeId
        });
        
        created++;
        console.log(`✅ ${q.text.substring(0, 40)}...`);
      } catch (err) {
        console.error(`❌ Erreur: ${q.text.substring(0, 30)}...`, err);
      }
    }
    
    console.log(`\n🎉 ${created}/50 questions créées !`);
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.close();
  }
}

main();
