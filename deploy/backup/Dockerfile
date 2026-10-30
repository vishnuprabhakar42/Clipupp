# Backup sidecar image: postgres client, openssl, rclone and the backup script baked in.
# The build context is the deploy/ directory (not the repo root), so COPY paths are relative to it:
#   docker build -f deploy/backup/Dockerfile -t clipupp-backup:local deploy
# CI builds with `context: deploy`, `file: deploy/backup/Dockerfile`.
FROM postgres:18-alpine

# gosu ships in the base image for the official entrypoint's root-to-postgres drop. This sidecar
# runs as uid 1000 with its own entrypoint and never calls it, and its Go build carries CVEs
# (crypto/tls, CVE-2025-68121) that Trivy rightly fails the build on, so it goes.
RUN apk add --no-cache bash openssl rclone && rm -f /usr/local/bin/gosu

COPY scripts/backup.sh /usr/local/bin/clipupp-backup
COPY backup/entrypoint.sh /usr/local/bin/clipupp-backup-loop
RUN chmod 755 /usr/local/bin/clipupp-backup /usr/local/bin/clipupp-backup-loop

ARG GIT_SHA=unknown
LABEL org.opencontainers.image.source="https://github.com/vishnuprabhakar42/Clipupp" \
      org.opencontainers.image.revision="${GIT_SHA}"

CMD ["/usr/local/bin/clipupp-backup-loop"]
