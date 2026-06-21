#!/usr/bin/env bash
set -eu

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: zip command is not installed. Please install zip and try again." >&2
  exit 1
fi

mkdir -p dist
rm -f dist/neowise-production.zip

zip -r dist/neowise-production.zip . \
  -x '.git/*' \
  -x '.DS_Store' \
  -x '*/.DS_Store' \
  -x '__MACOSX/*' \
  -x 'node_modules/*' \
  -x 'backend/node_modules/*' \
  -x 'backend/data/beta-requests.json' \
  -x 'backend/data/backups/*' \
  -x 'backend/logs/*' \
  -x '.env' \
  -x '.env.*' \
  -x 'backend/.env' \
  -x 'backend/.env.*' \
  -x 'dist/*' \
  -x '*.zip' \
  -x '/tmp/*'

echo "Created dist/neowise-production.zip"
