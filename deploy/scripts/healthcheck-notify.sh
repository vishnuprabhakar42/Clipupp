#!/usr/bin/env bash
# Uptime probe: posts to Telegram only when the state changes.
#   */5 * * * * /opt/clipupp/scripts/healthcheck-notify.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh
load_env
SITE="${PUBLIC_SITE_URL%/}"
STATE_FILE="$STATE_DIR/health-state"
mkdir -p "$STATE_DIR"
prev="$(cat "$STATE_FILE" 2>/dev/null || echo unknown)"
web="$(curl -fsS -m 10 "$SITE/api/health" 2>/dev/null || echo '{"ok":false}')"
api="$(curl -fsS -m 10 -o /dev/null -w '%{http_code}' "$SITE/actuator/health" 2>/dev/null || echo 000)"
if grep -q '"ok":true' <<<"$web" && grep -q '"backend":"up"' <<<"$web" && [ "$api" = "200" ]; then now=up; else now=down; fi
if [ "$now" != "$prev" ]; then
  echo "$now" > "$STATE_FILE"
  if [ "$prev" = "unknown" ]; then exit 0; fi
  if [ "$now" = "down" ]; then notify "Clipupp is DOWN: web=$web actuator=$api"; else notify "Clipupp recovered."; fi
fi
