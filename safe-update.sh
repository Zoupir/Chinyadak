#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
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

set +e
set -o pipefail
bash "$APP_DIR/update.sh" 2>&1 | tee "$LOG_FILE"
RC=${PIPESTATUS[0]}
set -e

if [[ "$RC" -ne 0 ]]; then
  echo "SAFE_UPDATE_FAILED rc=$RC"
  echo "Rollback is available with: bash $APP_DIR/rollback.sh --latest"
  exit "$RC"
fi

cp "$LOG_FILE" "$APP_DIR/tmp/last-update.log" 2>/dev/null || true

# Retain the five newest restore points.
mapfile -t BACKUPS < <(find "$HISTORY_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | awk '{print $2}')
if (( ${#BACKUPS[@]} > 5 )); then
  for ((i=5; i<${#BACKUPS[@]}; i++)); do rm -rf "${BACKUPS[$i]}"; done
fi

echo "SAFE_UPDATE_OK"
echo "Rollback point kept at: $BACKUP"
if [[ -f "$RESCUE_TARGET" && -s "$TOKEN_FILE" ]]; then
  echo "Emergency rescue page installed: https://yadak.store/__yadak_rescue.php"
  echo "Rescue token file: $TOKEN_FILE"
fi
