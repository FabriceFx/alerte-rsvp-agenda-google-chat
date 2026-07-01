# Google Calendar RSVP comments to Google Chat Notifier 📅 💬

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![Language](https://img.shields.io/badge/Language-FR%20%2F%20EN-brightgreen)](#)

[Français](#version-française) | [English](#english-version)

---

## Version Française

Ce script automatise l'envoi d'alertes en temps réel sur **Google Chat** (format Card V2) dès qu'un invité ajoute une note ou un commentaire lors de sa réponse (RSVP) à l'une de vos invitations sur **Google Agenda**.

### 🌟 Fonctionnalités

1. **Format Card V2 interactif :** Affiche une carte Google Chat moderne et épurée avec :
   - Des icônes descriptives pour l'invité et son commentaire.
   - Un bouton **"Ouvrir l'événement"** pour accéder directement à l'agenda.
   - Un bouton **"Répondre par e-mail"** pour contacter rapidement l'invité.
2. **Support Bilingue (FR / EN) :** Le contenu et les boutons des cartes sont automatiquement traduits en fonction de votre préférence linguistique.
3. **Sécurité avancée :** Pas de secrets (comme l'URL de webhook) enregistrés en dur dans le code. Tout est stocké dans les propriétés sécurisées du script.
4. **Zéro doublon (Lock Service) :** Utilise un système de verrouillage logiciel (`LockService`) pour éviter les conflits d'écritures et l'envoi d'alertes en double lors de runs concurrents.
5. **Auto-nettoyage (Garbage Collection) :** Supprime automatiquement de sa mémoire les événements terminés depuis plus de 7 jours pour ne jamais saturer le quota de stockage (500 Ko).

### 🛠️ Configuration et Installation

#### 1. Prérequis Google Apps Script
Dans votre éditeur Google Apps Script, vous devez impérativement activer l'API Agenda :
- Dans la barre latérale gauche, cliquez sur **Services** (l'icône `+`).
- Recherchez **Google Calendar API** (ou **API Google Calendar**).
- Cliquez sur **Ajouter**.

#### 2. Configuration Initiale des Clés
- Ouvrez le fichier `Code.gs` et naviguez tout en bas jusqu'à la fonction `configurerInitialisation()`.
- Remplacez les valeurs fictives par vos informations réelles :
  ```javascript
  const urlWebhook = "VOTRE_WEBHOOK_GOOGLE_CHAT"; // Votre webhook de salon Chat
  const idCalendrier = "primary"; // ID calendrier (laisser "primary" pour le vôtre)
  const langue = ""; // Optionnel : laisser vide "" pour détecter la langue du compte, ou mettre "FR"/"EN"
  ```
- Sélectionnez la fonction `configurerInitialisation` dans le menu déroulant de l'éditeur et cliquez sur **Exécuter**. Une fois terminé, vous pouvez effacer ces informations du code si vous le souhaitez, elles sont sauvegardées en sécurité.

#### 3. Déclencheur Automatique (Trigger)
Pour que la vérification s'exécute automatiquement en tâche de fond :
- Dans l'éditeur Apps Script, accédez à la section **Déclencheurs** (icône d'horloge dans le menu de gauche).
- Cliquez sur **Ajouter un déclencheur** en bas à droite.
- Configurez-le ainsi :
  - Fonction à exécuter : `verifierNotesAgenda`
  - Déploiement : `Tête`
  - Source de l'événement : `Déclencheur temporel`
  - Type de déclencheur horaire : `Minutes` (recommandé : *toutes les 15 ou 30 minutes*).

---

## English Version

This Google Apps Script monitors your primary **Google Calendar** for attendee RSVP comments and sends structured, interactive **Google Chat Card V2** alerts to your Chat space.

### 🌟 Features

1. **Interactive Card V2 Format:** Displays a modern, clean card in Google Chat featuring:
   - Visual icons for the guest and their note.
   - An **"Open Event"** button to jump directly to Google Calendar.
   - A **"Reply by email"** button to email the guest in one click.
2. **Bilingual Support (FR / EN):** Alert text and action buttons are translated dynamically according to your language preference.
3. **High Security:** No secrets (like Webhook URLs) are hardcoded in the script. Everything is stored in Google Apps Script's secure properties store.
4. **Concurrency Safe (Lock Service):** Uses a mutual-exclusion software lock (`LockService`) to prevent concurrent runs from sending duplicate alerts.
5. **Auto-Cleanup (Garbage Collection):** Scans and deletes stored keys for meetings that ended more than 7 days ago to stay well within Google's 500 KB properties limit.

### 🛠️ Configuration and Installation

#### 1. Google Apps Script Prerequisites
In your Google Apps Script editor, you must enable the Calendar API service:
- On the left sidebar, click on **Services** (the `+` icon).
- Search for **Google Calendar API**.
- Click **Add**.

#### 2. Initial Setup
- Open `Code.gs` and locate the `configurerInitialisation()` function at the very bottom.
- Replace the placeholders with your actual settings:
  ```javascript
  const urlWebhook = "YOUR_GOOGLE_CHAT_WEBHOOK_URL"; // Google Chat webhook URL
  const idCalendrier = "primary"; // Calendar ID ("primary" is default)
  const langue = ""; // Optional: leave empty "" to auto-detect account language, or set to "EN"/"FR"
  ```
- Select the `configurerInitialisation` function in the editor toolbar dropdown and click **Run**. Once completed, you may safely delete these credentials from the file as they are stored securely in the script settings.

#### 3. Automatic Trigger Setup
To make the script check for comments automatically in the background:
- Inside the Apps Script editor, go to **Triggers** (clock icon on the left menu).
- Click **Add Trigger** in the bottom right.
- Set it up with the following options:
  - Choose which function to run: `verifierNotesAgenda`
  - Choose which deployment should run: `Head`
  - Select event source: `Time-driven`
  - Select type of time based trigger: `Minutes timer` (recommended: *every 15 or 30 minutes*).
