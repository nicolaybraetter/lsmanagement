# phpIPAM LXC Deployment on pve-braetter.local

## Voraussetzungen

- Root-Zugriff auf `pve-braetter.local`
- Netzwerk-Subnetz in `01_create_lxc.sh` anpassen (`SUBNET`, `GW`, `BRIDGE`, `STORAGE`)

## Ablauf

### Schritt 1 — Skripte auf den Proxmox-Host kopieren

```bash
scp infra/phpipam/01_create_lxc.sh root@pve-braetter.local:/root/
scp infra/phpipam/02_install_phpipam.sh root@pve-braetter.local:/root/
```

### Schritt 2 — LXC-Container erstellen (auf pve-braetter.local als root)

Konfiguration oben in `01_create_lxc.sh` prüfen und ggf. anpassen:

| Variable | Bedeutung | Standard |
|---|---|---|
| `SUBNET` | Netzwerk-Präfix | `192.168.1` |
| `GW` | Gateway | `192.168.1.1` |
| `BRIDGE` | Proxmox-Bridge | `vmbr0` |
| `STORAGE` | Rootfs-Storage | `local-lvm` |
| `TEMPLATE_STORAGE` | Template-Storage | `local` |
| `DISK_SIZE` | Festplattengröße (GB) | `8` |
| `MEMORY` | RAM (MB) | `1024` |

```bash
chmod +x /root/01_create_lxc.sh
bash /root/01_create_lxc.sh
```

Das Skript:
1. Ermittelt alle genutzten CTID/VMID und wählt die nächste freie
2. Scannt per `nmap` das Subnetz und findet die erste freie IP
3. Lädt das Debian-12-Template herunter (falls nicht vorhanden)
4. Erstellt und startet den Container mit statisch zugewiesener IP

### Schritt 3 — phpIPAM installieren

```bash
pct push <CTID> /root/02_install_phpipam.sh /root/install_phpipam.sh
pct exec <CTID> -- bash /root/install_phpipam.sh
```

*(CTID wird am Ende von Schritt 2 ausgegeben)*

Das Skript installiert:
- Apache 2 + PHP 8.x + alle phpIPAM-Abhängigkeiten
- MariaDB (gesichert, zufällige Passwörter)
- phpIPAM v1.7.3
- Cron-Job für automatisches Ping-Discovery

### Schritt 4 — Web-Setup abschließen

Öffne `http://<FREE_IP>/` im Browser:
1. „New phpipam installation" wählen
2. DB-Zugangsdaten aus `/root/phpipam_credentials.txt` (im Container) eintragen
3. Admin-Benutzer anlegen
4. Fertig

## Zugangsdaten

Nach der Installation liegen alle Passwörter in:
```bash
pct exec <CTID> -- cat /root/phpipam_credentials.txt
```
