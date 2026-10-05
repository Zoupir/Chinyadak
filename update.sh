#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
APP_ROOT="Chinyadak"
BRANCH="marketplace-rtl-phase1"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"

export PATH="$NODE_BIN:$PATH"
export GOMAXPROCS=1
export RAYON_NUM_THREADS=1
export UV_THREADPOOL_SIZE=1

cd "$APP_DIR"

echo "== Site one-step update =="

SELECTOR=""
if command -v cloudlinux-selector >/dev/null 2>&1; then
  SELECTOR="$(command -v cloudlinux-selector)"
elif [[ -x /usr/sbin/cloudlinux-selector ]]; then
  SELECTOR="/usr/sbin/cloudlinux-selector"
fi

APP_STOPPED=0
if [[ -n "$SELECTOR" ]]; then
  echo "[0/9] Stop Node application"
  if "$SELECTOR" stop --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
    APP_STOPPED=1
  else
    echo "Node selector stop was skipped; continuing with low-resource update."
  fi
else
  echo "[0/9] CloudLinux selector unavailable - using Passenger restart fallback"
fi

restore_app_on_error() {
  if [[ "$APP_STOPPED" == "1" && -n "$SELECTOR" ]]; then
    "$SELECTOR" start --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  fi
}
trap restore_app_on_error ERR

# Never overwrite tracked local edits.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: tracked local changes exist. Update cancelled."
  exit 1
fi

echo "[1/9] Pull latest code"
git pull --ff-only origin "$BRANCH"

mkdir -p tmp

# Install dependencies only when package metadata changed or node_modules is absent.
PKG_SIG="$(cksum package.json)"
LAST_SIG=""
if [[ -f tmp/.package-signature ]]; then
  IFS= read -r LAST_SIG < tmp/.package-signature || true
fi

if [[ ! -d node_modules || "$PKG_SIG" != "$LAST_SIG" ]]; then
  echo "[2/9] Install dependencies"
  npm install --no-audit --no-fund --package-lock=false
  printf '%s\n' "$PKG_SIG" > tmp/.package-signature
else
  echo "[2/9] Dependencies unchanged - skipped"
fi

echo "[3/9] Apply safe database migrations"
npm run db:init
echo "[4/9] Upgrade the 12-part category taxonomy"
./node_modules/.bin/tsx scripts/seed-categories.ts
echo "[5/9] Add real default vehicle and manufacturer data"
./node_modules/.bin/tsx scripts/seed-real-defaults.ts
echo "[6/9] Import Lucano L8 OEM reference data (not sellable stock)"
./node_modules/.bin/tsx scripts/seed-lucano-l8-reference.ts

echo "[7/9] Production build (low resource mode)"
RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 npm run build

echo "[8/9] Restart application"
if [[ -n "$SELECTOR" ]]; then
  if [[ "$APP_STOPPED" == "1" ]]; then
    if "$SELECTOR" start --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    elif "$SELECTOR" restart --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    else
      echo "ERROR: build succeeded but CloudLinux could not start the Node application."
      exit 1
    fi
  else
    if "$SELECTOR" restart --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    elif "$SELECTOR" start --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    else
      echo "ERROR: build succeeded but CloudLinux could not start or restart the Node application."
      exit 1
    fi
  fi
fi

# Passenger fallback and cache-busting restart trigger.
mkdir -p tmp
: > tmp/restart.txt

trap - ERR

echo "[9/9] Done"
echo "UPDATE_OK"
echo "Commit: $(git rev-parse --short HEAD)"
