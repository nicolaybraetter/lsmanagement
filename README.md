# LSManagement - Betriebsverwaltung für LS22 & LS25

Eine vollständige Farmverwaltungsapplikation für den Farming Simulator 22 und 25.

## Features

- **Multiplayer-fähig** — Einladen von Mitspielern als Manager oder Mitarbeiter
- **Maschinenverwaltung** — Fuhrpark mit Verleih für Lohnarbeiten
- **Feldverwaltung** — Alle Felder mit Nummer, Status und Fruchtfolgeplanung
- **Fruchtfolgeplanung** — Typische Kulturen für Friesland & Ostfriesland
- **Finanzverwaltung** — Vollständiges Ein- und Ausgabenmanagement
- **Lagerverwaltung** — Kraftstoff, Saatgut, Dünger, Silage, Futter uvm.
- **Tierverwaltung** — Ställe mit Tieren (Kühe, Schweine, Schafe, Hühner, Pferde)
- **Biogasanlage** — Einspeisung, Ertrag und Wartungsprotokoll
- **Scrum-Board** — Aufgaben mit landwirtschaftlichen Vorlagen und Teamzuweisung

## Technologie

| Layer    | Technologie                       |
|----------|-----------------------------------|
| Backend  | Python FastAPI + SQLAlchemy        |
| Frontend | React + TypeScript + Tailwind CSS  |
| Datenbank| SQLite (dev) / PostgreSQL (prod)   |
| Auth     | JWT Bearer Tokens                  |

## Schnellstart

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mit Docker

```bash
docker-compose up
```

Die App ist dann erreichbar unter:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Fruchtfolge Friesland

Enthaltene Kulturen:
- 🌿 Gras & Grünland
- 🌽 Silomais & Körnermais
- 🌾 Winterweizen, Wintergerste, Roggen, Hafer, Triticale
- 🌻 Winterraps
- 🌱 Zuckerrüben
- 🥔 Kartoffeln
- 🧅 Zwiebeln
- 🍀 Klee
- ☀️ Sonnenblumen, Sorghum
