#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
APP_ROOT="Chinyadak"
APP_USER="${USER:-geelgoco}"
HISTORY_DIR="$APP_DIR/tmp/update-history"
HEALTH_URL="https://yadak.store/api/health"

export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
cd "$APP_DIR"

SELECTOR=""
if command -v cloudlinux-selector >/dev/null 2>&1; then
  SELECTOR="$(command -v cloudlinux-selector)"
elif [[ -x /usr/sbin/cloudlinux-selector ]]; then
  SELECTOR="/usr/sbin/cloudlinux-selector"
fi

collect_nodes() {
  NODE_PIDS=()
  local p pid uid args x
  for p in /proc/[0-9]*; do
    pid=${p##*/}; uid=""; args=""
    while read -r key a b c d; do [[ "$key" == "Uid:" ]] && uid="$a"; done < "$p/status" 2>/dev/null || true
    [[ "$uid" == "$UID" ]] || continue
    while IFS= read -r -d '' x; do args="${args}${args:+ }${x}"; done < "$p/cmdline" 2>/dev/null || true
    [[ "$args" == *"lsnode:$APP_DIR/"* ]] && NODE_PIDS+=("$pid")
  done
}

stop_app() {
  if [[ -n "$SELECTOR" ]]; then
    "$SELECTOR" stop --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null 2>&1 || true
  fi
  for _ in {1..20}; do collect_nodes; (( ${#NODE_PIDS[@]} == 0 )) && return 0; sleep 0.5; done
  collect_nodes
  for pid in "${NODE_PIDS[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for _ in {1..10}; do collect_nodes; (( ${#NODE_PIDS[@]} == 0 )) && return 0; sleep 0.5; done
  collect_nodes
  for pid in "${NODE_PIDS[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
}

start_app() {
  if [[ -n "$SELECTOR" ]]; then
    "$SELECTOR" start --json --interpreter nodejs --user "$APP_USER" --app-root "$APP_ROOT" >/dev/null
  else
    : > tmp/restart.txt
  fi
}

latest_backup() {
  if [[ -s tmp/last-good-backup ]]; then
    local saved=""
    IFS= read -r saved < tmp/last-good-backup || true
    [[ -d "$saved" ]] && { printf '%s\n' "$saved"; return 0; }
  fi
  find "$HISTORY_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2-
}

TARGET="${2:-}"
if [[ "${1:-}" == "--latest" || -z "${1:-}" ]]; then
  TARGET="$(latest_backup)"
elif [[ "${1:-}" == "--backup" ]]; then
  TARGET="${2:-}"
else
  TARGET="$1"
fi

if [[ -z "$TARGET" || ! -d "$TARGET" || ! -f "$TARGET/server.js" || ! -d "$TARGET/dist" ]]; then
  echo "ERROR: no valid rollback backup found."
  exit 1
fi

CURRENT_SAFETY="$APP_DIR/tmp/rollback-safety-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$CURRENT_SAFETY"
[[ -d dist ]] && cp -a dist "$CURRENT_SAFETY/dist"
[[ -f server.js ]] && cp -a server.js "$CURRENT_SAFETY/server.js"

echo "ROLLBACK_TARGET=$TARGET"
stop_app
rm -rf dist
rm -f server.js
cp -a "$TARGET/dist" dist
cp -a "$TARGET/server.js" server.js
start_app

OK=0
for attempt in {1..20}; do
  if curl -fsS --connect-timeout 5 --max-time 10 "${HEALTH_URL}?rollback=${attempt}" >/dev/null 2>&1; then OK=1; break; fi
  sleep 1
done

if [[ "$OK" != "1" ]]; then
  echo "ERROR: rollback target failed health check. Restoring the pre-rollback runtime."
  stop_app
  rm -rf dist
  rm -f server.js
  [[ -d "$CURRENT_SAFETY/dist" ]] && cp -a "$CURRENT_SAFETY/dist" dist
  [[ -f "$CURRENT_SAFETY/server.js" ]] && cp -a "$CURRENT_SAFETY/server.js" server.js
  start_app || true
  exit 1
fi

collect_nodes
if (( ${#NODE_PIDS[@]} > 1 )); then
  echo "ERROR: more than one Passenger worker appeared after rollback: ${NODE_PIDS[*]}"
  exit 1
fi

COMMIT="unknown"
[[ -f "$TARGET/COMMIT" ]] && IFS= read -r COMMIT < "$TARGET/COMMIT" || true
printf '%s\n' "$TARGET" > tmp/current-restored-backup
rm -rf "$CURRENT_SAFETY"
echo "ROLLBACK_OK"
echo "Restored runtime from commit: $COMMIT"
