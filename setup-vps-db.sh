#!/bin/bash
set -e

echo "================================================="
echo "1. MENYIAPKAN SOCKET & MEMBERSIHKAN PROSES MYSQL"
echo "================================================="
mkdir -p /run/mysqld
pkill -9 -f mysqld 2>/dev/null || true
pkill -9 -f mysqld_safe 2>/dev/null || true
sleep 2

echo "================================================="
echo "2. NYALAKAN MYSQL MODE BYPASS OTENTIKASI"
echo "================================================="
/www/server/mysql/bin/mysqld --defaults-file=/etc/my.cnf --user=mysql --skip-grant-tables --skip-networking &
sleep 5

ln -sf /tmp/mysql.sock /run/mysqld/mysqld.sock 2>/dev/null || true

echo "================================================="
echo "3. MEMBUAT DATABASE & USER NUSARA"
echo "================================================="
mysql --socket=/tmp/mysql.sock -u root << 'EOF'
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS nusara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP USER IF EXISTS 'nusara'@'%';
DROP USER IF EXISTS 'nusara'@'localhost';
DROP USER IF EXISTS 'nusara'@'127.0.0.1';

CREATE USER 'nusara'@'%' IDENTIFIED WITH mysql_native_password BY 'NusaraResto2026!';
CREATE USER 'nusara'@'localhost' IDENTIFIED WITH mysql_native_password BY 'NusaraResto2026!';
CREATE USER 'nusara'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'NusaraResto2026!';

GRANT ALL PRIVILEGES ON nusara.* TO 'nusara'@'%';
GRANT ALL PRIVILEGES ON nusara.* TO 'nusara'@'localhost';
GRANT ALL PRIVILEGES ON nusara.* TO 'nusara'@'127.0.0.1';
FLUSH PRIVILEGES;
EOF

echo "================================================="
echo "4. MERESTART MYSQL SECARA NORMAL"
echo "================================================="
pkill -9 -f mysqld 2>/dev/null || true
sleep 2
/etc/init.d/mysqld start
sleep 4

mkdir -p /run/mysqld
ln -sf /tmp/mysql.sock /run/mysqld/mysqld.sock 2>/dev/null || true

echo "================================================="
echo "5. PENGUJIAN KONEKSI DATABASE NUSARA"
echo "================================================="
mysql --socket=/tmp/mysql.sock -u nusara -p'NusaraResto2026!' -D nusara -e "SELECT 'Koneksi Database Berhasil!' AS status;"

echo "================================================="
echo "6. KONFIGURASI FILE .ENV LARAVEL"
echo "================================================="
sed -i 's/DB_CONNECTION=.*/DB_CONNECTION=mysql/g' .env
sed -i 's/DB_HOST=.*/DB_HOST=127.0.0.1/g' .env
sed -i 's/DB_PORT=.*/DB_PORT=3306/g' .env
sed -i 's/DB_DATABASE=.*/DB_DATABASE=nusara/g' .env
sed -i 's/DB_USERNAME=.*/DB_USERNAME=nusara/g' .env
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=NusaraResto2026!/g' .env

echo "================================================="
echo "7. MENJALANKAN MIGRASI & SEEDING RESTORAN NUSARA"
echo "================================================="
php artisan migrate:fresh --seed --force

echo "================================================="
echo "8. MEMBERSIHKAN CACHE & HAK AKSES"
echo "================================================="
chown -R www:www .
chmod -R 775 storage bootstrap/cache
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "================================================="
echo "SELESAI! RESTORAN NUSARA SUDAH LIVE DENGAN MYSQL"
echo "================================================="
