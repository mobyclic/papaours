/**
 * Création de 4 quiz d'anglais pour la 6ème :
 * - Les déterminants possessifs (my, your, his, her, its, our, their)
 * - Le génitif ('s)
 * - Le présent simple
 * - Les connecteurs (and, but, because)
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
    const subject = subjectResult?.[0];
    
    if (!subject) {
      console.error('❌ Matière "anglais" non trouvée');
      return;
    }
    
    const subjectId = subject.id;
    console.log(`📚 Matière trouvée: ${subjectId}\n`);
    
    // Récupérer le grade 6ème
    const [gradeResult] = await db.query<any[]>(`
      SELECT id FROM grade WHERE code = 'FR_6e' OR name CONTAINS '6' LIMIT 1
    `);
    const grade = gradeResult?.[0];
    const gradeId = grade?.id?.toString() || 'grade:FR_6e';
    console.log(`🎓 Grade: ${gradeId}\n`);
    
    // Créer ou récupérer les thèmes
    const themes = [
      { name: 'Les déterminants possessifs', slug: 'determinants-possessifs' },
      { name: 'Le génitif', slug: 'genitif' },
      { name: 'Le présent simple', slug: 'present-simple' },
      { name: 'Les connecteurs', slug: 'connecteurs' }
    ];
    
    const themeIds: Record<string, string> = {};
    
    for (const theme of themes) {
      // Vérifier si le thème existe
      const [existing] = await db.query<any[]>(`
        SELECT id FROM theme WHERE slug = $slug AND subject = $subject
      `, { slug: theme.slug, subject: subjectId });
      
      if (existing?.[0]) {
        themeIds[theme.slug] = existing[0].id.toString();
        console.log(`📁 Thème existant: ${theme.name}`);
      } else {
        // Créer le thème
        const [created] = await db.query<any[]>(`
          CREATE theme SET
            name = $name,
            slug = $slug,
            subject = $subject,
            description = $description,
            is_active = true,
            createdAt = time::now(),
            updatedAt = time::now()
        `, { 
          name: theme.name, 
          slug: theme.slug, 
          subject: subjectId,
          description: `Quiz sur ${theme.name.toLowerCase()} en anglais`
        });
        themeIds[theme.slug] = created[0].id.toString();
        console.log(`✅ Thème créé: ${theme.name}`);
      }
    }
    
    console.log('\n🎯 Création des questions...\n');
    
    // ========================================
    // 1. DÉTERMINANTS POSSESSIFS (30 questions)
    // ========================================
    const possessiveQuestions = [
      // QCM (15 questions)
      { type: 'qcm', question: "Complete: ___ name is John.", options: ['My', 'I', 'Me', 'Mine'], correct: 0, explanation: "'My' est le déterminant possessif pour 'je'. On dit 'My name is...' pour présenter son prénom." },
      { type: 'qcm', question: "Complete: Is this ___ book?", options: ['you', 'your', 'yours', 'you\'re'], correct: 1, explanation: "'Your' est le déterminant possessif pour 'tu/vous'. Il se place devant un nom." },
      { type: 'qcm', question: "Complete: ___ dog is very big.", options: ['He', 'Him', 'His', 'He\'s'], correct: 2, explanation: "'His' est le déterminant possessif masculin pour 'il'. On l'utilise pour parler de quelque chose qui appartient à un garçon/homme." },
      { type: 'qcm', question: "Complete: ___ cat is black.", options: ['She', 'Her', 'Hers', 'She\'s'], correct: 1, explanation: "'Her' est le déterminant possessif féminin. On l'utilise pour parler de quelque chose qui appartient à une fille/femme." },
      { type: 'qcm', question: "Complete: The dog is eating ___ food.", options: ['it', 'its', 'it\'s', 'his'], correct: 1, explanation: "'Its' (sans apostrophe) est le déterminant possessif neutre pour les animaux et les objets." },
      { type: 'qcm', question: "Complete: ___ house is very old.", options: ['We', 'Us', 'Our', 'Ours'], correct: 2, explanation: "'Our' est le déterminant possessif pour 'nous'. Il signifie 'notre/nos'." },
      { type: 'qcm', question: "Complete: ___ parents are nice.", options: ['They', 'Them', 'Their', 'Theirs'], correct: 2, explanation: "'Their' est le déterminant possessif pour 'ils/elles'. Il signifie 'leur/leurs'." },
      { type: 'qcm', question: "Tom loves ___ sister.", options: ['he', 'him', 'his', 'her'], correct: 2, explanation: "Tom est un garçon, donc on utilise 'his' (son/sa) pour parler de sa sœur." },
      { type: 'qcm', question: "Mary and ___ friends are at school.", options: ['she', 'her', 'hers', 'their'], correct: 1, explanation: "Mary est une fille seule, donc on utilise 'her' (ses) pour parler de ses amis." },
      { type: 'qcm', question: "The children forgot ___ bags.", options: ['its', 'his', 'her', 'their'], correct: 3, explanation: "'The children' (les enfants) est un pluriel, donc on utilise 'their' (leurs)." },
      { type: 'qcm', question: "I can't find ___ keys.", options: ['my', 'me', 'I', 'mine'], correct: 0, explanation: "'My' est le déterminant possessif qui se place devant un nom. 'Mine' s'utilise seul, sans nom après." },
      { type: 'qcm', question: "You should do ___ homework.", options: ['you', 'your', 'yours', 'you\'re'], correct: 1, explanation: "'Your' se place devant le nom 'homework'. C'est le déterminant possessif de 'you'." },
      { type: 'qcm', question: "The bird is in ___ cage.", options: ['it', 'its', 'it\'s', 'his'], correct: 1, explanation: "'Its' est utilisé pour un animal ou un objet. Attention : pas d'apostrophe pour le possessif !" },
      { type: 'qcm', question: "We love ___ new teacher.", options: ['we', 'us', 'our', 'ours'], correct: 2, explanation: "'Our' (notre) est le déterminant possessif de 'we' (nous)." },
      { type: 'qcm', question: "Complete: ___ mother is a doctor.", options: ['My', 'Your', 'His', 'All are correct'], correct: 3, explanation: "Tous les déterminants possessifs peuvent fonctionner ici selon le contexte !" },
      
      // Vrai/Faux (10 questions)
      { type: 'true_false', question: "'My' is used to talk about something that belongs to 'I'.", correct: true, explanation: "Vrai ! 'My' est le déterminant possessif de 'I'. Ex: My book = mon livre." },
      { type: 'true_false', question: "'His' is used for girls.", correct: false, explanation: "Faux ! 'His' est pour les garçons/hommes. Pour les filles, on utilise 'her'." },
      { type: 'true_false', question: "'It's' and 'its' mean the same thing.", correct: false, explanation: "Faux ! 'It's' = it is (c'est). 'Its' = possessif (son/sa pour un objet/animal)." },
      { type: 'true_false', question: "'Their' is the possessive for 'they'.", correct: true, explanation: "Vrai ! 'Their' est le déterminant possessif de 'they' (ils/elles)." },
      { type: 'true_false', question: "In 'your book', 'your' is a possessive determiner.", correct: true, explanation: "Vrai ! 'Your' devant un nom est un déterminant possessif." },
      { type: 'true_false', question: "'Our' means 'notre' or 'nos' in French.", correct: true, explanation: "Vrai ! 'Our' peut signifier 'notre' (singulier) ou 'nos' (pluriel)." },
      { type: 'true_false', question: "'Her' can only be used before singular nouns.", correct: false, explanation: "Faux ! 'Her' peut être utilisé avec singulier ou pluriel : her book, her books." },
      { type: 'true_false', question: "We say 'The cat is eating it's food'.", correct: false, explanation: "Faux ! On écrit 'its food' (sans apostrophe) car c'est le possessif." },
      { type: 'true_false', question: "'My' comes before the noun.", correct: true, explanation: "Vrai ! Les déterminants possessifs se placent AVANT le nom : my book, your cat, his dog..." },
      { type: 'true_false', question: "'Their' is used when there are several owners.", correct: true, explanation: "Vrai ! 'Their' = leur/leurs, quand il y a plusieurs possesseurs." },
      
      // Texte à trous (5 questions)
      { type: 'fill_blank', question: "Complete: I love ___ family.", blanks: ['my'], explanation: "'My' est le possessif de 'I'." },
      { type: 'fill_blank', question: "Complete: She is doing ___ homework.", blanks: ['her'], explanation: "'Her' est le possessif de 'she'." },
      { type: 'fill_blank', question: "Complete: We are in ___ classroom.", blanks: ['our'], explanation: "'Our' est le possessif de 'we'." },
      { type: 'fill_blank', question: "Complete: They painted ___ house blue.", blanks: ['their'], explanation: "'Their' est le possessif de 'they'." },
      { type: 'fill_blank', question: "Complete: He broke ___ arm.", blanks: ['his'], explanation: "'His' est le possessif de 'he'." },
    ];
    
    // ========================================
    // 2. LE GÉNITIF (30 questions)
    // ========================================
    const genitiveQuestions = [
      // QCM (15 questions)
      { type: 'qcm', question: "How do you say 'le livre de Tom' in English?", options: ['Tom book', 'Tom\'s book', 'The book of Tom', 'Book Tom'], correct: 1, explanation: "En anglais, on utilise 's après le possesseur : Tom's book = le livre de Tom." },
      { type: 'qcm', question: "What is the correct form for 'la voiture de mon père'?", options: ['My father car', 'My father\'s car', 'The car of my father', 'My fathers car'], correct: 1, explanation: "On ajoute 's au possesseur : my father's car." },
      { type: 'qcm', question: "Complete: This is ___.", options: ['Mary bag', 'Mary\'s bag', 'bag of Mary', 'the Mary bag'], correct: 1, explanation: "Le génitif s'écrit avec 's : Mary's bag = le sac de Mary." },
      { type: 'qcm', question: "How do you write 'les jouets des enfants'?", options: ['The children toys', 'The children\'s toys', 'The childrens toys', 'The childrens\' toys'], correct: 1, explanation: "Pour les pluriels irréguliers (children), on ajoute 's : children's toys." },
      { type: 'qcm', question: "What is correct for 'la maison de mes parents'?", options: ['My parents house', 'My parent\'s house', 'My parents\' house', 'My parents\'s house'], correct: 2, explanation: "Pour les pluriels réguliers, on met l'apostrophe après le s : parents' house." },
      { type: 'qcm', question: "Complete: The ___ toys are broken.", options: ['dogs', 'dog\'s', 'dogs\'', 'dog'], correct: 1, explanation: "Si c'est UN chien, on écrit dog's (les jouets du chien)." },
      { type: 'qcm', question: "How do you say 'la chambre de Lisa'?", options: ['Lisa room', 'Lisas room', 'Lisa\'s room', 'The room of Lisa'], correct: 2, explanation: "Génitif : Lisa's room = la chambre de Lisa." },
      { type: 'qcm', question: "What is 'la queue du chat'?", options: ['The cat tail', 'The cat\'s tail', 'The tail cat', 'The cats tail'], correct: 1, explanation: "The cat's tail = la queue du chat. Le possesseur (cat) + 's + la chose possédée (tail)." },
      { type: 'qcm', question: "Which is correct for 'les ailes des oiseaux' (several birds)?", options: ['The bird\'s wings', 'The birds wings', 'The birds\' wings', 'The birds\'s wings'], correct: 2, explanation: "Pluriel régulier (birds) : l'apostrophe se place après le s → birds' wings." },
      { type: 'qcm', question: "Complete: ___ is nice. (La mère de Jack)", options: ['Jack mother', 'Jack\'s mother', 'Jacks mother', 'The mother Jack'], correct: 1, explanation: "Jack's mother = la mère de Jack." },
      { type: 'qcm', question: "How do you say 'les robes des femmes'?", options: ['The woman\'s dresses', 'The women\'s dresses', 'The womens\' dresses', 'The womens dresses'], correct: 1, explanation: "Women est un pluriel irrégulier, donc on ajoute 's : women's dresses." },
      { type: 'qcm', question: "What is 'le bureau du professeur'?", options: ['The teacher desk', 'The teacher\'s desk', 'The teachers desk', 'The desk teacher'], correct: 1, explanation: "The teacher's desk = le bureau du professeur." },
      { type: 'qcm', question: "Complete: These are the ___ bedrooms. (mes sœurs - pluriel)", options: ['sister\'s', 'sisters\'', 'sisters', 'sister'], correct: 1, explanation: "Sisters (pluriel régulier) + apostrophe après le s = sisters' bedrooms." },
      { type: 'qcm', question: "Which sentence is correct?", options: ['The dogs bowl is empty', 'The dog\'s bowl is empty', 'The dogs\' bowl is empty', 'B and C depending on context'], correct: 3, explanation: "Les deux peuvent être corrects ! dog's = 1 chien, dogs' = plusieurs chiens." },
      { type: 'qcm', question: "Where does the apostrophe go in 'James book'?", options: ['Jame\'s book', 'James\' book', 'James\'s book', 'B and C are both correct'], correct: 3, explanation: "Pour les noms terminant par s, les deux formes sont acceptées : James' ou James's." },
      
      // Vrai/Faux (10 questions)
      { type: 'true_false', question: "To show possession, we add 's to the owner.", correct: true, explanation: "Vrai ! Le génitif se forme en ajoutant 's au possesseur : Tom's = de Tom." },
      { type: 'true_false', question: "'The dog's ball' means 'the ball of the dog'.", correct: true, explanation: "Vrai ! The dog's ball = la balle du chien." },
      { type: 'true_false', question: "For regular plurals, we add 's after the s (boys's).", correct: false, explanation: "Faux ! Pour les pluriels réguliers, on met juste l'apostrophe : boys' (pas boys's)." },
      { type: 'true_false', question: "'Children's toys' is correct because 'children' is irregular.", correct: true, explanation: "Vrai ! Les pluriels irréguliers (children, men, women) prennent 's." },
      { type: 'true_false', question: "We say 'the car of my father' in everyday English.", correct: false, explanation: "Faux ! En anglais courant, on préfère le génitif : my father's car." },
      { type: 'true_false', question: "'My parents' house' shows the house belongs to both parents.", correct: true, explanation: "Vrai ! L'apostrophe après parents indique que la maison appartient aux deux parents." },
      { type: 'true_false', question: "In 'the boys' room', there is only one boy.", correct: false, explanation: "Faux ! boys' (apostrophe après s) = plusieurs garçons. Un garçon = boy's room." },
      { type: 'true_false', question: "'Men's clothes' uses 's because 'men' is an irregular plural.", correct: true, explanation: "Vrai ! Men est irrégulier (pas mens), donc on ajoute 's : men's." },
      { type: 'true_false', question: "The genitive 's comes AFTER the possessor.", correct: true, explanation: "Vrai ! Structure : possesseur + 's + chose possédée (Tom's book)." },
      { type: 'true_false', question: "'It's' can be used as a possessive genitive.", correct: false, explanation: "Faux ! 'It's' = it is. Le possessif neutre est 'its' (sans apostrophe)." },
      
      // Texte à trous (5 questions)
      { type: 'fill_blank', question: "Complete: This is Peter___ bike. (ajoute le génitif)", blanks: ["'s"], explanation: "Peter + 's = Peter's bike (le vélo de Peter)." },
      { type: 'fill_blank', question: "Complete: The teacher___ name is Mrs Smith.", blanks: ["'s"], explanation: "The teacher's name = le nom du professeur." },
      { type: 'fill_blank', question: "Complete: My sister___ friends are funny.", blanks: ["'s"], explanation: "My sister's friends = les amis de ma sœur." },
      { type: 'fill_blank', question: "Complete: The students___ books are on the table. (plusieurs étudiants)", blanks: ["'"], explanation: "Students' (apostrophe après s pour le pluriel régulier)." },
      { type: 'fill_blank', question: "Complete: The children___ games are fun.", blanks: ["'s"], explanation: "Children's (pluriel irrégulier, donc 's)." },
    ];
    
    // ========================================
    // 3. LE PRÉSENT SIMPLE (30 questions)
    // ========================================
    const presentSimpleQuestions = [
      // QCM (15 questions)
      { type: 'qcm', question: "Complete: She ___ to school every day.", options: ['go', 'goes', 'going', 'gone'], correct: 1, explanation: "À la 3ème personne du singulier (he/she/it), on ajoute -s ou -es au verbe : she goes." },
      { type: 'qcm', question: "Complete: They ___ football on Sundays.", options: ['plays', 'play', 'playing', 'played'], correct: 1, explanation: "Avec 'they' (pluriel), le verbe reste à la base verbale sans -s : they play." },
      { type: 'qcm', question: "Complete: He ___ his homework every evening.", options: ['do', 'does', 'doing', 'did'], correct: 1, explanation: "'Do' devient 'does' avec he/she/it au présent simple." },
      { type: 'qcm', question: "Complete: I ___ English at school.", options: ['study', 'studies', 'studying', 'studys'], correct: 0, explanation: "Avec 'I', le verbe reste à la base verbale : I study." },
      { type: 'qcm', question: "Complete: My cat ___ a lot.", options: ['sleep', 'sleeps', 'sleeping', 'sleepes'], correct: 1, explanation: "'My cat' = it (3ème personne), donc on ajoute -s : sleeps." },
      { type: 'qcm', question: "Complete: We ___ breakfast at 7 o'clock.", options: ['has', 'have', 'having', 'haves'], correct: 1, explanation: "Avec 'we', on utilise 'have' (pas 'has'). 'Has' est pour he/she/it." },
      { type: 'qcm', question: "Complete: The bus ___ at 8 am.", options: ['arrive', 'arrives', 'arriving', 'arrivs'], correct: 1, explanation: "'The bus' = it, donc on ajoute -s : arrives." },
      { type: 'qcm', question: "Complete: She ___ TV in the evening.", options: ['watch', 'watchs', 'watches', 'watching'], correct: 2, explanation: "Les verbes en -ch, -sh, -s, -x, -o prennent -es : watches." },
      { type: 'qcm', question: "Complete: My brother ___ video games.", options: ['like', 'likes', 'liking', 'likees'], correct: 1, explanation: "'My brother' = he, donc on ajoute -s : likes." },
      { type: 'qcm', question: "Complete: You ___ very well.", options: ['sings', 'sing', 'singing', 'singes'], correct: 1, explanation: "Avec 'you', le verbe reste à la base verbale : you sing." },
      { type: 'qcm', question: "Complete: The children ___ in the park.", options: ['plays', 'play', 'playing', 'playes'], correct: 1, explanation: "'The children' = they (pluriel), donc pas de -s : play." },
      { type: 'qcm', question: "Complete: She ___ French and English.", options: ['speak', 'speaks', 'speaking', 'speakes'], correct: 1, explanation: "Avec 'she', on ajoute -s : speaks." },
      { type: 'qcm', question: "Complete: Tom ___ to music every day.", options: ['listen', 'listens', 'listening', 'listenes'], correct: 1, explanation: "'Tom' = he, donc on ajoute -s : listens." },
      { type: 'qcm', question: "Complete: My parents ___ hard.", options: ['works', 'work', 'working', 'workes'], correct: 1, explanation: "'My parents' = they (pluriel), donc pas de -s : work." },
      { type: 'qcm', question: "Which verb form is for he/she/it?", options: ['go', 'goes', 'going', 'gone'], correct: 1, explanation: "Au présent simple, he/she/it prennent la forme avec -s/-es : goes." },
      
      // Vrai/Faux (10 questions)
      { type: 'true_false', question: "We add -s to the verb with I and you.", correct: false, explanation: "Faux ! On ajoute -s seulement avec he/she/it. I play, you play, he plays." },
      { type: 'true_false', question: "With 'she', we add -s or -es to the verb.", correct: true, explanation: "Vrai ! She plays, she watches, she goes..." },
      { type: 'true_false', question: "'He go to school' is correct.", correct: false, explanation: "Faux ! Avec 'he', on dit 'He goes to school' (avec -es)." },
      { type: 'true_false', question: "We use present simple for habits and routines.", correct: true, explanation: "Vrai ! Le présent simple exprime les habitudes : I wake up at 7 every day." },
      { type: 'true_false', question: "'Watches' is correct for 'she watch'.", correct: true, explanation: "Vrai ! Les verbes en -ch prennent -es : she watches." },
      { type: 'true_false', question: "'They plays' is grammatically correct.", correct: false, explanation: "Faux ! 'They' est pluriel, donc pas de -s : They play." },
      { type: 'true_false', question: "'Has' is the form of 'have' for he/she/it.", correct: true, explanation: "Vrai ! I have, you have, he/she/it has, we have, they have." },
      { type: 'true_false', question: "Verbs ending in -y change to -ies with he/she/it.", correct: false, explanation: "Pas toujours ! Seulement si consonne + y : study → studies. Mais : play → plays." },
      { type: 'true_false', question: "'The dog barks' is in present simple.", correct: true, explanation: "Vrai ! C'est le présent simple : The dog (=it) barks." },
      { type: 'true_false', question: "'Does' is used with he/she/it in questions.", correct: true, explanation: "Vrai ! Does he like pizza? Does she play tennis?" },
      
      // Texte à trous (5 questions)
      { type: 'fill_blank', question: "Complete: My sister ___ (like) chocolate.", blanks: ['likes'], explanation: "My sister = she, donc likes avec -s." },
      { type: 'fill_blank', question: "Complete: They ___ (watch) TV every evening.", blanks: ['watch'], explanation: "They = pluriel, donc watch sans -es." },
      { type: 'fill_blank', question: "Complete: He ___ (have) a big dog.", blanks: ['has'], explanation: "He + have = has (forme irrégulière)." },
      { type: 'fill_blank', question: "Complete: The train ___ (arrive) at 9.", blanks: ['arrives'], explanation: "The train = it, donc arrives avec -s." },
      { type: 'fill_blank', question: "Complete: We ___ (go) to school by bus.", blanks: ['go'], explanation: "We = pluriel, donc go sans -es." },
    ];
    
    // ========================================
    // 4. LES CONNECTEURS (30 questions)
    // ========================================
    const connectorsQuestions = [
      // QCM (15 questions)
      { type: 'qcm', question: "Complete: I like pizza ___ pasta.", options: ['but', 'because', 'and', 'so'], correct: 2, explanation: "'And' relie deux éléments qu'on aime tous les deux : pizza AND pasta." },
      { type: 'qcm', question: "Complete: I like tea ___ I don't like coffee.", options: ['and', 'but', 'because', 'so'], correct: 1, explanation: "'But' exprime un contraste/opposition : j'aime le thé MAIS pas le café." },
      { type: 'qcm', question: "Complete: I'm tired ___ I went to bed late.", options: ['and', 'but', 'because', 'so'], correct: 2, explanation: "'Because' introduit la cause/raison : je suis fatigué PARCE QUE..." },
      { type: 'qcm', question: "Complete: He is tall ___ strong.", options: ['but', 'because', 'and', 'so'], correct: 2, explanation: "'And' relie deux adjectifs qui vont ensemble : grand ET fort." },
      { type: 'qcm', question: "Complete: She is nice ___ sometimes shy.", options: ['and', 'but', 'because', 'so'], correct: 1, explanation: "'But' montre un contraste : gentille MAIS timide." },
      { type: 'qcm', question: "Complete: I study English ___ it's useful.", options: ['and', 'but', 'because', 'so'], correct: 2, explanation: "'Because' donne la raison d'étudier l'anglais." },
      { type: 'qcm', question: "Complete: I have a cat ___ a dog.", options: ['but', 'because', 'and', 'so'], correct: 2, explanation: "'And' additionne : un chat ET un chien." },
      { type: 'qcm', question: "Complete: He wants to go ___ he's too tired.", options: ['and', 'but', 'because', 'so'], correct: 1, explanation: "'But' oppose le désir (veut y aller) et la réalité (trop fatigué)." },
      { type: 'qcm', question: "Complete: I can't go out ___ I'm doing my homework.", options: ['and', 'but', 'because', 'so'], correct: 2, explanation: "'Because' explique pourquoi on ne peut pas sortir." },
      { type: 'qcm', question: "Complete: Do you want tea ___ coffee?", options: ['but', 'because', 'and', 'or'], correct: 3, explanation: "'Or' propose un choix entre deux options : thé OU café." },
      { type: 'qcm', question: "Choose the correct meaning: 'He is poor but happy.'", options: ['Il est pauvre parce qu\'il est heureux', 'Il est pauvre et heureux', 'Il est pauvre mais heureux', 'Il est pauvre ou heureux'], correct: 2, explanation: "'But' = mais. Il y a un contraste entre pauvre et heureux." },
      { type: 'qcm', question: "Complete: I eat vegetables ___ they're healthy.", options: ['and', 'but', 'because', 'or'], correct: 2, explanation: "'Because' explique la raison de manger des légumes." },
      { type: 'qcm', question: "Which word shows addition?", options: ['but', 'because', 'and', 'or'], correct: 2, explanation: "'And' est le connecteur d'addition : A + B." },
      { type: 'qcm', question: "Which word shows contrast/opposition?", options: ['and', 'but', 'because', 'or'], correct: 1, explanation: "'But' exprime l'opposition ou le contraste." },
      { type: 'qcm', question: "Which word introduces a reason?", options: ['and', 'but', 'because', 'or'], correct: 2, explanation: "'Because' introduit une cause ou une raison." },
      
      // Vrai/Faux (10 questions)
      { type: 'true_false', question: "'And' is used to add information.", correct: true, explanation: "Vrai ! 'And' ajoute des informations : I like pizza and pasta." },
      { type: 'true_false', question: "'But' means 'parce que' in French.", correct: false, explanation: "Faux ! 'But' = mais. 'Because' = parce que." },
      { type: 'true_false', question: "'Because' gives the reason for something.", correct: true, explanation: "Vrai ! 'Because' explique pourquoi : I'm happy because it's Friday." },
      { type: 'true_false', question: "'I like dogs but cats' is correct.", correct: false, explanation: "Faux ! On devrait dire 'I like dogs and cats' (addition) ou 'I like dogs but not cats' (contraste)." },
      { type: 'true_false', question: "'But' shows a contrast or opposition.", correct: true, explanation: "Vrai ! 'But' exprime un contraste : small but strong = petit mais fort." },
      { type: 'true_false', question: "We can start a sentence with 'Because'.", correct: true, explanation: "Vrai ! Because I was tired, I went to bed early. (C'est possible !)" },
      { type: 'true_false', question: "'And' can connect two sentences.", correct: true, explanation: "Vrai ! I went home and I ate dinner." },
      { type: 'true_false', question: "'She is beautiful and nice' adds two positive qualities.", correct: true, explanation: "Vrai ! 'And' lie deux qualités positives ensemble." },
      { type: 'true_false', question: "'Because' comes before the cause.", correct: true, explanation: "Vrai ! I'm tired BECAUSE I studied all night. (because + cause)" },
      { type: 'true_false', question: "'But' and 'and' mean the same thing.", correct: false, explanation: "Faux ! 'And' additionne, 'but' oppose. Ce sont des sens différents." },
      
      // Texte à trous (5 questions)
      { type: 'fill_blank', question: "Complete: I want to play ___ it's raining outside.", blanks: ['but'], explanation: "'But' montre l'opposition entre le désir et la réalité (la pluie)." },
      { type: 'fill_blank', question: "Complete: She likes apples ___ oranges.", blanks: ['and'], explanation: "'And' additionne les deux fruits qu'elle aime." },
      { type: 'fill_blank', question: "Complete: He is happy ___ he got a good grade.", blanks: ['because'], explanation: "'Because' explique la raison du bonheur." },
      { type: 'fill_blank', question: "Complete: I like swimming ___ I don't like running.", blanks: ['but'], explanation: "'But' oppose ce qu'on aime et ce qu'on n'aime pas." },
      { type: 'fill_blank', question: "Complete: She studies hard ___ she wants to succeed.", blanks: ['because'], explanation: "'Because' donne la raison pour laquelle elle travaille dur." },
    ];
    
    // Fonction pour créer les questions
    async function createQuestions(
      questions: any[], 
      themeId: string, 
      themeName: string
    ) {
      let created = 0;
      
      for (const q of questions) {
        try {
          let query = '';
          const params: Record<string, any> = {
            subject: subjectId,
            question: q.question,
            explanation: q.explanation,
            gradeId: gradeId,
            themeId: themeId
          };
          
          if (q.type === 'qcm') {
            query = `
              CREATE question SET
                subject = $subject,
                question = $question,
                questionType = 'qcm',
                options = $options,
                correctAnswer = $correct,
                explanation = $explanation,
                grade_difficulties = [{ grade_id: $gradeId, difficulty: 2, points: 10 }],
                theme_ids = [type::thing("theme", $cleanThemeId)],
                isActive = true,
                is_public = true,
                createdAt = time::now(),
                updatedAt = time::now()
            `;
            params.options = q.options;
            params.correct = q.correct;
            params.cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
          } else if (q.type === 'true_false') {
            query = `
              CREATE question SET
                subject = $subject,
                question = $question,
                questionType = 'true_false',
                correctAnswer = $correct,
                explanation = $explanation,
                grade_difficulties = [{ grade_id: $gradeId, difficulty: 2, points: 10 }],
                theme_ids = [type::thing("theme", $cleanThemeId)],
                isActive = true,
                is_public = true,
                createdAt = time::now(),
                updatedAt = time::now()
            `;
            params.correct = q.correct;
            params.cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
          } else if (q.type === 'fill_blank') {
            query = `
              CREATE question SET
                subject = $subject,
                question = $question,
                questionType = 'fill_blank',
                correctAnswers = $blanks,
                explanation = $explanation,
                grade_difficulties = [{ grade_id: $gradeId, difficulty: 2, points: 10 }],
                theme_ids = [type::thing("theme", $cleanThemeId)],
                isActive = true,
                is_public = true,
                createdAt = time::now(),
                updatedAt = time::now()
            `;
            params.blanks = q.blanks;
            params.cleanThemeId = themeId.includes(':') ? themeId.split(':')[1] : themeId;
          }
          
          await db.query(query, params);
          created++;
        } catch (err) {
          console.error(`  ❌ Erreur création question: ${q.question.substring(0, 50)}...`, err);
        }
      }
      
      console.log(`  ✅ ${themeName}: ${created}/${questions.length} questions créées`);
      return created;
    }
    
    // Créer toutes les questions
    let totalCreated = 0;
    
    totalCreated += await createQuestions(
      possessiveQuestions, 
      themeIds['determinants-possessifs'], 
      'Déterminants possessifs'
    );
    
    totalCreated += await createQuestions(
      genitiveQuestions, 
      themeIds['genitif'], 
      'Le génitif'
    );
    
    totalCreated += await createQuestions(
      presentSimpleQuestions, 
      themeIds['present-simple'], 
      'Le présent simple'
    );
    
    totalCreated += await createQuestions(
      connectorsQuestions, 
      themeIds['connecteurs'], 
      'Les connecteurs'
    );
    
    console.log(`\n🎉 Total: ${totalCreated} questions créées pour l'anglais 6ème !`);
    
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.close();
  }
}

main();
