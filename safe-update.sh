#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
APP_ROOT="Chinyadak"
APP_USER="${USER:-geelgoco}"
BRANCH="marketplace-rtl-phase1"
HISTORY_DIR="$APP_DIR/tmp/update-history"
LOG_DIR="$APP_DIR/tmp/update-logs"
LOCK_DIR="$APP_DIR/tmp/.safe-update-lock"
RESCUE_SOURCE="$APP_DIR/tools/yadak-rescue.php"
RESCUE_TARGET="/home/geelgoco/domains/yadak.store/public_html/__yadak_rescue.php"
TOKEN_FILE="$APP_DIR/tmp/rescue-token"

cd "$APP_DIR"
mkdir -p "$HISTORY_DIR" "$LOG_DIR" tmp

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "ERROR: another safe update is already running."
  exit 1
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

STAMP="$(date +%Y%m%d-%H%M%S)"
CURRENT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
BACKUP="$HISTORY_DIR/${STAMP}-${CURRENT_COMMIT:0:7}"
LOG_FILE="$LOG_DIR/${STAMP}.log"
mkdir -p "$BACKUP"

if [[ -d dist ]]; then cp -a dist "$BACKUP/dist"; fi
if [[ -f server.js ]]; then cp -a server.js "$BACKUP/server.js"; fi
if [[ -f package.json ]]; then cp -a package.json "$BACKUP/package.json"; fi
printf '%s\n' "$CURRENT_COMMIT" > "$BACKUP/COMMIT"
printf '%s\n' "$STAMP" > "$BACKUP/CREATED_AT"
printf '%s\n' "$BACKUP" > "$APP_DIR/tmp/last-good-backup"

# Keep a rescue endpoint independent of Node/Passenger when the hosting layout
# exposes a normal PHP-capable public_html directory.
if [[ ! -s "$TOKEN_FILE" ]] && command -v openssl >/dev/null 2>&1; then
  umask 077
  openssl rand -hex 24 > "$TOKEN_FILE"
fi
if [[ -f "$RESCUE_SOURCE" && -d "$(dirname "$RESCUE_TARGET")" ]]; then
  cp "$RESCUE_SOURCE" "$RESCUE_TARGET" 2>/dev/null || true
  chmod 600 "$RESCUE_TARGET" 2>/dev/null || true
fi

echo "SAFE_UPDATE_BACKUP=$BACKUP"
echo "SAFE_UPDATE_LOG=$LOG_FILE"

SELECTOR=""
if command -v cloudlinux-selector >/dev/null 2>&1; then
  SELECTOR="$(command -v cloudlinux-selector)"
elif [[ -x /usr/sbin/cloudlinux-selector ]]; then
  SELECTOR="/usr/sbin/cloudlinux-selector"
fi

APP_PRESTOPPED=0
restart_old_runtime() {
  if [[ "$APP_PRESTOPPED" == "1" && -n "$SELECTOR" ]]; then
    "$SELECTOR" start --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  fi
}

# CloudLinux on this account can hit its task ceiling while Passenger is alive.
# Stop the current runtime before Git/network/package work so the updater itself
# never competes with a 45-thread lsnode worker for the final available tasks.
if [[ -n "$SELECTOR" ]]; then
  echo "[safe] Stop current Node runtime before update preflight"
  "$SELECTOR" stop --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  APP_PRESTOPPED=1

  for _ in {1..20}; do
    found=0
    for p in /proc/[0-9]*; do
      uid=""; args=""; pid=${p##*/}
      while read -r key a b c d; do
        [[ "$key" == "Uid:" ]] && uid="$a"
      done < "$p/status" 2>/dev/null || true
      [[ "$uid" == "$UID" ]] || continue
      while IFS= read -r -d '' x; do args="${args}${args:+ }${x}"; done < "$p/cmdline" 2>/dev/null || true
      case "$args" in *"lsnode:$APP_DIR/"*) found=1 ;; esac
    done
    [[ "$found" == "0" ]] && break
    sleep 0.25
  done

  # Passenger occasionally leaves a stale worker after reporting stopped.
  for p in /proc/[0-9]*; do
    uid=""; args=""; pid=${p##*/}
    while read -r key a b c d; do
      [[ "$key" == "Uid:" ]] && uid="$a"
    done < "$p/status" 2>/dev/null || true
    [[ "$uid" == "$UID" ]] || continue
    while IFS= read -r -d '' x; do args="${args}${args:+ }${x}"; done < "$p/cmdline" 2>/dev/null || true
    case "$args" in
      *"lsnode:$APP_DIR/"*)
        echo "[safe] Terminating stale Passenger worker $pid"
        kill -TERM "$pid" 2>/dev/null || true
        ;;
    esac
  done
  sleep 1
fi

# safe-update owns the only source update. update.sh is told not to pull again.
if ! git pull --ff-only origin "$BRANCH"; then
  echo "SAFE_UPDATE_FAILED: git pull failed before deployment"
  restart_old_runtime
  exit 1
fi

set +e
set -o pipefail
YADAK_SKIP_PULL=1 YADAK_APP_PRESTOPPED="$APP_PRESTOPPED" bash "$APP_DIR/update.sh" 2>&1 | tee "$LOG_FILE"
RC=${PIPESTATUS[0]}
set -e

if [[ "$RC" -ne 0 ]]; then
  echo "SAFE_UPDATE_FAILED rc=$RC"
  echo "Rollback is available with: bash $APP_DIR/rollback.sh --latest"
  restart_old_runtime
  exit "$RC"
fi
APP_PRESTOPPED=0

cp "$LOG_FILE" "$APP_DIR/tmp/last-update.log" 2>/dev/null || true

# Retain the five newest restore points without process substitution. Some
# DirectAdmin/CloudLinux shells do not expose /dev/fd reliably.
BACKUPS=()
BACKUP_LIST="$APP_DIR/tmp/.backup-list.$$"
find "$HISTORY_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null \
  | sort -nr \
  | awk '{print $2}' > "$BACKUP_LIST"

while IFS= read -r backup; do
  [[ -n "$backup" ]] && BACKUPS+=("$backup")
done < "$BACKUP_LIST"

rm -f "$BACKUP_LIST"

if (( ${#BACKUPS[@]} > 5 )); then
  for ((i=5; i<${#BACKUPS[@]}; i++)); do rm -rf "${BACKUPS[$i]}"; done
fi

echo "SAFE_UPDATE_OK"
echo "Rollback point kept at: $BACKUP"
if [[ -f "$RESCUE_TARGET" && -s "$TOKEN_FILE" ]]; then
  echo "Emergency rescue page installed: https://yadak.store/__yadak_rescue.php"
  echo "Rescue token file: $TOKEN_FILE"
fi
