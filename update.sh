#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
APP_ROOT="Chinyadak"
BRANCH="marketplace-rtl-phase1"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"

export PATH="$NODE_BIN:$PATH"
export RAYON_NUM_THREADS=1
export UV_THREADPOOL_SIZE=1

cd "$APP_DIR"

echo "== Chinyadak one-step update =="

SELECTOR=""
if command -v cloudlinux-selector >/dev/null 2>&1; then
  SELECTOR="$(command -v cloudlinux-selector)"
elif [[ -x /usr/sbin/cloudlinux-selector ]]; then
  SELECTOR="/usr/sbin/cloudlinux-selector"
fi

APP_STOPPED=0
if [[ -n "$SELECTOR" ]]; then
  echo "[0/6] Stop Node application"
  if "$SELECTOR" stop --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
    APP_STOPPED=1
  else
    echo "Node selector stop was skipped; continuing with low-resource update."
  fi
else
  echo "[0/6] CloudLinux selector unavailable - using Passenger restart fallback"
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

echo "[1/6] Pull latest code"
git pull --ff-only origin "$BRANCH"

mkdir -p tmp

# Install dependencies only when package metadata changed or node_modules is absent.
PKG_SIG="$(cksum package.json)"
LAST_SIG=""
if [[ -f tmp/.package-signature ]]; then
  IFS= read -r LAST_SIG < tmp/.package-signature || true
fi

if [[ ! -d node_modules || "$PKG_SIG" != "$LAST_SIG" ]]; then
  echo "[2/6] Install dependencies"
  npm install --no-audit --no-fund --package-lock=false
  printf '%s\n' "$PKG_SIG" > tmp/.package-signature
else
  echo "[2/6] Dependencies unchanged - skipped"
fi

echo "[3/6] Apply safe database migrations"
npm run db:init

echo "[4/6] Production build (low resource mode)"
RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 npm run build

echo "[5/6] Restart application"
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
    "$SELECTOR" restart --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  fi
fi

# Passenger fallback and cache-busting restart trigger.
mkdir -p tmp
: > tmp/restart.txt

trap - ERR

echo "[6/6] Done"
echo "UPDATE_OK"
echo "Commit: $(git rev-parse --short HEAD)"
