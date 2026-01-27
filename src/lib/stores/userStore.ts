import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  is_admin: boolean;
  classe_id?: string;
  classe_name?: string;
}

export const currentUser = writable<AppUser | null>(null);

export function setUser(user: AppUser | null) {
  currentUser.set(user);
  if (browser) {
    if (user) {
      localStorage.setItem('appUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('appUser');
    }
  }
}

export function loadUser() {
  if (!browser) return;
  const stored = localStorage.getItem('appUser');
  if (stored) {
    try {
      currentUser.set(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse stored user');
    }
  }
}

export function logoutUser() {
  setUser(null);
}
