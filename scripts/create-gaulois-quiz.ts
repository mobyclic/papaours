import { connectDB } from '../src/lib/db';

async function createGauloisQuiz() {
  const db = await connectDB();

  try {
    // 1. Créer le quiz
    console.log('📝 Création du quiz sur les Gaulois...');
    const quizResult = await db.query(`
      CREATE quiz SET
        title = "Comment vivaient les Gaulois ? - CE2",
        slug = "vie-des-gaulois-ce2",
        description = "Découvre la vie quotidienne des Gaulois, leurs inventions, leurs guerriers célèbres et ce qui s'est passé après la conquête romaine !",
        theme = "Histoire",
        level = 1,
        isActive = true,
        isHomepage = false,
        order = 12,
        questionType = "qcm"
      RETURN AFTER
    `);
    const quiz = (quizResult[0] as any[])[0];
    console.log('✅ Quiz créé:', quiz.id);

    // 2. Créer les 15 questions
    console.log('\n❓ Création des questions...');

    const questions = [
      // Définition de l'Antiquité
      {
        question: "L'Antiquité, c'est une période de l'Histoire. Quand a-t-elle commencé ?",
        options: ["Avec l'invention de l'écriture", "Avec l'invention de la voiture", "Avec la naissance de Jésus", "Avec les dinosaures"],
        correctAnswer: 0,
        explanation: "L'Antiquité commence avec l'invention de l'écriture, il y a environ 5000 ans, et se termine à la chute de l'Empire romain en 476.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Sumerian_26th_c_Adab.jpg/220px-Sumerian_26th_c_Adab.jpg",
        imageCaption: "Une des premières écritures du monde"
      },
      // La moissonneuse gauloise
      {
        question: "Les Gaulois ont inventé une machine pour couper le blé plus vite. Comment s'appelle-t-elle ?",
        options: ["Le tracteur", "La moissonneuse", "La tondeuse", "Le moulin"],
        correctAnswer: 1,
        explanation: "La moissonneuse gauloise était poussée par un âne ou un bœuf. Elle coupait les épis de blé grâce à des lames. C'était une invention très moderne pour l'époque !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Moissonneuse_gauloise.jpg/280px-Moissonneuse_gauloise.jpg",
        imageCaption: "Reconstitution d'une moissonneuse gauloise"
      },
      // Le char gaulois
      {
        question: "Les Gaulois utilisaient un véhicule à deux roues tiré par des chevaux. Comment s'appelle-t-il ?",
        options: ["Une voiture", "Un char", "Un vélo", "Un bateau"],
        correctAnswer: 1,
        explanation: "Le char gaulois était tiré par deux chevaux. Les guerriers gaulois s'en servaient pour aller au combat. Les Gaulois étaient d'excellents forgerons et fabriquaient des chars très solides !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Char_gaulois_Bourgogne.jpg/300px-Char_gaulois_Bourgogne.jpg",
        imageCaption: "Reconstitution d'un char gaulois"
      },
      // Le torque
      {
        question: "Les Gaulois portaient un bijou en or ou en bronze autour du cou. Comment s'appelle ce collier ?",
        options: ["Un bracelet", "Un torque", "Une couronne", "Une ceinture"],
        correctAnswer: 1,
        explanation: "Le torque était un collier rigide en métal, souvent en or. Les chefs gaulois le portaient pour montrer leur richesse et leur pouvoir. C'était un symbole très important !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Torque_de_Mailly-le-Camp.jpg/280px-Torque_de_Mailly-le-Camp.jpg",
        imageCaption: "Un torque gaulois en or"
      },
      // L'oppidum
      {
        question: "Comment s'appelaient les grandes villes fortifiées des Gaulois, construites sur des collines ?",
        options: ["Des châteaux", "Des oppidums", "Des pyramides", "Des igloos"],
        correctAnswer: 1,
        explanation: "Un oppidum était une ville gauloise entourée de remparts, souvent construite en hauteur pour se défendre. Bibracte et Gergovie étaient des oppidums célèbres !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Vue_a%C3%A9rienne_de_Bibracte.jpg/320px-Vue_a%C3%A9rienne_de_Bibracte.jpg",
        imageCaption: "Vue aérienne de Bibracte, un oppidum gaulois"
      },
      // Siège d'un village
      {
        question: "Quand une armée entoure une ville pour empêcher les habitants de sortir et de recevoir de la nourriture, comment appelle-t-on cela ?",
        options: ["Une fête", "Un siège", "Une course", "Un marché"],
        correctAnswer: 1,
        explanation: "Un siège, c'est quand une armée encercle une ville et attend que les habitants n'aient plus de nourriture ni d'eau pour les obliger à se rendre.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Siege-alesia-vercingetorix-jules-cesar.jpg/320px-Siege-alesia-vercingetorix-jules-cesar.jpg",
        imageCaption: "Illustration d'un siège"
      },
      // Jules César
      {
        question: "Qui était Jules César ?",
        options: ["Un chef gaulois", "Un général romain qui a conquis la Gaule", "Un roi de France", "Un pharaon égyptien"],
        correctAnswer: 1,
        explanation: "Jules César était un général et homme politique romain très puissant. Il a conquis la Gaule entre 58 et 52 avant J.-C. et a écrit un livre sur ses batailles.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Rimini083.jpg/200px-Rimini083.jpg",
        imageCaption: "Statue de Jules César"
      },
      // Vercingétorix
      {
        question: "Qui était Vercingétorix ?",
        options: ["Un empereur romain", "Un chef gaulois qui a combattu les Romains", "Un dieu grec", "Un pharaon"],
        correctAnswer: 1,
        explanation: "Vercingétorix était un jeune chef gaulois très courageux. Il a réussi à unir les tribus gauloises pour combattre Jules César. Il est devenu un héros de l'histoire de France !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Vercingetorix_stater_CdM.jpg/220px-Vercingetorix_stater_CdM.jpg",
        imageCaption: "Pièce de monnaie avec le visage de Vercingétorix"
      },
      // La bataille d'Alésia
      {
        question: "En 52 avant J.-C., où s'est déroulée la grande bataille entre Vercingétorix et Jules César ?",
        options: ["À Paris", "À Alésia", "À Rome", "À Athènes"],
        correctAnswer: 1,
        explanation: "La bataille d'Alésia a eu lieu en Bourgogne. Vercingétorix s'est réfugié dans l'oppidum d'Alésia mais Jules César l'a encerclé. Après un long siège, Vercingétorix s'est rendu.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Siege_d%27Alesia.jpg/320px-Siege_d%27Alesia.jpg",
        imageCaption: "Le siège d'Alésia"
      },
      // La reddition de Vercingétorix
      {
        question: "Après la défaite d'Alésia, qu'a fait Vercingétorix devant Jules César ?",
        options: ["Il s'est enfui", "Il a jeté ses armes aux pieds de César pour se rendre", "Il a gagné", "Il est devenu ami avec César"],
        correctAnswer: 1,
        explanation: "Vercingétorix a jeté ses armes aux pieds de Jules César pour sauver son peuple. Il a été emmené à Rome comme prisonnier. C'est un acte de courage et de sacrifice.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lionel_Royer_-_Vercing%C3%A9torix_jette_ses_armes_aux_pieds_de_C%C3%A9sar.jpg/320px-Lionel_Royer_-_Vercing%C3%A9torix_jette_ses_armes_aux_pieds_de_C%C3%A9sar.jpg",
        imageCaption: "Vercingétorix dépose les armes devant César (tableau)"
      },
      // Les arènes romaines
      {
        question: "Après la conquête, les Romains ont construit de grands bâtiments ronds pour les spectacles. Comment s'appellent-ils ?",
        options: ["Des cinémas", "Des arènes", "Des écoles", "Des gares"],
        correctAnswer: 1,
        explanation: "Les arènes étaient des grands bâtiments où les Romains organisaient des combats de gladiateurs et des spectacles. On peut encore voir les arènes de Nîmes et d'Arles en France !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Arenes_de_Nimes_panorama.jpg/320px-Arenes_de_Nimes_panorama.jpg",
        imageCaption: "Les arènes de Nîmes"
      },
      // Les aqueducs
      {
        question: "Les Romains ont construit de grands ponts pour transporter l'eau vers les villes. Comment s'appellent-ils ?",
        options: ["Des tunnels", "Des aqueducs", "Des barrages", "Des fontaines"],
        correctAnswer: 1,
        explanation: "Les aqueducs transportaient l'eau des montagnes jusqu'aux villes grâce à des canaux. Le Pont du Gard, près de Nîmes, est un aqueduc romain très célèbre !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Pont_du_Gard_BLS.jpg/320px-Pont_du_Gard_BLS.jpg",
        imageCaption: "Le Pont du Gard"
      },
      // Les temples romains
      {
        question: "Les Romains ont construit des bâtiments pour honorer leurs dieux. Comment s'appellent-ils ?",
        options: ["Des temples", "Des châteaux", "Des usines", "Des magasins"],
        correctAnswer: 0,
        explanation: "Les temples romains étaient des bâtiments sacrés avec des colonnes. La Maison Carrée à Nîmes est un temple romain très bien conservé qu'on peut encore visiter !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/MaisonCar  r%C3%A9e.jpg/320px-MaisonCarr%C3%A9e.jpg",
        imageCaption: "La Maison Carrée à Nîmes"
      },
      // Les voies romaines
      {
        question: "Les Romains ont construit de longues routes pavées pour voyager et faire du commerce. Comment s'appellent-elles ?",
        options: ["Les autoroutes", "Les voies romaines", "Les chemins de fer", "Les pistes cyclables"],
        correctAnswer: 1,
        explanation: "Les voies romaines étaient des routes très solides faites de pierres. Elles reliaient toutes les villes de l'Empire. On dit que 'tous les chemins mènent à Rome' !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Road_in_Pompei.jpg/320px-Road_in_Pompei.jpg",
        imageCaption: "Une voie romaine à Pompéi"
      },
      // La Gaule romaine
      {
        question: "Après la conquête, comment appelle-t-on la Gaule quand elle fait partie de l'Empire romain ?",
        options: ["La France", "La Gaule romaine", "L'Angleterre", "L'Italie"],
        correctAnswer: 1,
        explanation: "Après la victoire de César, la Gaule est devenue une province romaine : la Gaule romaine. Les Gaulois ont appris le latin, adopté les coutumes romaines et sont devenus des Gallo-Romains !",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Roman_Empire_125.png/320px-Roman_Empire_125.png",
        imageCaption: "L'Empire romain (la Gaule est en haut à gauche)"
      }
    ];

    // Insérer chaque question avec SQL brut
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      let query = `
        CREATE question SET
          quizId = ${quiz.id},
          question = "${q.question.replace(/"/g, '\\"')}",
          options = ["${q.options.join('", "')}"],
          correctAnswer = ${q.correctAnswer},
          explanation = "${q.explanation.replace(/"/g, '\\"')}",
          difficulty = "easy",
          family = "general",
          order = ${i + 1},
          isActive = true,
          createdAt = time::now(),
          updatedAt = time::now()
      `;
      
      if (q.imageUrl) {
        query += `, imageUrl = "${q.imageUrl}"`;
      }
      if (q.imageCaption) {
        query += `, imageCaption = "${q.imageCaption}"`;
      }

      await db.query(query);
      console.log(`  ✅ Question ${i + 1}/15`);
    }

    console.log('\n🎉 Quiz créé avec succès !');
    console.log('   📚 Matière: Histoire');
    console.log('   📝 Quiz: Comment vivaient les Gaulois ? - CE2');
    console.log('   ❓ Questions: 15');
    console.log('   🔗 URL: http://localhost:5173/quiz/vie-des-gaulois-ce2');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

createGauloisQuiz();
