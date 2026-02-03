/**
 * Domaines disciplinaires
 * Utilisés pour regrouper les matières par grande catégorie
 */

export type DomainSlug = 'sciences' | 'langues' | 'humanites' | 'arts' | 'pro' | 'maternelle';

export interface Domain {
	slug: DomainSlug;
	name: {
		fr: string;
		en: string;
		es: string;
		ar: string;
	};
	icon: string;
	color: string;
	order: number;
}

export const DOMAINS: Record<DomainSlug, Domain> = {
	sciences: {
		slug: 'sciences',
		name: {
			fr: 'Sciences',
			en: 'Science',
			es: 'Ciencias',
			ar: 'علوم'
		},
		icon: '🔬',
		color: 'blue',
		order: 1
	},
	langues: {
		slug: 'langues',
		name: {
			fr: 'Langues',
			en: 'Languages',
			es: 'Idiomas',
			ar: 'لغات'
		},
		icon: '🌍',
		color: 'green',
		order: 2
	},
	humanites: {
		slug: 'humanites',
		name: {
			fr: 'Humanités',
			en: 'Humanities',
			es: 'Humanidades',
			ar: 'إنسانيات'
		},
		icon: '📚',
		color: 'amber',
		order: 3
	},
	arts: {
		slug: 'arts',
		name: {
			fr: 'Arts & Sport',
			en: 'Arts & Sports',
			es: 'Artes y Deportes',
			ar: 'فنون ورياضة'
		},
		icon: '🎨',
		color: 'purple',
		order: 4
	},
	pro: {
		slug: 'pro',
		name: {
			fr: 'Professionnel',
			en: 'Professional',
			es: 'Profesional',
			ar: 'مهني'
		},
		icon: '💼',
		color: 'slate',
		order: 5
	},
	maternelle: {
		slug: 'maternelle',
		name: {
			fr: 'Maternelle',
			en: 'Preschool',
			es: 'Preescolar',
			ar: 'روضة'
		},
		icon: '🧒',
		color: 'pink',
		order: 6
	}
} as const;

/**
 * Liste ordonnée des domaines
 */
export const DOMAINS_LIST = Object.values(DOMAINS).sort((a, b) => a.order - b.order);

/**
 * Mapping matière slug → domain slug
 */
export const MATIERE_TO_DOMAIN: Record<string, DomainSlug> = {
	// Sciences
	'mathematiques': 'sciences',
	'sciences': 'sciences',
	'physique-chimie': 'sciences',
	
	// Langues
	'francais': 'langues',
	'anglais': 'langues',
	
	// Humanités
	'histoire': 'humanites',
	'geographie': 'humanites',
	'education-civique': 'humanites',
	
	// Arts
	'musique': 'arts',
	'arts': 'arts'
};

/**
 * Récupère le domaine d'une matière par son slug
 */
export function getDomainForMatiere(matiereSlug: string): Domain | null {
	const domainSlug = MATIERE_TO_DOMAIN[matiereSlug];
	return domainSlug ? DOMAINS[domainSlug] : null;
}

/**
 * Récupère le nom du domaine dans la langue spécifiée
 */
export function getDomainName(domainSlug: DomainSlug, lang: 'fr' | 'en' | 'es' | 'ar' = 'fr'): string {
	return DOMAINS[domainSlug]?.name[lang] ?? domainSlug;
}
