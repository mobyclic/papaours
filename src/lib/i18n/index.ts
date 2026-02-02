/**
 * Système d'internationalisation (i18n) pour Kweez
 * 
 * Usage:
 * import { t, locale, setLocale, availableLocales } from '$lib/i18n';
 * 
 * Dans un composant Svelte:
 * <p>{$t('login.title')}</p>
 * 
 * Avec paramètres:
 * <p>{$t('welcome.message', { name: 'Alice' })}</p>
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export type Locale = 'fr' | 'en';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

// Configuration des langues disponibles
export const availableLocales: LocaleConfig[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
];

// Locale par défaut
const DEFAULT_LOCALE: Locale = 'fr';

// Store pour la locale actuelle
function createLocaleStore() {
  // Récupérer la locale sauvegardée ou détecter du navigateur
  let initialLocale: Locale = DEFAULT_LOCALE;
  
  if (browser) {
    const saved = localStorage.getItem('kweez_locale');
    if (saved && availableLocales.some(l => l.code === saved)) {
      initialLocale = saved as Locale;
    } else {
      // Détecter la langue du navigateur
      const browserLang = navigator.language.split('-')[0];
      if (availableLocales.some(l => l.code === browserLang)) {
        initialLocale = browserLang as Locale;
      }
    }
  }
  
  const { subscribe, set, update } = writable<Locale>(initialLocale);
  
  return {
    subscribe,
    set: (value: Locale) => {
      if (browser) {
        localStorage.setItem('kweez_locale', value);
        document.documentElement.lang = value;
        const config = availableLocales.find(l => l.code === value);
        if (config) {
          document.documentElement.dir = config.direction;
        }
      }
      set(value);
    },
    update
  };
}

export const locale = createLocaleStore();

// Cache des traductions chargées
const translations: Record<Locale, Record<string, any>> = {
  fr: {},
  en: {},
};

let translationsLoaded = false;

// Charger les traductions
async function loadTranslations(loc: Locale): Promise<void> {
  if (Object.keys(translations[loc]).length > 0) return;
  
  try {
    const module = await import(`./locales/${loc}.json`);
    translations[loc] = module.default;
  } catch (e) {
    console.warn(`Could not load translations for locale: ${loc}`);
    // Fallback sur français
    if (loc !== 'fr') {
      await loadTranslations('fr');
      translations[loc] = translations['fr'];
    }
  }
}

// Initialiser les traductions (à appeler au démarrage)
export async function initI18n(loc?: Locale): Promise<void> {
  const targetLocale = loc || get(locale);
  await loadTranslations(targetLocale);
  await loadTranslations('fr'); // Toujours charger FR comme fallback
  translationsLoaded = true;
  if (loc) {
    locale.set(loc);
  }
}

// Changer la langue
export async function setLocale(loc: Locale): Promise<void> {
  await loadTranslations(loc);
  locale.set(loc);
}

// Fonction pour récupérer une valeur imbriquée
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.');
  let result: any = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  
  return typeof result === 'string' ? result : undefined;
}

// Interpoler les paramètres dans la chaîne
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

// Store dérivé pour la fonction de traduction
export const t = derived(locale, ($locale) => {
  return (key: string, params?: Record<string, string | number>): string => {
    // Chercher dans la locale actuelle
    let value = getNestedValue(translations[$locale], key);
    
    // Fallback sur français
    if (value === undefined && $locale !== 'fr') {
      value = getNestedValue(translations['fr'], key);
    }
    
    // Si toujours pas trouvé, retourner la clé
    if (value === undefined) {
      console.warn(`Missing translation: ${key}`);
      return key;
    }
    
    return interpolate(value, params);
  };
});

// Fonction synchrone pour usage hors composants (serveur)
export function translate(key: string, params?: Record<string, string | number>, loc?: Locale): string {
  const currentLocale = loc || get(locale);
  
  let value = getNestedValue(translations[currentLocale], key);
  
  if (value === undefined && currentLocale !== 'fr') {
    value = getNestedValue(translations['fr'], key);
  }
  
  if (value === undefined) {
    return key;
  }
  
  return interpolate(value, params);
}

// Helper pour obtenir la config de la locale actuelle
export const localeConfig = derived(locale, ($locale) => {
  return availableLocales.find(l => l.code === $locale) || availableLocales[0];
});
