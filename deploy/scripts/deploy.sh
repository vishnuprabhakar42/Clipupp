#!/usr/bin/env bash
#
# Deploy one release to this server. Run by CD over SSH; safe to run by hand.
#
#   scripts/deploy.sh sha-<git sha>
#
# CD must start it detached from the SSH session, so a dropped connection or a cancelled job
# cannot kill it halfway (SIGHUP) and its output never goes to a dead pipe:
#
#   setsid nohup bash -c '( scripts/deploy.sh sha-<sha>; echo $? > .deploy/run.rc ) > .deploy/run.out 2>&1 < /dev/null' &
#   echo $! > .deploy/run.pid
#
# and follows it from a second session (a `wait` cannot span sessions):
#
#   tail -n +1 --pid="$(cat .deploy/run.pid)" -f .deploy/run.out; exit "$(cat .deploy/run.rc)"
#
# Order of operations:
#   1. validate the tag, take the host lock (.deploy/lock), read .env, note the current tag
#   2. pull backend, web and backup for <tag> (tolerated if they are already local)
#   3. start the database and wait up to 60 s for pg_isready
#   4. encrypted, verified pre-migration dump; from here on the deploy is "armed"
#   5. recreate backend on the new tag (Flyway migrates on boot), wait for health
#   6. roll web over with zero downtime (docker rollout) or recreate it, wait for health
#   7. start the backup sidecar (a failure is a warning and a Telegram notice, not a rollback)
#   8. write IMAGE_TAG to .env and the state files, prune dangling images
#
# Once armed, ANY non-zero exit (a failed compose call, a failed health wait, SIGINT, SIGTERM,
# SIGHUP) runs the rollback exactly once from the EXIT trap: backend and web go back to the
# previous tag, their health is checked, and Telegram gets the true outcome. The database is
# never restored automatically; the message names the pre-deploy dump. Exit status is 1.
#
# State lives in .deploy/: `current` and `previous` hold image tags. Redeploying the current
# tag leaves `previous` alone.
set -euo pipefail

TAG="${1:?usage: deploy.sh <image-tag>}"
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh source-path=SCRIPTDIR
. scripts/lib.sh
valid_tag "$TAG" || { echo "deploy.sh: not a valid image tag: $TAG" >&2; exit 2; }

BACKEND_TIMEOUT="${HEALTH_TIMEOUT:-180}"
WEB_TIMEOUT="${HEALTH_TIMEOUT:-120}"
DB_TIMEOUT="${DB_READY_TIMEOUT:-60}"
CURRENT_FILE="$STATE_DIR/current"
PREVIOUS_FILE="$STATE_DIR/previous"

PHASE=prepare      # prepare -> armed -> committed; the EXIT trap rolls back only when armed
FAIL_REASON=""
PREVIOUS_TAG=""
DUMP=""

fail() { FAIL_REASON="$1"; exit 1; }

# Put backend and web back on PREVIOUS_TAG and report what really happened.
rollback_release() {
  local reason="$1" target="$PREVIOUS_TAG" why
  log "!! deploy $TAG failed: $reason"
  if [ -z "$target" ] || [ "$target" = "$TAG" ]; then
    if [ -z "$target" ]; then
      why="no previous release is recorded"
    else
      why="$TAG was already the current release, so there is nothing different to return to"
    fi
    log "!! no rollback: $why; backend and web are left as they are"
    notify "Clipupp deploy $TAG FAILED: $reason. No rollback: $why. Manual action needed (scripts/rollback.sh <tag>). Pre-deploy dump: $DUMP"
    return 0
  fi
  log "rolling backend and web back to $target"
  export IMAGE_TAG="$target"
  if ! compose up -d --no-deps --pull never backend clipupp-web; then
    log "!! rollback to $target FAILED: compose up failed"
    notify "Clipupp deploy $TAG FAILED: $reason. Rollback to $target FAILED (compose up), manual action needed."
    return 0
  fi
  set_env_image_tag "$target" || true
  if wait_service_healthy backend "$BACKEND_TIMEOUT" && wait_service_healthy clipupp-web "$WEB_TIMEOUT"; then
    echo "$target" > "$CURRENT_FILE"
    log "rolled back to $target and healthy. The database was NOT restored; to undo the migration: scripts/rollback.sh $target --with-db $DUMP"
    notify "Clipupp deploy $TAG FAILED: $reason. Rolled back to $target and healthy. Database not restored (pre-deploy dump $DUMP)."
  else
    log "!! rollback to $target FAILED: containers not healthy, manual action needed"
    notify "Clipupp deploy $TAG FAILED: $reason. Rollback to $target FAILED (not healthy), manual action needed."
  fi
}

on_exit() {
  local rc=$?
  trap '' INT TERM HUP
  set +e
  if [ "$rc" != 0 ]; then
    case "$PHASE" in
      armed)
        PHASE=rolled-back
        rollback_release "${FAIL_REASON:-aborted (exit $rc)}"
        rc=1 ;;
      prepare)
        log "deploy $TAG aborted before backend or web changed: ${FAIL_REASON:-exit $rc}" ;;
      committed)
        log "!! $TAG is live but a finishing step failed (exit $rc); check .env and $STATE_DIR"
        notify "Clipupp $TAG is live, but deploy.sh failed after the switch (exit $rc). Check .env and $STATE_DIR on the server." ;;
    esac
  fi
  release_lock
  exit "$rc"
}
trap on_exit EXIT
trap 'FAIL_REASON="${FAIL_REASON:-interrupted (SIGINT)}"; exit 130' INT
trap 'FAIL_REASON="${FAIL_REASON:-interrupted (SIGTERM)}"; exit 143' TERM
trap 'FAIL_REASON="${FAIL_REASON:-interrupted (SIGHUP)}"; exit 129' HUP
# A dead stdout must surface as a write error (ignored by log), not kill the script mid-rollback.
trap '' PIPE

acquire_lock
load_env

install -d -m 0700 backups
PREVIOUS_TAG="$(cat "$CURRENT_FILE" 2>/dev/null || true)"
export IMAGE_TAG="$TAG"

log "== deploy $TAG (current: ${PREVIOUS_TAG:-none})"

log "pulling images"
if ! compose pull --quiet backend clipupp-web backup; then
  log "registry pull failed; checking local images"
  for svc in backend clipupp-web backup; do
    img="$(service_image "$svc")"
    docker image inspect "$img" >/dev/null 2>&1 || fail "$img not available locally"
  done
fi

log "starting the database"
compose up -d --quiet-pull db || fail "database container did not start"
deadline=$(( $(date +%s) + DB_TIMEOUT ))
until docker exec "${CONTAINER_PREFIX}-db" pg_isready -q -U "$DB_USERNAME" -d clipupp_db 2>/dev/null; do
  [ "$(date +%s)" -lt "$deadline" ] || fail "database not accepting connections after ${DB_TIMEOUT}s"
  sleep 1
done

DUMP="backups/pre-deploy-$TAG-$(date -u +%Y%m%d-%H%M%S).sql.gz.enc"
log "pre-migration dump -> $DUMP"
if docker exec "${CONTAINER_PREFIX}-db" pg_dump -U "$DB_USERNAME" --no-owner --no-privileges clipupp_db \
     | gzip -9 | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:.backup-key > "$DUMP" \
   && openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:.backup-key < "$DUMP" | gzip -t; then
  chmod 600 "$DUMP"; log "dump ok ($(du -h "$DUMP" | cut -f1))"
else
  rm -f "$DUMP"; fail "pre-deploy dump failed; refusing to migrate without a safety net"
fi

PHASE=armed

log "starting backend on $TAG"
compose up -d --no-deps --pull never backend || fail "compose up backend failed"
wait_service_healthy backend "$BACKEND_TIMEOUT" || fail "backend did not become ready"

log "rolling web over to $TAG"
rc=0; rollout_web "$WEB_TIMEOUT" || rc=$?
if [ "$rc" = 2 ]; then
  log "docker rollout not installed; recreating web"
  compose up -d --no-deps --pull never clipupp-web || fail "compose up web failed"
elif [ "$rc" != 0 ]; then
  fail "web rollout failed (exit $rc)"
fi
wait_service_healthy clipupp-web "$WEB_TIMEOUT" || fail "web did not become healthy"

PHASE=committed

if ! compose up -d --no-deps --pull never backup; then
  log "WARNING: backup sidecar did not start on $TAG; nightly backups are not running"
  notify "Clipupp $TAG deployed, but the backup sidecar did not start. Nightly backups are NOT running until it is fixed."
fi

set_env_image_tag "$TAG"
if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$TAG" ]; then echo "$PREVIOUS_TAG" > "$PREVIOUS_FILE"; fi
echo "$TAG" > "$CURRENT_FILE"
# Removes dangling layers older than 7 days only; tagged releases stay local, so rollback works
# without the registry. Old release tags are not removed automatically (review M3).
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
log "== deployed $TAG"
