#!/bin/sh
# docker-start.sh - Apply pending Prisma migrations, then start the server
set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy

echo "==> Starting ERP backend server..."
exec node dist/server.js
