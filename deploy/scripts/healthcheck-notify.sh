#!/usr/bin/env bash
# Uptime and backup probe, run from cron as deploy every 5 minutes:
#   */5 * * * * /opt/clipupp/scripts/healthcheck-notify.sh >> /opt/clipupp/.deploy/health-cron.log 2>&1
#
# Site: posts to Telegram when the state changes. Two consecutive failed probes count as down,
# so a single slow response or the backend restart during a deploy does not page anyone.
# Backups: alerts once when backups/.last-backup-ok (written by a fully successful nightly
# backup) is older than 36 hours, or still missing a day after this probe first ran, and once
# more when backups recover.
# Disk: alerts once when the root filesystem, which every stack on this host shares, is more than
# DISK_ALERT_PERCENT (default 85) percent used, and once more when it is back under the limit.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh
load_env
mkdir -p "$STATE_DIR"
now_s="$(date +%s)"

# --- site -------------------------------------------------------------------------------------
if [ -z "${PUBLIC_SITE_URL:-}" ]; then
  log "healthcheck: PUBLIC_SITE_URL is not set in .env; site probe skipped"
else
  SITE="${PUBLIC_SITE_URL%/}"
  STATE_FILE="$STATE_DIR/health-state"
  FAILS_FILE="$STATE_DIR/health-fails"
  prev="$(cat "$STATE_FILE" 2>/dev/null || echo up)"
  web="$(curl -fsS -m 10 "$SITE/api/health" 2>/dev/null || echo '{"ok":false}')"
  # curl already prints 000 when it cannot connect; do not append another.
  api="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$SITE/actuator/health" 2>/dev/null || true)"
  api="${api:-000}"
  if grep -q '"ok":true' <<<"$web" && grep -q '"backend":"up"' <<<"$web" && [ "$api" = "200" ]; then
    fails=0
  else
    fails=$(( $(cat "$FAILS_FILE" 2>/dev/null || echo 0) + 1 ))
  fi
  echo "$fails" > "$FAILS_FILE"
  if [ "$fails" -ge 2 ]; then cur=down; elif [ "$fails" = 0 ]; then cur=up; else cur="$prev"; fi
  if [ "$cur" != "$prev" ]; then
    if [ "$cur" = down ]; then notify "Clipupp is DOWN: web=$web actuator=$api"; else notify "Clipupp recovered."; fi
    echo "$cur" > "$STATE_FILE"
  fi
fi

# --- backups ----------------------------------------------------------------------------------
MARKER="backups/.last-backup-ok"
SINCE_FILE="$STATE_DIR/backup-watch-since"
BSTATE_FILE="$STATE_DIR/backup-state"
[ -f "$SINCE_FILE" ] || echo "$now_s" > "$SINCE_FILE"
since="$(cat "$SINCE_FILE")"
bprev="$(cat "$BSTATE_FILE" 2>/dev/null || echo ok)"
last="$(cat "$MARKER" 2>/dev/null || true)"
case "$last" in ''|*[!0-9]*) last="" ;; esac
if [ -n "$last" ]; then
  if [ $(( now_s - last )) -gt $(( 36 * 3600 )) ]; then bcur=stale; else bcur=ok; fi
  detail="last successful backup $(( (now_s - last) / 3600 )) hours ago"
elif [ $(( now_s - since )) -gt 86400 ]; then
  bcur=stale; detail="no successful backup recorded"
else
  bcur="$bprev"; detail=""
fi
if [ "$bcur" != "$bprev" ]; then
  if [ "$bcur" = stale ]; then
    notify "Clipupp backups are STALE: $detail. Check: docker logs --since 48h clipupp-backup"
  else
    notify "Clipupp backups recovered: $detail."
  fi
  echo "$bcur" > "$BSTATE_FILE"
fi

# --- disk -------------------------------------------------------------------------------------
DISK_LIMIT="${DISK_ALERT_PERCENT:-85}"
DSTATE_FILE="$STATE_DIR/disk-state"
dprev="$(cat "$DSTATE_FILE" 2>/dev/null || echo ok)"
df_out="$(df -P / 2>/dev/null || true)"
used="$(awk 'NR == 2 { sub(/%/, "", $5); print $5 }' <<<"$df_out")"
case "$used" in
  ''|*[!0-9]*) log "healthcheck: cannot read the disk usage of /" ;;
  *)
    if [ "$used" -gt "$DISK_LIMIT" ]; then dcur=full; else dcur=ok; fi
    if [ "$dcur" != "$dprev" ]; then
      if [ "$dcur" = full ]; then
        notify "Clipupp host disk / is ${used}% used (alert above ${DISK_LIMIT}%). Check: docker system df; du -sh /opt/clipupp/backups. Runbook: Disk pressure."
      else
        notify "Clipupp host disk / is back to ${used}% used."
      fi
      echo "$dcur" > "$DSTATE_FILE"
    fi ;;
esac
