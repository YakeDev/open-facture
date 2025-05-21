# Application Web de Facturation

Cette application web permet de générer, personnaliser et télécharger des factures professionnelles directement depuis un navigateur. Conçue pour les freelances et les petites structures, elle offre une interface intuitive et un export PDF sans dépendre de solutions tierces payantes.

## Fonctionnalités principales

- **Ajout de logo** : Importez et modifiez le logo de votre entreprise.
- **Gestion des clients** : Saisie rapide des informations émetteur et destinataire.
- **Dates & Conditions** : Sélection de la date, modalités de paiement, échéance et numéro de commande.
- **Tableau des prestations** : Ajout, édition, suppression d’éléments avec quantités, tarifs et calcul automatique des montants.
- **Notes & Conditions** : Section libre pour ajouter des informations complémentaires.
- **Résumé financier** : Calcul automatique du sous-total, taxes, total, montant payé et solde dû.
- **Sélecteur de devise** : Choix parmi plusieurs devises (USD, EUR, CDF, etc.).
- **Export PDF** : Génération d’un PDF conforme à la maquette, avec téléchargement instantané.
- **Persistance locale** : Sauvegarde automatique des factures dans le `localStorage`.

## Technologies utilisées

- **React 18** (via Vite)
- **Tailwind CSS**
- **jsPDF** et **jspdf-autotable** pour la génération de PDF
- **LocalStorage** pour la persistance

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/facturation-app.git
   cd facturation-app
   ```
2. Installer les dépendances :
   ```bash
    npm install
   ```
3. Lancer le serveur de développement :
   ```bash
    npm run dev
   ```
4. Ouvrir votre navigateur à http://localhost:5173
