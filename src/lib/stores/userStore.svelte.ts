/**
 * Store utilisateur avec Svelte 5 Runes
 * Remplace l'ancienne version basée sur writable()
 */
import { browser } from '$app/environment';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  pseudo?: string;
  classe?: string;
  is_admin: boolean;
  classe_id?: string;
  classe_name?: string;
}

// État réactif global avec runes
let user = $state<AppUser | null>(null);

/**
 * Store utilisateur avec getter/setter réactifs
 */
export const currentUser = {
  get value() { 
    return user; 
  },
  set value(newUser: AppUser | null) {
    user = newUser;
    if (browser) {
      if (newUser) {
        localStorage.setItem('appUser', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('appUser');
      }
    }
  },
  // Pour la compatibilité avec le code existant utilisant $currentUser
  subscribe(fn: (value: AppUser | null) => void) {
    fn(user);
    return $effect.root(() => {
      $effect(() => {
        fn(user);
      });
      return () => {};
    });
  }
};

/**
 * Définir l'utilisateur courant
 */
export function setUser(newUser: AppUser | null) {
  currentUser.value = newUser;
}

/**
 * Charger l'utilisateur depuis localStorage
 */
export function loadUser() {
  if (!browser) return;
  
  const stored = localStorage.getItem('appUser');
  if (stored) {
    try {
      user = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored user');
    }
  }
}

/**
 * Déconnexion - efface l'utilisateur
 */
export function logoutUser() {
  currentUser.value = null;
}

// Dérivés utiles
export function isAdmin(): boolean {
  return user?.is_admin ?? false;
}

export function isLoggedIn(): boolean {
  return user !== null;
}

export function getUserId(): string | undefined {
  return user?.id;
}

export function getUserName(): string {
  return user?.name || user?.pseudo || 'Utilisateur';
}
