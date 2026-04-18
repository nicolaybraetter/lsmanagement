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
- [Technologie-Stack](#technologie-stack)
- [Schnellstart](#schnellstart)
- [Projektstruktur](#projektstruktur)
- [API-Endpunkte](#api-endpunkte)
- [Konfiguration](#konfiguration)
- [Docker-Deployment](#docker-deployment)

---

## Übersicht

**LSManagement** ist eine vollständige Web-Applikation zur Verwaltung landwirtschaftlicher Betriebe im Farming Simulator 22 und 25. Sie ist speziell auf die Bedürfnisse norddeutscher Betriebe in **Friesland und Ostfriesland** ausgerichtet.

Die App unterstützt **Multiplayer-Betrieb**: Ein Farmmanager legt den Hof an und lädt andere Spieler als Manager, Mitarbeiter oder Beobachter ein. Alle Beteiligten sehen denselben Datenstand.

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

### 🛡️ Superadmin-Panel (`/admin`)
- Passwortgeschütztes Admin-Interface
- Benutzerliste mit Status, Erstellungsdatum und E-Mail
- Passwort zurücksetzen, Benutzernamen/E-Mail ändern
- Konto aktivieren / deaktivieren / löschen
- SMTP-E-Mail-Konfiguration direkt im Panel änderbar (ohne Neustart)

### 🏡 Hofverwaltung
- Hof mit Name, Beschreibung, Standort/Map und Spielversion (LS22/LS25) anlegen
- Startkapital frei definierbar; aktuelles Guthaben wird automatisch bei Rechnungszahlungen aktualisiert

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
- Kaufpreis wird automatisch als Ausgabe in die Finanzen gebucht
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

**Vordefinierte Fruchtfolgen für Friesland:**
- Friesland Standard: Mais → Weizen → Gerste → Raps
- Grünlandbasiert (Milchvieh): Gras → Gras → Silomais → Roggen
- Intensiv-Ackerbau: Weizen → Zuckerrübe → Gerste → Raps → Weizen
- Kartoffelbetrieb: Kartoffel → Weizen → Mais → Gerste

**Eigene Fruchtfolgen-Pläne:**
- Pro Hof individuelle Fruchtfolgen erstellen und speichern
- Visueller Sequenz-Builder (Früchte einzeln hinzufügen/entfernen)
- Spielversion (LS22 / LS25 / Beide) pro Plan wählbar

Feldbezogene Einträge: Jahr, Aussaatdatum, Erntedatum, Ertrag (t), Düngung, Notizen.

### 💰 Finanzverwaltung
- Vollständiges Ein- und Ausgabenmanagement mit Jahresfilter (2022–2026)
- Kategorien: Maschinenkauf, Kraftstoff, Saatgut, Düngemittel, Ernteverlauf, Pacht, Subventionen u.v.m.
- Echtzeit-Bilanz: Einnahmen − Ausgaben = Saldo
- Automatische Buchung bei Rechnungszahlungen und Maschinenverkäufen

### 🧾 Rechnungsverwaltung
Höfe können sich gegenseitig Rechnungen für Lohn- und Maschinenverleiharbeiten stellen.

**Workflow:**
```
Entwurf → Gestellt → Gesehen → Bezahlt
               ↓
          Storniert
```

- Rechnung mit mehreren Positionen (Leistungsart, Feldnummer, Menge, Preis)
- Automatische Rechnungsnummer (`RE-{HofID}-{Jahr}-{Nr.}`)
- MwSt.-Sätze: 19 %, 7 %, 0 %
- Bei Zahlung: automatische Finanzbuchung und Guthabenaktualisierung beider Höfe

### 📋 Preisliste Lohnarbeiten & Verleih
Aktuelle Maschinenring-Preisempfehlungen für Nord- und Ostfriesland (2023/2024).

### 📦 Lagerverwaltung
Kategorien: Betriebsstoffe, Saatgut, Dünger, Pflanzenschutz, Futter (Heu, Stroh, Silagen), Getreideernte.  
Features: Lagerort, Kapazität, Mindestbestand-Warnung, Ein-/Ausgangsbuchungen mit Geschichte.

### 🐄 Tierverwaltung
Stalltypen: Kuh, Schwein, Schaf, Huhn, Pferd, Gemischt.  
Pro Tier: Ohrmarke, Geburtsdatum, Gewicht, Kaufpreis, Milchleistung, Futterbedarf.

### ⚡ Biogasanlage
Anlagenparameter, Substrat-Einspeisung, Gasertrag, Monatliche Übersicht, Wartungsprotokoll.

### ✅ Aufgaben-Scrum-Board
5-Spalten-Kanban (Backlog → Todo → In Bearbeitung → Überprüfung → Erledigt).  
Prioritäten, Kategorien, Zuweisung, Fälligkeitsdatum, Drag & Drop.  
12 landwirtschaftliche Aufgaben-Vorlagen werden beim Hofanlegen automatisch erstellt.

### 📬 Supportbox
Öffentliches Kontaktformular (ohne Login nutzbar).  
Kategorien: Funktionswunsch, Fehlermeldung, Allgemeines Feedback, Sonstiges.  
Automatische E-Mail-Benachrichtigung an den Betreiber.  
Spam-Schutz: URL-Filter, Wortfilter, Rate-Limit pro E-Mail-Adresse.

### 📰 Neuigkeiten-Seite (`/news`)
Öffentlich zugängliche Changelog-Seite mit datierten Einträgen — für alle Besucher sichtbar, auch ohne Account.

---

## Technologie-Stack

### Backend
| Komponente | Technologie |
|-----------|-------------|
| Framework | FastAPI 0.104 |
| ORM | SQLAlchemy 2.0 |
| Datenbank | SQLite (Dev) |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Validierung | Pydantic v2 |
| Server | Uvicorn |
| E-Mail | smtplib — SSL (Port 465) & STARTTLS (Port 587) |

### Frontend
| Komponente | Technologie |
|-----------|-------------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 7 |
| State | Zustand 5 |
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
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API erreichbar unter `http://localhost:8000`  
Swagger-Docs: `http://localhost:8000/docs`

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
│   │   │   ├── config.py           # Einstellungen (SECRET_KEY, SMTP etc.)
│   │   │   ├── security.py         # JWT, Passwort-Hashing, Admin-Token
│   │   │   └── email.py            # E-Mail-Versand (SSL + STARTTLS)
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── farm.py             # Hof + Mitglieder + Rollen
│   │   │   ├── machine.py          # Maschinen + Verleih/Verkauf
│   │   │   ├── field.py            # Felder + Fruchtfolge + eigene Pläne
│   │   │   ├── finance.py
│   │   │   ├── storage.py
│   │   │   ├── animal.py
│   │   │   ├── biogas.py
│   │   │   ├── todo.py
│   │   │   ├── invoice.py          # Rechnungen + Startkapital
│   │   │   ├── invitation.py
│   │   │   ├── support.py
│   │   │   └── system_config.py    # Laufzeit-Konfiguration (DB-backed)
│   │   ├── routers/
│   │   │   ├── auth.py             # Register, Login, Profil, Kontolöschung
│   │   │   ├── farms.py            # Höfe, Mitglieder, Einladungen
│   │   │   ├── machines.py         # Fuhrpark, Leihen, Verkaufen, Vermietung
│   │   │   ├── fields.py           # Felder + Fruchtfolge-Historie
│   │   │   ├── crop_plans.py       # Eigene Fruchtfolgen-Pläne
│   │   │   ├── finances.py
│   │   │   ├── storage.py
│   │   │   ├── animals.py
│   │   │   ├── biogas.py
│   │   │   ├── todos.py
│   │   │   ├── invoices.py
│   │   │   ├── support.py          # Supportbox + E-Mail-Benachrichtigung
│   │   │   └── admin.py            # Superadmin-Panel
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── NewsPage.tsx        # Öffentliche Changelog-Seite
│   │   │   ├── auth/
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── MachinesPage.tsx
│   │   │   ├── FieldsPage.tsx
│   │   │   ├── CropRotationPage.tsx # Fruchtfolgen + eigene Pläne
│   │   │   ├── FinancesPage.tsx
│   │   │   ├── StoragePage.tsx
│   │   │   ├── AnimalsPage.tsx
│   │   │   ├── BiogasPage.tsx
│   │   │   ├── TodoPage.tsx
│   │   │   ├── MembersPage.tsx
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── FarmSettingsPage.tsx
│   │   │   ├── PriceListPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SupportboxPage.tsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.tsx
│   │   │       └── AdminPanel.tsx
│   │   ├── services/api.ts
│   │   ├── store/
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.portainer.yml
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
| POST | `/api/farms/{id}/members/invite` | Mitglied einladen |
| DELETE | `/api/farms/{id}/members/{uid}` | Mitglied entfernen / Hof verlassen |
| GET/POST | `/api/farms/{id}/machines` | Fuhrpark |
| POST | `/api/farms/{id}/machines/{id}/lend` | Maschine verleihen |
| POST | `/api/farms/{id}/machines/{id}/unlend` | Leihe beenden |
| POST | `/api/farms/{id}/machines/{id}/sell` | Maschine verkaufen |
| GET/POST | `/api/farms/{id}/fields` | Felder |
| GET/POST | `/api/farms/{id}/fields/{id}/crop-rotation` | Fruchtfolge-Historie |
| GET/POST | `/api/farms/{id}/crop-plans` | Eigene Fruchtfolgen-Pläne |
| DELETE | `/api/farms/{id}/crop-plans/{id}` | Plan löschen |
| GET/POST | `/api/farms/{id}/finances` | Finanzen |
| GET | `/api/farms/{id}/finances/summary` | Bilanz |
| GET/POST | `/api/farms/{id}/storage` | Lager |
| GET/POST | `/api/farms/{id}/animals/stables` | Ställe |
| GET/POST | `/api/farms/{id}/biogas` | Biogasanlage |
| GET/POST | `/api/farms/{id}/todos/boards` | Boards |
| GET/POST/PUT/DELETE | `/api/farms/{id}/todos/boards/{id}/tasks` | Aufgaben |
| GET/PUT | `/api/invoices/capital/{farm_id}` | Startkapital |
| POST | `/api/invoices/from-farm/{farm_id}` | Rechnung erstellen |
| POST | `/api/invoices/{id}/send` | Rechnung stellen |
| POST | `/api/invoices/{id}/pay` | Rechnung bezahlen |
| POST | `/api/support` | Supportbox-Nachricht senden |
| POST | `/api/admin/auth` | Admin-Login |
| GET | `/api/admin/users` | Alle Benutzer (Admin) |
| DELETE | `/api/admin/users/{id}` | Benutzer löschen (Admin) |
| PUT | `/api/admin/users/{id}/password` | Passwort zurücksetzen (Admin) |
| GET/PUT | `/api/admin/email-config` | SMTP-Konfiguration (Admin) |

---

## Konfiguration

### Backend `.env`

```env
SECRET_KEY=dein-geheimes-schluessel-hier
DATABASE_URL=sqlite:///./lsmanagement.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Superadmin
ADMIN_PASSWORD=sicheres-passwort

# E-Mail / SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=465          # 465 = SSL, 587 = STARTTLS
SMTP_USER=user@example.com
SMTP_PASSWORD=passwort
SMTP_FROM=noreply@example.com
OPERATOR_EMAIL=admin@example.com
```

> SMTP-Einstellungen können auch zur Laufzeit über das Admin-Panel geändert werden — ohne Neustart des Backends.

---

## Docker-Deployment (Docker Swarm / Portainer)

```bash
# Images bauen
docker build --no-cache -t lsmanagement-backend ./backend
docker build --no-cache -t lsmanagement-frontend ./frontend

# Services aktualisieren
docker service update --force --image lsmanagement-backend lsmanagement_backend
docker service update --force --image lsmanagement-frontend lsmanagement_frontend
```

Oder alles auf einmal nach einem `git pull`:

```bash
cd /home/user/lsmanagement && \
git pull origin claude/farm-management-system-6KPmN && \
docker build --no-cache -t lsmanagement-backend ./backend && \
docker service update --force --image lsmanagement-backend lsmanagement_backend && \
docker build --no-cache -t lsmanagement-frontend ./frontend && \
docker service update --force --image lsmanagement-frontend lsmanagement_frontend
```

---

## Changelog

| Version | Datum | Highlights |
|---------|-------|-----------|
| v1.4 | Apr 2026 | 31 LS22/LS25-Fruchtsorten, eigene Fruchtfolgen-Pläne, E-Mail-Fix (SSL/STARTTLS), Neuigkeiten-Seite |
| v1.3 | Apr 2026 | Kontolöschung aus Profil, Hof verlassen, sichere Kaskadenlöschung |
| v1.2 | Apr 2026 | Fuhrparkverwaltung (Kaufen/Leihen/Verkaufen), Startkapital-Sync |
| v1.1 | Apr 2026 | Superadmin-Panel, Benutzerrollen, E-Mail-Benachrichtigungen |
| v1.0 | Apr 2026 | Launch — alle Kernmodule |

---

## Lizenz

MIT License — Details siehe [LICENSE](LICENSE).

---

*© 2026 Nicolay Brätter · LSManagement · Für die LS-Community* 🐄🌾
