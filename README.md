# Google Calendar RSVP comments to Google Chat Notifier 📅 💬

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![Language](https://img.shields.io/badge/Language-FR%20%2F%20EN-brightgreen)](#)

🌐 **[English Version here](README_EN.md)**

---

Ce script automatise l'envoi d'alertes en temps réel sur **Google Chat** (format Card V2) dès qu'un invité ajoute une note ou un commentaire lors de sa réponse (RSVP) à l'une de vos invitations sur **Google Agenda**.

### 🌟 Fonctionnalités

1. **Format Card V2 interactif :** Affiche une carte Google Chat moderne et épurée avec :
   - Des icônes descriptives pour l'invité et son commentaire.
   - Un bouton **"Ouvrir l'événement"** pour accéder directement à l'agenda.
   - Un bouton **"Répondre par e-mail"** pour contacter rapidement l'invité.
2. **Support Bilingue (FR / EN) :** Le contenu et les boutons des cartes sont automatiquement traduits en fonction de votre préférence linguistique (détectée automatiquement ou configurée manuellement).
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
  const langue = "FR"; // Langue de vos alertes : "FR" ou "EN" (par défaut "FR")
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
