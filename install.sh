#!/usr/bin/env bash
# =============================================================================
#  LSManagement — Ubuntu 24.04 Installer
#  Version:    1.9
#  Repository: https://github.com/nicolaybraetter/lsmanagement
# =============================================================================
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[ OK ]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERR ]${NC}  $*"; exit 1; }
log_step()  { echo -e "\n${CYAN}${BOLD}▶  $*${NC}\n"; }
ask()       { echo -en "${YELLOW}  → ${NC}$* "; }

# ── Constants ─────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/nicolaybraetter/lsmanagement.git"
BRANCH="claude/farm-management-system-6KPmN"
DEFAULT_DIR="/opt/lsmanagement"
COMPOSE_FILE="docker-compose.standalone.yml"
NGINX_CONF="/etc/nginx/sites-available/lsmanagement"
SERVICE_FILE="/etc/systemd/system/lsmanagement.service"

# ── Banner ────────────────────────────────────────────────────────────────────
clear
echo -e "${GREEN}${BOLD}"
cat << 'BANNER'
  _     ____  __  __
 | |   / ___||  \/  | __ _ _ __   __ _  __ _  ___ _ __ ___   ___ _ __ | |_
 | |   \___ \| |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '_ ` _ \ / _ \ '_ \| __|
 | |___ ___) | |  | | (_| | | | | (_| | (_| |  __/ | | | | |  __/ | | | |_
 |_____|____/|_|  |_|\__,_|_| |_|\__,_|\__, |\___|_| |_| |_|\___|_| |_|\__|
                                        |___/
  Betriebsverwaltung fuer Farming Simulator 22 & 25
  Ubuntu 24.04 Installer — v1.9
BANNER
echo -e "${NC}"

# ── Root Check ────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && log_error "Bitte als root oder mit sudo ausfuehren: sudo bash install.sh"

# ── OS Check ──────────────────────────────────────────────────────────────────
if ! grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
    log_error "Dieses Script unterstuetzt nur Ubuntu-Systeme."
fi
OS_VER=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2)
log_info "Erkanntes System: Ubuntu ${OS_VER}"
if [[ "$OS_VER" != "24.04" ]]; then
    log_warn "Empfohlen: Ubuntu 24.04. Erkannte Version: ${OS_VER}"
    ask "Trotzdem fortfahren? [j/N]:"
    read -r CONT; [[ "${CONT,,}" != "j" && "${CONT,,}" != "y" ]] && exit 0
fi

# ── Interactive Setup ─────────────────────────────────────────────────────────
log_step "Konfiguration"

ask "Installationsverzeichnis [${DEFAULT_DIR}]:"
read -r INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_DIR}"

ask "Domain / Hostname (z.B. meinserver.de — leer lassen fuer HTTP-only):"
read -r DOMAIN

ask "Admin-Passwort fuer das LSManagement-Backend:"
read -rs ADMIN_PASSWORD; echo
[[ -z "$ADMIN_PASSWORD" ]] && log_error "Admin-Passwort darf nicht leer sein."

SECRET_KEY=$(openssl rand -hex 32)
log_info "JWT Secret Key automatisch generiert."

echo ""
ask "SMTP/E-Mail-Benachrichtigungen einrichten? [j/N]:"
read -r SMTP_ENABLE
if [[ "${SMTP_ENABLE,,}" == "j" || "${SMTP_ENABLE,,}" == "y" ]]; then
    ask "SMTP Host (z.B. smtp.gmail.com):"           ; read -r  SMTP_HOST
    ask "SMTP Port (465 = SSL / 587 = STARTTLS):"    ; read -r  SMTP_PORT
    ask "SMTP Benutzer (E-Mail-Adresse):"            ; read -r  SMTP_USER
    ask "SMTP Passwort:"                             ; read -rs SMTP_PASSWORD; echo
    ask "Absender-Adresse (From):"                   ; read -r  SMTP_FROM
    ask "Betreiber-E-Mail (Support-Empfaenger):"     ; read -r  OPERATOR_EMAIL
else
    SMTP_HOST=""; SMTP_PORT="587"; SMTP_USER=""
    SMTP_PASSWORD=""; SMTP_FROM=""; OPERATOR_EMAIL=""
    log_info "SMTP uebersprungen — spaeter im Admin-Panel konfigurierbar."
fi

# ── Confirm ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}Zusammenfassung:${NC}"
echo -e "  Verzeichnis : ${INSTALL_DIR}"
echo -e "  Domain      : ${DOMAIN:-"(HTTP-only / IP)"}"
echo -e "  SMTP        : ${SMTP_HOST:-"(nicht konfiguriert)"}"
echo ""
ask "Installation starten? [J/n]:"
read -r START; [[ "${START,,}" == "n" ]] && exit 0

# ── System-Pakete ─────────────────────────────────────────────────────────────
log_step "System-Pakete installieren"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    ca-certificates curl gnupg lsb-release git nginx \
    certbot python3-certbot-nginx openssl
log_ok "System-Pakete installiert."

# ── Docker CE ─────────────────────────────────────────────────────────────────
log_step "Docker CE einrichten"
if command -v docker &>/dev/null; then
    log_info "Docker bereits vorhanden: $(docker --version)"
else
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    log_ok "Docker CE installiert: $(docker --version)"
fi

# ── Repository klonen / aktualisieren ────────────────────────────────────────
log_step "Repository einrichten"
if [[ -d "${INSTALL_DIR}/.git" ]]; then
    log_info "Vorhandene Installation gefunden — aktualisiere..."
    # Datenbank sichern
    DB_PATH="${INSTALL_DIR}/backend/data/lsmanagement.db"
    if [[ -f "$DB_PATH" ]]; then
        BACKUP="${INSTALL_DIR}/backup_$(date +%Y%m%d_%H%M%S).db"
        cp "$DB_PATH" "$BACKUP"
        log_ok "Datenbank-Backup erstellt: ${BACKUP}"
    fi
    git -C "$INSTALL_DIR" fetch origin "$BRANCH"
    git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH"
else
    git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi
log_ok "Repository bereit: ${INSTALL_DIR}"

# ── .env Datei erstellen ──────────────────────────────────────────────────────
log_step ".env Konfigurationsdatei schreiben"
cat > "${INSTALL_DIR}/.env" << ENVFILE
# LSManagement — Konfiguration
# Erstellt: $(date '+%d.%m.%Y %H:%M')

SECRET_KEY=${SECRET_KEY}
DATABASE_URL=sqlite:///./data/lsmanagement.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# SMTP — E-Mail-Benachrichtigungen (auch per Admin-Panel konfigurierbar)
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}
SMTP_FROM=${SMTP_FROM}
OPERATOR_EMAIL=${OPERATOR_EMAIL}
ENVFILE
chmod 600 "${INSTALL_DIR}/.env"
log_ok ".env Datei erstellt (Rechte: 600)."

# ── Docker Build & Start ──────────────────────────────────────────────────────
log_step "Docker Images bauen (kann einige Minuten dauern)"
cd "$INSTALL_DIR"
docker compose -f "$COMPOSE_FILE" build --no-cache
docker compose -f "$COMPOSE_FILE" up -d
log_ok "Container gestartet."

# ── Warten bis Frontend erreichbar ────────────────────────────────────────────
log_info "Warte auf Container-Start..."
for i in {1..30}; do
    if curl -sf http://127.0.0.1:3000 >/dev/null 2>&1; then
        log_ok "Frontend ist erreichbar."; break
    fi
    sleep 3
    [[ $i -eq 30 ]] && log_warn "Frontend noch nicht erreichbar — bitte Logs pruefen."
done

# ── Nginx Host-Konfiguration ──────────────────────────────────────────────────
log_step "Nginx als Reverse Proxy konfigurieren"
SERVER_NAME="${DOMAIN:-_}"
cat > "$NGINX_CONF" << NGINXCONF
server {
    listen 80;
    server_name ${SERVER_NAME};
    client_max_body_size 10M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # Cache statische Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
NGINXCONF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/lsmanagement
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log_ok "Nginx konfiguriert und neu geladen."

# ── SSL / Let's Encrypt ───────────────────────────────────────────────────────
if [[ -n "$DOMAIN" ]]; then
    log_step "SSL-Zertifikat einrichten (Let's Encrypt)"
    log_warn "Sicherstellen: DNS A-Record fuer '${DOMAIN}' zeigt auf diese IP."
    ask "SSL-Zertifikat jetzt anfordern? [J/n]:"
    read -r DO_SSL
    if [[ "${DO_SSL,,}" != "n" ]]; then
        ask "E-Mail-Adresse fuer SSL-Ablaufbenachrichtigungen:"
        read -r SSL_EMAIL
        if [[ -n "$SSL_EMAIL" ]]; then
            certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
                --email "$SSL_EMAIL" --redirect \
                && log_ok "SSL-Zertifikat erfolgreich eingerichtet." \
                || log_warn "SSL fehlgeschlagen. Manuell ausfuehren: certbot --nginx -d ${DOMAIN}"
        else
            certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
                --register-unsafely-without-email --redirect \
                && log_ok "SSL-Zertifikat eingerichtet." \
                || log_warn "SSL fehlgeschlagen. Manuell ausfuehren: certbot --nginx -d ${DOMAIN}"
        fi
    fi
fi

# ── Systemd Service ───────────────────────────────────────────────────────────
log_step "Systemd-Autostart einrichten"
cat > "$SERVICE_FILE" << SVCFILE
[Unit]
Description=LSManagement — Farming Simulator Betriebsverwaltung
Documentation=https://github.com/nicolaybraetter/lsmanagement
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/docker compose -f ${COMPOSE_FILE} up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f ${COMPOSE_FILE} down
ExecReload=/usr/bin/docker compose -f ${COMPOSE_FILE} restart
TimeoutStartSec=300
TimeoutStopSec=60
Restart=on-failure

[Install]
WantedBy=multi-user.target
SVCFILE

systemctl daemon-reload
systemctl enable lsmanagement
log_ok "Systemd-Dienst 'lsmanagement' aktiviert (startet automatisch nach Reboot)."

# ── Abschluss ─────────────────────────────────────────────────────────────────
if [[ -n "$DOMAIN" ]]; then
    URL="https://${DOMAIN}"
else
    PUBLIC_IP=$(curl -4sf https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    URL="http://${PUBLIC_IP}"
fi

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   LSManagement erfolgreich installiert!              ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}URL:${NC}              ${CYAN}${URL}${NC}"
echo -e "  ${BOLD}Verzeichnis:${NC}      ${INSTALL_DIR}"
echo ""
echo -e "  ${BOLD}Wichtige Befehle:${NC}"
echo -e "  Status          →  systemctl status lsmanagement"
echo -e "  Logs            →  cd ${INSTALL_DIR} && docker compose -f ${COMPOSE_FILE} logs -f"
echo -e "  Neustart        →  systemctl restart lsmanagement"
echo -e "  Update          →  sudo bash ${INSTALL_DIR}/install.sh"
echo -e "  SSL erneuern    →  certbot renew"
echo ""
echo -e "  ${BOLD}Erste Schritte:${NC}"
echo -e "  1. Rufe ${URL} im Browser auf"
echo -e "  2. Registriere deinen Account"
echo -e "  3. Lege deinen ersten Hof an"
echo ""
