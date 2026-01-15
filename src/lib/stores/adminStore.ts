import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const adminUser = writable<AdminUser | null>(null);
export const isAuthenticated = writable(false);

export function setAdminUser(user: AdminUser | null) {
  adminUser.set(user);
  isAuthenticated.set(!!user);
  
  if (browser) {
    if (user) {
      localStorage.setItem('adminUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('adminUser');
    }
  }
}

export function loadAdminUser() {
  if (!browser) return;
  
  const stored = localStorage.getItem('adminUser');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      adminUser.set(user);
      isAuthenticated.set(true);
    } catch (e) {
      console.error('Failed to parse stored admin user');
    }
  }
}

export function logout() {
  setAdminUser(null);
}
