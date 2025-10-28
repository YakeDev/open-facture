# Open Facture

Application web de facturation avec génération PDF, synchronisation serveur et authentification par cookie. Le projet est découpé en deux parties :

- **Front-end** : React + Vite + Tailwind (dossier racine)
- **Back-end** : Express + Prisma + PostgreSQL (dossier `server`)

## Fonctionnalités principales

- Création et édition de factures multi-devises avec conversion automatique
- Synchronisation sécurisée avec l’API (authentification par cookie JWT)
- Tableau de bord (totaux facturés, encaissés, solde dû, dernières factures)
- Gestion d’un historique local exportable en CSV
- Téléversement du logo sur le serveur (stockage persistant via `User.logoUrl`)
- Génération PDF fidèle avec jsPDF / autotable
- Ajustement manuel des taux de change avec validation et horodatage

## Prérequis

- Node.js 20+
- PostgreSQL 14+

## Installation rapide

```bash
# 1. Installer les dépendances front
npm install

# 2. Installer les dépendances back
npm install --prefix server

# 3. Préparer les variables d’environnement
cp .env.example .env
cp server/.env.example server/.env
# éditer server/.env (DATABASE_URL, JWT_SECRET, …)

# 4. Générer le client Prisma et appliquer les migrations
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server
# Optionnel : seed utilisateur admin
npm run prisma:seed --prefix server

# 5. Lancer les deux serveurs (deux terminaux)
npm run dev --prefix server
npm run dev
```

- Front-end disponible sur http://localhost:5173
- API disponible sur http://localhost:4000/api

## Scripts utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | démarre le front avec Vite |
| `npm run build` | construit le front |
| `npm run lint` | lint front + back (ESLint flat config) |
| `npm run test` | exécute les tests Vitest côté front |
| `npm run test --prefix server` | lance les tests d'intégration API |
| `npm run test:e2e` | exécute les tests Playwright (front + API requis) |
| `npm run dev --prefix server` | démarre l’API (nodemon) |
| `npm run prisma:migrate --prefix server` | migration Prisma |

## Variables d’environnement

### Front (`.env`)

```
VITE_API_BASE_URL=http://localhost:4000/api
```

### Back (`server/.env`)

```
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/open_facture
JWT_SECRET=change-me-with-a-strong-secret-key-at-least-32-chars
CLIENT_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

## Tests & CI

- Vitest + Testing Library couvrent les utilitaires et composants critiques (`npm run test`).
- Des tests d'intégration API (Vitest + Supertest) vérifient l'authentification et la synthèse des factures (`npm run test --prefix server`).
- Les tests End-to-End Playwright reproduisent le parcours d'inscription/connexion (`npm run test:e2e`) — nécessite l'API, la base et les navigateurs Playwright.
- Une pipeline GitHub Actions (`.github/workflows/ci.yml`) installe les deux projets, exécute ESLint et les tests unitaires front.

## Points notables

- L’API recalculent systématiquement les totaux / taxes et expose une pagination (`GET /api/invoices?page=1&limit=20`).
- Les agrégations du tableau de bord sont disponibles via `GET /api/invoices/summary`.
- Le téléversement du logo se fait via `POST /api/profile/logo` (payload JSON base64) et les fichiers sont servis via `/uploads/*`.
- Les tokens sont invalidés lors de la déconnexion (rotation `tokenVersion`).

Pour plus de détails sur l’API, voir `server/README.md`.
