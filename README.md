# SVR Document Management System

Full-stack, single-owner vehicle document management built with React, Django REST Framework, JWT, and PostgreSQL.

## Included

- Dashboard statistics, charts, notifications, and recent activity
- Vehicle, buyer, seller, transaction, and document CRUD
- JWT owner-only authentication with no registration endpoint
- Authenticated PDF/JPG/PNG upload, preview, and download
- Global search, Web Speech API voice input, and local smart-query matching
- Insurance expiry and missing RC/NOC notifications
- PDF and Excel reports
- Business settings, password change, JSON backup, and restore
- Responsive Bootstrap 5 interface with a dark blue glass-style design
- Docker deployment with PostgreSQL, Gunicorn, and Nginx

## Local Development

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
$env:SVR_OWNER_PASSWORD="use-a-strong-password"
python manage.py createowner
python manage.py runserver
```

Without PostgreSQL environment variables, local development uses SQLite. Production uses PostgreSQL.

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`.

## Docker Deployment

1. Copy `.env.example` to `.env`.
2. Replace every secret and set the public host/origin values.
3. Behind a TLS reverse proxy, set `SECURE_SSL_REDIRECT=True` and `SECURE_HSTS_SECONDS=31536000`.
4. Start the stack:

```powershell
docker compose up --build -d
```

The backend startup applies migrations and creates or updates the one owner account. `createowner` refuses to proceed if a different superuser already exists.

## Production Notes

- Terminate HTTPS at a trusted load balancer or reverse proxy.
- Back up both the PostgreSQL volume and `document_files`; JSON backup contains database records, not uploaded file bytes.
- Store `.env` in a secrets manager and rotate JWT/Django secrets when compromised.
- Restrict database and backend ports to the private network.
- Use object storage with private signed access for multi-instance deployments.
- Run `python manage.py check --deploy`, `python manage.py test`, and `npm run build` in CI.

## API

The API lives under `/api/`. Primary routes:

- `POST /api/auth/login/`, `POST /api/auth/refresh/`
- `/api/vehicles/`, `/api/parties/`, `/api/documents/`, `/api/transactions/`
- `GET /api/dashboard/`, `GET /api/search/?q=...`, `POST /api/smart-search/`
- `GET|PUT /api/settings/`, `POST /api/settings/change-password/`
- `/api/reports/{vehicles|documents|transactions}/{pdf|excel}/`
- `GET /api/backup/`, `POST /api/restore/`
