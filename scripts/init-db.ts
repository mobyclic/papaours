#!/usr/bin/env bun

/**
 * Script d'initialisation de la base de données SurrealDB
 * 
 * Ce script :
 * - Se connecte à SurrealDB
 * - Crée les tables et schémas
 * - Crée l'utilisateur admin
 * - Importe les questions initiales
 * 
 * Usage: bun run scripts/init-db.ts
 */

import { connectDB, initializeSchema, createInitialAdmin } from '../src/lib/db';
import { quizQuestions } from '../src/lib/quizData';

async function main() {
  console.log('🚀 Initialisation de la base de données...\n');

  try {
    // 1. Connexion à SurrealDB
    console.log('📡 Connexion à SurrealDB...');
    const db = await connectDB();
    console.log('✅ Connecté à SurrealDB\n');

    // 2. Initialisation du schéma
    console.log('📋 Création des tables et schémas...');
    await initializeSchema();
    console.log('✅ Schéma créé\n');

    // 3. Création de l'admin
    console.log('👤 Création de l\'utilisateur admin...');
    const admin = await createInitialAdmin();
    const adminObj = Array.isArray(admin) ? admin[0] : admin;
    console.log('✅ Admin créé:', adminObj?.email, '\n');

    // 3bis. Créer un quiz par défaut s'il n'existe pas
    console.log('🧭 Vérification du quiz par défaut...');
    const existingQuiz = await db.query<any[]>(`SELECT * FROM quiz LIMIT 1`);
    let defaultQuizId: string;

    if ((existingQuiz[0] as any[])?.length) {
      defaultQuizId = (existingQuiz[0] as any[])[0].id;
      console.log('ℹ️  Quiz déjà présent, utilisation de', defaultQuizId);
    } else {
      const createdQuiz = await db.create('quiz', {
        title: 'Quiz de démarrage',
        description: 'Quiz initial généré par le script',
        slug: 'quiz-demarrage',
        questionType: 'qcm',
        coverImage: null,
        theme: 'Général',
        level: 1,
        isHomepage: true,
        isActive: true,
        order: 0
      });
      const quizObj = Array.isArray(createdQuiz) ? createdQuiz[0] : createdQuiz;
      defaultQuizId = quizObj.id;
      console.log('✅ Quiz créé:', defaultQuizId);
    }

    // 4. Importation des questions initiales
    console.log('📝 Importation des questions initiales...');
    let imported = 0;
    
    for (const q of quizQuestions) {
      try {
        const payload: Record<string, unknown> = {
          question: q.question,
          family: q.family,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: 'medium',
          isActive: true,
          order: q.id,
          createdBy: adminObj?.id?.toString() || 'system',
          quizId: defaultQuizId
        };

        if (q.image) {
          payload.imageUrl = q.image;
        }

        // Inclure imageCaption uniquement si présente pour éviter NULL
        if (q.imageCaption) {
          payload.imageCaption = q.imageCaption;
        }

        await db.create('question', payload);
        imported++;
        console.log(`  ✓ Question ${q.id} importée`);
      } catch (error) {
        console.error(`  ✗ Erreur question ${q.id}:`, error);
      }
    }
    
    console.log(`\n✅ ${imported}/${quizQuestions.length} questions importées\n`);

    // 5. Résumé
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Initialisation terminée !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Récapitulatif:');
    console.log(`   • Base de données: dbpapaours`);
    console.log(`   • Namespace: papaours`);
    console.log(`   • Admin: ${adminObj?.email}`);
    console.log(`   • Questions: ${imported}`);
    console.log('\n🔐 Identifiants admin:');
    console.log(`   Email: alistair.marca@gmail.com`);
    console.log(`   Mot de passe: n1n@S1mone`);
    console.log('\n🌐 Accès:');
    console.log(`   • Backoffice: http://localhost:5173/admin`);
    console.log(`   • Quiz: http://localhost:5173`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

main();
