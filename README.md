# Neowise Landing Page

Static Neowise website with a private beta acquisition flow and lightweight Node/Express backend for beta requests.

## Local frontend test

From the project root:

```bash
python3 -m http.server 8080
```

Open:

```txt
http://localhost:8080/
http://localhost:8080/beta/
```

## Backend beta API

```bash
cd backend
npm install
npm run dev
```

The frontend posts beta requests to:

```txt
http://localhost:8787/api/beta-request   # local development (localhost)
/api/beta-request                          # production on www.neowise.ai (reverse proxy)
```

On production, configure your web server to proxy `/api/beta-request` to the Node backend. The frontend picks the correct URL automatically; override with `window.NEOWISE_BETA_API_URL` only if needed.

## Admin/export endpoints

Local examples:

```bash
curl "http://localhost:8787/api/admin/beta-requests?token=dev-admin-token"
curl -o beta-requests.csv "http://localhost:8787/api/admin/beta-requests.csv?token=dev-admin-token"
curl "http://localhost:8787/api/admin/stats?token=dev-admin-token"
```

## Environment variables

See `backend/.env.example`.

Important production values:

```env
PORT=8787
NODE_ENV=production
FRONTEND_ORIGIN=https://www.neowise.ai,https://neowise.ai
IP_HASH_SALT=replace-with-long-random-secret
ADMIN_TOKEN=replace-with-long-random-admin-token
```

## Creating production ZIP

Use:

```bash
scripts/create-production-zip.sh
```

The package is created at:

```txt
dist/neowise-production.zip
```

## What not to commit or upload publicly

- Do not commit `backend/data/beta-requests.json`.
- Do not upload `.env` files.
- Do not upload `node_modules/`.
- Do not expose `backend/data/` publicly.
- Use `scripts/create-production-zip.sh` for the final package.
