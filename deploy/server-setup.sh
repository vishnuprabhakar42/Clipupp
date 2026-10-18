#!/usr/bin/env bash
#
# One-time host preparation for Clipupp on the shared Hostinger VPS. Idempotent.
#   sudo bash deploy/server-setup.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root" >&2; exit 1; }
APP=/opt/clipupp
ROLLOUT_VERSION=v0.14

echo "== swap"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
grep -q '^vm.swappiness=10' /etc/sysctl.d/99-clipupp.conf 2>/dev/null || { echo 'vm.swappiness=10' > /etc/sysctl.d/99-clipupp.conf; sysctl -q -p /etc/sysctl.d/99-clipupp.conf; }

echo "== fail2ban"
if ! dpkg -s fail2ban >/dev/null 2>&1; then DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban >/dev/null; fi
printf '[sshd]\nenabled = true\nmaxretry = 5\nbantime = 1h\n' > /etc/fail2ban/jail.d/sshd.local
systemctl enable --now fail2ban >/dev/null 2>&1; systemctl reload fail2ban || true

echo "== sshd: key-only root"
if ! grep -q '^PermitRootLogin prohibit-password' /etc/ssh/sshd_config; then
  sed -i 's/^PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
  sshd -t && systemctl reload ssh
fi

echo "== docker log defaults"
if [ ! -f /etc/docker/daemon.json ]; then
  printf '{\n  "log-driver": "json-file",\n  "log-opts": { "max-size": "20m", "max-file": "5" }\n}\n' > /etc/docker/daemon.json
  systemctl reload docker 2>/dev/null || systemctl restart docker
fi

echo "== docker rollout plugin $ROLLOUT_VERSION (zero-downtime web deploys)"
PLUGIN_DIR=/home/deploy/.docker/cli-plugins
if [ ! -x "$PLUGIN_DIR/docker-rollout" ]; then
  install -d -o deploy -g deploy "$PLUGIN_DIR"
  curl -fsSL "https://raw.githubusercontent.com/wowu/docker-rollout/$ROLLOUT_VERSION/docker-rollout" -o "$PLUGIN_DIR/docker-rollout"
  chown deploy:deploy "$PLUGIN_DIR/docker-rollout"; chmod +x "$PLUGIN_DIR/docker-rollout"
fi

echo "== $APP skeleton"
install -d -o deploy -g deploy -m 0755 "$APP" "$APP/scripts"
install -d -o deploy -g deploy -m 0700 "$APP/backups" "$APP/.deploy"

echo "== health probe cron"
( crontab -u deploy -l 2>/dev/null | grep -v healthcheck-notify || true; echo "*/5 * * * * $APP/scripts/healthcheck-notify.sh >/dev/null 2>&1" ) | crontab -u deploy -

echo "== checks"
id deploy | grep -q docker || { echo "deploy is not in the docker group" >&2; exit 1; }
docker network inspect r2r_default >/dev/null
echo "server-setup: done"
