#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
APP_ROOT="Chinyadak"
APP_USER="${USER:-geelgoco}"
BRANCH="marketplace-rtl-phase1"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"
DEPLOY_TAG="marketplace-rtl-phase1-builds"
DEPLOY_ASSET="chinyadak-build.tar.gz"
DEPLOY_URL="https://github.com/Zoupir/Chinyadak/releases/download/${DEPLOY_TAG}/${DEPLOY_ASSET}"
HEALTH_URL="https://yadak.store/api/health"
SKIP_PULL="${YADAK_SKIP_PULL:-0}"
APP_PRESTOPPED="${YADAK_APP_PRESTOPPED:-0}"

export PATH="$NODE_BIN:$PATH"
export GOMAXPROCS=1
export RAYON_NUM_THREADS=1
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-2}"
if [[ -z "${NODE_OPTIONS:-}" ]]; then
  export NODE_OPTIONS="--v8-pool-size=2"
fi

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

APP_NODE_PIDS=()
APP_NODE_THREADS=0
collect_app_nodes() {
  APP_NODE_PIDS=()
  APP_NODE_THREADS=0
  local p pid uid threads args x

  for p in /proc/[0-9]*; do
    pid=${p##*/}
    uid=""
    threads=0
    args=""

    while read -r key a b c d; do
      case "$key" in
        Uid:) uid="$a" ;;
        Threads:) threads="$a" ;;
      esac
    done < "$p/status" 2>/dev/null || true

    [[ "$uid" == "$UID" ]] || continue

    while IFS= read -r -d '' x; do
      args="${args}${args:+ }${x}"
    done < "$p/cmdline" 2>/dev/null || true

    case "$args" in
      *"lsnode:$APP_DIR/"*)
        APP_NODE_PIDS+=("$pid")
        ((APP_NODE_THREADS+=threads))
        ;;
    esac
  done
}

wait_for_app_exit() {
  local rounds="${1:-20}"
  local i
  for ((i=0; i<rounds; i++)); do
    collect_app_nodes
    if (( ${#APP_NODE_PIDS[@]} == 0 )); then
      return 0
    fi
    sleep 0.5
  done
  collect_app_nodes
  (( ${#APP_NODE_PIDS[@]} == 0 ))
}

stop_stale_app_workers() {
  collect_app_nodes
  if (( ${#APP_NODE_PIDS[@]} == 0 )); then
    return 0
  fi

  echo "Waiting Passenger workers did not exit; terminating stale workers: ${APP_NODE_PIDS[*]}"
  local pid
  for pid in "${APP_NODE_PIDS[@]}"; do
    kill -TERM "$pid" 2>/dev/null || true
  done

  if wait_for_app_exit 10; then
    return 0
  fi

  collect_app_nodes
  echo "Force-stopping stale workers: ${APP_NODE_PIDS[*]}"
  for pid in "${APP_NODE_PIDS[@]}"; do
    kill -KILL "$pid" 2>/dev/null || true
  done

  wait_for_app_exit 6
}

normalized_package_signature_from_file() {
  sed -E '/^[[:space:]]*"version"[[:space:]]*:/d' "$1" | cksum
}

normalized_package_signature_from_git() {
  local ref="$1"
  git show "${ref}:package.json" 2>/dev/null | sed -E '/^[[:space:]]*"version"[[:space:]]*:/d' | cksum
}

OLD_HEAD="$(git rev-parse HEAD)"
OLD_PKG_SIG="$(normalized_package_signature_from_git "$OLD_HEAD" || true)"

echo "[1/9] Pull latest code"
if [[ "$SKIP_PULL" == "1" ]]; then
  echo "Source already updated by safe-update - skipped"
else
  git pull --ff-only origin "$BRANCH"
fi
HEAD_SHA="$(git rev-parse HEAD)"
PKG_SIG="$(normalized_package_signature_from_file package.json)"
SIG_FILE="tmp/.package-signature-v2"
LAST_SIG=""
if [[ -f "$SIG_FILE" ]]; then
  IFS= read -r LAST_SIG < "$SIG_FILE" || true
fi

NEEDS_INSTALL=0
if [[ ! -d node_modules ]]; then
  NEEDS_INSTALL=1
elif [[ -n "$LAST_SIG" && "$PKG_SIG" == "$LAST_SIG" ]]; then
  NEEDS_INSTALL=0
elif [[ -z "$LAST_SIG" && -n "$OLD_PKG_SIG" && "$PKG_SIG" == "$OLD_PKG_SIG" ]]; then
  printf '%s\n' "$PKG_SIG" > "$SIG_FILE"
  NEEDS_INSTALL=0
else
  NEEDS_INSTALL=1
fi

DEPENDENCY_APP_STOPPED=0
restart_after_dependency_failure() {
  local rc=$?
  set +e
  if [[ "$DEPENDENCY_APP_STOPPED" == "1" && "$APP_PRESTOPPED" != "1" && -n "$SELECTOR" ]]; then
    "$SELECTOR" start --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  fi
  exit "$rc"
}

if [[ "$NEEDS_INSTALL" == "1" ]]; then
  echo "[2/9] Install dependencies"

  if [[ -n "$SELECTOR" && "$APP_PRESTOPPED" != "1" ]]; then
    trap restart_after_dependency_failure ERR INT TERM
    if ! "$SELECTOR" stop --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1; then
      echo "ERROR: CloudLinux could not stop the Node application before dependency installation."
      false
    fi
    DEPENDENCY_APP_STOPPED=1
    if ! wait_for_app_exit 20; then
      if ! stop_stale_app_workers; then
        echo "ERROR: Passenger workers are still running; dependency installation cancelled."
        false
      fi
    fi
  elif [[ "$APP_PRESTOPPED" == "1" ]]; then
    DEPENDENCY_APP_STOPPED=1
  fi

  npm install --no-audit --no-fund --package-lock=false
  printf '%s\n' "$PKG_SIG" > "$SIG_FILE"

  if [[ "$DEPENDENCY_APP_STOPPED" == "1" && "$APP_PRESTOPPED" != "1" && -n "$SELECTOR" ]]; then
    if ! "$SELECTOR" start --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1; then
      echo "ERROR: dependencies installed but CloudLinux could not restart the current application."
      false
    fi
    DEPENDENCY_APP_STOPPED=0
    trap - ERR INT TERM
  fi
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

  if [[ -n "$SELECTOR" ]]; then
    "$SELECTOR" stop --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1 || true
    wait_for_app_exit 10 || stop_stale_app_workers || true
  fi

  if [[ "$DEPLOY_SWAPPED" == "1" ]]; then
    rm -rf dist
    rm -f server.js
    [[ -d "$BACKUP_DIR/dist" ]] && mv "$BACKUP_DIR/dist" dist
    [[ -f "$BACKUP_DIR/server.js" ]] && mv "$BACKUP_DIR/server.js" server.js
  fi

  if [[ -n "$SELECTOR" && ( "$APP_STOPPED" == "1" || "$APP_PRESTOPPED" == "1" ) ]]; then
    "$SELECTOR" start --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  elif [[ -z "$SELECTOR" ]]; then
    mkdir -p tmp
    : > tmp/restart.txt
  fi

  exit "$rc"
}
trap 'rollback_deploy $?' ERR INT TERM

echo "[8/9] Deploy prebuilt bundle and restart application"
if [[ -n "$SELECTOR" ]]; then
  if [[ "$APP_PRESTOPPED" != "1" ]]; then
    if ! "$SELECTOR" stop --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1; then
      echo "ERROR: CloudLinux could not stop the Node application safely."
      false
    fi
  fi
  APP_STOPPED=1

  if ! wait_for_app_exit 20; then
    if ! stop_stale_app_workers; then
      echo "ERROR: old Passenger workers are still running; deployment cancelled."
      false
    fi
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
  if ! "$SELECTOR" start --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1; then
    echo "ERROR: prebuilt bundle installed but CloudLinux could not start the Node application."
    false
  fi
else
  : > tmp/restart.txt
fi

HEALTH_OK=0
for attempt in {1..20}; do
  if curl -fsS --connect-timeout 5 --max-time 10 \
    "${HEALTH_URL}?deploy=${HEAD_SHA}&attempt=${attempt}" >/dev/null 2>&1; then
    HEALTH_OK=1
    break
  fi
  sleep 1
done

if [[ "$HEALTH_OK" != "1" ]]; then
  echo "ERROR: deployment health check failed; rolling back."
  false
fi

collect_app_nodes
if (( ${#APP_NODE_PIDS[@]} > 1 )); then
  echo "ERROR: Passenger started more than one Chinyadak worker (${APP_NODE_PIDS[*]})."
  echo "Deployment will roll back rather than exhaust the CloudLinux process limit."
  false
fi

if (( ${#APP_NODE_PIDS[@]} == 1 )); then
  echo "Passenger worker OK: PID=${APP_NODE_PIDS[0]} threads=${APP_NODE_THREADS}"
fi

DEPLOY_SWAPPED=0
APP_STOPPED=0
APP_PRESTOPPED=0
trap - ERR INT TERM
rm -rf "$BACKUP_DIR" "$STAGE" "$BUNDLE"

VERSION=$(node -p "require('./package.json').version")
echo "[9/9] Done"
echo "UPDATE_OK"
echo "Version: $VERSION"
echo "Commit: $(git rev-parse --short HEAD)"
