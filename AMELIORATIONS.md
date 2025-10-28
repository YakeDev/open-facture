# Audit technique – Open Facture

## Priorité haute
- [x] **Corriger la chaîne de traitement des erreurs HTTP** – Le middleware déclaré ne respecte pas la signature Express à 4 arguments, ce qui laisse passer les `next(error)` vers le handler générique et renvoie un HTML 500 par défaut.`server/src/app.js:37` Implémenter un vrai middleware d'erreur (avec `next`) et centraliser la journalisation sans divulguer l'erreur brute en production.
- [x] **Recalculer les totaux côté API** – Les montants envoyés par le client sont persistés tels quels, ce qui permettrait à un client malveillant d’enregistrer un `total` incohérent ou négatif. `server/src/routes/invoice.routes.js:46` `server/src/routes/invoice.routes.js:126` Recalculer `subtotal`, `total`, `taxes`, `balanceDue` depuis `items` dans le backend avant insertion/mise à jour et refuser les écarts.
- [x] **Supprimer l’`await` invalide dans `handleDownload`** – La fonction n’est pas `async` mais contient `await finalizeInvoice()`, ce qui casse le bundler et empêche le téléchargement en production. `src/App.jsx:404` `src/App.jsx:682` Marquer `handleDownload` comme `async` (ou chaîner une promesse) et déplacer `finalizeInvoice` hors du handler pour clarifier les étapes.
- [x] **Aligner l’API sur les besoins du dashboard** – Le front appelle `/api/invoices?summary=true` pour calculer les KPIs, mais la route ignore complètement la query et renvoie toute la collection. `src/services/api.js:68` `server/src/routes/invoice.routes.js:32` Ajouter un mode `summary` (agrégations Prisma) et une pagination server-side pour éviter les charges inutiles.
- [x] **Sécuriser la configuration JWT/HTTP** – Un secret par défaut (`dev-secret`) est utilisé en production et les cookies ne sont pas invalidés lors d’un changement de rôle. `server/src/utils/token.js:3` Introduire une validation stricte des variables d’environnement (via Zod), forcer un `JWT_SECRET` non trivial, et ajouter une rotation/révocation lors des changements critiques.

## Priorité moyenne
- [x] **Gérer proprement les doublons Prisma** – Les créations/modifications peuvent déclencher `P2002` sur `number` sans retour clair côté client. `server/src/routes/invoice.routes.js:50` `server/src/routes/invoice.routes.js:149` Adapter le handler d’erreur Prisma pour convertir les codes connus en 409/422 explicites.
- [x] **Uniformiser le chiffrement** – Le backend dépend à la fois de `bcrypt` et `bcryptjs`, ce qui gonfle l’image Docker et complique la maintenance. `server/package.json:20` `server/prisma/seed.js:2` `server/src/routes/auth.routes.js:2` Choisir une implémentation unique (idéalement `bcrypt`) et harmoniser les imports.
- [x] **Fiabiliser la persistance locale** – Un `localStorage` corrompu fait planter l’app sans fallback. `src/utils/storage.js:2` Entourer le `JSON.parse` d’un `try/catch`, purger la clé en cas d’échec et loguer l’événement.
- [x] **Améliorer l’UX des taux de change** – L’édition via `window.prompt` est brusque, peu accessible et non traduite. `src/App.jsx:194` Remplacer par un composant modal contrôlé avec validation, messages d’erreur et valeurs par devise.
- [x] **Isoler la logique de builder** – `App.jsx` concentre plus de 900 lignes mêlant routes, génération PDF, état, etc. `src/App.jsx:1` Extraire la page facture vers `pages/InvoiceBuilder`, déplacer le calcul des montants dans un hook (`useInvoiceBuilder`) et découper les composants (sidebar, history) pour alléger les re-rendus.
- [x] **Ajout d’`AbortController` sur les requêtes** – Les `fetch` restent actifs après un `navigate`, générant warnings et setState sur composant démonté. `src/services/api.js:4` Passer un contrôleur (renvoyé par les hooks) pour annuler les requêtes lorsque le composant se démonte.

## Priorité basse & opportunités
- [x] **Pagination côté base** – Actuellement toutes les factures sont rapatriées puis filtrées côté client. `server/src/routes/invoice.routes.js:32` Introduire `skip/take` et exposer `page/limit` pour des historiques volumineux.
- [x] **Normaliser les dates** – `z.coerce.date()` accepte des formats ambigus; certains navigateurs enverront des chaînes locales. `server/src/schemas/invoice.js:19` Exiger un ISO 8601 (`z.string().datetime()`) et convertir explicitement au fuseau voulu.
- [x] **Centraliser la configuration CORS/Helmet** – Les options sont codées en dur et ignorent les déploiements multi-origines. `server/src/app.js:15` Créer un module `config/security.js` pour piloter CORS, CSP et HSTS via `.env`.
- [x] **Documenter et réutiliser `mapInvoice`** – Le mapper mélange conversions et sérialisation JSON. `server/src/routes/invoice.routes.js:11` Déplacer dans `server/src/lib/mappers/invoice.js` pour mutualiser entre routes et tests.
- [x] **Supporter la sauvegarde du logo côté serveur** – Le logo n’est conservé qu’en base64 locale, ce qui empêche la synchronisation multi-appareils. `src/components/LogoUpload.jsx:3` Introduire un upload (S3/Supabase) et stocker l’URL dans Prisma (`User.logoUrl` déjà disponible).
- [x] **Nettoyer les dépendances front inutilisées** – `html2canvas` et `html2pdf.js` ne sont plus invoqués. `package.json:11` Les retirer allège le bundle (~200 KB) et les audits de sécurité.

## Tests & QA
- [ ] **Back-end** – Ajouter des tests d’intégration (Vitest/Supertest) pour auth et factures (scénarios création/duplication/mise à jour avec transactions). Couvrir explicitement l’agrégation du dashboard et les contrôles d’accès.
- [x] **Front-end** – Mettre en place Vitest + Testing Library pour sécuriser le builder (conversion devises, validation de formulaire, affichage des erreurs réseau). Un test de régression garantit que `handleDownload` déclenche bien la sauvegarde locale.
- [ ] **E2E** – Introduire Playwright/Cypress pour couvrir le parcours complet (inscription → création facture → téléchargement PDF). Utiliser une base de test isolée et des seeds déterministes.

## Documentation & DX
- [x] **Fournir des gabarits d’environnement** – Ajouter `.env.example` côté front (`VITE_API_BASE_URL`) et enrichir celui du backend avec les options sécurité (CORS, cookie). `server/README.md:14`
- [x] **Mettre à jour le README principal** – Le front mentionne encore un stockage 100 % local. `README.md:1` Décrire le mode connecté, les limites connues (taux manuels, logo), les scripts disponibles et le workflow dev (API + front).
- [x] **Automatiser la qualité** – Ajouter un pipeline CI (GitHub Actions) qui installe les deux projets, exécute `npm run lint` et les tests. Publier le badge et documenter la procédure de contribution.
