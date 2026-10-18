#!/usr/bin/env bash
# The production compose file must be valid and carry the invariants the spec names.
set -euo pipefail
cd "$(dirname "$0")/.."
fail() { echo "FAIL: $*" >&2; exit 1; }
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
printf "IMAGE_TAG='sha-test'\nPOSTGRES_PASSWORD='x'\nDB_USERNAME='u'\nDB_PASSWORD='x'\nBACKUP_BUCKET='b'\nRCLONE_CONFIG_R2_TYPE='s3'\nRCLONE_CONFIG_R2_PROVIDER='Cloudflare'\nRCLONE_CONFIG_R2_ACCESS_KEY_ID='k'\nRCLONE_CONFIG_R2_SECRET_ACCESS_KEY='s'\nRCLONE_CONFIG_R2_ENDPOINT='https://e'\nEDGE_NETWORK='r2r_default'\n" > "$tmp/.env"
# env_file: .env resolves next to the compose file, so validate a copy beside a stub .env.
cp docker-compose.prod.yml "$tmp/docker-compose.prod.yml"
cfg="$(docker compose --env-file "$tmp/.env" -f "$tmp/docker-compose.prod.yml" config)"
for name in clipupp-db clipupp-backend clipupp-backup; do
  grep -q "container_name: $name" <<<"$cfg" || fail "missing $name"
done
# docker rollout scales web to two replicas, so web must not have a fixed container name;
# Caddy finds it through the edge network alias instead.
! grep -q 'container_name: clipupp-web' <<<"$cfg" || fail "web must not set container_name (docker rollout)"
web_cfg="$(docker compose --env-file "$tmp/.env" -f "$tmp/docker-compose.prod.yml" config --format json \
  | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)["services"]["web"]["networks"]))')"
grep -q '"edge": {"aliases": \["clipupp-web"\]}' <<<"$web_cfg" || fail "web needs the edge alias clipupp-web (got $web_cfg)"
grep -q '"default"' <<<"$web_cfg" || fail "web must stay on the default network to reach backend"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-backend:sha-test' <<<"$cfg" || fail "backend image tag not applied"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-web:sha-test' <<<"$cfg" || fail "web image tag not applied"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-backup:sha-test' <<<"$cfg" || fail "backup image tag not applied"
grep -q 'PGPASSWORD: x' <<<"$cfg" || fail "backup PGPASSWORD missing"
! awk '/^  backup:/{f=1;next} /^[a-z]/{f=0} f' docker-compose.prod.yml | grep -q 'env_file' || fail "backup must not receive the full .env"
grep -q 'name: r2r_default' <<<"$cfg" || fail "edge network not external r2r_default"
! grep -qE '^\s+ports:' <<<"$cfg" || fail "no service may publish ports; Caddy owns 80/443"
grep -q 'max-size: 20m' <<<"$cfg" || fail "log rotation missing"
echo "compose-config.test.sh: ok"
