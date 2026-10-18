#!/usr/bin/env bash
# Control-flow tests for deploy.sh and rollback.sh using a stub `docker`.
# The stub logs every call as "IMAGE_TAG=<env value> docker <args>", so assertions check the
# tag each compose call really ran with, not a log line printed before it.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
fail() { echo "FAIL: $*" >&2; exit 1; }
sandboxes=()
cleanup() { if [ "${#sandboxes[@]}" -gt 0 ]; then rm -rf "${sandboxes[@]}"; fi; }
trap cleanup EXIT
unset COMPOSE_FILE STATE_DIR LOG_FILE CLIPUPP_LOCK_HELD

mk_sandbox() {
  sb="$(mktemp -d)"; sandboxes+=("$sb")
  mkdir -p "$sb/bin" "$sb/app/scripts" "$sb/app/.deploy" "$sb/app/backups"
  cp "$root/scripts/"*.sh "$sb/app/scripts/"
  cp "$root/docker-compose.prod.yml" "$sb/app/"
  # CD renders .env with the tag being deployed before it runs deploy.sh.
  printf "# rendered\nIMAGE_TAG='sha-new'\nDB_USERNAME='u'\nPOSTGRES_PASSWORD='p'\nTELEGRAM_BOT_TOKEN=''\nTELEGRAM_CHAT_ID=''\n" > "$sb/app/.env"
  echo "key" > "$sb/app/.backup-key"
  cat > "$sb/bin/docker" <<'STUB'
#!/usr/bin/env bash
echo "IMAGE_TAG=${IMAGE_TAG:-} docker $*" >> "$STUB_LOG"
echo "${DOCKER_CONFIG:-}" >> "$STUB_DIR/docker-config"
health() {  # health <default>: unhealthy when running the tag under test as the bad one
  if [ -n "${STUB_UNHEALTHY_TAG:-}" ] && [ "${IMAGE_TAG:-}" = "$STUB_UNHEALTHY_TAG" ]; then echo unhealthy; else echo "$1"; fi
}
case "$*" in
  compose*" pull"*) [ "${STUB_PULL_FAILS:-0}" = 1 ] && exit 1; touch "$STUB_DIR/pulled"; exit 0 ;;
  "image inspect"*) if [ "${STUB_IMAGE_MISSING:-0}" = 1 ] && [ ! -f "$STUB_DIR/pulled" ]; then exit 1; fi; exit 0 ;;
  compose*" config")
    printf 'name: clipupp\nservices:\n'
    for s in backup backend clipupp-web db; do printf '  %s:\n    image: ghcr.io/x/%s:%s\n    restart: unless-stopped\n' "$s" "$s" "${IMAGE_TAG:-}"; done
    printf 'networks:\n  default:\n    name: clipupp_default\n'
    exit 0 ;;
  compose*" ps -q backend") echo "cid-backend" ;;
  compose*" ps -q clipupp-web") echo "${STUB_WEB_IDS:-cid-web}" ;;
  compose*" up -d --no-deps --pull never backend")
    if [ "${STUB_UP_FAILS:-0}" = 1 ]; then echo "stub: compose up backend fails" >&2; exit 1; fi
    if [ "${STUB_SIGTERM_PARENT:-0}" = 1 ]; then kill -TERM "$PPID"; fi ;;
  "exec clipupp-db pg_isready"*) exit 0 ;;
  "exec clipupp-db pg_dump"*) [ "${STUB_DUMP_FAILS:-0}" = 1 ] && exit 1; echo "-- dump"; exit 0 ;;
  "inspect -f {{.State.Health.Status}} cid-backend") health "${STUB_BACKEND_HEALTH:-healthy}" ;;
  "inspect -f {{.State.Health.Status}} cid-web2") health "${STUB_WEB2_HEALTH:-${STUB_WEB_HEALTH:-healthy}}" ;;
  "inspect -f {{.State.Health.Status}} cid-web"*) health "${STUB_WEB_HEALTH:-healthy}" ;;
  "rollout --help") if [ "${STUB_ROLLOUT_PRESENT:-1}" = 0 ]; then echo "Usage:  docker rollout [OPTIONS] SERVICE"; else echo "Usage:  docker [OPTIONS] COMMAND"; fi; exit 0 ;;
  "rollout"*) exit "${STUB_ROLLOUT_FAILS:-0}" ;;
  *) exit 0 ;;
esac
STUB
  chmod +x "$sb/bin/docker"
  export STUB_LOG="$sb/calls.log" STUB_DIR="$sb"; : > "$STUB_LOG"
  export PATH="$sb/bin:$ORIG_PATH" HEALTH_TIMEOUT=2 HEALTH_POLL=0
}
ORIG_PATH="$PATH"
# run_deploy <tag> [VAR=value...]: run deploy.sh in the sandbox, set $code.
run_deploy() {
  local tag="$1"; shift
  set +e; ( cd "$sb/app" && env "$@" scripts/deploy.sh "$tag" >/dev/null 2>&1 ); code=$?; set -e
}
line_of() { { grep -nE "$1" "$STUB_LOG" || true; } | head -1 | cut -d: -f1; }
ROLLBACK_UP='^IMAGE_TAG=old docker compose -f docker-compose.prod.yml up -d --no-deps --pull never backend clipupp-web$'
NEW_BACKEND_UP='^IMAGE_TAG=sha-new docker compose -f docker-compose.prod.yml up -d --no-deps --pull never backend$'

# 1. happy path: dump happens before backend up; state files, .env and lock updated
#    (.env still names the old tag here, as after a deploy started by hand)
mk_sandbox; echo old > "$sb/app/.deploy/current"
sed -i.bak "s/^IMAGE_TAG=.*/IMAGE_TAG='old'/" "$sb/app/.env"; rm -f "$sb/app/.env.bak"; chmod 600 "$sb/app/.env"
run_deploy sha-new
[ "$code" = 0 ] || fail "1: happy deploy exited $code"
dump_line=$(line_of 'docker exec clipupp-db pg_dump')
up_line=$(line_of "$NEW_BACKEND_UP")
[ -n "$dump_line" ] && [ -n "$up_line" ] && [ "$dump_line" -lt "$up_line" ] || fail "1: dump must precede backend start"
[ "$(cat "$sb/app/.deploy/current")" = "sha-new" ] || fail "1: current not updated"
[ "$(cat "$sb/app/.deploy/previous")" = "old" ] || fail "1: previous not recorded"
ls "$sb/app/backups"/pre-deploy-sha-new-*.sql.gz.enc >/dev/null 2>&1 || fail "1: pre-deploy dump file missing"
grep -qx "IMAGE_TAG='sha-new'" "$sb/app/.env" || fail "1: .env IMAGE_TAG not rewritten"
grep -qx "DB_USERNAME='u'" "$sb/app/.env" || fail "1: other .env lines changed"
[ "$(stat -c %a "$sb/app/.env" 2>/dev/null || stat -f %Lp "$sb/app/.env")" = 600 ] || fail "1: .env not mode 600"
grep -qE '^IMAGE_TAG=sha-new docker compose .* up -d --no-deps --pull never backup$' "$STUB_LOG" || fail "1: backup sidecar not started"
[ ! -e "$sb/app/.deploy/lock.d" ] || fail "1: lock not released"
! grep -qE "$ROLLBACK_UP" "$STUB_LOG" || fail "1: rolled back on success"

# 1b. every docker call uses the app's private client config when the app has one
mk_sandbox; echo old > "$sb/app/.deploy/current"; mkdir -m 700 "$sb/app/.docker"
run_deploy sha-new
[ "$code" = 0 ] || fail "1b: deploy exited $code"
[ "$(sort -u "$sb/docker-config")" = "$sb/app/.docker" ] || fail "1b: docker ran without DOCKER_CONFIG=$sb/app/.docker ($(sort -u "$sb/docker-config" | tr '\n' ' '))"
( cd "$sb/app" && scripts/rollback.sh >/dev/null 2>&1 ) || fail "1b: rollback failed"
[ "$(sort -u "$sb/docker-config")" = "$sb/app/.docker" ] || fail "1b: rollback ran docker without the private config"

# 2. failed dump aborts before any container changes
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_DUMP_FAILS=1
[ "$code" != 0 ] || fail "2: deploy should fail on dump failure"
grep -q 'docker exec clipupp-db pg_dump' "$STUB_LOG" || fail "2: no dump was attempted"
grep -q 'pre-deploy dump failed' "$sb/app/.deploy/deploy.log" || fail "2: dump failure not logged"
! grep -qE 'up -d .*(backend|web)' "$STUB_LOG" || fail "2: backend or web touched despite dump failure"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "2: current changed on failed deploy"

# 3. unhealthy backend triggers rollback to the previous tag, which is checked and reported
mk_sandbox; echo old > "$sb/app/.deploy/current"; echo older > "$sb/app/.deploy/previous"
run_deploy sha-new STUB_UNHEALTHY_TAG=sha-new
[ "$code" = 1 ] || fail "3: deploy should exit 1 on unhealthy backend (got $code)"
bad_line=$(line_of '^IMAGE_TAG=sha-new docker inspect -f \{\{.State.Health.Status\}\} cid-backend$')
rb_line=$(line_of "$ROLLBACK_UP")
[ -n "$bad_line" ] && [ -n "$rb_line" ] && [ "$rb_line" -gt "$bad_line" ] || fail "3: no compose up of backend web on old after the unhealthy signal"
[ "$(grep -cE "$ROLLBACK_UP" "$STUB_LOG")" = 1 ] || fail "3: rollback ran more than once"
grep -qE '^IMAGE_TAG=old docker inspect .* cid-backend$' "$STUB_LOG" || fail "3: rollback health not checked"
grep -q 'Rolled back to old and healthy' "$sb/app/.deploy/deploy.log" || fail "3: success of rollback not reported"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "3: current changed after rollback"
[ "$(cat "$sb/app/.deploy/previous")" = "older" ] || fail "3: previous changed after rollback"
grep -qx "IMAGE_TAG='old'" "$sb/app/.env" || fail "3: .env IMAGE_TAG not set to the rolled-back tag"

# 3b. a rollback that does not come up healthy is reported as FAILED
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_BACKEND_HEALTH=unhealthy
[ "$code" = 1 ] || fail "3b: expected exit 1 (got $code)"
grep -qE "$ROLLBACK_UP" "$STUB_LOG" || fail "3b: rollback not attempted"
grep -q 'Rollback to old FAILED' "$sb/app/.deploy/deploy.log" || fail "3b: failed rollback reported as success"
! grep -q 'Rolled back to old and healthy' "$sb/app/.deploy/deploy.log" || fail "3b: claimed a healthy rollback"

# 4. rollback uses local images without touching the registry; state and .env follow
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
( cd "$sb/app" && STUB_PULL_FAILS=1 scripts/rollback.sh >/dev/null 2>&1 ) || fail "4: rollback with local images failed"
! grep -q ' pull' "$STUB_LOG" || fail "4: rollback pulled although images are local"
grep -qE "$ROLLBACK_UP" "$STUB_LOG" || fail "4: rollback did not start backend web on old"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "4: rollback did not switch current"
[ "$(cat "$sb/app/.deploy/previous")" = "sha-new" ] || fail "4: rollback did not record previous"
grep -qx "IMAGE_TAG='old'" "$sb/app/.env" || fail "4: .env IMAGE_TAG not rewritten by rollback"

# 4b. rollback pulls only when an image is missing locally, and fails clearly when it cannot
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
( cd "$sb/app" && STUB_IMAGE_MISSING=1 scripts/rollback.sh >/dev/null 2>&1 ) || fail "4b: rollback after pulling missing images failed"
grep -qE '^IMAGE_TAG=old docker compose .* pull --quiet backend clipupp-web$' "$STUB_LOG" || fail "4b: missing images not pulled"
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
set +e; ( cd "$sb/app" && STUB_IMAGE_MISSING=1 STUB_PULL_FAILS=1 scripts/rollback.sh >/dev/null 2>&1 ); code=$?; set -e
[ "$code" != 0 ] || fail "4b: rollback succeeded without images"
! grep -q 'up -d' "$STUB_LOG" || fail "4b: containers touched although images are missing"
grep -q 'rollback to old FAILED' "$sb/app/.deploy/deploy.log" || fail "4b: failure not notified"
[ "$(cat "$sb/app/.deploy/current")" = "sha-new" ] || fail "4b: current changed on failed rollback"

# 5. docker rollout is used for web when available, compose up otherwise (no rollback either way)
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_ROLLOUT_PRESENT=0
[ "$code" = 0 ] || fail "5: deploy with rollout exited $code"
grep -qE '^IMAGE_TAG=sha-new docker rollout -f docker-compose.prod.yml -t [0-9]+ clipupp-web$' "$STUB_LOG" || fail "5: rollout plugin not used when present"
! grep -qE 'up -d --no-deps --pull never clipupp-web$' "$STUB_LOG" || fail "5: web recreated by compose although rollout ran"
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new
[ "$code" = 0 ] || fail "5: deploy without rollout exited $code"
grep -qE '^IMAGE_TAG=sha-new docker compose .* up -d --no-deps --pull never clipupp-web$' "$STUB_LOG" || fail "5: compose up fallback for web missing"
! grep -qE "$ROLLBACK_UP" "$STUB_LOG" || fail "5: missing plugin caused a rollback"

# 5b. a failed rollout (new web never healthy) rolls back
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_ROLLOUT_PRESENT=0 STUB_ROLLOUT_FAILS=1
[ "$code" = 1 ] || fail "5b: expected exit 1 (got $code)"
grep -qE "$ROLLBACK_UP" "$STUB_LOG" || fail "5b: rollout failure did not roll back"

# 5c. web health waits for every web container
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_WEB_IDS="cid-web1 cid-web2" STUB_WEB2_HEALTH=starting
[ "$code" = 1 ] || fail "5c: a web container still starting was accepted (exit $code)"
grep -q 'clipupp-web not healthy after' "$sb/app/.deploy/deploy.log" || fail "5c: timeout on second web container not logged"

# 6. a failing compose up of the new backend triggers the rollback and exit 1
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_UP_FAILS=1
[ "$code" = 1 ] || fail "6: expected exit 1 (got $code)"
up_line=$(line_of "$NEW_BACKEND_UP"); rb_line=$(line_of "$ROLLBACK_UP")
[ -n "$up_line" ] && [ -n "$rb_line" ] && [ "$rb_line" -gt "$up_line" ] || fail "6: no rollback after failed compose up"
[ "$(grep -cE "$ROLLBACK_UP" "$STUB_LOG")" = 1 ] || fail "6: rollback ran more than once"
grep -q 'compose up backend failed' "$sb/app/.deploy/deploy.log" || fail "6: reason not logged"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "6: current changed"

# 6b. an interrupt (SIGTERM, as from a cancelled job) while the backend is being replaced also
#     rolls back exactly once and exits 1
mk_sandbox; echo old > "$sb/app/.deploy/current"
run_deploy sha-new STUB_SIGTERM_PARENT=1
[ "$code" = 1 ] || fail "6b: expected exit 1 after SIGTERM (got $code)"
[ "$(grep -cE "$ROLLBACK_UP" "$STUB_LOG")" = 1 ] || fail "6b: SIGTERM did not roll back exactly once"
grep -q 'interrupted (SIGTERM)' "$sb/app/.deploy/deploy.log" || fail "6b: interrupt reason not logged"
! grep -qE '^IMAGE_TAG=sha-new docker (rollout|compose .* up -d --no-deps --pull never clipupp-web$)' "$STUB_LOG" || fail "6b: kept deploying after SIGTERM"

# 7. redeploying the current tag leaves .deploy/previous untouched
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
run_deploy sha-new
[ "$code" = 0 ] || fail "7: same-tag redeploy exited $code"
[ "$(cat "$sb/app/.deploy/previous")" = "old" ] || fail "7: previous overwritten by same-tag redeploy"
[ "$(cat "$sb/app/.deploy/current")" = "sha-new" ] || fail "7: current wrong"
# ... and when it fails, it says there is nothing different to roll back to
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
run_deploy sha-new STUB_BACKEND_HEALTH=unhealthy
[ "$code" = 1 ] || fail "7: failing same-tag redeploy exited $code"
grep -q 'No rollback' "$sb/app/.deploy/deploy.log" || fail "7: missing no-rollback notice"
[ "$(cat "$sb/app/.deploy/previous")" = "old" ] || fail "7: previous overwritten on failure"

# 8. a held lock stops a second deploy or rollback before anything happens
mk_sandbox; echo old > "$sb/app/.deploy/current"
if command -v flock >/dev/null 2>&1; then
  set +e; ( flock -n 9 && cd "$sb/app" && scripts/deploy.sh sha-new >/dev/null 2>&1 ) 9>"$sb/app/.deploy/lock"; code=$?; set -e
  set +e; ( flock -n 9 && cd "$sb/app" && scripts/rollback.sh old >/dev/null 2>&1 ) 9>"$sb/app/.deploy/lock"; rcode=$?; set -e
else
  mkdir "$sb/app/.deploy/lock.d"
  run_deploy sha-new; set +e; ( cd "$sb/app" && scripts/rollback.sh old >/dev/null 2>&1 ); rcode=$?; set -e
  [ -d "$sb/app/.deploy/lock.d" ] || fail "8: someone else's lock was removed"
fi
[ "$code" = 1 ] && [ "$rcode" = 1 ] || fail "8: ran despite a held lock (deploy $code, rollback $rcode)"
[ ! -s "$STUB_LOG" ] || fail "8: docker called despite a held lock"
grep -q 'another deploy, rollback or restore is running' "$sb/app/.deploy/deploy.log" || fail "8: lock message missing"

# 9. an invalid tag is refused before anything runs
mk_sandbox
run_deploy 'bad tag;rm'
[ "$code" = 2 ] || fail "9: invalid tag accepted (exit $code)"
[ ! -s "$STUB_LOG" ] || fail "9: docker called for an invalid tag"

echo "deploy-flow.test.sh: ok"
