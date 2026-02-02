# 🔍 Audit Complet de la Base de Données Kweez

**Date de l'audit:** 1er Février 2026  
**Base de données:** SurrealDB Cloud  
**Namespace:** `kweez` | **Database:** `dbkweez`

---

## 📊 Résumé Exécutif

| Métrique | Valeur |
|----------|--------|
| **Nombre total de tables** | 40 |
| **Tables avec données** | 22 |
| **Tables vides** | 18 |
| **Mode schéma** | Schemaless (pas de validation stricte) |

---

## 📋 Liste des Tables par Catégorie

### 🎓 Système Éducatif (Données de référence)

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `education_system` | 1 | Systèmes éducatifs (FR) |
| `cycle` | 6 | Niveaux scolaires (Maternelle → Formation continue) |
| `grade` | 29 | Classes par cycle (CP, 6ème, Terminale, etc.) |
| `track` | 3 | Filières (Générale, Techno, Pro) |
| `specialty` | 9 | Spécialités lycée |
| `domain` | 6 | Domaines disciplinaires |
| `subject` | 35 | Matières officielles |
| `language` | 4 | Langues supportées (fr, en, es, ar) |

### 📚 Contenu Pédagogique

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `matiere` | 10 | Matières simplifiées (anciennes) |
| `theme` | 56 | Thèmes de quiz |
| `quiz` | 7 | Quiz créés |
| `question` | 146 | Questions |
| `official_program` | 1 | Programmes officiels |
| `chapter` | 5 | Chapitres de programmes |
| `chapter_theme` | 6 | Liens chapitre ↔ thème |

### 👤 Utilisateurs & Progression

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `user` | 1 | Utilisateurs |
| `user_progress` | 12 | Progression par thème |
| `session` | 6 | Sessions de connexion |
| `email_verification` | 1 | Tokens de vérification email |
| `email_log` | 1 | Historique emails envoyés |

### 🏆 Gamification (À IMPLÉMENTER)

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `badge` | **0** ⚠️ | Badges à gagner |
| `user_badge` | **0** | Badges obtenus |
| `user_favorite` | **0** | Quiz favoris |
| `user_result` | **0** | Résultats de quiz |
| `user_quiz_library` | **0** | Bibliothèque personnelle |

### 💳 Abonnements & Paiements

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `subscription_plan` | 3 | Plans (Free, Pro, etc.) |
| `user_subscription` | **0** | Abonnements actifs |
| `donation` | **0** | Dons reçus |

### 👨‍👩‍👧 Classes & Tutorat (À IMPLÉMENTER)

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `classe` | 22 | Classes (anciennes données) |
| `class_member` | **0** | Membres de classe |
| `establishment_class` | **0** | Classes d'établissement |
| `tutor_student` | **0** | Relations tuteur-élève |

### 🔧 Tables Non Utilisées

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| `competence` | **0** | Compétences |
| `skill` | **0** | Skills |
| `topic` | **0** | Topics |
| `option` | **0** | Options diverses |
| `translation` | **0** | Traductions |
| `password_reset` | **0** | Reset mot de passe (obsolète?) |
| `password_reset_token` | **0** | Tokens reset |
| `subject_alias` | 7 | Alias de matières |

---

## 📐 Structure Détaillée des Tables Principales

### `cycle` - Cycles Scolaires
```
id                  : object (RecordId)  → "cycle:FR_college"
code                : string             → "college"
name                : string             → "Collège"
order               : number             → 3
age_min             : number             → 11
age_max             : number             → 14
is_active           : boolean            → true
system              : object (RecordId)  → "education_system:FR"
created_at          : datetime
```

**Données existantes:**
| ID | Code | Nom | Ordre |
|----|------|-----|-------|
| cycle:FR_maternelle | maternelle | Maternelle | 1 |
| cycle:FR_primaire | primaire | Primaire | 2 |
| cycle:FR_college | college | Collège | 3 |
| cycle:FR_lycee | lycee | Lycée | 4 |
| cycle:FR_superieur | superieur | Supérieur | 5 |
| cycle:FR_formation_continue | formation_continue | Formation continue | 6 |

---

### `grade` - Classes/Niveaux
```
id                  : object (RecordId)  → "grade:FR_6e"
code                : string             → "6e"
name                : string             → "Sixième"
order               : number             → 1
cycle               : object (RecordId)  → "cycle:FR_college"
track               : object (RecordId)  → "track:FR_lycee_general" (optionnel)
difficulty_level    : number             → 5
is_active           : boolean            → true
created_at          : datetime
```

**Grades par cycle:**
- **Maternelle (3):** PS, MS, GS
- **Primaire (5):** CP, CE1, CE2, CM1, CM2
- **Collège (4):** 6ème, 5ème, 4ème, 3ème
- **Lycée (8):** 2nde G/T, 1ère G/STMG/STI2D, Term G/STMG/STI2D
- **Supérieur (9):** L1, L2, L3, M1, M2, BTS1, BTS2, CPGE1, CPGE2

---

### `subject` - Matières (Nouveau Système)
```
id                  : object (RecordId)  → "subject:math"
code                : string             → "math"
name                : string             → "Mathématiques"
icon                : string             → "🔢"
color               : string             → "blue"
domain              : object (RecordId)  → "domain:sciences"
order               : number             → 1
is_active           : boolean            → true
created_at          : datetime
```

**Domaines et matières:**
- **Sciences:** Math, Physique, Chimie, SVT, Info, Techno
- **Langues:** Français, Anglais, Espagnol, Allemand, Italien, Latin, Grec, Littérature
- **Humanités:** Histoire, Géo, Philo, Économie, EMC, Socio, Psycho
- **Arts & Sport:** Arts, Musique, Théâtre, Cinéma, EPS
- **Pro:** Droit, Management, Marketing, Compta, Santé
- **Maternelle:** Langage oral, Motricité, Nombres/Formes, Découverte

---

### `matiere` - Matières (Ancien Système - Legacy)
```
id                  : object (RecordId)  → "matiere:xyanihmwgbsfxis82fqw"
name                : string             → "Français"
slug                : string             → "francais"
pos                 : number             → 0
```

⚠️ **Note:** Cette table semble être l'ancien système, remplacé par `subject`. Certains quiz/questions y font encore référence.

---

### `theme` - Thèmes de Quiz
```
id                  : object (RecordId)  → "theme:0f4q6cwq4a325ibl5oty"
name                : string             → "Époque contemporaine"
slug                : string             → "histoire-epoque-contemporaine"
pos                 : number             → 4
```

---

### `question` - Questions
```
id                  : object (RecordId)
question            : string             → "Le papier est fabriqué à partir :"
questionType        : string             → "qcm"
options             : array[4]           → ["Du sable","Du bois","Du pétrole","Du métal"]
correctAnswer       : number             → 1 (index de la bonne réponse)
explanation         : string             → "Le papier est fabriqué..."
difficulty          : string             → "easy" | "medium" | "hard"
family              : string             → "general"
matiere_id          : object (RecordId)  → "matiere:m84fe7jbm6ijjxofjmtf"
theme_ids           : array              → ["theme:uuracqri96zkwa6ohq66"]
class_difficulties  : array              → [{classe_id, difficulty}]
isActive            : boolean            → true
is_public           : boolean            → true
createdAt           : datetime
updatedAt           : datetime
```

---

### `quiz` - Quiz
```
id                  : object (RecordId)
title               : string             → "Les propriétés de la matière - 6ème"
slug                : string             → "proprietes-matiere-6e"
description         : string
subject             : object (RecordId)  → "subject:physics"
matiere_id          : object (RecordId)  → "matiere:kwjelyx82lnn60jgo5am"
target_grades       : array              → ["grade:FR_6e"]
difficulty          : number             → 5
maxQuestions        : number             → 3
defaultMode         : string             → "revision"
allowModeChoice     : boolean            → true
allowTimeChoice     : boolean            → true
visibility          : string             → "public"
approved_public     : boolean            → true
isActive            : boolean            → true
isHomepage          : boolean            → false
favorite_count      : number             → 0
createdAt           : datetime
updatedAt           : datetime
updated_at          : datetime
```

---

### `user` - Utilisateurs
```
id                  : object (RecordId)
email               : string             → "alistair@mobyclic.com"
name                : string             → "alistair mobyclic"
prenom              : string             → "alistair"
nom                 : string             → "mobyclic"
password_hash       : string             → "85663609..."
email_verified      : boolean            → true
is_admin            : boolean            → false
profile_type        : string             → "apprenant"
education_system    : object (RecordId)  → "education_system:FR"
current_cycle       : object (RecordId)  → "cycle:FR_college"
current_grade       : object (RecordId)  → "grade:FR_6e"
preferred_language  : object (RecordId)  → "language:fr"
global_student_id   : string             → "alis2151"
theme_color         : string             → "gray"
level               : number             → 1
total_xp            : number             → 0
current_streak      : number             → 0
best_streak         : number             → 0
onboarding_completed: boolean            → true
created_at          : datetime
updated_at          : datetime
```

---

### `user_progress` - Progression Utilisateur
```
id                  : object (RecordId)
user_id             : object (RecordId)  → "user:..."
matiere_id          : object (RecordId)  → "matiere:..."
theme_id            : object (RecordId)  → "theme:..."
niveau              : string             → "débutant"
points              : number             → 0
quizzes_completed   : number             → 0
correct_answers     : number             → 0
total_answers       : number             → 0
best_score          : number             → 0
created_at          : datetime
updated_at          : datetime
```

---

### `badge` - Badges (À CRÉER)
Table vide - Structure attendue:
```
id                  : object (RecordId)  → "badge:first_quiz"
name                : string             → "Premier Quiz"
description         : string             → "Terminer son premier quiz"
icon                : string             → "🏆"
category            : string             → "progress" | "streak" | "social" | "special"
condition_type      : string             → "quizzes_completed" | "streak_days" | "xp_earned"
condition_value     : number             → 1
points              : number             → 10
is_active           : boolean            → true
created_at          : datetime
```

---

### `official_program` - Programmes Officiels
```
id                  : object (RecordId)  → "official_program:FR_1ere_G_history"
name                : string             → "Histoire - Programme de Première Générale"
description         : string             → "Programme officiel d'Histoire..."
education_system    : object (RecordId)  → "education_system:FR"
cycle               : object (RecordId)  → "cycle:FR_lycee"
grade               : object (RecordId)  → "grade:FR_1ere_G"
subject             : object (RecordId)  → "subject:history"
is_active           : boolean            → true
created_at          : datetime
```

---

### `chapter` - Chapitres de Programmes
```
id                  : object (RecordId)  → "chapter:chap1_1ere_hist"
name                : string             → "L'Europe face aux révolutions"
description         : string             → "La Révolution française et l'Empire..."
official_program    : object (RecordId)  → "official_program:FR_1ere_G_history"
order               : number             → 1
is_active           : boolean            → true
created_at          : datetime
```

---

### `chapter_theme` - Liaison Chapitre-Thème
```
id                  : object (RecordId)
chapter             : object (RecordId)  → "chapter:chap4_1ere_hist"
theme               : object (RecordId)  → "theme:ww1_dates"
relevance           : number             → 100
created_at          : datetime
```

---

## ⚠️ Problèmes Identifiés

### 1. **Duplication Matières/Subjects**
- La table `matiere` (ancienne) et `subject` (nouvelle) coexistent
- Questions/Quiz utilisent `matiere_id` mais aussi `subject`
- **Recommandation:** Migrer tout vers `subject` ou créer une relation

### 2. **Table `badge` vide**
- Le système de gamification est prévu mais non implémenté
- Les pages admin sont prêtes mais la table est vide
- **Action:** Créer des badges de base

### 3. **Table `classe` vs `grade`**
- `classe` (22 enregistrements) = ancien système
- `grade` (29 enregistrements) = nouveau système lié aux cycles
- **Recommandation:** Vérifier si `classe` est encore utilisée

### 4. **Incohérence de nommage**
- `createdAt` vs `created_at`
- `isActive` vs `is_active`
- **Recommandation:** Standardiser sur snake_case

### 5. **Tables probablement obsolètes**
- `password_reset` (0 enregistrements) - `password_reset_token` existe
- `option` (0 enregistrements)
- `competence`, `skill`, `topic` (non utilisées)

---

## 📈 Relations Entre Tables

```
education_system
  └── cycle (system)
        └── grade (cycle)
              └── track (cycle, optionnel)
                    └── specialty (track)

domain
  └── subject (domain)

user
  ├── education_system
  ├── current_cycle
  ├── current_grade
  ├── preferred_language
  ├── session (user)
  └── user_progress (user_id)
        ├── matiere_id
        └── theme_id

official_program
  ├── education_system
  ├── cycle
  ├── grade
  ├── subject
  └── chapter (official_program)
        └── chapter_theme (chapter, theme)

quiz
  ├── subject
  ├── matiere_id
  └── target_grades[]

question
  ├── matiere_id
  └── theme_ids[]
```

---

## ✅ Recommandations

### Priorité Haute
1. ⬜ Créer les badges de base dans la table `badge`
2. ⬜ Documenter le mapping `matiere` ↔ `subject`
3. ⬜ Standardiser les conventions de nommage

### Priorité Moyenne
4. ⬜ Ajouter un index sur `question.matiere_id`
5. ⬜ Ajouter un index sur `quiz.subject`
6. ⬜ Vérifier/nettoyer les tables obsolètes

### Priorité Basse
7. ⬜ Migrer complètement `matiere` → `subject`
8. ⬜ Supprimer les tables non utilisées
9. ⬜ Ajouter des schémas stricts (SCHEMAFULL)

---

## 📊 Statistiques Finales

- **Tables avec contenu:** 22/40 (55%)
- **Enregistrements totaux:** ~380
- **Questions:** 146
- **Quiz:** 7
- **Matières:** 35 (subjects) + 10 (matières legacy)
- **Thèmes:** 56
- **Utilisateurs:** 1
