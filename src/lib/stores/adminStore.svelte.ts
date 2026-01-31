/**
 * Store admin avec Svelte 5 Runes
 * Remplace l'ancienne version basée sur writable()
 */
import { browser } from '$app/environment';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// État réactif global avec runes
let admin = $state<AdminUser | null>(null);

/**
 * Store admin avec getter/setter réactifs
 */
export const adminUser = {
  get value() { 
    return admin; 
  },
  set value(newAdmin: AdminUser | null) {
    admin = newAdmin;
    if (browser) {
      if (newAdmin) {
        localStorage.setItem('adminUser', JSON.stringify(newAdmin));
      } else {
        localStorage.removeItem('adminUser');
      }
    }
  },
  // Pour la compatibilité avec le code existant
  subscribe(fn: (value: AdminUser | null) => void) {
    fn(admin);
    return $effect.root(() => {
      $effect(() => {
        fn(admin);
      });
      return () => {};
    });
  }
};

/**
 * Vérifier si l'admin est authentifié
 */
export function isAuthenticated(): boolean {
  return admin !== null;
}

/**
 * Définir l'utilisateur admin
 */
export function setAdminUser(user: AdminUser | null) {
  adminUser.value = user;
}

/**
 * Charger l'admin depuis localStorage
 */
export function loadAdminUser() {
  if (!browser) return;
  
  const stored = localStorage.getItem('adminUser');
  if (stored) {
    try {
      admin = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored admin user');
    }
  }
}

/**
 * Déconnexion admin
 */
export function logout() {
  adminUser.value = null;
}
