#!/bin/bash
set -e

# Prepare application
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Run migrations
php artisan migrate --force

# Start services
exec supervisord -c /etc/supervisord.conf
