# Open Facture API

Backend Node.js (Express + Prisma + PostgreSQL) utilisé par l’interface React.

## Prérequis

- Node.js 20+
- PostgreSQL 14+

## Installation

```bash
cd server
npm install
cp .env.example .env
# éditer .env (DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN…)
```

### Base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
# optionnel : créer un admin
npm run prisma:seed
```

### Lancement

```bash
npm run dev
```

- API : `http://localhost:4000/api`
- Fichiers uploadés : `http://localhost:4000/uploads/*`

## Variables d’environnement

| Nom | Description |
| --- | --- |
| `PORT` | Port HTTP (défaut : 4000) |
| `DATABASE_URL` | Connexion PostgreSQL |
| `JWT_SECRET` | Clé de signature JWT (≥32 caractères) |
| `CLIENT_ORIGIN` | Origine autorisée pour le front |
| `ALLOWED_ORIGINS` | Liste supplémentaire séparée par des virgules |
| `COOKIE_SECURE` | Force le cookie `Secure` (prod recommandé) |
| `COOKIE_SAME_SITE` | Politique Same-Site (`lax`/`strict`/`none`) |

## Endpoints principaux

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Inscription + cookie de session |
| `POST` | `/api/auth/login` | Connexion |
| `POST` | `/api/auth/logout` | Déconnexion + rotation `tokenVersion` |
| `GET` | `/api/auth/me` | Profil courant |
| `GET` | `/api/invoices` | Liste paginée (`page`, `limit`) |
| `GET` | `/api/invoices/summary` | Agrégations (totaux, dernières factures) |
| `POST` | `/api/invoices` | Création de facture (totaux recalculés serveur) |
| `GET` | `/api/invoices/:id` | Détail |
| `PUT` | `/api/invoices/:id` | Mise à jour |
| `DELETE` | `/api/invoices/:id` | Suppression |
| `POST` | `/api/profile/logo` | Téléversement du logo utilisateur (JSON base64) |

Toutes les routes `/api/**` nécessitent une authentification (cookie ou header `Authorization: Bearer`).

## Notes techniques

- Les montants (`subtotal`, `total`, `balanceDue`, `taxAmount`) sont recalculés backend pour garantir l’intégrité.
- Les requêtes supportent la pagination (`page`, `limit`, max 100). Les agrégations du dashboard s’effectuent via `/summary`.
- Les tokens sont invalidés lorsque l’utilisateur se déconnecte (champ `tokenVersion`).
- Les fichiers uploadés sont stockés dans `server/uploads` et servis statiquement via `/uploads`.

## Tests
- Tests d'intégration API (Vitest + Supertest) :

```bash
npm run test --prefix server
```

- Tests End-to-End (Playwright) exécutés depuis la racine :

```bash
npm run test:e2e
```

Avant de lancer les tests E2E, assurez-vous que l’API et la base PostgreSQL sont opérationnelles.
