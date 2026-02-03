/**
 * Migration: Ajouter le champ domain aux matières existantes
 * 
 * Usage: bun run scripts/migration-add-domain-to-matiere.ts
 */

import Surreal from 'surrealdb';

const MATIERE_DOMAIN_MAPPING: Record<string, string> = {
	'francais': 'langues',
	'mathematiques': 'sciences',
	'histoire': 'humanites',
	'geographie': 'humanites',
	'sciences': 'sciences',
	'anglais': 'langues',
	'musique': 'arts',
	'arts': 'arts',
	'education-civique': 'humanites',
	'physique-chimie': 'sciences'
};

async function migrate() {
	const db = new Surreal();

	try {
		console.log('🔌 Connexion à SurrealDB...');
		await db.connect(process.env.SURREAL_URL + '/rpc');
		await db.signin({
			username: process.env.SURREAL_USER!,
			password: process.env.SURREAL_PASS!
		});
		await db.use({ namespace: 'kweez', database: 'dbkweez' });
		console.log('✅ Connecté');

		// Récupérer toutes les matières
		const matieres = await db.query<[{ id: string; slug: string; name: string }[]]>(
			'SELECT id, slug, name FROM matiere'
		);

		console.log(`\n📚 ${matieres[0].length} matières trouvées\n`);

		// Mettre à jour chaque matière avec son domain
		for (const matiere of matieres[0]) {
			const domain = MATIERE_DOMAIN_MAPPING[matiere.slug];
			
			if (domain) {
				await db.query(
					'UPDATE type::thing("matiere", $id) SET domain = $domain',
					{ 
						id: matiere.id.toString().replace('matiere:', ''),
						domain 
					}
				);
				console.log(`✅ ${matiere.name} → ${domain}`);
			} else {
				console.log(`⚠️  ${matiere.name} (${matiere.slug}) → pas de mapping défini`);
			}
		}

		// Vérification
		console.log('\n📊 Vérification:');
		const updated = await db.query<[{ name: string; slug: string; domain: string }[]]>(
			'SELECT name, slug, domain FROM matiere ORDER BY pos'
		);
		
		console.table(updated[0].map(m => ({
			Matière: m.name,
			Slug: m.slug,
			Domain: m.domain || '(non défini)'
		})));

		console.log('\n✅ Migration terminée!');

	} catch (error) {
		console.error('❌ Erreur:', error);
		process.exit(1);
	} finally {
		await db.close();
	}
}

migrate();
