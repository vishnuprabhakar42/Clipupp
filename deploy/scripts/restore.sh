#!/usr/bin/env bash
#
# Restore a dump into the database (default clipupp_db) or a scratch database.
#
#   scripts/restore.sh <dump.sql.gz.enc|dump.sql.gz> [--target <dbname>] [--yes]
#
# Without --yes it asks for RESTORE. --target other than clipupp_db is the
# monthly drill: restore into clipupp_drill, count rows, drop it.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh
load_env
DUMP="${1:?usage: restore.sh <dump> [--target db] [--yes]}"; shift
TARGET="clipupp_db"; YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET="${2:?--target needs a database name}"; shift 2 ;;
    --yes) YES=1; shift ;;
    *) echo "unknown arg $1" >&2; exit 1 ;;
  esac
done
[ -f "$DUMP" ] || { echo "no such file: $DUMP" >&2; exit 1; }
if [ "$YES" != 1 ]; then
  echo "!!! This REPLACES database $TARGET with $DUMP."
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
fi
decode() {
  case "$DUMP" in
    *.enc) openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:.backup-key < "$DUMP" | gunzip -c ;;
    *) gunzip -c "$DUMP" ;;
  esac
}
log "restoring $DUMP into $TARGET"
docker exec clipupp-db psql -U "$DB_USERNAME" -d postgres -v ON_ERROR_STOP=1 \
  -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$TARGET' and pid <> pg_backend_pid();" \
  -c "drop database if exists $TARGET;" -c "create database $TARGET;" >/dev/null
decode | docker exec -i clipupp-db psql -U "$DB_USERNAME" -d "$TARGET" -q -v ON_ERROR_STOP=1 >/dev/null
log "restored into $TARGET ($(docker exec clipupp-db psql -U "$DB_USERNAME" -d "$TARGET" -tAc 'select count(*) from coupon') coupons)"
if [ "$TARGET" = "clipupp_db" ]; then
  log "start the app again: docker compose -f docker-compose.prod.yml up -d backend web"
fi
