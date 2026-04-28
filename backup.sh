#!/usr/bin/env bash
# =============================================================================
#  LSManagement — Datenbank-Backup Script
#  Verwendung:  bash backup.sh [--keep N]
#  Cron:        0 3 * * * /opt/lsmanagement/backup.sh >> /var/log/lsmanagement-backup.log 2>&1
# =============================================================================
set -euo pipefail

# ── Konfiguration ─────────────────────────────────────────────────────────────
BACKUP_DIR="/opt/backups/lsmanagement"
KEEP_DAYS=30          # Backups älter als N Tage automatisch löschen
CONTAINER_FILTER="lsmanagement-backend"
DB_PATH_IN_CONTAINER="/app/data/lsmanagement.db"

# Optionaler Parameter --keep N
if [[ "${1:-}" == "--keep" && -n "${2:-}" ]]; then
    KEEP_DAYS="$2"
fi

# ── Farben & Logging ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
ok()   { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}OK${NC}  $*"; }
err()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}ERR${NC} $*"; exit 1; }
warn() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}WRN${NC} $*"; }

log "=== LSManagement Backup gestartet ==="

# ── Backup-Verzeichnis anlegen ────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Container finden ─────────────────────────────────────────────────────────
CONTAINER_ID=$(docker ps -qf "name=${CONTAINER_FILTER}" | head -n1)
if [[ -z "$CONTAINER_ID" ]]; then
    err "Backend-Container nicht gefunden. Läuft der Stack? (docker ps | grep ${CONTAINER_FILTER})"
fi
log "Container gefunden: ${CONTAINER_ID}"

# ── Datenbankdatei prüfen ─────────────────────────────────────────────────────
DB_SIZE=$(docker exec "$CONTAINER_ID" du -sh "$DB_PATH_IN_CONTAINER" 2>/dev/null | cut -f1 || echo "?")
log "Datenbankgröße: ${DB_SIZE}"

# ── Backup erstellen ──────────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/lsmanagement_${TIMESTAMP}.db"
BACKUP_GZ="${BACKUP_FILE}.gz"

docker cp "${CONTAINER_ID}:${DB_PATH_IN_CONTAINER}" "$BACKUP_FILE"

# Komprimieren
gzip "$BACKUP_FILE"

FINAL_SIZE=$(du -sh "$BACKUP_GZ" | cut -f1)
ok "Backup erstellt: ${BACKUP_GZ} (${FINAL_SIZE})"

# ── Alte Backups aufräumen ────────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "lsmanagement_*.db.gz" -mtime +"$KEEP_DAYS" -print -delete | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
    warn "${DELETED} alte(s) Backup(s) gelöscht (älter als ${KEEP_DAYS} Tage)."
fi

# ── Übersicht ─────────────────────────────────────────────────────────────────
TOTAL=$(find "$BACKUP_DIR" -name "lsmanagement_*.db.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Gesamt: ${TOTAL} Backup(s) in ${BACKUP_DIR} (${TOTAL_SIZE})"
log "=== Backup abgeschlossen ==="
