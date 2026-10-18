#!/usr/bin/env bash
# Run clipupp-backup every night at 02:30 UTC. A failed run is logged and the loop continues;
# only a fully successful run (dump verified and copied off-site) refreshes
# /backups/.last-backup-ok, and healthcheck-notify.sh on the host alerts when that goes stale.
set -euo pipefail
while true; do
  now="$(date +%s)"
  next=$(( now / 86400 * 86400 + 9000 ))
  if [ "$next" -le "$now" ]; then next=$(( next + 86400 )); fi
  sleep $(( next - now ))
  rc=0; clipupp-backup || rc=$?
  if [ "$rc" != 0 ]; then echo "[backup] run FAILED (exit $rc)" >&2; fi
done
