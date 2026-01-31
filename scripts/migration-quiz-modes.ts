#!/usr/bin/env bun

/**
 * Migration: Ajout du système de modes (Révision vs Épreuve) et timer
 * 
 * Nouveaux champs sur quiz_session:
 * - mode: 'revision' | 'epreuve' 
 *   - revision: affiche la correction après chaque question
 *   - epreuve: navigation libre, résultat uniquement à la fin
 * - timeLimit: temps limite en secondes (null = pas de limite)
 * - timeRemaining: temps restant (pour pouvoir reprendre)
 * - allowNavigation: peut naviguer entre questions (toujours true en mode épreuve)
 * 
 * Usage: bun run scripts/migration-quiz-modes.ts
 */

import Surreal from 'surrealdb';

async function migrate() {
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

    console.log('✅ Connecté à SurrealDB\n');

    // 1. Ajouter les nouveaux champs à quiz_session
    console.log('📝 Ajout des champs mode et timer sur quiz_session...');
    
    await db.query(`
      -- Mode du quiz: revision (correction immédiate) ou epreuve (correction à la fin)
      DEFINE FIELD mode ON quiz_session TYPE string DEFAULT 'revision' 
        ASSERT $value INSIDE ['revision', 'epreuve'];
      
      -- Temps limite en secondes (null = pas de limite)
      DEFINE FIELD timeLimit ON quiz_session TYPE option<number>;
      
      -- Temps restant en secondes (pour reprendre une session)
      DEFINE FIELD timeRemaining ON quiz_session TYPE option<number>;
      
      -- Timestamp de la dernière mise à jour du timer (pour calcul précis)
      DEFINE FIELD timerStartedAt ON quiz_session TYPE option<datetime>;
      
      -- Réponses sauvegardées en mode épreuve (avant soumission finale)
      -- Format: { [questionIndex]: selectedAnswer }
      DEFINE FIELD savedAnswers ON quiz_session FLEXIBLE TYPE object DEFAULT {};
    `);
    
    console.log('✅ Champs ajoutés sur quiz_session\n');

    // 2. Mettre à jour les sessions existantes avec le mode par défaut
    console.log('📝 Mise à jour des sessions existantes...');
    
    const updateResult = await db.query(`
      UPDATE quiz_session SET 
        mode = 'revision',
        savedAnswers = {}
      WHERE mode = NONE
    `);
    
    const updatedCount = (updateResult[0] as any[])?.length || 0;
    console.log(`✅ ${updatedCount} sessions mises à jour\n`);

    // 3. Ajouter des presets de configuration sur la table quiz
    console.log('📝 Ajout des presets de mode sur quiz...');
    
    await db.query(`
      -- Mode par défaut pour ce quiz
      DEFINE FIELD defaultMode ON quiz TYPE string DEFAULT 'revision'
        ASSERT $value INSIDE ['revision', 'epreuve'];
      
      -- Temps limite par défaut en secondes (null = pas de limite)
      DEFINE FIELD defaultTimeLimit ON quiz TYPE option<number>;
      
      -- Permettre à l'utilisateur de choisir le mode
      DEFINE FIELD allowModeChoice ON quiz TYPE bool DEFAULT true;
      
      -- Permettre à l'utilisateur de définir un temps limite
      DEFINE FIELD allowTimeChoice ON quiz TYPE bool DEFAULT true;
    `);
    
    console.log('✅ Presets ajoutés sur quiz\n');

    // 4. Mettre à jour les quiz existants
    console.log('📝 Mise à jour des quiz existants...');
    
    const updateQuizResult = await db.query(`
      UPDATE quiz SET 
        defaultMode = 'revision',
        allowModeChoice = true,
        allowTimeChoice = true
      WHERE defaultMode = NONE
    `);
    
    const updatedQuizCount = (updateQuizResult[0] as any[])?.length || 0;
    console.log(`✅ ${updatedQuizCount} quiz mis à jour\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration terminée avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Récapitulatif des nouveaux champs:');
    console.log('   quiz_session:');
    console.log('     • mode: "revision" | "epreuve"');
    console.log('     • timeLimit: nombre de secondes (optionnel)');
    console.log('     • timeRemaining: secondes restantes');
    console.log('     • timerStartedAt: timestamp début timer');
    console.log('     • savedAnswers: réponses non soumises (mode épreuve)');
    console.log('   quiz:');
    console.log('     • defaultMode: mode par défaut');
    console.log('     • defaultTimeLimit: temps limite par défaut');
    console.log('     • allowModeChoice: choix mode autorisé');
    console.log('     • allowTimeChoice: choix temps autorisé');
    console.log('\n');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

migrate();
