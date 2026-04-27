#!/usr/bin/env bash
# Run this INSIDE the LXC container (via: pct exec <CTID> -- bash /root/install_phpipam.sh)
# Installs phpIPAM with Apache, MariaDB, and PHP on Debian 12.
set -euo pipefail

PHPIPAM_VERSION="1.7.3"       # latest stable — change if newer released
DB_NAME="phpipam"
DB_USER="phpipam"
DB_PASS="$(openssl rand -base64 18 | tr -d '/+=')"
DB_ROOT_PASS="$(openssl rand -base64 18 | tr -d '/+=')"
PHPIPAM_DIR="/var/www/html/phpipam"

echo "==> Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  apache2 \
  mariadb-server \
  mariadb-client \
  php \
  php-mysql \
  php-curl \
  php-gd \
  php-intl \
  php-ldap \
  php-mbstring \
  php-pear \
  php-snmp \
  php-xml \
  php-gmp \
  php-json \
  libapache2-mod-php \
  wget \
  unzip \
  git \
  cron \
  fping \
  nmap \
  graphviz

echo "==> Securing MariaDB"
systemctl enable --now mariadb

mysql -u root <<SQL
  ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}';
  DELETE FROM mysql.user WHERE User='';
  DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
  DROP DATABASE IF EXISTS test;
  DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
  FLUSH PRIVILEGES;
SQL

echo "==> Creating phpIPAM database and user"
mysql -u root -p"${DB_ROOT_PASS}" <<SQL
  CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
  GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
  FLUSH PRIVILEGES;
SQL

echo "==> Downloading phpIPAM ${PHPIPAM_VERSION}"
mkdir -p "$PHPIPAM_DIR"
wget -q "https://github.com/phpipam/phpipam/releases/download/v${PHPIPAM_VERSION}/phpipam-v${PHPIPAM_VERSION}.tgz" \
  -O /tmp/phpipam.tgz
tar -xzf /tmp/phpipam.tgz -C /tmp
cp -r /tmp/phpipam/. "$PHPIPAM_DIR/"
rm -rf /tmp/phpipam /tmp/phpipam.tgz

echo "==> Configuring phpIPAM"
cp "${PHPIPAM_DIR}/config.dist.php" "${PHPIPAM_DIR}/config.php"

# Patch database credentials in config.php
sed -i \
  -e "s/^\(\$db\['host'\]\s*=\s*\).*/\1'127.0.0.1';/" \
  -e "s/^\(\$db\['user'\]\s*=\s*\).*/\1'${DB_USER}';/" \
  -e "s/^\(\$db\['pass'\]\s*=\s*\).*/\1'${DB_PASS}';/" \
  -e "s/^\(\$db\['name'\]\s*=\s*\).*/\1'${DB_NAME}';/" \
  "${PHPIPAM_DIR}/config.php"

# Enable .htaccess rewrites
sed -i "s/^\(\$config\['rewrite_enabled'\]\s*=\s*\).*/\10;/" \
  "${PHPIPAM_DIR}/config.php" || true

chown -R www-data:www-data "$PHPIPAM_DIR"
chmod -R 755 "$PHPIPAM_DIR"

echo "==> Configuring Apache"
cat > /etc/apache2/sites-available/phpipam.conf <<'APACHECONF'
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/phpipam

    <Directory /var/www/html/phpipam>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/phpipam_error.log
    CustomLog ${APACHE_LOG_DIR}/phpipam_access.log combined
</VirtualHost>
APACHECONF

a2ensite phpipam.conf
a2dissite 000-default.conf 2>/dev/null || true
a2enmod rewrite
systemctl enable --now apache2
systemctl restart apache2

echo "==> Setting up cron job for phpIPAM discovery"
(crontab -l 2>/dev/null || true; echo "*/15 * * * * www-data /usr/bin/php ${PHPIPAM_DIR}/functions/scripts/pingCheck.php") \
  | crontab -

echo "==> Enabling MariaDB on boot"
systemctl enable mariadb

# Save credentials
cat > /root/phpipam_credentials.txt <<CREDS
phpIPAM Installation Summary
==============================
URL           : http://$(hostname -I | awk '{print $1}')/
DB Host       : 127.0.0.1
DB Name       : ${DB_NAME}
DB User       : ${DB_USER}
DB Password   : ${DB_PASS}
DB Root PW    : ${DB_ROOT_PASS}

First login   : open the URL above → "New phpipam installation"
               → use the DB credentials above
               → create admin user during setup wizard
CREDS
chmod 600 /root/phpipam_credentials.txt

echo ""
echo "============================================================"
echo "  phpIPAM installation complete!"
echo "  Open: http://$(hostname -I | awk '{print $1}')/"
echo "  Credentials saved to: /root/phpipam_credentials.txt"
echo "============================================================"
cat /root/phpipam_credentials.txt
