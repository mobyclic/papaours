import Surreal from 'surrealdb';

async function addQuizSessionTable() {
  const db = new Surreal();

  try {
    const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
    await db.connect(`${url}/rpc`, {
      namespace: process.env.SURREAL_NAMESPACE || 'papaours',
      database: process.env.SURREAL_DATABASE || 'dbpapaours',
    });

    await db.signin({
      username: process.env.SURREAL_USER || 'rootuser',
      password: process.env.SURREAL_PASS || 'n1n@S1mone',
    });

    console.log('✅ Connecté à SurrealDB');

    // Créer la table quiz_session
    await db.query(`
      DEFINE TABLE quiz_session SCHEMAFULL PERMISSIONS FULL;
      
      -- Identifiant de l'utilisateur (ou "anonymous" + un ID unique)
      DEFINE FIELD userId ON quiz_session TYPE string ASSERT $value != NONE;
      
      -- Référence au quiz
      DEFINE FIELD quizId ON quiz_session TYPE record<quiz>;
      
      -- Liste des IDs de questions sélectionnées pour cette session (dans l'ordre)
      DEFINE FIELD questionIds ON quiz_session TYPE array;
      
      -- Les questions complètes avec options mélangées (pour rejouer exactement la même session)
      DEFINE FIELD questions ON quiz_session TYPE array;
      
      -- Index de la question courante (0-based)
      DEFINE FIELD currentQuestionIndex ON quiz_session TYPE number DEFAULT 0;
      
      -- Réponses de l'utilisateur: array d'objets {questionId, questionIndex, selectedAnswer, isCorrect, answeredAt}
      DEFINE FIELD answers ON quiz_session FLEXIBLE TYPE array DEFAULT [];
      
      -- Score courant
      DEFINE FIELD score ON quiz_session TYPE number DEFAULT 0;
      
      -- Nombre total de questions
      DEFINE FIELD totalQuestions ON quiz_session TYPE number;
      
      -- Statut: in_progress, completed, abandoned
      DEFINE FIELD status ON quiz_session TYPE string DEFAULT 'in_progress' ASSERT $value INSIDE ['in_progress', 'completed', 'abandoned'];
      
      -- Timestamps
      DEFINE FIELD startedAt ON quiz_session TYPE datetime DEFAULT time::now();
      DEFINE FIELD completedAt ON quiz_session TYPE option<datetime>;
      DEFINE FIELD lastActivityAt ON quiz_session TYPE datetime DEFAULT time::now();
      
      -- Index pour retrouver les sessions en cours d'un utilisateur
      DEFINE INDEX quiz_session_user_status ON quiz_session COLUMNS userId, status;
      DEFINE INDEX quiz_session_quiz ON quiz_session COLUMNS quizId;
    `);

    console.log('✅ Table quiz_session créée avec succès');

    await db.close();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addQuizSessionTable();
