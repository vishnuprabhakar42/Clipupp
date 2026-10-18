#!/usr/bin/env bash
# Control-flow tests for deploy.sh and rollback.sh using a stub `docker`.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
fail() { echo "FAIL: $*" >&2; exit 1; }

mk_sandbox() {
  sb="$(mktemp -d)"
  mkdir -p "$sb/bin" "$sb/app/scripts" "$sb/app/.deploy" "$sb/app/backups"
  cp "$root/scripts/"*.sh "$sb/app/scripts/"
  cp "$root/docker-compose.prod.yml" "$sb/app/"
  printf 'IMAGE_TAG=old\nDB_USERNAME=u\nPOSTGRES_PASSWORD=p\nTELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\n' > "$sb/app/.env"
  echo "key" > "$sb/app/.backup-key"
  cat > "$sb/bin/docker" <<'STUB'
#!/usr/bin/env bash
echo "docker $*" >> "$STUB_LOG"
case "$*" in
  compose*" pull"*) [ "${STUB_PULL_FAILS:-0}" = 1 ] && exit 1; exit 0 ;;
  "image inspect"*) exit 0 ;;
  compose*" config --images"*) echo "ghcr.io/x/img:tag"; exit 0 ;;
  "exec clipupp-db pg_isready"*) exit 0 ;;
  "exec clipupp-db sh -c pg_dump"*|"exec clipupp-db pg_dump"*) [ "${STUB_DUMP_FAILS:-0}" = 1 ] && exit 1; echo "-- dump"; exit 0 ;;
  "inspect -f {{.State.Health.Status}} clipupp-backend") echo "${STUB_BACKEND_HEALTH:-healthy}" ;;
  "inspect -f {{.State.Health.Status}} clipupp-web") echo "${STUB_WEB_HEALTH:-healthy}" ;;
  "rollout --help") exit "${STUB_ROLLOUT_PRESENT:-1}" ;;
  "rollout"*) exit 0 ;;
  "logs"*) exit 0 ;;
  *) exit 0 ;;
esac
STUB
  chmod +x "$sb/bin/docker"
  export STUB_LOG="$sb/calls.log"; : > "$STUB_LOG"
  export PATH="$sb/bin:$PATH" HEALTH_TIMEOUT=2 HEALTH_POLL=0
}

# 1. happy path: dump happens before backend up; state files updated
mk_sandbox; echo old > "$sb/app/.deploy/current"
( cd "$sb/app" && scripts/deploy.sh sha-new >/dev/null )
dump_line=$(grep -n 'pg_dump' "$STUB_LOG" | head -1 | cut -d: -f1)
up_line=$(grep -n 'up -d.*backend' "$STUB_LOG" | head -1 | cut -d: -f1)
[ "$dump_line" -lt "$up_line" ] || fail "dump must precede backend start"
[ "$(cat "$sb/app/.deploy/current")" = "sha-new" ] || fail "current not updated"
[ "$(cat "$sb/app/.deploy/previous")" = "old" ] || fail "previous not recorded"
ls "$sb/app/backups"/pre-deploy-sha-new-*.sql.gz.enc >/dev/null 2>&1 || fail "pre-deploy dump file missing"

# 2. failed dump aborts before any container changes
mk_sandbox; echo old > "$sb/app/.deploy/current"
set +e; ( cd "$sb/app" && STUB_DUMP_FAILS=1 scripts/deploy.sh sha-new >/dev/null 2>&1 ); code=$?; set -e
[ "$code" != 0 ] || fail "deploy should fail on dump failure"
! grep -q 'up -d.*backend' "$STUB_LOG" || fail "backend was started despite dump failure"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "current changed on failed deploy"

# 3. unhealthy backend triggers rollback to previous tag
mk_sandbox; echo old > "$sb/app/.deploy/current"
set +e; ( cd "$sb/app" && STUB_BACKEND_HEALTH=unhealthy scripts/deploy.sh sha-new >/dev/null 2>&1 ); code=$?; set -e
[ "$code" != 0 ] || fail "deploy should fail on unhealthy backend"
grep -q 'IMAGE_TAG=old' "$STUB_LOG" || grep -q 'rolling back to old' "$sb/app/.deploy/deploy.log" || fail "no rollback to previous"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "current changed after rollback"

# 4. rollback works when pull fails but image exists locally
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
( cd "$sb/app" && STUB_PULL_FAILS=1 scripts/rollback.sh >/dev/null )
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "rollback did not switch current"
[ "$(cat "$sb/app/.deploy/previous")" = "sha-new" ] || fail "rollback did not record previous"

# 5. docker rollout is used for web when available, compose up otherwise
mk_sandbox; echo old > "$sb/app/.deploy/current"
( cd "$sb/app" && STUB_ROLLOUT_PRESENT=0 scripts/deploy.sh sha-new >/dev/null )
grep -q 'docker rollout.* web' "$STUB_LOG" || fail "rollout plugin not used when present"
mk_sandbox; echo old > "$sb/app/.deploy/current"
( cd "$sb/app" && scripts/deploy.sh sha-new >/dev/null )
grep -q 'up -d.*web' "$STUB_LOG" || fail "compose up fallback for web missing"

echo "deploy-flow.test.sh: ok"
