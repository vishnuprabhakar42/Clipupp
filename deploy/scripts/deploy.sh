#!/usr/bin/env bash
#
# Deploy one release to this server. Run by CD over SSH; safe to run by hand.
#
#   scripts/deploy.sh sha-<git sha>
#
# Order of operations:
#   1. pull the images for <tag> (tolerated if they are already local)
#   2. start the database and take an encrypted pre-migration dump
#   3. recreate backend on the new tag (Flyway migrates on boot), wait for readiness
#   4. roll web over with zero downtime (docker rollout) or recreate it
#   5. on any failure after step 2: put backend and web back on the previous tag
#
# State lives in .deploy/: `current` and `previous` hold image tags.
set -euo pipefail

TAG="${1:?usage: deploy.sh <image-tag>}"
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh
load_env

mkdir -p "$STATE_DIR"; install -d -m 0700 backups
CURRENT_FILE="$STATE_DIR/current"; PREVIOUS_FILE="$STATE_DIR/previous"
PREVIOUS_TAG="$(cat "$CURRENT_FILE" 2>/dev/null || true)"
export IMAGE_TAG="$TAG"

log "== deploy $TAG (previous: ${PREVIOUS_TAG:-none})"

log "pulling images"
if ! compose pull --quiet backend web backup 2>/dev/null; then
  log "registry pull failed; checking local images"
  for svc in backend web backup; do
    img="$(compose config --images "$svc" | sed -n 1p)"
    docker image inspect "$img" >/dev/null 2>&1 || { log "ERROR: $img not available locally"; exit 1; }
  done
fi

compose up -d --quiet-pull db
until docker exec clipupp-db pg_isready -q -U "$DB_USERNAME" -d clipupp_db 2>/dev/null; do sleep 1; done

DUMP="backups/pre-deploy-$TAG-$(date -u +%Y%m%d-%H%M%S).sql.gz.enc"
log "pre-migration dump -> $DUMP"
if docker exec clipupp-db sh -c "pg_dump -U $DB_USERNAME clipupp_db --no-owner --no-privileges" \
     | gzip -9 | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:.backup-key > "$DUMP" \
   && openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:.backup-key < "$DUMP" | gzip -t; then
  chmod 600 "$DUMP"; log "dump ok ($(du -h "$DUMP" | cut -f1))"
else
  rm -f "$DUMP"; log "ERROR: pre-deploy dump failed; refusing to migrate without a safety net"; exit 1
fi

rollback() {
  log "!! $1"
  if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$TAG" ]; then
    log "rolling back to $PREVIOUS_TAG"
    IMAGE_TAG="$PREVIOUS_TAG" compose up -d --no-deps --pull never backend web || true
    log "rolled back; the database was NOT restored (scripts/restore.sh $DUMP if the migration must be undone)"
    notify "Clipupp deploy $TAG FAILED: $1. Rolled back to $PREVIOUS_TAG."
  else
    log "no previous release to roll back to"
    notify "Clipupp deploy $TAG FAILED: $1. No previous release."
  fi
  exit 1
}

log "starting backend on $TAG"
compose up -d --no-deps --pull never backend
wait_healthy clipupp-backend "${HEALTH_TIMEOUT:-180}" || rollback "backend did not become ready"

log "rolling web over to $TAG"
rc=0; rollout_web || rc=$?
if [ "$rc" = 2 ]; then
  compose up -d --no-deps --pull never web
elif [ "$rc" != 0 ]; then
  rollback "web rollout failed"
fi
wait_healthy clipupp-web "${HEALTH_TIMEOUT:-120}" || rollback "web did not become healthy"

compose up -d --no-deps --pull never backup >/dev/null 2>&1 || log "backup sidecar not started (ignored)"

if [ -n "$PREVIOUS_TAG" ]; then echo "$PREVIOUS_TAG" > "$PREVIOUS_FILE"; fi
echo "$TAG" > "$CURRENT_FILE"
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
log "== deployed $TAG"
