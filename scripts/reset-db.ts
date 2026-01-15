#!/usr/bin/env bun

/**
 * Script de reset de la base de données
 * Supprime et recrée les tables avec le bon schéma
 */

import { connectDB } from '../src/lib/db';

async function reset() {
  console.log('🗑️  Reset de la base de données...\n');

  try {
    const db = await connectDB();

    // Supprimer les tables
    console.log('Suppression des tables...');
    await db.query('REMOVE TABLE IF EXISTS question;');
    await db.query('REMOVE TABLE IF EXISTS media;');
    await db.query('REMOVE TABLE IF EXISTS quiz_result;');
    
    console.log('✅ Tables supprimées\n');
    console.log('Maintenant lancez: bun run db:init');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

reset();
