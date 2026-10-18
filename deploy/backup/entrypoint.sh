#!/usr/bin/env bash
# Run clipupp-backup every night at 02:30 UTC. A failed run is logged and the loop continues.
set -euo pipefail
while true; do
  now="$(date +%s)"
  next=$(( (now / 86400 + 1) * 86400 + 9000 ))
  sleep $(( next - now ))
  clipupp-backup || echo "[backup] FAILED" >&2
done
