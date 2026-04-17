# LSManagement 🚜

> Professionelle Betriebsverwaltung für **Farming Simulator 22 & 25** — Multiplayer-fähig, vollständig, kostenlos.

[![Technologie](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
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
- [Module im Detail](#module-im-detail)
- [API-Dokumentation](#api-dokumentation)
- [Konfiguration](#konfiguration)
- [Docker-Deployment](#docker-deployment)
- [Mitwirken](#mitwirken)

---

## Übersicht

**LSManagement** ist eine vollständige Web-Applikation zur Verwaltung landwirtschaftlicher Betriebe im Farming Simulator 22 und 25. Sie ist speziell auf die Bedürfnisse norddeutscher Betriebe in **Friesland und Ostfriesland** ausgerichtet.

Die App unterstützt **Multiplayer-Betrieb**: Ein Farmmanager kann seinen Hof anlegen und andere Spieler als Manager oder Mitarbeiter einladen. Alle Beteiligten sehen denselben Datenstand in Echtzeit.

---

## Features

### 👥 Benutzerverwaltung & Multiplayer
- Registrierung und Login mit JWT-Authentifizierung
- Benutzerprofil mit Avatar, Bio und Kontaktdaten
- Mehrere Höfe pro Benutzer möglich
- **Rollen**: Eigentümer · Manager · Mitarbeiter · Beobachter
- Mitglieder per Benutzername einladen und verwalten
- Alle Mitglieder sehen denselben Hof-Datenstand

### 🏡 Hofverwaltung
- Hof mit Name, Beschreibung, Standort/Map und Spielversion anlegen
- Unterstützt **LS22** und **LS25**
- **Startkapital** frei definierbar durch den Farmmanager
- Aktuelles Guthaben wird automatisch bei Rechnungszahlungen aktualisiert

### 🚜 Maschinenverwaltung
- Vollständige Fuhrparkverwaltung (12 Kategorien: Traktor, Mähdrescher, Sämaschine etc.)
- Betriebsstunden, Kaufpreis, aktueller Wert
- Statusverfolgung: verfügbar · im Einsatz · Wartung · verliehen · defekt
- **Verleihmodul**: Maschinen für Lohnarbeiten verleihen mit Stunden- und Tagespreisen
- Verleihabrechnung mit Mieter, Startdatum, Stunden und Kosten

### 🌾 Feldverwaltung
- Felder mit **Feldnummer** (frei wählbar), Fläche in ha, Name und Status anlegen
- Fruchtarten und Bodenstatus pflegen
- Eigentum oder Pacht mit Pachtpreis pro ha
- Status-Workflow: Brache → Vorbereitet → Gesät → Wächst → Gedüngt → Erntereif → Geerntet

### 🔄 Fruchtfolgeplanung
| Frucht | Emoji | Typ |
|--------|-------|-----|
| Gras / Grünland | 🌿 | Dauergrünland |
| Silomais | 🌽 | Sommerfrucht |
| Winterweizen | 🌾 | Winterung |
| Wintergerste | 🌾 | Winterung |
| Winterraps | 🌻 | Winterung |
| Zuckerrübe | 🌱 | Hackfrucht |
| Kartoffel | 🥔 | Hackfrucht |
| Zwiebel | 🧅 | Spezialkultur |
| Roggen | 🌾 | Winterung |
| Hafer | 🌾 | Sommerung |
| Klee | 🍀 | Leguminose |
| Triticale | 🌾 | Winterung |
| Sorghum | 🌿 | Sommerfrucht |

**Empfohlene Fruchtfolgen** für Friesland (Maschinenring-basiert):
- Friesland Standard: Mais → Weizen → Gerste → Raps
- Grünlandbasiert (für Milchvieh): Gras → Gras → Silomais → Roggen
- Intensiv-Ackerbau: Weizen → Zuckerrübe → Gerste → Raps → Weizen
- Kartoffelbetrieb: Kartoffel → Weizen → Mais → Gerste

Feldbezogene Einträge: Aussaatdatum, Erntedatum, Ertrag, Düngung, Notizen.

### 💰 Finanzverwaltung
- Vollständiges **Ein- und Ausgabenmanagement**
- Kategorien: Maschinenkauf, Kraftstoff, Saatgut, Düngemittel, Ernte-Verkauf, Pacht, Subventionen u.v.m.
- Jahresfilter (2022–2026)
- Echtzeit-Bilanz: Einnahmen – Ausgaben = Saldo
- Belegnummern für Nachvollziehbarkeit
- Automatische Buchung bei Rechnungszahlungen

### 🧾 Rechnungsverwaltung *(Kernfeature)*
Höfe können sich gegenseitig Rechnungen für Lohn- und Maschinenverleiharbeiten stellen.

**Workflow:**
```
Entwurf → Gestellt → Gesehen → Bezahlt
                ↓
           Storniert
```

**Funktionen:**
- Rechnung mit mehreren Positionen erstellen (Leistungsart, Feldnummer, Menge, Preis)
- Automatische Rechnungsnummergenerierung (`RE-{HofID}-{Jahr}-{Nr.}`)
- MwSt.-Sätze: 19%, 7%, 0% (pauschal)
- Rechnung stellen (an Empfängerhof senden)
- Empfänger-Hof kann Rechnung einsehen und **mit einem Klick bezahlen**
- Bei Zahlung: automatische Buchung in der Finanzverwaltung beider Höfe
- Bei Zahlung: automatische Aktualisierung des Hofguthabens

**Startkapital-Management:**
- Farmmanager setzt das Startkapital bei Spielbeginn
- Guthaben wird bei Zahlungsein-/-ausgängen automatisch aktualisiert
- Differenz zum Startkapital jederzeit sichtbar

### 📋 Preisliste Lohnarbeiten & Verleih
Aktuelle **Maschinenring-Preisempfehlungen** für Nord- und Ostfriesland (2023/2024):

| Leistung | von | bis | Einheit |
|----------|-----|-----|---------|
| Pflügen | 80 € | 110 € | ha |
| Grubbern | 50 € | 70 € | ha |
| Säen | 35 € | 50 € | ha |
| Spritzen | 25 € | 40 € | ha |
| Gülleausbringung | 40 € | 60 € | ha |
| Feldhäckseln (Mais) | 90 € | 130 € | ha |
| Mähdreschen | 100 € | 140 € | ha |
| Zuckerrübenernte | 180 € | 250 € | ha |
| Schlepper 100–130 PS | 55 € | 75 € | h |
| Mähdrescher (Miete) | 150 € | 200 € | h |

*Quellen: Maschinenring Nordfriesland, Maschinenring Ostfriesland, KTBL 2023/24*

### 📦 Lagerverwaltung
Kategorien:
- **Betriebsstoffe**: Kraftstoff (Diesel), Öl & Schmierstoffe
- **Anbau**: Saatgut, Mineraldünger, Organischer Dünger, Pflanzenschutz
- **Futter**: Heu, Stroh, Grassilage, Maissilage, GPS-Silage, Kraftfutter, Getreidefutter
- **Sonstiges**: Rübenpressschnitzel, Ernte-Lagerung (Weizen, Gerste, Raps, Kartoffeln etc.)

Features: Lagerort, Kapazität, Mindestbestand-Warnung, Preiserfassung, Ein-/Ausgangsbuchungen mit Geschichte.

### 🐄 Tierverwaltung
| Stalltyp | Tierarten |
|----------|-----------|
| Kuhstall | Milchkuh, Fleischrind |
| Schweinestall | Schwein |
| Schafstall | Schaf |
| Hühnerstall | Huhn |
| Pferdestall | Pferd |
| Gemischter Stall | Ziege, Sonstiges |

Pro Tier: Ohrmarke, Geburtsdatum, Gewicht, Kaufpreis, Milchleistung (L/Tag), Futterbedarf (kg/Tag).

### ⚡ Biogasanlage
- Anlagenparameter: Leistung (kW), Tagesproduktion (m³), Jahresertrag (kWh)
- Substrat-Einspeisung protokollieren (Maissilage, Grassilage, Gülle, Festmist etc.)
- Gasertrag pro Einspeisung erfassen
- Monatliche Übersicht: Einspeisung (t) und Gasproduktion (m³)
- Wartungsdaten und letzter Service

### ✅ Aufgaben-Scrum-Board
5-Spalten-Kanban-Board (Backlog → Todo → In Bearbeitung → Überprüfung → Erledigt)

**12 landwirtschaftliche Aufgaben-Vorlagen** werden beim Anlegen eines neuen Hofes automatisch erstellt:
- Tagesbericht ausfüllen
- Kraftstoff auffüllen
- Maschinen Wochencheck
- Felder kartieren
- Bodenproben auswerten
- Tiergesundheit kontrollieren
- Futtervorräte prüfen
- Monatsabschluss Finanzen
- Biogasanlage warten
- Ernte planen
- Fruchtfolge aktualisieren
- Lagerhaltung kontrollieren

Features: Prioritäten (Niedrig/Mittel/Hoch/Dringend), Kategorien, Zuweisung an Teammitglieder, Fälligkeitsdatum, Stundenabschätzung, **Drag & Drop** zwischen Spalten, „Aufgabe übernehmen"-Button.

---

## Technologie-Stack

### Backend
| Komponente | Technologie | Version |
|-----------|-------------|---------|
| Framework | FastAPI | 0.104 |
| ORM | SQLAlchemy | 2.0 |
| Datenbank | SQLite (Dev) / PostgreSQL (Prod) | — |
| Auth | python-jose (JWT) + passlib (bcrypt) | — |
| Validierung | Pydantic v2 | 2.5 |
| Server | Uvicorn | 0.24 |

### Frontend
| Komponente | Technologie | Version |
|-----------|-------------|---------|
| Framework | React | 18 |
| Sprache | TypeScript | 5 |
| Build | Vite | 5 |
| Styling | Tailwind CSS | 3 |
| Routing | React Router | 7 |
| State | Zustand | 5 |
| HTTP | Axios | 1.15 |
| Icons | Lucide React | — |
| Toast | react-hot-toast | — |

---

## Schnellstart

### Voraussetzungen
- Python 3.11+
- Node.js 20+
- npm oder pnpm

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

Die API ist jetzt erreichbar unter `http://localhost:8000`  
Interaktive API-Docs: `http://localhost:8000/docs`

### 3. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Die App ist jetzt erreichbar unter `http://localhost:5173`

---

## Projektstruktur

```
lsmanagement/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Konfiguration (SECRET_KEY, DB-URL etc.)
│   │   │   └── security.py        # JWT-Auth, Passwort-Hashing
│   │   ├── models/
│   │   │   ├── user.py            # Benutzermodell
│   │   │   ├── farm.py            # Hof + Mitglieder
│   │   │   ├── machine.py         # Maschinen + Verleih
│   │   │   ├── field.py           # Felder + Fruchtfolge
│   │   │   ├── finance.py         # Finanzbuchungen
│   │   │   ├── storage.py         # Lager + Transaktionen
│   │   │   ├── animal.py          # Ställe + Tiere
│   │   │   ├── biogas.py          # Biogasanlage + Einspeisung
│   │   │   ├── todo.py            # Todo-Boards + Aufgaben
│   │   │   └── invoice.py         # Rechnungen + Startkapital
│   │   ├── routers/
│   │   │   ├── auth.py            # POST /api/auth/register|login
│   │   │   ├── farms.py           # CRUD Höfe + Mitglieder
│   │   │   ├── machines.py        # CRUD Maschinen + Verleih
│   │   │   ├── fields.py          # CRUD Felder + Fruchtfolge
│   │   │   ├── finances.py        # CRUD Finanzen + Zusammenfassung
│   │   │   ├── storage.py         # CRUD Lager + Transaktionen
│   │   │   ├── animals.py         # CRUD Ställe + Tiere
│   │   │   ├── biogas.py          # CRUD Biogasanlage + Einspeisung
│   │   │   ├── todos.py           # CRUD Boards + Aufgaben
│   │   │   └── invoices.py        # Rechnungen + Kapital
│   │   ├── schemas/               # Pydantic-Schemas für alle Modelle
│   │   ├── database.py            # DB-Engine + Session
│   │   └── main.py                # FastAPI-App + CORS + Router-Registration
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Navbar.tsx     # Hauptnavigation (Landing + Dashboard)
│   │   │       ├── Sidebar.tsx    # Dashboard-Seitennavigation (gruppiert)
│   │   │       └── DashboardLayout.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx    # Hero, Features, CTA
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── DashboardHome.tsx  # Übersicht + Schnellzugriff
│   │   │   ├── NewFarmPage.tsx
│   │   │   ├── MachinesPage.tsx
│   │   │   ├── FieldsPage.tsx
│   │   │   ├── CropRotationPage.tsx
│   │   │   ├── FinancesPage.tsx
│   │   │   ├── StoragePage.tsx
│   │   │   ├── AnimalsPage.tsx
│   │   │   ├── BiogasPage.tsx
│   │   │   ├── TodoPage.tsx       # Drag & Drop Kanban
│   │   │   ├── MembersPage.tsx
│   │   │   ├── InvoicesPage.tsx   # Rechnungen stellen/bezahlen
│   │   │   ├── FarmSettingsPage.tsx # Hof + Startkapital
│   │   │   ├── PriceListPage.tsx  # Maschinenring-Preisliste
│   │   │   └── ProfilePage.tsx
│   │   ├── services/
│   │   │   └── api.ts             # Alle API-Aufrufe (Axios)
│   │   ├── store/
│   │   │   ├── authStore.ts       # Zustand: Auth + User
│   │   │   └── farmStore.ts       # Zustand: Aktiver Hof
│   │   └── App.tsx                # Routing
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Module im Detail

### Rechnungsworkflow

```
Farmmanager A                    Farmmanager B
     │                                │
     ├─► Rechnung erstellen           │
     │   (Positionen eingeben)        │
     │                                │
     ├─► Rechnung "Stellen"           │
     │   (Status: Gestellt)           │
     │                          ◄─────┤ Rechnung einsehen
     │                          ◄─────┤ (Status: Gesehen)
     │                                │
     │                          ◄─────┤ Rechnung bezahlen
     │                                │  (Status: Bezahlt)
     │                                │
     ├─ Einnahme wird automatisch     │
     │  in Finanzen gebucht           │
     │                                ├─ Ausgabe wird automatisch
     │                                │  in Finanzen gebucht
     ├─ Guthaben steigt               │
     │                                └─ Guthaben sinkt
```

### API-Endpunkte (Übersicht)

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/auth/register` | Neuen Benutzer registrieren |
| POST | `/api/auth/login` | Anmelden, JWT erhalten |
| GET | `/api/auth/me` | Eigenes Profil |
| GET/POST | `/api/farms` | Höfe auflisten / anlegen |
| GET/PUT | `/api/farms/{id}` | Hof abrufen / bearbeiten |
| POST | `/api/farms/{id}/members/invite` | Mitglied einladen |
| GET/POST | `/api/farms/{id}/machines` | Maschinen |
| POST | `/api/farms/{id}/machines/{id}/rentals` | Verleih anlegen |
| GET/POST | `/api/farms/{id}/fields` | Felder |
| GET/POST | `/api/farms/{id}/fields/{id}/crop-rotation` | Fruchtfolge |
| GET/POST | `/api/farms/{id}/finances` | Finanzbuchungen |
| GET | `/api/farms/{id}/finances/summary` | Bilanz-Zusammenfassung |
| GET/POST | `/api/farms/{id}/storage` | Lager |
| POST | `/api/farms/{id}/storage/{id}/transactions` | Buchung |
| GET/POST | `/api/farms/{id}/animals/stables` | Ställe |
| GET/POST | `/api/farms/{id}/biogas` | Biogasanlage |
| GET/POST | `/api/farms/{id}/todos/boards` | Boards |
| GET/POST | `/api/farms/{id}/todos/boards/{id}/tasks` | Aufgaben |
| PUT/GET | `/api/invoices/capital/{farm_id}` | Startkapital |
| POST | `/api/invoices/from-farm/{farm_id}` | Rechnung erstellen |
| GET | `/api/invoices/sent/{farm_id}` | Gestellte Rechnungen |
| GET | `/api/invoices/received/{farm_id}` | Erhaltene Rechnungen |
| POST | `/api/invoices/{id}/send` | Rechnung stellen |
| POST | `/api/invoices/{id}/pay` | Rechnung bezahlen |

---

## API-Dokumentation

Nach dem Start des Backends ist die interaktive Swagger-Dokumentation erreichbar unter:

```
http://localhost:8000/docs
```

Alternativ ReDoc:

```
http://localhost:8000/redoc
```

---

## Konfiguration

### Backend-Umgebungsvariablen (`.env`)

```env
# Sicherheit
SECRET_KEY=dein-geheimes-schluessel-hier-aendern

# Datenbank
DATABASE_URL=sqlite:///./lsmanagement.db
# Für PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/lsmanagement

# Token-Laufzeit (Minuten)
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend API-URL

Standardmäßig verbindet sich das Frontend mit `http://localhost:8000`. Für Produktion die `baseURL` in `frontend/src/services/api.ts` anpassen oder über den Vite-Proxy konfigurieren.

---

## Docker-Deployment

Das komplette System lässt sich mit einem einzigen Befehl starten:

```bash
docker-compose up --build
```

Dienste:
| Dienst | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API-Docs | http://localhost:8000/docs |

Für Produktion empfehlen wir:
- PostgreSQL statt SQLite
- nginx als Reverse Proxy
- HTTPS via Let's Encrypt
- `SECRET_KEY` in echten Umgebungsvariablen

---

## Preisquellen

Die Lohnarbeits- und Verleihpreise basieren auf:

- **Maschinenring Nordfriesland** — regionale Preisempfehlungen 2023/24
- **Maschinenring Ostfriesland / Nordwest** — Lohnarbeitspreisliste 2024
- **KTBL (Kuratorium für Technik und Bauwesen in der Landwirtschaft)** — Lohnansätze und Richtwerte
- **Landwirtschaftskammer Schleswig-Holstein** — Betriebsvergleiche und Kennzahlen

---

## Mitwirken

Beiträge sind willkommen! Bitte öffne ein Issue oder einen Pull Request.

```bash
# Fork des Repos erstellen, dann:
git checkout -b feature/mein-feature
git commit -m "feat: mein neues Feature"
git push origin feature/mein-feature
```

---

## Lizenz

MIT License — Details siehe [LICENSE](LICENSE).

---

*Entwickelt mit ❤️ für die LS-Community — besonders für die Friesland-Höfe!* 🐄🌾
