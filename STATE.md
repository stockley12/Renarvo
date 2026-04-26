# Renarvo Deployment State

> Resume document for the AI agent. If chat restarts, read this first.

## Mission
Deploy Renarvo (React frontend + Laravel 11 backend) to Hostinger Business shared hosting at `renarvo.com`, push code to `github.com/stockley12/Renarvo`, set up auto-deploy.

## Server (Hostinger Business)
- **IP**: 92.112.189.210
- **SSH port**: 65002
- **SSH user**: u273509288
- **SSH password**: `Tested1337!`  (User-provided. Rotate after launch.)
- **Host key (pinned)**: `SHA256:ZJkk5J/8g0ieMWrhAhaPLSXpc3ooAy4QPswPN3whd8g`
- **PHP**: 8.2.30 at `/usr/bin/php`
- **Composer**: 2.8.11 at `/usr/local/bin/composer`
- **Node.js**: NOT installed (frontend must be built locally)
- **Domain root**: `~/domains/renarvo.com/public_html/` (also `renarvo-com-462287.hostingersite.com`)
- **App working dir**: `~/renarvo` (git clone of the repo)
- **Database**: SQLite at `~/renarvo/backend/database/renarvo.sqlite`  (Hostinger Business shared hosting can't create MySQL DBs without hPanel UI; SQLite is sufficient for v1.)

## GitHub
- **Repo**: https://github.com/stockley12/Renarvo (owner: stockley12)
- **Branch**: main
- **Initial commit**: `ba8a6c4`
- **Hostinger SSH public key** registered as Deploy Key id `149730320` (read-only, name `hostinger-prod`) — server can `git pull` over SSH (`git@github.com:stockley12/Renarvo.git`).
- **GitHub Actions deploy keypair** (Ed25519) at:
  - Private: `c:\Users\Anon\Desktop\Renarvo\.tools\gha_deploy_ed25519`
  - Public: `c:\Users\Anon\Desktop\Renarvo\.tools\gha_deploy_ed25519.pub`
  - Server `~/.ssh/authorized_keys` already contains the public key.

## SSH automation helpers (Windows)
- `c:\Users\Anon\Desktop\Renarvo\.tools\rssh.ps1` — runs a bash command on the server via plink
- `c:\Users\Anon\Desktop\Renarvo\.tools\rput.ps1` — uploads a file via pscp
- Usage: `& .\.tools\rssh.ps1 -Cmd 'whoami'`
- plink/pscp installed at `C:\Program Files\PuTTY\`
- Local OpenSSH key path: `C:\Users\Anon\Desktop\Renarvo\.tools\gha_deploy_ed25519`
  - `ssh -i ... -p 65002 u273509288@92.112.189.210` works without password prompt.

## Done
- [x] Monorepo restructured (`frontend/`, `backend/`, `deploy/`, `.github/`, `docs/`)
- [x] Laravel 11 backend coded (controllers, models, migrations, seeders, services, jobs)
- [x] React frontend integration hooks + API client
- [x] Initial commit pushed to GitHub `main`
- [x] Hostinger SSH key as GitHub Deploy Key
- [x] GHA deploy SSH keypair generated and authorized on server
- [x] Frontend built locally → `frontend/dist/`
- [x] Repo cloned to `~/renarvo` on server
- [x] `composer install --no-dev` complete on server (Laravel 11.51.0)
- [x] Storage perms set (775)

## In Progress / Next
1. Generate `APP_KEY`, `JWT_SECRET`, write `backend/.env` (SQLite)
2. Run migrations + seed (DemoSeeder + new TestUsersSeeder for all 3 roles)
3. Upload built `dist/*` to `~/domains/renarvo.com/public_html/`
4. Symlink `public_html/api` → `~/renarvo/backend/public`
5. Write public_html `.htaccess` for SPA fallback + CORS
6. Configure GitHub Actions secrets and trigger first deploy workflow
7. Provide cron job command (Hostinger has no `crontab` CLI — must paste in hPanel → Cron Jobs)
8. Test https://renarvo.com/api/v1/health and full SPA load

## Test accounts (TO BE SEEDED)
Will be created in `database/seeders/TestUsersSeeder.php` with these emails:
- Customer:       `customer@renarvo.com`         / `RenarvoTest!1`
- Company owner:  `company@renarvo.com`          / `RenarvoTest!1`
- Super admin:    `admin@renarvo.com`            / `RenarvoTest!1`

## Open follow-ups (post-launch)
- Rotate SSH password
- Migrate from SQLite → MySQL (create DB in hPanel; update `DB_*` in `backend/.env`; `php artisan migrate:fresh --seed`)
- Frontend pages still import from `src/mock/data.ts` — wire to `useCars`, `useReservations`, etc. hooks
- Configure SMTP (Hostinger email or third party) — currently logs only
- Configure Stripe / İyzico for real payments
