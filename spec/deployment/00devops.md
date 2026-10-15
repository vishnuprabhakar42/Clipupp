# Clipupp DevOps: CI/CD, containers, and the Hostinger VPS

Status: approved design, implementation in progress (branch `devops-cicd`).
Last updated: 2026-10-15.
This file is the single source of truth for how Clipupp is built, shipped, run, backed up, and rolled back.
Every deployment-related decision lands here; the runbook sections at the end are what an operator follows at 2 a.m.

## 1. Goals and decisions

Goals:

- Every merge to `main` runs the full CI suite for both apps, builds immutable images, and deploys to production after one manual approval.
- One-command rollback that does not touch data, plus a documented path to restore the database.
- Everything runs in Docker on the existing Hostinger VPS alongside the other projects there.
- Operators learn about every deploy and every outage from Telegram.
- Daily encrypted backups with an off-site copy and a rehearsed restore.

Decisions taken with Vishnu on 2026-10-15:

| Topic | Decision |
| --- | --- |
| Server | Existing Hostinger KVM VPS `187.127.130.103` shared with two other compose projects |
| Domain | `clipupp.com` and `www.clipupp.com` (DNS currently on Vercel, to be moved) |
| Database | Postgres 16 container on the VPS with a named volume |
| Environments | Production only; no staging in this phase |
| Production gate | Manual approval in a GitHub Environment named `production` |
| Observability | Essentials: health checks, log rotation, uptime probe, deploy notifications, backups |
| Notifications | Telegram bot to a private chat |
| CD transport | SSH from GitHub-hosted runners as the `deploy` user |
| Pipeline repo | `vishnuprabhakar42/Clipupp`; images under `ghcr.io/vishnuprabhakar42` |

## 2. Server facts (audit of 2026-10-15)

- Ubuntu 24.04.4 LTS, kernel 6.8, 1 vCPU, 3.8 GB RAM, 48 GB disk (35 GB free), no swap, time zone UTC.
- Docker 29.7.2, Docker Compose v5.5.0, no `/etc/docker/daemon.json`.
- Ports 80 and 443 are owned by `r2r-caddy-1` (Caddy 2.11), part of `/opt/r2r/docker-compose.prod.yml`, network `r2r_default`.
  Its config is `/opt/r2r/Caddyfile`; other projects append site blocks there and reload with `docker compose -f /opt/r2r/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile`.
  The file must be edited in place (`sed -i` or a redirect), never replaced by `scp`, because the container holds the inode.
- `/opt/opaks-lms` is the pattern we mirror: GHCR images tagged by git SHA, `scripts/deploy.sh <sha>` with a pre-migration dump and automatic rollback, `scripts/rollback.sh`, nightly encrypted backups, `.deploy/{current,previous}` state files.
- Containers use about 1 GB of RAM today, so roughly 2.3 GB remain for Clipupp.
- `deploy` user exists (uid 1000, groups `docker`, `users`), two SSH keys authorised.
- `ufw` allows OpenSSH, 80, 443. `unattended-upgrades` is active. No fail2ban. `PermitRootLogin yes`.
- A self-hosted GitHub Actions runner exists but is registered to the `opaks-lms` repository only; Clipupp does not use it.
- `clipupp.com` resolves to Vercel (`76.76.21.21`), `www` to a Vercel CNAME.

## 3. Application facts that shape the deployment

Backend (`backend/clipupp`):

- Two-stage Dockerfile already exists (Temurin 21 JDK alpine build, JRE alpine runtime, non-root user `clipupp`, `JAVA_OPTS` with `MaxRAMPercentage=75`, `SPRING_PROFILES_ACTIVE=prod`). It lacks a `HEALTHCHECK`.
- Actuator probes are enabled; `/actuator/health`, `/actuator/health/**` and `/actuator/info` are public. Readiness is `/actuator/health/readiness`.
- Flyway runs on boot. `server.shutdown` is graceful (30 s default phase timeout).
- The outbox poller selects rows without locking, so two backend instances would dispatch the same message twice. We add `FOR UPDATE SKIP LOCKED` so overlap becomes safe.
- Caffeine caches and Bucket4j rate limits are in-process; a restart clears them. Acceptable for one instance.
- `application-dev.yml` carries live Cloudflare R2 credentials. They move to environment variables with empty dev defaults, and the exposed keys get rotated.
- Logs are one-line JSON on stdout in the prod profile.

Frontend (`frontend/clipupp`):

- No Dockerfile, no `output: "standalone"`, no health route.
- `next.config.mjs` reads `BACKEND_URL` at build time for the `/api/v1/*`, `/r/*`, `/postback/*`, `/actuator/*` rewrites, so the image is built with `BACKEND_URL=http://backend:8080`.
- `NEXT_PUBLIC_*` values are inlined at build time: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL` (empty string so the browser stays same-origin), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_MEDIA_ORIGIN`.
- The root layout reads cookies, so pages render per request; fetch-level revalidation still applies.
- OG image routes use the edge runtime, which `next start` supports in a self-hosted build.
- `public/` is 28 MB and ships inside the image.

## 4. Target architecture

```
Internet
  |
  v
r2r-caddy-1 (shared Caddy, :80/:443, TLS via Let's Encrypt)   network r2r_default
  |  clipupp.com, www.clipupp.com, clipupp.187-127-130-103.sslip.io
  v
clipupp-web (Next.js standalone, :3000)                       networks r2r_default + clipupp_default
  |  next.config.mjs rewrites /api/v1, /r, /postback, /actuator -> http://backend:8080
  v
clipupp-backend (Spring Boot, :8080)                          network clipupp_default
  |
  v
clipupp-db (Postgres 16, :5432, not published)                network clipupp_default
clipupp-backup (nightly pg_dump, encrypted, copied to R2)     network clipupp_default
```

All browser traffic terminates at Caddy and reaches the backend only through the Next.js server, exactly as in development.
The `clipupp_rt` refresh cookie therefore keeps its same-origin behaviour.

### 4.1 Files on the server

```
/opt/clipupp/                      owned by deploy:deploy
  docker-compose.prod.yml          copied from deploy/docker-compose.prod.yml by CD
  .env                             mode 600, the only place runtime secrets live
  .backup-key                      mode 600, AES-256 passphrase for backups (keep an off-server copy)
  clipupp.caddy                    the site block, appended to /opt/r2r/Caddyfile once
  scripts/                         deploy.sh rollback.sh restore.sh backup.sh backup-key.sh env-upsert.sh healthcheck-notify.sh
  backups/                         mode 700, nightly and pre-deploy dumps
  .deploy/current .deploy/previous .deploy/deploy.log .deploy/health-state
```

### 4.2 Compose services (`deploy/docker-compose.prod.yml`, project name `clipupp`)

| Service | Image | Limits | Health | Notes |
| --- | --- | --- | --- | --- |
| `clipupp-db` | `postgres:16-alpine` | 512m, shm 128m | `pg_isready` | volume `clipupp-db-data`, `expose 5432` only |
| `clipupp-backend` | `ghcr.io/vishnuprabhakar42/clipupp-backend:${IMAGE_TAG}` | 896m | `GET /actuator/health/readiness` | `JAVA_OPTS -XX:MaxRAMPercentage=70`, `stop_grace_period 35s`, env from `.env` |
| `clipupp-web` | `ghcr.io/vishnuprabhakar42/clipupp-web:${IMAGE_TAG}` | 512m | `GET /api/health` | joins `edge` (external `r2r_default`) |
| `clipupp-backup` | `postgres:16` | 128m | none | nightly dump at 02:30 UTC, 30-day retention, `rclone` copy to R2 |

Every service uses the `json-file` log driver with `max-size 20m`, `max-file 5`, and `restart: unless-stopped`.
Service DNS names inside the project are `db`, `backend`, `web`; container names carry the `clipupp-` prefix so they are unambiguous on the shared host.

### 4.3 Caddy site block (`deploy/clipupp.caddy`)

- `clipupp.com`: `encode zstd gzip`, `request_body max_size 12MB` (backend multipart ceiling), headers `-Server`, HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`; the CSP stays in Next.
  `reverse_proxy clipupp-web:3000` with `health_uri /api/health`, `health_interval 30s`, `header_up X-Forwarded-Proto {scheme}`; JSON access log to stdout.
- `www.clipupp.com`: permanent redirect to `https://clipupp.com{uri}`.
- `clipupp.187-127-130-103.sslip.io`: serves the site before the DNS cutover, then becomes a permanent redirect to `clipupp.com`.

### 4.4 Host bootstrap (`deploy/server-setup.sh`, run once as root, idempotent)

- 2 GB swapfile with `vm.swappiness=10`.
- `fail2ban` with the `sshd` jail.
- `PermitRootLogin prohibit-password` (key-only root; both existing root keys keep working).
- `/etc/docker/daemon.json` with `json-file` defaults (`20m` x `5`) and a daemon reload.
- `/opt/clipupp` skeleton with the ownership and modes above.
- Cron entry for `deploy`: `*/5 * * * * /opt/clipupp/scripts/healthcheck-notify.sh`.
- Verifies the `deploy` user can run `docker`.

## 5. Images

### 5.1 Backend

`backend/clipupp/Dockerfile` keeps its two stages and gains:

- `HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 CMD wget -qO- http://localhost:8080/actuator/health/readiness || exit 1`.
- OCI labels `org.opencontainers.image.source` and `org.opencontainers.image.revision` (build arg `GIT_SHA`).

### 5.2 Frontend

New `frontend/clipupp/Dockerfile`, three stages on `node:20-alpine`:

1. `deps`: `npm ci --omit=dev=false` with the lockfile only.
2. `build`: copies the source, receives build args `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL` (default empty), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_MEDIA_ORIGIN`, `BACKEND_URL` (default `http://backend:8080`), `GIT_SHA`; runs `npm run build` with `NEXT_TELEMETRY_DISABLED=1`.
3. `runner`: non-root `nextjs` user, copies `.next/standalone`, `.next/static`, `public`, installs `sharp` for linux-x64-musl, `HEALTHCHECK` on `/api/health`, `CMD ["node", "server.js"]`, `PORT=3000`, `HOSTNAME=0.0.0.0`.

`next.config.mjs` gains `output: "standalone"`.
A new route `app/api/health/route.ts` returns `{ ok: true, version, backend: "up" | "down" }` with a 2-second probe of `http://backend:8080/actuator/health/readiness`.
It returns 200 even when the backend is down so Caddy keeps routing to the web container; the smoke test reads the `backend` field.

### 5.3 Tags and registry

- `ghcr.io/vishnuprabhakar42/clipupp-backend` and `ghcr.io/vishnuprabhakar42/clipupp-web`.
- Tags `sha-<40-character git sha>` (immutable, what deploys reference) and `latest` (convenience only).
- `linux/amd64`, buildx with the GitHub Actions cache.
- Images are never built on the VPS.

## 6. CI (`.github/workflows/ci.yml`)

Triggers: `pull_request` and `push` to `main`.
Concurrency group `ci-${{ github.ref }}`, cancel in progress on pull requests only.

Jobs:

- `changes`: `dorny/paths-filter` marks `backend`, `frontend`, `deploy`, `workflows`.
- `backend` (when backend or workflows changed): Temurin 21, Gradle cache, `./gradlew build` (unit tests plus the Testcontainers integration test), JUnit report artifact.
- `frontend` (when frontend or workflows changed): Node 20 with npm cache, `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, production `next start` with the demo feed, `npm run test:e2e`, `npm run lhci` on pull requests only, Playwright artifacts on failure.
- `shell` (when deploy changed): `shellcheck` on every script, `docker compose -f deploy/docker-compose.prod.yml config` with a dummy env.
- `images` (always on `main`, and on pull requests that touched an app): buildx both images with the GHA cache; on pull requests build only; on `main` push `sha-` and `latest`; Trivy scan of each built image with `--severity CRITICAL --exit-code 1 --ignore-unfixed`.
- `gitleaks` on pull requests.

`.github/dependabot.yml` covers npm in `/frontend/clipupp`, gradle in `/backend/clipupp`, `github-actions`, and `docker` for both Dockerfiles, weekly, with minor and patch updates grouped.

Removed: `backend-ci.yml`, `frontend-ci.yml`, `backend-deploy.yml`, `openapi-sync.yml`, `lighthouse-ci.yml`, `backend/clipupp/railway.json`, `frontend/clipupp/vercel.json`.
`DEPLOYMENT.md` at the repo root becomes a short pointer to this file.

## 7. CD (`.github/workflows/deploy.yml`)

Trigger: `workflow_run` of "CI" completed with success on `main`, or `workflow_dispatch` with an optional `sha` input.
Concurrency group `deploy-production`, never cancelled.

Jobs:

1. `notify-start`: Telegram message with sha, author, commit subject, run link.
2. `deploy` in environment `production` (required reviewer: Vishnu; environment URL `https://clipupp.com`):
   - Checks out the sha.
   - Loads `DEPLOY_SSH_KEY` into an agent, pins the host key from `DEPLOY_HOST_KEY`.
   - `scp` `deploy/docker-compose.prod.yml`, `deploy/clipupp.caddy`, and `deploy/scripts/*` to `/opt/clipupp`, so the server always runs the committed version.
   - Over SSH: `echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin`, then `cd /opt/clipupp && scripts/deploy.sh sha-<sha>`.
3. `smoke` (from the runner against `https://clipupp.com`, or the sslip host before cutover): `/` is 200, `/hi` is 200, `/api/health` says `backend: up`, `/api/v1/homepage` is 200, the HTML contains no `cashback`, the certificate is valid.
4. `notify-result`: Telegram success or failure, with the rollback command.

### 7.1 `scripts/deploy.sh <tag>`

1. Refuse to run without `.env`; record `PREVIOUS_TAG` from `.deploy/current`.
2. `docker compose pull` the backend and web images; if the pull fails but both images exist locally, continue.
3. `up -d db` and wait for `pg_isready`.
4. Pre-migration dump: encrypted `pg_dump` to `backups/pre-deploy-<tag>-<timestamp>.sql.gz.enc`, verified by decrypting and `gzip -t`. A failed dump aborts the deploy before anything changes.
5. `up -d backend` (recreate on the new tag; Flyway migrates on boot). Wait up to 180 s for the container to be healthy.
6. `docker rollout web` if the plugin is installed (starts the new web container, waits for health, removes the old one); otherwise `up -d web`. Wait up to 120 s for health.
7. `up -d backup` and prune images older than 7 days.
8. Write `.deploy/previous` and `.deploy/current`, log `== deployed <tag>`.
9. On any failure after step 2: redeploy `PREVIOUS_TAG` for backend and web, log that the database was not restored and name the dump, exit 1.

Known limit: recreating the backend container means roughly 30 seconds of API 502s per deploy on this 1 vCPU host, because two JVMs would not fit comfortably.
The web container deploys with zero downtime.
A blue-green backend becomes the upgrade when the VPS grows; the outbox lock added in this phase makes that safe.

### 7.2 Rollback (`.github/workflows/rollback.yml` and `scripts/rollback.sh`)

- `workflow_dispatch` with optional input `tag`; environment `production` approval; same SSH path; runs `scripts/rollback.sh [tag]`; then the smoke job and a Telegram message.
- `rollback.sh` with no argument returns to `.deploy/previous`; with a tag it deploys that tag; `--with-db <dump>` additionally restores the database after the operator types `RESTORE`.
- Rollback never pulls from the registry if the image is present locally, so it works even when the CI token has expired.

### 7.3 Backups and restore

- `clipupp-backup` dumps nightly at 02:30 UTC with `pg_dump --no-owner --no-privileges`, gzip, AES-256-CBC with PBKDF2 (passphrase in `.backup-key`), verifies by decrypting, keeps 30 days, and copies the newest file to the R2 bucket `clipupp-backups` with `rclone` (credentials in `.env`).
- `scripts/backup.sh` runs the same dump by hand.
- `scripts/restore.sh <dump> --yes` drops and recreates the database from a dump; `rollback.sh --with-db` wraps it with a confirmation.
- Restore drill: monthly, restore the newest dump into a scratch database on the VPS and run a row-count query; record the date in section 11.

### 7.4 Uptime probe

`scripts/healthcheck-notify.sh` runs every 5 minutes from cron as `deploy`, requests `https://clipupp.com/api/health` and `https://clipupp.com/actuator/health`, and posts to Telegram only when the state changes (down, or recovered), with the state kept in `.deploy/health-state`.

## 8. Configuration and secrets

### 8.1 Server `.env` (documented in `deploy/.env.production.example`)

`IMAGE_TAG`, `POSTGRES_PASSWORD`, `DB_URL=jdbc:postgresql://db:5432/clipupp_db`, `DB_USERNAME`, `DB_PASSWORD`, `DB_POOL_SIZE`, `JWT_SECRET`, `PUBLIC_SITE_URL`, `API_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `COOKIE_SECURE=true`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_ENDPOINT`, `R2_REGION`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `EDGE_NETWORK=r2r_default`, `BACKUP_RETAIN_DAYS=30`, `RCLONE_CONFIG_R2_TYPE=s3`, `RCLONE_CONFIG_R2_PROVIDER=Cloudflare`, `RCLONE_CONFIG_R2_ACCESS_KEY_ID`, `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY`, `RCLONE_CONFIG_R2_ENDPOINT`, `BACKUP_BUCKET=clipupp-backups`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

`scripts/env-upsert.sh KEY VALUE` edits one key in place without printing values.

### 8.2 GitHub

Environment `production` with Vishnu as required reviewer.
Secrets: `DEPLOY_SSH_KEY` (a new ed25519 key generated for CI, public half appended to `/home/deploy/.ssh/authorized_keys`), `DEPLOY_HOST`, `DEPLOY_HOST_KEY` (output of `ssh-keyscan`), `DEPLOY_USER=deploy`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
Variables: `SITE_URL` (`https://clipupp.187-127-130-103.sslip.io` before cutover, `https://clipupp.com` after).
`GITHUB_TOKEN` with `packages: write` pushes images and performs the registry login on the server.

### 8.3 Secrets hygiene

- No secret is ever committed; `gitleaks` guards pull requests.
- `application-dev.yml` loses the R2 keys; dev reads them from the environment with empty defaults.
- The previously committed R2 access key is rotated in Cloudflare before the first production deploy.
- Rotation runbook in section 10.

## 9. Cutover plan

1. Run `deploy/server-setup.sh` as root.
2. Create `/opt/clipupp/.env` from the example with production values; create `.backup-key`.
3. Append `deploy/clipupp.caddy` to `/opt/r2r/Caddyfile` and reload Caddy; the sslip host gets a certificate.
4. Create the GitHub environment and secrets; `SITE_URL` points at the sslip host.
5. Run `deploy.yml` by hand for the current `main` sha; approve; smoke passes on the sslip host.
6. Verify by hand: sign in, reveal a coupon, admin login, sitemap, robots, OG image.
7. Switch `clipupp.com` A record and `www` to `187.127.130.103` (TTL 300 first), wait for propagation, Caddy issues the certificates.
8. Set `SITE_URL` to `https://clipupp.com`; change the sslip block to a redirect; remove the Vercel project.
9. Run the rollback workflow once to prove it, then redeploy `main`.

## 10. Runbooks

Deploy the current `main`: merge a pull request, wait for CI, approve the `production` job in the Actions run.

Deploy a specific sha: Actions, "Deploy", "Run workflow", enter the sha, approve.

Roll back: Actions, "Rollback", "Run workflow" (optional tag), approve.
On the server by hand: `cd /opt/clipupp && scripts/rollback.sh`.

Undo a migration: `scripts/rollback.sh --with-db backups/pre-deploy-<tag>-<time>.sql.gz.enc`, type `RESTORE`.
Every row written since that dump is lost.

Read logs: `docker logs --since 1h clipupp-backend`, `docker logs --since 1h clipupp-web`, `docker logs --since 1h r2r-caddy-1 | grep clipupp.com`.

Change a secret: `scripts/env-upsert.sh KEY 'value'` then `docker compose -f docker-compose.prod.yml up -d backend web`.

Rotate the R2 keys: create a new token in Cloudflare, `env-upsert.sh R2_ACCESS_KEY` and `R2_SECRET_KEY`, restart backend, delete the old token.

Rotate the deploy key: generate a new ed25519 pair, append the public half to `authorized_keys`, update `DEPLOY_SSH_KEY`, remove the old line.

Restore drill: `scripts/restore.sh --target clipupp_drill backups/<newest>` then `docker exec clipupp-db psql -U $DB_USERNAME -d clipupp_drill -c 'select count(*) from coupon'`, then drop the drill database.

Disk pressure: `docker system df`, `docker image prune -a --filter until=168h`, check `backups/` size.

Resize the VPS: after upgrading, raise `mem_limit` values in compose and `DB_POOL_SIZE`, redeploy; consider the blue-green backend.

## 11. Log of changes to this document

- 2026-10-15: initial design approved and written (Fable 5.1 with Vishnu).
