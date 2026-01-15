# 🐻 Papa Ours - Quiz Musical

Application de quiz sur les familles d'instruments et l'orchestre symphonique avec backoffice d'administration.

## 🚀 Stack technique

- **Frontend**: SvelteKit 5 (Runes) + TailwindCSS
- **Base de données**: SurrealDB Cloud
- **Stockage**: Cloudflare R2
- **Runtime**: Bun
- **Déploiement**: Cloudflare Pages

## 📦 Installation

```bash
# Installer les dépendances avec Bun
bun install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos identifiants

# Initialiser la base de données
bun run db:init
```

## 🛠️ Développement

```bash
# Démarrer le serveur de développement
bun run dev
```

L'application sera accessible sur http://localhost:5173

### Scripts disponibles

- `bun run dev` - Démarre le serveur de développement
- `bun run build` - Compile l'application pour la production
- `bun run preview` - Prévisualise la version de production
- `bun run db:init` - Initialise la base de données avec le schéma et les données initiales

## 🔐 Backoffice Admin

### Accès

- URL: `http://localhost:5173/admin`
- Email: `alistair.marca@gmail.com`
- Mot de passe: `n1n@S1mone`

### Fonctionnalités

- **Dashboard**: Vue d'ensemble des statistiques
- **Gestion des questions**: 
  - Créer, modifier, supprimer des questions
  - Activer/désactiver des questions
  - Gestion des images
  - Organisation par famille d'instruments
- **Bibliothèque média**: Gestion des images sur Cloudflare R2 (à venir)

## 🗄️ Structure de la base de données

### Table `admin`
- `email` - Email de connexion (unique)
- `password` - Mot de passe (⚠️ à hasher en production!)
- `name` - Nom de l'administrateur
- `role` - Rôle (admin)
- `createdAt`, `updatedAt` - Dates de création/modification

### Table `question`
- `question` - Texte de la question
- `family` - Famille d'instrument (cordes, bois, cuivres, percussions, general)
- `options` - Array des options de réponse (minimum 2)
- `correctAnswer` - Index de la bonne réponse
- `explanation` - Explication pédagogique
- `imageUrl` - URL de l'image
- `imageCaption` - Légende de l'image
- `difficulty` - Difficulté (easy, medium, hard)
- `isActive` - Question active ou non
- `order` - Ordre d'affichage
- `createdBy` - Référence à l'admin créateur

### Table `media`
- `filename` - Nom du fichier
- `cloudflareId` - ID Cloudflare R2
- `publicUrl` - URL publique
- `mimeType` - Type MIME
- `size`, `width`, `height` - Dimensions
- `alt` - Texte alternatif
- `uploadedBy` - Référence à l'admin

### Table `quiz_result`
- `userId` - Identifiant de l'utilisateur
- `score` - Score obtenu
- `totalQuestions` - Nombre total de questions
- `answers` - Array des réponses
- `completedAt` - Date de complétion

## 🌐 Configuration Cloudflare R2

Les images peuvent être hébergées sur Cloudflare R2 pour un accès rapide et global.

Variables d'environnement requises (déjà configurées dans `.env`) :
```env
CLOUDFLARE_ACCOUNT_ID=81588daa21230db6bb4470ac12c570a6
CLOUDFLARE_R2_ACCESS_KEY_ID=481c0c6fd6e426444b096e21ab698ce2
CLOUDFLARE_R2_SECRET_ACCESS_KEY=ad4dabefa02d5c3c026f3956c8a4d17a98300aae6fb7a7360ce55f09988151c0
CLOUDFLARE_R2_BUCKET_NAME=papaours
CLOUDFLARE_R2_PUBLIC_URL=https://pub-f202da29d4864eb9b04d369e4a3ccea8.r2.dev
```

## 🏗️ Build

```bash
# Compiler pour la production
bun run build
```

## 💾 Configuration SurrealDB

Le projet est configuré pour se connecter à **SurrealDB Cloud** avec :
- **URL**: wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud
- **Namespace**: papaours
- **Database**: dbpapaours
- **User**: rootuser

La connexion est automatique via les variables d'environnement dans `.env`.

## 🔒 Sécurité

⚠️ **Important pour la production** :

1. **Hasher les mots de passe** avec bcrypt ou argon2
2. **Implémenter JWT** pour l'authentification
3. **Ajouter des middlewares** de protection des routes admin
4. **Valider les données** côté serveur
5. **Limiter les tentatives** de connexion
6. **Utiliser HTTPS** en production
7. **Ne jamais commit le fichier `.env`**

## 📁 Structure du projet

```
papaours/
├── src/
│   ├── lib/
│   │   ├── db.ts              # Connexion SurrealDB
│   │   ├── cloudflare.ts      # Upload Cloudflare R2
│   │   ├── quizData.ts        # Questions initiales
│   │   ├── stores/
│   │   │   └── adminStore.ts  # Store admin
│   │   └── utils.ts
│   ├── routes/
│   │   ├── +page.svelte       # Page d'accueil du quiz
│   │   ├── +layout.svelte     # Layout principal
│   │   ├── quiz/
│   │   │   └── +page.svelte   # Interface du quiz
│   │   ├── login/
│   │   │   └── +page.svelte   # Login utilisateur (sauvegardé)
│   │   ├── admin/
│   │   │   ├── +page.svelte   # Login admin
│   │   │   ├── dashboard/     # Dashboard
│   │   │   └── questions/     # Gestion questions
│   │   └── api/
│   │       └── admin/         # API REST admin
│   │           ├── login/
│   │           ├── stats/
│   │           └── questions/
│   └── app.html
├── scripts/
│   └── init-db.ts             # Script d'initialisation DB
├── static/                    # Assets statiques
├── .env                       # Variables d'environnement (ne pas commit)
├── .env.example               # Template des variables
├── package.json
├── vite.config.ts
├── svelte.config.js
└── wrangler.toml              # Configuration Cloudflare
```

## 🤝 Contribution

Ce projet est développé pour l'éducation musicale des enfants.

## 📝 License

Tous droits réservés - Papa Ours © 2026
