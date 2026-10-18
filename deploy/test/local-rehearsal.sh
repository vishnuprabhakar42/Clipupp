#!/usr/bin/env bash
# End-to-end rehearsal of deploy, rollback, backup and restore on this machine with real containers.
# Needs port 3300 or 3301 free, and the images clipupp-backend:local, clipupp-web:local (built with
# --build-arg BACKEND_URL=http://backend:8080) and clipupp-backup:local.
#   bash deploy/test/local-rehearsal.sh
set -euo pipefail

# Preflight: this script runs `docker compose down -v`. Refuse to run next to a real stack, and
# never on the server.
for name in clipupp-db clipupp-backend clipupp-backup; do
  if docker inspect "$name" >/dev/null 2>&1; then echo "refusing to run: container $name exists (a real clipupp stack?)"; exit 1; fi
done
if docker volume inspect clipupp-db-data >/dev/null 2>&1; then echo "refusing to run: volume clipupp-db-data exists (a real clipupp stack?)"; exit 1; fi
rollout_help="$(docker rollout --help 2>&1 || true)"
if ! grep -qi 'usage: *docker rollout' <<<"$rollout_help"; then
  echo "docker-rollout plugin missing; the rehearsal must exercise it. Install (v0.14, user only):"
  echo "  mkdir -p ~/.docker/cli-plugins && curl -fsSL https://github.com/wowu/docker-rollout/releases/download/v0.14/docker-rollout -o ~/.docker/cli-plugins/docker-rollout && chmod +x ~/.docker/cli-plugins/docker-rollout"
  exit 1
fi
root="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"; echo "workdir $work"
cp -R "$root/deploy/scripts" "$root/deploy/render-env.sh" "$root/deploy/docker-compose.prod.yml" "$root/deploy/docker-compose.local.yml" "$work/"
cd "$work"

export IMAGE_TAG=local POSTGRES_PASSWORD=rehearsal DB_USERNAME=clipupp DB_PASSWORD=rehearsal
JWT_SECRET="$(openssl rand -hex 32)"; export JWT_SECRET
export PUBLIC_SITE_URL=http://localhost:3300 API_BASE_URL=http://localhost:3300 CORS_ALLOWED_ORIGINS=http://localhost:3300
export EMAIL_PROVIDER=logging EMAIL_FROM=dev@clipupp.local RESEND_API_KEY=unused
export R2_BUCKET=dev R2_PUBLIC_BASE_URL=http://localhost R2_ENDPOINT=http://localhost R2_ACCESS_KEY=dev R2_SECRET_KEY=dev
export GOOGLE_CLIENT_ID=dev RCLONE_CONFIG_R2_ACCESS_KEY_ID=dev RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=dev
export RCLONE_CONFIG_R2_ENDPOINT=http://localhost BACKUP_BUCKET=dev TELEGRAM_BOT_TOKEN=unused TELEGRAM_CHAT_ID=unused
export COOKIE_SECURE=false EDGE_NETWORK=clipupp-local-edge DB_POOL_SIZE=5 BACKUP_RETAIN_DAYS=1
bash render-env.sh .env
# No R2 here: blank the bucket so a backup counts as local-only success (and the sidecar has no remote).
sed -i.bak "s/^BACKUP_BUCKET=.*/BACKUP_BUCKET=''/" .env && rm -f .env.bak
# Telegram stays unconfigured so the scripts never call out.
sed -i.bak "s/^TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=''/;s/^TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=''/" .env && rm -f .env.bak
unset JWT_SECRET POSTGRES_PASSWORD DB_PASSWORD
head -c 32 /dev/urandom | base64 > .backup-key; chmod 600 .backup-key

export COMPOSE_FILE=docker-compose.prod.yml:docker-compose.local.yml
# An exported COMPOSE_PROJECT_NAME would beat the override's name:, so pin it, then check it.
export COMPOSE_PROJECT_NAME=clipupp-rehearsal CONTAINER_PREFIX=clipupp-rehearsal
resolved="$(docker compose config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["name"])')"
[ "$resolved" = clipupp-rehearsal ] || { echo "refusing to run: compose project resolves to '$resolved'"; exit 1; }
# The backup sidecar runs as this user, as it runs as deploy on the VPS.
BACKUP_UID="$(id -u)"; BACKUP_GID="$(id -g)"; export BACKUP_UID BACKUP_GID
cleanup() { docker compose down -v >/dev/null 2>&1 || true; docker rmi clipupp-backend:local-v2 clipupp-web:local-v2 clipupp-backup:local-v2 >/dev/null 2>&1 || true; cd /; rm -rf "$work"; }
trap cleanup EXIT
web_url() { echo "http://localhost:$(docker compose port web 3000 | head -1 | sed 's/.*://')"; }
step() { echo; echo "=== $* ($(date +%T))"; }

docker tag clipupp-backend:local clipupp-backend:local-v2
docker tag clipupp-web:local clipupp-web:local-v2
docker tag clipupp-backup:local clipupp-backup:local-v2

step "image resolution"
# shellcheck source=/dev/null disable=SC1091
( . scripts/lib.sh; export IMAGE_TAG=local
  for svc in backend web backup; do
    img="$(service_image "$svc")"; echo "$svc -> $img"
    [ "$img" = "clipupp-$svc:local" ] || { echo "service_image $svc resolved wrong"; exit 1; }
  done )

step "first deploy (empty database, Flyway)"
t0=$(date +%s)
scripts/deploy.sh local
echo "first deploy took $(( $(date +%s) - t0 ))s"
health="$(curl -fsS "$(web_url)/api/health")"; echo "health: $health"
grep -q '"backend":"up"' <<<"$health" || { echo "health after first deploy failed"; exit 1; }
curl -fsSL -o /dev/null -w "homepage %{http_code} (after redirects)\n" "$(web_url)/en"

step "second deploy local-v2 (web through docker rollout, health polled throughout)"
web_before="$(docker compose ps -q web)"
: > "$work/health.fail"; : > "$work/health.ok"
( while :; do
    # Caddy reaches web through the edge alias; here a replica may sit on either published port.
    if curl -fsS -m 3 http://localhost:3300/api/health >/dev/null 2>&1 || curl -fsS -m 3 http://localhost:3301/api/health >/dev/null 2>&1; then echo . >> "$work/health.ok"; else echo . >> "$work/health.fail"; fi
    sleep 0.3
  done ) &
poller=$!
scripts/deploy.sh local-v2 | tee "$work/deploy2.out"
kill "$poller" 2>/dev/null || true; wait "$poller" 2>/dev/null || true
web_after="$(docker compose ps -q web)"
grep -q "Scaling 'web' to '2' instances" "$work/deploy2.out" || { echo "docker rollout did not run"; exit 1; }
[ -n "$web_after" ] && [ "$web_before" != "$web_after" ] || { echo "web container id did not change"; exit 1; }
fails="$(wc -l < "$work/health.fail" | tr -d ' ')"; oks="$(wc -l < "$work/health.ok" | tr -d ' ')"
echo "health polls during deploy: $oks ok, $fails failed"
[ "$fails" = 0 ] && [ "$oks" -gt 5 ] || { echo "health endpoint was not answering throughout"; exit 1; }
[ "$(cat .deploy/current)" = "local-v2" ] && [ "$(cat .deploy/previous)" = "local" ] || { echo "state files wrong"; exit 1; }
ls backups/pre-deploy-local-v2-* >/dev/null
grep -q "^IMAGE_TAG='local-v2'" .env || { echo ".env tag not updated"; exit 1; }

running_backup="$(docker compose ps -q --status running backup)"
[ -n "$running_backup" ] || { echo "backup sidecar not running after deploy"; exit 1; }
[ "$(docker exec "$CONTAINER_PREFIX-backup" id -u)" = "$BACKUP_UID" ] || { echo "backup sidecar does not run as uid $BACKUP_UID"; exit 1; }

step "rollback"
scripts/rollback.sh
[ "$(cat .deploy/current)" = "local" ] || { echo "rollback state wrong"; exit 1; }
health="$(curl -fsS "$(web_url)/api/health")"; echo "health: $health"
grep -q '"backend":"up"' <<<"$health" || { echo "health after rollback failed"; exit 1; }

step "backup (host mode and in-container)"
scripts/backup.sh
before="$(find backups -name 'clipupp-*.sql.gz.enc' | sort)"
sleep 1   # backup file names have one-second resolution
docker exec "$CONTAINER_PREFIX-backup" clipupp-backup
after="$(find backups -name 'clipupp-*.sql.gz.enc' | sort)"
sidecar_dump="$(comm -13 <(echo "$before") <(echo "$after") | tail -1)"
[ -n "$sidecar_dump" ] || { echo "in-container backup wrote no new file"; exit 1; }
owner="$(stat -c %u "$sidecar_dump" 2>/dev/null || stat -f %u "$sidecar_dump")"
[ "$owner" = "$(id -u)" ] || { echo "in-container dump owned by uid $owner, not $(id -u)"; exit 1; }
echo "in-container dump $sidecar_dump owned by uid $owner"
[ -f backups/.last-backup-ok ] || { echo ".last-backup-ok missing"; exit 1; }

step "restore drill"
newest="$(find backups -name 'clipupp-*.sql.gz.enc' -print | sort | tail -1)"
scripts/restore.sh "$newest" --target clipupp_drill --yes
echo "local-rehearsal: ok"
