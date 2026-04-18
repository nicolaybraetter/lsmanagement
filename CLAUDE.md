# CLAUDE.md — Projektregeln für LSManagement

## Pflichtaufgaben nach JEDER Änderung

### 1. Deployment-Anweisungen (immer vollständig angeben)

**1.1 SSH auf dem Server:**
```bash
cd ~/lsmanagement
git pull origin claude/farm-management-system-6KPmN
docker compose build --no-cache
```

**1.2 Portainer (Docker Swarm Stack):**
```bash
docker stack deploy -c docker-compose.portainer.yml lsmanagement
```

Stack-Name: `lsmanagement`  
Deployment-Typ: Docker Swarm (kein `docker compose up -d` verwenden)

---

### 2. Neuigkeiten-Seite aktualisieren

Nach jedem neuen Feature **immer** einen neuen Eintrag in `frontend/src/pages/NewsPage.tsx` hinzufügen:
- Oben in der `NEWS`-Array einfügen (neueste zuerst)
- Version hochzählen (aktuell: v1.8)
- Datum: aktuelles Datum auf Deutsch (z. B. `18. April 2026`)
- Passendes Icon aus `lucide-react` wählen
- `tag`: `'Neu'`, `'Feature'`, `'Update'` oder `'Fix'`

---

### 3. README.md aktualisieren und pushen

Nach jedem Feature die `README.md` aktuell halten:
- Features-Abschnitt ergänzen
- Changelog-Tabelle mit neuer Version + Datum + Highlights ergänzen
- Projektstruktur aktualisieren falls neue Dateien
- API-Endpunkte ergänzen falls neue Routen
- Commit + Push auf Branch `claude/farm-management-system-6KPmN`

---

### 4. GitHub immer aktuell halten

- Branch: `claude/farm-management-system-6KPmN`
- Nach jeder Änderung committen und pushen:
```bash
git add <dateien>
git commit -m "feat/fix/chore: Beschreibung"
git push -u origin claude/farm-management-system-6KPmN
```
- Commit-Messages auf Englisch, aussagekräftig
- Niemals auf `main` pushen

---

### 5. Fehlerbereinigung — selbständig durchführen

Bei Build- oder Laufzeitfehlern:
- Fehler analysieren, Ursache identifizieren
- Direkt beheben ohne Rückfrage (außer bei architektonischen Entscheidungen)
- Erneut builden und testen
- Häufige Fehlerquellen:
  - TypeScript: unescapte Anführungszeichen `"` in JSX-Attributen → durch reguläre Zeichen ersetzen
  - Python SyntaxError: f-Strings mit Sonderzeichen → HTML-Entities verwenden
  - SQLAlchemy: neue Spalten in bestehenden Tabellen → `_migrate_columns()` in `main.py` ergänzen
  - Docker Swarm Netzwerk: `docker compose up -d` schlägt fehl → `docker stack deploy` verwenden

---

## Aktueller Softwarestand (v1.8)

### Öffentliche Seiten (kein Login nötig)
| Route | Seite |
|---|---|
| `/` | Landing Page |
| `/news` | Neuigkeiten & Changelog |
| `/wuensche` | Wünsche & Anregungen (Community) |
| `/supportbox` | Supportbox / Kontaktformular |
| `/hilfe` | Hilfe & Anleitung |
| `/register` | Registrierung |
| `/login` | Anmeldung (noindex) |

### Dashboard-Module (Login erforderlich)
| Route | Modul |
|---|---|
| `/dashboard` | Übersicht |
| `/dashboard/machines` | Fuhrparkverwaltung |
| `/dashboard/fields` | Feldverwaltung |
| `/dashboard/crop-rotation` | Fruchtfolgeplanung |
| `/dashboard/finances` | Finanzverwaltung |
| `/dashboard/storage` | Lagerverwaltung |
| `/dashboard/animals` | Tierverwaltung |
| `/dashboard/biogas` | Biogasanlage |
| `/dashboard/todos` | Scrum-Board |
| `/dashboard/members` | Hofmitglieder |
| `/dashboard/invoices` | Rechnungsverwaltung |
| `/dashboard/price-list` | Preisliste |
| `/dashboard/settings` | Hofeinstellungen |
| `/dashboard/profile` | Benutzerprofil |

### Admin (nur Seiteninhaber — nicht öffentlich erwähnen)
| Route | Funktion |
|---|---|
| `/admin` | Admin-Login (noindex, nofollow) |
| `/admin/panel` | Benutzerverwaltung, E-Mail-Konfig, Wünsche-Moderation (noindex) |

### Backend-Modelle
- `User`, `Farm`, `FarmMember`, `FarmInvitation`
- `Machine`, `Field`, `CropRotationPlan`
- `FinanceEntry`, `StorageItem`, `StorageTransaction`
- `Stable`, `Animal`, `BiogasPlant`, `BiogasFeed`
- `TodoBoard`, `TodoTask`
- `Invoice`, `InvoiceItem`, `FarmCapital`
- `SupportMessage`, `SupportComment`
- `Notification`
- `SystemConfig`

### E-Mail-Benachrichtigungen
- Hofeinladung → Eingeladener
- Aufgabenzuweisung → Zugewiesener
- Supportbox-Nachricht → Betreiber (OPERATOR_EMAIL)
- Neuregistrierung → nicolay.braetter@googlemail.com (fest)

### SEO
- Domain: `https://lscomm.braetter-int.de`
- `robots.txt`: Admin/Dashboard/API gesperrt
- `sitemap.xml`: alle öffentlichen Seiten
- `react-helmet-async`: seitenspezifische Meta-Tags auf allen öffentlichen Seiten
- Sicherheits-Header in `nginx.conf`: CSP, X-Frame-Options, X-XSS-Protection etc.

### Technologie-Stack
- **Backend**: FastAPI + SQLAlchemy + SQLite + python-jose + Pydantic v2
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Axios + react-helmet-async
- **Deployment**: Docker Swarm + Portainer auf `swarm01.braetter.local`
- **Branch**: `claude/farm-management-system-6KPmN`

---

## Wichtige Hinweise

- Der Admin-Bereich (`/admin`) darf in keiner öffentlichen Seite, Hilfe oder Dokumentation für Endnutzer erwähnt werden
- SQLite: neue Spalten in bestehenden Tabellen immer über `_migrate_columns()` in `main.py` hinzufügen
- Neue Tabellen werden automatisch durch `create_tables()` angelegt, sofern das Modell vor dem Start importiert wird
- SMTP Port 465 → `SMTP_SSL`, Port 587 → `SMTP + starttls()`
- f-Strings mit deutschen Sonderzeichen (ä, ö, ü, ß) in E-Mail-Templates → HTML-Entities verwenden
