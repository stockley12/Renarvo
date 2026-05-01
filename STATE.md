# Renarvo Deployment State

> Resume document for the AI agent. If chat restarts, read this first.

## Mission
Deploy Renarvo (React frontend + Laravel 11 backend) to Hostinger Business shared hosting at `renarvo.com`, push code to `github.com/stockley12/Renarvo`, set up auto-deploy.

## Status: LIVE (go-live mode, no demo data)
- https://renarvo.com → SPA (React) loads
- https://renarvo.com/api/v1/health → `{"data":{"status":"ok",...}}`
- https://renarvo.com/api/v1/cities → JSON list
- DB: SQLite at `~/renarvo/backend/database/renarvo.sqlite` — migrated, seeded with `LiveSeeder` (only `admin@renarvo.com`).
- The frontend has zero mock data; all public, customer, company-dashboard, and admin pages consume the real API.
- Real `/register` page exists for customers; companies sign up via the existing `/register-company` page; `/dashboard` and `/admin` are gated by `ProtectedRoute` against the real session.
- The `/demo` route, `Demo.tsx`, `DemoPill`, `RoleGuard`, `frontend/src/mock/data.ts`, and `frontend/src/lib/adapters.ts` have been deleted.

## Server (Hostinger Business)
- **IP**: see `.tools/server.local` (not committed)
- **SSH port**: see `.tools/server.local`
- **SSH user**: see `.tools/server.local`
- **SSH password**: REDACTED — stored locally in `.tools/server.local` (gitignored). Earlier versions of this file leaked it to the public repo; the user has been told to rotate.
- **Host key (pinned)**: REDACTED — pinned in `.tools/rssh.ps1` (gitignored)
- **PHP**: 8.2.30 at `/usr/bin/php` (default), `/opt/alt/php82/usr/bin/php` (alt-php)
- **Composer**: 2.8.11 at `/usr/local/bin/composer`
- **Node.js**: NOT in PATH by default. Use `/opt/alt/alt-nodejs20/root/usr/bin/{node,npm}` (PATH set inside `deploy/deploy.sh`).
- **Cron CLI**: NOT available — schedule jobs via hPanel → Advanced → Cron Jobs.
- **Domain root**: `~/domains/renarvo.com/public_html/` (also `renarvo-com-462287.hostingersite.com`)
- **App working dir**: `~/renarvo` (git clone of the repo)
- **Database**: SQLite at `~/renarvo/backend/database/renarvo.sqlite`. Migrate to MySQL after first MySQL DB is created in hPanel.

## Architecture on Hostinger
The backend front controller lives at `public_html/_api.php` (NOT a symlinked subfolder), and the root `.htaccess` rewrites `/api/*` to `_api.php`. This keeps Symfony's URI parsing correct so Laravel sees the full `/api/v1/...` path. SPA fallback rewrites everything else to `index.html`.

```
public_html/
├── .htaccess              # SPA fallback + /api/* -> _api.php + HTTPS + caching
├── _api.php               # Laravel front controller (bootstraps from ~/renarvo/backend)
├── index.html             # Vite SPA build
├── assets/                # Vite hashed assets
└── uploads/               # symlink → ~/renarvo/backend/storage/app/public
```

## GitHub
- **Repo**: https://github.com/stockley12/Renarvo (owner: stockley12)
- **Branch**: `main`
- **CI**: `.github/workflows/deploy.yml` is now a CI-only "Build verify" job (frontend `npm ci` + `npm run build` + curl smoke tests against the live site). It does NOT deploy — Hostinger blocks GitHub Actions IPs at the SSH layer.
- **Hostinger SSH public key** registered as Deploy Key id `149730320` (read-only, name `hostinger-prod`) — server can `git pull` over SSH (`git@github.com:stockley12/Renarvo.git`).
- **GitHub Actions deploy keypair** (Ed25519) at:
  - Private: `c:\Users\Anon\Desktop\Renarvo\.tools\gha_deploy_ed25519`
  - Public: `c:\Users\Anon\Desktop\Renarvo\.tools\gha_deploy_ed25519.pub`

## Deployment flow (current, working)
Local dev → push to `main` → ssh to server → run `bash ~/renarvo/deploy/deploy.sh`. The script:

1. `git pull --ff-only` already done by user (or by Hostinger hPanel git auto-deploy if configured)
2. `composer install --no-dev --prefer-dist --optimize-autoloader` in `backend/`
3. Touches sqlite db if missing, runs `php artisan migrate --force`
4. `php artisan config:cache && route:cache && view:cache`
5. `chmod -R 775 storage bootstrap/cache`
6. `npm install --no-audit --no-fund` in `frontend/` (using alt-nodejs20)
7. `VITE_API_BASE_URL=/api/v1 npm run build`
8. `rsync -a --delete` `frontend/dist/` → `public_html/` (excluding `_api.php`, `.htaccess`, `uploads`)
9. Copies `deploy/_api.php` → `public_html/_api.php`
10. Copies `deploy/hostinger.htaccess` → `public_html/.htaccess`
11. Ensures `public_html/uploads` symlink → `backend/storage/app/public`
12. Resets OPcache via curl ping
13. Smoke tests: `/api/v1/health`, `/api/v1/cities` → expect 200

End-to-end run time on server: ~25-30s (npm cached) or ~90s (cold npm install).

### Trigger deployment
**Option A (manual, currently active):** SSH and run the script.
```powershell
& .\.tools\rssh.ps1 -Cmd "cd ~/renarvo && git pull --ff-only origin main && bash deploy/deploy.sh"
```

**Option B (Hostinger hPanel Git auto-deploy):** USER MUST CONFIGURE in hPanel:
1. hPanel → Websites → renarvo.com → Manage → Advanced → Git
2. Connect repo `https://github.com/stockley12/Renarvo` (already deploy-keyed) on branch `main`
3. Repository path: `/home/u273509288/renarvo`
4. Enable auto-deploy on push
5. Post-deploy command (if hPanel exposes it): `bash $HOME/renarvo/deploy/deploy.sh`
6. If hPanel does not expose a post-deploy hook, set up a cron (below) that runs `deploy.sh` after every git pull.

### Required cron jobs (USER MUST ADD via hPanel → Advanced → Cron Jobs)
```
# Laravel scheduler — runs every minute (handles all background work)
* * * * * cd /home/u273509288/renarvo/backend && /usr/bin/php artisan schedule:run >> /dev/null 2>&1

# Optional: auto-redeploy when new commits land on main (every 1 min)
* * * * * cd /home/u273509288/renarvo && (git fetch origin main 2>/dev/null && [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ] && bash deploy/deploy.sh) >> /home/u273509288/renarvo/deploy/deploy-cron.log 2>&1
```

## Hostinger MCP (verified 2026-04-26)
API key configured. Server identifier `user-hostinger-mcp`. Confirmed `renarvo.com` is registered as an addon vhost on `u273509288`, root `/home/u273509288/domains/renarvo.com/public_html`.
- **Useful**: `hosting_listWebsitesV1` (verify hosting state), `domains_*` (DNS/WHOIS), `billing_*` (subscription mgmt).
- **NOT useful for our deploy**: no MySQL DB creation API, no cron management API, no PHP file deploy API. `hosting_deployStaticWebsite` would overwrite our `_api.php` setup, so DO NOT call it. SSH `deploy.sh` remains the canonical path.

## SSH automation helpers (Windows)
- `c:\Users\Anon\Desktop\Renarvo\.tools\rssh.ps1` — runs a bash command on the server via plink
- `c:\Users\Anon\Desktop\Renarvo\.tools\rput.ps1` — uploads a file via pscp
- Usage: `& .\.tools\rssh.ps1 -Cmd 'whoami'`
- plink/pscp installed at `C:\Program Files\PuTTY\`
- Local OpenSSH key path: `C:\Users\Anon\Desktop\Renarvo\.tools\gha_deploy_ed25519`
- Server `~/.ssh/authorized_keys` contains GHA key — passwordless login works.

## Bootstrap account (seeded by `LiveSeeder`)
| Role            | Email                  | Password         |
|-----------------|------------------------|------------------|
| Super admin     | admin@renarvo.com      | `RenarvoTest!1`  |

Rotate the password from the admin panel as soon as you log in. There are **no other seeded accounts** — companies and customers must register through the public flow.

To rebuild a clean DB on the server:
```bash
cd ~/renarvo/backend && php artisan migrate:fresh --force --seed
```

## Open follow-ups (post-launch)
- **(blocking real customers)** Configure SMTP (Hostinger email) — currently `MAIL_MAILER=log`, password resets land in `backend/storage/logs/laravel.log`.
- **(blocking real customers)** Migrate SQLite → MySQL: hPanel → Databases → MySQL Databases → Create DB. Then on server:
  ```bash
  cd ~/renarvo/backend
  cp .env .env.bak
  # edit .env: DB_CONNECTION=mysql, DB_HOST=localhost, DB_DATABASE=..., DB_USERNAME=..., DB_PASSWORD=...
  php artisan migrate:status              # dry-run sanity check
  php artisan migrate:fresh --force --seed
  curl -fsS https://renarvo.com/api/v1/health
  ```
- Rotate SSH password (still leaked-in-history risk on the public repo).
- Rotate the bootstrap superadmin password from the admin panel.
- Configure Stripe / İyzico for real payments (still pay-on-pickup today).
- Add 2FA for company owners and superadmins.
- Set up Cloudflare in front of Hostinger for CDN + DDoS protection.

## Recent changes (2026-04-26)
- Switched front controller from `public_html/api/index.php` symlink → `public_html/_api.php` flat file (fixes Laravel route 404s)
- Updated `deploy/hostinger.htaccess` to rewrite `/api/*` → `_api.php` and force HTTPS via X-Forwarded-Proto
- Added server-side npm build to `deploy/deploy.sh` (uses alt-nodejs20)
- Made `2024_01_01_000024_add_performance_indexes` migration idempotent
- Added `TestUsersSeeder` (admin, company, customer)
- Converted `.github/workflows/deploy.yml` to "Build verify" CI-only (Hostinger blocks GHA IPs)
- Hostinger MCP API key verified working (confirmed site exists)

## Frontend polish pass (2026-04-26 evening, commit `ac2a971`/`b6ba823`)
- **ScrollToTop** component mounted under `<BrowserRouter>` resets scroll on every route change (fixes "page opens at the bottom" issue).
- **Public mobile menu** now auto-closes after navigation; sheet width sized to viewport.
- **Dashboard + admin topbars** wired to the real `useSession()` user and dispatch a real sign-out (`POST /auth/logout` + token clear + redirect to `/login`). Heights/paddings tightened for small screens; sub-`sm` viewports hide the search input.
- **DemoPill** is more compact on mobile and clamped inside the viewport.
- **Real API on public surface** via new `frontend/src/lib/adapters.ts`:
  - `/cars` lists from `GET /api/v1/cars` (mock fallback when seeded inventory is empty).
  - `/cars/:id` reads from `GET /api/v1/cars/:id`.
  - `/book/:id` is fully controlled and posts to `POST /api/v1/me/reservations` with an idempotency key for authenticated customers; falls back to a clearly labeled demo path otherwise.
- **SEO/social**: added `/og-image.svg`, `/sitemap.xml`, tightened `<head>` (canonical, theme-color, og + twitter card with image, alternate locales). `robots.txt` disallows `/admin`, `/dashboard`, `/api/` and references the sitemap.
- **deploy.sh**: now `chmod 0640` on the sqlite db on every deploy.

### QA gate re-run after polish (2026-04-26)
- All 27 auth + flow checks PASS (login/me/refresh/logout for all three roles, customer reservation create + idempotency, company overview / fleet / reservations + cross-tenant isolation 404, all admin endpoints, cleanup cancel).
- All public smoke endpoints 200: `/`, `/api/v1/health`, `/api/v1/cities`, `/api/v1/cars`, `/og-image.svg`, `/sitemap.xml`, `/robots.txt`.
- Sensitive paths blocked: `/.env` → 403, `/composer.json` → 403.
- Security headers present on `/`: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP `upgrade-insecure-requests`.

## Go-live cutover (2026-04-27)
- Backend seeders rewritten: `DemoSeeder` and `TestUsersSeeder` deleted; `LiveSeeder` plants only `admin@renarvo.com`.
- Public pages (Home, Cars, Car detail, Companies, Company detail, Booking, SearchWidget) consume the API directly; no `mock/data.ts` or `adapters.ts` is left.
- Company dashboard fully wired (Overview, Fleet+image upload, Reservations lifecycle, Calendar, Pricing+Promos, Branches, Staff, Reviews, Payouts, Documents, Messages, Statistics, Settings).
- Admin panel fully wired (Overview, Companies, Approvals, Catalog, Reservations, Users, Reviews, Risk, Notifications, Audit log, Finance, System health, Settings).
- New `ProtectedRoute` gate on `/dashboard` (company_owner/company_staff) and `/admin` (superadmin); unauthenticated visits redirect to `/login?next=...`.
- New customer `/register` page; `/demo` redirects to `/`.
- API client now correctly preserves `{data, meta}` paginated payloads so dashboards render real totals.

### QA test scripts after go-live
- `.tools/qa_auth.ps1` — registers an ephemeral customer + company per run (LiveSeeder no longer seeds those), then runs the original 27 auth/flow checks (the one cross-tenant probe now hits a deliberately bogus car id).
- `.tools/qa_live.ps1` — 10-step end-to-end go-live test: anonymous tour → `register-company` → admin approves → company adds car → public listing/detail show it → customer registers → customer books → confirm/pickup/return lifecycle → customer review → admin sees audit + reservation.

### Final go-live regression (2026-04-27, after MySQL-prep + deploy)
- `qa_auth.ps1`: **29 PASS / 0 FAIL / 1 cosmetic WARN** (cleanup cancel hit a per-IP rate limit after the burst — purely test plumbing, the underlying logout/cancel paths are exercised earlier).
- `qa_live.ps1`: **17/17 PASS** end-to-end (anonymous → company register → admin approve → fleet → public listing → customer register → booking → confirm/pickup/return → review → admin audit + reservations).
- Bug fixed during the run: `User::token_version` defaulted to `null` in memory after `Model::create`, so JWTs issued at registration carried `tv:null` and were rejected on the next request (401 UNAUTHENTICATED). Fix: declared `protected $attributes = ['token_version' => 0, 'status' => 'active']` plus an integer cast on the `User` model, and made `JwtService::validateAccessToken` coerce nullish `tv` on either side to `0` for back-compat. Commit `5796656`.

### Rent / Pay / TIKO regression (2026-05-01, commit `6d5562c`)
- Deploy: `git pull origin main && bash deploy/deploy.sh` ran clean. Six new migrations applied (`extend_companies_table`, `extend_cars_table`, `create_company_extras_table`, `create_insurance_packages_table`, `extend_reservations_for_payment`, `extend_payments_for_tiko`). `npm run build` produced a separate `CarsMap` chunk (lazy). Smoke `/api/v1/health` and `/api/v1/cities` → 200.
- `qa_auth.ps1`: **29 PASS / 0 FAIL** (same 1 cosmetic WARN as before — cleanup-after-logout).
- `qa_live.ps1`: **17/17 PASS**.
- `qa_payment.ps1` (new, see `.tools/qa_payment.ps1`): **10/10 PASS** in `mode=disabled` branch:
  - `/payments/tiko/config` returns `mode=disabled enabled=false currency=TRY`.
  - End-to-end company → admin approve → fleet → customer → reservation → checkout returns the expected `503 TIKO_DISABLED`, reservation stays `payment_status=unpaid`, `/admin/reservations` shows it. Once `TIKO_MERCHANT_ID/SECRET/PASSWORD` are filled in `.env` and `TIKO_MODE=sandbox`, the same script branches into the iframe-issued / `pending` / `/admin/payments` checks automatically.
- Production DB after the run: `purge-qa.sh` removed all `qa-*@renarvo-test.local` users (10), `QA *` companies (7), and orphaned cars/reservations. `users` table now contains only `admin@renarvo.com`; `companies` is empty. Rate-limiter buckets cleared.
- Note on rate-limiter during back-to-back runs: `RateLimiterService` writes to the `rate_limit_buckets` SQLite table (NOT the cache), so `php artisan cache:clear` does not reset login throttles. To unblock a stuck QA loop on the same IP, run `sqlite3 ~/renarvo/backend/database/renarvo.sqlite 'DELETE FROM rate_limit_buckets;'`.

## Open follow-ups summary (post-launch, in order)
1. **(blocking real customers)** Provide MySQL credentials → flip `backend/.env` → `php artisan migrate:fresh --force --seed` (todo `a-server-flip` is still pending until creds are available).
2. **(blocking real customers)** Configure SMTP — currently `MAIL_MAILER=log`.
3. Rotate SSH password (leaked-in-history risk on the public repo).
4. Rotate the bootstrap superadmin password from the admin panel.
5. Real payments — TIKO Sanal POS scaffolding is shipped, deployed and regression-tested in `mode=disabled` (Phase 10/11/15, see `qa_payment.ps1`). Awaiting the user-supplied `TIKO_MERCHANT_ID`, `TIKO_SECRET`, `TIKO_PASSWORD` to flip `TIKO_MODE=sandbox` on the server and re-run `qa_payment.ps1` to assert iframe-issued / pending → paid via the bank-driven 3DS leg.
6. 2FA for company owners and superadmins.
7. Cloudflare in front of Hostinger (see runbook below).
8. Hostinger mailbox `info@renarvo.com` (see runbook below).

## TIKO Sanal POS runbook
- **Spec implemented**: v1.1.3 `onus3D` 3DS iframe flow + status query + cancel.
- **Backend service**: `app/Services/TikoService.php` (HMAC-SHA256(secret, hashStr.password), base64).
- **Backend controller**: `app/Http/Controllers/Payment/TikoController.php` exposes:
  - `POST  /api/v1/me/reservations/{id}/checkout/tiko` — authenticated customer mints a fresh Payment row + iframe URL.
  - `POST  /api/v1/payments/tiko/callback` — public, hash-verified, IP-allowlist if `TIKO_CALLBACK_IPS` set.
  - `GET|POST /api/v1/payments/tiko/return-ok` and `/return-fail` — browser bounce; triggers an immediate status-query then redirects to the SPA `/payment/result`.
  - `GET   /api/v1/payments/tiko/config` — public, advertises `mode` so the SPA hides the pay button when disabled.
- **Reconcile**: `php artisan tiko:reconcile --minutes=15` runs every 5 min via `routes/console.php`.
- **Audit**: every TIKO interaction is logged via `AuditService` (`tiko.checkout.initiated`, `.callback.processed`, `.callback.rejected_hash`, `.callback.rejected_ip`, `.status.queried`, `.cancel.requested`).
- **Schema**: `payments` extended with `order_id`, `trans_id`, `amount_try`, `installment`, `hash_inbound_ok`, `error_msg`, `raw_request`, `raw_response`, `raw_callback`, `raw_status_query`. `reservations` extended with `payment_status`, `current_payment_id`, `insurance_package_id`, `insurance_price`, `deposit_amount_snapshot`.
- **Env vars to fill on server before activation**:
  ```
  TIKO_MODE=sandbox            # disabled | sandbox | live
  TIKO_MERCHANT_ID=<from TIKO>
  TIKO_SECRET=<from TIKO>
  TIKO_PASSWORD=<from TIKO>
  TIKO_RETURN_OK=https://renarvo.com/api/v1/payments/tiko/return-ok
  TIKO_RETURN_FAIL=https://renarvo.com/api/v1/payments/tiko/return-fail
  TIKO_CALLBACK=https://renarvo.com/api/v1/payments/tiko/callback
  TIKO_CALLBACK_IPS=                # optional comma-separated allowlist
  ```
- **Frontend**: `useTikoConfig`/`useTikoCheckout` (`frontend/src/lib/hooks/useTiko.ts`). Booking step "Payment" opens a Radix `Dialog` with the TIKO iframe; closing it sends the customer to `/payment/result?reservation=…&order=…` which polls `GET /me/reservations/{id}` until `payment_status` is `paid`/`failed`/`cancelled`.

## Cloudflare onboarding (USER ACTION)
Must be done manually in the Cloudflare dashboard once we're ready to flip DNS — code change isn't required, but the steps must be followed in order to avoid downtime.

1. **Add site**: Cloudflare → Add site → `renarvo.com` → Free plan → Continue.
2. **Import DNS**: accept the auto-import. Verify `A renarvo.com → <hostinger-ip>` and `CNAME www → renarvo.com` exist.
3. **Update nameservers at the registrar** (Hostinger or wherever the domain is held) to the two NS records Cloudflare assigns. Wait for propagation (status flips to "Active" in Cloudflare). Hostinger continues to serve traffic during this window.
4. **Proxy status**: in DNS tab, set the orange cloud (proxied) on `renarvo.com` and `www`. Set DNS-only (grey cloud) on any mail records (`MX`, `mail.`) so mail still works.
5. **SSL/TLS** → set mode to **Full (strict)** (Hostinger already serves a valid Let's Encrypt cert).
6. **Edge Certificates** → enable **Always Use HTTPS** + **Automatic HTTPS Rewrites** + minimum TLS 1.2.
7. **Speed → Optimization**: enable Brotli, Auto Minify (HTML/CSS/JS), Rocket Loader OFF (breaks our SPA rehydration in some cases).
8. **Caching → Configuration**: Browser TTL = "Respect existing headers", set a Page Rule (or Cache Rule) `*renarvo.com/api/*` → cache level **Bypass**.
9. **Security → Bots → Bot Fight Mode**: ON.
10. **Security → WAF → Custom rules**:
    - Rule "Allow TIKO callback": URI Path `eq` `/api/v1/payments/tiko/callback` → Action **Skip** (skip Bot Fight + managed challenges + rate-limit). When TIKO confirms its callback IPs, also tighten by `(ip.src in {…})`.
    - Rule "Always-allow `/api/*`": URI Path `wildcard` `/api/*` → Action **Skip** Bot Fight Mode. (Bot Fight throws JS challenges that break server-to-server callbacks.)
11. **Security → DDoS** + **Rate Limiting**: leave defaults; we already do per-IP throttling at the Laravel layer (`RateLimiterService`).
12. **Verify** end-to-end: `curl -fsS https://renarvo.com/api/v1/health` and `curl -fsS https://renarvo.com/api/v1/payments/tiko/config` from outside the network — both must return 200 with `cf-ray:` headers present.

## Hostinger mailbox `info@renarvo.com` (USER ACTION)
1. hPanel → Emails → Email Accounts → **Create Email Account**.
2. Mailbox: `info@renarvo.com`. Set a strong password and store in `.tools/server.local` (gitignored).
3. **Quota**: 1 GB is plenty for go-live; can be raised later.
4. Once created, hPanel → Email Accounts → Settings → **Configure SMTP** to copy the SMTP host/port/credentials.
5. On the server, edit `backend/.env`:
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=<from hPanel, usually smtp.hostinger.com>
   MAIL_PORT=465
   MAIL_USERNAME=info@renarvo.com
   MAIL_PASSWORD=<set above>
   MAIL_ENCRYPTION=ssl
   MAIL_FROM_ADDRESS="info@renarvo.com"
   MAIL_FROM_NAME="Renarvo"
   ```
6. `php artisan config:cache && php artisan tinker --execute="Mail::raw('hi','admin@renarvo.com');"` to confirm the first send.
7. Update Cloudflare DNS only if needed: keep the existing `MX` records pointing at Hostinger (do NOT proxy them through Cloudflare).
