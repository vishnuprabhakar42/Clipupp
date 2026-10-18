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
ROLLOUT_COMMIT=a72a9632c38187abd6d8799e4a9d5054a67fe615
ROLLOUT_SHA256=cdeaba6ae9eee3b0b606286e585bbda6787283d801a6ad6d9b9d2bc347fda05b

echo "== preflight"
id deploy >/dev/null 2>&1 || { echo "user deploy does not exist; create it first" >&2; exit 1; }
id -nG deploy | tr ' ' '\n' | grep -qx docker || { echo "deploy is not in the docker group" >&2; exit 1; }
docker network inspect r2r_default >/dev/null || { echo "shared Caddy network r2r_default missing" >&2; exit 1; }

echo "== swap"
if ! swapon --show | grep -q /swapfile; then
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
if ! sshd -T 2>/dev/null | grep -Eqi '^permitrootlogin (prohibit-password|without-password)$'; then
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

echo "== docker rollout plugin $ROLLOUT_VERSION (zero-downtime web deploys)"
PLUGIN_DIR=/home/deploy/.docker/cli-plugins
PLUGIN="$PLUGIN_DIR/docker-rollout"
if [ "$(sha256sum "$PLUGIN" 2>/dev/null | cut -d' ' -f1)" != "$ROLLOUT_SHA256" ]; then
  install -d -o deploy -g deploy "/home/deploy/.docker" "$PLUGIN_DIR"
  tmp="$(mktemp)"
  curl -fsSL "https://raw.githubusercontent.com/wowu/docker-rollout/$ROLLOUT_COMMIT/docker-rollout" -o "$tmp"
  if ! echo "$ROLLOUT_SHA256  $tmp" | sha256sum -c --quiet -; then
    rm -f "$tmp"
    echo "docker-rollout checksum mismatch; refusing to install it" >&2
    exit 1
  fi
  install -o deploy -g deploy -m 0755 "$tmp" "$PLUGIN"
  rm -f "$tmp"
fi
su -s /bin/sh deploy -c 'docker rollout --version' | grep -q "$ROLLOUT_VERSION" \
  || { echo "docker rollout $ROLLOUT_VERSION not usable by deploy" >&2; exit 1; }

echo "== $APP skeleton"
install -d -o deploy -g deploy -m 0755 "$APP" "$APP/scripts"
install -d -o deploy -g deploy -m 0700 "$APP/backups" "$APP/.deploy"

echo "== health probe cron"
CRON_LINE="*/5 * * * * $APP/scripts/healthcheck-notify.sh >> $APP/.deploy/health-cron.log 2>&1"
{ crontab -u deploy -l 2>/dev/null | grep -v healthcheck-notify || true; echo "$CRON_LINE"; } | crontab -u deploy -

echo "== checks"
su -s /bin/sh deploy -c 'docker info >/dev/null' || { echo "deploy cannot run docker" >&2; exit 1; }
echo "server-setup: done"
