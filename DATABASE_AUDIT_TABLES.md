# 🔍 Audit Complet des Tables Éducation

**Date:** 2 février 2026

## 📊 Résumé de la Situation

L'application utilise **deux systèmes parallèles** qui se chevauchent :

### Système 1 : "Ancien" (ID générés automatiquement)
- `classe` (22 records) - Niveaux scolaires simples
- `matiere` (10 records) - Matières de base
- `theme` (56 records) - Chapitres/Thèmes des quiz
- `competence` (33 records) - Compétences liées aux questions

### Système 2 : "Nouveau ISO" (ID explicites type `FR_6e`)
- `education_system` (1 record) - Système éducatif (France)
- `cycle` (6 records) - Cycles (maternelle, primaire, collège...)
- `track` (3 records) - Filières (général, techno, pro)
- `specialty` (9 records) - Spécialités lycée
- `grade` (29 records) - Niveaux avec codes ISO
- `subject` (35 records) - Matières standardisées
- `domain` (6 records) - Domaines de matières
- `official_program` (1 record) - Programme officiel
- `chapter` (5 records) - Chapitres du programme
- `chapter_theme` (6 records) - Thèmes des chapitres

---

## 🎯 Utilisation Réelle dans les Données

### Table `question` (146 records)
```json
{
  "matiere_id": "matiere:xxx",      // ✅ ANCIEN système
  "theme_ids": ["theme:xxx"],        // ✅ ANCIEN système  
  "class_difficulties": [{
    "classe_id": "classe:xxx"        // ✅ ANCIEN système
  }]
}
```

### Table `quiz` (7 records)
```json
{
  "matiere_id": "matiere:xxx",       // ✅ ANCIEN système
  "theme_ids": ["theme:xxx"],        // ✅ ANCIEN système
  "subject": "subject:physics",      // ⚠️ NOUVEAU système (minoritaire)
  "target_grades": ["grade:FR_6e"]   // ⚠️ NOUVEAU système (minoritaire)
}
```

### Table `user` (2 records)
```json
{
  "current_grade": "grade:FR_6e",    // ⚠️ NOUVEAU système
  "classe_id": null                   // ❌ NON utilisé
}
```

### Table `user_progress` (12 records)
```json
{
  "matiere_id": "matiere:xxx",       // ✅ ANCIEN système
  "theme_id": "theme:xxx"            // ✅ ANCIEN système
}
```

---

## 📁 Utilisation dans le Code

### APIs utilisant l'ANCIEN système (`classe`, `matiere`, `theme`)
- `/api/quiz/explore` - Filtres par matiere, theme, classe
- `/api/questions/[id]` - class_difficulties avec classe:
- `/api/themes/` - Gestion des themes
- `/api/matieres/` - Gestion des matières
- `$lib/progress.ts` - Progression par matiere/theme

### APIs utilisant le NOUVEAU système (`grade`, `subject`)
- `/api/user/update-education` - current_grade
- `/api/admin/cursus/*` - Admin des cycles/grades
- `/api/admin/programs/*` - Programme officiel avec subject

### Pages Front
- **Onboarding** : utilise `grade` (nouveau)
- **Profile** : utilise `grade` (nouveau)
- **Dashboard/Explore** : utilise `classe`, `matiere`, `theme` (ancien)

---

## ⚠️ Tables INUTILISÉES (0 référence dans le code actif)

| Table | Records | Utilisation |
|-------|---------|-------------|
| `chapter` | 5 | Scripts de seed uniquement |
| `chapter_theme` | 6 | Scripts de seed uniquement |
| `topic` | 0 | Vide, jamais utilisée |
| `skill` | 0 | Vide, jamais utilisée |
| `subject_alias` | 0 | Vide, jamais utilisée |
| `translation` | 0 | Vide, jamais utilisée |
| `language` | 0 | Vide, jamais utilisée |

---

## 🔀 Tables REDONDANTES

### 1. `classe` vs `grade` (NIVEAUX SCOLAIRES)

| Critère | `classe` (ancien) | `grade` (nouveau) |
|---------|-------------------|-------------------|
| **Records** | 22 | 29 |
| **ID Format** | `classe:xxx` (random) | `grade:FR_6e` (explicite) |
| **Structure** | `name` seulement | `name`, `code`, `cycle`, `order` |
| **Utilisé par** | `question.class_difficulties`, `quiz.classe_id` | `user.current_grade`, `quiz.target_grades` |

**Recommandation:** Migrer vers `grade` (plus structuré, lié aux cycles)

### 2. `matiere` vs `subject` (MATIÈRES)

| Critère | `matiere` (ancien) | `subject` (nouveau) |
|---------|-------------------|-------------------|
| **Records** | 10 | 35 |
| **ID Format** | `matiere:xxx` (random) | `subject:math` (explicite) |
| **Structure** | `name`, `icon` | `name`, `code`, `domain`, `color` |
| **Utilisé par** | `question`, `quiz`, `user_progress` | `quiz.subject` (minoritaire) |

**Recommandation:** Garder `matiere` (plus utilisé) OU migrer progressivement

### 3. `theme` vs `chapter`/`chapter_theme` (CHAPITRES)

| Critère | `theme` (ancien) | `chapter` + `chapter_theme` (nouveau) |
|---------|-----------------|--------------------------------------|
| **Records** | 56 | 5 + 6 = 11 |
| **Utilisé par** | Toutes les questions, quiz, progress | Quasi rien |

**Recommandation:** Garder `theme` uniquement

---

## 🎯 Plan d'Action Recommandé

### Phase 1 : Nettoyage Immédiat (Tables vides/inutilisées)
```sql
REMOVE TABLE topic;
REMOVE TABLE skill;
REMOVE TABLE subject_alias;
REMOVE TABLE translation;
REMOVE TABLE language;
REMOVE TABLE chapter;
REMOVE TABLE chapter_theme;
```

### Phase 2 : Unification des Niveaux (classe → grade)
1. Créer une table de mapping `classe` → `grade`
2. Migrer `question.class_difficulties` vers `grade`
3. Supprimer références à `classe`
4. Supprimer table `classe`

### Phase 3 : Décision Matières
**Option A :** Garder `matiere` comme système principal
- Renommer les IDs pour être explicites (`matiere:math`)
- Ajouter les champs manquants (domain, color)

**Option B :** Migrer vers `subject`
- Mettre à jour toutes les références
- Plus cohérent avec le système international

---

## 📋 Checklist Tables à Conserver

### ✅ À GARDER (utilisées activement)
- `user` - Utilisateurs
- `quiz` - Quiz
- `question` - Questions
- `theme` - Thèmes/Chapitres
- `matiere` - Matières
- `competence` - Compétences
- `user_progress` - Progression
- `badge` - Badges
- `user_badge` - Badges utilisateur
- `grade` - Niveaux (pour user.current_grade)
- `cycle` - Cycles (pour organiser grades)

### ⚠️ À ÉVALUER
- `subject` - Garder si internationalisation prévue
- `domain` - Garder si structure des matières importante
- `track` - Filières lycée (utile?)
- `specialty` - Spécialités lycée (utile?)
- `education_system` - Système éducatif (utile si multi-pays)
- `official_program` - Programme officiel (utile si contenu officiel)

### ❌ À SUPPRIMER
- `classe` - Doublon de `grade`
- `chapter` - Inutilisée (remplacée par `theme`)
- `chapter_theme` - Inutilisée
- `topic` - Vide
- `skill` - Vide
- `subject_alias` - Vide
- `translation` - Vide
- `language` - Vide
