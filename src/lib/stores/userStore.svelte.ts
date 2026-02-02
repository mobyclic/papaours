/**
 * Store utilisateur avec Svelte 5 Runes
 * Remplace l'ancienne version basée sur writable()
 */
import { browser } from '$app/environment';

export type ProfileType = 'apprenant' | 'tuteur' | 'etablissement';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  nom?: string;
  prenom?: string;
  is_admin: boolean;
  theme_color?: string;
  profile_type?: ProfileType;
  
  // Informations personnelles
  identifiant?: string;
  date_naissance?: string;
  avatar_url?: string;
  
  // Champs tuteur
  tutor_slug?: string | null;
  identifiant_tuteur?: string | null;
  
  // Champs apprenant créé par tuteur
  created_by_tutor?: string | null;
  tutor_student_id?: string | null;
  global_student_id?: string | null;
  login_code?: string | null;
  
  // Champs établissement
  created_by_establishment?: string | null;
  
  // Abonnement
  subscription_plan?: string;
  
  // Éducation & Onboarding
  onboarding_completed?: boolean;
  education_system?: string;
  current_cycle?: string;
  current_grade?: string;
  current_track?: string;
  specialties?: string[];
  preferred_language?: string;
  
  // Progression & XP
  total_xp?: number;
  level?: number;
  current_streak?: number;
  best_streak?: number;
  
  // Legacy - pour compatibilité arrière (à supprimer progressivement)
  pseudo?: string;
  classe?: string;
  classe_id?: string;
  classe_name?: string;
  user_type?: string;
  tutor_id?: string | null;
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
