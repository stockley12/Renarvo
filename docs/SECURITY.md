# Renarvo Security Audit Checklist

This document captures the security baseline that must be re-verified before every
production deploy. Tick each item off in your release notes.

## Identity & access
- [ ] JWT access tokens are kept in memory only on the frontend (`tokenStore`).
- [ ] Refresh tokens are httpOnly + Secure + SameSite=Lax cookies, scoped to `/api/v1/auth/refresh`.
- [ ] `users.token_version` is bumped on logout, password reset, ban, and staff removal.
- [ ] Refresh-token rotation: every successful `/auth/refresh` revokes the prior token row.
- [ ] Login + refresh + register endpoints rate-limited via `throttle.api` (MySQL bucket).
- [ ] Password hashing uses Laravel's bcrypt with cost ≥ 12.
- [ ] Email verification required before company owner can publish cars.

## Multi-tenancy
- [ ] Every tenant-scoped model uses `BelongsToCompany` trait + `CompanyScope` global scope.
- [ ] Company controllers explicitly call `TenantContext::set($companyId)` before queries.
- [ ] Admin controllers explicitly call `TenantContext::clear()` to opt-out of scoping.
- [ ] Tenant isolation regression tests pass (`TenantIsolationTest`).

## Input handling
- [ ] All endpoints reject unexpected fields via FormRequest validation rules.
- [ ] Eloquent / query builder used everywhere (no raw `DB::statement` with user input).
- [ ] File uploads pass MIME, size, and dimension validation; stored outside webroot.
- [ ] Image uploads re-encoded via Intervention Image (strips EXIF + GPS).
- [ ] Idempotency-Key required for `POST /me/reservations` and webhook ingestion.

## Output handling
- [ ] All API responses go through Laravel JSON resources (no model leak of `password_hash`, `token_version`, `metadata`).
- [ ] Error envelope matches `{ error: { code, message, details? } }` with sanitized messages.
- [ ] CORS allowlist (`config/cors.php`) only contains production + staging frontends.
- [ ] HSTS header active in production (`Strict-Transport-Security: max-age=31536000`).
- [ ] CSP header configured for the SPA (frame-ancestors 'none', default-src 'self').

## Data protection / KVKK & GDPR
- [ ] Privacy policy & T&C versions match the values logged in `consent_logs`.
- [ ] `/api/v1/me/data-export-request` returns within 7 days.
- [ ] `/api/v1/me/erase` pseudonymises PII and revokes all sessions.
- [ ] `purge-audit-log` cron retains 365 days; longer retention requires legal review.
- [ ] Backups encrypted at rest; access limited to the founder's GitHub Actions secret.

## Operational
- [ ] `.env` lives outside `public_html` (in `~/private/`); file mode 600.
- [ ] `composer install --no-dev --optimize-autoloader` on every deploy.
- [ ] OPcache enabled in production; `opcache_reset` triggered post-deploy.
- [ ] All cron entries from `routes/console.php` registered in hPanel.
- [ ] `health` endpoint monitored from UptimeRobot every 5 minutes.
- [ ] Sentry DSN set; sample rate 1.0 for errors, 0.1 for transactions.

## Incident response
- [ ] Backup workflow (`.github/workflows/backup.yml`) ran successfully in the last 24h.
- [ ] DB rollback runbook tested (mysqldump → import on staging).
- [ ] On-call email + phone documented in `docs/RUNBOOK.md`.
