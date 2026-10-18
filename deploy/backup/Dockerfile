# Backup sidecar image: postgres client, openssl, rclone and the backup script baked in.
# The build context is the deploy/ directory (not the repo root), so COPY paths are relative to it:
#   docker build -f deploy/backup/Dockerfile -t clipupp-backup:local deploy
# CI builds with `context: deploy`, `file: deploy/backup/Dockerfile`.
FROM postgres:16-alpine

RUN apk add --no-cache bash openssl rclone

COPY scripts/backup.sh /usr/local/bin/clipupp-backup
COPY backup/entrypoint.sh /usr/local/bin/clipupp-backup-loop
RUN chmod 755 /usr/local/bin/clipupp-backup /usr/local/bin/clipupp-backup-loop

ARG GIT_SHA=unknown
LABEL org.opencontainers.image.source="https://github.com/vishnuprabhakar42/Clipupp" \
      org.opencontainers.image.revision="${GIT_SHA}"

CMD ["/usr/local/bin/clipupp-backup-loop"]
