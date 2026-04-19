# LSManagement — Installationsanleitung

> **Betriebsverwaltung für Farming Simulator 22 & 25**  
> Version 1.9 · Ubuntu 24.04 · Docker · HTTP/HTTPS

---

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Schnellstart (One-Liner)](#schnellstart)
3. [Schritt-für-Schritt-Installation](#schritt-für-schritt-installation)
4. [Konfigurationsreferenz](#konfigurationsreferenz)
5. [SSL / HTTPS einrichten](#ssl--https-einrichten)
6. [Post-Installation](#post-installation)
7. [Updates einspielen](#updates-einspielen)
8. [Datenbank-Backup](#datenbank-backup)
9. [Fehlerbehebung](#fehlerbehebung)
10. [Deinstallation](#deinstallation)

---

## Voraussetzungen

| Komponente | Mindestanforderung |
|---|---|
| Betriebssystem | Ubuntu 24.04 LTS (empfohlen), 22.04 möglich |
| CPU | 1 vCore (2 empfohlen) |
| RAM | 1 GB (2 GB empfohlen) |
| Speicher | 10 GB freier Speicherplatz |
| Netzwerk | Öffentliche IP-Adresse oder Domain |
| Ports | 80 (HTTP), 443 (HTTPS) müssen erreichbar sein |

**Benötigte Pakete** (werden automatisch installiert):
- `docker-ce` + `docker-compose-plugin`
- `nginx`
- `certbot` + `python3-certbot-nginx`
- `git`, `openssl`, `curl`

---

## Schnellstart

Einzeiler für eine frische Ubuntu 24.04-Installation:

```bash
curl -fsSL https://raw.githubusercontent.com/nicolaybraetter/lsmanagement/claude/farm-management-system-6KPmN/install.sh | sudo bash
```

Oder mit Git klonen und lokal ausführen (empfohlen):

```bash
git clone -b claude/farm-management-system-6KPmN \
    https://github.com/nicolaybraetter/lsmanagement.git
cd lsmanagement
sudo bash install.sh
```

---

## Schritt-für-Schritt-Installation

### 1. System vorbereiten

```bash
# System aktualisieren
sudo apt-get update && sudo apt-get upgrade -y

# Script herunterladen
git clone -b claude/farm-management-system-6KPmN \
    https://github.com/nicolaybraetter/lsmanagement.git /opt/lsmanagement-setup
cd /opt/lsmanagement-setup
```

### 2. Installer ausführen

```bash
sudo bash install.sh
```

Das Script fragt interaktiv nach:

| Eingabe | Beschreibung | Beispiel |
|---|---|---|
| **Installationsverzeichnis** | Zielordner auf dem Server | `/opt/lsmanagement` |
| **Domain / Hostname** | Für SSL-Zertifikat (optional) | `meinserver.de` |
| **Admin-Passwort** | Passwort für das Backend-Admin-Panel | `SicheresPasswort!23` |
| **SMTP-Einstellungen** | Für E-Mail-Benachrichtigungen (optional) | Siehe unten |

### 3. Ablauf des Installers

```
1. Root-Prüfung
2. Ubuntu-Versionsprüfung
3. Interaktive Konfiguration
4. Systempackete installieren (curl, git, nginx, certbot)
5. Docker CE installieren und starten
6. Repository klonen → /opt/lsmanagement
7. .env Datei erstellen (chmod 600)
8. Docker Images bauen (Backend + Frontend)
9. Container starten (docker compose)
10. Nginx als Reverse Proxy konfigurieren
11. SSL-Zertifikat einrichten (optional, Let's Encrypt)
12. Systemd-Dienst aktivieren (Autostart nach Reboot)
```

### 4. Installation überprüfen

```bash
# Container-Status
docker compose -f /opt/lsmanagement/docker-compose.standalone.yml ps

# Systemd-Dienst
systemctl status lsmanagement

# Im Browser aufrufen
curl -I http://localhost:3000
```

---

## Konfigurationsreferenz

Die Konfiguration liegt in `/opt/lsmanagement/.env`:

```env
# JWT-Sicherheitsschlüssel (automatisch generiert)
SECRET_KEY=<64-Zeichen-Hex>

# Datenbank (SQLite, Pfad innerhalb des Containers)
DATABASE_URL=sqlite:///./data/lsmanagement.db

# Token-Ablaufzeit in Minuten (Standard: 24h)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Admin-Panel Passwort
ADMIN_PASSWORD=SicheresPasswort

# ── SMTP / E-Mail ─────────────────────────────────────────────────────────────
# Kann alternativ im Admin-Panel unter /admin konfiguriert werden.

# Gmail (Port 587 = STARTTLS)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@gmail.com
SMTP_PASSWORD=app-spezifisches-passwort
SMTP_FROM=deine@gmail.com
OPERATOR_EMAIL=admin@example.com

# Strato / ionos (Port 465 = SSL)
# SMTP_HOST=smtp.strato.de
# SMTP_PORT=465
```

> **Hinweis:** Nach Änderungen an `.env` die Container neu starten:
> ```bash
> systemctl restart lsmanagement
> ```

---

## SSL / HTTPS einrichten

### Automatisch (während der Installation)

Das Installer-Script bietet die automatische SSL-Einrichtung via **Let's Encrypt** an.

**Voraussetzung:** Der DNS-A-Record der Domain muss auf die Server-IP zeigen und Port 80/443 muss erreichbar sein.

### Nachträglich einrichten

```bash
# Let's Encrypt Zertifikat beantragen
sudo certbot --nginx -d meinserver.de --email admin@meinserver.de

# Automatische Erneuerung testen
sudo certbot renew --dry-run

# Certbot erneuert automatisch via systemd timer
systemctl status certbot.timer
```

### Selbstsigniertes Zertifikat (ohne Domain)

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/lsmanagement.key \
    -out /etc/ssl/certs/lsmanagement.crt \
    -subj "/CN=$(hostname -I | awk '{print $1}')"
```

Dann in `/etc/nginx/sites-available/lsmanagement` anpassen:

```nginx
server {
    listen 443 ssl;
    ssl_certificate     /etc/ssl/certs/lsmanagement.crt;
    ssl_certificate_key /etc/ssl/private/lsmanagement.key;
    # ... restliche Konfiguration
}
```

---

## Post-Installation

### Ersten Benutzer anlegen

1. Browser öffnen → `http://deine-domain.de` oder `http://server-ip`
2. **„Kostenlos registrieren"** klicken
3. Account erstellen
4. **„Neuen Hof anlegen"** → Hofname, Spielversion, Fläche eingeben

### Admin-Panel aufrufen

Das Admin-Panel ist unter `/admin` erreichbar (nicht öffentlich verlinkt).

```
URL:      https://deine-domain.de/admin
Passwort: (das bei der Installation vergebene Admin-Passwort)
```

Im Admin-Panel können:
- Benutzer verwaltet (Passwort-Reset, Deaktivieren, Löschen) werden
- SMTP-Einstellungen geändert werden
- Wünsche & Anregungen moderiert werden

---

## Updates einspielen

Das Installer-Script ist idempotent — es erkennt vorhandene Installationen und aktualisiert diese:

```bash
# Methode 1: Installer erneut ausführen (erstellt Datenbank-Backup automatisch)
sudo bash /opt/lsmanagement/install.sh

# Methode 2: Manuell
cd /opt/lsmanagement
git pull origin claude/farm-management-system-6KPmN
docker compose -f docker-compose.standalone.yml build --no-cache
systemctl restart lsmanagement
```

---

## Datenbank-Backup

### Manuelles Backup

```bash
# Backup erstellen
docker compose -f /opt/lsmanagement/docker-compose.standalone.yml stop backend
cp $(docker volume inspect lsmanagement_db_data --format '{{.Mountpoint}}')/lsmanagement.db \
    /opt/lsmanagement/backup_$(date +%Y%m%d_%H%M%S).db
docker compose -f /opt/lsmanagement/docker-compose.standalone.yml start backend

# Alternativ: direkt aus dem Container
docker cp lsmanagement-backend-1:/app/data/lsmanagement.db /opt/backups/lsmanagement_$(date +%Y%m%d).db
```

### Automatisches tägliches Backup via Cron

```bash
sudo crontab -e
```

Zeile hinzufügen:

```cron
0 3 * * * docker cp $(docker ps -qf name=lsmanagement-backend):/app/data/lsmanagement.db /opt/backups/lsmanagement_$(date +\%Y\%m\%d).db 2>/dev/null
```

### Backup wiederherstellen

```bash
docker compose -f /opt/lsmanagement/docker-compose.standalone.yml stop backend
docker cp /opt/backups/lsmanagement_20260419.db \
    $(docker ps -aqf name=lsmanagement-backend):/app/data/lsmanagement.db
docker compose -f /opt/lsmanagement/docker-compose.standalone.yml start backend
```

---

## Fehlerbehebung

### Container startet nicht

```bash
# Logs anzeigen
cd /opt/lsmanagement
docker compose -f docker-compose.standalone.yml logs --tail=50

# Einzelnen Container neu starten
docker compose -f docker-compose.standalone.yml restart backend
docker compose -f docker-compose.standalone.yml restart frontend
```

### Port 80/443 bereits belegt

```bash
# Prüfen welcher Prozess Port 80 belegt
sudo ss -tlnp | grep ':80'
sudo ss -tlnp | grep ':443'

# Nginx-Konflikte prüfen
sudo nginx -t
sudo systemctl status nginx
```

### Frontend nicht erreichbar (502 Bad Gateway)

```bash
# Prüfen ob der Frontend-Container auf Port 3000 lauscht
curl -v http://127.0.0.1:3000

# Container-Netzwerk prüfen
docker network ls
docker network inspect lsmanagement_lsm
```

### Backend-Fehler / Datenbank

```bash
# Backend-Logs
docker compose -f /opt/lsmanagement/docker-compose.standalone.yml logs backend

# Datenbank-Datei prüfen
docker exec $(docker ps -qf name=lsmanagement-backend) ls -lh /app/data/
```

### SSL-Zertifikat abgelaufen

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Firewall-Regeln prüfen (ufw)

```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## Deinstallation

```bash
# Container stoppen und entfernen
cd /opt/lsmanagement
docker compose -f docker-compose.standalone.yml down -v

# Systemd-Dienst entfernen
sudo systemctl disable lsmanagement
sudo rm /etc/systemd/system/lsmanagement.service
sudo systemctl daemon-reload

# Nginx-Konfiguration entfernen
sudo rm /etc/nginx/sites-enabled/lsmanagement
sudo rm /etc/nginx/sites-available/lsmanagement
sudo systemctl reload nginx

# Installationsverzeichnis entfernen (ACHTUNG: löscht auch die Datenbank!)
sudo rm -rf /opt/lsmanagement

# Docker Images entfernen (optional)
docker rmi lsmanagement-backend lsmanagement-frontend 2>/dev/null || true
```

---

## Architektur (Standalone)

```
Internet
   │
   ▼
[Nginx :80/:443]  ← Host-System (Let's Encrypt SSL)
   │
   ▼
[Docker Network: lsm]
   ├── [Frontend Container :3000→:80]
   │      nginx → serves React SPA
   │      /api → proxy → backend:8000
   │
   └── [Backend Container :8000]
          FastAPI + SQLAlchemy
          SQLite → /app/data/lsmanagement.db
          Volume: db_data (persistent)
```

---

## Support & Community

- **Discord:** https://discord.gg/3HUfPdTvv7
- **Supportbox:** https://lscomm.braetter-int.de/supportbox
- **Neuigkeiten:** https://lscomm.braetter-int.de/news
- **GitHub Issues:** https://github.com/nicolaybraetter/lsmanagement/issues

---

*© 2026 Nicolay Brätter · LSManagement · Für die LS-Community*
