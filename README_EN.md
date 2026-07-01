# Google Calendar RSVP comments to Google Chat Notifier 📅 💬

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![Language](https://img.shields.io/badge/Language-FR%20%2F%20EN-brightgreen)](#)

🌐 **[Version Française ici](README.md)**

---

This Google Apps Script monitors your primary **Google Calendar** for attendee RSVP comments and sends structured, interactive **Google Chat Card V2** alerts to your Chat space.

### 🌟 Features

1. **Interactive Card V2 Format:** Displays a modern, clean card in Google Chat featuring:
   - Visual icons for the guest and their note.
   - An **"Open Event"** button to jump directly to Google Calendar.
   - A **"Reply by email"** button to email the guest in one click.
2. **Bilingual Support (FR / EN):** Alert text and action buttons are translated dynamically according to your language preference (auto-detected or manually configured).
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
  const langue = "FR"; // Alert language: "FR" or "EN" (defaults to "FR")
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
