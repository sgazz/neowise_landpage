# Neowise Beta Backend Deployment Notes

## Environment variables

Example production environment:

```env
PORT=8787
NODE_ENV=production
FRONTEND_ORIGIN=https://www.neowise.ai,https://neowise.ai
IP_HASH_SALT=replace-with-long-random-secret
ADMIN_TOKEN=replace-with-long-random-admin-token
```

Set environment variables through your hosting provider. If using a cPanel Node.js app, set them in
the cPanel interface. If using a VPS, set them in the process manager or service unit.

## Local test

```bash
cd backend
npm install
npm run check
npm run dev
```

Then test:

```bash
curl http://localhost:8787/api/health
curl "http://localhost:8787/api/admin/stats?token=dev-admin-token"
```

## Production process options

- On cPanel, run this as a Node.js application outside the public static website folder if possible.
- On a VPS, run with `pm2` or `systemd`.
- Keep logs and restart behavior managed by the platform/process manager.

## Reverse proxy note

The public frontend should call only `/api/beta-request` through a reverse proxy or API subdomain.
Examples:

- `https://www.neowise.ai/api/beta-request`
- `https://api.neowise.ai/api/beta-request`

Admin endpoints should not be linked from the public site.

## Data storage note

`backend/data/beta-requests.json` must not be public web-accessible.

The backend should run outside `public_html` if possible. If it must be near the public website,
ensure the server does not expose `backend/data/` as static files.

JSON file storage is acceptable for early beta testing, but should be migrated to a managed database
before production scale.

## Backups

- Back up `backend/data/beta-requests.json` regularly.
- Store backups outside the public web root.
- Consider encrypting backups if they contain personal data.

## Security checklist

- Set `NODE_ENV=production`.
- Set a long random `IP_HASH_SALT`.
- Set a long random `ADMIN_TOKEN`.
- Restrict `FRONTEND_ORIGIN` to production domains.
- Serve the backend over HTTPS.
- Keep `backend/data/` private.
- Monitor rate limits and server logs.
- Rotate tokens if they are exposed.
