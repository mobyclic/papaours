<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setUser, loadUser, currentUser } from '$lib/stores/userStore.svelte';
  import { setAdminUser } from '$lib/stores/adminStore.svelte';
  import { loadThemeColor, setThemeColor, THEME_COLORS, type ThemeColorId } from '$lib/stores/themeStore.svelte';
  import { locale, availableLocales, type Locale } from '$lib/i18n';
  import ColorPicker from '$lib/components/ColorPicker.svelte';
  import { Eye, EyeOff, BookOpen, Trophy, Users, Sparkles, Brain, Target, Zap, ChevronRight, GraduationCap, Calculator, Globe, Atom, Palette, Music, ChevronDown } from 'lucide-svelte';
  
  // Modes: login, signup
  let mode = $state<'login' | 'signup'>('login');
  let showAuthModal = $state(false);
  
  // Champs communs
  let nom = $state('');
  let prenom = $state('');
  let themeColorValue = $state<ThemeColorId>('blue');
  
  // Champs login/signup
  let email = $state('');
  let password = $state('');
  let passwordConfirm = $state('');
  let showPassword = $state(false);
  
  // UI State
  let authLoading = $state(false);
  let authError = $state('');
  let checkingAuth = $state(true);
  let pageThemeColor = $state<ThemeColorId>('gray');
  let showLangMenu = $state(false);

  // Stats animées
  let statsVisible = $state(false);
  let quizCount = $state(0);
  let userCount = $state(0);
  let questionCount = $state(0);

  const subjects = [
    { name: 'Mathématiques', icon: Calculator, color: 'from-blue-500 to-blue-600' },
    { name: 'Français', icon: BookOpen, color: 'from-amber-500 to-amber-600' },
    { name: 'Histoire-Géo', icon: Globe, color: 'from-emerald-500 to-emerald-600' },
    { name: 'Sciences', icon: Atom, color: 'from-purple-500 to-purple-600' },
    { name: 'Arts', icon: Palette, color: 'from-pink-500 to-pink-600' },
    { name: 'Musique', icon: Music, color: 'from-rose-500 to-rose-600' },
  ];

  const features = [
    { 
      icon: Brain, 
      title: 'Quiz Interactifs', 
      description: 'Des milliers de questions adaptées à chaque niveau scolaire',
      color: 'text-amber-400'
    },
    { 
      icon: Trophy, 
      title: 'Système de Badges', 
      description: 'Gagne des récompenses et monte dans le classement',
      color: 'text-amber-400'
    },
    { 
      icon: Target, 
      title: 'Suivi de Progression', 
      description: 'Visualise tes progrès et identifie tes points forts',
      color: 'text-amber-400'
    },
  ];

  onMount(() => {
    pageThemeColor = loadThemeColor();
    loadUser();
    setTimeout(() => {
      if ($currentUser) {
        goto('/dashboard');
      } else {
        checkingAuth = false;
        // Animation des stats
        setTimeout(() => {
          statsVisible = true;
          animateStats();
        }, 500);
      }
    }, 100);
  });

  function animateStats() {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    const targets = { quiz: 50, users: 1200, questions: 5000 };
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      quizCount = Math.round(targets.quiz * eased);
      userCount = Math.round(targets.users * eased);
      questionCount = Math.round(targets.questions * eased);
      
      if (step >= steps) clearInterval(timer);
    }, interval);
  }

  function getThemeClasses() {
    return THEME_COLORS.find(c => c.id === pageThemeColor) || THEME_COLORS[0];
  }
  
  function validatePassword(pwd: string): { valid: boolean; message: string } {
    if (pwd.length < 8) return { valid: false, message: 'Au moins 8 caractères' };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: 'Au moins une majuscule' };
    if (!/[a-z]/.test(pwd)) return { valid: false, message: 'Au moins une minuscule' };
    if (!/[0-9]/.test(pwd)) return { valid: false, message: 'Au moins un chiffre' };
    return { valid: true, message: '' };
  }
  
  function validateEmail(emailValue: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  }

  function openAuthModal(authMode: 'login' | 'signup') {
    mode = authMode;
    showAuthModal = true;
    authError = '';
  }

  function closeAuthModal() {
    showAuthModal = false;
    authError = '';
  }

  async function submitAuth(e: Event) {
    e.preventDefault();
    authLoading = true;
    authError = '';
    
    try {
      // Validation
      if (!validateEmail(email)) {
        authError = 'Email invalide';
        authLoading = false;
        return;
      }
      
      if (mode === 'signup') {
        const pwdValidation = validatePassword(password);
        if (!pwdValidation.valid) {
          authError = pwdValidation.message;
          authLoading = false;
          return;
        }
        if (password !== passwordConfirm) {
          authError = 'Les mots de passe ne correspondent pas';
          authLoading = false;
          return;
        }
      }
      
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      
      const body = mode === 'login'
        ? { email, password }
        : { 
            email,
            password,
            name: `${prenom} ${nom}`.trim() || email.split('@')[0],
            nom,
            prenom,
            theme_color: themeColorValue
          };
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) {
        authError = data.message || 'Erreur';
        return;
      }
      
      setUser(data.user);
      
      if (data.user?.theme_color) {
        setThemeColor(data.user.theme_color as ThemeColorId);
      } else if (mode === 'signup') {
        setThemeColor(themeColorValue);
      }
      
      if (data.user?.is_admin) {
        setAdminUser({ id: data.user.id, email: data.user.email, name: data.user.name, role: 'admin' });
      }
      
      // Rediriger vers onboarding si pas encore complété (pas de cycle/classe)
      if (!data.user?.onboarding_completed && !data.user?.current_cycle && !data.user?.current_grade) {
        goto('/onboarding');
      } else {
        goto('/dashboard');
      }
    } catch (err) {
      console.error(err);
      authError = 'Erreur de connexion au serveur';
    } finally {
      authLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Kweez - Apprendre en s'amusant</title>
  <meta name="description" content="Plateforme de quiz éducatifs pour tous les niveaux. Apprends, joue et progresse !">
</svelte:head>

{#if checkingAuth}
  <main class="min-h-screen flex items-center justify-center bg-gray-950">
    <div class="text-center">
      <div class="animate-pulse text-5xl mb-4 font-black text-amber-400">K</div>
      <p class="text-lg text-gray-400 font-medium">Chargement...</p>
    </div>
  </main>
{:else}
  <!-- Main Container with grid background -->
  <div class="min-h-screen bg-gray-950 text-white overflow-x-hidden">
    <!-- Grid Background -->
    <div class="fixed inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
    
    <!-- Header -->
    <header class="relative z-50 border-b border-gray-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span class="text-lg font-black text-gray-900">K</span>
            </div>
            <span class="text-xl font-bold">Kweez</span>
          </div>
          
          <!-- Nav -->
          <nav class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-gray-400 hover:text-white transition-colors text-sm">Fonctionnalités</a>
            <a href="#subjects" class="text-gray-400 hover:text-white transition-colors text-sm">Matières</a>
            <a href="/about" class="text-gray-400 hover:text-white transition-colors text-sm">À propos</a>
            <a href="/faq" class="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a>
          </nav>
          
          <!-- Auth buttons + Language -->
          <div class="flex items-center gap-3">
            <!-- Language Selector -->
            <div class="relative">
              <button 
                onclick={() => showLangMenu = !showLangMenu}
                onblur={() => setTimeout(() => showLangMenu = false, 150)}
                class="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                {#if $locale === 'fr'}
                  <svg class="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
                    <rect width="213.3" height="480" fill="#002654"/>
                    <rect x="213.3" width="213.4" height="480" fill="#fff"/>
                    <rect x="426.7" width="213.3" height="480" fill="#ce1126"/>
                  </svg>
                {:else}
                  <svg class="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                  </svg>
                {/if}
                <span class="hidden sm:inline">{availableLocales.find(l => l.code === $locale)?.nativeName}</span>
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
              
              {#if showLangMenu}
                <div class="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                  {#each availableLocales as lang}
                    <button
                      onclick={() => { locale.set(lang.code); showLangMenu = false; }}
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-800 transition-colors {$locale === lang.code ? 'text-amber-400' : 'text-gray-300'}"
                    >
                      {#if lang.code === 'fr'}
                        <svg class="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
                          <rect width="213.3" height="480" fill="#002654"/>
                          <rect x="213.3" width="213.4" height="480" fill="#fff"/>
                          <rect x="426.7" width="213.3" height="480" fill="#ce1126"/>
                        </svg>
                      {:else}
                        <svg class="w-5 h-4 rounded-sm overflow-hidden shadow-sm" viewBox="0 0 640 480">
                          <path fill="#012169" d="M0 0h640v480H0z"/>
                          <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                          <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                          <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                          <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                        </svg>
                      {/if}
                      <span>{lang.nativeName}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            
            <button 
              onclick={() => openAuthModal('login')}
              class="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Connexion
            </button>
            <button 
              onclick={() => openAuthModal('signup')}
              class="text-sm px-4 py-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-20 pb-32 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left Content -->
          <div class="relative z-10">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Apprendre devient un
              <span class="text-amber-400 relative">
                jeu d'enfant
                <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 2 150 2 198 10" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p class="mt-6 text-lg text-gray-400 max-w-lg">
              Des quiz interactifs adaptés à chaque niveau, du CP à la Terminale. 
              Progresse à ton rythme et deviens le champion de ta classe !
            </p>
            
            <div class="mt-8 flex flex-wrap gap-4">
              <button 
                onclick={() => openAuthModal('signup')}
                class="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
              >
                Commencer gratuitement
                <ChevronRight class="w-5 h-5" />
              </button>
              <a 
                href="#features"
                class="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors border border-gray-700"
              >
                <Sparkles class="w-5 h-5 text-amber-400" />
                Découvrir
              </a>
            </div>
            
            <!-- Stats -->
            <div class="mt-12 flex gap-8">
              <div class="text-center">
                <div class="text-3xl sm:text-4xl font-bold text-amber-400">
                  {quizCount}+
                </div>
                <div class="text-sm text-gray-500 mt-1">Quiz disponibles</div>
              </div>
              <div class="text-center">
                <div class="text-3xl sm:text-4xl font-bold text-amber-400">
                  {userCount.toLocaleString()}+
                </div>
                <div class="text-sm text-gray-500 mt-1">Élèves actifs</div>
              </div>
              <div class="text-center">
                <div class="text-3xl sm:text-4xl font-bold text-amber-400">
                  {questionCount.toLocaleString()}+
                </div>
                <div class="text-sm text-gray-500 mt-1">Questions</div>
              </div>
            </div>
          </div>
          
          <!-- Right Visual -->
          <div class="relative hidden lg:block">
            <div class="absolute -top-20 -right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"></div>
            <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <GraduationCap class="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div class="font-semibold">Quiz du jour</div>
                  <div class="text-sm text-gray-400">Mathématiques - CM2</div>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div class="text-sm text-gray-400 mb-2">Question 3/10</div>
                  <div class="font-medium">Combien font 24 × 15 ?</div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <button class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700">340</button>
                  <button class="p-3 bg-amber-400/20 text-amber-400 rounded-lg text-sm border border-amber-400/50 font-medium">360</button>
                  <button class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700">350</button>
                  <button class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700">380</button>
                </div>
              </div>
              
              <div class="mt-6 flex items-center justify-between text-sm">
                <div class="flex items-center gap-2 text-gray-400">
                  <Zap class="w-4 h-4 text-amber-400" />
                  Série de 5 bonnes réponses !
                </div>
                <div class="text-amber-400 font-medium">+50 XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trusted by section -->
    <section class="relative py-12 border-y border-gray-800/50 bg-gray-900/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-500 mb-8">Utilisé par des élèves et enseignants partout en France</p>
        <div class="flex flex-wrap items-center justify-center gap-8 opacity-50">
          {#each ['Académie Paris', 'Académie Lyon', 'Académie Bordeaux', 'Académie Lille', 'Académie Toulouse'] as academy}
            <div class="flex items-center gap-2 text-gray-400">
              <GraduationCap class="w-5 h-5" />
              <span class="text-sm font-medium">{academy}</span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="relative py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <span class="inline-block px-3 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 rounded-full border border-amber-400/20 mb-4">
            ✦ Fonctionnalités
          </span>
          <h2 class="text-3xl sm:text-4xl font-bold">
            Une plateforme pensée pour 
            <span class="text-amber-400">l'apprentissage</span>
          </h2>
          <p class="mt-4 text-gray-400 max-w-2xl mx-auto">
            Tout ce dont tu as besoin pour progresser et réussir tes études, de manière ludique et efficace.
          </p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-6">
          {#each features as feature}
            <div class="group p-6 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-amber-400/30 transition-all hover:-translate-y-1">
              <div class="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-amber-400/10 transition-colors">
                <feature.icon class="w-6 h-6 {feature.color}" />
              </div>
              <h3 class="text-lg font-semibold mb-2">{feature.title}</h3>
              <p class="text-gray-400 text-sm">{feature.description}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Subjects Section -->
    <section id="subjects" class="relative py-24 bg-gray-900/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <span class="inline-block px-3 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 rounded-full border border-amber-400/20 mb-4">
            ✦ Matières
          </span>
          <h2 class="text-3xl sm:text-4xl font-bold">
            Explore toutes les
            <span class="text-amber-400">matières</span>
          </h2>
          <p class="mt-4 text-gray-400 max-w-2xl mx-auto">
            Du français aux mathématiques, en passant par les sciences et l'histoire. Trouve ta matière préférée !
          </p>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each subjects as subject}
            <div class="group relative overflow-hidden rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-amber-400/30 transition-all hover:-translate-y-1">
              <div class="absolute inset-0 bg-gradient-to-br {subject.color} opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div class="relative p-6 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br {subject.color} flex items-center justify-center shadow-lg">
                  <subject.icon class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 class="font-semibold">{subject.name}</h3>
                  <p class="text-sm text-gray-400">12 quiz disponibles</p>
                </div>
                <ChevronRight class="w-5 h-5 text-gray-600 group-hover:text-amber-400 ml-auto transition-colors" />
              </div>
            </div>
          {/each}
        </div>
        
        <div class="mt-8 text-center">
          <button 
            onclick={() => openAuthModal('signup')}
            class="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Voir toutes les matières
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-24">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span class="inline-block px-3 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 rounded-full border border-amber-400/20 mb-4">
          ✦ Prêt à commencer ?
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold mb-4">
          Rejoins des milliers d'élèves
        </h2>
        <p class="text-gray-400 mb-8 max-w-xl mx-auto">
          Inscription gratuite, pas de carte bancaire requise. Commence à apprendre dès maintenant !
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onclick={() => openAuthModal('signup')}
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
          >
            Créer mon compte gratuit
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative border-t border-gray-800/50 bg-gray-900/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <!-- Logo & Description -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <span class="text-lg font-black text-gray-900">K</span>
              </div>
              <span class="text-xl font-bold">Kweez</span>
            </div>
            <p class="text-gray-400 text-sm max-w-sm">
              La plateforme de quiz éducatifs qui rend l'apprentissage fun et accessible à tous les élèves.
            </p>
          </div>
          
          <!-- Links -->
          <div>
            <h4 class="font-semibold mb-4">Liens</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="/about" class="hover:text-white transition-colors">À propos</a></li>
              <li><a href="/faq" class="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/cgu" class="hover:text-white transition-colors">CGU</a></li>
              <li><a href="/privacy" class="hover:text-white transition-colors">Confidentialité</a></li>
            </ul>
          </div>
          
          <!-- Contact -->
          <div>
            <h4 class="font-semibold mb-4">Contact</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>contact@kweez.fr</li>
              <li><a href="/donate" class="text-amber-400 hover:text-amber-300 transition-colors">❤️ Soutenir le projet</a></li>
            </ul>
          </div>
        </div>
        
        <div class="mt-12 pt-8 border-t border-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">© 2025 Kweez. Tous droits réservés.</p>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <a href="/privacy" class="hover:text-white transition-colors">Confidentialité</a>
            <span>•</span>
            <a href="/cgu" class="hover:text-white transition-colors">CGU</a>
          </div>
        </div>
      </div>
    </footer>
  </div>

  <!-- Auth Modal -->
  {#if showAuthModal}
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onclick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
      onkeydown={(e) => { if (e.key === 'Escape') closeAuthModal(); }}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-6 space-y-5">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <span class="text-lg font-black text-gray-900">K</span>
              </div>
              <div>
                <h2 class="text-lg font-bold">{mode === 'login' ? 'Connexion' : 'Inscription'}</h2>
                <p class="text-sm text-gray-400">Apprendre en s'amusant</p>
              </div>
            </div>
            <button 
              onclick={closeAuthModal}
              class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {#if authError}
            <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{authError}</div>
          {/if}

          <form onsubmit={submitAuth} class="space-y-4">
            {#if mode === 'login'}
              <!-- CONNEXION - Email/Password uniquement -->
              <div>
                <label for="login-email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input 
                  id="login-email" 
                  type="email" 
                  bind:value={email} 
                  required 
                  class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                  placeholder="votre@email.com" 
                />
              </div>
              <div>
                <label for="login-password" class="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
                <div class="relative">
                  <input 
                    id="login-password" 
                    type={showPassword ? 'text' : 'password'}
                    bind:value={password} 
                    required 
                    class="w-full h-11 px-4 pr-11 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onclick={() => showPassword = !showPassword}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {#if showPassword}
                      <EyeOff class="w-5 h-5" />
                    {:else}
                      <Eye class="w-5 h-5" />
                    {/if}
                  </button>
                </div>
                <div class="text-right mt-1">
                  <a href="/reset-password" class="text-xs text-gray-500 hover:text-amber-400 transition-colors">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={authLoading} 
                class="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold disabled:opacity-50 transition-colors"
              >
                {authLoading ? 'Connexion...' : 'Se connecter'}
              </button>

              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'signup'} class="text-sm text-gray-400 hover:text-white transition-colors">
                  Pas encore inscrit ? <span class="text-amber-400">S'inscrire</span>
                </button>
              </div>

            {:else}
              <!-- INSCRIPTION -->
              <div class="grid gap-3 grid-cols-2">
                <div>
                  <label for="signup-prenom" class="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                  <input id="signup-prenom" type="text" bind:value={prenom} class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" placeholder="Prénom" />
                </div>
                <div>
                  <label for="signup-nom" class="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                  <input id="signup-nom" type="text" bind:value={nom} class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" placeholder="Nom" />
                </div>
              </div>

              <div>
                <label for="signup-email" class="block text-sm font-medium text-gray-300 mb-1">Email <span class="text-amber-400">*</span></label>
                <input id="signup-email" type="email" bind:value={email} required class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" placeholder="votre@email.com" />
              </div>
              
              <div>
                <label for="signup-password" class="block text-sm font-medium text-gray-300 mb-1">Mot de passe <span class="text-amber-400">*</span></label>
                <div class="relative">
                  <input 
                    id="signup-password" 
                    type={showPassword ? 'text' : 'password'}
                    bind:value={password} 
                    required 
                    class="w-full h-11 px-4 pr-11 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onclick={() => showPassword = !showPassword}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {#if showPassword}
                      <EyeOff class="w-5 h-5" />
                    {:else}
                      <Eye class="w-5 h-5" />
                    {/if}
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
              </div>
              
              <div>
                <label for="signup-password-confirm" class="block text-sm font-medium text-gray-300 mb-1">Confirmer <span class="text-amber-400">*</span></label>
                <input 
                  id="signup-password-confirm" 
                  type={showPassword ? 'text' : 'password'}
                  bind:value={passwordConfirm} 
                  required 
                  class="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading} 
                class="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold disabled:opacity-50 transition-colors"
              >
                {authLoading ? 'Inscription...' : "S'inscrire"}
              </button>

              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'login'} class="text-sm text-gray-400 hover:text-white transition-colors">
                  Déjà inscrit ? <span class="text-amber-400">Se connecter</span>
                </button>
              </div>
            {/if}
          </form>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes zoom-in {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }
  .animate-in {
    animation: fade-in 0.2s ease-out, zoom-in 0.2s ease-out;
  }
</style>
