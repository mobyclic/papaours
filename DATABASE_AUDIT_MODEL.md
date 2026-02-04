# 🔍 Audit Complet du Modèle de Données - Kweez

> Audit réalisé le 4 février 2026
> Base: SurrealDB
> Application: Kweez (quiz éducatif multi-niveaux)

---

## 📊 Vue d'ensemble

### Tables actuelles (34 tables)

| Table | Type | Statut | Priorité |
|-------|------|--------|----------|
| `question` | SCHEMALESS | ⚠️ À corriger | **HAUTE** |
| `quiz` | SCHEMALESS | ⚠️ À corriger | **HAUTE** |
| `quiz_session` | SCHEMALESS | ⚠️ À corriger | **HAUTE** |
| `user_result` | SCHEMALESS | ⚠️ À corriger | **HAUTE** |
| `user_progress` | SCHEMALESS | ⚠️ À corriger | **HAUTE** |
| `badge` | SCHEMALESS | ⚠️ À corriger | Moyenne |
| `chapter` | SCHEMALESS | ⚠️ À corriger | Moyenne |
| `subject` | SCHEMALESS | ⚠️ À corriger | Moyenne |
| `user_badge` | SCHEMALESS | ⚠️ À corriger | Moyenne |
| `user_favorite` | SCHEMALESS | ⚠️ À corriger | Basse |
| `tutor_student` | SCHEMALESS | ⚠️ À corriger | Basse |
| `donation` | SCHEMALESS | ⚠️ À corriger | Basse |
| `option` | SCHEMALESS | 🗑️ À supprimer | - |
| `email_log` | SCHEMALESS | ⚠️ À corriger | Basse |
| `user_quiz_library` | SCHEMALESS | ⚠️ À corriger | Basse |
| Autres tables | SCHEMAFULL | ✅ OK | - |

---

## 🚨 Problèmes Critiques

### 1. Table `question` - SCHEMALESS avec données complexes

**Problème actuel:**
```sql
DEFINE TABLE question TYPE ANY SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD grade_difficulties ON question TYPE option<array> PERMISSIONS FULL;
```

**Exemple de données actuelles:**
```json
{
  "correctAnswer": 0,
  "difficulty": "medium",
  "explanation": "...",
  "grade_difficulties": [{ "difficulty": 1, "grade_id": "grade:FR_6e", "points": 10 }],
  "imageUrl": "https://...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "question": "Comment produit-on le son avec une trompette ?",
  "questionType": "qcm",
  "subject": "subject:musique",
  "theme_ids": ["theme:lcxetf364kcha3qsyazi"]
}
```

**Recommandation:**
```sql
DEFINE TABLE question TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

-- Champs communs à tous les types de questions
DEFINE FIELD question ON question TYPE string ASSERT $value != NONE PERMISSIONS FULL;
DEFINE FIELD questionType ON question TYPE string ASSERT $value INSIDE ['qcm', 'qcm_multiple', 'qcm_image', 'true_false', 'fill_blank', 'matching', 'ordering', 'open_short', 'open_long'] PERMISSIONS FULL;
DEFINE FIELD difficulty ON question TYPE string DEFAULT 'medium' ASSERT $value INSIDE ['easy', 'medium', 'hard'] PERMISSIONS FULL;
DEFINE FIELD explanation ON question TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD subject ON question TYPE option<record<subject>> PERMISSIONS FULL;
DEFINE FIELD isActive ON question TYPE bool DEFAULT true PERMISSIONS FULL;
DEFINE FIELD is_public ON question TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD createdAt ON question TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD updatedAt ON question TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD createdBy ON question TYPE option<record<backoffice_user>> PERMISSIONS FULL;

-- Médias (images)
DEFINE FIELD imageUrl ON question TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD imageCaption ON question TYPE option<string> PERMISSIONS FULL;

-- Liens avec themes (via relation graph - voir section Relations)
DEFINE FIELD theme_ids ON question TYPE option<array<record<theme>>> PERMISSIONS FULL;

-- Grade-specific difficulties (structure explicite)
DEFINE FIELD grade_difficulties ON question TYPE option<array<object>> PERMISSIONS FULL;

-- ========== CHAMPS SPÉCIFIQUES PAR TYPE ==========

-- QCM classique / QCM multiple
DEFINE FIELD options ON question TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD optionImages ON question TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD correctAnswer ON question TYPE option<any> PERMISSIONS FULL; -- int ou bool selon type

-- QCM multiple (answers avec is_correct)
DEFINE FIELD answers ON question TYPE option<array<object>> PERMISSIONS FULL;

-- Fill blank
DEFINE FIELD textWithBlanks ON question TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD correctAnswers ON question TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD caseSensitive ON question TYPE option<bool> DEFAULT false PERMISSIONS FULL;

-- Matching
DEFINE FIELD leftItems ON question TYPE option<array<object>> PERMISSIONS FULL;
DEFINE FIELD rightItems ON question TYPE option<array<object>> PERMISSIONS FULL;
DEFINE FIELD correctMatches ON question TYPE option<object> PERMISSIONS FULL;

-- Ordering
DEFINE FIELD items ON question TYPE option<array<object>> PERMISSIONS FULL;
DEFINE FIELD correctOrder ON question TYPE option<array<string>> PERMISSIONS FULL;

-- Open questions
DEFINE FIELD expectedKeywords ON question TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD sampleAnswers ON question TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD minWords ON question TYPE option<int> PERMISSIONS FULL;
DEFINE FIELD maxWords ON question TYPE option<int> PERMISSIONS FULL;
DEFINE FIELD placeholder ON question TYPE option<string> PERMISSIONS FULL;

-- Index pour recherche
DEFINE INDEX idx_question_type ON question FIELDS questionType;
DEFINE INDEX idx_question_subject ON question FIELDS subject;
DEFINE INDEX idx_question_active ON question FIELDS isActive;
```

---

### 2. Table `quiz_session` - Résultats non exploitables via Graph

**Problème actuel:** Les résultats de quiz sont stockés dans des tables classiques, rendant les requêtes de statistiques complexes et lentes.

**Recommandation: Utiliser les RELATIONS SurrealDB**

```sql
-- ========== RELATION: user -> completes -> quiz ==========
-- Remplace user_result et simplifie quiz_session

DEFINE TABLE completes SCHEMAFULL TYPE RELATION
  FROM user
  TO quiz
  PERMISSIONS NONE;

DEFINE FIELD score ON completes TYPE number PERMISSIONS FULL;
DEFINE FIELD total_questions ON completes TYPE int PERMISSIONS FULL;
DEFINE FIELD correct_answers ON completes TYPE int PERMISSIONS FULL;
DEFINE FIELD duration_seconds ON completes TYPE option<int> PERMISSIONS FULL;
DEFINE FIELD mode ON completes TYPE string DEFAULT 'revision' ASSERT $value INSIDE ['revision', 'exam', 'practice'] PERMISSIONS FULL;
DEFINE FIELD completed_at ON completes TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD grade ON completes TYPE option<record<grade>> PERMISSIONS FULL;

-- Détail des réponses (optionnel, peut être séparé)
DEFINE FIELD answers ON completes TYPE option<array<object>> PERMISSIONS FULL;

-- Index pour stats rapides
DEFINE INDEX idx_completes_user ON completes FIELDS in;
DEFINE INDEX idx_completes_quiz ON completes FIELDS out;
DEFINE INDEX idx_completes_date ON completes FIELDS completed_at;
DEFINE INDEX idx_completes_grade ON completes FIELDS grade;
```

**Avantage: Requêtes de graphe simplifiées**
```sql
-- Tous les quiz complétés par un utilisateur
SELECT ->completes->quiz FROM user:9j63fc8b8qhqrdim1v0g;

-- Stats de l'utilisateur
SELECT 
  count() AS total_quizzes,
  math::mean(score) AS average_score,
  math::sum(correct_answers) AS total_correct
FROM user:9j63fc8b8qhqrdim1v0g->completes;

-- Classement global par quiz
SELECT 
  in AS user,
  score,
  duration_seconds
FROM completes 
WHERE out = quiz:bci0jd14qkmvk4vhbzpg
ORDER BY score DESC, duration_seconds ASC
LIMIT 10;

-- Progression par matière
SELECT 
  out.subject AS subject,
  count() AS attempts,
  math::mean(score) AS avg_score
FROM user:xxx->completes
GROUP BY out.subject;
```

---

### 3. Table `user_progress` - Restructuration nécessaire

**Problème actuel:** Table SCHEMALESS avec références à `matiere` (système obsolète).

**Recommandation: Utiliser une relation + standardiser sur `subject`**

```sql
-- ========== RELATION: user -> masters -> subject ==========
-- Progression par matière

DEFINE TABLE masters SCHEMAFULL TYPE RELATION
  FROM user
  TO subject
  PERMISSIONS NONE;

DEFINE FIELD level ON masters TYPE string DEFAULT 'débutant' ASSERT $value INSIDE ['débutant', 'intermédiaire', 'confirmé', 'expert'] PERMISSIONS FULL;
DEFINE FIELD total_xp ON masters TYPE number DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD quizzes_completed ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD correct_answers ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD total_answers ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD best_streak ON masters TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD updated_at ON masters TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- ========== RELATION: user -> studies -> theme ==========
-- Progression par thème (plus granulaire)

DEFINE TABLE studies SCHEMAFULL TYPE RELATION
  FROM user
  TO theme
  PERMISSIONS NONE;

DEFINE FIELD mastery_level ON studies TYPE number DEFAULT 0 PERMISSIONS FULL; -- 0-100%
DEFINE FIELD questions_seen ON studies TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD correct_count ON studies TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD last_practiced ON studies TYPE datetime PERMISSIONS FULL;
```

**Requêtes facilitées:**
```sql
-- Niveau global d'un utilisateur par matière
SELECT ->masters.* FROM user:xxx;

-- Thèmes à réviser (faible maîtrise)
SELECT <-studies<-user, mastery_level 
FROM theme 
WHERE <-studies<-user = user:xxx AND mastery_level < 50
ORDER BY mastery_level ASC;

-- Recommandation de quiz basée sur les lacunes
SELECT * FROM quiz 
WHERE theme_ids CONTAINSANY (
  SELECT out FROM user:xxx->studies WHERE mastery_level < 60
);
```

---

### 4. Relations `theme` ↔ `question` - Utiliser des edges

**Problème actuel:** `theme_ids` est un array dans `question`.

**Recommandation: Relation bidirectionnelle**

```sql
-- ========== RELATION: question -> covers -> theme ==========
DEFINE TABLE covers SCHEMAFULL TYPE RELATION
  FROM question
  TO theme
  PERMISSIONS NONE;

DEFINE FIELD weight ON covers TYPE number DEFAULT 1 PERMISSIONS FULL; -- Importance du thème dans la question
```

**Avantages:**
```sql
-- Toutes les questions d'un thème
SELECT <-covers<-question FROM theme:lcxetf364kcha3qsyazi;

-- Tous les thèmes d'une question
SELECT ->covers->theme FROM question:xxx;

-- Questions multi-thèmes (difficiles)
SELECT * FROM question WHERE count(->covers->theme) > 1;
```

---

### 5. Table `badge` et `user_badge` - Relations de graphe

**Recommandation:**

```sql
-- ========== TABLE badge (SCHEMAFULL) ==========
DEFINE TABLE badge TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD name ON badge TYPE string PERMISSIONS FULL;
DEFINE FIELD description ON badge TYPE string PERMISSIONS FULL;
DEFINE FIELD icon ON badge TYPE string PERMISSIONS FULL;
DEFINE FIELD category ON badge TYPE string ASSERT $value INSIDE ['progress', 'performance', 'streak', 'xp', 'special'] PERMISSIONS FULL;
DEFINE FIELD condition_type ON badge TYPE string PERMISSIONS FULL;
DEFINE FIELD condition_value ON badge TYPE number PERMISSIONS FULL;
DEFINE FIELD points ON badge TYPE int DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD is_active ON badge TYPE bool DEFAULT true PERMISSIONS FULL;
DEFINE FIELD created_at ON badge TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- ========== RELATION: user -> earns -> badge ==========
DEFINE TABLE earns SCHEMAFULL TYPE RELATION
  FROM user
  TO badge
  PERMISSIONS NONE;

DEFINE FIELD earned_at ON earns TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD context ON earns TYPE option<object> PERMISSIONS FULL; -- ex: {quiz_id: "quiz:xxx", score: 100}
```

**Requêtes:**
```sql
-- Badges d'un utilisateur
SELECT ->earns->badge.* FROM user:xxx;

-- Utilisateurs ayant un badge spécifique
SELECT <-earns<-user FROM badge:perfect_quiz;

-- Badge le plus rare
SELECT out AS badge, count() AS total 
FROM earns 
GROUP BY out 
ORDER BY total ASC 
LIMIT 1;
```

---

### 6. Relations `tutor_student` - Restructuration

**Recommandation:**

```sql
-- ========== RELATION: user (tutor) -> tutors -> user (student) ==========
DEFINE TABLE tutors SCHEMAFULL TYPE RELATION
  FROM user
  TO user
  PERMISSIONS NONE;

DEFINE FIELD role ON tutors TYPE string DEFAULT 'tutor' ASSERT $value INSIDE ['tutor', 'parent', 'teacher'] PERMISSIONS FULL;
DEFINE FIELD created_at ON tutors TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD is_active ON tutors TYPE bool DEFAULT true PERMISSIONS FULL;

-- Contrainte: le tuteur ne peut pas être l'étudiant
-- (À valider côté application)
```

**Requêtes:**
```sql
-- Étudiants d'un tuteur
SELECT ->tutors->user FROM user:tutor_xxx;

-- Tuteurs d'un étudiant
SELECT <-tutors<-user FROM user:student_xxx;

-- Progression de tous les étudiants d'un tuteur
SELECT 
  ->tutors->user AS student,
  ->tutors->user->completes.score AS scores
FROM user:tutor_xxx;
```

---

## 🔄 Tables avec Doublons/Confusion

### `matiere` vs `subject`

**Constat:** Deux systèmes coexistent:
- `subject` (nouveau): Table définie, utilisée dans `official_program`, `theme`
- `matiere` (ancien): Référencée dans `user_progress`, `backoffice_user`, `competence`

**Recommandation:** Migrer tout vers `subject` et supprimer `matiere`.

```sql
-- Migration (à exécuter une fois)
UPDATE user_progress SET subject_id = type::thing("subject", matiere_id.code) WHERE matiere_id != NONE;
UPDATE competence SET subject = type::thing("subject", matiere_slug) WHERE matiere_slug != NONE;

-- Puis supprimer les références à matiere
```

---

### `theme` vs `chapter` vs `topic`

**Constat:** Trois niveaux de granularité:
- `domain` → `subject` → `official_program` → `chapter` (Programme officiel)
- `subject` → `theme` → `topic` (Catégorisation quiz)

**Recommandation:** Clarifier la hiérarchie:

```
HIÉRARCHIE PROGRAMME OFFICIEL (pour référentiel)
domain (ex: Sciences)
└── subject (ex: Physique-Chimie)
    └── official_program (ex: PC 6ème)
        └── chapter (ex: États de la matière)
            └── skill (ex: Identifier les états)

HIÉRARCHIE QUIZ (pour questions)
subject (ex: Physique-Chimie)
└── theme (ex: La matière)
    └── topic (ex: États physiques) -- optionnel, granularité fine
```

**Lien entre les deux:**
```sql
-- Relation chapter <-> theme pour aligner programme et quiz
DEFINE TABLE aligns_with SCHEMAFULL TYPE RELATION
  FROM chapter
  TO theme
  PERMISSIONS NONE;
```

---

## 📈 Optimisations de Performance

### 1. Index manquants

```sql
-- Questions par type (filtrage fréquent)
DEFINE INDEX idx_question_type ON question FIELDS questionType;

-- Quiz par visibilité
DEFINE INDEX idx_quiz_visibility ON quiz FIELDS visibility;

-- Sessions par statut (pour nettoyage)
DEFINE INDEX idx_session_status ON quiz_session FIELDS status;

-- Progression par utilisateur+matière
DEFINE INDEX idx_progress_user_subject ON masters FIELDS in, out UNIQUE;
```

### 2. Dénormalisation calculée

```sql
-- Compteurs sur user (mis à jour via triggers)
DEFINE FIELD stats ON user FLEXIBLE TYPE object DEFAULT {
  total_quizzes: 0,
  total_xp: 0,
  current_streak: 0,
  best_streak: 0
} PERMISSIONS FULL;

-- Trigger pour mettre à jour après un quiz
DEFINE EVENT on_quiz_complete ON TABLE completes WHEN $event = "CREATE" THEN {
  UPDATE $before.in SET 
    stats.total_quizzes += 1,
    stats.total_xp += ($after.score * 10)
};
```

---

## 🗑️ Tables à supprimer

1. **`option`** - Vide, pas de schéma, probablement créée par erreur
2. **`matiere`** - Remplacer par `subject` partout
3. **Tables de migration** - Celles préfixées pour les anciennes migrations

---

## 📋 Plan de Migration

### Phase 1: Schémas des tables critiques (Priorité HAUTE)
1. ✅ Définir schéma complet pour `question`
2. ✅ Définir schéma complet pour `quiz`
3. ✅ Créer relation `completes` (user -> quiz)
4. ✅ Migrer `quiz_session` vers `completes`

### Phase 2: Relations et progression
5. Créer relation `masters` (user -> subject)
6. Créer relation `studies` (user -> theme)
7. Migrer `user_progress`
8. Créer relation `earns` (user -> badge)

### Phase 3: Nettoyage
9. Supprimer `matiere`, migrer vers `subject`
10. Supprimer tables orphelines
11. Ajouter les index manquants

---

## 🔧 Script de Migration Proposé

Voir fichier séparé: `database/migrations/audit-migration.ts`

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| Tables SCHEMALESS | 14 | 0 |
| Relations de graphe | 0 | 6 |
| Index | 25 | 35+ |
| Requêtes stats | Complexes (JOINs) | Simples (Graph) |
| Intégrité données | Faible | Forte |

---

## 🎯 Bénéfices Attendus

1. **Performance**: Requêtes de graphe 10x plus rapides pour les stats
2. **Intégrité**: Validation des données à l'insertion
3. **Maintenabilité**: Schéma documenté, erreurs détectées tôt
4. **Évolutivité**: Ajout de nouvelles relations simplifié
5. **Cohérence**: Un seul système de référence (plus de `matiere`)

