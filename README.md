# Papaours

Projet web basé sur la stack moderne : Bun + Vite + Svelte + SurrealDB + Cloudflare

## 🚀 Stack technique

- **Bun** - Runtime JavaScript ultra-rapide
- **Vite** - Build tool moderne
- **Svelte** - Framework réactif
- **SurrealDB** - Base de données distribuée
- **Cloudflare Pages** - Hébergement et déploiement

## 📦 Installation

```bash
# Installer les dépendances avec Bun
bun install
```

## 🛠️ Développement

```bash
# Démarrer le serveur de développement
bun run dev
```

L'application sera accessible sur http://localhost:5173

## 🏗️ Build

```bash
# Compiler pour la production
bun run build
```

## 🌐 Déploiement sur Cloudflare Pages

```bash
# Déployer sur Cloudflare Pages
bun run deploy
```

## 💾 Configuration SurrealDB

Le projet est configuré pour se connecter à SurrealDB avec :
- **Namespace**: papaours
- **Database**: dbpapaours
- **User**: root
- **URL**: http://localhost:8000/rpc

Assurez-vous que SurrealDB est lancé avant de démarrer l'application :

```bash
surreal start --log trace --user root --pass root
```

## 📁 Structure du projet

```
papaours/
├── src/
│   ├── lib/
│   │   └── db.ts           # Configuration SurrealDB
│   ├── components/          # Composants Svelte
│   ├── App.svelte          # Composant principal
│   ├── main.ts             # Point d'entrée
│   └── app.css             # Styles globaux
├── public/                  # Assets statiques
├── index.html              # Template HTML
├── package.json            # Dépendances
├── vite.config.ts          # Configuration Vite
├── tsconfig.json           # Configuration TypeScript
└── wrangler.toml           # Configuration Cloudflare
```

## 📝 Scripts disponibles

- `bun run dev` - Lance le serveur de développement
- `bun run build` - Compile le projet pour la production
- `bun run preview` - Prévisualise le build de production
- `bun run deploy` - Déploie sur Cloudflare Pages
- `bun run check` - Vérifie le code TypeScript et Svelte
