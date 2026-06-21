# Neowise Beta Backend

Small Node.js + Express backend for collecting private beta requests.

## Install

```bash
cd backend
npm install
```

## Configure

Copy the example environment file and adjust values:

```bash
cp .env.example .env
```

Environment variables:

- `PORT` defaults to `8787`
- `FRONTEND_ORIGIN` defaults to `*`
- `IP_HASH_SALT` should be changed before production
- `ADMIN_TOKEN` defaults to `dev-admin-token` in development

## Production environment variables

Use strong production values before deployment:

```env
PORT=8787
NODE_ENV=production
FRONTEND_ORIGIN=https://www.neowise.ai,https://neowise.ai
IP_HASH_SALT=replace-with-long-random-secret
ADMIN_TOKEN=replace-with-long-random-admin-token
```

## Run Locally

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:8787/api/health
```

## Frontend API Configuration

The static frontend defaults to:

```txt
http://localhost:8787/api/beta-request
```

For production, set the API URL before loading `js/main.js`:

```html
<script>
  window.NEOWISE_BETA_API_URL = "https://api.neowise.ai/api/beta-request";
</script>
<script src="js/main.js" defer></script>
```

## Example Beta Request

```bash
curl -X POST http://localhost:8787/api/beta-request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Learner",
    "email": "learner@example.com",
    "role": "University student",
    "goal": "Exam preparation",
    "source": "beta-page",
    "consent": true,
    "utm_source": "",
    "utm_medium": "",
    "utm_campaign": ""
  }'
```

Submissions are stored in:

```txt
backend/data/beta-requests.json
```

## Test With The Static Site

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

Terminal 2, from the project root:

```bash
python3 -m http.server 8080
```

Open:

```txt
http://localhost:8080/
http://localhost:8080/beta/
```

Submit a beta form and confirm that `backend/data/beta-requests.json` receives the record.

## Hardening notes

- The backend creates `backend/data/`, `backend/logs/`, and `backend/data/beta-requests.json`
  automatically if needed.
- Requests are logged with timestamp, method, path, status, and duration only.
- Request bodies, email addresses, and raw IP addresses are not logged.
- Raw IP addresses are not stored. Only salted SHA-256 IP hashes are stored.
- `FRONTEND_ORIGIN` supports either `*` or a comma-separated allowlist.
- In production, avoid `FRONTEND_ORIGIN=*`.
- Admin/export endpoints require `ADMIN_TOKEN`.

## Git safety

- Do not commit real beta request data.
- `backend/data/beta-requests.json` is intentionally ignored.
- Keep `backend/data/.gitkeep` so the folder exists in the repository.
- Do not commit `.env` files.
- Keep `backend/.env.example` committed as documentation only.

## Admin/export endpoints

Admin endpoints require an admin token. For local testing, use the development fallback token if
`ADMIN_TOKEN` is not set.

JSON list:

```bash
curl "http://localhost:8787/api/admin/beta-requests?token=dev-admin-token"
```

CSV export:

```bash
curl -o beta-requests.csv "http://localhost:8787/api/admin/beta-requests.csv?token=dev-admin-token"
```

Stats:

```bash
curl "http://localhost:8787/api/admin/stats?token=dev-admin-token"
```

## Deployment Notes

- Set a strong `IP_HASH_SALT` in production.
- Set a strong `ADMIN_TOKEN` in production.
- Set `FRONTEND_ORIGIN` to the deployed website origin.
- Move storage to a managed database before production scale.
- Keep `beta-requests.json` out of public hosting paths.
- Add HTTPS, process monitoring, backups, and provider-level rate limiting when deployed.
- See `deploy.example.md` for more deployment notes.
