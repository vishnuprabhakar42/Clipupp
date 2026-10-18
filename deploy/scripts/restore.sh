#!/usr/bin/env bash
#
# Restore a dump into the live database (clipupp_db) or run the restore drill.
#
#   scripts/restore.sh <dump.sql.gz.enc|dump.sql.gz> [--yes] [--drop-old]
#   scripts/restore.sh <dump> --target clipupp_drill          monthly drill
#
# Never destroys data before the replacement is proven:
#   1. verify the dump: decrypt and `gzip -t`, and check it is a pg_dump
#   2. restore into a scratch database <target>_restore_<timestamp> and count its coupons
#   3. live target only: stop backend and web (backup keeps running)
#   4. one psql transaction: terminate sessions on <target>, rename it to <target>_old_<timestamp>,
#      rename the scratch database to <target>
#   5. keep <target>_old_<timestamp> and print how to drop it, or drop it with --drop-old
# Any failure before step 4 commits drops the scratch database, leaves <target> untouched and,
# when step 3 stopped them, starts backend and web again on the tag in .deploy/current.
#
# The live target asks for RESTORE unless --yes is given, and leaves backend and web stopped
# so you can check the data first; the last line prints the command that starts them.
# Any other --target is a drill: no prompt, the app is not touched, and the restored database
# is dropped after its coupon count is printed (--keep keeps it).
set -euo pipefail

usage() { sed -n '3,6p' "$0" | sed 's/^# \{0,1\}//'; }

DUMP=""; TARGET="clipupp_db"; YES=0; DROP_OLD=0; KEEP=0; FROM_ROLLBACK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET="${2:?--target needs a database name}"; shift 2 ;;
    --yes) YES=1; shift ;;
    --drop-old) DROP_OLD=1; shift ;;
    --keep) KEEP=1; shift ;;
    --from-rollback) FROM_ROLLBACK=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "restore.sh: unknown option $1" >&2; usage >&2; exit 2 ;;
    *) [ -z "$DUMP" ] || { echo "restore.sh: more than one dump given" >&2; exit 2; }; DUMP="$1"; shift ;;
  esac
done
[ -n "$DUMP" ] || { usage >&2; exit 2; }
case "$DUMP" in /*) ;; *) DUMP="$PWD/$DUMP" ;; esac

cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh

LIVE_DB=clipupp_db
DB_CONTAINER="${DB_CONTAINER:-clipupp-db}"
if ! [[ "$TARGET" =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; then
  echo "restore.sh: --target must match ^[a-z_][a-z0-9_]{0,62}\$" >&2; exit 2
fi
case "$TARGET" in postgres|template0|template1) echo "restore.sh: refusing to restore over $TARGET" >&2; exit 2 ;; esac
TS="$(date -u +%Y%m%d%H%M%S)"
TMP_DB="${TARGET}_restore_${TS}"
OLD_DB="${TARGET}_old_${TS}"
if [ "${#OLD_DB}" -gt 63 ] || [ "${#TMP_DB}" -gt 63 ]; then
  echo "restore.sh: --target too long (the scratch name $TMP_DB exceeds 63 characters)" >&2; exit 2
fi
[ -f "$DUMP" ] || { echo "restore.sh: no such file: $DUMP" >&2; exit 1; }
case "$DUMP" in
  *.sql.gz.enc) [ -r .backup-key ] || { echo "restore.sh: .backup-key missing" >&2; exit 1; } ;;
  *.sql.gz) ;;
  *) echo "restore.sh: expected a .sql.gz.enc or .sql.gz file" >&2; exit 2 ;;
esac
LIVE=0; [ "$TARGET" = "$LIVE_DB" ] && LIVE=1

decrypt() {
  case "$DUMP" in
    *.enc) openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:.backup-key < "$DUMP" ;;
    *) cat "$DUMP" ;;
  esac
}
psql_admin() { docker exec -i "$DB_CONTAINER" psql -X -q -U "$DB_USERNAME" -v ON_ERROR_STOP=1 "$@"; }

TMP_CREATED=0; SWAPPED=0; APP_STOPPED=0
on_exit() {
  local rc=$? tag
  trap '' INT TERM HUP
  set +e
  if [ "$rc" != 0 ]; then
    if [ "$TMP_CREATED" = 1 ] && [ "$SWAPPED" = 0 ]; then
      log "dropping scratch database $TMP_DB"
      psql_admin -d postgres -c "DROP DATABASE IF EXISTS \"$TMP_DB\" WITH (FORCE)" >/dev/null
    fi
    if [ "$SWAPPED" = 0 ]; then log "!! restore failed; $TARGET was not changed"; fi
    if [ "$APP_STOPPED" = 1 ] && [ "$SWAPPED" = 0 ]; then
      tag="$(cat "$STATE_DIR/current" 2>/dev/null || true)"
      log "starting backend and web again on ${tag:-the .env tag}"
      if [ -n "$tag" ]; then export IMAGE_TAG="$tag"; fi
      compose up -d --no-deps --pull never backend web
    fi
  fi
  release_lock
  exit "$rc"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

acquire_lock
load_env

if [ "$LIVE" = 1 ] && [ "$YES" != 1 ]; then
  echo "!!! This REPLACES database $TARGET with $DUMP. Every change since that dump is lost."
  echo "    The current database is kept as $OLD_DB until you drop it."
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
fi

log "== restore $DUMP into $TARGET"
log "verifying the dump"
decrypt | gzip -t || { log "ERROR: $DUMP does not decrypt or is not a valid gzip (wrong .backup-key or truncated file)"; exit 1; }
# head closes the pipe early; the SIGPIPE upstream is expected, so pipefail is off for this check.
if ! (set +o pipefail; decrypt 2>/dev/null | gzip -dc 2>/dev/null | head -n 40 | grep -q 'PostgreSQL database dump'); then
  log "ERROR: $DUMP is not a pg_dump file"; exit 1
fi

psql_admin -d postgres -tAc 'select 1' >/dev/null || { log "ERROR: cannot reach postgres in $DB_CONTAINER"; exit 1; }
log "restoring into scratch database $TMP_DB"
psql_admin -d postgres -c "CREATE DATABASE \"$TMP_DB\"" >/dev/null
TMP_CREATED=1
decrypt | gzip -dc | psql_admin -d "$TMP_DB" >/dev/null || { log "ERROR: loading the dump failed"; exit 1; }
coupons="$(psql_admin -d "$TMP_DB" -tAc 'select count(*) from coupon')" \
  || { log "ERROR: restored database has no coupon table; refusing to swap"; exit 1; }
log "scratch database holds $coupons coupons"

if [ "$LIVE" = 1 ]; then
  log "stopping backend and web"
  APP_STOPPED=1
  compose stop backend web
fi

exists="$(psql_admin -d postgres -tAc "select 1 from pg_database where datname = '$TARGET'")"
for attempt in 1 2 3 4 5; do
  if [ "$exists" = 1 ]; then
    swap_sql="BEGIN;
SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE datname = '$TARGET' AND pid <> pg_backend_pid();
SELECT pg_sleep(1);
ALTER DATABASE \"$TARGET\" RENAME TO \"$OLD_DB\";
ALTER DATABASE \"$TMP_DB\" RENAME TO \"$TARGET\";
COMMIT;"
  else
    swap_sql="ALTER DATABASE \"$TMP_DB\" RENAME TO \"$TARGET\";"
  fi
  if psql_admin -d postgres >/dev/null <<<"$swap_sql"; then SWAPPED=1; break; fi
  log "swap attempt $attempt failed (sessions still open?); retrying"
  sleep 2
done
[ "$SWAPPED" = 1 ] || { log "ERROR: could not swap $TMP_DB into $TARGET"; exit 1; }
log "swapped: $TARGET now holds the restored data ($coupons coupons)"

if [ "$exists" = 1 ]; then
  if [ "$DROP_OLD" = 1 ]; then
    psql_admin -d postgres -c "DROP DATABASE \"$OLD_DB\" WITH (FORCE)" >/dev/null
    log "dropped the previous database $OLD_DB"
  else
    log "the previous database is kept as $OLD_DB; once satisfied, drop it with:"
    log "  docker exec $DB_CONTAINER psql -U \"\$DB_USERNAME\" -d postgres -c 'DROP DATABASE \"$OLD_DB\" WITH (FORCE)'"
  fi
fi

if [ "$LIVE" = 1 ]; then
  if [ "$FROM_ROLLBACK" != 1 ]; then
    tag="$(cat "$STATE_DIR/current" 2>/dev/null || echo '<tag>')"
    log "backend and web are STOPPED. Start them on the running release:"
    log "  IMAGE_TAG='$tag' docker compose -f docker-compose.prod.yml up -d backend web"
  fi
elif [ "$KEEP" = 1 ]; then
  log "drill database $TARGET kept ($coupons coupons)"
else
  psql_admin -d postgres -c "DROP DATABASE \"$TARGET\" WITH (FORCE)" >/dev/null
  log "drill ok: $coupons coupons restored; dropped $TARGET"
fi
log "== restore done"
