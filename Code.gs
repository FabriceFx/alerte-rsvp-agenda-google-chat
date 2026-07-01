/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ALERTE RSVP GOOGLE CALENDAR VERS GOOGLE CHAT (VERSION PROFESSIONNELLE)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * DESCRIPTION :
 * Ce script surveille votre calendrier Google principal pour détecter les notes,
 * commentaires et messages laissés par vos invités lors de leur réponse (RSVP)
 * à vos réunions. Dès qu'un commentaire est détecté, le script envoie une carte
 * interactive (Card V2) enrichie dans votre salon Google Chat.
 * 
 * FONCTIONNALITÉS PROFESSIONNELLES :
 * 1. Support Bilingue (FR / EN) : Les textes et les boutons d'action des cartes
 *    Google Chat s'adaptent automatiquement selon la langue configurée.
 * 2. Sécurité (Zéro Secret Hardcodé) : Les secrets (comme l'URL du webhook) ne
 *    sont plus stockés dans le code mais dans les propriétés sécurisées du script.
 *    Une fonction utilitaire `configurerInitialisation` est disponible pour
 *    saisir vos clés une première fois en toute sécurité.
 * 3. Gestion des accès concurrents (Lock Service) : Utilise un verrou logiciel
 *    (`LockService`) pour empêcher l'exécution de tâches parallèles et
 *    garantir qu'aucune notification n'est envoyée en doublon.
 * 4. Détection intelligente : Utilise un horodatage dynamique de suivi de run
 *    (`LAST_RUN_TIMESTAMP`) pour s'assurer qu'aucun événement n'est manqué,
 *    sans doublon ni perte lors des retards d'exécution des triggers Google.
 * 5. Nettoyage de mémoire automatique (Garbage Collection) : Stocke les statuts de
 *    réunion temporairement et supprime automatiquement les clés des événements
 *    terminés depuis plus de 7 jours pour ne jamais saturer l'espace de stockage
 *    des propriétés du script (limité par Google à 500 Ko).
 * 
 * CONFIGURATION ET PRÉREQUIS :
 * 1. Service Google Calendar API : Vous devez ajouter le service "Google Calendar API"
 *    à votre projet Google Apps Script (dans la section "Services" à gauche,
 *    recherchez "Google Calendar API" et cliquez sur Ajouter).
 * 2. Configuration Initiale :
 *    - Ouvrez `configurerInitialisation()` en bas de ce fichier.
 *    - Configurez `"VOTRE_WEBHOOK_GOOGLE_CHAT"`, le calendrier et la langue ("FR" ou "EN").
 *    - Sélectionnez la fonction `configurerInitialisation` dans le menu déroulant de
 *      l'éditeur et cliquez sur "Exécuter".
 * 3. Déclencheur temporel (Trigger) : Créez un déclencheur temporel (icône horloge
 *    dans Apps Script) pour lancer la fonction `verifierNotesAgenda` à intervalle
 *    régulier (ex: toutes les 15 ou 30 minutes).
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Dictionnaire des traductions pour les cartes Google Chat.
 */
const TRADUCTIONS = {
    FR: {
        notificationTitle: "Nouveau commentaire sur un événement de l'agenda !",
        meetingLabel: "Réunion",
        guestLabel: "Invité",
        noteLabel: "Note laissée",
        openEventButton: "Ouvrir l'événement",
        replyEmailButton: "Répondre par e-mail"
    },
    EN: {
        notificationTitle: "New comment on a calendar event!",
        meetingLabel: "Meeting",
        guestLabel: "Guest",
        noteLabel: "Note left",
        openEventButton: "Open Event",
        replyEmailButton: "Reply by email"
    }
};

const verifierNotesAgenda = () => {
    const memoire = PropertiesService.getScriptProperties();
    const idCalendrier = memoire.getProperty("CALENDAR_ID") || "primary";

    // 1. GESTION DU VERROU (Lock Service) pour éviter les accès concurrents
    const verrou = LockService.getScriptLock();
    try {
        // Tente d'acquérir le verrou pendant un maximum de 30 secondes.
        // Si le verrou n'est pas disponible, l'appel lève une exception.
        verrou.waitLock(30000);
    } catch (e) {
        console.warn("Impossible d'acquérir le verrou d'exécution. Une autre instance du script est déjà en cours.");
        return;
    }

    try {
        const CLE_DERNIERE_VERIFICATION = "LAST_RUN_TIMESTAMP";
        const derniereVerification = memoire.getProperty(CLE_DERNIERE_VERIFICATION);

        // Définition de la plage de recherche temporelle
        const tempsMinimum = derniereVerification 
            ? new Date(derniereVerification).toISOString()
            : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const heureDebutRun = new Date().toISOString();

        // Récupération des événements modifiés depuis la dernière vérification
        const listeEvenements = Calendar.Events.list(idCalendrier, {
            updatedMin: tempsMinimum,
            showDeleted: false,
            singleEvents: true
        });

        const evenements = listeEvenements.items;
        if (!evenements || evenements.length === 0) {
            console.log("Aucun événement modifié récemment.");
            memoire.setProperty(CLE_DERNIERE_VERIFICATION, heureDebutRun);
            return;
        }

        evenements.forEach(evenement => {
            if (evenement.organizer?.self && evenement.attendees) {
                evenement.attendees.forEach(invite => {

                    if (invite.comment) {
                        const cleUnique = `${evenement.id}_${invite.email}`;
                        const derniereMiseAJour = evenement.updated;
                        const dejaEnvoye = memoire.getProperty(cleUnique);

                        if (dejaEnvoye) {
                            const [miseAJourEnregistree] = dejaEnvoye.split("|");
                            if (miseAJourEnregistree === derniereMiseAJour) {
                                console.log(`Notification déjà envoyée pour ${invite.email} (Réunion : ${evenement.summary}).`);
                                return;
                            }
                        }

                        envoyerNotificationChat(
                            evenement.summary,
                            invite.displayName || invite.email,
                            invite.comment,
                            evenement.htmlLink,
                            invite.email
                        );

                        const dateFin = evenement.end?.dateTime || evenement.end?.date || "";
                        memoire.setProperty(cleUnique, `${derniereMiseAJour}|${dateFin}`);
                    }
                });
            }
        });

        memoire.setProperty(CLE_DERNIERE_VERIFICATION, heureDebutRun);
        nettoyerAnciennesProprietes(memoire);

    } catch (erreur) {
        console.error(`Erreur lors de l'exécution : ${erreur.message}`);
    } finally {
        // Libération systématique du verrou d'exécution
        verrou.releaseLock();
    }
};

/**
 * Supprime les anciennes clés de propriétés associées à des réunions terminées depuis plus de 7 jours.
 * 
 * @param {GoogleAppsScript.Properties.Properties} memoire - Instance des propriétés du script.
 */
const nettoyerAnciennesProprietes = (memoire) => {
    try {
        const proprietes = memoire.getProperties();
        const maintenant = Date.now();
        const limiteConservation = 7 * 24 * 60 * 60 * 1000; // 7 jours
        let clesNettoyeesCount = 0;

        for (const cle in proprietes) {
            // Ignorer les clés système et de configuration
            if (cle === "LAST_RUN_TIMESTAMP" || 
                cle === "CHAT_WEBHOOK_URL" || 
                cle === "CALENDAR_ID" || 
                cle === "LANGUAGE") {
                continue;
            }

            const valeur = proprietes[cle];
            if (valeur && valeur.includes("|")) {
                const [, dateFinStr] = valeur.split("|");
                if (dateFinStr) {
                    const dateFin = new Date(dateFinStr).getTime();
                    if (!isNaN(dateFin) && (maintenant - dateFin) > limiteConservation) {
                        memoire.deleteProperty(cle);
                        clesNettoyeesCount++;
                    }
                }
            }
        }

        if (clesNettoyeesCount > 0) {
            console.log(`[Nettoyage] ${clesNettoyeesCount} anciennes clés de réunion supprimées de la mémoire.`);
        }
    } catch (e) {
        console.error(`Erreur lors du nettoyage de la mémoire : ${e.message}`);
    }
};

/**
 * Envoie une alerte formatée en Card V2 sur Google Chat.
 * 
 * @param {string} titreReunion - Titre de la réunion.
 * @param {string} nomInvite - Nom ou adresse e-mail de l'invité.
 * @param {string} note - Commentaire laissé par l'invité.
 * @param {string} [lienEvenement] - Lien URL vers l'événement Google Agenda.
 * @param {string} [emailInvite] - Adresse e-mail de l'invité pour le contact direct.
 */
const envoyerNotificationChat = (titreReunion, nomInvite, note, lienEvenement, emailInvite) => {
    const memoire = PropertiesService.getScriptProperties();
    const urlWebhook = memoire.getProperty("CHAT_WEBHOOK_URL");

    if (!urlWebhook) {
        console.warn("L'URL du Webhook Google Chat n'est pas configurée dans les propriétés du script (CHAT_WEBHOOK_URL).");
        return;
    }

    // Gestion de la langue (détection automatique de la langue du compte si non configurée)
    let langue = memoire.getProperty("LANGUAGE");
    if (!langue) {
        try {
            langue = Session.getActiveUserLocale().substring(0, 2).toUpperCase();
        } catch (e) {
            langue = "FR";
        }
    }
    const t = TRADUCTIONS[langue] || TRADUCTIONS.FR;

    const cardPayload = {
        cardsV2: [
            {
                cardId: `rsvp_note_${Date.now()}`,
                card: {
                    header: {
                        title: t.notificationTitle,
                        subtitle: `${t.meetingLabel} : ${titreReunion}`,
                        imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/event_busy/default/48px.svg",
                        imageType: "CIRCLE"
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        startIcon: { knownIcon: "PERSON" },
                                        text: `<b>${t.guestLabel} :</b> ${nomInvite}`,
                                        wrapText: true
                                    }
                                },
                                {
                                    decoratedText: {
                                        startIcon: { knownIcon: "DESCRIPTION" },
                                        text: `<b>${t.noteLabel} :</b><br>"${note}"`,
                                        wrapText: true
                                    }
                                }
                            ]
                        },
                        {
                            widgets: [
                                {
                                    buttonList: {
                                        buttons: [
                                            ...(lienEvenement ? [{
                                                text: t.openEventButton,
                                                onClick: {
                                                    openLink: {
                                                        url: lienEvenement
                                                    }
                                                }
                                            }] : []),
                                            ...(emailInvite ? [{
                                                text: t.replyEmailButton,
                                                onClick: {
                                                    openLink: {
                                                        url: `mailto:${emailInvite}`
                                                    }
                                                }
                                            }] : [])
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(cardPayload),
        muteHttpExceptions: true
    };

    try {
        const reponse = UrlFetchApp.fetch(urlWebhook, options);
        const codeStatut = reponse.getResponseCode();
        if (codeStatut >= 200 && codeStatut < 300) {
            console.log(`Notification envoyée pour la réunion : ${titreReunion}`);
        } else {
            console.error(`Erreur de notification Google Chat (Statut ${codeStatut}) : ${reponse.getContentText()}`);
        }
    } catch (erreur) {
        console.error(`Erreur de connexion avec le Webhook Google Chat : ${erreur.message}`);
    }
};

/**
 * Configure les propriétés indispensables du script.
 * 
 * @param {string} webhookUrl - URL du webhook Google Chat.
 * @param {string} [idCalendrier="primary"] - Identifiant du calendrier à surveiller.
 * @param {string} [langue=""] - Langue souhaitée ("FR" ou "EN"). Si vide, la langue du compte Google est détectée.
 */
const configurerScript = (webhookUrl, idCalendrier = "primary", langue = "") => {
    if (!webhookUrl) {
        console.error("Erreur : L'URL du webhook Google Chat est obligatoire.");
        return;
    }
    
    const memoire = PropertiesService.getScriptProperties();
    memoire.setProperty("CHAT_WEBHOOK_URL", webhookUrl);
    memoire.setProperty("CALENDAR_ID", idCalendrier);
    
    if (langue) {
        const codeLangue = langue.toUpperCase() === "EN" ? "EN" : "FR";
        memoire.setProperty("LANGUAGE", codeLangue);
        console.log(`- Langue configurée manuellement : ${codeLangue}`);
    } else {
        // Supprime l'ancienne configuration pour activer la détection automatique
        memoire.deleteProperty("LANGUAGE");
        let langueAuto = "FR";
        try {
            langueAuto = Session.getActiveUserLocale().substring(0, 2).toUpperCase();
        } catch (e) {}
        console.log(`- Langue : Détection automatique active (Actuellement : ${langueAuto})`);
    }
    
    console.log("Configuration enregistrée avec succès !");
    console.log(`- Webhook Chat : ${webhookUrl}`);
    console.log(`- ID Calendrier : ${idCalendrier}`);
};

/**
 * Remplissez vos informations ci-dessous puis lancez cette fonction UNE SEULE FOIS
 * depuis l'éditeur de script pour initialiser la configuration de manière sécurisée.
 */
const configurerInitialisation = () => {
    const urlWebhook = "VOTRE_WEBHOOK_GOOGLE_CHAT"; // <-- REMPLACEZ ICI PAR VOTRE WEBHOOK
    const idCalendrier = "primary"; // <-- REMPLACEZ ICI SI CALENDRIER SECONDAIRE
    const langue = ""; // <-- OPTIONNEL : Laissez vide "" pour détecter la langue du compte Google, ou mettez "FR"/"EN"

    configurerScript(urlWebhook, idCalendrier, langue);
};