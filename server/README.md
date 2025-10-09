# Open Facture API

Backend Node.js qui accompagne l'application front-end React. Basé sur Express, Prisma et PostgreSQL.

## Prérequis

- Node.js 18+
- PostgreSQL 14+

## Installation

```bash
cd server
npm install
cp .env.example .env
```

Modifier `DATABASE_URL`, `JWT_SECRET` et `CLIENT_ORIGIN` dans `.env`.

## Base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Pour explorer les données :

```bash
npx prisma studio
```

## Démarrage

```bash
npm run dev
```

Le serveur écoute par défaut sur `http://localhost:4000`.

## Endpoints principaux

- `POST /api/auth/register` – création de compte (retourne cookie de session)
- `POST /api/auth/login` – connexion
- `POST /api/auth/logout` – déconnexion
- `GET /api/auth/me` – profil courant (token obligatoire)
- `GET /api/invoices` – liste paginée des factures
- `POST /api/invoices` – création
- `GET /api/invoices/:id` – détail
- `PUT /api/invoices/:id` – mise à jour
- `DELETE /api/invoices/:id` – suppression

Toutes les routes `/api/invoices` nécessitent une authentification (cookie ou header `Authorization: Bearer`).
