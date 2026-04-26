#!/usr/bin/env bash
# Renarvo deploy script.
#
# Runs on Hostinger after a `git pull` (either via Hostinger hPanel Git auto-deploy,
# or manually via SSH: `cd ~/renarvo && git pull && bash deploy/deploy.sh`).
#
# Steps:
#   1. composer install (no-dev, optimised) for the Laravel backend
#   2. Run pending migrations against the SQLite DB
#   3. Rebuild Laravel caches
#   4. Build the React frontend with Hostinger's CloudLinux alt-nodejs20
#   5. Publish the built dist/ + front controller (_api.php) + .htaccess into public_html/
#   6. Reset OPcache so PHP picks up new bytecode
#
# All output goes to stdout; the calling caller (GitHub Actions step,
# Hostinger webhook, or interactive SSH) is responsible for capturing it.

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$HOME/renarvo}"
PUBLIC_HTML="${PUBLIC_HTML:-$HOME/domains/renarvo.com/public_html}"
NODE_HOME="/opt/alt/alt-nodejs20/root/usr"
PATH="$NODE_HOME/bin:/usr/local/bin:$PATH"
export PATH

ts() { date -u +%FT%TZ; }
log() { echo "[deploy $(ts)] $*"; }

log "starting"
log "REPO_ROOT=$REPO_ROOT"
log "PUBLIC_HTML=$PUBLIC_HTML"
log "node=$(node --version 2>/dev/null || echo missing)"
log "npm=$(npm --version 2>/dev/null || echo missing)"
log "php=$(php --version | head -1)"
log "composer=$(composer --version | head -1)"

cd "$REPO_ROOT"

# ----- backend -----
cd "$REPO_ROOT/backend"

if [ ! -f .env ]; then
  log "FATAL: backend/.env missing on server. Provision it once manually."
  exit 1
fi

log "composer install (production)"
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist 2>&1 | tail -5

log "ensuring sqlite db"
mkdir -p database
[ -f database/renarvo.sqlite ] || touch database/renarvo.sqlite
chmod 664 database/renarvo.sqlite || true

log "migrate"
php artisan migrate --force 2>&1 | tail -10

log "caches"
php artisan config:clear >/dev/null 2>&1 || true
php artisan route:clear  >/dev/null 2>&1 || true
php artisan config:cache 2>&1 | tail -1
php artisan route:cache  2>&1 | tail -1
php artisan event:cache  2>&1 | tail -1 || true

log "storage perms"
mkdir -p storage/logs storage/framework/sessions storage/framework/cache storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache || true

# ----- frontend (build with alt-nodejs) -----
cd "$REPO_ROOT/frontend"

log "npm install (this can take 60-120s on first run)"
npm install --no-audit --no-fund 2>&1 | tail -5

log "npm run build"
VITE_API_BASE_URL=/api/v1 npm run build 2>&1 | tail -10

# ----- publish -----
log "publishing dist to $PUBLIC_HTML"
mkdir -p "$PUBLIC_HTML"

# Copy/sync everything from dist to public_html, but DON'T touch _api.php, .htaccess
# or the uploads symlink (preserved across deploys).
rsync -a --delete \
  --exclude '_api.php' \
  --exclude '.htaccess' \
  --exclude 'uploads' \
  "$REPO_ROOT/frontend/dist/" \
  "$PUBLIC_HTML/"

log "publishing _api.php and .htaccess"
cp "$REPO_ROOT/deploy/_api.php"           "$PUBLIC_HTML/_api.php"
cp "$REPO_ROOT/deploy/hostinger.htaccess" "$PUBLIC_HTML/.htaccess"
chmod 644 "$PUBLIC_HTML/_api.php" "$PUBLIC_HTML/.htaccess"

if [ ! -e "$PUBLIC_HTML/uploads" ]; then
  ln -snf "$REPO_ROOT/backend/storage/app/uploads" "$PUBLIC_HTML/uploads" || true
fi

# ----- OPcache reset -----
php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'opcache_reset(): ok\n'; }" || true

# ----- smoke test -----
log "smoke testing public endpoints"
for path in /api/v1/health /api/v1/cities; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "https://renarvo.com${path}")
  log "GET ${path} -> ${code}"
done

log "complete"
