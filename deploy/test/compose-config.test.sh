#!/usr/bin/env bash
# The production compose file must be valid and carry the invariants the spec names.
set -euo pipefail
cd "$(dirname "$0")/.."
fail() { echo "FAIL: $*" >&2; exit 1; }
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
printf 'IMAGE_TAG=sha-test\nPOSTGRES_PASSWORD=x\nDB_USERNAME=u\nDB_PASSWORD=x\nEDGE_NETWORK=r2r_default\n' > "$tmp/.env"
# env_file: .env resolves next to the compose file, so validate a copy beside a stub .env.
cp docker-compose.prod.yml "$tmp/docker-compose.prod.yml"
cfg="$(docker compose --env-file "$tmp/.env" -f "$tmp/docker-compose.prod.yml" config)"
for name in clipupp-db clipupp-backend clipupp-web clipupp-backup; do
  grep -q "container_name: $name" <<<"$cfg" || fail "missing $name"
done
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-backend:sha-test' <<<"$cfg" || fail "backend image tag not applied"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-web:sha-test' <<<"$cfg" || fail "web image tag not applied"
grep -q 'name: r2r_default' <<<"$cfg" || fail "edge network not external r2r_default"
! grep -qE '^\s+ports:' <<<"$cfg" || fail "no service may publish ports; Caddy owns 80/443"
grep -q 'max-size: 20m' <<<"$cfg" || fail "log rotation missing"
echo "compose-config.test.sh: ok"
