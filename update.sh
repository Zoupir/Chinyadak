#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
APP_ROOT="Chinyadak"
BRANCH="marketplace-rtl-phase1"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"
DEPLOY_TAG="marketplace-rtl-phase1-builds"
DEPLOY_ASSET="chinyadak-build.tar.gz"
DEPLOY_URL="https://github.com/Zoupir/Chinyadak/releases/download/${DEPLOY_TAG}/${DEPLOY_ASSET}"

export PATH="$NODE_BIN:$PATH"
export GOMAXPROCS=1
export RAYON_NUM_THREADS=1
export UV_THREADPOOL_SIZE=1

cd "$APP_DIR"
mkdir -p tmp

echo "== Site one-step update =="
echo "[0/9] Preflight"

SELECTOR=""
if command -v cloudlinux-selector >/dev/null 2>&1; then
  SELECTOR="$(command -v cloudlinux-selector)"
elif [[ -x /usr/sbin/cloudlinux-selector ]]; then
  SELECTOR="/usr/sbin/cloudlinux-selector"
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required to download the prebuilt CI bundle."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: tracked local changes exist. Update cancelled."
  exit 1
fi

echo "[1/9] Pull latest code"
git pull --ff-only origin "$BRANCH"
HEAD_SHA="$(git rev-parse HEAD)"

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

echo "[7/9] Download tested production bundle from GitHub CI"
BUNDLE="tmp/${DEPLOY_ASSET}"
STAGE="tmp/prebuilt-stage"
READY=0
BUNDLE_SHA=""

for attempt in {1..24}; do
  rm -f "$BUNDLE"
  rm -rf "$STAGE"
  mkdir -p "$STAGE"

  if curl -fsSL --retry 2 --retry-delay 2 --connect-timeout 10 --max-time 120 \
    -H 'Cache-Control: no-cache' \
    "${DEPLOY_URL}?commit=${HEAD_SHA}&attempt=${attempt}" \
    -o "$BUNDLE"; then
    if tar -xzf "$BUNDLE" -C "$STAGE" >/dev/null 2>&1; then
      BUNDLE_SHA=""
      if [[ -f "$STAGE/BUILD_COMMIT" ]]; then
        IFS= read -r BUNDLE_SHA < "$STAGE/BUILD_COMMIT" || true
      fi
      if [[ "$BUNDLE_SHA" == "$HEAD_SHA" && -f "$STAGE/server.js" && -f "$STAGE/dist/index.html" ]]; then
        READY=1
        break
      fi
    fi
  fi

  echo "CI bundle is not ready for ${HEAD_SHA:0:7} yet (found ${BUNDLE_SHA:-none}); retrying in 10s..."
  sleep 10
done

if [[ "$READY" != "1" ]]; then
  echo "ERROR: no tested CI production bundle was available for commit $HEAD_SHA."
  echo "The currently running site was left untouched."
  exit 1
fi

APP_STOPPED=0
DEPLOY_SWAPPED=0
BACKUP_DIR="tmp/deploy-backup"

rollback_deploy() {
  local rc="${1:-1}"
  set +e
  if [[ "$DEPLOY_SWAPPED" == "1" ]]; then
    rm -rf dist
    rm -f server.js
    [[ -d "$BACKUP_DIR/dist" ]] && mv "$BACKUP_DIR/dist" dist
    [[ -f "$BACKUP_DIR/server.js" ]] && mv "$BACKUP_DIR/server.js" server.js
  fi
  if [[ "$APP_STOPPED" == "1" && -n "$SELECTOR" ]]; then
    "$SELECTOR" start --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1 || \
      "$SELECTOR" restart --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  fi
  mkdir -p tmp
  : > tmp/restart.txt
  exit "$rc"
}
trap 'rollback_deploy $?' ERR INT TERM

echo "[8/9] Deploy prebuilt bundle and restart application"
if [[ -n "$SELECTOR" ]]; then
  if "$SELECTOR" stop --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
    APP_STOPPED=1
  else
    echo "Node selector stop was skipped; deployment will use restart fallback."
  fi
fi

rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
[[ -d dist ]] && mv dist "$BACKUP_DIR/dist"
[[ -f server.js ]] && mv server.js "$BACKUP_DIR/server.js"
mv "$STAGE/dist" dist
mv "$STAGE/server.js" server.js
DEPLOY_SWAPPED=1

if [[ -n "$SELECTOR" ]]; then
  if [[ "$APP_STOPPED" == "1" ]]; then
    if "$SELECTOR" start --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    elif "$SELECTOR" restart --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    else
      echo "ERROR: prebuilt bundle installed but CloudLinux could not start the Node application."
      false
    fi
  else
    if "$SELECTOR" restart --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    elif "$SELECTOR" start --json --interpreter nodejs --app-root "$APP_ROOT" >/dev/null 2>&1; then
      :
    else
      echo "ERROR: prebuilt bundle installed but CloudLinux could not restart the Node application."
      false
    fi
  fi
fi

: > tmp/restart.txt

DEPLOY_SWAPPED=0
APP_STOPPED=0
trap - ERR INT TERM
rm -rf "$BACKUP_DIR" "$STAGE" "$BUNDLE"

VERSION=$(node -p "require('./package.json').version")
echo "[9/9] Done"
echo "UPDATE_OK"
echo "Version: $VERSION"
echo "Commit: $(git rev-parse --short HEAD)"
