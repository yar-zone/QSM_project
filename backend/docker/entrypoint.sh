#!/bin/sh
set -e

# Ensure storage directories exist and are writable
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs

chmod -R 775 /var/www/html/storage \
             /var/www/html/bootstrap/cache \
             /var/www/html/database

php /var/www/html/artisan optimize:clear
php /var/www/html/artisan key:generate --force
php /var/www/html/artisan migrate --force

exec php /var/www/html/artisan serve --host=0.0.0.0 --port=${PORT:-8000}