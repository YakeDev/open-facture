# Audit technique – Open Facture

## Priorité moyenne

- [ ] **Introduire une gestion centralisée des traductions** – Aujourd’hui tous les textes sont en “hard-coded” français ; préparer l’avenir en intégrant un système i18n (ex. react-i18next) permettrait d’ajouter d’autres langues et d’éviter la duplication de chaînes (`src/pages/InvoiceBuilder.jsx`, `src/components/*`).
- [ ] **Service d’actualisation automatique des taux** – Remplacer la saisie manuelle par un worker côté backend qui interroge une API de change (ex. ExchangeRate API) et stocke le snapshot pour chaque utilisateur (`server/src/lib/invoice.js`, `server/prisma/schema.prisma`).

## Priorité basse & opportunités

- [ ] **Durcir la sécurité d’upload** – Limiter les types MIME via un service dédié, ajouter un scan antivirus (ClamAV/S3 AV) et un job de nettoyage des fichiers orphelins (`server/src/routes/profile.routes.js`, dossier `server/uploads`).
- [ ] **Audit accessibilité** – Ajouter ARIA landmarks, focus visibles et annonces screen-reader sur les formulaires (notamment boutons “Télécharger”, erreurs d’authentification). Un passage avec Lighthouse/axe pointera les correctifs nécessaires.

## Tests & QA

- [ ] **Tests de non-régression sur le builder PDF** – Mettre en place des snapshots PDF (ex. pdf-to-image) ou des tests d’intégration côté front pour vérifier la génération des tableaux et montants lorsque les devises/taxes changent.

## Documentation & DX

- [ ] **Documenter l’architecture et les flux** – Ajouter un schéma du parcours (front ↔ API ↔ PostgreSQL) et des séquences d’authentification. Cela facilitera l’onboarding et la mise en place de contributions externes (fichier `docs/architecture.md` ou section dédiée dans le README).
