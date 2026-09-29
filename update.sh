#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
BRANCH="marketplace-rtl-phase1"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"

export PATH="$NODE_BIN:$PATH"
export RAYON_NUM_THREADS=1
export UV_THREADPOOL_SIZE=1
export VITE_CONFIG_NATIVE_IGNORE_WARNING=true

cd "$APP_DIR"

echo "== Chinyadak one-step update =="

# Do not overwrite tracked local edits.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: tracked local changes exist. Update cancelled."
  exit 1
fi

echo "[1/5] Pull latest code"
git pull --ff-only origin "$BRANCH"

mkdir -p tmp

# Install dependencies only when package.json changed or node_modules is missing.
PKG_SIG="$(cksum package.json)"
LAST_SIG=""
if [[ -f tmp/.package-signature ]]; then
  IFS= read -r LAST_SIG < tmp/.package-signature || true
fi

if [[ ! -d node_modules || "$PKG_SIG" != "$LAST_SIG" ]]; then
  echo "[2/5] Install dependencies"
  npm install --no-audit --no-fund --package-lock=false
  printf '%s\n' "$PKG_SIG" > tmp/.package-signature
else
  echo "[2/5] Dependencies unchanged - skipped"
fi

echo "[3/5] Apply safe database migrations"
npm run db:init

echo "[4/5] Production build (low resource mode)"
RAYON_NUM_THREADS=1 npm run build

echo "[5/5] Restart application"
: > tmp/restart.txt

echo "UPDATE_OK"
echo "Commit: $(git rev-parse --short HEAD)"
