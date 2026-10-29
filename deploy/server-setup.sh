#!/usr/bin/env bash
#
# One-time host preparation for Clipupp on the shared Hostinger VPS. Idempotent: every step
# checks before it changes anything, and every step that must hold is asserted afterwards.
#   sudo bash deploy/server-setup.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root" >&2; exit 1; }
APP=/opt/clipupp

# docker-rollout, pinned by tag, commit and content hash. To upgrade: pick the release, download
# https://raw.githubusercontent.com/wowu/docker-rollout/<commit>/docker-rollout, read it, and
# update all three values.
ROLLOUT_VERSION=v0.14

echo "== preflight"
id deploy >/dev/null 2>&1 || { echo "user deploy does not exist; create it first" >&2; exit 1; }
# Command output is captured before grep -q reads it: under pipefail, grep -q closing the pipe
# early can kill the writer with SIGPIPE and fail the check at random.
groups_of_deploy="$(id -nG deploy)"
grep -qw docker <<<"$groups_of_deploy" || { echo "deploy is not in the docker group" >&2; exit 1; }
docker network inspect r2r_default >/dev/null || { echo "shared Caddy network r2r_default missing" >&2; exit 1; }

echo "== swap"
swaps="$(swapon --show)"
if ! grep -q /swapfile <<<"$swaps"; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
  fi
  swapon /swapfile
fi
grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
if ! grep -q '^vm.swappiness=10' /etc/sysctl.d/99-clipupp.conf 2>/dev/null; then
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-clipupp.conf
  sysctl -q -p /etc/sysctl.d/99-clipupp.conf
fi

echo "== fail2ban"
if ! dpkg -s fail2ban >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban >/dev/null
fi
printf '[sshd]\nenabled = true\nmaxretry = 5\nbantime = 1h\n' > /etc/fail2ban/jail.d/sshd.local
systemctl enable --now fail2ban >/dev/null 2>&1
systemctl reload fail2ban

echo "== sshd: key-only root"
# A drop-in, not an edit of sshd_config: Ubuntu includes sshd_config.d/*.conf first and the first
# value wins, so editing the main file is overridden by any provider drop-in. 50-clipupp sorts
# before 50-cloud-init; the assertion below catches any earlier file that still wins.
SSHD_DROPIN=/etc/ssh/sshd_config.d/50-clipupp.conf
if [ "$(cat "$SSHD_DROPIN" 2>/dev/null || true)" != "PermitRootLogin prohibit-password" ]; then
  install -d -m 0755 /etc/ssh/sshd_config.d
  echo "PermitRootLogin prohibit-password" > "$SSHD_DROPIN"
  chmod 644 "$SSHD_DROPIN"
fi
install -d -m 0755 /run/sshd   # sshd -t needs it; absent while ssh is socket-activated and idle
sshd -t
# sshd -T prints the canonical name, which older OpenSSH spells without-password.
sshd_effective="$(sshd -T 2>/dev/null)"
if ! grep -Eqi '^permitrootlogin (prohibit-password|without-password)$' <<<"$sshd_effective"; then
  echo "sshd still allows root password login; an earlier file in /etc/ssh/sshd_config.d overrides $SSHD_DROPIN:" >&2
  grep -ri permitrootlogin /etc/ssh/sshd_config /etc/ssh/sshd_config.d/ >&2 || true
  exit 1
fi
systemctl try-reload-or-restart ssh

echo "== docker log defaults"
if [ ! -f /etc/docker/daemon.json ]; then
  printf '{\n  "log-driver": "json-file",\n  "log-opts": { "max-size": "20m", "max-file": "5" }\n}\n' > /etc/docker/daemon.json
  echo "   wrote /etc/docker/daemon.json; it applies to containers created after the next docker restart"
  echo "   (every Clipupp service sets its own log limits in compose, so no restart is forced here)"
else
  echo "   /etc/docker/daemon.json exists; left unchanged"
fi

echo "== $APP skeleton"
install -d -o deploy -g deploy -m 0755 "$APP" "$APP/scripts"
install -d -o deploy -g deploy -m 0700 "$APP/backups" "$APP/.deploy" "$APP/.docker" "$APP/.docker/cli-plugins"

echo "== docker rollout plugin $ROLLOUT_VERSION (zero-downtime web deploys)"
# Into Clipupp's own docker client config (DOCKER_CONFIG=$APP/.docker, which CD and the scripts
# use), never into /home/deploy/.docker, which other stacks on this host share.
PLUGIN_DIR="$APP/.docker/cli-plugins"
PLUGIN="$PLUGIN_DIR/docker-rollout"
# The plugin is vendored at deploy/docker-rollout (upstream v0.14 plus a one-line patch: Compose v5
# exits non-zero on a bare "docker compose", which upstream uses to detect Compose). It ships next
# to this script, so nothing is downloaded at bootstrap time.
SRC="$(cd "$(dirname "$0")" && pwd)/docker-rollout"
[ -f "$SRC" ] || { echo "docker-rollout not found next to this script at $SRC" >&2; exit 1; }
install -o deploy -g deploy -m 0755 "$SRC" "$PLUGIN"
rollout_version="$(su -s /bin/sh deploy -c "DOCKER_CONFIG=$APP/.docker docker rollout --version" 2>&1 || true)"
grep -qF "$ROLLOUT_VERSION" <<<"$rollout_version" \
  || { echo "docker rollout $ROLLOUT_VERSION not usable by deploy with DOCKER_CONFIG=$APP/.docker" >&2; exit 1; }
# compose must come from a system plugin directory, because the private config hides ~/.docker.
su -s /bin/sh deploy -c "DOCKER_CONFIG=$APP/.docker docker compose version" >/dev/null 2>&1 \
  || { echo "docker compose is not usable with DOCKER_CONFIG=$APP/.docker (install docker-compose-plugin system-wide)" >&2; exit 1; }

echo "== health probe cron"
CRON_SCRIPT="$APP/scripts/healthcheck-notify.sh"
CRON_LINE="*/5 * * * * $CRON_SCRIPT >> $APP/.deploy/health-cron.log 2>&1"
# Other stacks on this host keep their own entries in the deploy user's crontab (some with a script
# of the same name), so only lines naming Clipupp's full script path are replaced.
crontab_before="$(crontab -u deploy -l 2>/dev/null || true)"
echo "   deploy crontab before:"; printf '%s\n' "${crontab_before:-(empty)}"
{ if [ -n "$crontab_before" ]; then grep -vF "$CRON_SCRIPT" <<<"$crontab_before" || true; fi; echo "$CRON_LINE"; } | crontab -u deploy -
echo "   deploy crontab after:"; crontab -u deploy -l | sed 's/^/     /'

echo "== checks"
su -s /bin/sh deploy -c 'docker info >/dev/null' || { echo "deploy cannot run docker" >&2; exit 1; }
echo "server-setup: done"
