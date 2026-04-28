# LSManagement 🚜

> Professionelle Betriebsverwaltung für **Farming Simulator 22 & 25** — Multiplayer-fähig, vollständig, kostenlos.

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-3178C6?style=flat-square&logo=react)](https://react.dev/)
[![Styling](https://img.shields.io/badge/CSS-Tailwind-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Lizenz](https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square)](LICENSE)

---

## Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Features](#features)
- [Öffentliche Seiten](#öffentliche-seiten)
- [Technologie-Stack](#technologie-stack)
- [Schnellstart](#schnellstart)
- [Projektstruktur](#projektstruktur)
- [API-Endpunkte](#api-endpunkte)
- [Konfiguration](#konfiguration)
- [Docker-Deployment](#docker-deployment)
- [Changelog](#changelog)

---

## Übersicht

**LSManagement** ist eine vollständige Web-Applikation zur Verwaltung landwirtschaftlicher Betriebe im Farming Simulator 22 und 25. Die App unterstützt **Multiplayer-Betrieb**: Ein Farmmanager legt den Hof an und lädt andere Spieler als Manager, Mitarbeiter oder Beobachter ein.

---

## Features

### 👥 Benutzerverwaltung & Multiplayer
- Registrierung und Login mit JWT-Authentifizierung
- Benutzerprofil (Name, Bio, Avatar-URL)
- **Rollen**: Eigentümer · Manager · Mitarbeiter · Beobachter
- Mitglieder per Benutzername einladen — E-Mail-Benachrichtigung beim Einladungsversand
- Mitglieder können einen Hof selbst verlassen
- Konto vollständig aus dem Profil heraus löschen
- Eingeschränkte Sidebar für Benutzer ohne Hof-Zugehörigkeit

### 🔔 Hofinternes Benachrichtigungssystem
- Benachrichtigungsglocke in der Navigation mit rotem Zähler für ungelesene Meldungen
- Beim Zuweisen einer Aufgabe erhält das Mitglied sofort eine Systemnachricht
- Gleichzeitig wird eine E-Mail mit allen Aufgabendetails versandt
- Benachrichtigungen einzeln oder alle auf einmal als gelesen markieren
- Klick auf eine Benachrichtigung leitet direkt zum Scrum-Board weiter
- Automatische Aktualisierung alle 30 Sekunden im Hintergrund

### 🏡 Hofverwaltung
- Hof mit Name, Beschreibung, Standort/Map und Spielversion (LS22/LS25) anlegen
- Startkapital frei definierbar; aktuelles Guthaben wird automatisch bei Rechnungszahlungen aktualisiert
- Hofbesitzer können ihren Hof dauerhaft löschen (mit Bestätigungseingabe des Hofnamens)
- Nach dem Löschen kann der Benutzer einen neuen Hof anlegen oder von anderen eingeladen werden

### 🚜 Fuhrparkverwaltung
- 12 Maschinenkategorien (Traktor, Mähdrescher, Sämaschine, Güllefass u.v.m.)
- Kaufpreis, Kaufdatum, Kennzeichen, Betriebsstunden, aktueller Wert
- Statusverfolgung: verfügbar · im Einsatz · Wartung · verliehen · verkauft · defekt
- **Verleihen** an andere Höfe mit automatischer Statusänderung
- **Verkaufen** mit Erlös-Buchung in die Finanzverwaltung
- Verleihabrechnung: Mieter, Startdatum, Stunden, Kosten

### 🌾 Feldverwaltung
- Felder mit Nummer, Name, Fläche (ha), Status und Bodenart anlegen
- Eigentum oder Pacht (mit Pachtpreis pro ha)
- Status-Workflow: Brache → Vorbereitet → Gesät → Wächst → Gedüngt → Erntereif → Geerntet

### 🔄 Fruchtfolgeplanung

**31 offizielle Fruchtsorten für LS22 & LS25:**

| Kategorie | Fruchtsorten |
|-----------|-------------|
| Gräser & Futter | Gras, Klee, Silomais |
| Getreide | Mais, Weizen, Gerste, Hafer, Roggen, Triticale, Sorghum |
| Ölfrüchte | Raps, Sonnenblume, Soja |
| Hackfrüchte & Gemüse | Zuckerrübe, Kartoffel, Zwiebel, Karotten, Pastinaken, Rote Bete |
| Sonderkulturen | Baumwolle, Zuckerrohr, Weintrauben, Oliven, Pappel, Ölrettich |
| Neu in LS25 | Spinat, Erbsen, Grüne Bohnen, Reis, Langkornreis |

**Vordefinierte Fruchtfolgen für Friesland** sowie **eigene Fruchtfolgen-Pläne** pro Hof erstellbar.

### 💰 Finanzverwaltung
- Vollständiges Ein- und Ausgabenmanagement mit Jahresfilter
- Echtzeit-Bilanz: Einnahmen − Ausgaben = Saldo
- Automatische Buchung bei Rechnungszahlungen und Maschinenverkäufen

### 🧾 Rechnungsverwaltung
Höfe können sich gegenseitig Rechnungen stellen. Workflow: `Entwurf → Gestellt → Bezahlt / Storniert`

### 📦 Lagerverwaltung
Kategorien: Betriebsstoffe, Saatgut, Dünger, Futter, Getreideernte. Ein-/Ausgangsbuchungen mit Historie.

### 🐄 Tierverwaltung
Ställe und Tiere (Kuh, Schwein, Schaf, Huhn, Pferd) mit detaillierten Profilen.

### ⚡ Biogasanlage
Anlagenparameter, Substrat-Einspeisung, Gasertrag, Monatliche Übersicht, Wartungsprotokoll.

### ✅ Aufgaben-Scrum-Board
5-Spalten-Kanban (Backlog → Todo → In Bearbeitung → Überprüfung → Erledigt).
Prioritäten, Kategorien, Zuweisung, Fälligkeitsdatum, Drag & Drop.

### 📬 Supportbox & Wünsche & Anregungen
- Öffentliches Kontaktformular (ohne Login nutzbar)
- Kategorien: Funktionswunsch, Fehlermeldung, Allgemeines Feedback, Sonstiges
- **Öffentliche Wunschseite** (`/wuensche`): alle Einreichungen öffentlich lesbar, nach Datum sortiert
- **Kommentarfunktion**: jeder kann mit gültiger E-Mail-Adresse kommentieren
- E-Mail-Adressen werden automatisch maskiert angezeigt
- Spam-Schutz: URL-Filter, Wortfilter, Rate-Limit

---

## Öffentliche Seiten

Folgende Seiten sind ohne Login erreichbar:

| Route | Inhalt |
|-------|--------|
| `/` | Landing Page mit Feature-Übersicht |
| `/news` | Neuigkeiten & Changelog |
| `/wuensche` | Community-Wünsche & Anregungen |
| `/supportbox` | Kontakt & Feedback |
| `/hilfe` | Vollständige Hilfe & Anleitung |
| `/register` | Kostenlos registrieren |

---

## Technologie-Stack

### Backend
| Komponente | Technologie |
|-----------|-------------|
| Framework | FastAPI 0.104 |
| ORM | SQLAlchemy 2.0 |
| Datenbank | SQLite |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Validierung | Pydantic v2 |
| E-Mail | smtplib — SSL (Port 465) & STARTTLS (Port 587) |

### Frontend
| Komponente | Technologie |
|-----------|-------------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 7 |
| State | Zustand 5 |
| SEO | react-helmet-async |
| HTTP | Axios |
| Icons | Lucide React |
| Formulare | React Hook Form + Zod |

---

## Schnellstart

### Voraussetzungen
- Python 3.11+
- Node.js 20+

### 1. Repository klonen
```bash
git clone https://github.com/nicolaybraetter/lsmanagement.git
cd lsmanagement
```

### 2. Backend starten
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend starten
```bash
cd frontend
npm install
npm run dev
```

App erreichbar unter `http://localhost:5173`

---

## Projektstruktur

```
lsmanagement/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── email.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── farm.py
│   │   │   ├── machine.py
│   │   │   ├── field.py            # 31 Fruchtsorten + eigene Pläne
│   │   │   ├── finance.py
│   │   │   ├── storage.py
│   │   │   ├── animal.py
│   │   │   ├── biogas.py
│   │   │   ├── todo.py
│   │   │   ├── invoice.py
│   │   │   ├── invitation.py
│   │   │   ├── support.py          # SupportMessage + SupportComment
│   │   │   ├── notification.py
│   │   │   └── system_config.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── farms.py
│   │   │   ├── machines.py
│   │   │   ├── fields.py
│   │   │   ├── crop_plans.py
│   │   │   ├── finances.py
│   │   │   ├── storage.py
│   │   │   ├── animals.py
│   │   │   ├── biogas.py
│   │   │   ├── todos.py
│   │   │   ├── invoices.py
│   │   │   ├── support.py
│   │   │   ├── notifications.py
│   │   │   └── admin.py
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── src/
│   │   ├── components/layout/
│   │   │   ├── Navbar.tsx          # Benachrichtigungsglocke
│   │   │   ├── Sidebar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── NewsPage.tsx
│   │   │   ├── WuenschePage.tsx
│   │   │   ├── SupportboxPage.tsx
│   │   │   ├── HelpPage.tsx
│   │   │   ├── auth/
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── MachinesPage.tsx
│   │   │   ├── FieldsPage.tsx
│   │   │   ├── CropRotationPage.tsx
│   │   │   ├── FinancesPage.tsx
│   │   │   ├── StoragePage.tsx
│   │   │   ├── AnimalsPage.tsx
│   │   │   ├── BiogasPage.tsx
│   │   │   ├── TodoPage.tsx
│   │   │   ├── MembersPage.tsx
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── FarmSettingsPage.tsx
│   │   │   ├── PriceListPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── farmStore.ts
│   │   │   ├── sidebarStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── services/api.ts
│   │   └── App.tsx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.portainer.yml
├── CLAUDE.md
└── README.md
```

---

## API-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/auth/register` | Registrieren |
| POST | `/api/auth/login` | Anmelden |
| GET/PUT | `/api/auth/me` | Eigenes Profil |
| DELETE | `/api/auth/me` | Konto löschen |
| GET/POST | `/api/farms` | Höfe |
| DELETE | `/api/farms/{id}` | Hof löschen (nur Eigentümer) |
| POST | `/api/farms/{id}/members/invite` | Mitglied einladen |
| GET/POST | `/api/farms/{id}/machines` | Fuhrpark |
| POST | `/api/farms/{id}/machines/{id}/lend` | Maschine verleihen |
| POST | `/api/farms/{id}/machines/{id}/sell` | Maschine verkaufen |
| GET/POST | `/api/farms/{id}/fields` | Felder |
| GET/POST | `/api/farms/{id}/crop-plans` | Fruchtfolgen-Pläne |
| GET/POST | `/api/farms/{id}/finances` | Finanzen |
| GET/POST | `/api/farms/{id}/storage` | Lager |
| GET/POST | `/api/farms/{id}/animals/stables` | Ställe |
| GET/POST | `/api/farms/{id}/biogas` | Biogasanlage |
| GET/POST/PUT/DELETE | `/api/farms/{id}/todos/boards/{id}/tasks` | Aufgaben |
| GET/POST | `/api/invoices` | Rechnungen |
| GET | `/api/notifications` | Benachrichtigungen |
| PATCH | `/api/notifications/read-all` | Alle als gelesen markieren |
| GET | `/api/support/public` | Öffentliche Wünsche (kein Auth) |
| POST | `/api/support` | Nachricht senden |
| POST | `/api/support/{id}/comments` | Kommentar hinzufügen |

---

## Konfiguration

### Backend `.env`

```env
SECRET_KEY=dein-geheimes-schluessel-hier
DATABASE_URL=sqlite:///./lsmanagement.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_PASSWORD=sicheres-passwort

# E-Mail / SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=465          # 465 = SSL, 587 = STARTTLS
SMTP_USER=user@example.com
SMTP_PASSWORD=passwort
SMTP_FROM=noreply@example.com
OPERATOR_EMAIL=admin@example.com
```

> SMTP-Einstellungen können auch zur Laufzeit im Admin-Panel geändert werden — ohne Neustart.

---

## Docker-Deployment (Docker Swarm / Portainer)

```bash
# 1. SSH: Code holen & Images bauen
cd ~/lsmanagement
git pull origin claude/farm-management-system-6KPmN
docker compose build --no-cache

# 2. Stack aktualisieren
docker stack deploy -c docker-compose.portainer.yml lsmanagement
```

---

## Changelog

| Version | Datum | Highlights |
|---------|-------|-----------|
| v2.1 | Apr 2026 | Meilenstein „LSManagement jetzt nutzbar" — Sondernewsletter-Eintrag auf der Neuigkeiten-Seite, der alle 14 Module, Multiplayer-Rollen, 31 Fruchtsorten, Fuhrparkverleih und Stabilitätsfixes zusammenfasst |
| v2.0 | Apr 2026 | Rechnungs-Badge in der Seitenleiste, geliehene Fahrzeuge im Fuhrpark des entleihenden Hofes, „Geliehen"-Filter und Statistik, Verleihziel im Fahrzeug-Bearbeitungsdialog editierbar, Maschinen-Servicewartung mit Buchung in die Hofkasse |
| v1.9 | Apr 2026 | Discord-Supportchannel-Link in der Supportbox |
| v1.8 | Apr 2026 | Hof löschen (Kaskadenlöschung aller Daten, Bestätigungseingabe), Fix: Cross-User-Farm-Bug beim Login |
| v1.7 | Apr 2026 | Öffentliche Hilfeseite `/hilfe`, SEO-Optimierung (robots.txt, sitemap.xml, react-helmet-async), Sicherheits-Header (CSP, X-Frame-Options), Registrierungs-E-Mail an Betreiber |
| v1.6 | Apr 2026 | Öffentliche Wünsche & Anregungen (`/wuensche`) mit Kommentarfunktion, Admin-Moderation für Einträge und Kommentare |
| v1.5 | Apr 2026 | Hofinternes Benachrichtigungssystem (Bell-Icon, Echtzeit-Polling, E-Mail bei Aufgabenzuweisung) |
| v1.4 | Apr 2026 | 31 LS22/LS25-Fruchtsorten, eigene Fruchtfolgen-Pläne, E-Mail-Fix (SSL/STARTTLS), Neuigkeiten-Seite |
| v1.3 | Apr 2026 | Kontolöschung, Hof verlassen, sichere Kaskadenlöschung |
| v1.2 | Apr 2026 | Fuhrparkverwaltung (Kaufen/Leihen/Verkaufen), Startkapital-Sync |
| v1.1 | Apr 2026 | Benutzerrollen, E-Mail-Benachrichtigungen, Einladungssystem |
| v1.0 | Apr 2026 | Launch — alle Kernmodule |

---

*© 2026 Nicolay Brätter · LSManagement · Für die LS-Community* 🐄🌾
