#!/usr/bin/env bash
#
# Roll back to the previous release, or to a named tag.
#
#   scripts/rollback.sh                              previous release (.deploy/previous)
#   scripts/rollback.sh sha-<git sha>                any tag present locally or in GHCR
#   scripts/rollback.sh [tag] --with-db <dump>       also restore the database (asks for RESTORE)
#
# Images already on this host are used as they are; the registry is contacted only for an
# image that is missing, so a rollback works when the CI registry token has expired.
#
# Application rollback does not touch data. Only use --with-db when the release you are
# leaving ran a migration you must undo; rows written since the dump are lost. To undo a
# migration of a deploy that already rolled back by itself, name the running tag:
#   scripts/rollback.sh "$(cat .deploy/current)" --with-db backups/pre-deploy-<tag>-<time>.sql.gz.enc
#
# On success .env's IMAGE_TAG names the restored release; any failure posts to Telegram.
set -euo pipefail

usage() { sed -n '3,7p' "$0" | sed 's/^# \{0,1\}//'; }

TAG_ARG=""; WITH_DB=""
while [ $# -gt 0 ]; do
  case "$1" in
    --with-db) WITH_DB="${2:?--with-db needs a dump file}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "rollback.sh: unknown option $1" >&2; usage >&2; exit 2 ;;
    *)
      [ -z "$TAG_ARG" ] || { echo "rollback.sh: more than one tag given" >&2; exit 2; }
      TAG_ARG="$1"; shift ;;
  esac
done

cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh

TARGET=""; CURRENT=""; STARTED=0; FAIL_REASON=""
fail() { FAIL_REASON="$1"; exit 1; }
on_exit() {
  local rc=$?
  trap '' INT TERM HUP
  set +e
  if [ "$rc" != 0 ] && [ "$STARTED" = 1 ]; then
    log "!! rollback to $TARGET FAILED: ${FAIL_REASON:-exit $rc}"
    notify "Clipupp rollback to $TARGET FAILED: ${FAIL_REASON:-exit $rc}. Manual action needed."
  fi
  release_lock
  exit "$rc"
}
trap on_exit EXIT
trap 'FAIL_REASON="${FAIL_REASON:-interrupted (SIGINT)}"; exit 130' INT
trap 'FAIL_REASON="${FAIL_REASON:-interrupted (SIGTERM)}"; exit 143' TERM
trap 'FAIL_REASON="${FAIL_REASON:-interrupted (SIGHUP)}"; exit 129' HUP
trap '' PIPE

acquire_lock
load_env

TARGET="${TAG_ARG:-$(cat "$STATE_DIR/previous" 2>/dev/null || true)}"
[ -n "$TARGET" ] || { echo "No previous release recorded and no tag given." >&2; exit 1; }
valid_tag "$TARGET" || { echo "rollback.sh: not a valid image tag: $TARGET" >&2; exit 2; }
if [ -n "$WITH_DB" ] && [ ! -f "$WITH_DB" ]; then echo "rollback.sh: no such dump: $WITH_DB" >&2; exit 1; fi
CURRENT="$(cat "$STATE_DIR/current" 2>/dev/null || true)"
STARTED=1
log "== rollback: ${CURRENT:-none} -> $TARGET${WITH_DB:+ (with database from $WITH_DB)}"

export IMAGE_TAG="$TARGET"
ensure_local_images backend web || fail "images for $TARGET are not available"

if [ -n "$WITH_DB" ]; then
  echo "!!! This REPLACES the database with $WITH_DB. Every change since that dump is lost."
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { STARTED=0; echo "Aborted."; exit 1; }
  # restore.sh verifies the dump, restores into a scratch database, stops backend and web, and
  # swaps the names; the previous database is kept and the command to drop it is printed.
  scripts/restore.sh "$WITH_DB" --yes --from-rollback || fail "database restore failed (live database unchanged)"
fi

compose up -d --no-deps --pull never backend web || fail "compose up backend web failed"
wait_service_healthy backend "${HEALTH_TIMEOUT:-180}" || fail "backend on $TARGET not ready"
wait_service_healthy web "${HEALTH_TIMEOUT:-120}" || fail "web on $TARGET not healthy"

set_env_image_tag "$TARGET" || fail "running $TARGET, but could not write IMAGE_TAG to .env"
if [ -n "$CURRENT" ] && [ "$CURRENT" != "$TARGET" ]; then echo "$CURRENT" > "$STATE_DIR/previous"; fi
echo "$TARGET" > "$STATE_DIR/current"
log "== rolled back to $TARGET and healthy"
notify "Clipupp rolled back to $TARGET (was ${CURRENT:-none}) and healthy."
