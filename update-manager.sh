#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/geelgoco/Chinyadak"
BRANCH="marketplace-rtl-phase1"
cd "$APP_DIR"

check_update() {
  echo "Checking for updates..."
  git fetch origin "$BRANCH" --quiet
  local current remote current_version remote_version
  current="$(git rev-parse HEAD)"
  remote="$(git rev-parse "origin/$BRANCH")"
  current_version="$(sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' package.json | head -n1)"
  remote_version="$(git show "origin/$BRANCH:package.json" 2>/dev/null | sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -n1)"
  echo "Current: ${current_version:-unknown} (${current:0:7})"
  echo "Latest : ${remote_version:-unknown} (${remote:0:7})"
  if [[ "$current" == "$remote" ]]; then
    echo "UPDATE_STATUS=UP_TO_DATE"
    return 1
  fi
  echo "UPDATE_STATUS=AVAILABLE"
  return 0
}

show_log() {
  if [[ -f tmp/last-update.log ]]; then
    cat tmp/last-update.log
  else
    echo "No completed update log is available yet."
  fi
}

case "${1:-}" in
  --check)
    check_update || true
    exit 0
    ;;
  --update)
    exec bash "$APP_DIR/safe-update.sh"
    ;;
  --rollback)
    exec bash "$APP_DIR/rollback.sh" --latest
    ;;
  --log)
    show_log
    exit 0
    ;;
esac

while true; do
  echo
  echo "========================================="
  echo " Yadak Store — Safe Update Center"
  echo "========================================="
  echo "1) Check for update"
  echo "2) Install update safely"
  echo "3) Roll back to previous healthy version"
  echo "4) Show last update log"
  echo "5) Exit"
  printf "Select: "
  read -r choice
  case "$choice" in
    1) check_update || true ;;
    2)
      if check_update; then
        printf "Install this tested update now? [y/N]: "
        read -r confirm
        [[ "$confirm" =~ ^[Yy]$ ]] && bash "$APP_DIR/safe-update.sh" || echo "Cancelled."
      fi
      ;;
    3)
      printf "Restore the previous healthy runtime? [y/N]: "
      read -r confirm
      [[ "$confirm" =~ ^[Yy]$ ]] && bash "$APP_DIR/rollback.sh" --latest || echo "Cancelled."
      ;;
    4) show_log ;;
    5) exit 0 ;;
    *) echo "Invalid selection." ;;
  esac
done
