<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, loadUser, setUser } from '$lib/stores/userStore.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    ChevronLeft, User, Trophy, Flame, Target, Award, BookOpen, 
    Settings, Shield, Download, Trash2, Mail, Lock, Bell, 
    Moon, Sun, Volume2, VolumeX, Eye, Type, Globe, GraduationCap,
    ChevronRight, Star, Zap, Calendar, BarChart3, Clock, 
    CheckCircle2, AlertCircle, TrendingUp, Activity, Users, Baby,
    Camera, Save, Loader2, Pencil, CreditCard, Crown
  } from 'lucide-svelte';
  import { BadgesGrid } from '$lib/components/badges';
  import AvatarPicker from '$lib/components/AvatarPicker.svelte';
  import SubscriptionManager from '$lib/components/SubscriptionManager.svelte';
  import type { SubscriptionPlan, BillingCycle } from '$lib/types/subscription';

  // Types
  interface Badge {
    id: string;
    slug?: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity?: string;
    points: number;
    earned_at?: string;
  }

  interface Competence {
    id: string;
    code: string;
    name: string;
    description?: string;
    color?: string;
    matiere_slug?: string;
    mastery_level: number;
    correct_answers: number;
    total_answers: number;
  }

  interface ActivityItem {
    id: string;
    type: 'quiz_completed' | 'badge_earned' | 'level_up';
    title: string;
    subtitle?: string;
    date: string;
    score?: number;
    icon: string;
  }

  // State
  let loading = $state(true);
  let activeTab = $state<'cursus' | 'stats' | 'settings' | 'subscription'>('cursus');
  
  // Subscription data
  let subscriptionPlan = $state<SubscriptionPlan>('free');
  let subscriptionBillingCycle = $state<BillingCycle>('monthly');
  let subscriptionExpiresAt = $state<string | null>(null);
  
  // User data
  let userStats = $state({
    totalQuizzes: 0,
    avgAccuracy: 0,
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    totalBadges: 0,
    totalCorrect: 0,
    totalAnswers: 0
  });
  
  // Education data
  let cycles = $state<any[]>([]);
  let grades = $state<any[]>([]);
  let educationSystems = $state<any[]>([]);
  let languages = $state<any[]>([]);
  
  // Form data
  let selectedSystem = $state('');
  let selectedCycle = $state('');
  let selectedGrade = $state('');
  let selectedLanguage = $state('');
  
  // Badges & Competences
  let earnedBadges = $state<Badge[]>([]);
  let availableBadges = $state<Badge[]>([]);
  let competences = $state<Competence[]>([]);
  let competencesByMatiere = $state<Record<string, Competence[]>>({});
  
  // Activity
  let recentActivity = $state<ActivityItem[]>([]);
  
  // Settings
  let darkMode = $state(true);
  let dyslexiaMode = $state(false);
  let voiceEnabled = $state(false);
  let notificationsEnabled = $state(true);
  let notificationTime = $state('18:00');
  
  // Account management
  let showDeleteModal = $state(false);
  let deleteConfirmText = $state('');
  
  // Profile form data
  let showAvatarPicker = $state(false);
  let profileNom = $state('');
  let profilePrenom = $state('');
  let profileIdentifiant = $state('');
  let profileDateNaissance = $state('');
  let profileIdentifiantTuteur = $state('');
  let savingProfile = $state(false);
  let profileSaved = $state(false);
  
  // Couleurs d'avatar preset
  const presetColors = [
    'bg-gradient-to-br from-amber-400 to-orange-500',
    'bg-gradient-to-br from-blue-400 to-indigo-500',
    'bg-gradient-to-br from-green-400 to-emerald-500',
    'bg-gradient-to-br from-purple-400 to-pink-500',
    'bg-gradient-to-br from-rose-400 to-red-500',
    'bg-gradient-to-br from-cyan-400 to-teal-500',
  ];
  
  // Grades & Titles
  const honoraryTitles = [
    { minXp: 0, title: 'Apprenti', color: 'text-gray-400', bg: 'bg-gray-800' },
    { minXp: 100, title: 'Explorateur', color: 'text-green-400', bg: 'bg-green-900/50' },
    { minXp: 500, title: 'Érudit', color: 'text-blue-400', bg: 'bg-blue-900/50' },
    { minXp: 1500, title: 'Savant', color: 'text-purple-400', bg: 'bg-purple-900/50' },
    { minXp: 3000, title: 'Maître du Savoir', color: 'text-amber-400', bg: 'bg-amber-900/50' },
    { minXp: 6000, title: 'Grand Sage', color: 'text-rose-400', bg: 'bg-rose-900/50' },
    { minXp: 10000, title: 'Légende', color: 'text-amber-300', bg: 'bg-gradient-to-r from-amber-900/50 to-orange-900/50' },
  ];

  let currentTitle = $derived(() => {
    const xp = userStats.totalXp || 0;
    for (let i = honoraryTitles.length - 1; i >= 0; i--) {
      if (xp >= honoraryTitles[i].minXp) return honoraryTitles[i];
    }
    return honoraryTitles[0];
  });

  let nextTitle = $derived(() => {
    const xp = userStats.totalXp || 0;
    for (const title of honoraryTitles) {
      if (xp < title.minXp) return title;
    }
    return null;
  });

  let progressToNextTitle = $derived(() => {
    const current = currentTitle();
    const next = nextTitle();
    if (!next) return 100;
    const xp = userStats.totalXp || 0;
    return Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100);
  });

  let filteredGrades = $derived(
    selectedCycle 
      ? grades.filter(g => g.cycle?.toString()?.includes(selectedCycle) || g.cycle_id?.toString()?.includes(selectedCycle))
      : grades
  );

  onMount(async () => {
    loadUser();
    await new Promise(r => setTimeout(r, 50));
    
    if (!$currentUser) {
      goto('/');
      return;
    }
    
    await Promise.all([
      loadUserStats(),
      loadEducationData(),
      loadBadges(),
      loadCompetences(),
      loadActivity(),
      loadSubscription()
    ]);
    
    // Set current values from user
    selectedSystem = $currentUser.education_system?.toString()?.split(':')[1] || '';
    selectedCycle = $currentUser.current_cycle?.toString()?.split(':')[1] || '';
    selectedGrade = $currentUser.current_grade?.toString()?.split(':')[1] || '';
    selectedLanguage = $currentUser.preferred_language?.toString()?.split(':')[1] || 'fr';
    
    // Initialiser le formulaire de profil
    initProfileForm();
    
    loading = false;
  });

  async function loadSubscription() {
    try {
      const res = await fetch('/api/user/subscription');
      if (res.ok) {
        const data = await res.json();
        subscriptionPlan = data.current_plan || 'free';
        subscriptionBillingCycle = data.billing_cycle || 'monthly';
        subscriptionExpiresAt = data.expires_at || null;
      }
    } catch (e) {
      console.error('Erreur chargement abonnement:', e);
    }
  }

  async function loadUserStats() {
    try {
      const userId = $currentUser?.id;
      if (!userId) return;
      
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/stats`);
      if (res.ok) {
        const data = await res.json();
        userStats = {
          totalQuizzes: data.totalQuizzes || 0,
          avgAccuracy: data.avgAccuracy || 0,
          totalXp: $currentUser?.total_xp || data.totalXp || 0,
          level: $currentUser?.level || data.level || 1,
          currentStreak: $currentUser?.current_streak || data.currentStreak || 0,
          bestStreak: $currentUser?.best_streak || data.bestStreak || 0,
          totalBadges: data.totalBadges || 0,
          totalCorrect: data.totalCorrect || 0,
          totalAnswers: data.totalAnswers || 0
        };
      }
    } catch (e) {
      console.error('Erreur chargement stats:', e);
    }
  }

  async function loadEducationData() {
    try {
      // 1. Charger les systèmes éducatifs d'abord
      const systemsRes = await fetch('/api/education/systems');
      if (systemsRes.ok) {
        educationSystems = await systemsRes.json();
        console.log('Systèmes éducatifs chargés:', educationSystems);
      }
      
      // 2. Charger les langues
      languages = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'de', name: 'Deutsch' }
      ];
      
      // 3. Extraire le système de l'utilisateur
      const userSystemRaw = $currentUser?.education_system?.toString() || '';
      const userSystem = userSystemRaw.includes(':') ? userSystemRaw.split(':')[1] : userSystemRaw;
      console.log('Système utilisateur:', userSystem);
      
      // 4. Charger les cycles pour ce système
      if (userSystem) {
        const cyclesRes = await fetch(`/api/education/cycles?system=${userSystem}`);
        if (cyclesRes.ok) {
          cycles = await cyclesRes.json();
          console.log('Cycles chargés:', cycles);
        } else {
          console.error('Erreur chargement cycles:', await cyclesRes.text());
        }
      }
      
      // 5. Charger les grades pour le cycle de l'utilisateur  
      const userCycleRaw = $currentUser?.current_cycle?.toString() || '';
      const userCycle = userCycleRaw.includes(':') ? userCycleRaw.split(':')[1] : userCycleRaw;
      console.log('Cycle utilisateur:', userCycle);
      
      if (userCycle) {
        const gradesRes = await fetch(`/api/education/grades?cycle=${userCycle}`);
        if (gradesRes.ok) {
          grades = await gradesRes.json();
          console.log('Grades chargés:', grades);
        } else {
          console.error('Erreur chargement grades:', await gradesRes.text());
        }
      }
    } catch (e) {
      console.error('Erreur chargement données éducatives:', e);
    }
  }

  async function loadBadges() {
    try {
      const userId = $currentUser?.id;
      if (!userId) return;
      
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/badges`);
      if (res.ok) {
        const data = await res.json();
        earnedBadges = data.earned || [];
        availableBadges = data.available || [];
      }
    } catch (e) {
      console.error('Erreur chargement badges:', e);
    }
  }

  async function loadCompetences() {
    try {
      const userId = $currentUser?.id;
      if (!userId) return;
      
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/competences`);
      if (res.ok) {
        const data = await res.json();
        competences = data.competences || [];
        competencesByMatiere = data.byMatiere || {};
      }
    } catch (e) {
      console.error('Erreur chargement compétences:', e);
    }
  }

  async function loadActivity() {
    try {
      const userId = $currentUser?.id;
      if (!userId) return;
      
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/activity`);
      if (res.ok) {
        const data = await res.json();
        recentActivity = data.activities || [];
      }
    } catch (e) {
      console.error('Erreur chargement activité:', e);
    }
  }

  async function handleSystemChange() {
    // Réinitialiser cycle et grade
    selectedCycle = '';
    selectedGrade = '';
    cycles = [];
    grades = [];
    
    if (selectedSystem) {
      try {
        const cyclesRes = await fetch(`/api/education/cycles?system=${selectedSystem}`);
        if (cyclesRes.ok) {
          cycles = await cyclesRes.json();
        }
      } catch (e) {
        console.error('Erreur chargement cycles:', e);
      }
    }
    
    await saveEducationSettings();
  }

  async function handleCycleChange() {
    // Réinitialiser grade
    selectedGrade = '';
    grades = [];
    
    if (selectedCycle) {
      try {
        const gradesRes = await fetch(`/api/education/grades?cycle=${selectedCycle}`);
        if (gradesRes.ok) {
          grades = await gradesRes.json();
        }
      } catch (e) {
        console.error('Erreur chargement grades:', e);
      }
    }
    
    await saveEducationSettings();
  }

  async function saveEducationSettings() {
    try {
      const res = await fetch('/api/user/update-education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educationSystem: selectedSystem,
          cycle: selectedCycle,
          grade: selectedGrade,
          language: selectedLanguage
        })
      });
      if (res.ok) {
        loadUser();
      }
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
    }
  }

  async function exportData() {
    try {
      const userId = $currentUser?.id;
      if (!userId) return;
      
      const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
      const res = await fetch(`/api/users/${cleanId}/export`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kweez-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Erreur export:', e);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (res.ok) {
        goto('/');
      }
    } catch (e) {
      console.error('Erreur suppression:', e);
    }
  }

  function getAvatarInitials(name?: string, email?: string): string {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || '??';
  }

  function getMasteryColor(level: number): string {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-lime-500';
    if (level >= 40) return 'bg-amber-500';
    if (level >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  }

  // Calculer l'âge à partir de la date de naissance
  function calculateAge(dateNaissance?: string): number | null {
    if (!dateNaissance) return null;
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  
  // Âge calculé réactif
  let userAge = $derived(calculateAge(profileDateNaissance || $currentUser?.date_naissance));
  
  // Initialiser les champs de profil depuis l'utilisateur
  function initProfileForm() {
    if ($currentUser) {
      profileNom = $currentUser.nom || '';
      profilePrenom = $currentUser.prenom || '';
      profileIdentifiant = $currentUser.identifiant || '';
      profileDateNaissance = $currentUser.date_naissance || '';
      profileIdentifiantTuteur = $currentUser.identifiant_tuteur || '';
    }
  }
  
  // Sauvegarder le profil
  async function saveProfile() {
    savingProfile = true;
    profileSaved = false;
    
    try {
      const userId = $currentUser?.id;
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-Id': userId } : {})
        },
        body: JSON.stringify({
          userId: userId,
          nom: profileNom,
          prenom: profilePrenom,
          identifiant: profileIdentifiant,
          date_naissance: profileDateNaissance || null,
          identifiant_tuteur: profileIdentifiantTuteur || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Mettre à jour le store utilisateur
        if (data.user) {
          setUser(data.user);
        }
        profileSaved = true;
        setTimeout(() => profileSaved = false, 3000);
      } else {
        console.error('Erreur sauvegarde profil');
      }
    } catch (e) {
      console.error('Erreur sauvegarde profil:', e);
    } finally {
      savingProfile = false;
    }
  }
  
  // Gérer la sélection d'avatar
  function handleAvatarSelect(avatarUrl: string) {
    // Mettre à jour le store avec le nouvel avatar
    if ($currentUser) {
      setUser({ ...$currentUser, avatar_url: avatarUrl });
    }
  }
  
  // Parse un avatar preset (emoji:🐻:2 -> { emoji, colorIndex })
  function parseAvatarPreset(avatarUrl?: string | null): { emoji: string; colorIndex: number } | null {
    if (!avatarUrl || !avatarUrl.startsWith('emoji:')) return null;
    const parts = avatarUrl.split(':');
    if (parts.length >= 3) {
      return { emoji: parts[1], colorIndex: parseInt(parts[2]) || 0 };
    }
    return null;
  }
</script>

<svelte:head>
  <title>Mon Profil - Kweez</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <!-- Grid Background -->
  <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
  
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <button
          onclick={() => goto('/dashboard')}
          class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft class="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 class="text-lg font-semibold">Mon Profil</h1>
        <div class="w-20"></div>
      </div>
    </div>
  </header>

  {#if loading}
    <div class="flex items-center justify-center py-32">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>
  {:else}
    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid lg:grid-cols-[320px_1fr] gap-8">
        
        <!-- LEFT COLUMN: Identity Card -->
        <div class="space-y-6">
          <!-- Avatar & Title Card -->
          <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 text-center relative overflow-hidden">
            <!-- Decorative gradient -->
            <div class="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Avatar -->
            <div class="relative inline-block mb-4">
              {#if parseAvatarPreset($currentUser?.avatar_url)}
                {@const avatarPreset = parseAvatarPreset($currentUser?.avatar_url)}
                {#if avatarPreset}
                  <!-- Avatar emoji prédéfini -->
                  <div class="w-28 h-28 rounded-full {presetColors[avatarPreset.colorIndex]} flex items-center justify-center text-5xl shadow-lg shadow-amber-500/25">
                    {avatarPreset.emoji}
                  </div>
                {/if}
              {:else if $currentUser?.avatar_url}
                <!-- Avatar photo uploadée -->
                <img 
                  src={$currentUser.avatar_url} 
                  alt="Avatar" 
                  class="w-28 h-28 rounded-full object-cover shadow-lg shadow-amber-500/25"
                />
              {:else}
                <!-- Avatar par défaut (initiales) -->
                <div class="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl font-bold text-gray-900 shadow-lg shadow-amber-500/25">
                  {getAvatarInitials($currentUser?.name, $currentUser?.email)}
                </div>
              {/if}
              <button 
                onclick={() => showAvatarPicker = true}
                class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                title="Changer l'avatar"
              >
                <Camera class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Name -->
            <h2 class="text-xl font-bold mb-1">{$currentUser?.name || $currentUser?.email}</h2>
            
            <!-- Honorary Title -->
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full {currentTitle().bg} {currentTitle().color} text-sm font-medium mb-4">
              <Star class="w-4 h-4" />
              {currentTitle().title}
            </div>
            
            <!-- Level Progress -->
            <div class="mb-6">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-400">Niveau {userStats.level}</span>
                <span class="text-amber-400 font-medium">{userStats.totalXp} XP</span>
              </div>
              <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style="width: {progressToNextTitle()}%"
                ></div>
              </div>
              {#if nextTitle()}
                {@const next = nextTitle()}
                {#if next}
                  <p class="text-xs text-gray-500 mt-1.5">
                    Encore {next.minXp - userStats.totalXp} XP pour devenir <span class="{next.color}">{next.title}</span>
                  </p>
                {/if}
              {/if}
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-gray-800/50 rounded-xl p-3">
                <div class="flex items-center justify-center mb-1">
                  <Flame class="w-5 h-5 text-orange-400" />
                </div>
                <p class="text-xl font-bold">{userStats.currentStreak}</p>
                <p class="text-xs text-gray-500">Série</p>
              </div>
              <div class="bg-gray-800/50 rounded-xl p-3">
                <div class="flex items-center justify-center mb-1">
                  <BookOpen class="w-5 h-5 text-blue-400" />
                </div>
                <p class="text-xl font-bold">{userStats.totalQuizzes}</p>
                <p class="text-xs text-gray-500">Quiz</p>
              </div>
              <div class="bg-gray-800/50 rounded-xl p-3">
                <div class="flex items-center justify-center mb-1">
                  <Target class="w-5 h-5 text-green-400" />
                </div>
                <p class="text-xl font-bold">{userStats.avgAccuracy}%</p>
                <p class="text-xs text-gray-500">Précision</p>
              </div>
            </div>
          </div>

          <!-- Recent Badges -->
          <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2">
                <Trophy class="w-5 h-5 text-amber-400" />
                Badges récents
              </h3>
              <span class="text-sm text-gray-500">{earnedBadges.length}/{earnedBadges.length + availableBadges.length}</span>
            </div>
            
            {#if earnedBadges.length === 0}
              <p class="text-sm text-gray-500 text-center py-4">Aucun badge obtenu</p>
            {:else}
              <div class="grid grid-cols-4 gap-2">
                {#each earnedBadges.slice(0, 8) as badge}
                  <div 
                    class="aspect-square rounded-xl bg-gray-800/50 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                    title={badge.name}
                  >
                    {badge.icon}
                  </div>
                {/each}
              </div>
              {#if earnedBadges.length > 8}
                <button 
                  onclick={() => activeTab = 'stats'}
                  class="w-full mt-3 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Voir tous les badges →
                </button>
              {/if}
            {/if}
          </div>

          <!-- Best Streak -->
          <div class="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl border border-orange-800/50 p-5">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame class="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <p class="text-sm text-orange-300/70">Meilleure série</p>
                <p class="text-2xl font-bold text-orange-400">{userStats.bestStreak} jours</p>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Main Content -->
        <div class="space-y-6">
          <!-- Tab Navigation -->
          <div class="flex gap-2 bg-gray-900/50 rounded-xl p-1.5 border border-gray-800">
            <button
              onclick={() => activeTab = 'cursus'}
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all {activeTab === 'cursus' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'}"
            >
              <GraduationCap class="w-4 h-4" />
              Mon Cursus
            </button>
            <button
              onclick={() => activeTab = 'stats'}
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all {activeTab === 'stats' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'}"
            >
              <BarChart3 class="w-4 h-4" />
              Statistiques
            </button>
            <button
              onclick={() => activeTab = 'subscription'}
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all {activeTab === 'subscription' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'}"
            >
              <Crown class="w-4 h-4" />
              Abonnement
            </button>
            <button
              onclick={() => activeTab = 'settings'}
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all {activeTab === 'settings' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'}"
            >
              <Settings class="w-4 h-4" />
              Réglages
            </button>
          </div>

          <!-- TAB: Cursus -->
          {#if activeTab === 'cursus'}
            <div class="space-y-6">
              <!-- Education Settings -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                  <GraduationCap class="w-5 h-5 text-amber-400" />
                  Configuration scolaire
                </h3>
                
                <div class="grid sm:grid-cols-2 gap-4">
                  <!-- Education System -->
                  <div>
                    <label for="system-select" class="block text-sm font-medium text-gray-400 mb-2">
                      <Globe class="w-4 h-4 inline mr-1" />
                      Zone éducative
                    </label>
                    <select
                      id="system-select"
                      bind:value={selectedSystem}
                      onchange={handleSystemChange}
                      class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="">Sélectionner une zone</option>
                      {#each educationSystems as system}
                        <option value={system.id?.toString()?.split(':')[1] || system.code || system.id}>{system.name}</option>
                      {/each}
                    </select>
                  </div>

                  <!-- Cycle -->
                  <div>
                    <label for="cycle-select" class="block text-sm font-medium text-gray-400 mb-2">Cycle</label>
                    <select
                      id="cycle-select"
                      bind:value={selectedCycle}
                      onchange={handleCycleChange}
                      class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="">Sélectionner un cycle</option>
                      {#each cycles as cycle}
                        <option value={cycle.id?.toString()?.split(':')[1] || cycle.code || cycle.id}>{cycle.name}</option>
                      {/each}
                    </select>
                  </div>

                  <!-- Grade -->
                  <div>
                    <label for="grade-select" class="block text-sm font-medium text-gray-400 mb-2">Niveau / Classe</label>
                    <select
                      id="grade-select"
                      bind:value={selectedGrade}
                      onchange={saveEducationSettings}
                      class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="">Sélectionner un niveau</option>
                      {#each grades as grade}
                        <option value={grade.id?.toString()?.split(':')[1] || grade.code || grade.id}>{grade.name}</option>
                      {/each}
                    </select>
                  </div>

                  <!-- Language -->
                  <div>
                    <label for="lang-select" class="block text-sm font-medium text-gray-400 mb-2">Langue de l'interface</label>
                    <select
                      id="lang-select"
                      bind:value={selectedLanguage}
                      onchange={saveEducationSettings}
                      class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      {#each languages as lang}
                        <option value={lang.code || lang.id?.toString()?.split(':')[1]}>{lang.name}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <!-- Current Grade Display -->
                {#if $currentUser?.current_grade}
                  <div class="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <p class="text-sm text-amber-300">
                      <strong>Niveau actuel:</strong> {grades.find(g => g.id?.toString()?.includes(selectedGrade))?.name || 'Non défini'}
                    </p>
                  </div>
                {/if}
              </div>

              <!-- Recent Activity -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity class="w-5 h-5 text-amber-400" />
                  Activité récente
                </h3>
                
                {#if recentActivity.length === 0}
                  <div class="text-center py-8">
                    <Clock class="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p class="text-gray-500">Aucune activité récente</p>
                    <p class="text-sm text-gray-600 mt-1">Commencez un quiz pour voir votre historique !</p>
                  </div>
                {:else}
                  <div class="space-y-3">
                    {#each recentActivity.slice(0, 5) as activity}
                      <div class="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                        <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                          {activity.icon}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium truncate">{activity.title}</p>
                          {#if activity.subtitle}
                            <p class="text-sm text-gray-500">{activity.subtitle}</p>
                          {/if}
                        </div>
                        <div class="text-right">
                          {#if activity.score !== undefined}
                            <p class="font-medium text-amber-400">{activity.score}%</p>
                          {/if}
                          <p class="text-xs text-gray-500">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- TAB: Stats -->
          {#if activeTab === 'stats'}
            <div class="space-y-6">
              <!-- Competence Radar -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target class="w-5 h-5 text-amber-400" />
                  Radar des compétences
                </h3>
                
                {#if Object.keys(competencesByMatiere).length === 0}
                  <div class="text-center py-8">
                    <Target class="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p class="text-gray-500">Pas encore de données</p>
                    <p class="text-sm text-gray-600 mt-1">Répondez à des quiz pour évaluer vos compétences</p>
                  </div>
                {:else}
                  <!-- Competences by Subject -->
                  <div class="space-y-4">
                    {#each Object.entries(competencesByMatiere) as [matiere, comps]}
                      <div class="bg-gray-800/50 rounded-xl p-4">
                        <h4 class="font-medium mb-3 capitalize">{matiere.replace('-', ' ')}</h4>
                        <div class="space-y-2">
                          {#each comps as comp}
                            <div class="flex items-center gap-3">
                              <span class="text-xs text-gray-500 w-8">{comp.code}</span>
                              <div class="flex-1">
                                <div class="flex items-center justify-between mb-1">
                                  <span class="text-sm">{comp.name}</span>
                                  <span class="text-xs text-gray-400">{comp.mastery_level}%</span>
                                </div>
                                <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    class="h-full {getMasteryColor(comp.mastery_level)} transition-all"
                                    style="width: {comp.mastery_level}%"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- All Badges -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy class="w-5 h-5 text-amber-400" />
                  Tous les badges
                </h3>
                
                <BadgesGrid 
                  earnedBadges={earnedBadges as any} 
                  availableBadges={availableBadges as any}
                  stats={{ total: earnedBadges.length, points: earnedBadges.reduce((sum, b) => sum + (b.points || 0), 0), byCategory: {} }}
                  showAvailable={true}
                />
              </div>

              <!-- Detailed Stats -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp class="w-5 h-5 text-amber-400" />
                  Statistiques détaillées
                </h3>
                
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div class="bg-gray-800/50 rounded-xl p-4 text-center">
                    <BookOpen class="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p class="text-2xl font-bold">{userStats.totalQuizzes}</p>
                    <p class="text-sm text-gray-500">Quiz terminés</p>
                  </div>
                  <div class="bg-gray-800/50 rounded-xl p-4 text-center">
                    <CheckCircle2 class="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p class="text-2xl font-bold">{userStats.totalCorrect}</p>
                    <p class="text-sm text-gray-500">Bonnes réponses</p>
                  </div>
                  <div class="bg-gray-800/50 rounded-xl p-4 text-center">
                    <Target class="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p class="text-2xl font-bold">{userStats.avgAccuracy}%</p>
                    <p class="text-sm text-gray-500">Précision moyenne</p>
                  </div>
                  <div class="bg-gray-800/50 rounded-xl p-4 text-center">
                    <Zap class="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p class="text-2xl font-bold">{userStats.totalXp}</p>
                    <p class="text-sm text-gray-500">XP total</p>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- TAB: Subscription -->
          {#if activeTab === 'subscription'}
            <div class="space-y-6">
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Crown class="w-5 h-5 text-amber-400" />
                  Gérer mon abonnement
                </h3>
                
                <SubscriptionManager 
                  currentPlan={subscriptionPlan}
                  currentBillingCycle={subscriptionBillingCycle}
                  expiresAt={subscriptionExpiresAt}
                  onPlanChange={(plan, cycle) => { subscriptionPlan = plan; subscriptionBillingCycle = cycle; }}
                />
              </div>
            </div>
          {/if}

          <!-- TAB: Settings -->
          {#if activeTab === 'settings'}
            <div class="space-y-6">
              <!-- Personal Information -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                  <User class="w-5 h-5 text-amber-400" />
                  Informations personnelles
                </h3>
                
                <div class="space-y-4">
                  <!-- Prénom & Nom -->
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label for="prenom" class="block text-sm font-medium text-gray-400 mb-2">Prénom</label>
                      <input
                        id="prenom"
                        type="text"
                        bind:value={profilePrenom}
                        placeholder="Votre prénom"
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label for="nom" class="block text-sm font-medium text-gray-400 mb-2">Nom</label>
                      <input
                        id="nom"
                        type="text"
                        bind:value={profileNom}
                        placeholder="Votre nom"
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      />
                    </div>
                  </div>
                  
                  <!-- Identifiant -->
                  <div>
                    <label for="identifiant" class="block text-sm font-medium text-gray-400 mb-2">Identifiant / Pseudo</label>
                    <input
                      id="identifiant"
                      type="text"
                      bind:value={profileIdentifiant}
                      placeholder="Mon identifiant unique"
                      class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  
                  <!-- Email (lecture seule) -->
                  <div>
                    <label for="email-display" class="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <div class="flex items-center gap-3">
                      <input
                        id="email-display"
                        type="email"
                        value={$currentUser?.email || ''}
                        disabled
                        class="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
                      />
                      <Mail class="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  
                  <!-- Date de naissance & Âge -->
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label for="date-naissance" class="block text-sm font-medium text-gray-400 mb-2">
                        <Calendar class="w-4 h-4 inline mr-1" />
                        Date de naissance
                      </label>
                      <input
                        id="date-naissance"
                        type="date"
                        bind:value={profileDateNaissance}
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span class="block text-sm font-medium text-gray-400 mb-2">Âge</span>
                      <div class="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300" aria-label="Âge calculé">
                        {#if userAge !== null}
                          <span class="text-amber-400 font-medium">{userAge}</span> ans
                        {:else}
                          <span class="text-gray-500">Non renseigné</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Identifiant tuteur (si profile_type permet) -->
                  {#if $currentUser?.created_by_tutor || $currentUser?.profile_type === 'apprenant'}
                    <div>
                      <label for="identifiant-tuteur" class="block text-sm font-medium text-gray-400 mb-2">
                        <Users class="w-4 h-4 inline mr-1" />
                        Identifiant du tuteur
                      </label>
                      <input
                        id="identifiant-tuteur"
                        type="text"
                        bind:value={profileIdentifiantTuteur}
                        placeholder="Identifiant de votre tuteur (optionnel)"
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      />
                      <p class="text-xs text-gray-500 mt-1">Permet à votre tuteur de suivre votre progression</p>
                    </div>
                  {/if}
                  
                  <!-- Bouton Sauvegarder -->
                  <div class="pt-2">
                    <button
                      onclick={saveProfile}
                      disabled={savingProfile}
                      class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors text-gray-900"
                    >
                      {#if savingProfile}
                        <Loader2 class="w-5 h-5 animate-spin" />
                        Sauvegarde...
                      {:else if profileSaved}
                        <CheckCircle2 class="w-5 h-5" />
                        Sauvegardé !
                      {:else}
                        <Save class="w-5 h-5" />
                        Sauvegarder les modifications
                      {/if}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Accessibility -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Eye class="w-5 h-5 text-amber-400" />
                  Préférences & Accessibilité
                </h3>
                
                <div class="space-y-4">
                  <!-- Dark Mode -->
                  <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <Moon class="w-5 h-5 text-indigo-400" />
                      <div>
                        <p class="font-medium">Mode sombre</p>
                        <p class="text-sm text-gray-500">Réduire la fatigue visuelle</p>
                      </div>
                    </div>
                    <button
                      aria-label="Activer ou désactiver le mode sombre"
                      onclick={() => darkMode = !darkMode}
                      class="relative w-12 h-6 rounded-full transition-colors {darkMode ? 'bg-amber-500' : 'bg-gray-700'}"
                    >
                      <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform {darkMode ? 'left-7' : 'left-1'}"></div>
                    </button>
                  </div>

                  <!-- Dyslexia Mode -->
                  <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <Type class="w-5 h-5 text-green-400" />
                      <div>
                        <p class="font-medium">Mode Dyslexie</p>
                        <p class="text-sm text-gray-500">Police adaptée OpenDyslexic</p>
                      </div>
                    </div>
                    <button
                      aria-label="Activer ou désactiver le mode dyslexie"
                      onclick={() => dyslexiaMode = !dyslexiaMode}
                      class="relative w-12 h-6 rounded-full transition-colors {dyslexiaMode ? 'bg-amber-500' : 'bg-gray-700'}"
                    >
                      <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform {dyslexiaMode ? 'left-7' : 'left-1'}"></div>
                    </button>
                  </div>

                  <!-- Voice -->
                  <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div class="flex items-center gap-3">
                      {#if voiceEnabled}
                        <Volume2 class="w-5 h-5 text-blue-400" />
                      {:else}
                        <VolumeX class="w-5 h-5 text-gray-500" />
                      {/if}
                      <div>
                        <p class="font-medium">Synthèse vocale</p>
                        <p class="text-sm text-gray-500">Lecture automatique des questions</p>
                      </div>
                    </div>
                    <button
                      aria-label="Activer ou désactiver la synthèse vocale"
                      onclick={() => voiceEnabled = !voiceEnabled}
                      class="relative w-12 h-6 rounded-full transition-colors {voiceEnabled ? 'bg-amber-500' : 'bg-gray-700'}"
                    >
                      <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform {voiceEnabled ? 'left-7' : 'left-1'}"></div>
                    </button>
                  </div>

                  <!-- Notifications -->
                  <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <Bell class="w-5 h-5 text-amber-400" />
                      <div>
                        <p class="font-medium">Rappels quotidiens</p>
                        <p class="text-sm text-gray-500">Notification pour s'entraîner</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      {#if notificationsEnabled}
                        <input
                          type="time"
                          bind:value={notificationTime}
                          class="px-2 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                        />
                      {/if}
                      <button
                        aria-label="Activer ou désactiver les notifications"
                        onclick={() => notificationsEnabled = !notificationsEnabled}
                        class="relative w-12 h-6 rounded-full transition-colors {notificationsEnabled ? 'bg-amber-500' : 'bg-gray-700'}"
                      >
                        <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform {notificationsEnabled ? 'left-7' : 'left-1'}"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Account Management -->
              <div class="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Shield class="w-5 h-5 text-amber-400" />
                  Gestion du compte
                </h3>
                
                <div class="space-y-4">
                  <!-- Email -->
                  <div class="p-4 bg-gray-800/50 rounded-xl">
                    <div class="flex items-center gap-3 mb-2">
                      <Mail class="w-5 h-5 text-gray-400" />
                      <p class="font-medium">Email</p>
                    </div>
                    <p class="text-gray-400 ml-8">{$currentUser?.email}</p>
                  </div>

                  <!-- Change Password -->
                  <button class="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-3">
                      <Lock class="w-5 h-5 text-gray-400" />
                      <p class="font-medium">Changer le mot de passe</p>
                    </div>
                    <ChevronRight class="w-5 h-5 text-gray-500" />
                  </button>

                  <!-- Export Data -->
                  <button 
                    onclick={exportData}
                    class="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <Download class="w-5 h-5 text-blue-400" />
                      <div class="text-left">
                        <p class="font-medium">Exporter mes données</p>
                        <p class="text-sm text-gray-500">Télécharger toutes vos données (RGPD)</p>
                      </div>
                    </div>
                    <ChevronRight class="w-5 h-5 text-gray-500" />
                  </button>

                  <!-- Delete Account -->
                  <button 
                    onclick={() => showDeleteModal = true}
                    class="w-full flex items-center justify-between p-4 bg-red-900/20 border border-red-800/50 rounded-xl hover:bg-red-900/30 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <Trash2 class="w-5 h-5 text-red-400" />
                      <div class="text-left">
                        <p class="font-medium text-red-400">Supprimer mon compte</p>
                        <p class="text-sm text-red-400/60">Cette action est irréversible</p>
                      </div>
                    </div>
                    <ChevronRight class="w-5 h-5 text-red-500/50" />
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </main>
  {/if}

  <!-- Delete Account Modal -->
  {#if showDeleteModal}
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        class="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onclick={() => showDeleteModal = false}
        onkeydown={(e) => e.key === 'Escape' && (showDeleteModal = false)}
        role="button"
        tabindex="0"
      ></div>
      
      <div class="relative bg-gray-900 rounded-2xl border border-gray-800 p-6 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle class="w-8 h-8 text-red-400" />
          </div>
          <h3 class="text-xl font-bold text-red-400">Supprimer votre compte ?</h3>
          <p class="text-gray-400 mt-2">
            Toutes vos données seront définitivement supprimées. Cette action est irréversible.
          </p>
        </div>
        
        <div class="mb-6">
          <label for="delete-confirm" class="block text-sm text-gray-400 mb-2">
            Tapez <strong class="text-red-400">SUPPRIMER</strong> pour confirmer
          </label>
          <input
            id="delete-confirm"
            type="text"
            bind:value={deleteConfirmText}
            placeholder="SUPPRIMER"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
          />
        </div>
        
        <div class="flex gap-3">
          <button
            onclick={() => { showDeleteModal = false; deleteConfirmText = ''; }}
            class="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onclick={deleteAccount}
            disabled={deleteConfirmText !== 'SUPPRIMER'}
            class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-medium transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Avatar Picker Modal -->
  <AvatarPicker 
    bind:open={showAvatarPicker}
    onClose={() => showAvatarPicker = false}
    onSelect={handleAvatarSelect}
    currentAvatar={$currentUser?.avatar_url}
  />
</div>
