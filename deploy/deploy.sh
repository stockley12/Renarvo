#!/usr/bin/env bash
# Renarvo post-deploy script: runs on Hostinger after `git pull`.
# Triggered either by Hostinger's Git auto-deploy webhook or GitHub Actions SSH job.

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$HOME/renarvo}"
PUBLIC_HTML="${PUBLIC_HTML:-$HOME/public_html}"

echo "[deploy] starting at $(date -u +%FT%TZ)"
cd "$REPO_ROOT"

# ---------- Backend ----------
echo "[deploy] backend: composer install"
cd "$REPO_ROOT/backend"
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

echo "[deploy] backend: migrate"
php artisan migrate --force

echo "[deploy] backend: cache config/routes/views"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache || true

# ---------- Frontend ----------
echo "[deploy] frontend: npm ci + build"
cd "$REPO_ROOT/frontend"
npm ci --no-audit --no-fund
npm run build

# ---------- Publish ----------
echo "[deploy] publishing static assets to $PUBLIC_HTML"
mkdir -p "$PUBLIC_HTML"
rsync -a --delete \
  --exclude=api \
  --exclude=uploads \
  --exclude=storage \
  --exclude=.htaccess \
  "$REPO_ROOT/frontend/dist/" \
  "$PUBLIC_HTML/"

cp "$REPO_ROOT/deploy/hostinger.htaccess" "$PUBLIC_HTML/.htaccess"

echo "[deploy] publishing API entry point"
mkdir -p "$PUBLIC_HTML/api"
cp "$REPO_ROOT/backend/public/index.php" "$PUBLIC_HTML/api/index.php"
cp "$REPO_ROOT/deploy/api.htaccess" "$PUBLIC_HTML/api/.htaccess"

# Rewrite the require paths in api/index.php so it points back into ~/renarvo/backend
sed -i "s|__DIR__\\.'/\\.\\./|'$REPO_ROOT/backend/|g" "$PUBLIC_HTML/api/index.php"

# ---------- Symlink storage ----------
if [ ! -L "$PUBLIC_HTML/uploads" ]; then
  ln -sfn "$REPO_ROOT/backend/storage/app/uploads" "$PUBLIC_HTML/uploads"
fi

# ---------- OPcache reset ----------
php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'opcache reset\n'; }" || true

echo "[deploy] complete at $(date -u +%FT%TZ)"
