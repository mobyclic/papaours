#!/usr/bin/env bun

/**
 * Migration : Ajout des champs de profil utilisateur
 * 
 * Ajoute les champs suivants à la table user :
 * - nom (string optionnel)
 * - prenom (string optionnel)
 * - identifiant (string optionnel)
 * - date_naissance (datetime optionnel)
 * - avatar_url (string optionnel)
 * - identifiant_tuteur (string optionnel)
 * 
 * Usage: bun run scripts/migration-user-profile.ts
 */

import Surreal from 'surrealdb';
import { SURREAL_URL, SURREAL_NAMESPACE, SURREAL_DATABASE, SURREAL_USER, SURREAL_PASS } from '../src/lib/db';

async function main() {
  console.log('🚀 Migration: Ajout des champs de profil utilisateur\n');

  const db = new Surreal();

  try {
    // Connexion
    const url = process.env.SURREAL_URL || 'wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud';
    const namespace = process.env.SURREAL_NAMESPACE || 'kweez';
    const database = process.env.SURREAL_DATABASE || 'dbkweez';
    
    console.log(`📡 Connexion à SurrealDB: ${namespace}/${database}`);
    
    await db.connect(`${url}/rpc`, {
      namespace,
      database,
    });

    await db.signin({
      username: process.env.SURREAL_USER || 'rootuser',
      password: process.env.SURREAL_PASS || 'n1n@S1mone',
    });

    console.log('✅ Connecté à SurrealDB\n');

    // Ajout des nouveaux champs à la table user
    console.log('📋 Ajout des champs de profil à la table user...');

    const fields = [
      'DEFINE FIELD nom ON user TYPE option<string>;',
      'DEFINE FIELD prenom ON user TYPE option<string>;',
      'DEFINE FIELD identifiant ON user TYPE option<string>;',
      'DEFINE FIELD date_naissance ON user TYPE option<datetime>;',
      'DEFINE FIELD avatar_url ON user TYPE option<string>;',
      'DEFINE FIELD identifiant_tuteur ON user TYPE option<string>;',
    ];

    for (const field of fields) {
      try {
        await db.query(field);
        const fieldName = field.match(/DEFINE FIELD (\w+)/)?.[1];
        console.log(`  ✓ Champ '${fieldName}' ajouté`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          const fieldName = field.match(/DEFINE FIELD (\w+)/)?.[1];
          console.log(`  ℹ️ Champ '${fieldName}' existe déjà`);
        } else {
          throw e;
        }
      }
    }

    // Index optionnel sur identifiant (pour recherche rapide)
    console.log('\n📋 Création de l\'index sur identifiant...');
    try {
      await db.query('DEFINE INDEX user_identifiant ON user COLUMNS identifiant UNIQUE;');
      console.log('  ✓ Index user_identifiant créé');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ℹ️ Index user_identifiant existe déjà');
      } else {
        console.warn('  ⚠️ Impossible de créer l\'index unique (peut-être des doublons existants)');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration terminée avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nNouveaux champs disponibles :');
    console.log('  • nom - Nom de famille');
    console.log('  • prenom - Prénom');
    console.log('  • identifiant - Identifiant unique / pseudo');
    console.log('  • date_naissance - Date de naissance');
    console.log('  • avatar_url - URL de l\'avatar');
    console.log('  • identifiant_tuteur - Lien vers tuteur');
    console.log('\n');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    await db.close();
    process.exit(1);
  }
}

main();
