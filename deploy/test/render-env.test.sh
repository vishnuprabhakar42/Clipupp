#!/usr/bin/env bash
# Tests for deploy/render-env.sh. Run: bash deploy/test/render-env.test.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }

required_env() {
  export IMAGE_TAG=sha-abc POSTGRES_PASSWORD=p DB_USERNAME=u DB_PASSWORD=p JWT_SECRET=0123456789abcdef0123456789abcdef \
    PUBLIC_SITE_URL=https://x API_BASE_URL=https://x CORS_ALLOWED_ORIGINS=https://x EMAIL_PROVIDER=logging EMAIL_FROM=a@b \
    RESEND_API_KEY=r R2_BUCKET=b R2_PUBLIC_BASE_URL=https://r2 R2_ENDPOINT=https://e R2_ACCESS_KEY=k R2_SECRET_KEY=s \
    GOOGLE_CLIENT_ID=g RCLONE_CONFIG_R2_ACCESS_KEY_ID=k RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=s RCLONE_CONFIG_R2_ENDPOINT=https://e \
    BACKUP_BUCKET=clipupp-backups TELEGRAM_BOT_TOKEN=t TELEGRAM_CHAT_ID=1
}

# 1. every required key present: file written, mode 600, derived keys filled
( required_env; ./render-env.sh "$tmp/env" )
[ "$(stat -c %a "$tmp/env" 2>/dev/null || stat -f %Lp "$tmp/env")" = "600" ] || fail "mode is not 600"
grep -q "^DB_URL='jdbc:postgresql://db:5432/clipupp_db'$" "$tmp/env" || fail "DB_URL not derived"
grep -q "^COOKIE_SECURE='true'$" "$tmp/env" || fail "COOKIE_SECURE default missing"
grep -q "^EDGE_NETWORK='r2r_default'$" "$tmp/env" || fail "EDGE_NETWORK default missing"
grep -q "^IMAGE_TAG='sha-abc'$" "$tmp/env" || fail "IMAGE_TAG missing"

# 2. a missing required key fails with exit 2 and names it, and writes nothing
set +e
( required_env; unset JWT_SECRET; ./render-env.sh "$tmp/env2" 2>"$tmp/err" ); code=$?
set -e
[ "$code" = "2" ] || fail "expected exit 2, got $code"
grep -q 'JWT_SECRET' "$tmp/err" || fail "missing key not named"
[ ! -e "$tmp/env2" ] || fail "file written despite missing key"

# 3. an empty required key counts as missing
set +e
( required_env; export RESEND_API_KEY=""; ./render-env.sh "$tmp/env3" 2>/dev/null ); code=$?
set -e
[ "$code" = "2" ] || fail "empty key accepted"

# 4. values with spaces and symbols survive verbatim
( required_env; export EMAIL_FROM='Clipupp <hello@clipupp.com>'; ./render-env.sh "$tmp/env4" )
grep -qF "EMAIL_FROM='Clipupp <hello@clipupp.com>'" "$tmp/env4" || fail "value not quoted verbatim"

# 5. a value containing a single quote, newline or CR is rejected with exit 2 and nothing is written
for bad in "it's" $'a\nb' $'a\rb'; do
  set +e
  ( required_env; export JWT_SECRET="$bad"; ./render-env.sh "$tmp/env5" 2>"$tmp/err5" ); code=$?
  set -e
  [ "$code" = "2" ] || fail "unsafe value accepted (exit $code)"
  grep -q 'JWT_SECRET' "$tmp/err5" || fail "unsafe key not named"
  [ ! -e "$tmp/env5" ] || fail "file written despite unsafe value"
done

echo "render-env.test.sh: ok"
