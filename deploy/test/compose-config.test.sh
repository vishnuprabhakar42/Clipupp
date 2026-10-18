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
# docker rollout scales clipupp-web to two replicas, so it must not have a fixed container name;
# Caddy finds it by its service name on the edge network instead.
! grep -q 'container_name: clipupp-web' <<<"$cfg" || fail "clipupp-web must not set container_name (docker rollout)"
# The edge network is shared with other stacks: compose registers each service name as a DNS name
# on every network the service joins. Only clipupp-web may join it, no service may carry a bare
# name such as web, and web reaches the backend by its unique container name.
json_cfg="$(docker compose --env-file "$tmp/.env" -f "$tmp/docker-compose.prod.yml" config --format json)"
edge_report="$(python3 -c '
import json, sys
c = json.load(sys.stdin)
svcs = c["services"]
print("services=" + ",".join(sorted(svcs)))
print("on_edge=" + ",".join(sorted(n for n, s in svcs.items() if "edge" in (s.get("networks") or {}))))
w = svcs.get("clipupp-web", {})
print("web_networks=" + ",".join(sorted(w.get("networks") or {})))
print("web_backend_url=" + str((w.get("environment") or {}).get("BACKEND_URL")))
' <<<"$json_cfg")"
grep -qx 'on_edge=clipupp-web' <<<"$edge_report" || fail "only clipupp-web may join the shared edge network ($edge_report)"
grep -qx 'web_networks=default,edge' <<<"$edge_report" || fail "clipupp-web must be on default (backend) and edge (Caddy) ($edge_report)"
! grep -qE '^services=(.*,)?web(,|$)' <<<"$edge_report" || fail "no service may be named web ($edge_report)"
grep -qE '^services=(.*,)?clipupp-web(,|$)' <<<"$edge_report" || fail "service clipupp-web missing ($edge_report)"
grep -qx 'web_backend_url=http://clipupp-backend:8080' <<<"$edge_report" || fail "web must reach the backend by its container name ($edge_report)"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-backend:sha-test' <<<"$cfg" || fail "backend image tag not applied"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-web:sha-test' <<<"$cfg" || fail "web image tag not applied"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-backup:sha-test' <<<"$cfg" || fail "backup image tag not applied"
grep -q 'PGPASSWORD: x' <<<"$cfg" || fail "backup PGPASSWORD missing"
grep -q 'user: 1000:1000' <<<"$cfg" || fail "backup must run as deploy (uid:gid 1000:1000 by default)"
backup_block="$(awk '/^  backup:/{f=1;next} /^[a-z]/{f=0} /^  [a-z]/{f=0} f' docker-compose.prod.yml)"
! grep -q 'env_file' <<<"$backup_block" || fail "backup must not receive the full .env"
grep -q 'name: r2r_default' <<<"$cfg" || fail "edge network not external r2r_default"
! grep -qE '^\s+ports:' <<<"$cfg" || fail "no service may publish ports; Caddy owns 80/443"
grep -q 'max-size: 20m' <<<"$cfg" || fail "log rotation missing"
echo "compose-config.test.sh: ok"
