/**
 * Types et constantes pour le système d'abonnements
 */

export type SubscriptionPlan = 'free' | 'tutor' | 'tutor_vip' | 'establishment' | 'establishment_vip';

export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlanDetails {
  code: SubscriptionPlan;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number; // Prix annuel (10 mois = 2 mois gratuits)
  features: string[];
  is_vip: boolean;
  max_students: number | null;
  color: string;
  icon: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  free: {
    code: 'free',
    name: 'Apprenant',
    description: 'Accès gratuit pour les apprenants',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Accès à tous les quiz',
      'Suivi de progression',
      'Badges et récompenses'
    ],
    is_vip: false,
    max_students: null,
    color: 'gray',
    icon: '📚'
  },
  tutor: {
    code: 'tutor',
    name: 'Tuteur',
    description: 'Pour les parents et tuteurs',
    price_monthly: 5,
    price_yearly: 50, // 10 mois (2 mois gratuits)
    features: [
      'Toutes les fonctionnalités Apprenant',
      'Ajout jusqu\'à 5 apprenants',
      'Tableau de bord tuteur',
      'Suivi détaillé des apprenants',
      'Rapports de progression'
    ],
    is_vip: false,
    max_students: 5,
    color: 'blue',
    icon: '👨‍👩‍👧‍👦'
  },
  tutor_vip: {
    code: 'tutor_vip',
    name: 'Tuteur VIP',
    description: 'Tuteur gratuit (attribué par admin)',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Toutes les fonctionnalités Tuteur',
      'Jusqu\'à 10 apprenants',
      'Gratuit à vie',
      'Support prioritaire'
    ],
    is_vip: true,
    max_students: 10,
    color: 'purple',
    icon: '⭐'
  },
  establishment: {
    code: 'establishment',
    name: 'Établissement',
    description: 'Pour les écoles et établissements',
    price_monthly: 20,
    price_yearly: 200, // 10 mois (2 mois gratuits)
    features: [
      'Toutes les fonctionnalités Tuteur',
      'Jusqu\'à 100 élèves',
      'Gestion multi-classes',
      'Import CSV d\'élèves',
      'Statistiques établissement',
      'Personnalisation'
    ],
    is_vip: false,
    max_students: 100,
    color: 'amber',
    icon: '🏫'
  },
  establishment_vip: {
    code: 'establishment_vip',
    name: 'Établissement VIP',
    description: 'Établissement gratuit (attribué par admin)',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Toutes les fonctionnalités Établissement',
      'Élèves illimités',
      'Gratuit à vie',
      'Support prioritaire'
    ],
    is_vip: true,
    max_students: null,
    color: 'rose',
    icon: '🌟'
  }
};

/**
 * Vérifie si un plan est de type tuteur (tuteur ou tuteur_vip)
 */
export function isTutorPlan(plan: SubscriptionPlan): boolean {
  return plan === 'tutor' || plan === 'tutor_vip';
}

/**
 * Vérifie si un plan est de type établissement (establishment ou establishment_vip)
 */
export function isEstablishmentPlan(plan: SubscriptionPlan): boolean {
  return plan === 'establishment' || plan === 'establishment_vip';
}

/**
 * Vérifie si un plan est VIP
 */
export function isVipPlan(plan: SubscriptionPlan): boolean {
  return plan === 'tutor_vip' || plan === 'establishment_vip';
}

/**
 * Vérifie si un plan est payant
 */
export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return SUBSCRIPTION_PLANS[plan]?.price_monthly > 0;
}

/**
 * Calcule l'économie annuelle (2 mois gratuits)
 */
export function getYearlySavings(plan: SubscriptionPlan): number {
  const details = SUBSCRIPTION_PLANS[plan];
  if (!details || !isPaidPlan(plan)) return 0;
  return (details.price_monthly * 12) - details.price_yearly;
}

/**
 * Calcule le prix mensuel équivalent pour un abonnement annuel
 */
export function getYearlyMonthlyEquivalent(plan: SubscriptionPlan): number {
  const details = SUBSCRIPTION_PLANS[plan];
  if (!details || !isPaidPlan(plan)) return 0;
  return Math.round((details.price_yearly / 12) * 100) / 100;
}

/**
 * Obtient le nombre maximum d'élèves pour un plan
 */
export function getMaxStudents(plan: SubscriptionPlan): number | null {
  return SUBSCRIPTION_PLANS[plan]?.max_students ?? null;
}

/**
 * Vérifie si l'utilisateur peut gérer des apprenants
 */
export function canManageStudents(plan: SubscriptionPlan): boolean {
  return isTutorPlan(plan) || isEstablishmentPlan(plan);
}

/**
 * Plans disponibles pour l'auto-inscription (non-VIP)
 */
export const PUBLIC_PLANS: SubscriptionPlan[] = ['free', 'tutor', 'establishment'];

/**
 * Plans VIP (admin uniquement)
 */
export const VIP_PLANS: SubscriptionPlan[] = ['tutor_vip', 'establishment_vip'];
