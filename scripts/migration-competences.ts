/**
 * Migration: Système de compétences
 * 
 * Crée les tables :
 * - competence : définition des compétences (générales et par matière)
 * - user_competence : progression des utilisateurs sur chaque compétence
 * 
 * Ajoute le champ competence_ids aux questions
 */

import Surreal from 'surrealdb';

async function migrate() {
  console.log('🚀 Migration: Système de compétences\n');
  
  const db = new Surreal();
  await db.connect(process.env.SURREAL_URL + '/rpc');
  await db.signin({ username: process.env.SURREAL_USER, password: process.env.SURREAL_PASS });
  await db.use({ namespace: 'papaours', database: 'dbpapaours' });

  try {
    // 1. Créer la table competence
    console.log('📝 Création de la table competence...');
    await db.query(`
      DEFINE TABLE competence SCHEMAFULL;
      DEFINE FIELD code ON competence TYPE string;
      DEFINE FIELD name ON competence TYPE string;
      DEFINE FIELD description ON competence TYPE option<string>;
      DEFINE FIELD type ON competence TYPE string ASSERT $value INSIDE ['general', 'matiere'];
      DEFINE FIELD matiere_id ON competence TYPE option<record<matiere>>;
      DEFINE FIELD color ON competence TYPE option<string>;
      DEFINE FIELD icon ON competence TYPE option<string>;
      DEFINE FIELD order ON competence TYPE option<number> DEFAULT 0;
      DEFINE FIELD createdAt ON competence TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX competence_code ON competence FIELDS code UNIQUE;
      DEFINE INDEX competence_type ON competence FIELDS type;
      DEFINE INDEX competence_matiere ON competence FIELDS matiere_id;
    `);
    console.log('✅ Table competence créée');

    // 2. Créer la table user_competence pour tracker la progression
    console.log('📝 Création de la table user_competence...');
    await db.query(`
      DEFINE TABLE user_competence SCHEMAFULL;
      DEFINE FIELD user_id ON user_competence TYPE record<user>;
      DEFINE FIELD competence_id ON user_competence TYPE record<competence>;
      DEFINE FIELD matiere_id ON user_competence TYPE option<record<matiere>>;
      DEFINE FIELD correct_answers ON user_competence TYPE number DEFAULT 0;
      DEFINE FIELD total_answers ON user_competence TYPE number DEFAULT 0;
      DEFINE FIELD mastery_level ON user_competence TYPE number DEFAULT 0;
      DEFINE FIELD last_practiced ON user_competence TYPE option<datetime>;
      DEFINE FIELD createdAt ON user_competence TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON user_competence TYPE datetime DEFAULT time::now();
      
      DEFINE INDEX user_competence_unique ON user_competence FIELDS user_id, competence_id UNIQUE;
      DEFINE INDEX user_competence_user ON user_competence FIELDS user_id;
      DEFINE INDEX user_competence_matiere ON user_competence FIELDS matiere_id;
    `);
    console.log('✅ Table user_competence créée');

    // 3. Ajouter le champ competence_ids aux questions
    console.log('📝 Ajout du champ competence_ids aux questions...');
    await db.query(`
      DEFINE FIELD OVERWRITE competence_ids ON question TYPE option<array<record<competence>>> PERMISSIONS FULL;
    `);
    console.log('✅ Champ competence_ids ajouté');

    // 4. Insérer les compétences générales
    console.log('📝 Insertion des compétences générales...');
    const generalCompetences = [
      { code: 'C1', name: 'Restituer une connaissance', description: 'Mémoriser et restituer des faits, définitions ou concepts', color: '#3B82F6', order: 1 },
      { code: 'C2', name: 'Comprendre un concept', description: 'Expliquer, interpréter ou résumer une notion', color: '#8B5CF6', order: 2 },
      { code: 'C3', name: 'Appliquer une méthode', description: 'Utiliser une procédure dans une situation connue', color: '#10B981', order: 3 },
      { code: 'C4', name: 'Analyser une situation', description: 'Décomposer un problème, identifier les éléments importants', color: '#F59E0B', order: 4 },
      { code: 'C5', name: 'Résoudre un problème', description: 'Mobiliser ses connaissances pour trouver une solution', color: '#EF4444', order: 5 },
      { code: 'C6', name: 'Communiquer', description: 'Exprimer clairement ses idées, argumenter', color: '#EC4899', order: 6 },
    ];

    for (const comp of generalCompetences) {
      await db.query(`
        CREATE competence SET
          code = $code,
          name = $name,
          description = $description,
          type = 'general',
          color = $color,
          \`order\` = $order
      `, comp);
    }
    console.log(`✅ ${generalCompetences.length} compétences générales créées`);

    // 5. Récupérer les matières existantes
    const matieresResult = await db.query('SELECT id, slug, name FROM matiere');
    const matieres = (matieresResult[0] as any[]) || [];
    console.log(`📚 ${matieres.length} matières trouvées`);

    // 6. Insérer les compétences par matière
    const matiereCompetences: Record<string, Array<{code: string, name: string, description: string, color: string, order: number}>> = {
      'physique-chimie': [
        { code: 'PC1', name: 'Identifier le matériel', description: 'Reconnaître et nommer le matériel de laboratoire', color: '#06B6D4', order: 1 },
        { code: 'PC2', name: 'Mesurer une grandeur', description: 'Effectuer des mesures avec précision et unités appropriées', color: '#14B8A6', order: 2 },
        { code: 'PC3', name: 'Comprendre une transformation', description: 'Identifier et expliquer les transformations physiques et chimiques', color: '#22C55E', order: 3 },
        { code: 'PC4', name: 'Utiliser une formule', description: 'Appliquer correctement les formules scientifiques', color: '#84CC16', order: 4 },
        { code: 'PC5', name: 'Interpréter une expérience', description: 'Analyser les résultats et tirer des conclusions', color: '#EAB308', order: 5 },
      ],
      'sciences': [
        { code: 'SC1', name: 'Observer et décrire', description: 'Observer attentivement et décrire avec précision', color: '#06B6D4', order: 1 },
        { code: 'SC2', name: 'Classer et catégoriser', description: 'Organiser des éléments selon des critères', color: '#14B8A6', order: 2 },
        { code: 'SC3', name: 'Formuler une hypothèse', description: 'Proposer une explication à vérifier', color: '#22C55E', order: 3 },
        { code: 'SC4', name: 'Expérimenter', description: 'Mettre en place et réaliser une expérience', color: '#84CC16', order: 4 },
        { code: 'SC5', name: 'Conclure', description: 'Tirer des conclusions à partir d\'observations', color: '#EAB308', order: 5 },
      ],
      'histoire': [
        { code: 'HI1', name: 'Se repérer dans le temps', description: 'Situer des événements sur une frise chronologique', color: '#F97316', order: 1 },
        { code: 'HI2', name: 'Identifier les acteurs', description: 'Reconnaître les personnages historiques et leur rôle', color: '#FB923C', order: 2 },
        { code: 'HI3', name: 'Analyser un document', description: 'Extraire des informations d\'une source historique', color: '#FBBF24', order: 3 },
        { code: 'HI4', name: 'Comprendre les causes', description: 'Identifier les causes d\'un événement historique', color: '#FCD34D', order: 4 },
        { code: 'HI5', name: 'Établir des liens', description: 'Relier des événements entre eux', color: '#FDE047', order: 5 },
      ],
      'geographie': [
        { code: 'GE1', name: 'Se repérer dans l\'espace', description: 'Localiser des lieux sur une carte', color: '#0EA5E9', order: 1 },
        { code: 'GE2', name: 'Lire une carte', description: 'Interpréter légendes, échelles et symboles', color: '#38BDF8', order: 2 },
        { code: 'GE3', name: 'Décrire un paysage', description: 'Identifier les éléments d\'un paysage', color: '#7DD3FC', order: 3 },
        { code: 'GE4', name: 'Comprendre les interactions', description: 'Analyser les relations homme-environnement', color: '#BAE6FD', order: 4 },
      ],
      'francais': [
        { code: 'FR1', name: 'Comprendre un texte', description: 'Saisir le sens global et les détails d\'un texte', color: '#A855F7', order: 1 },
        { code: 'FR2', name: 'Analyser le vocabulaire', description: 'Comprendre et utiliser le vocabulaire approprié', color: '#C084FC', order: 2 },
        { code: 'FR3', name: 'Identifier les figures de style', description: 'Reconnaître les procédés littéraires', color: '#D8B4FE', order: 3 },
        { code: 'FR4', name: 'Rédiger', description: 'Produire un texte structuré et cohérent', color: '#E9D5FF', order: 4 },
      ],
      'mathematiques': [
        { code: 'MA1', name: 'Calculer', description: 'Effectuer des opérations avec exactitude', color: '#F43F5E', order: 1 },
        { code: 'MA2', name: 'Raisonner', description: 'Construire un raisonnement logique', color: '#FB7185', order: 2 },
        { code: 'MA3', name: 'Modéliser', description: 'Traduire un problème en langage mathématique', color: '#FDA4AF', order: 3 },
        { code: 'MA4', name: 'Représenter', description: 'Utiliser des schémas, graphiques, figures', color: '#FECDD3', order: 4 },
      ],
    };

    for (const matiere of matieres) {
      const slug = matiere.slug;
      const competences = matiereCompetences[slug];
      
      if (competences) {
        console.log(`📝 Insertion des compétences pour ${matiere.name}...`);
        const cleanMatiereId = matiere.id.toString().split(':')[1] || matiere.id.toString();
        
        for (const comp of competences) {
          await db.query(`
            CREATE competence SET
              code = $code,
              name = $name,
              description = $description,
              type = 'matiere',
              matiere_id = type::thing('matiere', $matiereId),
              color = $color,
              \`order\` = $order
          `, { ...comp, matiereId: cleanMatiereId });
        }
        console.log(`✅ ${competences.length} compétences créées pour ${matiere.name}`);
      }
    }

    // Afficher le résumé
    const countResult = await db.query('SELECT count() as total FROM competence GROUP ALL');
    const total = (countResult[0] as any[])?.[0]?.total || 0;
    console.log(`\n🎉 Migration terminée ! ${total} compétences créées au total.`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrate().catch(console.error);
