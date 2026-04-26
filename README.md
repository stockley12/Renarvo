# Renarvo

North Cyprus car rental marketplace. Multi-tenant, three surfaces (public site, company dashboard, superadmin panel), PHP/Laravel API + React/Vite SPA, deployed to Hostinger Business shared hosting.

## Repo layout

```
renarvo/
├── frontend/        # React + Vite + TypeScript SPA (existing UI)
├── backend/         # Laravel 11 API
├── deploy/          # Hostinger deploy scripts and .htaccess templates
└── .github/workflows/
```

## Local development

### Backend

```
cd backend
cp .env.example .env
php artisan key:generate
php -r "echo bin2hex(random_bytes(32));" > /tmp/jwt && echo "JWT_SECRET=$(cat /tmp/jwt)" >> .env
php artisan migrate --seed
php artisan serve
```

API at `http://localhost:8000/api/v1/health`.

### Frontend

```
cd frontend
npm install
npm run dev
```

SPA at `http://localhost:8080`.

## Deployment

`main` branch auto-deploys to Hostinger via `deploy/deploy.sh`. See plan `Section 10` for SSH setup and required GitHub secrets.

## Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Superadmin | `admin@renarvo.com` | `password` |
| Company owner | `owner@kyrenia.com` | `password` |
| Customer | `customer@example.com` | `password` |
