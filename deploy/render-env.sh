#!/usr/bin/env bash
#
# Render the server .env from the environment GitHub Actions passes in.
#
#   render-env.sh /opt/clipupp/.env
#
# GitHub Environment secrets and variables are the only store of configuration;
# this file is overwritten on every deploy. Every required key must be set and
# non-empty, or the script exits 2 before writing anything, so a missing secret
# stops a deploy before the server changes. Values are written verbatim, single-quoted.
set -euo pipefail

OUT="${1:?usage: render-env.sh <output-file>}"

REQUIRED=(
  IMAGE_TAG
  POSTGRES_PASSWORD DB_USERNAME DB_PASSWORD
  JWT_SECRET
  PUBLIC_SITE_URL API_BASE_URL CORS_ALLOWED_ORIGINS
  EMAIL_PROVIDER EMAIL_FROM RESEND_API_KEY
  R2_BUCKET R2_PUBLIC_BASE_URL R2_ENDPOINT R2_ACCESS_KEY R2_SECRET_KEY
  GOOGLE_CLIENT_ID
  RCLONE_CONFIG_R2_ACCESS_KEY_ID RCLONE_CONFIG_R2_SECRET_ACCESS_KEY RCLONE_CONFIG_R2_ENDPOINT BACKUP_BUCKET
  TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID
)
# key=default; the default applies when the variable is unset or empty.
OPTIONAL=(
  "DB_POOL_SIZE=10"
  "COOKIE_SECURE=true"
  "R2_REGION=auto"
  "EDGE_NETWORK=r2r_default"
  "BACKUP_RETAIN_DAYS=30"
  "RCLONE_CONFIG_R2_TYPE=s3"
  "RCLONE_CONFIG_R2_PROVIDER=Cloudflare"
)

for key in "${REQUIRED[@]}"; do
  if [ -z "${!key:-}" ]; then
    echo "render-env: required key $key is missing or empty" >&2
    exit 2
  fi
done

# POSTGRES_PASSWORD initialises the database role; the backend (DB_PASSWORD) and the backup
# sidecar must log in with that same password. Two secrets that drift apart break one of them, so
# a mismatch stops the deploy here. Rotation is a coordinated runbook (spec section 10).
if [ "$POSTGRES_PASSWORD" != "$DB_PASSWORD" ]; then
  echo "render-env: POSTGRES_PASSWORD and DB_PASSWORD differ; they must be the same password (see the database password runbook)" >&2
  exit 2
fi

# Values are written single-quoted so every reader (compose, bash) takes them literally.
# A single quote, newline or carriage return cannot be represented that way: reject it.
check_value() {
  case "$2" in
    *$'\n'*|*$'\r'*|*"'"*)
      echo "render-env: key $1 contains a newline, carriage return or single quote" >&2
      exit 2 ;;
  esac
}
for key in "${REQUIRED[@]}"; do check_value "$key" "${!key}"; done
for pair in "${OPTIONAL[@]}"; do
  key="${pair%%=*}"; def="${pair#*=}"
  check_value "$key" "${!key:-$def}"
done

umask 077
tmp="$(mktemp "${OUT}.XXXXXX")"
{
  echo "# Rendered by deploy/render-env.sh on $(date -u +%FT%TZ). Do not edit; update GitHub and redeploy."
  for key in "${REQUIRED[@]}"; do
    printf "%s='%s'\n" "$key" "${!key}"
  done
  for pair in "${OPTIONAL[@]}"; do
    key="${pair%%=*}"; def="${pair#*=}"
    printf "%s='%s'\n" "$key" "${!key:-$def}"
  done
  # Derived: the database lives in this compose project.
  echo "DB_URL='jdbc:postgresql://db:5432/clipupp_db'"
  printf "POSTGRES_USER='%s'\n" "$DB_USERNAME"
  echo "POSTGRES_DB='clipupp_db'"
} > "$tmp"
chmod 600 "$tmp"
mv "$tmp" "$OUT"
echo "render-env: wrote $OUT ($(wc -l < "$OUT") keys)"
