/**
 * Store pour gérer la couleur de thème préférée
 * Persiste dans localStorage pour être accessible même déconnecté
 */
import { browser } from '$app/environment';

const STORAGE_KEY = 'kwizy_theme_color';

// Couleurs disponibles avec leurs classes Tailwind
export const THEME_COLORS = [
  { id: 'gray', name: 'Neutre', bg: 'bg-gray-900', text: 'text-gray-900', ring: 'ring-gray-500', light: 'bg-gray-100', preview: '#111827' },
  { id: 'blue', name: 'Bleu', bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-500', light: 'bg-blue-100', preview: '#2563eb' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-500', light: 'bg-indigo-100', preview: '#4f46e5' },
  { id: 'purple', name: 'Violet', bg: 'bg-purple-600', text: 'text-purple-600', ring: 'ring-purple-500', light: 'bg-purple-100', preview: '#9333ea' },
  { id: 'pink', name: 'Rose', bg: 'bg-pink-600', text: 'text-pink-600', ring: 'ring-pink-500', light: 'bg-pink-100', preview: '#db2777' },
  { id: 'red', name: 'Rouge', bg: 'bg-red-600', text: 'text-red-600', ring: 'ring-red-500', light: 'bg-red-100', preview: '#dc2626' },
  { id: 'orange', name: 'Orange', bg: 'bg-orange-600', text: 'text-orange-600', ring: 'ring-orange-500', light: 'bg-orange-100', preview: '#ea580c' },
  { id: 'amber', name: 'Ambre', bg: 'bg-amber-600', text: 'text-amber-600', ring: 'ring-amber-500', light: 'bg-amber-100', preview: '#d97706' },
  { id: 'green', name: 'Vert', bg: 'bg-green-600', text: 'text-green-600', ring: 'ring-green-500', light: 'bg-green-100', preview: '#16a34a' },
  { id: 'teal', name: 'Turquoise', bg: 'bg-teal-600', text: 'text-teal-600', ring: 'ring-teal-500', light: 'bg-teal-100', preview: '#0d9488' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-600', text: 'text-cyan-600', ring: 'ring-cyan-500', light: 'bg-cyan-100', preview: '#0891b2' },
] as const;

export type ThemeColorId = typeof THEME_COLORS[number]['id'];

// État réactif
let currentColorId = $state<ThemeColorId>('gray');

/**
 * Charger la couleur depuis localStorage
 */
export function loadThemeColor(): ThemeColorId {
  if (!browser) return 'gray';
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEME_COLORS.some(c => c.id === stored)) {
    currentColorId = stored as ThemeColorId;
    return currentColorId;
  }
  return 'gray';
}

/**
 * Sauvegarder la couleur dans localStorage
 */
export function setThemeColor(colorId: ThemeColorId) {
  currentColorId = colorId;
  if (browser) {
    localStorage.setItem(STORAGE_KEY, colorId);
  }
}

/**
 * Obtenir la couleur actuelle
 */
export function getThemeColor(): ThemeColorId {
  return currentColorId;
}

/**
 * Obtenir les classes CSS pour la couleur actuelle
 */
export function getThemeClasses() {
  const color = THEME_COLORS.find(c => c.id === currentColorId) || THEME_COLORS[0];
  return color;
}

/**
 * Store réactif pour la couleur actuelle
 */
export const themeColor = {
  get value() {
    return currentColorId;
  },
  set value(colorId: ThemeColorId) {
    setThemeColor(colorId);
  },
  get classes() {
    return getThemeClasses();
  },
  subscribe(fn: (value: ThemeColorId) => void) {
    fn(currentColorId);
    return $effect.root(() => {
      $effect(() => {
        fn(currentColorId);
      });
      return () => {};
    });
  }
};
