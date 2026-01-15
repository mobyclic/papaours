export interface Question {
  id: number;
  question: string;
  image?: string;
  imageCaption?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  family: 'cordes' | 'bois' | 'cuivres' | 'percussions' | 'general';
}

export const quizQuestions: Question[] = [
  {
    id: 1,
    question: "À quelle famille appartient le violon ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Violin_VL100.png/300px-Violin_VL100.png",
    imageCaption: "Un violon",
    options: [
      "Les instruments à cordes",
      "Les instruments à vent",
      "Les instruments à percussion",
      "Les cuivres"
    ],
    correctAnswer: 0,
    explanation: "Le violon fait partie de la famille des cordes. On produit du son en frottant un archet sur ses cordes.",
    family: 'cordes'
  },
  {
    id: 2,
    question: "Quel instrument n'appartient PAS à la famille des bois ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Trumpet_1.jpg/300px-Trumpet_1.jpg",
    imageCaption: "Une trompette",
    options: [
      "La flûte traversière",
      "Le hautbois",
      "La trompette",
      "La clarinette"
    ],
    correctAnswer: 2,
    explanation: "La trompette appartient à la famille des cuivres, pas des bois. Les bois incluent la flûte, le hautbois, la clarinette et le basson.",
    family: 'bois'
  },
  {
    id: 3,
    question: "Comment produit-on le son avec une trompette ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Trumpet_in_B%E2%99%AD.jpg/300px-Trumpet_in_B%E2%99%AD.jpg",
    imageCaption: "Une trompette en Si bémol",
    options: [
      "En soufflant et en vibrant des lèvres",
      "En frappant avec des baguettes",
      "En frottant avec un archet",
      "En pinçant des cordes"
    ],
    correctAnswer: 0,
    explanation: "Dans les cuivres comme la trompette, le son est produit par la vibration des lèvres du musicien dans l'embouchure.",
    family: 'cuivres'
  },
  {
    id: 4,
    question: "Quel est le plus grand instrument à cordes de l'orchestre ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Kontrabass.jpg/200px-Kontrabass.jpg",
    imageCaption: "Une contrebasse",
    options: [
      "Le violoncelle",
      "La contrebasse",
      "L'alto",
      "La harpe"
    ],
    correctAnswer: 1,
    explanation: "La contrebasse est le plus grand et le plus grave des instruments à cordes frottées de l'orchestre. Elle mesure environ 2 mètres !",
    family: 'cordes'
  },
  {
    id: 5,
    question: "Parmi ces instruments, lequel fait partie de la famille des percussions ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pauken.jpg/300px-Pauken.jpg",
    imageCaption: "Des timbales",
    options: [
      "Le trombone",
      "Le basson",
      "Les timbales",
      "Le cor"
    ],
    correctAnswer: 2,
    explanation: "Les timbales sont des instruments à percussion. On les frappe avec des mailloches pour produire du son.",
    family: 'percussions'
  },
  {
    id: 6,
    question: "Quel instrument à vent utilise une anche double ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Oboe_modern.jpg/200px-Oboe_modern.jpg",
    imageCaption: "Un hautbois",
    options: [
      "La flûte traversière",
      "La clarinette",
      "Le hautbois",
      "Le saxophone"
    ],
    correctAnswer: 2,
    explanation: "Le hautbois utilise une anche double (deux morceaux de roseau qui vibrent l'un contre l'autre). La clarinette et le saxophone utilisent une anche simple.",
    family: 'bois'
  },
  {
    id: 7,
    question: "Combien y a-t-il de familles d'instruments dans un orchestre symphonique ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Concert_orchestre_symphonique_Arsenal_Metz.jpg/400px-Concert_orchestre_symphonique_Arsenal_Metz.jpg",
    imageCaption: "Un orchestre symphonique",
    options: [
      "2 familles",
      "3 familles",
      "4 familles",
      "5 familles"
    ],
    correctAnswer: 2,
    explanation: "Il y a 4 grandes familles d'instruments dans l'orchestre symphonique : les cordes, les bois, les cuivres et les percussions.",
    family: 'general'
  },
  {
    id: 8,
    question: "Quel instrument à cordes joue généralement les notes les plus aiguës ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Violin_VL100.png/200px-Violin_VL100.png",
    imageCaption: "Un violon",
    options: [
      "Le violon",
      "L'alto",
      "Le violoncelle",
      "La contrebasse"
    ],
    correctAnswer: 0,
    explanation: "Le violon est l'instrument à cordes le plus aigu de l'orchestre. La contrebasse, au contraire, joue les notes les plus graves.",
    family: 'cordes'
  },
  {
    id: 9,
    question: "Quel cuivre est enroulé en forme de cercle et se porte souvent sur l'épaule ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/French_horn_front.png/250px-French_horn_front.png",
    imageCaption: "Un cor d'harmonie",
    options: [
      "La trompette",
      "Le trombone",
      "Le cor d'harmonie",
      "Le tuba"
    ],
    correctAnswer: 2,
    explanation: "Le cor d'harmonie (ou cor français) a une forme circulaire caractéristique. Le musicien place sa main dans le pavillon pour modifier le son.",
    family: 'cuivres'
  },
  {
    id: 10,
    question: "Quelle est la plus petite flûte de l'orchestre ?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Piccolo_flute2.jpg/300px-Piccolo_flute2.jpg",
    imageCaption: "Un piccolo",
    options: [
      "La flûte traversière",
      "Le piccolo",
      "La flûte de Pan",
      "La flûte à bec"
    ],
    correctAnswer: 1,
    explanation: "Le piccolo est une petite flûte qui joue une octave au-dessus de la flûte traversière. C'est l'instrument le plus aigu de l'orchestre !",
    family: 'bois'
  },
  {
    id: 11,
    question: "Quel instrument à cordes se joue entre les jambes en position assise ?",
    options: [
      "L'alto",
      "Le violon",
      "Le violoncelle",
      "La contrebasse"
    ],
    correctAnswer: 2,
    explanation: "Le violoncelle se joue assis, l'instrument étant placé entre les jambes du musicien. Sa pique métallique repose au sol.",
    family: 'cordes'
  },
  {
    id: 12,
    question: "Combien de pistons possède généralement une trompette ?",
    options: [
      "2 pistons",
      "3 pistons",
      "4 pistons",
      "5 pistons"
    ],
    correctAnswer: 1,
    explanation: "La trompette possède généralement 3 pistons qui permettent de modifier la longueur du tube et donc la hauteur des notes.",
    family: 'cuivres'
  },
  {
    id: 13,
    question: "Quel est l'instrument à vent en bois le plus grave de l'orchestre ?",
    options: [
      "La clarinette",
      "Le hautbois",
      "Le basson",
      "La flûte"
    ],
    correctAnswer: 2,
    explanation: "Le basson est l'instrument le plus grave de la famille des bois. Il peut mesurer jusqu'à 1,35 mètre de long déplié !",
    family: 'bois'
  },
  {
    id: 14,
    question: "Quel instrument de percussion peut jouer différentes notes musicales ?",
    options: [
      "La grosse caisse",
      "Le triangle",
      "Le xylophone",
      "Les cymbales"
    ],
    correctAnswer: 2,
    explanation: "Le xylophone est un instrument de percussion mélodique. Chaque lame de bois correspond à une note différente.",
    family: 'percussions'
  },
  {
    id: 15,
    question: "Quel cuivre utilise une coulisse au lieu de pistons ?",
    options: [
      "La trompette",
      "Le trombone",
      "Le cor d'harmonie",
      "Le tuba"
    ],
    correctAnswer: 1,
    explanation: "Le trombone est le seul cuivre qui utilise une coulisse coulissante pour changer les notes, au lieu de pistons ou de clés.",
    family: 'cuivres'
  },
  {
    id: 16,
    question: "Quel instrument à cordes n'utilise jamais d'archet ?",
    options: [
      "Le violon",
      "La harpe",
      "Le violoncelle",
      "L'alto"
    ],
    correctAnswer: 1,
    explanation: "La harpe se joue uniquement en pinçant les cordes avec les doigts, jamais avec un archet.",
    family: 'cordes'
  },
  {
    id: 17,
    question: "Quelle est la particularité de la flûte traversière par rapport aux autres bois ?",
    options: [
      "Elle utilise une anche double",
      "Elle utilise une anche simple",
      "Elle n'a pas d'anche du tout",
      "Elle a des pistons"
    ],
    correctAnswer: 2,
    explanation: "La flûte traversière est le seul instrument à vent de l'orchestre qui ne possède pas d'anche. Le son est produit en soufflant sur l'embouchure.",
    family: 'bois'
  },
  {
    id: 18,
    question: "Quel est le plus gros instrument de la famille des cuivres ?",
    options: [
      "Le cor d'harmonie",
      "Le trombone",
      "Le tuba",
      "La trompette"
    ],
    correctAnswer: 2,
    explanation: "Le tuba est le plus gros et le plus grave des cuivres. Il peut peser jusqu'à 15 kg !",
    family: 'cuivres'
  },
  {
    id: 19,
    question: "Dans quel instrument le musicien place-t-il sa main dans le pavillon pour modifier le son ?",
    options: [
      "La trompette",
      "Le cor d'harmonie",
      "Le trombone",
      "Le tuba"
    ],
    correctAnswer: 1,
    explanation: "Le cor d'harmonie est le seul instrument où le musicien place sa main droite dans le pavillon pour modifier la sonorité et corriger certaines notes.",
    family: 'cuivres'
  },
  {
    id: 20,
    question: "Quelle section de l'orchestre compte généralement le plus de musiciens ?",
    options: [
      "Les bois",
      "Les cuivres",
      "Les percussions",
      "Les cordes"
    ],
    correctAnswer: 3,
    explanation: "Les cordes représentent environ 60% de l'orchestre symphonique, avec souvent plus de 30 violons à eux seuls !",
    family: 'general'
  }
];
