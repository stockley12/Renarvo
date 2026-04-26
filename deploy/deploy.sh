#!/usr/bin/env bash
# Renarvo post-deploy script.
# Runs on Hostinger after the GitHub Actions workflow has:
#   1. built the frontend in the GHA runner (Hostinger has no node)
#   2. rsynced the dist/ to public_html
#   3. opened an SSH session and called this script
#
# Responsibilities here:
#   - update vendor/ via composer (no-dev, optimised autoloader)
#   - run pending DB migrations (sqlite)
#   - rebuild laravel caches
#   - copy front controller (_api.php) and root .htaccess into public_html
#   - reset OPcache so the new bytecode is picked up

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$HOME/renarvo}"
PUBLIC_HTML="${PUBLIC_HTML:-$HOME/domains/renarvo.com/public_html}"

ts() { date -u +%FT%TZ; }
log() { echo "[deploy $(ts)] $*"; }

log "starting"
log "REPO_ROOT=$REPO_ROOT"
log "PUBLIC_HTML=$PUBLIC_HTML"

cd "$REPO_ROOT"

# ----- backend -----
cd "$REPO_ROOT/backend"

if [ ! -f .env ]; then
  log "FATAL: backend/.env missing on server. Provision it once manually."
  exit 1
fi

log "composer install (production)"
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist 2>&1 | tail -3 || true

log "ensuring sqlite database file exists"
mkdir -p database
[ -f database/renarvo.sqlite ] || touch database/renarvo.sqlite
chmod 664 database/renarvo.sqlite || true

log "running migrations"
php artisan migrate --force 2>&1 | tail -10

log "rebuilding Laravel caches"
php artisan config:clear >/dev/null 2>&1 || true
php artisan route:clear  >/dev/null 2>&1 || true
php artisan config:cache 2>&1 | tail -1
php artisan route:cache  2>&1 | tail -1
php artisan event:cache  2>&1 | tail -1 || true

log "ensuring storage permissions"
mkdir -p storage/logs storage/framework/{sessions,cache,views} bootstrap/cache
chmod -R 775 storage bootstrap/cache || true

# ----- public_html (front controller + htaccess) -----
log "publishing front controller + htaccess"
mkdir -p "$PUBLIC_HTML"
cp "$REPO_ROOT/deploy/_api.php"           "$PUBLIC_HTML/_api.php"
cp "$REPO_ROOT/deploy/hostinger.htaccess" "$PUBLIC_HTML/.htaccess"
chmod 644 "$PUBLIC_HTML/_api.php" "$PUBLIC_HTML/.htaccess"

# ----- uploads symlink so /uploads is web-served from outside docroot -----
if [ ! -e "$PUBLIC_HTML/uploads" ]; then
  ln -snf "$REPO_ROOT/backend/storage/app/uploads" "$PUBLIC_HTML/uploads" || true
fi

# ----- OPcache reset (best effort) -----
php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'opcache_reset(): ok\n'; }" || true

log "complete"
