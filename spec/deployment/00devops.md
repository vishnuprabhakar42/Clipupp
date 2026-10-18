# Clipupp DevOps: CI/CD, containers, and the Hostinger VPS

Status: approved design, implementation in progress (branch `devops-cicd`).
Last updated: 2026-10-15.
This file is the single source of truth for how Clipupp is built, shipped, run, backed up, and rolled back.
Every deployment-related decision lands here; the runbook sections at the end are what an operator follows at 2 a.m.

## 1. Goals and decisions

Goals:

- Every merge to `main` runs the full CI suite for both apps, builds immutable images, and production is deployed by a manual run of the Deploy workflow on `main`.
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
| Production gate | Manual run only: Actions, Deploy, Run workflow on `main`. The environment `production` has a deployment branch rule of `main` only, enforced by GitHub, so a job that declares the environment can run only from `main`. Environment secrets are readable only by jobs that declare `environment: production`. The `resolve` job's ref check and ancestor check are a second layer. Required reviewers are unavailable on this repository's plan, so there is no approval click. A paid plan that supports environment required reviewers restores the approval gate: re-add the reviewer rule on the environment, no workflow change needed. |
| Observability | Essentials: health checks, log rotation, uptime probe, deploy notifications, backups |
| Notifications | Telegram bot to a private chat |
| CD transport | SSH from GitHub-hosted runners as the `deploy` user |
| Secrets | GitHub Environment secrets are the only store; CD renders the server `.env` from them on every deploy |
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
- `next.config.mjs` reads `BACKEND_URL` at build time for the `/api/v1/*`, `/r/*`, `/postback/*`, `/actuator/*` rewrites, so the image is built with `BACKEND_URL=http://clipupp-backend:8080` (the backend's container name, see 4.2).
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
  |  next.config.mjs rewrites /api/v1, /r, /postback, /actuator -> http://clipupp-backend:8080
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
  .env                             mode 600, rendered by CD from GitHub secrets on every deploy, never edited by hand
                                   (deploy.sh and rollback.sh rewrite only its IMAGE_TAG line to the running release)
  .backup-key                      mode 600, AES-256 passphrase for backups, rendered from the BACKUP_KEY secret
  clipupp.caddy                    the site block, appended to /opt/r2r/Caddyfile once
  scripts/                         deploy.sh rollback.sh restore.sh backup.sh healthcheck-notify.sh
  backups/                         mode 700, nightly and pre-deploy dumps, .last-backup-ok (epoch of the last full backup)
  .deploy/current .deploy/previous .deploy/deploy.log .deploy/lock
  .deploy/run.out .deploy/run.rc .deploy/run.pid     the last detached deploy or rollback: log, exit status, pid
  .deploy/health-state .deploy/health-fails .deploy/backup-state .deploy/backup-watch-since .deploy/health-cron.log
```

### 4.2 Compose services (`deploy/docker-compose.prod.yml`, project name `clipupp`)

| Service | Image | Limits | Health | Notes |
| --- | --- | --- | --- | --- |
| `clipupp-db` | `postgres:16-alpine` | 512m, shm 128m | `pg_isready` | volume `clipupp-db-data`, `expose 5432` only |
| `clipupp-backend` | `ghcr.io/vishnuprabhakar42/clipupp-backend:${IMAGE_TAG}` | 896m | `GET /actuator/health/readiness` | `JAVA_OPTS -XX:MaxRAMPercentage=70`, `stop_grace_period 35s`, env from `.env` |
| `clipupp-clipupp-web-<n>` | `ghcr.io/vishnuprabhakar42/clipupp-web:${IMAGE_TAG}` | 512m | `GET /api/health` | service `clipupp-web`, no `container_name`; the only service that joins `edge` (external `r2r_default`) |
| `clipupp-backup` | `ghcr.io/vishnuprabhakar42/clipupp-backup:${IMAGE_TAG}` | 128m | none | nightly dump at 02:30 UTC, 30-day retention, `rclone` copy to R2, scoped environment only |

Every service uses the `json-file` log driver with `max-size 20m`, `max-file 5`, and `restart: unless-stopped`.
Compose service names are `db`, `backend`, `clipupp-web` and `backup`; fixed container names carry the `clipupp-` prefix so they are unambiguous on the shared host.
Compose registers a service's name as a DNS name on every network the service joins, and `r2r_default` is shared with the other stacks on the host.
So the one service that joins it is named `clipupp-web`, never a bare `web`, and no other Clipupp service joins it; `db`, `backend` and `backup` stay on `clipupp_default` only.
The web container reaches the backend as `http://clipupp-backend:8080`, the backend's container name, which is unique on the host, instead of the bare service name `backend` that a container of another stack on `r2r_default` could also answer to.
`deploy/test/compose-config.test.sh` pins all of this: no service named `web`, only `clipupp-web` on `edge`, and that `BACKEND_URL`.
`clipupp-web` has no fixed `container_name`, because `docker rollout` runs a second replica beside the first during a deploy and compose refuses to scale a service with a fixed name.
Its containers are `clipupp-clipupp-web-<n>`, and Caddy reaches whichever are running by the service name (`clipupp-web:3000`).
Scripts find web containers with `docker compose ps -q clipupp-web`, never by name.

### 4.3 Caddy site block (`deploy/clipupp.caddy`)

- `clipupp.com`: `encode zstd gzip`, `request_body max_size 12MB` (backend multipart ceiling), headers `-Server`, HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`; the CSP stays in Next.
  `reverse_proxy clipupp-web:3000` with `health_uri /api/health`, `health_interval 30s`, `header_up X-Forwarded-Proto {scheme}`; JSON access log to stdout.
- `www.clipupp.com`: permanent redirect to `https://clipupp.com{uri}`.
- `clipupp.187-127-130-103.sslip.io`: serves the site before the DNS cutover, then becomes a permanent redirect to `clipupp.com`.

### 4.4 Host bootstrap (`deploy/server-setup.sh`, run once as root, idempotent)

- 2 GB swapfile with `vm.swappiness=10`.
- `fail2ban` with the `sshd` jail.
- `PermitRootLogin prohibit-password` (key-only root; both existing root keys keep working), written as the drop-in `/etc/ssh/sshd_config.d/50-clipupp.conf`, because Ubuntu reads the drop-ins before `sshd_config` and the first value wins.
  The script runs `sshd -t`, then asserts with `sshd -T` that the effective value is `prohibit-password` (printed as `without-password` by OpenSSH 9.6), fails if an earlier drop-in overrides it, and only then reloads ssh.
- `/etc/docker/daemon.json` with `json-file` defaults (`20m` x `5`) when the file does not exist yet; it applies after the next docker restart, which the script does not force because every service sets its own log limits.
- The `docker rollout` CLI plugin for `deploy`, pinned to release `v0.14` (commit `a72a9632c38187abd6d8799e4a9d5054a67fe615`) and verified against the SHA-256 `cdeaba6ae9eee3b0b606286e585bbda6787283d801a6ad6d9b9d2bc347fda05b` embedded in the script.
  A mismatch fails the setup and installs nothing; an installed copy with a different hash is replaced.
- `/opt/clipupp` skeleton with the ownership and modes above.
- Cron entry for `deploy`: `*/5 * * * * /opt/clipupp/scripts/healthcheck-notify.sh >> /opt/clipupp/.deploy/health-cron.log 2>&1`.
- Verifies first that the `deploy` user exists and is in the `docker` group and that `r2r_default` exists, and last that `deploy` can run `docker`.

## 5. Images

### 5.1 Backend

`backend/clipupp/Dockerfile` keeps its two stages and gains:

- `HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 CMD wget -qO- http://localhost:8080/actuator/health/readiness || exit 1`.
- OCI labels `org.opencontainers.image.source` and `org.opencontainers.image.revision` (build arg `GIT_SHA`).

### 5.2 Frontend

New `frontend/clipupp/Dockerfile`, three stages on `node:20-alpine`:

1. `deps`: `npm ci --omit=dev=false` with the lockfile only.
2. `build`: copies the source, receives build args `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL` (default empty), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_MEDIA_ORIGIN`, `BACKEND_URL` (default `http://clipupp-backend:8080`, also the runner stage default), `GIT_SHA`; runs `npm run build` with `NEXT_TELEMETRY_DISABLED=1`.
3. `runner`: non-root `nextjs` user, copies `.next/standalone`, `.next/static`, `public`, installs `sharp` for linux-x64-musl, `HEALTHCHECK` on `/api/health`, `CMD ["node", "server.js"]`, `PORT=3000`, `HOSTNAME=0.0.0.0`.

`next.config.mjs` gains `output: "standalone"`.
A new route `app/api/health/route.ts` returns `{ ok: true, version, backend: "up" | "down" }` with a 2-second probe of `$BACKEND_URL/actuator/health/readiness` (`http://clipupp-backend:8080` in production).
It returns 200 even when the backend is down so Caddy keeps routing to the web container; the smoke test reads the `backend` field.

### 5.3 Tags and registry

- `ghcr.io/vishnuprabhakar42/clipupp-backend` and `ghcr.io/vishnuprabhakar42/clipupp-web`.
- Tags `sha-<40-character git sha>` (immutable, what deploys reference) and `latest` (convenience only).
- `linux/amd64`, buildx with the GitHub Actions cache.
- Images are never built on the VPS.

### 5.4 Backup image

The backup sidecar is a third image, `ghcr.io/vishnuprabhakar42/clipupp-backup`, built from `deploy/backup/Dockerfile` on `postgres:16-alpine`.
It bakes in `bash`, `openssl`, `rclone`, `scripts/backup.sh` (as `/usr/local/bin/clipupp-backup`) and an entrypoint loop that runs the backup at 02:30 UTC, so nothing is installed at container start.
The build context is the `deploy/` directory (`context: deploy`, `file: deploy/backup/Dockerfile`).
The container does not read `.env`; compose passes it only `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `BACKUP_RETAIN_DAYS`, `BACKUP_BUCKET` and the `RCLONE_CONFIG_R2_*` keys.

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

Trigger: `workflow_dispatch` only, with an optional `sha` input.
There is no `workflow_run` trigger, so a merge never deploys by itself and a fork pull request can never reach the production secrets.
The `resolve` job fails unless `github.ref` is `refs/heads/main`.
When `sha` is given, `resolve` checks out `main` with full history and fails unless `git merge-base --is-ancestor <sha> origin/main` holds; the default is `github.sha`, which is the head of `main`.
Concurrency group `deploy-production`, never cancelled.
The deployment branch rule on the `production` environment (`main` only) is a required setup item and is enforced by GitHub, not by the workflow text; the checks above are a second layer.

Jobs:

1. `notify-start`: Telegram message with sha, author, run link.
2. `deploy` in environment `production` (no required reviewer, see section 1; deployment branch rule `main` only; environment URL `SITE_URL`):
   - Checks out the sha.
   - Loads `DEPLOY_SSH_KEY` into an agent, pins the host key from `DEPLOY_HOST_KEY`.
   - Preflight over SSH: fail if `.deploy/run.pid` names a live process (`kill -0`) or if `.deploy/lock` is held (`flock -n .deploy/lock true` fails), so nothing on the server is touched while another deploy, rollback or restore runs.
   - `scp` `deploy/docker-compose.prod.yml`, `deploy/clipupp.caddy`, and `deploy/scripts/*` to `/opt/clipupp`, so the server always runs the committed version.
   - One SSH call runs `docker login ghcr.io -u $GITHUB_ACTOR --password-stdin` with the token on stdin.
   - A second SSH call starts `scripts/deploy.sh sha-<sha>` detached as described in 7.1, and a third follows its output and returns its exit status.
3. `smoke` (from the runner against `https://clipupp.com`, or the sslip host before cutover): `/` is 200, `/hi` is 200, `/api/health` says `backend: up` and `"version"` equal to the full sha, `/api/v1/homepage` is 200, the HTML contains no `cashback`, the certificate is valid.
4. `notify-result`: Telegram success or failure, with the rollback command.

`notify-start`, `smoke` and `notify-result` declare no environment, so they read `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (repository secrets) and `SITE_URL` (repository variable).

### 7.1 `scripts/deploy.sh <tag>`

CD starts it detached from the SSH session, so a dropped connection or a cancelled job cannot kill it halfway and its output never goes to a dead pipe.
One ssh runs `setsid nohup bash -c '( scripts/deploy.sh <tag>; echo $? > .deploy/run.rc ) > .deploy/run.out 2>&1 < /dev/null' &` and writes `$!` to `.deploy/run.pid`.
A second ssh runs `tail -n +1 --pid="$(cat .deploy/run.pid)" -f .deploy/run.out` and exits with the contents of `.deploy/run.rc`, where a missing file counts as 1.
That follow reconnects only when ssh itself fails with 255; the `wait` builtin cannot be used because the follow is not the parent.
Before launching, the workflow refuses to run if `.deploy/run.pid` is alive or `.deploy/lock` is held, and the launcher's own ssh repeats both checks before it touches any `.deploy/run.*` file.

1. Validate the tag, take the host lock `.deploy/lock` (`flock`, non-blocking; a second deploy, rollback or restore fails at once with a clear message), refuse to run without `.env`, record `PREVIOUS_TAG` from `.deploy/current`.
2. `docker compose pull` the backend, web and backup images; if the pull fails but the images exist locally, continue.
3. `up -d db` and wait up to 60 s for `pg_isready`; after that the deploy fails without touching backend or web.
4. Pre-migration dump: encrypted `pg_dump` to `backups/pre-deploy-<tag>-<timestamp>.sql.gz.enc`, verified by decrypting and `gzip -t`. A failed dump aborts the deploy before anything changes.
   From here on the deploy is armed (see step 9).
5. `up -d backend` (recreate on the new tag; Flyway migrates on boot). Wait up to 180 s for the container to be healthy.
6. `docker rollout -t 120 clipupp-web` if the plugin is installed (starts the new web container, waits for health, removes the old one; on failure it removes the new one and the old one keeps serving); otherwise `up -d clipupp-web`. Then wait up to 120 s until every container `compose ps -q clipupp-web` lists is healthy.
7. `up -d backup`. If the sidecar does not start, the deploy still succeeds, but the log says so and Telegram gets a notice that nightly backups are not running.
8. Rewrite `IMAGE_TAG='<tag>'` in `.env`, write `.deploy/previous` (only when the tag changed, so redeploying the current tag keeps the rollback target) and `.deploy/current`, prune dangling images older than 7 days, log `== deployed <tag>`.
9. Once armed, any non-zero exit, whether a failed compose call, a failed health wait, or SIGINT, SIGTERM or SIGHUP, runs the rollback exactly once from the script's EXIT trap: backend and web are recreated on `PREVIOUS_TAG`, their health is checked, `.env` gets `IMAGE_TAG='<previous>'`, and Telegram gets the true outcome ("rolled back to X and healthy" or "rollback to X FAILED, manual action needed").
   The database is not restored; the log names the dump and the command to undo the migration (`scripts/rollback.sh <previous> --with-db <dump>`).
   The exit status is 1.
   When there is no previous tag, or the failed deploy was a redeploy of the current tag, nothing is rolled back and the message says so.

Known limit: recreating the backend container means roughly 30 seconds of API 502s per deploy on this 1 vCPU host, because two JVMs would not fit comfortably.
The web container deploys with zero downtime.
A blue-green backend becomes the upgrade when the VPS grows; the outbox lock added in this phase makes that safe.

### 7.2 Rollback (`.github/workflows/rollback.yml` and `scripts/rollback.sh`)

- `workflow_dispatch` with optional input `tag`; environment `production` approval; same SSH path; runs `scripts/rollback.sh [tag]`; then the smoke job and a Telegram message.
- `rollback.sh` with no argument returns to `.deploy/previous`; with a tag it deploys that tag; `--with-db <dump>` additionally restores the database after the operator types `RESTORE`.
- Rollback checks the local images first with `docker image inspect` and pulls only the ones that are missing, so it works even when the CI token has expired; if an image is neither local nor pullable it stops before touching anything.
- It takes the same host lock as `deploy.sh`, waits for backend and web to be healthy, then rewrites `IMAGE_TAG` in `.env` and the state files; any failure posts "rollback to X FAILED" to Telegram.

### 7.3 Backups and restore

- `clipupp-backup` dumps nightly at 02:30 UTC with `pg_dump --no-owner --no-privileges`, gzip, AES-256-CBC with PBKDF2 (passphrase in `.backup-key`), verifies by decrypting, keeps 30 days, and copies the newest file to the R2 bucket `clipupp-backups` with `rclone` (credentials in `.env`).
- `backup.sh` exits 1 when the dump fails and 3 when the dump is fine but the off-site copy failed or `BACKUP_BUCKET` is set and `rclone` is missing.
  Only a fully successful run writes the epoch seconds to `backups/.last-backup-ok`, which the uptime probe watches (section 7.4).
- `docker exec clipupp-backup clipupp-backup` runs the same backup by hand; `scripts/backup.sh` on the host does too, but needs `rclone` there for the off-site copy.
- `scripts/restore.sh <dump> [--yes] [--drop-old]` never drops data before the replacement is proven.
  It verifies the dump (decrypt, `gzip -t`, pg_dump header), restores into `clipupp_db_restore_<timestamp>` and counts its coupons, stops backend and web, and in one psql transaction terminates the sessions on `clipupp_db`, renames it to `clipupp_db_old_<timestamp>` and renames the restored copy to `clipupp_db`.
  The old database is kept and the command to drop it is printed; `--drop-old` drops it with `DROP DATABASE ... WITH (FORCE)`.
  Any failure before the swap drops the scratch copy, leaves `clipupp_db` untouched and starts backend and web again on the tag in `.deploy/current`.
  After a successful restore backend and web stay stopped so the data can be checked; the last line prints `IMAGE_TAG='<current tag>' docker compose -f docker-compose.prod.yml up -d backend clipupp-web`.
  `rollback.sh --with-db` wraps it with a confirmation and starts the chosen release itself.
- `--target` must match `^[a-z_][a-z0-9_]{0,62}$` and may not be `postgres`, `template0` or `template1`.
- Restore drill: monthly, `scripts/restore.sh --target clipupp_drill <newest dump>` restores into a scratch database the same way, prints the coupon count and drops the drill database (no prompt, the app is not touched); record the date in section 11.

### 7.4 Uptime probe

`scripts/healthcheck-notify.sh` runs every 5 minutes from cron as `deploy`, requests `https://clipupp.com/api/health` and `https://clipupp.com/actuator/health`, and posts to Telegram only when the state changes (down, or recovered), with the state kept in `.deploy/health-state`.
Two consecutive failed probes count as down (`.deploy/health-fails`), so one slow response or the backend restart during a deploy does not page anyone.
The same probe alerts once when `backups/.last-backup-ok` is older than 36 hours, or still missing a day after the probe first ran, and once more when backups recover (state in `.deploy/backup-state`).

## 8. Configuration and secrets

### 8.1 Server `.env`, rendered by CD

GitHub is the only store of secrets.
The deploy job writes `/opt/clipupp/.env` (mode 600) from the GitHub secrets and variables listed in 8.2 before every deploy (a rollback reuses the `.env` already on the server), so a secret change is "update it in GitHub, run Deploy".
Nobody edits `.env` on the server; a hand edit is overwritten by the next deploy.
Every value is written single-quoted (`KEY='value'`), so docker compose and the bash readers take it literally.
A secret may therefore not contain a single quote, a newline, or a carriage return; `render-env.sh` rejects such a value with exit 2 naming the key, before writing anything.
Keys (documented in `deploy/.env.production.example`): `IMAGE_TAG`, `POSTGRES_PASSWORD`, `DB_URL=jdbc:postgresql://db:5432/clipupp_db`, `DB_USERNAME`, `DB_PASSWORD`, `DB_POOL_SIZE`, `JWT_SECRET`, `PUBLIC_SITE_URL`, `API_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `COOKIE_SECURE=true`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_ENDPOINT`, `R2_REGION`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `EDGE_NETWORK=r2r_default`, `BACKUP_RETAIN_DAYS=30`, `RCLONE_CONFIG_R2_TYPE=s3`, `RCLONE_CONFIG_R2_PROVIDER=Cloudflare`, `RCLONE_CONFIG_R2_ACCESS_KEY_ID`, `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY`, `RCLONE_CONFIG_R2_ENDPOINT`, `BACKUP_BUCKET=clipupp-backups`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
`.backup-key` is rendered the same way from `BACKUP_KEY`.

### 8.2 GitHub

Environment `production` scopes the deploy and application secrets and variables; it has no required reviewer (section 1).
Its deployment branch rule is `main` only; this is a required setup item, enforced by GitHub as a protection rule.
Environment secrets are readable only by jobs that declare `environment: production`, and the branch rule limits those jobs to `main`.
Required reviewers are unavailable on this plan; a paid plan that supports environment required reviewers is the upgrade path.
The notification secrets and `SITE_URL` live at repository level, because the jobs that use them declare no environment.

Deploy access secrets: `DEPLOY_SSH_KEY` (a new ed25519 key generated for CI, public half appended to `/home/deploy/.ssh/authorized_keys`), `DEPLOY_HOST`, `DEPLOY_HOST_KEY` (output of `ssh-keyscan -t ed25519` for exactly the `DEPLOY_HOST` string), `DEPLOY_USER`.
Notification secrets, repository level: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
Application secrets, one GitHub secret per `.env` key that is sensitive: `POSTGRES_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `RESEND_API_KEY`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `RCLONE_CONFIG_R2_ACCESS_KEY_ID`, `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY`, `BACKUP_KEY`.
Non-sensitive settings are environment variables, not secrets, so they stay readable: `SITE_URL` (repository level), `EMAIL_PROVIDER`, `EMAIL_FROM`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_ENDPOINT`, `R2_REGION`, `RCLONE_CONFIG_R2_ENDPOINT`, `BACKUP_BUCKET`, `GOOGLE_CLIENT_ID`, `DB_POOL_SIZE`, `BACKUP_RETAIN_DAYS`.
`GITHUB_TOKEN` with `packages: write` pushes images and performs the registry login on the server.
The deploy job renders `.env` with a template in `deploy/render-env.sh` that fails if any required key is empty, so a missing secret stops the deploy before the server changes.

### 8.3 Secrets hygiene

- No secret is ever committed; `gitleaks` guards pull requests.
- `application-dev.yml` loses the R2 keys; dev reads them from the environment with empty defaults.
- The previously committed R2 access key is rotated in Cloudflare before the first production deploy.
- Rotation runbook in section 10.

## 9. Cutover plan

1. Run `deploy/server-setup.sh` as root.
2. Add every secret and variable from section 8.2 at the scope it names (the Telegram secrets and `SITE_URL` at repository level, the rest in the `production` environment); the first deploy renders `.env` and `.backup-key`.
3. Append `deploy/clipupp.caddy` to `/opt/r2r/Caddyfile` and reload Caddy; the sslip host gets a certificate.
4. `SITE_URL` points at the sslip host for now.
5. Run `deploy.yml` by hand on `main` (Actions, Deploy, Run workflow); smoke passes on the sslip host.
6. Verify by hand: sign in, reveal a coupon, admin login, sitemap, robots, OG image.
7. Switch `clipupp.com` A record and `www` to `187.127.130.103` (TTL 300 first), wait for propagation, Caddy issues the certificates.
8. Set `SITE_URL` to `https://clipupp.com`; change the sslip block to a redirect; remove the Vercel project.
9. Run the rollback workflow once to prove it, then redeploy `main`.

## 10. Runbooks

Deploy the current `main`: merge a pull request, wait for CI, then Actions, "Deploy", "Run workflow" on `main`.

Deploy a specific sha: Actions, "Deploy", "Run workflow" on `main`, enter the sha; it must be an ancestor of `main`.

Roll back: Actions, "Rollback", "Run workflow" (optional tag).
Rollback has its own concurrency group, so it is never queued behind a deploy run; the server lock still refuses to overlap them.
On the server by hand: `cd /opt/clipupp && scripts/rollback.sh`.

Undo a migration: `scripts/rollback.sh <tag> --with-db backups/pre-deploy-<tag>-<time>.sql.gz.enc`, type `RESTORE`.
If the failed deploy already rolled back by itself, `<tag>` is the running release (`cat .deploy/current`).
Every row written since that dump is lost; the replaced database stays as `clipupp_db_old_<timestamp>` until you drop it.

Read logs: `docker logs --since 1h clipupp-backend`, `docker compose -f docker-compose.prod.yml logs --since 1h clipupp-web`, `docker logs --since 1h r2r-caddy-1 | grep clipupp.com`.

Change a secret or setting: update it in GitHub (environment `production`, or repository level for the Telegram secrets and `SITE_URL`), then run Deploy for the current sha; the job re-renders `.env` and restarts what changed.

Rotate the R2 keys: create a new token in Cloudflare, update `R2_ACCESS_KEY` and `R2_SECRET_KEY` in GitHub, run Deploy, delete the old token.

Rotate the deploy key: generate a new ed25519 pair, append the public half to `authorized_keys`, update `DEPLOY_SSH_KEY`, remove the old line.

Restore drill: `scripts/restore.sh --target clipupp_drill backups/<newest>`; it prints the coupon count and drops the drill database itself.

A deploy or rollback refuses to start because of the lock: another one is running (`pgrep -af 'scripts/(deploy|rollback|restore).sh'`); wait for it.

Disk pressure: `docker system df`, check `backups/` size, then `docker image prune -a --filter until=168h`.
That prune also removes the previous release's images when they are older than 7 days, so rollback will have to pull them from GHCR (which needs `docker login ghcr.io`).

Resize the VPS: after upgrading, raise `mem_limit` values in compose and `DB_POOL_SIZE`, redeploy; consider the blue-green backend.

## 11. Log of changes to this document

- 2026-10-15: initial design approved and written (Fable 5.1 with Vishnu).
- 2026-10-15: secrets live only in GitHub; CD renders the server `.env` on every deploy (Vishnu's call).
- 2026-10-18: Task 4 review fixes: web has no `container_name` (edge alias `clipupp-web`) so `docker rollout` works; deploy.sh rolls back from an EXIT trap with verified health; host lock; restore swaps a proven copy in by rename; rollback is local-first; backup freshness marker and alert; sshd drop-in and pinned, checksummed plugin.
- 2026-10-18: local rehearsal passed: isolated from real stacks (own project, container and volume names, preflight refuses to run beside a real one); first deploy on an empty database 27-34 s; second deploy swapped web through the real docker rollout plugin (web container id changed, /api/health answered 85 of 85 polls); rollback, host and in-container backup, and the restore drill (528 coupons) all succeeded. It found and fixed two script bugs (rollout plugin detection, service image resolution).
- 2026-10-18: Task 7 fix round: production deploys are manual runs on `main` only (no `workflow_run`, no reviewer rule on GitHub Free); Telegram secrets and `SITE_URL` are repository level; launcher preflight; rollback has its own concurrency group.
- 2026-10-18: Task 7 fix round 2: the launcher rechecks the pid and lock; the spec states the deployment branch rule as enforced by GitHub.
