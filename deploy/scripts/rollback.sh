#!/usr/bin/env bash
#
# Roll back to the previous release, or to a named tag.
#
#   scripts/rollback.sh                       previous release (.deploy/previous)
#   scripts/rollback.sh sha-<git sha>         any tag present locally or in GHCR
#   scripts/rollback.sh --with-db <dump> [tag]   also restore the database (asks for RESTORE)
#
# Application rollback does not touch data. Only use --with-db when the release
# you are leaving ran a migration you must undo; rows written since are lost.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh
load_env

WITH_DB=""
if [ "${1:-}" = "--with-db" ]; then WITH_DB="${2:?--with-db needs a dump file}"; shift 2; fi
TARGET="${1:-$(cat "$STATE_DIR/previous" 2>/dev/null || true)}"
[ -n "$TARGET" ] || { echo "No previous release recorded and no tag given." >&2; exit 1; }
CURRENT="$(cat "$STATE_DIR/current" 2>/dev/null || true)"
log "== rollback: ${CURRENT:-none} -> $TARGET"

if [ -n "$WITH_DB" ]; then
  echo "!!! This REPLACES the database with $WITH_DB. Every change since that dump is lost."
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
  compose stop backend web
  scripts/restore.sh "$WITH_DB" --yes
fi

export IMAGE_TAG="$TARGET"
# The registry login is CD's short-lived token, so a pull may be denied by the
# time a human runs this; every deployed tag stays local for 7 days.
if ! compose pull --quiet backend web 2>/dev/null; then
  log "registry pull failed; using local images"
  for svc in backend web; do
    img="$(compose config --images "$svc" | sed -n 1p)"
    docker image inspect "$img" >/dev/null 2>&1 || { log "ERROR: $img not available locally"; exit 1; }
  done
fi
compose up -d --no-deps --pull never backend web
wait_healthy clipupp-backend "${HEALTH_TIMEOUT:-180}" || { log "ERROR: rolled-back backend not ready"; exit 1; }
wait_healthy clipupp-web "${HEALTH_TIMEOUT:-120}" || { log "ERROR: rolled-back web not healthy"; exit 1; }
if [ -n "$CURRENT" ]; then echo "$CURRENT" > "$STATE_DIR/previous"; fi
echo "$TARGET" > "$STATE_DIR/current"
log "== rolled back to $TARGET"
notify "Clipupp rolled back to $TARGET (was ${CURRENT:-none})."
