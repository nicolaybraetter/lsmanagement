#!/usr/bin/env bash
# Run this script as root directly on pve-braetter.local
# It finds a free CTID + a free IP, then creates the LXC container.
set -euo pipefail

# ─── CONFIG ────────────────────────────────────────────────────────────────────
SUBNET="192.168.1"          # adjust to your network (e.g. 10.0.0)
SCAN_RANGE="${SUBNET}.1-254"
GW="${SUBNET}.1"
NETMASK="24"
BRIDGE="vmbr0"              # adjust if you use a different bridge
STORAGE="local-lvm"         # Proxmox storage for the rootfs
TEMPLATE_STORAGE="local"    # where CT templates are stored
TEMPLATE_NAME="debian-12-standard_12.7-1_amd64.tar.zst"
DISK_SIZE="8"               # GB
MEMORY="1024"               # MB
CORES="2"
HOSTNAME="phpipam"
DNS="8.8.8.8"
# ───────────────────────────────────────────────────────────────────────────────

echo "==> Step 1: Determine a free Container ID"

# Collect all used IDs from both VMs and CTs
USED_IDS=$(
  { pvesh get /cluster/resources --type vm 2>/dev/null || true; } \
  | grep -oP '"vmid":\K[0-9]+' \
  | sort -n
)

CTID=100
for id in $USED_IDS; do
  if [ "$CTID" -lt "$id" ]; then
    break
  fi
  CTID=$(( id + 1 ))
done
echo "    → Selected CTID: $CTID"

# ───────────────────────────────────────────────────────────────────────────────
echo "==> Step 2: Scan for a free IP in $SCAN_RANGE (this may take ~30 s)"

if ! command -v nmap &>/dev/null; then
  echo "    nmap not found — installing..."
  apt-get install -y nmap -q
fi

# Get all IPs that respond to a ping scan
USED_IPS=$(nmap -sn "${SUBNET}.0/${NETMASK}" -oG - 2>/dev/null \
  | awk '/Up$/{print $2}')

FREE_IP=""
for last in $(seq 10 254); do
  CANDIDATE="${SUBNET}.${last}"
  if ! echo "$USED_IPS" | grep -qx "$CANDIDATE"; then
    # Double-check with arping (works even if host blocks ICMP)
    if ! arping -c 1 -w 1 "$CANDIDATE" &>/dev/null 2>&1; then
      FREE_IP="$CANDIDATE"
      break
    fi
  fi
done

if [ -z "$FREE_IP" ]; then
  echo "ERROR: No free IP found in $SCAN_RANGE" >&2
  exit 1
fi
echo "    → Selected IP: $FREE_IP/${NETMASK}"

# ───────────────────────────────────────────────────────────────────────────────
echo "==> Step 3: Download CT template if missing"

TEMPLATE_PATH="${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE_NAME}"
if ! pveam list "$TEMPLATE_STORAGE" 2>/dev/null | grep -q "$TEMPLATE_NAME"; then
  echo "    Downloading $TEMPLATE_NAME ..."
  pveam update
  pveam download "$TEMPLATE_STORAGE" "$TEMPLATE_NAME"
fi
echo "    → Template ready"

# ───────────────────────────────────────────────────────────────────────────────
echo "==> Step 4: Create LXC container $CTID"

pct create "$CTID" "${TEMPLATE_PATH}" \
  --hostname "$HOSTNAME" \
  --cores "$CORES" \
  --memory "$MEMORY" \
  --swap 512 \
  --rootfs "${STORAGE}:${DISK_SIZE}" \
  --net0 "name=eth0,bridge=${BRIDGE},ip=${FREE_IP}/${NETMASK},gw=${GW}" \
  --nameserver "$DNS" \
  --unprivileged 0 \
  --features "nesting=1" \
  --start 0

echo "    → Container $CTID created"

# ───────────────────────────────────────────────────────────────────────────────
echo "==> Step 5: Start container and set static IP inside"

pct start "$CTID"
sleep 4

# Make sure the IP is really static via /etc/network/interfaces inside the CT
pct exec "$CTID" -- bash -c "
cat > /etc/network/interfaces <<'EOF'
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet static
    address ${FREE_IP}/${NETMASK}
    gateway ${GW}
    dns-nameservers ${DNS}
EOF
systemctl restart networking 2>/dev/null || true
"

echo ""
echo "============================================================"
echo "  Container $CTID created and running"
echo "  Hostname : $HOSTNAME"
echo "  IP       : ${FREE_IP}/${NETMASK}"
echo "  Gateway  : $GW"
echo ""
echo "  Next step:"
echo "    pct exec $CTID -- bash /root/install_phpipam.sh"
echo "  Or copy the installer first:"
echo "    pct push $CTID ./02_install_phpipam.sh /root/install_phpipam.sh"
echo "============================================================"
