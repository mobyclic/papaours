/**
 * Migration: Créer les programmes officiels pour la 6ème
 * 
 * Usage: bun run scripts/migration-programmes-6e.ts
 */

import Surreal from 'surrealdb';

// Matières pour la 6ème avec leurs thèmes officiels
const SUBJECTS_6E = [
	{
		code: 'francais',
		name: 'Français',
		icon: '📖',
		color: 'blue',
		domain: 'langues',
		hours_per_week: 4.5,
		themes: [
			{ name: 'Le monstre, aux limites de l\'humain', description: 'Découvrir des œuvres littéraires et des images mettant en scène des monstres' },
			{ name: 'Récits d\'aventures', description: 'Découvrir des œuvres et des textes qui, par le monde qu\'ils représentent, proposent une évasion' },
			{ name: 'Récits de création ; création poétique', description: 'S\'interroger sur le statut de ces textes, sur les valeurs qu\'ils expriment' },
			{ name: 'Résister au plus fort : ruses, mensonges et masques', description: 'Découvrir des textes de différents genres mettant en scène les ruses et détours qu\'invente le faible pour résister au plus fort' }
		]
	},
	{
		code: 'mathematiques',
		name: 'Mathématiques',
		icon: '🔢',
		color: 'green',
		domain: 'sciences',
		hours_per_week: 4.5,
		themes: [
			{ name: 'Nombres et calculs', description: 'Utiliser et représenter les grands nombres entiers, les fractions simples, les décimaux' },
			{ name: 'Grandeurs et mesures', description: 'Comparer, estimer, mesurer des grandeurs géométriques, utiliser des formules' },
			{ name: 'Espace et géométrie', description: 'Reconnaître, nommer, décrire, reproduire, représenter des figures et solides usuels' },
			{ name: 'Algorithmique et programmation', description: 'Écrire, mettre au point et exécuter un programme simple (Scratch)' }
		]
	},
	{
		code: 'histoire',
		name: 'Histoire',
		icon: '🏛️',
		color: 'amber',
		domain: 'humanites',
		hours_per_week: 1.5,
		themes: [
			{ name: 'La longue histoire de l\'humanité et des migrations', description: 'Les débuts de l\'humanité, la révolution néolithique, premiers États' },
			{ name: 'Récits fondateurs, croyances et citoyenneté dans la Méditerranée antique', description: 'Le monde des cités grecques, Rome du mythe à l\'histoire, la naissance du monothéisme' },
			{ name: 'L\'empire romain dans le monde antique', description: 'Conquêtes, paix romaine et romanisation, des chrétiens dans l\'Empire, les relations de l\'Empire romain avec les autres mondes anciens' }
		]
	},
	{
		code: 'geographie',
		name: 'Géographie',
		icon: '🌍',
		color: 'teal',
		domain: 'humanites',
		hours_per_week: 1.5,
		themes: [
			{ name: 'Habiter une métropole', description: 'Les métropoles et leurs habitants, la ville de demain' },
			{ name: 'Habiter un espace de faible densité', description: 'Habiter un espace à forte(s) contrainte(s) naturelle(s) ou de grande biodiversité' },
			{ name: 'Habiter les littoraux', description: 'Littoral industrialo-portuaire, littoral touristique' },
			{ name: 'Le monde habité', description: 'La répartition de la population mondiale, la variété des formes d\'occupation spatiale' }
		]
	},
	{
		code: 'sciences',
		name: 'Sciences et Technologie',
		icon: '🔬',
		color: 'purple',
		domain: 'sciences',
		hours_per_week: 4,
		themes: [
			{ name: 'Matière, mouvement, énergie, information', description: 'Décrire les états et la constitution de la matière, l\'énergie et ses conversions' },
			{ name: 'Le vivant, sa diversité et les fonctions qui le caractérisent', description: 'Classer les organismes, unité et diversité des êtres vivants, fonctions de nutrition' },
			{ name: 'Matériaux et objets techniques', description: 'Identifier les principales familles de matériaux, concevoir et produire un objet technique' },
			{ name: 'La planète Terre, l\'environnement et l\'action humaine', description: 'Situer la Terre dans le système solaire, caractériser les conditions de la vie terrestre' }
		]
	},
	{
		code: 'anglais',
		name: 'Anglais (LV1)',
		icon: '🇬🇧',
		color: 'red',
		domain: 'langues',
		hours_per_week: 4,
		themes: [
			{ name: 'La personne et la vie quotidienne', description: 'Le corps humain, les vêtements, les modes de vie' },
			{ name: 'Des repères géographiques, historiques et culturels', description: 'Environnement, climat, caractéristiques physiques, patrimoine' },
			{ name: 'L\'imaginaire', description: 'Contes, légendes, comptines, chansons, BD, littérature enfantine' },
			{ name: 'Rencontres avec d\'autres cultures', description: 'Personnes célèbres, événements culturels, modes de vie' }
		]
	},
	{
		code: 'emc',
		name: 'Enseignement Moral et Civique',
		icon: '⚖️',
		color: 'indigo',
		domain: 'humanites',
		hours_per_week: 0.5,
		themes: [
			{ name: 'Respecter autrui', description: 'Respect de l\'intégrité de la personne, tolérance et lutte contre les discriminations' },
			{ name: 'Acquérir et partager les valeurs de la République', description: 'Liberté, égalité, fraternité, laïcité' },
			{ name: 'Construire une culture civique', description: 'Le citoyen et la règle de droit, l\'engagement moral et civique' }
		]
	},
	{
		code: 'arts_plastiques',
		name: 'Arts plastiques',
		icon: '🎨',
		color: 'pink',
		domain: 'arts',
		hours_per_week: 1,
		themes: [
			{ name: 'La représentation plastique et les dispositifs de présentation', description: 'Ressemblance, narration visuelle, autonomie du geste graphique' },
			{ name: 'Les fabrications et la relation entre l\'objet et l\'espace', description: 'L\'invention, la fabrication, les détournements' },
			{ name: 'La matérialité de la production plastique et la sensibilité aux constituants de l\'œuvre', description: 'Qualités physiques des matériaux, effets du geste et de l\'instrument' }
		]
	},
	{
		code: 'musique',
		name: 'Éducation musicale',
		icon: '🎵',
		color: 'orange',
		domain: 'arts',
		hours_per_week: 1,
		themes: [
			{ name: 'Chanter et interpréter', description: 'Reproduire et interpréter un modèle mélodique et rythmique' },
			{ name: 'Écouter, comparer, construire une culture musicale', description: 'Décrire et comparer des éléments sonores, identifier et nommer ressemblances et différences' },
			{ name: 'Explorer et imaginer', description: 'Imaginer des représentations graphiques ou corporelles de la musique' },
			{ name: 'Échanger, partager, argumenter et débattre', description: 'Argumenter un jugement sur une musique tout en respectant celui des autres' }
		]
	},
	{
		code: 'eps',
		name: 'Éducation Physique et Sportive',
		icon: '⚽',
		color: 'emerald',
		domain: 'arts',
		hours_per_week: 4,
		themes: [
			{ name: 'Produire une performance optimale', description: 'Activités athlétiques, natation de vitesse' },
			{ name: 'Adapter ses déplacements à des environnements variés', description: 'Natation longue, course d\'orientation, escalade' },
			{ name: 'S\'exprimer devant les autres par une prestation artistique', description: 'Danse, arts du cirque, acrosport' },
			{ name: 'Conduire et maitriser un affrontement collectif ou interindividuel', description: 'Sports collectifs, raquettes, combat' }
		]
	}
];

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
		console.log('✅ Connecté\n');

		// Vérifier si le schéma de subject permet l'insertion
		const subjectInfo = await db.query('INFO FOR TABLE subject');
		console.log('📋 Schéma subject:', Object.keys(subjectInfo[0].fields).length > 0 ? 'SCHEMAFULL' : 'SCHEMALESS');

		// Définir les champs nécessaires pour subject si pas déjà fait
		await db.query(`
			DEFINE FIELD IF NOT EXISTS code ON subject TYPE string;
			DEFINE FIELD IF NOT EXISTS name ON subject TYPE string;
			DEFINE FIELD IF NOT EXISTS icon ON subject TYPE option<string>;
			DEFINE FIELD IF NOT EXISTS color ON subject TYPE option<string>;
			DEFINE FIELD IF NOT EXISTS domain ON subject TYPE option<string>;
			DEFINE FIELD IF NOT EXISTS hours_per_week ON subject TYPE option<number>;
			DEFINE FIELD IF NOT EXISTS is_active ON subject TYPE bool DEFAULT true;
			DEFINE FIELD IF NOT EXISTS created_at ON subject TYPE datetime DEFAULT time::now();
			DEFINE INDEX IF NOT EXISTS idx_subject_code ON subject FIELDS code UNIQUE;
		`);
		console.log('✅ Schéma subject mis à jour\n');

		console.log('📚 Création des matières et programmes pour la 6ème...\n');

		for (const subject of SUBJECTS_6E) {
			// 1. Créer le subject
			const subjectResult = await db.query(`
				CREATE subject:${subject.code} CONTENT {
					code: $code,
					name: $name,
					icon: $icon,
					color: $color,
					domain: $domain,
					hours_per_week: $hours_per_week,
					is_active: true,
					created_at: time::now()
				}
			`, {
				code: subject.code,
				name: subject.name,
				icon: subject.icon,
				color: subject.color,
				domain: subject.domain,
				hours_per_week: subject.hours_per_week
			});
			console.log(`  ✅ Subject: ${subject.name}`);

			// 2. Créer le programme officiel pour cette matière en 6ème
			try {
				await db.query(`
					CREATE official_program:FR_6e_${subject.code} CONTENT {
						name: $name,
						description: $description,
						education_system: education_system:FR,
						cycle: cycle:FR_college,
						grade: grade:FR_6e,
						subject: subject:${subject.code},
						is_active: true,
						created_at: time::now()
					}
				`, {
					name: `${subject.name} - Programme de Sixième`,
					description: `Programme officiel de ${subject.name} pour la classe de 6ème (Cycle 3)`
				});
				console.log(`  ✅ Programme: ${subject.name} 6ème`);
			} catch (e) {
				console.log(`  ⚠️ Programme déjà existant ou erreur: ${e.message}`);
			}

			// 3. Créer les chapitres/thèmes pour ce programme
			for (let i = 0; i < subject.themes.length; i++) {
				const theme = subject.themes[i];
				const chapterId = `FR_6e_${subject.code}_ch${i + 1}`;
				
				try {
					await db.query(`
						CREATE chapter:${chapterId} CONTENT {
							name: $name,
							description: $description,
							official_program: official_program:FR_6e_${subject.code},
							order: $order,
							is_active: true,
							created_at: time::now()
						}
					`, {
						name: theme.name,
						description: theme.description,
						order: i + 1
					});
				} catch (e) {
					// Ignorer si existe déjà
				}
			}
			console.log(`  ✅ ${subject.themes.length} chapitres créés\n`);
		}

		// Résumé
		console.log('\n📊 Résumé:');
		const subjectsCount = await db.query('SELECT count() FROM subject GROUP ALL');
		const programsCount = await db.query('SELECT count() FROM official_program GROUP ALL');
		const chaptersCount = await db.query('SELECT count() FROM chapter GROUP ALL');
		
		console.log(`  - Matières (subjects): ${subjectsCount[0]?.[0]?.count || 0}`);
		console.log(`  - Programmes officiels: ${programsCount[0]?.[0]?.count || 0}`);
		console.log(`  - Chapitres: ${chaptersCount[0]?.[0]?.count || 0}`);

		console.log('\n✅ Migration terminée!');

	} catch (error) {
		console.error('❌ Erreur:', error);
		process.exit(1);
	} finally {
		await db.close();
	}
}

migrate();
