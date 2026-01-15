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
    console.log('✅ Admin créé:', admin.email, '\n');

    // 4. Importation des questions initiales
    console.log('📝 Importation des questions initiales...');
    let imported = 0;
    
    for (const q of quizQuestions) {
      try {
        await db.create('question', {
          question: q.question,
          family: q.family,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          imageUrl: q.image || null,
          imageCaption: q.imageCaption || null,
          difficulty: 'medium',
          isActive: true,
          order: q.id,
          createdBy: admin[0]?.id?.toString() || 'system'
        });
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
    console.log(`   • Admin: ${admin.email}`);
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
