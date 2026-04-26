# Renarvo Runbook

Owner: Founder. Last updated: 2026-04-26.

## Production environment

| Concern | Value |
| --- | --- |
| Hosting | Hostinger Business shared (Apache + PHP 8.2 + MySQL 8) |
| Domain | https://renarvo.com (frontend + `/api`) |
| DB | hPanel-managed MySQL 8 |
| Storage | Local disk (`storage/app/uploads`, `storage/app/documents`) |
| CDN | Cloudflare (free tier) in front of `renarvo.com` |
| Monitoring | UptimeRobot (`/api/v1/health` every 5 min), Sentry (errors) |
| Email | Hostinger SMTP (notifications) |
| Backups | GitHub Actions daily mysqldump (`.github/workflows/backup.yml`) |

## Common operations

### Deploy
1. Push to `main`. GitHub Actions runs `deploy.yml`, SSHes to Hostinger, executes `deploy/deploy.sh`.
2. `deploy.sh` pulls, installs Composer deps, runs migrations, rebuilds the frontend, syncs static assets.
3. Health check post-deploy: `curl -fsS https://renarvo.com/api/v1/health | jq`.

### Rollback
1. `ssh user@renarvo.com 'cd ~/renarvo && git log --oneline -10'`.
2. `git checkout <previous-sha>`.
3. Re-run `deploy/deploy.sh`.

### Restore database
1. Download last backup artifact from GitHub Actions `backup` workflow.
2. `mysql -u user -p renarvo < backup-YYYY-MM-DD.sql` on the target environment.

### Cron health
- Cron ENTRIES live in hPanel Advanced > Cron Jobs.
- Key entries (every minute): `php ~/renarvo/backend/artisan schedule:run`.
- Monitor stalled jobs via Admin > System Health (`jobs.failed_7d`).

### Incident playbook
1. Identify scope: open Sentry, check `/api/v1/health`, check Admin > System Health.
2. If DB outage: enable static maintenance page in `public_html/maintenance.html` (rename existing `index.html`).
3. If filesystem full: rotate logs (`renarvo:rotate-logs --keep=7`), purge `storage/framework/cache`.
4. If CSP / CORS misconfig: temporarily widen `ALLOWED_ORIGINS` in `.env`, run `php artisan config:cache`.
5. Contact Hostinger support for infrastructure-level issues.

## Demo accounts (staging only)

| Role | Email | Notes |
| --- | --- | --- |
| superadmin | admin@renarvo.com | Full panel access |
| company_owner (Auras Rental) | owner@auras.com | Approved company |
| company_owner (Pegasus Rental) | owner@pegasus.com | Approved company |
| customer | mehmet@example.com | Has multiple reservations |
| customer | jane@example.com | New customer, no reservations |

Default password for all demo accounts in non-production: `demo1234`.
