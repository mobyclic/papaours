<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setUser, loadUser, currentUser } from '$lib/stores/userStore.svelte';
  import { setAdminUser } from '$lib/stores/adminStore.svelte';
  import { loadThemeColor, setThemeColor, THEME_COLORS, type ThemeColorId } from '$lib/stores/themeStore.svelte';
  import { locale, availableLocales, type Locale } from '$lib/i18n';
  import ColorPicker from '$lib/components/ColorPicker.svelte';
  import { Eye, EyeOff, BookOpen, Trophy, Users, Sparkles, Brain, Target, Zap, ChevronRight, GraduationCap, Calculator, Globe, Atom, Palette, Music, ChevronDown, Sun, Moon, Menu, X, CheckCircle, BarChart3, Gamepad2, School, Heart, Star, Play, ArrowRight, ChevronLeft, Building2, ArrowUp, ArrowDown, Check, XIcon, Mail } from 'lucide-svelte';
  import * as InputOTP from '$lib/components/ui/input-otp';
  
  // Dark/Light mode
  let darkMode = $state(true);
  
  // Modes: login, signup, reset-password, verify-otp
  let mode = $state<'login' | 'signup' | 'reset-password' | 'verify-otp'>('login');
  let showAuthModal = $state(false);
  let showMobileMenu = $state(false);
  let resetPasswordSent = $state(false);
  
  // OTP verification state
  let otpCode = $state('');
  let otpEmail = $state('');
  let otpResendLoading = $state(false);
  let otpResendSuccess = $state(false);
  let otpResendCooldown = $state(0);
  
  // Quiz slider
  let currentQuizSlide = $state(0);
  
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

  // Interactive quiz demo state
  let demoSelectedAnswer = $state<number | null>(null);
  let demoTrueFalseAnswer = $state<boolean | null>(null);
  let demoFillBlankAnswer = $state('');
  let demoMatchingSelection = $state<string | null>(null);
  let demoMatches = $state<Record<string, string>>({});
  let demoOrderingItems = $state<string[]>([]);
  let demoShowResult = $state(false);
  let demoDraggedIndex = $state<number | null>(null);
  let demoDragOverIndex = $state<number | null>(null);
  
  // Score tracking for quiz demo
  let demoScores = $state<Record<string, boolean>>({});
  let demoQuizCompleted = $state(false);
  
  // Derived: total correct answers
  let demoTotalCorrect = $derived(Object.values(demoScores).filter(Boolean).length);
  let demoTotalQuestions = $derived(Object.keys(demoScores).length);
  
  // Matching connectors state
  let matchingContainerRef = $state<HTMLDivElement | null>(null);
  let leftRefs = $state<Record<string, HTMLElement | null>>({});
  let rightRefs = $state<Record<string, HTMLElement | null>>({});
  let matchingLines = $state<Array<{x1: number, y1: number, x2: number, y2: number, leftId: string, rightId: string}>>([]);
  
  function calculateMatchingLines() {
    if (!matchingContainerRef) return;
    
    const containerRect = matchingContainerRef.getBoundingClientRect();
    const newLines: typeof matchingLines = [];
    
    for (const [leftId, rightId] of Object.entries(demoMatches)) {
      const leftEl = leftRefs[leftId];
      const rightEl = rightRefs[rightId];
      
      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        
        newLines.push({
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top,
          leftId,
          rightId
        });
      }
    }
    
    matchingLines = newLines;
  }
  
  $effect(() => {
    // Recalculate lines when matches change
    demoMatches;
    setTimeout(calculateMatchingLines, 50);
  });
  
  function getMatchingLineColor(leftId: string): string {
    if (!demoShowResult) return '#f59e0b'; // amber-500
    const m = currentQuestions.matching;
    const expectedRight = m.pairs.find((p: {left: string, right: string}) => p.left === leftId)?.right;
    return demoMatches[leftId] === expectedRight ? '#22c55e' : '#ef4444'; // green or red
  }
  
  function removeMatch(leftId: string, e?: Event) {
    e?.stopPropagation();
    const newMatches = { ...demoMatches };
    delete newMatches[leftId];
    demoMatches = newMatches;
    demoMatchingSelection = null;
  }

  // Pool of questions for each type
  const quizPool = {
    qcm: [
      { question: 'Combien font 24 × 15 ?', subject: 'Mathématiques', level: 'CM2', options: ['340', '360', '350', '380'], correctIndex: 1 },
      { question: 'Quelle est la capitale de l\'Italie ?', subject: 'Géographie', level: '6ème', options: ['Milan', 'Rome', 'Venise', 'Florence'], correctIndex: 1 },
      { question: 'Quel est le symbole chimique de l\'or ?', subject: 'Chimie', level: '4ème', options: ['Ag', 'Au', 'Fe', 'Cu'], correctIndex: 1 },
    ],
    trueFalse: [
      { question: 'Le soleil tourne autour de la Terre.', subject: 'Sciences', level: '6ème', correctAnswer: false },
      { question: 'L\'eau bout à 100°C au niveau de la mer.', subject: 'Physique', level: 'CM2', correctAnswer: true },
      { question: 'Napoléon était empereur de France.', subject: 'Histoire', level: '4ème', correctAnswer: true },
    ],
    fillBlank: [
      { question: 'Le chat {mange} la souris dans le jardin.', subject: 'Français', level: 'CM1', correctAnswer: 'mange' },
      { question: 'La Terre tourne autour du {Soleil}.', subject: 'Sciences', level: 'CE2', correctAnswer: 'Soleil' },
      { question: 'Paris est la capitale de la {France}.', subject: 'Géographie', level: 'CE1', correctAnswer: 'France' },
    ],
    matching: [
      { question: 'Associez chaque pays à sa capitale :', subject: 'Géographie', level: '5ème', 
        pairs: [{ left: 'France', right: 'Paris' }, { left: 'Espagne', right: 'Madrid' }, { left: 'Allemagne', right: 'Berlin' }] },
      { question: 'Reliez chaque date à son événement :', subject: 'Histoire', level: '4ème',
        pairs: [{ left: '1789', right: 'Révolution française' }, { left: '1492', right: 'Découverte de l\'Amérique' }, { left: '1945', right: 'Fin de la 2nde Guerre mondiale' }] },
    ],
    ordering: [
      { question: 'Remettez ces nombres dans l\'ordre croissant :', subject: 'Mathématiques', level: 'CE2',
        items: ['15', '3', '42', '8', '27'], correctOrder: ['3', '8', '15', '27', '42'] },
      { question: 'Classez ces événements du plus ancien au plus récent :', subject: 'Histoire', level: '3ème',
        items: ['Révolution française', 'Moyen Âge', 'Antiquité', 'Renaissance'], correctOrder: ['Antiquité', 'Moyen Âge', 'Renaissance', 'Révolution française'] },
    ],
  };

  // Current random question for each type
  let currentQuestions = $state({
    qcm: quizPool.qcm[0],
    trueFalse: quizPool.trueFalse[0],
    fillBlank: quizPool.fillBlank[0],
    matching: quizPool.matching[0],
    ordering: quizPool.ordering[0],
  });

  // Quiz types for slider
  const quizTypes = ['QCM', 'Vrai/Faux', 'Texte à trous', 'Association', 'Classement'] as const;
  type QuizType = typeof quizTypes[number];

  // Current question (derived)
  let currentQuestion = $derived.by(() => {
    const type = quizTypes[currentQuizSlide];
    switch (type) {
      case 'QCM': return { ...currentQuestions.qcm, type };
      case 'Vrai/Faux': return { ...currentQuestions.trueFalse, type };
      case 'Texte à trous': return { ...currentQuestions.fillBlank, type };
      case 'Association': return { ...currentQuestions.matching, type };
      case 'Classement': return { ...currentQuestions.ordering, type };
    }
  });

  function randomizeQuestion(type: QuizType) {
    switch (type) {
      case 'QCM':
        currentQuestions.qcm = quizPool.qcm[Math.floor(Math.random() * quizPool.qcm.length)];
        break;
      case 'Vrai/Faux':
        currentQuestions.trueFalse = quizPool.trueFalse[Math.floor(Math.random() * quizPool.trueFalse.length)];
        break;
      case 'Texte à trous':
        currentQuestions.fillBlank = quizPool.fillBlank[Math.floor(Math.random() * quizPool.fillBlank.length)];
        break;
      case 'Association':
        currentQuestions.matching = quizPool.matching[Math.floor(Math.random() * quizPool.matching.length)];
        break;
      case 'Classement':
        currentQuestions.ordering = quizPool.ordering[Math.floor(Math.random() * quizPool.ordering.length)];
        break;
    }
  }

  function resetDemoState() {
    demoSelectedAnswer = null;
    demoTrueFalseAnswer = null;
    demoFillBlankAnswer = '';
    demoMatchingSelection = null;
    demoMatches = {};
    demoShowResult = false;
    demoDraggedIndex = null;
    demoDragOverIndex = null;
    // Initialize ordering with shuffled items
    const q = currentQuestions.ordering;
    demoOrderingItems = [...q.items].sort(() => Math.random() - 0.5);
  }
  
  // Full quiz reset (for replay)
  function resetFullQuiz() {
    demoScores = {};
    demoQuizCompleted = false;
    currentQuizSlide = 0;
    randomizeQuestion('QCM');
    resetDemoState();
  }
  
  // Go to next question
  function goToNextQuestion() {
    if (currentQuizSlide < quizTypes.length - 1) {
      currentQuizSlide = currentQuizSlide + 1;
      randomizeQuestion(quizTypes[currentQuizSlide]);
      resetDemoState();
    }
  }
  
  // Show final results
  function showQuizResults() {
    demoQuizCompleted = true;
  }

  function changeSlide(newIndex: number) {
    currentQuizSlide = newIndex;
    randomizeQuestion(quizTypes[newIndex]);
    resetDemoState();
  }

  // QCM: Select answer (no auto-validate)
  function handleQcmSelect(index: number) {
    if (demoShowResult) return;
    demoSelectedAnswer = index;
  }

  // QCM: Validate answer
  function validateQcm() {
    if (demoSelectedAnswer === null) return;
    const isCorrect = demoSelectedAnswer === currentQuestions.qcm.correctIndex;
    demoScores = { ...demoScores, 'QCM': isCorrect };
    demoShowResult = true;
  }

  // VraiFaux: Select answer (no auto-validate)
  function handleTrueFalseSelect(value: boolean) {
    if (demoShowResult) return;
    demoTrueFalseAnswer = value;
  }

  // VraiFaux: Validate answer
  function validateTrueFalse() {
    if (demoTrueFalseAnswer === null) return;
    const isCorrect = demoTrueFalseAnswer === currentQuestions.trueFalse.correctAnswer;
    demoScores = { ...demoScores, 'Vrai/Faux': isCorrect };
    demoShowResult = true;
  }

  // FillBlank: Validate text answer
  function validateFillBlank() {
    if (!demoFillBlankAnswer.trim()) return;
    const isCorrect = isFillBlankCorrect();
    demoScores = { ...demoScores, 'Texte à trous': isCorrect };
    demoShowResult = true;
  }

  // FillBlank: Check if answer is correct (case insensitive)
  function isFillBlankCorrect(): boolean {
    const q = currentQuestions.fillBlank;
    return demoFillBlankAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase();
  }

  // Matching: Click handler
  function handleMatchingClick(side: 'left' | 'right', id: string) {
    if (demoShowResult) return;
    if (side === 'left') {
      if (demoMatchingSelection === id) {
        demoMatchingSelection = null; // Deselect
      } else {
        demoMatchingSelection = id;
      }
    } else if (demoMatchingSelection) {
      // Remove existing match if right item was already used
      const existingLeft = Object.entries(demoMatches).find(([_, v]) => v === id)?.[0];
      if (existingLeft) {
        const newMatches = { ...demoMatches };
        delete newMatches[existingLeft];
        demoMatches = newMatches;
      }
      demoMatches = { ...demoMatches, [demoMatchingSelection]: id };
      demoMatchingSelection = null;
    }
  }

  // Matching: Validate
  function validateMatching() {
    const q = currentQuestions.matching;
    if (Object.keys(demoMatches).length < q.pairs.length) return;
    const isCorrect = isMatchingAllCorrect();
    demoScores = { ...demoScores, 'Association': isCorrect };
    demoShowResult = true;
  }

  // Matching: Check if all correct
  function isMatchingAllCorrect(): boolean {
    const q = currentQuestions.matching;
    return q.pairs.every(p => demoMatches[p.left] === p.right);
  }

  // Ordering: Move with arrows
  function handleOrderingMove(fromIndex: number, toIndex: number) {
    if (demoShowResult || toIndex < 0 || toIndex >= demoOrderingItems.length) return;
    const newOrder = [...demoOrderingItems];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    demoOrderingItems = newOrder;
  }

  // Ordering: Drag start
  function handleDragStart(index: number, e: DragEvent) {
    if (demoShowResult) return;
    demoDraggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  // Ordering: Drag over
  function handleDragOver(index: number, e: DragEvent) {
    if (demoShowResult) return;
    e.preventDefault();
    demoDragOverIndex = index;
  }

  // Ordering: Drag leave
  function handleDragLeave() {
    demoDragOverIndex = null;
  }

  // Ordering: Drop
  function handleDrop(targetIndex: number, e: DragEvent) {
    if (demoShowResult || demoDraggedIndex === null) return;
    e.preventDefault();
    const newOrder = [...demoOrderingItems];
    const [movedItem] = newOrder.splice(demoDraggedIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);
    demoOrderingItems = newOrder;
    demoDraggedIndex = null;
    demoDragOverIndex = null;
  }

  // Ordering: Drag end
  function handleDragEnd() {
    demoDraggedIndex = null;
    demoDragOverIndex = null;
  }

  // Ordering: Validate
  function validateOrdering() {
    const isCorrect = isOrderingAllCorrect();
    demoScores = { ...demoScores, 'Classement': isCorrect };
    demoShowResult = true;
  }

  // Ordering: Check if all correct
  function isOrderingAllCorrect(): boolean {
    const q = currentQuestions.ordering;
    return demoOrderingItems.every((item, i) => item === q.correctOrder[i]);
  }

  // Initialize ordering on mount
  $effect(() => {
    if (demoOrderingItems.length === 0 && currentQuestions.ordering) {
      demoOrderingItems = [...currentQuestions.ordering.items].sort(() => Math.random() - 0.5);
    }
  });

  // Core features
  const coreFeatures = [
    { 
      icon: GraduationCap, 
      title: 'Programmes officiels', 
      description: 'Contenus alignés sur les programmes de l\'Éducation Nationale, du CP à la Terminale.',
      highlight: true
    },
    { 
      icon: Brain, 
      title: 'Quiz variés', 
      description: 'QCM, Vrai/Faux, Texte à trous, Association... plusieurs formats pour varier l\'apprentissage.',
      highlight: false
    },
    { 
      icon: BarChart3, 
      title: 'Suivi détaillé', 
      description: 'Tableaux de bord pour visualiser les progrès, identifier les lacunes et célébrer les réussites.',
      highlight: false
    },
    { 
      icon: Gamepad2, 
      title: 'Parcours ludique', 
      description: 'Badges, XP, streaks et classements pour transformer l\'apprentissage en aventure ludique.',
      highlight: false
    },
    { 
      icon: Target, 
      title: 'Apprentissage adaptatif', 
      description: 'L\'algorithme s\'adapte au niveau de l\'élève pour proposer des exercices pertinents.',
      highlight: false
    },
    { 
      icon: Users, 
      title: 'Multi-utilisateurs', 
      description: 'Comptes élèves, parents et enseignants avec des fonctionnalités adaptées à chacun.',
      highlight: false
    },
  ];

  onMount(() => {
    // Check system preference for dark mode
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('kweez-theme-mode');
      if (savedMode) {
        darkMode = savedMode === 'dark';
      } else {
        darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
    
    pageThemeColor = loadThemeColor();
    loadUser();
    setTimeout(() => {
      if ($currentUser) {
        goto('/dashboard');
      } else {
        checkingAuth = false;
        setTimeout(() => {
          statsVisible = true;
          animateStats();
        }, 500);
      }
    }, 100);
  });

  function toggleDarkMode() {
    darkMode = !darkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kweez-theme-mode', darkMode ? 'dark' : 'light');
    }
  }

  function animateStats() {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    const targets = { quiz: 50, users: 1200, questions: 5000 };
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      
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

  function openAuthModal(authMode: 'login' | 'signup' | 'reset-password' | 'verify-otp') {
    mode = authMode;
    showAuthModal = true;
    authError = '';
    resetPasswordSent = false;
    otpCode = '';
    otpResendSuccess = false;
  }

  function closeAuthModal() {
    showAuthModal = false;
    authError = '';
    resetPasswordSent = false;
    otpCode = '';
    otpEmail = '';
    otpResendSuccess = false;
  }
  
  async function submitOtpVerification(e?: Event) {
    e?.preventDefault();
    if (otpCode.length !== 6) return;
    
    authLoading = true;
    authError = '';
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, code: otpCode })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        authError = data.message || 'Code invalide';
        authLoading = false;
        return;
      }
      
      // Stocker l'utilisateur et rediriger vers l'onboarding
      if (data.user) {
        setUser(data.user);
        closeAuthModal();
        goto('/onboarding');
      }
    } catch (err) {
      authError = 'Erreur de connexion au serveur';
    } finally {
      authLoading = false;
    }
  }
  
  async function resendOtpCode() {
    if (otpResendCooldown > 0) return;
    
    otpResendLoading = true;
    authError = '';
    otpResendSuccess = false;
    
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.retryAfter) {
          otpResendCooldown = data.retryAfter;
          startResendCooldown();
        }
        authError = data.message || 'Erreur lors du renvoi';
        return;
      }
      
      otpResendSuccess = true;
      otpResendCooldown = 120; // 2 minutes cooldown
      startResendCooldown();
    } catch (err) {
      authError = 'Erreur de connexion au serveur';
    } finally {
      otpResendLoading = false;
    }
  }
  
  function startResendCooldown() {
    const interval = setInterval(() => {
      otpResendCooldown--;
      if (otpResendCooldown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }
  
  async function submitResetPassword(e: Event) {
    e.preventDefault();
    authLoading = true;
    authError = '';
    
    try {
      if (!validateEmail(email)) {
        authError = 'Email invalide';
        authLoading = false;
        return;
      }
      
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        authError = data.message || 'Erreur lors de la demande';
        return;
      }
      
      resetPasswordSent = true;
    } catch (err) {
      authError = 'Erreur de connexion au serveur';
    } finally {
      authLoading = false;
    }
  }

  async function submitAuth(e: Event) {
    e.preventDefault();
    authLoading = true;
    authError = '';
    
    try {
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
        // Login: Handle unverified email - offer to resend code
        if (mode === 'login' && data.requiresVerification && data.email) {
          otpEmail = data.email;
          mode = 'verify-otp';
          otpResendSuccess = false;
          authError = '';
          authLoading = false;
          // Automatically send a new code
          resendOtpCode();
          return;
        }
        authError = data.message || 'Erreur';
        return;
      }
      
      // Signup: Switch to OTP verification mode
      if (mode === 'signup' && data.requiresVerification) {
        otpEmail = data.email || email.toLowerCase().trim();
        mode = 'verify-otp';
        authLoading = false;
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
  <main class="min-h-screen flex items-center justify-center {darkMode ? 'bg-slate-900' : 'bg-slate-50'}">
    <div class="text-center">
      <div class="animate-pulse text-5xl mb-4 font-black {darkMode ? 'text-amber-400' : 'text-amber-500'}">K</div>
      <p class="text-lg {darkMode ? 'text-slate-400' : 'text-slate-600'} font-medium">Chargement...</p>
    </div>
  </main>
{:else}
  <div class="min-h-screen transition-colors duration-300 {darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}">
    
    <!-- Sticky Header -->
    <header class="sticky top-0 z-50 {darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} border-b backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span class="text-xl font-black text-white">K</span>
            </div>
            <span class="text-xl font-semibold tracking-tight">Kweez</span>
          </div>
          
          <nav class="hidden md:flex items-center gap-1">
          </nav>
          
          <div class="flex items-center gap-2">
            <div class="relative hidden sm:block">
              <button 
                onclick={() => showLangMenu = !showLangMenu}
                onblur={() => setTimeout(() => showLangMenu = false, 150)}
                class="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors {darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}"
              >
                {#if $locale === 'fr'}
                  <svg class="w-5 h-4 rounded-sm overflow-hidden" viewBox="0 0 640 480">
                    <rect width="213.3" height="480" fill="#002654"/>
                    <rect x="213.3" width="213.4" height="480" fill="#fff"/>
                    <rect x="426.7" width="213.3" height="480" fill="#ce1126"/>
                  </svg>
                {:else}
                  <svg class="w-5 h-4 rounded-sm overflow-hidden" viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                  </svg>
                {/if}
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
              
              {#if showLangMenu}
                <div class="absolute right-0 top-full mt-2 {darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl shadow-xl py-2 min-w-[140px] z-50">
                  {#each availableLocales as lang}
                    <button
                      onclick={() => { locale.set(lang.code); showLangMenu = false; }}
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors {darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} {$locale === lang.code ? 'text-amber-500' : ''}"
                    >
                      {#if lang.code === 'fr'}
                        <svg class="w-5 h-4 rounded-sm overflow-hidden" viewBox="0 0 640 480">
                          <rect width="213.3" height="480" fill="#002654"/>
                          <rect x="213.3" width="213.4" height="480" fill="#fff"/>
                          <rect x="426.7" width="213.3" height="480" fill="#ce1126"/>
                        </svg>
                      {:else}
                        <svg class="w-5 h-4 rounded-sm overflow-hidden" viewBox="0 0 640 480">
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
              onclick={toggleDarkMode}
              class="w-10 h-10 rounded-full flex items-center justify-center transition-colors {darkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}"
              aria-label="Toggle dark mode"
            >
              {#if darkMode}
                <Sun class="w-5 h-5" />
              {:else}
                <Moon class="w-5 h-5" />
              {/if}
            </button>
            
            <button 
              onclick={() => openAuthModal('login')}
              class="hidden sm:flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-colors border-2 {darkMode ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}"
            >
              Connexion
            </button>
            <button 
              onclick={() => openAuthModal('signup')}
              class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-full transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 text-sm"
            >
              S'inscrire
            </button>
            
            <button 
              onclick={() => showMobileMenu = !showMobileMenu}
              class="md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors {darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}"
            >
              {#if showMobileMenu}
                <X class="w-5 h-5" />
              {:else}
                <Menu class="w-5 h-5" />
              {/if}
            </button>
          </div>
        </div>
        
        {#if showMobileMenu}
          <div class="md:hidden py-4 border-t {darkMode ? 'border-slate-800' : 'border-slate-200'}">
            <nav class="flex flex-col gap-1">
              <button 
                onclick={() => { openAuthModal('login'); showMobileMenu = false; }}
                class="px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors {darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}"
              >
                Connexion
              </button>
            </nav>
          </div>
        {/if}
      </div>
    </header>

    <!-- Hero Section - Google Ads Style -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-20 left-1/4 w-[600px] h-[600px] {darkMode ? 'bg-amber-500/5' : 'bg-amber-400/10'} rounded-full blur-3xl"></div>
        <div class="absolute -bottom-32 right-0 w-[500px] h-[500px] {darkMode ? 'bg-blue-500/5' : 'bg-blue-400/10'} rounded-full blur-3xl"></div>
      </div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-40 pb-20 sm:pb-32">
        <div class="max-w-5xl mx-auto text-center">
          <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
            L'école devient un <span class="text-amber-500">jeu</span>
          </h1>
          <p class="mt-8 text-xl sm:text-2xl md:text-3xl leading-relaxed {darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto">
            La plateforme de quiz éducatifs qui transforme les révisions en moments de plaisir. Du CP à la Terminale.
          </p>
          
          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onclick={() => openAuthModal('signup')}
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-full transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 text-lg"
            >
              Commencer gratuitement
              <ArrowRight class="w-5 h-5" />
            </button>
            <button 
              onclick={() => openAuthModal('login')}
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full transition-all text-lg border-2 {darkMode ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-900 hover:bg-slate-100'}"
            >
              Se connecter
            </button>
          </div>
          
          <p class="mt-6 text-sm {darkMode ? 'text-slate-500' : 'text-slate-500'}">
            Gratuit • Sans carte bancaire • Du CP à la Terminale
          </p>
        </div>
      </div>
    </section>

    <!-- Value Proposition Cards - Google Ads Style Large Icons -->
    <section class="relative py-16 sm:py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Kweez : mille et une façons d'apprendre
          </h2>
        </div>
        
        <div class="grid md:grid-cols-3 gap-12 lg:gap-16">
          <div class="text-center">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full {darkMode ? 'bg-green-500/10' : 'bg-green-50'} flex items-center justify-center mx-auto mb-6">
              <GraduationCap class="w-12 h-12 sm:w-14 sm:h-14 text-green-500" />
            </div>
            <h3 class="text-xl sm:text-2xl font-bold mb-3">Programmes officiels</h3>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg">Contenus alignés sur les programmes de l'Éducation Nationale</p>
          </div>
          
          <div class="text-center">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full {darkMode ? 'bg-amber-500/10' : 'bg-amber-50'} flex items-center justify-center mx-auto mb-6">
              <Brain class="w-12 h-12 sm:w-14 sm:h-14 text-amber-500" />
            </div>
            <h3 class="text-xl sm:text-2xl font-bold mb-3">Quiz variés</h3>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg">QCM, Vrai/Faux, Textes à trous... et plein d'autres !</p>
          </div>
          
          <div class="text-center">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full {darkMode ? 'bg-purple-500/10' : 'bg-purple-50'} flex items-center justify-center mx-auto mb-6">
              <Trophy class="w-12 h-12 sm:w-14 sm:h-14 text-purple-500" />
            </div>
            <h3 class="text-xl sm:text-2xl font-bold mb-3">Parcours ludique</h3>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg">Badges, XP, streaks et classements pour rester motivé</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section - Google Ads Style -->
    <section class="relative py-20 sm:py-32 {darkMode ? 'bg-slate-800/30' : 'bg-slate-50'}">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Une communauté qui grandit chaque jour
          </h2>
          <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto text-xl">
            Des milliers d'élèves utilisent déjà Kweez pour apprendre en s'amusant
          </p>
        </div>
        
        <div class="grid sm:grid-cols-3 gap-12 max-w-4xl mx-auto">
          <div class="text-center">
            <div class="text-6xl sm:text-7xl lg:text-8xl font-bold text-amber-500 mb-4">{quizCount}+</div>
            <div class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-xl">Quiz disponibles</div>
          </div>
          <div class="text-center">
            <div class="text-6xl sm:text-7xl lg:text-8xl font-bold text-amber-500 mb-4">{userCount.toLocaleString()}+</div>
            <div class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-xl">Élèves actifs</div>
          </div>
          <div class="text-center">
            <div class="text-6xl sm:text-7xl lg:text-8xl font-bold text-amber-500 mb-4">{questionCount.toLocaleString()}+</div>
            <div class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-xl">Questions</div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="relative py-20 sm:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <p class="text-amber-500 font-semibold text-lg mb-4">Comment ça marche</p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Apprendre n'a jamais été aussi simple
          </h2>
        </div>
        
        <div class="grid md:grid-cols-3 gap-12 lg:gap-16 max-w-5xl mx-auto">
          <div class="text-center">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 text-white text-3xl sm:text-4xl font-bold flex items-center justify-center mx-auto mb-8">1</div>
            <h3 class="text-xl sm:text-2xl font-bold mb-4">Choisis ton niveau</h3>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg">Du CP à la Terminale, sélectionne ton niveau et ta matière préférée</p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 text-white text-3xl sm:text-4xl font-bold flex items-center justify-center mx-auto mb-8">2</div>
            <h3 class="text-xl sm:text-2xl font-bold mb-4">Joue aux quiz</h3>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg">Réponds aux questions et gagne des XP. Plus tu joues, plus tu progresses !</p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 text-white text-3xl sm:text-4xl font-bold flex items-center justify-center mx-auto mb-8">3</div>
            <h3 class="text-xl sm:text-2xl font-bold mb-4">Suis ta progression</h3>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg">Visualise tes progrès, débloque des badges et compare-toi à tes amis</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section - Core Platform Features -->
    <section id="features" class="relative py-20 sm:py-32 {darkMode ? 'bg-slate-800/30' : 'bg-slate-50'}">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <p class="text-amber-500 font-semibold text-lg mb-4">Fonctionnalités</p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Tout pour réussir à l'école
          </h2>
          <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto text-xl">
            Une plateforme complète pensée pour les élèves, les parents et les enseignants
          </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {#each coreFeatures as feature, i}
            <div class="text-center">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6 {i === 0 ? 'bg-amber-100 dark:bg-amber-500/20' : i === 1 ? 'bg-blue-100 dark:bg-blue-500/20' : i === 2 ? 'bg-green-100 dark:bg-green-500/20' : i === 3 ? 'bg-purple-100 dark:bg-purple-500/20' : i === 4 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-teal-100 dark:bg-teal-500/20'}">
                <feature.icon class="w-10 h-10 sm:w-12 sm:h-12 {i === 0 ? 'text-amber-500' : i === 1 ? 'text-blue-500' : i === 2 ? 'text-green-500' : i === 3 ? 'text-purple-500' : i === 4 ? 'text-red-500' : 'text-teal-500'}" />
              </div>
              <h3 class="text-xl sm:text-2xl font-bold mb-3">{feature.title}</h3>
              <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-lg max-w-sm mx-auto">{feature.description}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Quiz Types Section with Interactive Slider -->
    <section class="relative py-20 sm:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-amber-500 font-semibold text-lg mb-4">Types de quiz</p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Plusieurs variantes de questions
          </h2>
          <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} text-xl max-w-2xl mx-auto">
            QCM, Vrai/Faux, texte à trous, association, classement... Testez par vous-même !
          </p>
        </div>
        
        <!-- Interactive Quiz Demo -->
        <div class="max-w-2xl mx-auto">
          <div class="relative {darkMode ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 sm:p-8 border {darkMode ? 'border-slate-700' : 'border-slate-200'} shadow-2xl {darkMode ? 'shadow-black/20' : 'shadow-slate-200/50'}">
            
            {#if demoQuizCompleted}
            <!-- Results View -->
            <div class="text-center">
              <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 {demoTotalCorrect === quizTypes.length ? 'bg-green-500/20' : demoTotalCorrect >= 3 ? 'bg-amber-500/20' : 'bg-red-500/20'}">
                <Trophy class="w-10 h-10 {demoTotalCorrect === quizTypes.length ? 'text-green-500' : demoTotalCorrect >= 3 ? 'text-amber-500' : 'text-red-500'}" />
              </div>
              
              <h3 class="text-2xl font-bold mb-2">Quiz terminé !</h3>
              <p class="{darkMode ? 'text-slate-400' : 'text-slate-500'} mb-6">Voici ton score :</p>
              
              <div class="text-5xl font-bold mb-2 {demoTotalCorrect === quizTypes.length ? 'text-green-500' : demoTotalCorrect >= 3 ? 'text-amber-500' : 'text-red-500'}">
                {demoTotalCorrect}/{quizTypes.length}
              </div>
              <p class="{darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mb-6">
                {demoTotalCorrect === quizTypes.length ? 'Parfait ! 🎉' : demoTotalCorrect >= 3 ? 'Bien joué ! 👍' : 'Continue à t\'entraîner ! 💪'}
              </p>
              
              <!-- Detail by question type -->
              <div class="space-y-2 mb-6 text-left">
                {#each quizTypes as type}
                  {@const result = demoScores[type]}
                  <div class="flex items-center justify-between p-3 rounded-xl {darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}">
                    <span class="font-medium">{type}</span>
                    {#if result !== undefined}
                      <span class="flex items-center gap-1 {result ? 'text-green-500' : 'text-red-500'}">
                        {#if result}
                          <Check class="w-4 h-4" />
                          Correct
                        {:else}
                          <XIcon class="w-4 h-4" />
                          Incorrect
                        {/if}
                      </span>
                    {:else}
                      <span class="text-slate-400">Non répondu</span>
                    {/if}
                  </div>
                {/each}
              </div>
              
              <div class="text-lg font-semibold text-amber-500 mb-6">
                + {demoTotalCorrect * 15} XP gagnés
              </div>
              
              <button
                onclick={resetFullQuiz}
                class="w-full py-3 px-6 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all flex items-center justify-center gap-2"
              >
                <Play class="w-5 h-5" />
                Rejouer
              </button>
            </div>
            
            {:else}
            
            {#each [currentQuestion] as q}
            <!-- Progress indicator -->
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-medium {darkMode ? 'text-slate-400' : 'text-slate-500'}">
                Question {currentQuizSlide + 1}/{quizTypes.length}
              </span>
              <div class="flex gap-1">
                {#each quizTypes as _, i}
                  <div class="w-2 h-2 rounded-full transition-all {i < currentQuizSlide ? (demoScores[quizTypes[i]] ? 'bg-green-500' : 'bg-red-500') : i === currentQuizSlide ? 'bg-amber-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'}"></div>
                {/each}
              </div>
            </div>
            
            <!-- Header -->
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 rounded-2xl {darkMode ? 'bg-amber-500/20' : 'bg-amber-100'} flex items-center justify-center">
                <GraduationCap class="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div class="font-semibold">{q.type}</div>
                <div class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'}">{q.subject} - {q.level}</div>
              </div>
            </div>
            
            <!-- Question -->
            <div class="p-5 rounded-2xl {darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} border {darkMode ? 'border-slate-700' : 'border-slate-200'} mb-4">
              {#if q.type === 'Texte à trous'}
                {@const fb = currentQuestions.fillBlank}
                {@const questionParts = fb.question.split(/\{[^}]+\}/)}
                <div class="text-lg leading-relaxed">
                  {questionParts[0]}{#if demoShowResult}<span class="inline-flex items-center px-3 py-1 rounded-lg {isFillBlankCorrect() ? 'bg-green-500' : 'bg-red-500'} text-white font-medium mx-1">{demoFillBlankAnswer || '___'}</span>{#if !isFillBlankCorrect()}<span class="text-green-500 ml-2">({fb.correctAnswer})</span>{/if}{:else}<input 
                    type="text" 
                    bind:value={demoFillBlankAnswer}
                    placeholder="..."
                    class="inline-block w-32 px-3 py-1 mx-1 rounded-lg border-2 text-center font-medium transition-all {darkMode ? 'bg-slate-700 border-slate-600 focus:border-amber-500' : 'bg-white border-slate-200 focus:border-amber-500'} outline-none"
                  />{/if}{questionParts[1] || ''}
                </div>
              {:else}
                <div class="text-lg font-medium">{q.question}</div>
              {/if}
            </div>

            <!-- QCM Options with Radio buttons -->
            {#if q.type === 'QCM'}
              {@const qcm = currentQuestions.qcm}
              <div class="space-y-2">
                {#each qcm.options as option, i}
                  <button 
                    onclick={() => handleQcmSelect(i)}
                    disabled={demoShowResult}
                    class="w-full p-3 rounded-xl text-left transition-all border flex items-center gap-3 {demoShowResult 
                      ? (i === qcm.correctIndex 
                        ? 'bg-green-500/20 text-green-500 border-green-500' 
                        : demoSelectedAnswer === i 
                          ? 'bg-red-500/20 text-red-500 border-red-500' 
                          : darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200')
                      : demoSelectedAnswer === i
                        ? 'bg-amber-500/20 border-amber-500'
                        : darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-slate-200 hover:bg-slate-50'}"
                  >
                    <!-- Radio circle -->
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      {demoShowResult
                        ? (i === qcm.correctIndex
                          ? 'border-green-500'
                          : demoSelectedAnswer === i
                            ? 'border-red-500'
                            : darkMode ? 'border-slate-500' : 'border-slate-300')
                        : demoSelectedAnswer === i
                          ? 'border-amber-500'
                          : darkMode ? 'border-slate-500' : 'border-slate-300'}">
                      {#if demoSelectedAnswer === i || (demoShowResult && i === qcm.correctIndex)}
                        <div class="w-2.5 h-2.5 rounded-full {demoShowResult ? (i === qcm.correctIndex ? 'bg-green-500' : 'bg-red-500') : 'bg-amber-500'}"></div>
                      {/if}
                    </div>
                    <span class="font-medium">{option}</span>
                  </button>
                {/each}
              </div>
              {#if !demoShowResult}
                <button
                  onclick={validateQcm}
                  disabled={demoSelectedAnswer === null}
                  class="mt-4 w-full py-3 px-6 rounded-xl font-semibold transition-all {demoSelectedAnswer !== null ? 'bg-amber-500 hover:bg-amber-400 text-white' : darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}"
                >
                  Valider
                </button>
              {/if}
            {/if}

            <!-- Vrai/Faux with Radio style -->
            {#if q.type === 'Vrai/Faux'}
              {@const tf = currentQuestions.trueFalse}
              <div class="flex gap-4 justify-center">
                <button
                  onclick={() => handleTrueFalseSelect(true)}
                  disabled={demoShowResult}
                  class="flex-1 max-w-[180px] p-5 rounded-xl border-2 transition-all font-bold text-lg
                    {demoShowResult
                      ? (tf.correctAnswer === true
                        ? 'border-green-500 bg-green-500/20 text-green-500'
                        : demoTrueFalseAnswer === true
                          ? 'border-red-500 bg-red-500/20 text-red-500'
                          : darkMode ? 'border-slate-600' : 'border-slate-200')
                      : demoTrueFalseAnswer === true
                        ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                        : darkMode ? 'border-slate-600 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-500/50'}"
                >
                  <div class="flex items-center justify-center gap-2">
                    <!-- Radio circle -->
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center
                      {demoShowResult
                        ? (tf.correctAnswer === true ? 'border-green-500' : demoTrueFalseAnswer === true ? 'border-red-500' : darkMode ? 'border-slate-500' : 'border-slate-300')
                        : demoTrueFalseAnswer === true ? 'border-amber-500' : darkMode ? 'border-slate-500' : 'border-slate-300'}">
                      {#if demoTrueFalseAnswer === true || (demoShowResult && tf.correctAnswer === true)}
                        <div class="w-2.5 h-2.5 rounded-full {demoShowResult ? (tf.correctAnswer === true ? 'bg-green-500' : 'bg-red-500') : 'bg-amber-500'}"></div>
                      {/if}
                    </div>
                    VRAI
                  </div>
                </button>
                <button
                  onclick={() => handleTrueFalseSelect(false)}
                  disabled={demoShowResult}
                  class="flex-1 max-w-[180px] p-5 rounded-xl border-2 transition-all font-bold text-lg
                    {demoShowResult
                      ? (tf.correctAnswer === false
                        ? 'border-green-500 bg-green-500/20 text-green-500'
                        : demoTrueFalseAnswer === false
                          ? 'border-red-500 bg-red-500/20 text-red-500'
                          : darkMode ? 'border-slate-600' : 'border-slate-200')
                      : demoTrueFalseAnswer === false
                        ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                        : darkMode ? 'border-slate-600 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-500/50'}"
                >
                  <div class="flex items-center justify-center gap-2">
                    <!-- Radio circle -->
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center
                      {demoShowResult
                        ? (tf.correctAnswer === false ? 'border-green-500' : demoTrueFalseAnswer === false ? 'border-red-500' : darkMode ? 'border-slate-500' : 'border-slate-300')
                        : demoTrueFalseAnswer === false ? 'border-amber-500' : darkMode ? 'border-slate-500' : 'border-slate-300'}">
                      {#if demoTrueFalseAnswer === false || (demoShowResult && tf.correctAnswer === false)}
                        <div class="w-2.5 h-2.5 rounded-full {demoShowResult ? (tf.correctAnswer === false ? 'bg-green-500' : 'bg-red-500') : 'bg-amber-500'}"></div>
                      {/if}
                    </div>
                    FAUX
                  </div>
                </button>
              </div>
              {#if !demoShowResult}
                <button
                  onclick={validateTrueFalse}
                  disabled={demoTrueFalseAnswer === null}
                  class="mt-4 w-full py-3 px-6 rounded-xl font-semibold transition-all {demoTrueFalseAnswer !== null ? 'bg-amber-500 hover:bg-amber-400 text-white' : darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}"
                >
                  Valider
                </button>
              {/if}
            {/if}

            <!-- Texte à trous - Text input -->
            {#if q.type === 'Texte à trous' && !demoShowResult}
              <button
                onclick={validateFillBlank}
                disabled={!demoFillBlankAnswer.trim()}
                class="mt-4 w-full py-3 px-6 rounded-xl font-semibold transition-all {demoFillBlankAnswer.trim() ? 'bg-amber-500 hover:bg-amber-400 text-white' : darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}"
              >
                Valider
              </button>
            {/if}

            <!-- Association/Matching with connectors -->
            {#if q.type === 'Association'}
              {@const m = currentQuestions.matching}
              <p class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'} mb-3">
                {#if demoMatchingSelection}
                  <span class="text-amber-500 animate-pulse">Clique sur l'élément correspondant à droite</span>
                {:else if Object.keys(demoMatches).length < m.pairs.length}
                  Clique sur un élément à gauche, puis sur sa correspondance à droite
                {:else}
                  Toutes les associations sont faites !
                {/if}
              </p>
              <div class="relative" bind:this={matchingContainerRef}>
                <!-- SVG Connectors overlay -->
                <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" style="overflow: visible;">
                  {#each matchingLines as line}
                    <!-- Bézier curve connector -->
                    <path
                      d="M {line.x1} {line.y1} C {line.x1 + 30} {line.y1}, {line.x2 - 30} {line.y2}, {line.x2} {line.y2}"
                      stroke={getMatchingLineColor(line.leftId)}
                      stroke-width="3"
                      fill="none"
                      class="transition-all duration-300"
                      stroke-linecap="round"
                    />
                    <!-- Delete button on the line -->
                    {#if !demoShowResult}
                      <g 
                        class="cursor-pointer" 
                        style="pointer-events: auto;"
                        onclick={(e) => removeMatch(line.leftId, e)}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeMatch(line.leftId, e); }}
                      >
                        <circle
                          cx={line.x1}
                          cy={line.y1}
                          r="8"
                          fill={darkMode ? '#1e293b' : 'white'}
                          stroke="#ef4444"
                          stroke-width="2"
                          class="transition-all hover:fill-red-100"
                        />
                        <text
                          x={line.x1}
                          y={line.y1 + 1}
                          text-anchor="middle"
                          dominant-baseline="middle"
                          fill="#ef4444"
                          font-size="10"
                          font-weight="bold"
                        >×</text>
                      </g>
                    {:else}
                      <!-- Simple endpoint when showing result -->
                      <circle
                        cx={line.x1}
                        cy={line.y1}
                        r="4"
                        fill={getMatchingLineColor(line.leftId)}
                        class="transition-all duration-300"
                      />
                    {/if}
                    <!-- End point -->
                    <circle
                      cx={line.x2}
                      cy={line.y2}
                      r="4"
                      fill={getMatchingLineColor(line.leftId)}
                      class="transition-all duration-300"
                    />
                  {/each}
                </svg>
                
                <div class="grid grid-cols-2 gap-8">
                  <div class="space-y-2">
                    {#each m.pairs as pair, i}
                      {@const isMatched = Object.keys(demoMatches).includes(pair.left)}
                      {@const isCorrect = demoMatches[pair.left] === pair.right}
                      <button
                        bind:this={leftRefs[pair.left]}
                        onclick={() => handleMatchingClick('left', pair.left)}
                        disabled={demoShowResult}
                        class="w-full p-3 rounded-xl text-sm font-medium transition-all border text-left
                          {demoShowResult
                            ? (isMatched 
                              ? (isCorrect ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500 text-red-500')
                              : darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200')
                            : isMatched
                              ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                              : demoMatchingSelection === pair.left
                                ? 'bg-amber-500/20 border-amber-500 text-amber-500 ring-2 ring-amber-500/30'
                                : darkMode ? 'bg-slate-700 border-slate-600 hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-500/50'}"
                      >
                        {pair.left}
                      </button>
                    {/each}
                  </div>
                  <div class="space-y-2">
                    {#each m.pairs as pair, i}
                      {@const isUsed = Object.values(demoMatches).includes(pair.right)}
                      {@const matchedFrom = Object.entries(demoMatches).find(([k, v]) => v === pair.right)?.[0]}
                      {@const expectedLeft = m.pairs.find(p => p.right === pair.right)?.left}
                      {@const isCorrect = matchedFrom === expectedLeft}
                      <button
                        bind:this={rightRefs[pair.right]}
                        onclick={() => handleMatchingClick('right', pair.right)}
                        disabled={demoShowResult}
                        class="w-full p-3 rounded-xl text-sm font-medium transition-all border text-left
                          {demoShowResult
                            ? (isUsed 
                              ? (isCorrect ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500 text-red-500')
                              : darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200')
                            : isUsed
                              ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                              : darkMode ? 'bg-slate-700 border-slate-600 hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-500/50'}"
                      >
                        {pair.right}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>
              {#if !demoShowResult && Object.keys(demoMatches).length === m.pairs.length}
                <button
                  onclick={validateMatching}
                  class="mt-4 w-full py-3 px-6 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all"
                >
                  Valider
                </button>
              {/if}
            {/if}

            <!-- Classement/Ordering with drag-drop -->
            {#if q.type === 'Classement'}
              {@const o = currentQuestions.ordering}
              <p class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'} mb-3">
                Glisse-dépose ou utilise les flèches pour réorganiser
              </p>
              <div class="space-y-2">
                {#each demoOrderingItems as item, i}
                  {@const isCorrect = item === o.correctOrder[i]}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div 
                    class="flex items-center gap-2"
                    draggable={!demoShowResult}
                    ondragstart={(e) => handleDragStart(i, e)}
                    ondragover={(e) => handleDragOver(i, e)}
                    ondragleave={handleDragLeave}
                    ondrop={(e) => handleDrop(i, e)}
                    ondragend={handleDragEnd}
                  >
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold
                      {demoShowResult
                        ? (isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                        : 'bg-amber-500 text-white'}">
                      {i + 1}
                    </div>
                    <div class="flex-1 p-3 rounded-xl border transition-all
                      {demoShowResult
                        ? (isCorrect ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500 text-red-500')
                        : demoDragOverIndex === i
                          ? 'bg-amber-500/20 border-amber-500 border-dashed'
                          : demoDraggedIndex === i
                            ? 'opacity-50 border-amber-500'
                            : darkMode ? 'bg-slate-700 border-slate-600 cursor-grab' : 'bg-white border-slate-200 cursor-grab'}">
                      {item}
                    </div>
                    {#if !demoShowResult}
                      <div class="flex flex-col gap-1">
                        <button
                          onclick={() => handleOrderingMove(i, i - 1)}
                          disabled={i === 0}
                          class="p-1 rounded transition-colors {i === 0 ? 'opacity-30' : darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}"
                          aria-label="Monter"
                        >
                          <ArrowUp class="w-4 h-4" />
                        </button>
                        <button
                          onclick={() => handleOrderingMove(i, i + 1)}
                          disabled={i === demoOrderingItems.length - 1}
                          class="p-1 rounded transition-colors {i === demoOrderingItems.length - 1 ? 'opacity-30' : darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}"
                          aria-label="Descendre"
                        >
                          <ArrowDown class="w-4 h-4" />
                        </button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
              {#if !demoShowResult}
                <button
                  onclick={validateOrdering}
                  class="mt-4 w-full py-3 px-6 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all"
                >
                  Valider l'ordre
                </button>
              {/if}
            {/if}

            <!-- Result feedback -->
            {#if demoShowResult}
              {@const isCorrect = (() => {
                const type = quizTypes[currentQuizSlide];
                if (type === 'QCM') return demoSelectedAnswer === currentQuestions.qcm.correctIndex;
                if (type === 'Vrai/Faux') return demoTrueFalseAnswer === currentQuestions.trueFalse.correctAnswer;
                if (type === 'Texte à trous') return isFillBlankCorrect();
                if (type === 'Association') return isMatchingAllCorrect();
                if (type === 'Classement') return isOrderingAllCorrect();
                return false;
              })()}
              <div class="mt-6 flex items-center justify-between text-sm p-3 rounded-xl {isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}">
                <div class="flex items-center gap-2 {isCorrect ? 'text-green-500' : 'text-red-500'}">
                  {#if isCorrect}
                    <Zap class="w-4 h-4" />
                    Bonne réponse !
                  {:else}
                    <X class="w-4 h-4" />
                    Pas tout à fait...
                  {/if}
                </div>
                <div class="{isCorrect ? 'text-green-500' : 'text-red-500'} font-semibold">{isCorrect ? '+15 XP' : '+0 XP'}</div>
              </div>
              
              <!-- Next / Results button -->
              <div class="mt-4">
                {#if currentQuizSlide < quizTypes.length - 1}
                  <button
                    onclick={goToNextQuestion}
                    class="w-full py-3 px-6 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all flex items-center justify-center gap-2"
                  >
                    Question suivante
                    <ChevronRight class="w-5 h-5" />
                  </button>
                {:else}
                  <button
                    onclick={showQuizResults}
                    class="w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy class="w-5 h-5" />
                    Voir mes résultats
                  </button>
                {/if}
              </div>
            {/if}
            {/each}
            {/if}
          </div>
          
          <!-- Slider Controls (hidden when results shown) -->
          {#if !demoQuizCompleted}
          <div class="flex items-center justify-center gap-4 mt-8">
            <button 
              onclick={() => changeSlide(currentQuizSlide > 0 ? currentQuizSlide - 1 : quizTypes.length - 1)}
              class="w-12 h-12 rounded-full flex items-center justify-center transition-colors {darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200'} border"
              aria-label="Quiz précédent"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            
            <div class="flex items-center gap-2">
              {#each quizTypes as type, i}
                <button 
                  onclick={() => changeSlide(i)}
                  aria-label="Aller au quiz {type}"
                  class="w-3 h-3 rounded-full transition-all {i === currentQuizSlide ? 'bg-amber-500 w-8' : darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-300 hover:bg-slate-400'}"
                ></button>
              {/each}
            </div>
            
            <button 
              onclick={() => changeSlide(currentQuizSlide < quizTypes.length - 1 ? currentQuizSlide + 1 : 0)}
              class="w-12 h-12 rounded-full flex items-center justify-center transition-colors {darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200'} border"
              aria-label="Quiz suivant"
            >
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
          {/if}
        </div>
      </div>
    </section>

    <!-- Pricing Plans -->
    <section id="pricing" class="relative py-20 sm:py-32 {darkMode ? 'bg-slate-800/30' : 'bg-slate-50'}">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <p class="text-amber-500 font-semibold text-lg mb-4">Tarifs</p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Une solution pour chacun
          </h2>
        </div>
        
        <div class="grid md:grid-cols-3 gap-10">
          <!-- Free Plan - Students -->
          <div class="relative text-center p-10 rounded-3xl border {darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <School class="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" />
            </div>
            <h3 class="text-2xl sm:text-3xl font-bold mb-2">Élèves</h3>
            <div class="text-5xl font-bold text-amber-500 mb-2">Gratuit</div>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} mb-8">Pour toujours</p>
            <ul class="space-y-4 text-left mb-10">
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Accès à tous les quiz</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Progression personnalisée</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Badges et récompenses</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Suivi des performances</span>
              </li>
            </ul>
            <button 
              onclick={() => showAuthModal = true}
              class="w-full py-4 px-6 rounded-full text-lg font-semibold transition-all {darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}"
            >
              Commencer gratuitement
            </button>
          </div>
          
          <!-- Parent/Tutor Plan -->
          <div class="relative text-center p-10 rounded-3xl border-2 border-amber-500 {darkMode ? 'bg-slate-800' : 'bg-white shadow-2xl'} transform md:scale-105">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold">
              Populaire
            </div>
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Heart class="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
            </div>
            <h3 class="text-2xl sm:text-3xl font-bold mb-2">Parents / Tuteurs</h3>
            <div class="flex items-baseline justify-center gap-1 mb-2">
              <span class="text-5xl font-bold text-amber-500">5€</span>
              <span class="{darkMode ? 'text-slate-400' : 'text-slate-600'}">/mois</span>
            </div>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} mb-8">Par enfant supervisé</p>
            <ul class="space-y-4 text-left mb-10">
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Tout du forfait gratuit</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Tableau de bord parental</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Rapports de progression</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Objectifs personnalisés</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Support prioritaire</span>
              </li>
            </ul>
            <button 
              onclick={() => showAuthModal = true}
              class="w-full py-4 px-6 rounded-full text-lg font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all shadow-lg shadow-amber-500/25"
            >
              Essai gratuit 14 jours
            </button>
          </div>
          
          <!-- Institution Plan -->
          <div class="relative text-center p-10 rounded-3xl border {darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Building2 class="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
            </div>
            <h3 class="text-2xl sm:text-3xl font-bold mb-2">Centres de formation</h3>
            <div class="text-4xl font-bold text-amber-500 mb-2">Sur devis</div>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} mb-8">Solution sur mesure</p>
            <ul class="space-y-4 text-left mb-10">
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Licences multi-utilisateurs</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Administration centralisée</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Création de quiz personnalisés</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Intégration LMS</span>
              </li>
              <li class="flex items-start gap-4">
                <CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="{darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg">Formation & accompagnement</span>
              </li>
            </ul>
            <a 
              href="mailto:contact@kweez.fr"
              class="block w-full py-4 px-6 rounded-full text-lg font-semibold text-center transition-all {darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonial / Social Proof -->
    <section class="relative py-24 sm:py-40">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="flex justify-center gap-2 mb-10">
          {#each [1, 2, 3, 4, 5] as _}
            <Star class="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 fill-amber-400" />
          {/each}
        </div>
        <blockquote class="text-2xl sm:text-3xl md:text-4xl font-medium leading-relaxed mb-10">
          "Depuis que ma fille utilise Kweez, elle adore réviser ! Les quiz sont ludiques et alignés sur son programme. Je recommande à tous les parents."
        </blockquote>
        <div class="flex items-center justify-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <div class="text-left">
            <div class="text-xl font-bold">Sophie M.</div>
            <div class="text-lg {darkMode ? 'text-slate-400' : 'text-slate-600'}">Maman de Léa, CM2</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="relative py-24 sm:py-40 {darkMode ? 'bg-gradient-to-br from-amber-600 to-amber-500' : 'bg-gradient-to-br from-amber-500 to-amber-400'}">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8">
          Prêt à commencer ?
        </h2>
        <p class="text-white/90 text-xl sm:text-2xl mb-12 max-w-2xl mx-auto">
          Rejoins des milliers d'élèves qui apprennent en s'amusant. Inscription gratuite, résultats garantis.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button 
            onclick={() => openAuthModal('signup')}
            class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-white hover:bg-slate-100 text-amber-600 font-bold rounded-full transition-all shadow-xl text-xl"
          >
            Créer mon compte gratuit
            <ArrowRight class="w-6 h-6" />
          </button>
        </div>
        
        <p class="mt-8 text-white/70 text-lg">
          Plus de 1 200 élèves actifs • 5 000+ questions
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative border-t {darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <span class="text-xl font-black text-white">K</span>
              </div>
              <span class="text-xl font-semibold">Kweez</span>
            </div>
            <p class="{darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-sm">
              La plateforme de quiz éducatifs qui rend l'apprentissage fun et accessible à tous les élèves.
            </p>
          </div>
          
          <div>
            <h4 class="font-semibold mb-4">Liens</h4>
            <ul class="space-y-3 {darkMode ? 'text-slate-400' : 'text-slate-600'}">
              <li><a href="/about" class="hover:text-amber-500 transition-colors">À propos</a></li>
              <li><a href="/faq" class="hover:text-amber-500 transition-colors">FAQ</a></li>
              <li><a href="/cgu" class="hover:text-amber-500 transition-colors">CGU</a></li>
              <li><a href="/privacy" class="hover:text-amber-500 transition-colors">Confidentialité</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold mb-4">Contact</h4>
            <ul class="space-y-3 {darkMode ? 'text-slate-400' : 'text-slate-600'}">
              <li>contact@kweez.fr</li>
              <li><a href="/donate" class="text-amber-500 hover:text-amber-400 transition-colors">❤️ Soutenir le projet</a></li>
            </ul>
          </div>
        </div>
        
        <div class="mt-12 pt-8 border-t {darkMode ? 'border-slate-700' : 'border-slate-200'} flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm {darkMode ? 'text-slate-500' : 'text-slate-500'}">© 2025 Kweez. Tous droits réservés.</p>
          <div class="flex items-center gap-4 text-sm {darkMode ? 'text-slate-500' : 'text-slate-500'}">
            <a href="/privacy" class="hover:text-amber-500 transition-colors">Confidentialité</a>
            <span>•</span>
            <a href="/cgu" class="hover:text-amber-500 transition-colors">CGU</a>
          </div>
        </div>
      </div>
    </footer>
  </div>

  <!-- Auth Modal -->
  {#if showAuthModal}
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onclick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
      onkeydown={(e) => { if (e.key === 'Escape') closeAuthModal(); }}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="w-full max-w-md {darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-3xl shadow-2xl overflow-hidden animate-in">
        <div class="p-8 space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <span class="text-xl font-black text-white">K</span>
              </div>
              <div>
                <h2 class="text-xl font-bold">{mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Inscription' : mode === 'verify-otp' ? 'Vérification' : 'Mot de passe oublié'}</h2>
                <p class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'}">{mode === 'verify-otp' ? 'Code envoyé par email' : 'Apprendre en s\'amusant'}</p>
              </div>
            </div>
            <button 
              onclick={closeAuthModal}
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors {darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          {#if authError}
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{authError}</div>
          {/if}

          <form onsubmit={mode === 'reset-password' ? submitResetPassword : mode === 'verify-otp' ? submitOtpVerification : submitAuth} class="space-y-4">
            {#if mode === 'verify-otp'}
              <!-- OTP Verification Form -->
              <div class="text-center py-4">
                <div class="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail class="w-8 h-8 text-amber-500" />
                </div>
                <p class="{darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">
                  Entre le code à 6 chiffres envoyé à
                </p>
                <p class="text-amber-500 font-semibold mb-6">{otpEmail}</p>
                
                <div class="flex justify-center">
                  <InputOTP.Root maxlength={6} bind:value={otpCode} onComplete={submitOtpVerification}>
                    {#snippet children({ cells })}
                      <InputOTP.Group class="flex gap-2">
                        {#each cells as cell}
                          <InputOTP.Slot 
                            {cell}
                            class="w-12 h-14 text-2xl font-bold text-center rounded-xl border-2 transition-all flex items-center justify-center {darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} {cell.isActive ? 'border-amber-500 ring-2 ring-amber-500/50' : ''}"
                          />
                        {/each}
                      </InputOTP.Group>
                    {/snippet}
                  </InputOTP.Root>
                </div>
                
                {#if otpResendSuccess}
                  <p class="text-green-500 text-sm mt-4">Nouveau code envoyé !</p>
                {/if}
              </div>

              <button 
                type="submit" 
                disabled={authLoading || otpCode.length !== 6} 
                class="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
              >
                {authLoading ? 'Vérification...' : 'Valider le code'}
              </button>
              
              <div class="text-center pt-2">
                <button 
                  type="button" 
                  onclick={resendOtpCode}
                  disabled={otpResendLoading || otpResendCooldown > 0}
                  class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'} hover:text-amber-500 transition-colors disabled:opacity-50"
                >
                  {#if otpResendCooldown > 0}
                    Renvoyer le code ({otpResendCooldown}s)
                  {:else if otpResendLoading}
                    Envoi...
                  {:else}
                    <span class="text-amber-500 font-medium">Renvoyer</span> le code
                  {/if}
                </button>
              </div>
              
            {:else if mode === 'login'}
              <div>
                <label for="login-email" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Email</label>
                <input 
                  id="login-email" 
                  type="email" 
                  bind:value={email} 
                  required 
                  class="w-full h-12 px-4 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" 
                  placeholder="votre@email.com" 
                />
              </div>
              <div>
                <label for="login-password" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Mot de passe</label>
                <div class="relative">
                  <input 
                    id="login-password" 
                    type={showPassword ? 'text' : 'password'}
                    bind:value={password} 
                    required 
                    class="w-full h-12 px-4 pr-12 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onclick={() => showPassword = !showPassword}
                    class="absolute right-4 top-1/2 -translate-y-1/2 {darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}"
                  >
                    {#if showPassword}
                      <EyeOff class="w-5 h-5" />
                    {:else}
                      <Eye class="w-5 h-5" />
                    {/if}
                  </button>
                </div>
                <div class="text-right mt-2">
                  <button type="button" onclick={() => mode = 'reset-password'} class="text-sm text-amber-500 hover:text-amber-400 transition-colors">
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={authLoading} 
                class="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
              >
                {authLoading ? 'Connexion...' : 'Se connecter'}
              </button>

              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'signup'} class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'} hover:text-amber-500 transition-colors">
                  Pas encore inscrit ? <span class="text-amber-500 font-medium">S'inscrire</span>
                </button>
              </div>

            {:else if mode === 'signup'}
              <div class="grid gap-4 grid-cols-2">
                <div>
                  <label for="signup-prenom" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Prénom</label>
                  <input id="signup-prenom" type="text" bind:value={prenom} class="w-full h-12 px-4 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" placeholder="Prénom" />
                </div>
                <div>
                  <label for="signup-nom" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Nom</label>
                  <input id="signup-nom" type="text" bind:value={nom} class="w-full h-12 px-4 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" placeholder="Nom" />
                </div>
              </div>

              <div>
                <label for="signup-email" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Email <span class="text-amber-500">*</span></label>
                <input id="signup-email" type="email" bind:value={email} required class="w-full h-12 px-4 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" placeholder="votre@email.com" />
              </div>
              
              <div>
                <label for="signup-password" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Mot de passe <span class="text-amber-500">*</span></label>
                <div class="relative">
                  <input 
                    id="signup-password" 
                    type={showPassword ? 'text' : 'password'}
                    bind:value={password} 
                    required 
                    class="w-full h-12 px-4 pr-12 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onclick={() => showPassword = !showPassword}
                    class="absolute right-4 top-1/2 -translate-y-1/2 {darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}"
                  >
                    {#if showPassword}
                      <EyeOff class="w-5 h-5" />
                    {:else}
                      <Eye class="w-5 h-5" />
                    {/if}
                  </button>
                </div>
                <p class="text-xs {darkMode ? 'text-slate-500' : 'text-slate-400'} mt-2">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
              </div>
              
              <div>
                <label for="signup-password-confirm" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Confirmer <span class="text-amber-500">*</span></label>
                <input 
                  id="signup-password-confirm" 
                  type={showPassword ? 'text' : 'password'}
                  bind:value={passwordConfirm} 
                  required 
                  class="w-full h-12 px-4 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading} 
                class="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
              >
                {authLoading ? 'Inscription...' : "S'inscrire"}
              </button>

              <div class="text-center pt-2">
                <button type="button" onclick={() => mode = 'login'} class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'} hover:text-amber-500 transition-colors">
                  Déjà inscrit ? <span class="text-amber-500 font-medium">Se connecter</span>
                </button>
              </div>
            
            {:else}
              <!-- Reset Password Form -->
              {#if resetPasswordSent}
                <div class="text-center py-6">
                  <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle class="w-8 h-8 text-green-500" />
                  </div>
                  <h3 class="text-lg font-semibold mb-2">Email envoyé !</h3>
                  <p class="{darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mb-4">
                    Si un compte existe avec l'adresse <strong class="text-amber-500">{email}</strong>, 
                    tu recevras un lien pour réinitialiser ton mot de passe.
                  </p>
                  <p class="{darkMode ? 'text-slate-500' : 'text-slate-400'} text-xs">
                    Pense à vérifier tes spams si tu ne reçois rien.
                  </p>
                </div>
                <button 
                  type="button" 
                  onclick={() => mode = 'login'}
                  class="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold transition-all shadow-lg shadow-amber-500/20"
                >
                  Retour à la connexion
                </button>
              {:else}
                <p class="{darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mb-4">
                  Entre ton adresse email et nous t'enverrons un lien pour réinitialiser ton mot de passe.
                </p>
                <div>
                  <label for="reset-email" class="block text-sm font-medium {darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2">Email</label>
                  <input 
                    id="reset-email" 
                    type="email" 
                    bind:value={email} 
                    required 
                    class="w-full h-12 px-4 rounded-xl {darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" 
                    placeholder="votre@email.com" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={authLoading} 
                  class="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
                >
                  {authLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
                
                <div class="text-center pt-2">
                  <button type="button" onclick={() => mode = 'login'} class="text-sm {darkMode ? 'text-slate-400' : 'text-slate-500'} hover:text-amber-500 transition-colors">
                    <span class="text-amber-500 font-medium">← Retour</span> à la connexion
                  </button>
                </div>
              {/if}
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
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-in {
    animation: fade-in 0.2s ease-out, slide-up 0.3s ease-out;
  }
</style>
