# 🔍 Audit des Tables Redondantes - Structure Éducative

**Date:** 2 Février 2026  
**Projet:** Kweez (PAPAOURS)  
**Base de données:** SurrealDB Cloud - `kweez/dbkweez`

---

## 📊 Résumé de l'Audit

### Situation Actuelle

Le projet contient **deux systèmes parallèles** pour gérer la structure éducative :

| Système | Tables | Utilisation réelle |
|---------|--------|-------------------|
| **Ancien (simplifié)** | `classe`, `matiere`, `theme`, `competence` | ✅ **Utilisé activement** |
| **Nouveau (ISO/internationalisé)** | `education_system`, `cycle`, `track`, `grade`, `domain`, `subject`, `specialty`, `topic`, `skill`, `official_program`, `chapter`, `chapter_theme` | ⚠️ **Partiellement utilisé** |

---

## 📋 Inventaire Complet des Tables

### 🟢 Tables ACTIVES (Ancien Système - UTILISÉES)

| Table | Count | Utilisée dans le code | Données liées |
|-------|-------|----------------------|---------------|
| `classe` | 22 | ✅ 9 fichiers | `question.class_difficulties`, `user_progress.classe_id` |
| `matiere` | 10 | ✅ 14 fichiers | `quiz.matiere_id`, `question.matiere_id`, `user_progress.matiere_id` |
| `theme` | 56 | ✅ 13 fichiers | `question.theme_ids`, `user_progress.theme_id` |
| `competence` | 33 | ✅ 1 fichier | API `/api/competences` |

**Données critiques:**
- 145 questions référencent `matiere_id`
- 145 questions référencent `theme_ids`
- 105 questions ont `class_difficulties` avec `classe_id`
- 12 `user_progress` utilisent `matiere_id` et `theme_id`

### 🟡 Tables PARTIELLEMENT UTILISÉES (Nouveau Système)

| Table | Count | Utilisée dans le code | État |
|-------|-------|----------------------|------|
| `cycle` | 6 | ✅ 11 fichiers | Admin cursus, traductions |
| `grade` | 29 | ✅ 12 fichiers | Admin cursus, `quiz.target_grades` |
| `domain` | 6 | ✅ 1 fichier | Page traductions |
| `subject` | 35 | ✅ 4 fichiers | Admin programs, `quiz.subject` |
| `education_system` | 1 | ✅ 1 fichier | API education |
| `track` | 3 | ✅ 2 fichiers | API education, traductions |
| `specialty` | 9 | ✅ 2 fichiers | API education, traductions |
| `official_program` | 1 | ✅ 5 fichiers | Admin programs |
| `chapter` | 5 | ✅ 2 fichiers | Admin programs |
| `chapter_theme` | 6 | ❌ Aucun | - |

**Données liées:**
- 4 quiz référencent `quiz.subject`
- 3 quiz référencent `quiz.target_grades` (array de `grade`)

### 🔴 Tables VIDES / NON UTILISÉES

| Table | Count | Utilisée dans le code | Recommandation |
|-------|-------|----------------------|----------------|
| `topic` | 0 | ❌ | **SUPPRIMER** |
| `skill` | 0 | ❌ | **SUPPRIMER** |
| `subject_alias` | 7 | ❌ | **SUPPRIMER** |
| `translation` | 0 | ❌ | **SUPPRIMER** (pas de i18n implémenté) |
| `language` | 4 | ❌ | **SUPPRIMER** (pas utilisé) |

---

## 🔄 Analyse des Redondances

### 1. `classe` vs `grade` - **REDONDANCE PARTIELLE**

| classe (ancien) | grade (nouveau) |
|-----------------|-----------------|
| 22 enregistrements | 29 enregistrements |
| IDs générés (`classe:xxx`) | IDs explicites (`grade:FR_6e`) |
| Champs: `name`, `slug`, `pos` | Champs: `name`, `code`, `order`, `cycle`, `track`, `difficulty_level` |

**Chevauchement conceptuel:** Les deux représentent les niveaux scolaires (CP, 6ème, etc.)
- `classe` est simplifié (liste plate)
- `grade` est structuré (lié à `cycle` et `track`)

**Usage actuel:**
- `classe` → utilisé par `question.class_difficulties` et le système de progression
- `grade` → utilisé par `quiz.target_grades` et l'admin cursus

### 2. `matiere` vs `subject` - **REDONDANCE FORTE**

| matiere (ancien) | subject (nouveau) |
|-----------------|-------------------|
| 10 enregistrements | 35 enregistrements |
| IDs générés | IDs explicites (`subject:math`) |
| Simplifié | Lié à `domain`, plus complet |

**Chevauchement:**
| matiere.name | subject.name |
|--------------|--------------|
| Mathématiques | Mathématiques |
| Français | Français |
| Histoire | Histoire |
| Anglais | Anglais |
| etc. | + 25 autres... |

**Usage actuel:**
- `matiere` → utilisé par `quiz.matiere_id`, `question.matiere_id`, `user_progress`
- `subject` → utilisé par `quiz.subject` (nouveau champ, 4 quiz seulement)

### 3. `theme` - **PAS DE DOUBLON**

La table `theme` n'a pas d'équivalent dans le nouveau système.
- Elle contient 56 thèmes liés aux matières
- Utilisée massivement par `question.theme_ids` et `user_progress.theme_id`
- **À CONSERVER**

### 4. Tables "Programmes Officiels" - **SOUS-UTILISÉES**

| Table | Usage |
|-------|-------|
| `official_program` | 1 seul programme créé |
| `chapter` | 5 chapitres |
| `chapter_theme` | 6 liens (non utilisés dans le code) |

Ces tables ont été créées pour mapper les programmes officiels Education Nationale mais ne sont pas encore exploitées.

---

## 📊 Schéma des Relations

```
ANCIEN SYSTÈME (actif)              NOUVEAU SYSTÈME (partiel)
═══════════════════════            ═══════════════════════════

question                            quiz
├── matiere_id → [matiere]          ├── subject → [subject]
├── theme_ids → [theme]             ├── target_grades → [grade]
└── class_difficulties              └── matiere_id → [matiere] (!)
    └── classe_id → [classe]

user_progress                       education_system
├── matiere_id → [matiere]          └── cycle
├── theme_id → [theme]                  └── track
└── classe_id → [classe]                    └── grade
                                                └── specialty

competence                          official_program
└── matiere_slug                    ├── grade → [grade]
                                    ├── subject → [subject]
                                    └── chapters → [chapter]
                                        └── chapter_theme → [theme]
```

---

## 🎯 Recommandations

### Phase 1 : Nettoyage Immédiat (SAFE)

**Tables à SUPPRIMER (vides et non utilisées) :**
1. `topic` - 0 enregistrements, aucune référence
2. `skill` - 0 enregistrements, aucune référence
3. `subject_alias` - 7 enregistrements, aucune utilisation
4. `translation` - 0 enregistrements, i18n non implémenté
5. `language` - 4 enregistrements, aucune utilisation dans l'app

**Script de nettoyage :**
```sql
REMOVE TABLE topic;
REMOVE TABLE skill;
REMOVE TABLE subject_alias;
REMOVE TABLE translation;
REMOVE TABLE language;
```

### Phase 2 : Décision Architecturale Nécessaire

**Option A : Garder les deux systèmes (Status Quo)**
- ✅ Pas de migration risquée
- ❌ Confusion conceptuelle
- ❌ Duplication des données

**Option B : Migrer vers le nouveau système (Recommandé à long terme)**
- Remplacer `classe` → `grade`
- Remplacer `matiere` → `subject`
- Conserver `theme` (pas de doublon)
- Migration des 145 questions et 12 progressions
- ⚠️ Nécessite une migration complète du code

**Option C : Simplifier - Garder l'ancien système (Pragmatique)**
- Supprimer les tables du nouveau système non utilisées
- Garder `classe`, `matiere`, `theme`, `competence`
- Garder `cycle`, `grade`, `domain`, `subject` pour l'admin cursus uniquement
- ✅ Moins de confusion
- ❌ Perte de la structure internationalisée

### Recommandation Finale

**Court terme (Phase 1) :** Supprimer les 5 tables vides

**Moyen terme :** Choisir Option B ou C selon la roadmap :
- Si internationalisation prévue → Option B
- Si France uniquement pour l'instant → Option C

---

## 📈 Impact sur les Performances

Actuellement, les requêtes utilisent principalement l'ancien système :
- Les JOINs sont simples (`matiere_id`, `theme_ids`)
- Le nouveau système ajoute de la complexité (cycle → track → grade)

**Recommandation :** Indexer les tables actives
```sql
DEFINE INDEX idx_question_matiere ON question FIELDS matiere_id;
DEFINE INDEX idx_question_theme ON question FIELDS theme_ids;
DEFINE INDEX idx_progress_user_matiere ON user_progress FIELDS user_id, matiere_id;
```

---

## 📁 Fichiers Concernés par une Migration

Si migration vers le nouveau système :

### Fichiers utilisant `classe` (9 fichiers)
- [src/routes/admin/questions/+page.server.ts](src/routes/admin/questions/+page.server.ts)
- [src/routes/admin/users/+page.server.ts](src/routes/admin/users/+page.server.ts)
- [src/routes/admin/system/settings/classes/+page.server.ts](src/routes/admin/system/settings/classes/+page.server.ts)
- [src/routes/api/quiz/explore/+server.ts](src/routes/api/quiz/explore/+server.ts)
- [src/routes/api/admin/classes/+server.ts](src/routes/api/admin/classes/+server.ts)
- [src/routes/api/admin/classes/[id]/+server.ts](src/routes/api/admin/classes/[id]/+server.ts)
- [src/lib/progress.ts](src/lib/progress.ts)

### Fichiers utilisant `matiere` (14 fichiers)
- [src/routes/admin/+layout.server.ts](src/routes/admin/+layout.server.ts)
- [src/routes/admin/quiz/+page.server.ts](src/routes/admin/quiz/+page.server.ts)
- [src/routes/admin/+page.server.ts](src/routes/admin/+page.server.ts)
- [src/routes/admin/questions/+page.server.ts](src/routes/admin/questions/+page.server.ts)
- [src/routes/admin/quiz/theme/[slug]/+page.server.ts](src/routes/admin/quiz/theme/[slug]/+page.server.ts)
- [src/routes/admin/system/settings/themes/+page.server.ts](src/routes/admin/system/settings/themes/+page.server.ts)
- [src/routes/api/matieres/+server.ts](src/routes/api/matieres/+server.ts)
- [src/routes/api/admin/subjects/+server.ts](src/routes/api/admin/subjects/+server.ts)
- [src/routes/api/admin/subjects/[id]/+server.ts](src/routes/api/admin/subjects/[id]/+server.ts)
- [src/routes/api/quiz/explore/+server.ts](src/routes/api/quiz/explore/+server.ts)
- [src/lib/progress.ts](src/lib/progress.ts)
- [src/lib/db.ts](src/lib/db.ts)

### Fichiers utilisant `theme` (13 fichiers)
- Même liste + quelques autres

---

## ✅ Actions Immédiates

1. **Exécuter le nettoyage Phase 1** - Supprimer les 5 tables vides
2. **Décider de la stratégie long terme** - Option B ou C
3. **Documenter la convention** - Quel système utiliser pour les nouvelles fonctionnalités
