# Clipupp CI/CD and VPS Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every merge to `main` runs CI for both apps, builds immutable images, and deploys to the Hostinger VPS after a manual approval, with one-command rollback, Telegram notifications, and encrypted backups.

**Architecture:** GitHub-hosted runners build and scan `ghcr.io/vishnuprabhakar42/clipupp-{backend,web}` tagged by git sha; a `production` environment job renders the server `.env` from GitHub secrets, copies the committed compose file and scripts to `/opt/clipupp`, and runs `scripts/deploy.sh sha-<sha>` over SSH as `deploy`. On the VPS the shared r2r Caddy terminates TLS and proxies to `clipupp-web`, which proxies API paths to `clipupp-backend` through the existing Next.js rewrites; Postgres and a backup sidecar complete the compose project.

**Tech Stack:** Docker 29 / Compose v5, GitHub Actions, GHCR, buildx, Trivy, gitleaks, shellcheck, Caddy 2 (existing), Postgres 16, rclone (R2), Telegram Bot API, Spring Boot 4 / Java 21, Next.js 15 standalone.

**Spec:** `spec/deployment/00devops.md`

## Global Constraints

- No em dash anywhere in files or commits; use a plain dash.
- Never add a co-author line to commits.
- User-facing copy never says "cashback" or "WhatsApp".
- No secret value is ever committed, printed in a log, or pasted into chat; GitHub Environment `production` is the only secret store.
- Images are built only in GitHub Actions, never on the VPS; every deploy references an immutable `sha-<40 hex>` tag.
- Shell scripts: `#!/usr/bin/env bash`, `set -euo pipefail`, pass `shellcheck` with no warnings.
- Compose project name `clipupp`; container names `clipupp-db`, `clipupp-backend`, `clipupp-web`, `clipupp-backup`; service DNS names `db`, `backend`, `web`.
- Memory caps: db 512m, backend 896m, web 512m, backup 128m. Log driver json-file, `max-size 20m`, `max-file 5`.
- Backend health: `GET /actuator/health/readiness`. Web health: `GET /api/health` (always 200 when the web process is up).
- Frontend gates before each frontend commit: `npm run typecheck && npm run lint && npm run test`. Backend gate: `./gradlew test`.
- Markdown written by this plan puts each sentence on its own line.

## Review Focus

1. A deploy whose pre-migration dump fails must stop before any container changes; test in Task 4 (`deploy.sh` exits 1 and leaves `.deploy/current` untouched when `pg_dump` is replaced by a failing stub).
2. A missing or empty GitHub secret must fail the deploy before SSH; test in Task 3 (`render-env.sh` exits 2 naming the key).
3. The web health route must return 200 with `backend: "down"` when the backend is unreachable, so Caddy keeps serving the site shell; test in Task 2 (vitest with a rejected fetch).
4. Two backend instances must never dispatch the same outbox row; test in Task 1 (row locked in one transaction is skipped by `claimForDispatch` in another).
5. Rollback must work when the registry login has expired; test in Task 4 (`rollback.sh` succeeds with `docker compose pull` stubbed to fail while the image exists locally).

---

### Task 1: Backend hardening for containers

**Files:**
- Modify: `backend/clipupp/src/main/java/com/clipupp/common/outbox/OutboxRepository.java`
- Modify: `backend/clipupp/src/main/java/com/clipupp/common/outbox/OutboxPoller.java:66-70`
- Modify: `backend/clipupp/src/main/resources/application-dev.yml:48-54`
- Modify: `backend/clipupp/Dockerfile`
- Delete: `backend/clipupp/railway.json`
- Test: `backend/clipupp/src/test/java/com/clipupp/common/outbox/OutboxClaimIT.java`

**Interfaces:**
- Produces: `OutboxRepository.claimForDispatch(Long id): Optional<OutboxEntry>` (native `FOR UPDATE SKIP LOCKED`); backend image exposes `HEALTHCHECK` on `/actuator/health/readiness`; R2 settings come only from `R2_*` env vars.

- [ ] **Step 1: Write the failing integration test**

```java
package com.clipupp.common.outbox;

import static org.assertj.core.api.Assertions.assertThat;

import com.clipupp.support.AbstractPostgresIT;
import java.time.OffsetDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OutboxClaimIT extends AbstractPostgresIT {

    @Autowired OutboxRepository repo;
    @Autowired PlatformTransactionManager txm;

    @Test
    void rowHeldByAnotherTransactionIsSkipped() throws Exception {
        OutboxEntry e = new OutboxEntry();
        e.setTopic("test");
        e.setPayload("{}");
        e.setNextAttemptAt(OffsetDateTime.now().minusSeconds(1));
        Long id = new TransactionTemplate(txm).execute(s -> repo.saveAndFlush(e)).getId();

        CountDownLatch held = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicReference<Boolean> firstClaim = new AtomicReference<>();
        Thread holder = new Thread(() -> new TransactionTemplate(txm).executeWithoutResult(s -> {
            firstClaim.set(repo.claimForDispatch(id).isPresent());
            held.countDown();
            try { release.await(5, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
        }));
        holder.start();
        assertThat(held.await(5, TimeUnit.SECONDS)).isTrue();

        boolean secondClaim = new TransactionTemplate(txm).execute(s -> repo.claimForDispatch(id).isPresent());

        release.countDown();
        holder.join();
        assertThat(firstClaim.get()).isTrue();
        assertThat(secondClaim).isFalse();
    }
}
```

If `OutboxEntry` has no public setters for `topic`, `payload`, `nextAttemptAt`, add a package-private constructor `OutboxEntry(String topic, String payload, OffsetDateTime nextAttemptAt)` and use it instead; keep the existing no-arg constructor for JPA.

- [ ] **Step 2: Run the test to see it fail**

Run: `cd backend/clipupp && ./gradlew test --tests 'com.clipupp.common.outbox.OutboxClaimIT'`
Expected: compilation error, `claimForDispatch` not found.

- [ ] **Step 3: Add the locking claim query and use it in the poller**

In `OutboxRepository.java` add:

```java
    /**
     * Locks one ready row for this transaction. Another instance (or thread)
     * holding the row gets an empty result instead of blocking, so two
     * backends can poll the same table without dispatching twice.
     */
    @Query(value = "select * from outbox where id = :id and processed_at is null for update skip locked",
           nativeQuery = true)
    Optional<OutboxEntry> claimForDispatch(@Param("id") Long id);
```

Add `import java.util.Optional;`.

In `OutboxPoller.processOne` replace the first two lines of the method body:

```java
        OutboxEntry e = repo.claimForDispatch(id).orElse(null);
        if (e == null) return;
```

Update the class Javadoc with one sentence: "`processOne` claims its row with `FOR UPDATE SKIP LOCKED`, so a second instance polling the same table skips rows this one is dispatching."

- [ ] **Step 4: Run the test and the full backend suite**

Run: `cd backend/clipupp && ./gradlew test`
Expected: `OutboxClaimIT` passes; 86 tests, 0 failures (85 existing plus this one).

- [ ] **Step 5: Move R2 credentials out of the dev profile**

Replace lines 48-54 of `application-dev.yml` (the `media:` block) with:

```yaml
  media:
    # Dev reads R2 from the environment like prod does; leave unset to run
    # without media uploads. The keys that used to be checked in here were
    # rotated on 2026-10-15.
    bucket:          ${R2_BUCKET:}
    public-base-url: ${R2_PUBLIC_BASE_URL:}
    s3-endpoint:     ${R2_ENDPOINT:}
    s3-region:       ${R2_REGION:auto}
    access-key:      ${R2_ACCESS_KEY:dev}
    secret-key:      ${R2_SECRET_KEY:dev}
```

Remove any comment in that file that says the keys must be rotated.
Run `grep -rn "r2.cloudflarestorage\|7c87645059545eb8" backend/clipupp/src` and expect no output.

- [ ] **Step 6: Boot check with the dev profile**

Run: `cd backend/clipupp && SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5435/clipupp_db timeout 90 ./gradlew bootRun > /tmp/boot.log 2>&1; grep -c "Started ClipuppApplication" /tmp/boot.log`
Expected: `1` (the app starts without R2 values; the timeout stops it afterwards).

- [ ] **Step 7: Dockerfile healthcheck and labels**

Replace the final section of `backend/clipupp/Dockerfile` from `USER clipupp` to the end with:

```dockerfile
USER clipupp

ARG GIT_SHA=unknown
LABEL org.opencontainers.image.source="https://github.com/vishnuprabhakar42/Clipupp" \
      org.opencontainers.image.revision="${GIT_SHA}"

ENV SPRING_PROFILES_ACTIVE=prod

# Container-aware JVM: heap auto-sizes to the container memory limit.
# The compose file caps the container at 896m and sets MaxRAMPercentage=70.
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8 -Duser.timezone=UTC"

EXPOSE 8080

# Readiness, not liveness: the container is "healthy" only once Flyway has
# run and the DB pool is up, which is what deploy.sh waits for.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health/readiness >/dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
```

Also replace the two Railway-specific comments in the header and the build stage ("Tests run in backend-ci" stays) so no comment mentions Railway, and delete `backend/clipupp/railway.json`.

- [ ] **Step 8: Build the image locally and check the healthcheck wiring**

Run: `cd backend/clipupp && docker build --build-arg GIT_SHA=local -t clipupp-backend:local . && docker inspect clipupp-backend:local --format '{{.Config.Healthcheck.Test}} {{index .Config.Labels "org.opencontainers.image.revision"}}'`
Expected: the healthcheck command and `local`.

- [ ] **Step 9: Commit**

```bash
git add backend/clipupp
git commit -m "feat(backend): outbox claims rows with skip locked, container healthcheck, r2 keys from env"
```

---

### Task 2: Frontend standalone image and health route

**Files:**
- Modify: `frontend/clipupp/next.config.mjs` (add `output: "standalone"` to `nextConfig`)
- Create: `frontend/clipupp/app/api/health/route.ts`
- Create: `frontend/clipupp/lib/health/probe.ts`
- Create: `frontend/clipupp/lib/health/probe.test.ts`
- Create: `frontend/clipupp/Dockerfile`
- Create: `frontend/clipupp/.dockerignore`
- Delete: `frontend/clipupp/vercel.json`
- Modify: `frontend/clipupp/.env.production.example` (add `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_COUPON_FEEDBACK`)

**Interfaces:**
- Produces: `GET /api/health` -> `{ ok: true, version: string, backend: "up" | "down" }`, status 200; image `clipupp-web` listening on 3000 as user `nextjs`; build args `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_MEDIA_ORIGIN`, `BACKEND_URL`, `GIT_SHA`.

- [ ] **Step 1: Write the failing unit test for the probe**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { probeBackend } from "./probe";

describe("probeBackend", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports up on a 200 readiness response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await probeBackend("http://backend:8080", 50)).toBe("up");
  });

  it("reports down on a non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
    expect(await probeBackend("http://backend:8080", 50)).toBe("down");
  });

  it("reports down when the fetch rejects or times out", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect(await probeBackend("http://backend:8080", 50)).toBe("down");
    vi.stubGlobal("fetch", vi.fn((_: string, init?: RequestInit) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    })));
    expect(await probeBackend("http://backend:8080", 20)).toBe("down");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd frontend/clipupp && npx vitest run lib/health/probe.test.ts`
Expected: FAIL, cannot find module `./probe`.

- [ ] **Step 3: Implement the probe and the route**

`lib/health/probe.ts`:

```ts
export type BackendState = "up" | "down";

/** Hits the backend readiness probe with a hard timeout; never throws. */
export async function probeBackend(baseUrl: string, timeoutMs: number): Promise<BackendState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/actuator/health/readiness`, { signal: controller.signal, cache: "no-store" });
    return res.status === 200 ? "up" : "down";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}
```

`app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";
import { probeBackend } from "@/lib/health/probe";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const VERSION = process.env.GIT_SHA ?? "dev";

/**
 * Container and reverse-proxy health. Always 200 while this process answers,
 * so Caddy keeps routing to the web container even when the backend is
 * restarting; the smoke test reads `backend` to decide whether a deploy is good.
 */
export async function GET() {
  const backend = await probeBackend(BACKEND_URL, 2000);
  return NextResponse.json({ ok: true, version: VERSION, backend }, { headers: { "cache-control": "no-store" } });
}
```

Add to `nextConfig` in `next.config.mjs`, right after `reactStrictMode: true,`:

```js
  // Self-hosted in Docker: emit a minimal server under .next/standalone.
  output: "standalone",
```

Confirm `middleware.ts` already excludes `api` from the locale matcher (it does), so `/api/health` is served without a locale prefix.

- [ ] **Step 4: Run the tests and gates**

Run: `cd frontend/clipupp && npm run typecheck && npm run lint && npm run test`
Expected: all pass; test count 179 (176 plus 3).

- [ ] **Step 5: Verify the route against the dev server**

Run: `curl -s http://localhost:3000/api/health`
Expected: `{"ok":true,"version":"dev","backend":"up"}` (backend on :8080 running) or `"backend":"down"` if it is not; either way status 200.

- [ ] **Step 6: Write the Dockerfile and .dockerignore**

`frontend/clipupp/.dockerignore`:

```
node_modules
.next
out
.git
.env*
!.env.production.example
node_modules/.cache
tests
scripts
dev-docs
*.md
.lighthouseci
```

`frontend/clipupp/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1.7
# Clipupp web, Next.js 15 standalone. Built only in GitHub Actions.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Public values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=https://clipupp.com
ARG NEXT_PUBLIC_API_BASE_URL=
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_MEDIA_ORIGIN=
# Server-side proxy target; read by next.config.mjs rewrites at build time.
ARG BACKEND_URL=http://backend:8080
ARG GIT_SHA=unknown
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_MEDIA_ORIGIN=$NEXT_PUBLIC_MEDIA_ORIGIN \
    BACKEND_URL=$BACKEND_URL \
    GIT_SHA=$GIT_SHA
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
ARG BACKEND_URL=http://backend:8080
ARG GIT_SHA=unknown
ENV BACKEND_URL=$BACKEND_URL GIT_SHA=$GIT_SHA
LABEL org.opencontainers.image.source="https://github.com/vishnuprabhakar42/Clipupp" \
      org.opencontainers.image.revision="${GIT_SHA}"
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs && apk add --no-cache wget
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
```

Note on sharp: Next 15 bundles `sharp` as an optional dependency and `npm ci` on linux resolves the `linux-x64-musl` binary, so no extra install step is needed; Step 7 verifies that `next/image` works in the container.

- [ ] **Step 7: Build and run the image against the local backend**

Run:

```bash
cd frontend/clipupp
docker build --build-arg BACKEND_URL=http://host.docker.internal:8080 --build-arg GIT_SHA=local -t clipupp-web:local .
docker run -d --rm --name web-local -p 3300:3000 clipupp-web:local
sleep 8
curl -s http://localhost:3300/api/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3300/en
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3300/_next/image?url=%2Fbrands%2Famazon.png&w=64&q=75"
docker exec web-local id -u
docker stop web-local
```

Expected: health JSON with `"version":"local"`, `200`, `200` (sharp works), uid is not `0`.
If the brands path does not exist, use any file listed by `ls public/brands | head -1`.

- [ ] **Step 8: Env example and cleanup**

Append to `frontend/clipupp/.env.production.example`:

```
NEXT_PUBLIC_SITE_URL=https://clipupp.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_COUPON_FEEDBACK=false
```

Delete `frontend/clipupp/vercel.json`.

- [ ] **Step 9: Commit**

```bash
git add frontend/clipupp
git commit -m "feat(web): standalone output, health route, production dockerfile"
```

---

### Task 3: Deploy assets: compose, Caddy block, env rendering

**Files:**
- Create: `deploy/docker-compose.prod.yml`
- Create: `deploy/clipupp.caddy`
- Create: `deploy/.env.production.example`
- Create: `deploy/render-env.sh`
- Create: `deploy/test/render-env.test.sh`
- Create: `deploy/test/compose-config.test.sh`

**Interfaces:**
- Produces: compose services `db`, `backend`, `web`, `backup` (container names `clipupp-*`); `render-env.sh OUT_FILE` reads the keys listed below from its environment and writes `OUT_FILE` with mode 600, exit 2 naming the first missing required key; `deploy/test/*.test.sh` are plain bash tests that exit non-zero on failure and are run by CI.

- [ ] **Step 1: Write the failing tests**

`deploy/test/render-env.test.sh`:

```bash
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
grep -q '^DB_URL=jdbc:postgresql://db:5432/clipupp_db$' "$tmp/env" || fail "DB_URL not derived"
grep -q '^COOKIE_SECURE=true$' "$tmp/env" || fail "COOKIE_SECURE default missing"
grep -q '^EDGE_NETWORK=r2r_default$' "$tmp/env" || fail "EDGE_NETWORK default missing"
grep -q '^IMAGE_TAG=sha-abc$' "$tmp/env" || fail "IMAGE_TAG missing"

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
grep -qF 'EMAIL_FROM=Clipupp <hello@clipupp.com>' "$tmp/env4" || fail "value mangled"

echo "render-env.test.sh: ok"
```

`deploy/test/compose-config.test.sh`:

```bash
#!/usr/bin/env bash
# The production compose file must be valid and carry the invariants the spec names.
set -euo pipefail
cd "$(dirname "$0")/.."
fail() { echo "FAIL: $*" >&2; exit 1; }
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
printf 'IMAGE_TAG=sha-test\nPOSTGRES_PASSWORD=x\nDB_USERNAME=u\nDB_PASSWORD=x\nEDGE_NETWORK=r2r_default\n' > "$tmp/.env"
cfg="$(docker compose --env-file "$tmp/.env" -f docker-compose.prod.yml config)"
for name in clipupp-db clipupp-backend clipupp-web clipupp-backup; do
  grep -q "container_name: $name" <<<"$cfg" || fail "missing $name"
done
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-backend:sha-test' <<<"$cfg" || fail "backend image tag not applied"
grep -q 'ghcr.io/vishnuprabhakar42/clipupp-web:sha-test' <<<"$cfg" || fail "web image tag not applied"
grep -q 'name: r2r_default' <<<"$cfg" || fail "edge network not external r2r_default"
! grep -qE '^\s+ports:' <<<"$cfg" || fail "no service may publish ports; Caddy owns 80/443"
grep -q 'max-size: 20m' <<<"$cfg" || fail "log rotation missing"
echo "compose-config.test.sh: ok"
```

- [ ] **Step 2: Run them to see them fail**

Run: `bash deploy/test/render-env.test.sh; bash deploy/test/compose-config.test.sh`
Expected: both fail (`render-env.sh` not found; compose file not found).

- [ ] **Step 3: Write render-env.sh**

```bash
#!/usr/bin/env bash
#
# Render the server .env from the environment GitHub Actions passes in.
#
#   render-env.sh /opt/clipupp/.env
#
# GitHub Environment secrets and variables are the only store of configuration;
# this file is overwritten on every deploy. Every required key must be set and
# non-empty, or the script exits 2 before writing anything, so a missing secret
# stops a deploy before the server changes. Values are written verbatim.
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

umask 077
tmp="$(mktemp "${OUT}.XXXXXX")"
{
  echo "# Rendered by deploy/render-env.sh on $(date -u +%FT%TZ). Do not edit; update GitHub and redeploy."
  for key in "${REQUIRED[@]}"; do
    printf '%s=%s\n' "$key" "${!key}"
  done
  for pair in "${OPTIONAL[@]}"; do
    key="${pair%%=*}"; def="${pair#*=}"
    printf '%s=%s\n' "$key" "${!key:-$def}"
  done
  # Derived: the database lives in this compose project.
  echo "DB_URL=jdbc:postgresql://db:5432/clipupp_db"
  echo "POSTGRES_USER=${DB_USERNAME}"
  echo "POSTGRES_DB=clipupp_db"
} > "$tmp"
chmod 600 "$tmp"
mv "$tmp" "$OUT"
echo "render-env: wrote $OUT ($(wc -l < "$OUT") keys)"
```

`chmod +x deploy/render-env.sh`.

- [ ] **Step 4: Write the compose file**

```yaml
# Production stack for the Hostinger VPS. Lives at /opt/clipupp with .env
# (rendered by CD from GitHub secrets) and scripts/. Images are built by
# GitHub Actions and pulled from GHCR; nothing is built on the server.
#
#   scripts/deploy.sh sha-<git sha>   what CD runs; safe by hand
#   scripts/rollback.sh               previous release, one command
#
# TLS and ports 80/443 belong to the server's shared Caddy (the r2r project).
# `web` joins that Caddy's network (EDGE_NETWORK) and is reached as clipupp-web:3000.

name: clipupp

x-logging: &logging
  logging:
    driver: json-file
    options:
      max-size: "20m"
      max-file: "5"

services:
  db:
    image: postgres:16-alpine
    container_name: clipupp-db
    restart: unless-stopped
    <<: *logging
    mem_limit: 512m
    shm_size: 128m
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: clipupp_db
    # Not published: only reachable inside this compose network.
    expose: ["5432"]
    volumes:
      - clipupp-db-data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d clipupp_db"]
      interval: 5s
      timeout: 3s
      retries: 20

  backend:
    image: ghcr.io/vishnuprabhakar42/clipupp-backend:${IMAGE_TAG}
    container_name: clipupp-backend
    restart: unless-stopped
    <<: *logging
    mem_limit: 896m
    stop_grace_period: 35s
    env_file: .env
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SERVER_PORT: "8080"
      JAVA_OPTS: "-XX:+UseG1GC -XX:MaxRAMPercentage=70 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8 -Duser.timezone=UTC"
    expose: ["8080"]
    # Flyway runs on boot; the image HEALTHCHECK is the readiness probe.
    depends_on:
      db:
        condition: service_healthy

  web:
    image: ghcr.io/vishnuprabhakar42/clipupp-web:${IMAGE_TAG}
    container_name: clipupp-web
    restart: unless-stopped
    <<: *logging
    mem_limit: 512m
    environment:
      BACKEND_URL: http://backend:8080
    expose: ["3000"]
    networks: [default, edge]
    depends_on:
      backend:
        condition: service_healthy

  # Nightly encrypted dump at 02:30 UTC, 30-day retention, newest copied to R2.
  backup:
    image: postgres:16
    container_name: clipupp-backup
    restart: unless-stopped
    <<: *logging
    mem_limit: 128m
    env_file: .env
    environment:
      PGHOST: db
    volumes:
      - ./backups:/backups
      - ./.backup-key:/keys/backup.key:ro
      - ./scripts/backup.sh:/usr/local/bin/clipupp-backup:ro
    entrypoint: ["/bin/bash", "-c"]
    command:
      - |
        apt-get update -qq >/dev/null && apt-get install -y -qq rclone >/dev/null 2>&1 || echo "[backup] rclone install failed; off-site copy disabled"
        while true; do
          now=$$(date +%s); next=$$(( (now / 86400 + 1) * 86400 + 9000 ))   # 02:30 UTC
          sleep $$(( next - now ))
          clipupp-backup || echo "[backup] FAILED" >&2
        done
    depends_on:
      db:
        condition: service_healthy

networks:
  default: {}
  edge:
    external: true
    name: ${EDGE_NETWORK:-r2r_default}

volumes:
  clipupp-db-data:
    name: clipupp-db-data
```

- [ ] **Step 5: Write the Caddy block and the env example**

`deploy/clipupp.caddy`:

```
# Site block for the SHARED Caddy on the server (/opt/r2r/Caddyfile).
# Append once, then reload in place (never replace the file, the container
# holds the inode):
#   cat /opt/clipupp/clipupp.caddy >> /opt/r2r/Caddyfile
#   docker compose -f /opt/r2r/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
# clipupp-web must be on that Caddy's network (EDGE_NETWORK in .env).

# --- Clipupp (app lives in /opt/clipupp) ---

(clipupp_site) {
	encode zstd gzip

	# Admin CSV and media uploads: the backend accepts 12 MB per request.
	request_body {
		max_size 12MB
	}

	header {
		-Server
		Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
	}

	reverse_proxy clipupp-web:3000 {
		health_uri /api/health
		health_interval 30s
		health_timeout 5s
		header_up X-Forwarded-Proto {scheme}
	}

	log {
		output stdout
		format json
	}
}

clipupp.com {
	import clipupp_site
}

www.clipupp.com {
	redir https://clipupp.com{uri} permanent
}

# Pre-cutover hostname. After DNS moves, replace the import with:
#   redir https://clipupp.com{uri} permanent
clipupp.187-127-130-103.sslip.io {
	import clipupp_site
}
```

`deploy/.env.production.example` (names and safe defaults only; one line per key, same order as `render-env.sh`, with a header comment "Rendered by CD from the GitHub production environment; this example documents the keys. Secrets: POSTGRES_PASSWORD DB_USERNAME DB_PASSWORD JWT_SECRET RESEND_API_KEY R2_ACCESS_KEY R2_SECRET_KEY RCLONE_CONFIG_R2_ACCESS_KEY_ID RCLONE_CONFIG_R2_SECRET_ACCESS_KEY TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID. Everything else is a GitHub variable.").

- [ ] **Step 6: Run the tests and shellcheck**

Run: `bash deploy/test/render-env.test.sh && bash deploy/test/compose-config.test.sh && shellcheck deploy/render-env.sh deploy/test/*.sh`
Expected: both `ok`, shellcheck silent. Install shellcheck with `brew install shellcheck` if missing.

- [ ] **Step 7: Commit**

```bash
git add deploy
git commit -m "feat(deploy): production compose, caddy site block, env rendering from github secrets"
```

---

### Task 4: Server scripts: deploy, rollback, restore, backup, health probe, bootstrap

**Files:**
- Create: `deploy/scripts/deploy.sh`, `deploy/scripts/rollback.sh`, `deploy/scripts/restore.sh`, `deploy/scripts/backup.sh`, `deploy/scripts/healthcheck-notify.sh`, `deploy/scripts/lib.sh`
- Create: `deploy/server-setup.sh`
- Create: `deploy/test/deploy-flow.test.sh`

**Interfaces:**
- Consumes: compose file and `.env` from Task 3; `.deploy/{current,previous}` state convention.
- Produces: `deploy.sh <tag>`, `rollback.sh [tag] [--with-db <dump>]`, `restore.sh <dump> [--target <db>] [--yes]`, `backup.sh` (also runs inside `clipupp-backup`), `healthcheck-notify.sh`, `lib.sh` (`log`, `notify`, `wait_healthy <container> <seconds>`).

- [ ] **Step 1: Write the failing flow test (stubbed docker)**

`deploy/test/deploy-flow.test.sh` runs the scripts against a fake `docker` on `PATH` that records calls and simulates health, so the control flow (dump before migrate, rollback on unhealthy, state files, registry-less rollback) is tested without containers:

```bash
#!/usr/bin/env bash
# Control-flow tests for deploy.sh and rollback.sh using a stub `docker`.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
fail() { echo "FAIL: $*" >&2; exit 1; }

mk_sandbox() {
  sb="$(mktemp -d)"
  mkdir -p "$sb/bin" "$sb/app/scripts" "$sb/app/.deploy" "$sb/app/backups"
  cp "$root/scripts/"*.sh "$sb/app/scripts/"
  cp "$root/docker-compose.prod.yml" "$sb/app/"
  printf 'IMAGE_TAG=old\nDB_USERNAME=u\nPOSTGRES_PASSWORD=p\nTELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\n' > "$sb/app/.env"
  echo "key" > "$sb/app/.backup-key"
  cat > "$sb/bin/docker" <<'STUB'
#!/usr/bin/env bash
echo "docker $*" >> "$STUB_LOG"
case "$*" in
  compose*" pull"*) [ "${STUB_PULL_FAILS:-0}" = 1 ] && exit 1; exit 0 ;;
  "image inspect"*) exit 0 ;;
  compose*" config --images"*) echo "ghcr.io/x/img:tag"; exit 0 ;;
  "exec clipupp-db pg_isready"*) exit 0 ;;
  "exec clipupp-db sh -c pg_dump"*|"exec clipupp-db pg_dump"*) [ "${STUB_DUMP_FAILS:-0}" = 1 ] && exit 1; echo "-- dump"; exit 0 ;;
  "inspect -f {{.State.Health.Status}} clipupp-backend") echo "${STUB_BACKEND_HEALTH:-healthy}" ;;
  "inspect -f {{.State.Health.Status}} clipupp-web") echo "${STUB_WEB_HEALTH:-healthy}" ;;
  "rollout --help") exit "${STUB_ROLLOUT_PRESENT:-1}" ;;
  "rollout"*) exit 0 ;;
  "logs"*) exit 0 ;;
  *) exit 0 ;;
esac
STUB
  chmod +x "$sb/bin/docker"
  export STUB_LOG="$sb/calls.log"; : > "$STUB_LOG"
  export PATH="$sb/bin:$PATH" HEALTH_TIMEOUT=2 HEALTH_POLL=0
}

# 1. happy path: dump happens before backend up; state files updated
mk_sandbox; echo old > "$sb/app/.deploy/current"
( cd "$sb/app" && scripts/deploy.sh sha-new >/dev/null )
dump_line=$(grep -n 'pg_dump' "$STUB_LOG" | head -1 | cut -d: -f1)
up_line=$(grep -n 'up -d.*backend' "$STUB_LOG" | head -1 | cut -d: -f1)
[ "$dump_line" -lt "$up_line" ] || fail "dump must precede backend start"
[ "$(cat "$sb/app/.deploy/current")" = "sha-new" ] || fail "current not updated"
[ "$(cat "$sb/app/.deploy/previous")" = "old" ] || fail "previous not recorded"
ls "$sb/app/backups"/pre-deploy-sha-new-*.sql.gz.enc >/dev/null 2>&1 || fail "pre-deploy dump file missing"

# 2. failed dump aborts before any container changes
mk_sandbox; echo old > "$sb/app/.deploy/current"
set +e; ( cd "$sb/app" && STUB_DUMP_FAILS=1 scripts/deploy.sh sha-new >/dev/null 2>&1 ); code=$?; set -e
[ "$code" != 0 ] || fail "deploy should fail on dump failure"
! grep -q 'up -d.*backend' "$STUB_LOG" || fail "backend was started despite dump failure"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "current changed on failed deploy"

# 3. unhealthy backend triggers rollback to previous tag
mk_sandbox; echo old > "$sb/app/.deploy/current"
set +e; ( cd "$sb/app" && STUB_BACKEND_HEALTH=unhealthy scripts/deploy.sh sha-new >/dev/null 2>&1 ); code=$?; set -e
[ "$code" != 0 ] || fail "deploy should fail on unhealthy backend"
grep -q 'IMAGE_TAG=old' "$STUB_LOG" || grep -q 'rolling back to old' "$sb/app/.deploy/deploy.log" || fail "no rollback to previous"
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "current changed after rollback"

# 4. rollback works when pull fails but image exists locally
mk_sandbox; echo sha-new > "$sb/app/.deploy/current"; echo old > "$sb/app/.deploy/previous"
( cd "$sb/app" && STUB_PULL_FAILS=1 scripts/rollback.sh >/dev/null )
[ "$(cat "$sb/app/.deploy/current")" = "old" ] || fail "rollback did not switch current"
[ "$(cat "$sb/app/.deploy/previous")" = "sha-new" ] || fail "rollback did not record previous"

# 5. docker rollout is used for web when available, compose up otherwise
mk_sandbox; echo old > "$sb/app/.deploy/current"
( cd "$sb/app" && STUB_ROLLOUT_PRESENT=0 scripts/deploy.sh sha-new >/dev/null )
grep -q 'docker rollout.* web' "$STUB_LOG" || fail "rollout plugin not used when present"
mk_sandbox; echo old > "$sb/app/.deploy/current"
( cd "$sb/app" && scripts/deploy.sh sha-new >/dev/null )
grep -q 'up -d.*web' "$STUB_LOG" || fail "compose up fallback for web missing"

echo "deploy-flow.test.sh: ok"
```

Design note the implementer must honour: `deploy.sh` calls `rollout_web` from `lib.sh` (which detects the plugin with `docker rollout --help`), invokes the pre-deploy dump as `docker exec clipupp-db sh -c 'pg_dump ...'`, polls health with `docker inspect -f '{{.State.Health.Status}}' <container>`, and reads `HEALTH_TIMEOUT` (seconds, default 180 for backend and 120 for web) and `HEALTH_POLL` (seconds between polls, default 3) from the environment so the test can run fast. `openssl` must be present on the test machine (it is on macOS and Ubuntu).

- [ ] **Step 2: Run the test to see it fail**

Run: `bash deploy/test/deploy-flow.test.sh`
Expected: fails, `scripts/deploy.sh` not found.

- [ ] **Step 3: Write lib.sh**

```bash
#!/usr/bin/env bash
# Shared helpers for the deploy scripts. Source only; no side effects.

STATE_DIR="${STATE_DIR:-.deploy}"
LOG_FILE="${LOG_FILE:-$STATE_DIR/deploy.log}"

log() { mkdir -p "$STATE_DIR"; echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG_FILE"; }

# notify "<text>": Telegram message when the bot is configured, silent otherwise. Never fails the caller.
notify() {
  local text="$1"
  [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || return 0
  curl -fsS -m 10 -o /dev/null -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" --data-urlencode "text=${text}" \
    --data-urlencode "disable_web_page_preview=true" || log "notify failed (ignored)"
}

# wait_healthy <container> <timeout-seconds>: 0 when healthy, 1 on timeout or unhealthy.
wait_healthy() {
  local name="$1" timeout="$2" poll="${HEALTH_POLL:-3}" deadline status
  deadline=$(( $(date +%s) + timeout ))
  while :; do
    status="$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo missing)"
    case "$status" in
      healthy) return 0 ;;
      unhealthy) log "$name is unhealthy"; return 1 ;;
    esac
    [ "$(date +%s)" -lt "$deadline" ] || { log "$name not healthy after ${timeout}s (last: $status)"; return 1; }
    sleep "$poll"
  done
}

# load_env: export the keys from .env for scripts that need them (names only in logs).
load_env() { [ -f .env ] || { log "ERROR: .env missing in $(pwd)"; exit 1; }; set -a; . ./.env; set +a; }

# compose: docker compose on the production file, unless COMPOSE_FILE already names the files
# (the local rehearsal sets it to prod + local override).
compose() {
  if [ -n "${COMPOSE_FILE:-}" ]; then docker compose "$@"; else docker compose -f docker-compose.prod.yml "$@"; fi
}

# rollout_web: zero-downtime replacement of the web container when the docker-rollout plugin is
# installed (0), or 2 when the plugin is missing so the caller falls back to compose up.
rollout_web() {
  docker rollout --help >/dev/null 2>&1 || return 2
  if [ -n "${COMPOSE_FILE:-}" ]; then docker rollout web; else docker rollout -f docker-compose.prod.yml web; fi
}
```

- [ ] **Step 4: Write deploy.sh**

```bash
#!/usr/bin/env bash
#
# Deploy one release to this server. Run by CD over SSH; safe to run by hand.
#
#   scripts/deploy.sh sha-<git sha>
#
# Order of operations:
#   1. pull the images for <tag> (tolerated if they are already local)
#   2. start the database and take an encrypted pre-migration dump
#   3. recreate backend on the new tag (Flyway migrates on boot), wait for readiness
#   4. roll web over with zero downtime (docker rollout) or recreate it
#   5. on any failure after step 2: put backend and web back on the previous tag
#
# State lives in .deploy/: `current` and `previous` hold image tags.
set -euo pipefail

TAG="${1:?usage: deploy.sh <image-tag>}"
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh
. scripts/lib.sh
load_env

mkdir -p "$STATE_DIR"; install -d -m 0700 backups
CURRENT_FILE="$STATE_DIR/current"; PREVIOUS_FILE="$STATE_DIR/previous"
PREVIOUS_TAG="$(cat "$CURRENT_FILE" 2>/dev/null || true)"
export IMAGE_TAG="$TAG"

log "== deploy $TAG (previous: ${PREVIOUS_TAG:-none})"

log "pulling images"
if ! compose pull --quiet backend web 2>/dev/null; then
  log "registry pull failed; checking local images"
  for svc in backend web; do
    img="$(compose config --images "$svc" | sed -n 1p)"
    docker image inspect "$img" >/dev/null 2>&1 || { log "ERROR: $img not available locally"; exit 1; }
  done
fi

compose up -d --quiet-pull db
until docker exec clipupp-db pg_isready -q -U "$DB_USERNAME" -d clipupp_db 2>/dev/null; do sleep 1; done

DUMP="backups/pre-deploy-$TAG-$(date -u +%Y%m%d-%H%M%S).sql.gz.enc"
log "pre-migration dump -> $DUMP"
if docker exec clipupp-db sh -c "pg_dump -U $DB_USERNAME clipupp_db --no-owner --no-privileges" \
     | gzip -9 | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:.backup-key > "$DUMP" \
   && openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:.backup-key < "$DUMP" | gzip -t; then
  chmod 600 "$DUMP"; log "dump ok ($(du -h "$DUMP" | cut -f1))"
else
  rm -f "$DUMP"; log "ERROR: pre-deploy dump failed; refusing to migrate without a safety net"; exit 1
fi

rollback() {
  log "!! $1"
  if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$TAG" ]; then
    log "rolling back to $PREVIOUS_TAG"
    IMAGE_TAG="$PREVIOUS_TAG" compose up -d --no-deps --pull never backend web || true
    log "rolled back; the database was NOT restored (scripts/restore.sh $DUMP if the migration must be undone)"
    notify "Clipupp deploy $TAG FAILED: $1. Rolled back to $PREVIOUS_TAG."
  else
    log "no previous release to roll back to"
    notify "Clipupp deploy $TAG FAILED: $1. No previous release."
  fi
  exit 1
}

log "starting backend on $TAG"
compose up -d --no-deps --pull never backend
wait_healthy clipupp-backend "${HEALTH_TIMEOUT:-180}" || rollback "backend did not become ready"

log "rolling web over to $TAG"
rollout_web; rc=$?
if [ "$rc" = 2 ]; then
  compose up -d --no-deps --pull never web
elif [ "$rc" != 0 ]; then
  rollback "web rollout failed"
fi
wait_healthy clipupp-web "${HEALTH_TIMEOUT:-120}" || rollback "web did not become healthy"

compose up -d --no-deps --pull never backup >/dev/null 2>&1 || log "backup sidecar not started (ignored)"

[ -n "$PREVIOUS_TAG" ] && echo "$PREVIOUS_TAG" > "$PREVIOUS_FILE"
echo "$TAG" > "$CURRENT_FILE"
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
log "== deployed $TAG"
```

- [ ] **Step 5: Write rollback.sh, restore.sh, backup.sh, healthcheck-notify.sh**

`rollback.sh`:

```bash
#!/usr/bin/env bash
#
# Roll back to the previous release, or to a named tag.
#
#   scripts/rollback.sh                       previous release (.deploy/previous)
#   scripts/rollback.sh sha-<git sha>         any tag present locally or in GHCR
#   scripts/rollback.sh --with-db <dump> [tag]   also restore the database (asks for RESTORE)
#
# Application rollback does not touch data. Only use --with-db when the release
# you are leaving ran a migration you must undo; rows written since are lost.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh
. scripts/lib.sh
load_env

WITH_DB=""
if [ "${1:-}" = "--with-db" ]; then WITH_DB="${2:?--with-db needs a dump file}"; shift 2; fi
TARGET="${1:-$(cat "$STATE_DIR/previous" 2>/dev/null || true)}"
[ -n "$TARGET" ] || { echo "No previous release recorded and no tag given." >&2; exit 1; }
CURRENT="$(cat "$STATE_DIR/current" 2>/dev/null || true)"
log "== rollback: ${CURRENT:-none} -> $TARGET"

if [ -n "$WITH_DB" ]; then
  echo "!!! This REPLACES the database with $WITH_DB. Every change since that dump is lost."
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
  compose stop backend web
  scripts/restore.sh "$WITH_DB" --yes
fi

export IMAGE_TAG="$TARGET"
# The registry login is CD's short-lived token, so a pull may be denied by the
# time a human runs this; every deployed tag stays local for 7 days.
if ! compose pull --quiet backend web 2>/dev/null; then
  log "registry pull failed; using local images"
  for svc in backend web; do
    img="$(compose config --images "$svc" | sed -n 1p)"
    docker image inspect "$img" >/dev/null 2>&1 || { log "ERROR: $img not available locally"; exit 1; }
  done
fi
compose up -d --no-deps --pull never backend web
wait_healthy clipupp-backend "${HEALTH_TIMEOUT:-180}" || { log "ERROR: rolled-back backend not ready"; exit 1; }
wait_healthy clipupp-web "${HEALTH_TIMEOUT:-120}" || { log "ERROR: rolled-back web not healthy"; exit 1; }
[ -n "$CURRENT" ] && echo "$CURRENT" > "$STATE_DIR/previous"
echo "$TARGET" > "$STATE_DIR/current"
log "== rolled back to $TARGET"
notify "Clipupp rolled back to $TARGET (was ${CURRENT:-none})."
```

`restore.sh`:

```bash
#!/usr/bin/env bash
#
# Restore a dump into the database (default clipupp_db) or a scratch database.
#
#   scripts/restore.sh <dump.sql.gz.enc|dump.sql.gz> [--target <dbname>] [--yes]
#
# Without --yes it asks for RESTORE. --target other than clipupp_db is the
# monthly drill: restore into clipupp_drill, count rows, drop it.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh
. scripts/lib.sh
load_env
DUMP="${1:?usage: restore.sh <dump> [--target db] [--yes]}"; shift
TARGET="clipupp_db"; YES=0
while [ $# -gt 0 ]; do case "$1" in --target) TARGET="$2"; shift 2 ;; --yes) YES=1; shift ;; *) echo "unknown arg $1" >&2; exit 1 ;; esac; done
[ -f "$DUMP" ] || { echo "no such file: $DUMP" >&2; exit 1; }
if [ "$YES" != 1 ]; then
  echo "!!! This REPLACES database $TARGET with $DUMP."
  read -r -p "Type RESTORE to continue: " answer; [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
fi
decode() { case "$DUMP" in *.enc) openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:.backup-key < "$DUMP" | gunzip -c ;; *) gunzip -c "$DUMP" ;; esac; }
log "restoring $DUMP into $TARGET"
docker exec clipupp-db psql -U "$DB_USERNAME" -d postgres -v ON_ERROR_STOP=1 \
  -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$TARGET' and pid <> pg_backend_pid();" \
  -c "drop database if exists $TARGET;" -c "create database $TARGET;" >/dev/null
decode | docker exec -i clipupp-db psql -U "$DB_USERNAME" -d "$TARGET" -q -v ON_ERROR_STOP=1 >/dev/null
log "restored into $TARGET ($(docker exec clipupp-db psql -U "$DB_USERNAME" -d "$TARGET" -tAc 'select count(*) from coupon') coupons)"
[ "$TARGET" = "clipupp_db" ] && log "start the app again: docker compose -f docker-compose.prod.yml up -d backend web"
```

`backup.sh` (runs on the host by hand, and inside `clipupp-backup` where `PGHOST=db` and the key is at `/keys/backup.key`):

```bash
#!/usr/bin/env bash
#
# Encrypted database backup, verified, 30-day retention, newest copied to R2.
# Runs inside the clipupp-backup container nightly and by hand on the host:
#   scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.." 2>/dev/null || true
[ -f .env ] && { set -a; . ./.env; set +a; }
KEY="${BACKUP_KEY_FILE:-$([ -f /keys/backup.key ] && echo /keys/backup.key || echo .backup-key)}"
OUT_DIR="${BACKUP_DIR:-$([ -d /backups ] && echo /backups || echo backups)}"
RETAIN="${BACKUP_RETAIN_DAYS:-30}"
FILE="$OUT_DIR/clipupp-$(date -u +%Y%m%d-%H%M%S).sql.gz.enc"
enc() { openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "file:$KEY"; }
dec() { openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass "file:$KEY"; }
if [ -n "${PGHOST:-}" ]; then
  dump() { PGPASSWORD="$DB_PASSWORD" pg_dump -h "$PGHOST" -U "$DB_USERNAME" clipupp_db --no-owner --no-privileges; }
else
  dump() { docker exec clipupp-db pg_dump -U "$DB_USERNAME" clipupp_db --no-owner --no-privileges; }
fi
mkdir -p "$OUT_DIR"
if dump | gzip -9 | enc > "$FILE" && dec < "$FILE" | gzip -t && [ "$(wc -c < "$FILE")" -gt 1024 ]; then
  chmod 600 "$FILE"; echo "[backup] wrote $FILE ($(du -h "$FILE" | cut -f1))"
else
  echo "[backup] FAILED" >&2; rm -f "$FILE"; exit 1
fi
if command -v rclone >/dev/null 2>&1 && [ -n "${BACKUP_BUCKET:-}" ]; then
  rclone copyto "$FILE" "r2:${BACKUP_BUCKET}/$(basename "$FILE")" --s3-no-check-bucket -q && echo "[backup] copied to r2:${BACKUP_BUCKET}" \
    || echo "[backup] off-site copy FAILED" >&2
fi
find "$OUT_DIR" -name 'clipupp-*.sql.gz.enc' -mtime "+$RETAIN" -delete
find "$OUT_DIR" -name 'pre-deploy-*.sql.gz.enc' -mtime "+$RETAIN" -delete
```

`healthcheck-notify.sh` (cron every 5 minutes as `deploy`):

```bash
#!/usr/bin/env bash
# Uptime probe: posts to Telegram only when the state changes.
#   */5 * * * * /opt/clipupp/scripts/healthcheck-notify.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib.sh
. scripts/lib.sh
load_env
SITE="${PUBLIC_SITE_URL%/}"
STATE_FILE="$STATE_DIR/health-state"
prev="$(cat "$STATE_FILE" 2>/dev/null || echo unknown)"
web="$(curl -fsS -m 10 "$SITE/api/health" 2>/dev/null || echo '{"ok":false}')"
api="$(curl -fsS -m 10 -o /dev/null -w '%{http_code}' "$SITE/actuator/health" 2>/dev/null || echo 000)"
if grep -q '"ok":true' <<<"$web" && grep -q '"backend":"up"' <<<"$web" && [ "$api" = "200" ]; then now=up; else now=down; fi
if [ "$now" != "$prev" ]; then
  echo "$now" > "$STATE_FILE"
  [ "$prev" = "unknown" ] && exit 0
  if [ "$now" = "down" ]; then notify "Clipupp is DOWN: web=$web actuator=$api"; else notify "Clipupp recovered."; fi
fi
```

`chmod +x deploy/scripts/*.sh`.

- [ ] **Step 6: Write server-setup.sh (run once as root, idempotent)**

```bash
#!/usr/bin/env bash
#
# One-time host preparation for Clipupp on the shared Hostinger VPS. Idempotent.
#   sudo bash deploy/server-setup.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root" >&2; exit 1; }
APP=/opt/clipupp

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

echo "== docker rollout plugin (zero-downtime web deploys)"
PLUGIN_DIR=/home/deploy/.docker/cli-plugins
if [ ! -x "$PLUGIN_DIR/docker-rollout" ]; then
  install -d -o deploy -g deploy "$PLUGIN_DIR"
  curl -fsSL https://raw.githubusercontent.com/wowu/docker-rollout/v0.2.2/docker-rollout -o "$PLUGIN_DIR/docker-rollout"
  chown deploy:deploy "$PLUGIN_DIR/docker-rollout"; chmod +x "$PLUGIN_DIR/docker-rollout"
fi

echo "== $APP skeleton"
install -d -o deploy -g deploy -m 0755 "$APP" "$APP/scripts"
install -d -o deploy -g deploy -m 0700 "$APP/backups" "$APP/.deploy"

echo "== health probe cron"
( crontab -u deploy -l 2>/dev/null | grep -v healthcheck-notify; echo "*/5 * * * * $APP/scripts/healthcheck-notify.sh >/dev/null 2>&1" ) | crontab -u deploy -

echo "== checks"
id deploy | grep -q docker || { echo "deploy is not in the docker group" >&2; exit 1; }
docker network inspect r2r_default >/dev/null
echo "server-setup: done"
```

Pin the `docker-rollout` version to the latest tag at implementation time if `v0.2.2` does not exist (`curl -s https://api.github.com/repos/wowu/docker-rollout/releases/latest | grep tag_name`), and record the chosen tag in the spec.

- [ ] **Step 7: Run the flow test and shellcheck**

Run: `bash deploy/test/deploy-flow.test.sh && shellcheck -x deploy/scripts/*.sh deploy/server-setup.sh deploy/test/*.sh`
Expected: `ok`, shellcheck silent (use `# shellcheck disable=SC1091` on the `. ./.env` line in `lib.sh` and `backup.sh` with a comment that the file is generated).

- [ ] **Step 8: Commit**

```bash
git add deploy
git commit -m "feat(deploy): deploy, rollback, restore, backup, uptime probe, and host bootstrap scripts"
```

---

### Task 5: Local rehearsal of the full stack

**Files:**
- Create: `deploy/docker-compose.local.yml` (override: no edge network, publish `web` on 3300, local image tags)
- Create: `deploy/test/local-rehearsal.sh`
- Modify: `spec/deployment/00devops.md` (section 11 log line with the rehearsal result)

**Interfaces:**
- Consumes: images `clipupp-backend:local`, `clipupp-web:local` from Tasks 1 and 2; scripts from Task 4.

- [ ] **Step 1: Write the override and the rehearsal script**

`deploy/docker-compose.local.yml`:

```yaml
# Local rehearsal on a developer machine: real images, throwaway database,
# no shared Caddy. Use together with docker-compose.prod.yml:
#   docker compose -f docker-compose.prod.yml -f docker-compose.local.yml ...
services:
  backend:
    image: clipupp-backend:${IMAGE_TAG}
  web:
    image: clipupp-web:${IMAGE_TAG}
    ports: ["3300:3000"]
    networks: [default]
networks:
  edge:
    external: false
    name: clipupp-local-edge
```

`deploy/test/local-rehearsal.sh`:

```bash
#!/usr/bin/env bash
# End-to-end rehearsal of deploy.sh and rollback.sh on this machine with real containers.
#   bash deploy/test/local-rehearsal.sh
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"; echo "workdir $work"
cp -R "$root/deploy/scripts" "$root/deploy/docker-compose.prod.yml" "$root/deploy/docker-compose.local.yml" "$work/"
cd "$work"
cat > .env <<EOF
IMAGE_TAG=local
POSTGRES_PASSWORD=rehearsal
DB_USERNAME=clipupp
DB_PASSWORD=rehearsal
DB_URL=jdbc:postgresql://db:5432/clipupp_db
DB_POOL_SIZE=5
JWT_SECRET=0123456789abcdef0123456789abcdef0123456789
PUBLIC_SITE_URL=http://localhost:3300
API_BASE_URL=http://localhost:3300
CORS_ALLOWED_ORIGINS=http://localhost:3300
COOKIE_SECURE=false
EMAIL_PROVIDER=logging
EMAIL_FROM=dev@clipupp.local
RESEND_API_KEY=unused
R2_BUCKET=
R2_PUBLIC_BASE_URL=
R2_ENDPOINT=
R2_REGION=auto
R2_ACCESS_KEY=dev
R2_SECRET_KEY=dev
GOOGLE_CLIENT_ID=
EDGE_NETWORK=clipupp-local-edge
BACKUP_RETAIN_DAYS=1
BACKUP_BUCKET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF
head -c 32 /dev/urandom | base64 > .backup-key
export COMPOSE_FILE=docker-compose.prod.yml:docker-compose.local.yml
cleanup() { docker compose down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

# deploy.sh uses "docker compose -f docker-compose.prod.yml"; COMPOSE_FILE adds the override.
docker tag clipupp-backend:local clipupp-backend:local-v2
docker tag clipupp-web:local clipupp-web:local-v2

scripts/deploy.sh local
curl -fsS http://localhost:3300/api/health | grep -q '"backend":"up"' || { echo "health after first deploy failed"; exit 1; }
curl -fsS -o /dev/null -w "homepage %{http_code}\n" http://localhost:3300/en

scripts/deploy.sh local-v2
[ "$(cat .deploy/current)" = "local-v2" ] && [ "$(cat .deploy/previous)" = "local" ] || { echo "state files wrong"; exit 1; }
ls backups/pre-deploy-local-v2-* >/dev/null

scripts/rollback.sh
[ "$(cat .deploy/current)" = "local" ] || { echo "rollback state wrong"; exit 1; }
curl -fsS http://localhost:3300/api/health | grep -q '"backend":"up"' || { echo "health after rollback failed"; exit 1; }

scripts/backup.sh
ls backups/clipupp-*.sql.gz.enc >/dev/null
newest="$(ls -t backups/clipupp-*.sql.gz.enc | head -1)"
scripts/restore.sh "$newest" --target clipupp_drill --yes
echo "local-rehearsal: ok"
```

Note for the implementer: the scripts already go through `compose` in `lib.sh`, which honours `COMPOSE_FILE`; the rehearsal sets it to the production file plus the local override. Keep the flow test from Task 4 green.

- [ ] **Step 2: Run the rehearsal**

Run: `bash deploy/test/local-rehearsal.sh`
Expected: `local-rehearsal: ok`; the first deploy takes about 90 s (Flyway on an empty database).
Fix whatever breaks in the scripts or compose file; this is the step that proves them.

- [ ] **Step 3: Commit**

```bash
git add deploy spec/deployment/00devops.md
git commit -m "test(deploy): local rehearsal of deploy, rollback, backup and restore"
```

---

### Task 6: CI workflow, Dependabot, removal of the old pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`
- Delete: `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`, `.github/workflows/backend-deploy.yml`, `.github/workflows/openapi-sync.yml`, `.github/workflows/lighthouse-ci.yml`
- Modify: `DEPLOYMENT.md` (replace content with a pointer)

**Interfaces:**
- Produces: workflow named `CI`; on `main` it pushes `ghcr.io/vishnuprabhakar42/clipupp-backend:sha-<sha>` and `clipupp-web:sha-<sha>` plus `latest`; job names `backend`, `frontend`, `deploy-assets`, `images`, `gitleaks`.

- [ ] **Step 1: Write ci.yml**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

permissions:
  contents: read

env:
  REGISTRY: ghcr.io
  IMAGE_OWNER: vishnuprabhakar42

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.f.outputs.backend }}
      frontend: ${{ steps.f.outputs.frontend }}
      deploy: ${{ steps.f.outputs.deploy }}
    steps:
      - uses: actions/checkout@v4
      - id: f
        uses: dorny/paths-filter@v3
        with:
          filters: |
            backend: ['backend/clipupp/**', '.github/workflows/ci.yml']
            frontend: ['frontend/clipupp/**', '.github/workflows/ci.yml']
            deploy: ['deploy/**', '.github/workflows/ci.yml']

  backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    defaults: { run: { working-directory: backend/clipupp } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew --no-daemon build
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: backend-test-results, path: backend/clipupp/build/reports/tests, retention-days: 7 }

  frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 25
    defaults: { run: { working-directory: frontend/clipupp } }
    env:
      NEXT_PUBLIC_HOME_DEMO_FEED: 'true'
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: npm, cache-dependency-path: frontend/clipupp/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - name: Start server
        run: |
          npx next start -p 3000 > next-start.log 2>&1 &
          for i in $(seq 1 60); do
            curl -sf -o /dev/null http://localhost:3000/ && curl -sf -o /dev/null http://localhost:3000/hi && exit 0
            sleep 1
          done
          cat next-start.log; exit 1
      - run: npm run test:e2e
      - name: Lighthouse budgets (pull requests)
        if: github.event_name == 'pull_request'
        run: npm run lhci
        env: { LHCI_GITHUB_APP_TOKEN: '${{ secrets.LHCI_GITHUB_APP_TOKEN }}' }
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            frontend/clipupp/node_modules/.cache/playwright
            frontend/clipupp/next-start.log
          retention-days: 7
          include-hidden-files: true

  deploy-assets:
    needs: changes
    if: needs.changes.outputs.deploy == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get install -y -qq shellcheck
      - run: shellcheck -x deploy/scripts/*.sh deploy/server-setup.sh deploy/render-env.sh deploy/test/*.sh
      - run: bash deploy/test/render-env.test.sh
      - run: bash deploy/test/compose-config.test.sh
      - run: bash deploy/test/deploy-flow.test.sh

  gitleaks:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }

  images:
    needs: [changes, backend, frontend]
    # Run when an app changed; on main, backend/frontend may be skipped by the filter, so accept skipped.
    if: always() && (needs.changes.outputs.backend == 'true' || needs.changes.outputs.frontend == 'true') && needs.backend.result != 'failure' && needs.frontend.result != 'failure'
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        include:
          - name: clipupp-backend
            context: backend/clipupp
          - name: clipupp-web
            context: frontend/clipupp
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        if: github.event_name == 'push'
        with: { registry: ghcr.io, username: '${{ github.actor }}', password: '${{ secrets.GITHUB_TOKEN }}' }
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_OWNER }}/${{ matrix.name }}
          tags: |
            type=sha,format=long,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v6
        with:
          context: ${{ matrix.context }}
          platforms: linux/amd64
          push: ${{ github.event_name == 'push' }}
          load: ${{ github.event_name == 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha,scope=${{ matrix.name }}
          cache-to: type=gha,scope=${{ matrix.name }},mode=max
          build-args: |
            GIT_SHA=${{ github.sha }}
            NEXT_PUBLIC_SITE_URL=${{ vars.SITE_URL || 'https://clipupp.com' }}
            NEXT_PUBLIC_GOOGLE_CLIENT_ID=${{ vars.GOOGLE_CLIENT_ID }}
            NEXT_PUBLIC_MEDIA_ORIGIN=${{ vars.R2_PUBLIC_BASE_URL }}
      - name: Trivy (critical, fixed vulnerabilities fail the build)
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_OWNER }}/${{ matrix.name }}:sha-${{ github.sha }}
          severity: CRITICAL
          ignore-unfixed: true
          exit-code: '1'
          format: table
```

Notes: the `build-args` block passes empty values for a repository without those variables, which the Dockerfile defaults handle; on pull requests `load: true` keeps the image local for Trivy. Pin action versions to the latest major available at implementation time.

- [ ] **Step 2: Write dependabot.yml**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /frontend/clipupp
    schedule: { interval: weekly, day: monday }
    groups:
      minor-and-patch: { update-types: [minor, patch] }
    open-pull-requests-limit: 5
  - package-ecosystem: gradle
    directory: /backend/clipupp
    schedule: { interval: weekly, day: monday }
    groups:
      minor-and-patch: { update-types: [minor, patch] }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly, day: monday }
  - package-ecosystem: docker
    directory: /backend/clipupp
    schedule: { interval: weekly, day: monday }
  - package-ecosystem: docker
    directory: /frontend/clipupp
    schedule: { interval: weekly, day: monday }
```

- [ ] **Step 3: Remove the old pipeline and point DEPLOYMENT.md at the spec**

```bash
git rm .github/workflows/backend-ci.yml .github/workflows/frontend-ci.yml .github/workflows/backend-deploy.yml .github/workflows/openapi-sync.yml .github/workflows/lighthouse-ci.yml
```

Replace `DEPLOYMENT.md` with:

```markdown
# Deployment

Clipupp deploys to the Hostinger VPS through GitHub Actions.
The design, the runbooks, and the cutover log live in `spec/deployment/00devops.md`.
```

- [ ] **Step 4: Validate the workflow syntax**

Run: `npx --yes @action-validator/cli@0.6.0 .github/workflows/ci.yml` (or `actionlint` if installed: `brew install actionlint && actionlint`).
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add .github DEPLOYMENT.md
git commit -m "ci: single workflow for both apps, image build and scan, dependabot; retire railway and vercel"
```

---

### Task 7: CD workflows: deploy and rollback with Telegram

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `.github/workflows/rollback.yml`
- Create: `.github/actions/telegram/action.yml`
- Create: `.github/actions/ssh-setup/action.yml`

**Interfaces:**
- Consumes: `deploy/render-env.sh`, `deploy/scripts/*`, compose file, Caddy block; secrets and variables named in spec section 8.2.
- Produces: workflows `Deploy` and `Rollback`; environment `production`.

- [ ] **Step 1: Composite actions**

`.github/actions/telegram/action.yml`:

```yaml
name: Telegram message
description: Posts one message to the operators chat; never fails the job.
inputs:
  token: { required: true }
  chat_id: { required: true }
  text: { required: true }
runs:
  using: composite
  steps:
    - shell: bash
      env: { T: '${{ inputs.token }}', C: '${{ inputs.chat_id }}', X: '${{ inputs.text }}' }
      run: |
        curl -fsS -m 10 -o /dev/null -X POST "https://api.telegram.org/bot${T}/sendMessage" \
          --data-urlencode "chat_id=${C}" --data-urlencode "text=${X}" --data-urlencode "disable_web_page_preview=true" \
          || echo "::warning::telegram notification failed"
```

`.github/actions/ssh-setup/action.yml`:

```yaml
name: SSH setup
description: Loads the deploy key and pins the server host key.
inputs:
  key: { required: true }
  host: { required: true }
  host_key: { required: true }
runs:
  using: composite
  steps:
    - shell: bash
      env: { KEY: '${{ inputs.key }}', HOST: '${{ inputs.host }}', HOSTKEY: '${{ inputs.host_key }}' }
      run: |
        mkdir -p ~/.ssh && chmod 700 ~/.ssh
        printf '%s\n' "$KEY" > ~/.ssh/deploy_key && chmod 600 ~/.ssh/deploy_key
        printf '%s\n' "$HOSTKEY" > ~/.ssh/known_hosts
        printf 'Host vps\n  HostName %s\n  User deploy\n  IdentityFile ~/.ssh/deploy_key\n  IdentitiesOnly yes\n  StrictHostKeyChecking yes\n' "$HOST" > ~/.ssh/config
```

- [ ] **Step 2: deploy.yml**

```yaml
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:
    inputs:
      sha:
        description: Full 40-character commit sha to deploy (default: head of main)
        required: false

concurrency:
  group: deploy-production
  cancel-in-progress: false

permissions:
  contents: read
  packages: read

jobs:
  resolve:
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    outputs:
      sha: ${{ steps.s.outputs.sha }}
      short: ${{ steps.s.outputs.short }}
    steps:
      - id: s
        run: |
          sha="${{ github.event.inputs.sha || github.event.workflow_run.head_sha || github.sha }}"
          echo "sha=$sha" >> "$GITHUB_OUTPUT"; echo "short=${sha:0:7}" >> "$GITHUB_OUTPUT"

  notify-start:
    needs: resolve
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/telegram
        with:
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          chat_id: ${{ secrets.TELEGRAM_CHAT_ID }}
          text: "Clipupp deploy requested: ${{ needs.resolve.outputs.short }} by ${{ github.actor }}. Waiting for approval: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"

  deploy:
    needs: [resolve, notify-start]
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment:
      name: production
      url: ${{ vars.SITE_URL }}
    env:
      SHA: ${{ needs.resolve.outputs.sha }}
    steps:
      - uses: actions/checkout@v4
        with: { ref: '${{ needs.resolve.outputs.sha }}' }
      - uses: ./.github/actions/ssh-setup
        with: { key: '${{ secrets.DEPLOY_SSH_KEY }}', host: '${{ secrets.DEPLOY_HOST }}', host_key: '${{ secrets.DEPLOY_HOST_KEY }}' }
      - name: Render server env from GitHub secrets and variables
        env:
          IMAGE_TAG: sha-${{ needs.resolve.outputs.sha }}
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
          DB_USERNAME: ${{ secrets.DB_USERNAME }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          R2_ACCESS_KEY: ${{ secrets.R2_ACCESS_KEY }}
          R2_SECRET_KEY: ${{ secrets.R2_SECRET_KEY }}
          RCLONE_CONFIG_R2_ACCESS_KEY_ID: ${{ secrets.RCLONE_CONFIG_R2_ACCESS_KEY_ID }}
          RCLONE_CONFIG_R2_SECRET_ACCESS_KEY: ${{ secrets.RCLONE_CONFIG_R2_SECRET_ACCESS_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          PUBLIC_SITE_URL: ${{ vars.SITE_URL }}
          API_BASE_URL: ${{ vars.SITE_URL }}
          CORS_ALLOWED_ORIGINS: ${{ vars.SITE_URL }}
          EMAIL_PROVIDER: ${{ vars.EMAIL_PROVIDER }}
          EMAIL_FROM: ${{ vars.EMAIL_FROM }}
          R2_BUCKET: ${{ vars.R2_BUCKET }}
          R2_PUBLIC_BASE_URL: ${{ vars.R2_PUBLIC_BASE_URL }}
          R2_ENDPOINT: ${{ vars.R2_ENDPOINT }}
          R2_REGION: ${{ vars.R2_REGION }}
          RCLONE_CONFIG_R2_ENDPOINT: ${{ vars.RCLONE_CONFIG_R2_ENDPOINT }}
          BACKUP_BUCKET: ${{ vars.BACKUP_BUCKET }}
          GOOGLE_CLIENT_ID: ${{ vars.GOOGLE_CLIENT_ID }}
          DB_POOL_SIZE: ${{ vars.DB_POOL_SIZE }}
          BACKUP_RETAIN_DAYS: ${{ vars.BACKUP_RETAIN_DAYS }}
        run: bash deploy/render-env.sh "$RUNNER_TEMP/env"
      - name: Write backup key file
        env: { BACKUP_KEY: '${{ secrets.BACKUP_KEY }}' }
        run: |
          [ -n "$BACKUP_KEY" ] || { echo "BACKUP_KEY secret is empty"; exit 2; }
          umask 077; printf '%s\n' "$BACKUP_KEY" > "$RUNNER_TEMP/backup-key"
      - name: Ship compose, scripts, env
        run: |
          ssh vps 'mkdir -p /opt/clipupp/scripts'
          scp -q deploy/docker-compose.prod.yml deploy/clipupp.caddy vps:/opt/clipupp/
          scp -q deploy/scripts/*.sh vps:/opt/clipupp/scripts/
          scp -q "$RUNNER_TEMP/env" vps:/opt/clipupp/.env
          scp -q "$RUNNER_TEMP/backup-key" vps:/opt/clipupp/.backup-key
          ssh vps 'chmod 700 /opt/clipupp/scripts/*.sh && chmod 600 /opt/clipupp/.env /opt/clipupp/.backup-key'
      - name: Deploy
        env: { GHCR_TOKEN: '${{ secrets.GITHUB_TOKEN }}', ACTOR: '${{ github.actor }}' }
        run: |
          ssh vps "echo '$GHCR_TOKEN' | docker login ghcr.io -u '$ACTOR' --password-stdin >/dev/null && cd /opt/clipupp && scripts/deploy.sh sha-$SHA"

  smoke:
    needs: [resolve, deploy]
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Smoke checks against ${{ vars.SITE_URL }}
        env: { SITE: '${{ vars.SITE_URL }}', SHA: '${{ needs.resolve.outputs.sha }}' }
        run: |
          set -euo pipefail
          for i in $(seq 1 20); do curl -fsS -o /dev/null "$SITE/api/health" && break; sleep 3; done
          health="$(curl -fsS "$SITE/api/health")"; echo "$health"
          grep -q '"backend":"up"' <<<"$health"
          grep -q "\"version\":\"$SHA\"" <<<"$health"
          curl -fsS -o /dev/null -w "home %{http_code}\n" "$SITE/"
          curl -fsS -o /dev/null -w "hindi %{http_code}\n" "$SITE/hi"
          curl -fsS -o /dev/null -w "homepage api %{http_code}\n" "$SITE/api/v1/homepage"
          [ "$(curl -s "$SITE/" | grep -ci cashback)" = "0" ]

  notify-result:
    needs: [resolve, deploy, smoke]
    if: always() && needs.resolve.result == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/telegram
        with:
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          chat_id: ${{ secrets.TELEGRAM_CHAT_ID }}
          text: >-
            ${{ (needs.deploy.result == 'success' && needs.smoke.result == 'success') && 'Clipupp deployed' || 'Clipupp deploy FAILED' }}:
            ${{ needs.resolve.outputs.short }} (deploy ${{ needs.deploy.result }}, smoke ${{ needs.smoke.result }}).
            ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
            ${{ (needs.deploy.result == 'success' && needs.smoke.result == 'success') && '' || 'Rollback: Actions > Rollback > Run workflow.' }}
```

- [ ] **Step 3: rollback.yml**

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      tag:
        description: Image tag to roll back to (sha-<40 hex>); empty = previous release
        required: false

concurrency:
  group: deploy-production
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  rollback:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment:
      name: production
      url: ${{ vars.SITE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/ssh-setup
        with: { key: '${{ secrets.DEPLOY_SSH_KEY }}', host: '${{ secrets.DEPLOY_HOST }}', host_key: '${{ secrets.DEPLOY_HOST_KEY }}' }
      - name: Roll back
        env: { TAG: '${{ github.event.inputs.tag }}' }
        run: ssh vps "cd /opt/clipupp && scripts/rollback.sh $TAG"
      - name: Smoke
        env: { SITE: '${{ vars.SITE_URL }}' }
        run: |
          set -euo pipefail
          for i in $(seq 1 20); do curl -fsS -o /dev/null "$SITE/api/health" && break; sleep 3; done
          curl -fsS "$SITE/api/health" | grep -q '"backend":"up"'
          curl -fsS -o /dev/null "$SITE/"
      - uses: ./.github/actions/telegram
        if: always()
        with:
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          chat_id: ${{ secrets.TELEGRAM_CHAT_ID }}
          text: "Clipupp rollback ${{ job.status }} (target: ${{ github.event.inputs.tag || 'previous' }}) by ${{ github.actor }}. ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

- [ ] **Step 4: Validate and commit**

Run: `actionlint` (or the action-validator command from Task 6).
Expected: no errors.

```bash
git add .github
git commit -m "cd: deploy on approved main builds over ssh, rollback workflow, telegram notifications"
```

---

### Task 8: Server bootstrap, GitHub environment, first deploy on the sslip host

This task is operated by the controller with Vishnu, not by an implementer subagent, because it touches the live server and needs values only Vishnu has.

**Files:**
- Modify: `spec/deployment/00devops.md` (section 11 log, any deviation found on the server)

- [ ] **Step 1: Generate the CI deploy key and host key (local machine)**

```bash
ssh-keygen -t ed25519 -N '' -C clipupp-ci -f /tmp/clipupp-ci
ssh-keyscan -t ed25519 187.127.130.103 2>/dev/null > /tmp/clipupp-hostkey
```

Append `/tmp/clipupp-ci.pub` to `/home/deploy/.ssh/authorized_keys` on the VPS (as root, via the working root key), then delete `/tmp/clipupp-ci` after it is stored in GitHub.

- [ ] **Step 2: Vishnu creates the GitHub environment and secrets**

Give Vishnu this list to create under Settings > Environments > `production` (no required reviewer: unavailable on this plan; required setup item: deployment branches rule set to `main` only, which GitHub enforces; environment secrets are readable only by jobs declaring the environment).
Secrets: `DEPLOY_SSH_KEY` (contents of `/tmp/clipupp-ci`), `DEPLOY_HOST=187.127.130.103`, `DEPLOY_HOST_KEY` (contents of `/tmp/clipupp-hostkey`), `POSTGRES_PASSWORD`, `DB_USERNAME=clipupp`, `DB_PASSWORD` (same as `POSTGRES_PASSWORD`), `JWT_SECRET` (`openssl rand -hex 48`), `RESEND_API_KEY`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `RCLONE_CONFIG_R2_ACCESS_KEY_ID`, `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY`, `BACKUP_KEY` (`openssl rand -base64 48`).
Repository-level secrets (Settings > Secrets and variables > Actions): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
Variables: `SITE_URL=https://clipupp.187-127-130-103.sslip.io`, `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_ENDPOINT`, `R2_REGION=auto`, `RCLONE_CONFIG_R2_ENDPOINT`, `BACKUP_BUCKET=clipupp-backups`, `GOOGLE_CLIENT_ID`, `DB_POOL_SIZE=10`, `BACKUP_RETAIN_DAYS=30`.
Repository variables (used by CI image build): `SITE_URL`, `GOOGLE_CLIENT_ID`, `R2_PUBLIC_BASE_URL`.

- [ ] **Step 3: Bootstrap the server**

```bash
scp -i ~/.ssh/id_rsa_3dot14 deploy/server-setup.sh root@187.127.130.103:/root/
ssh -i ~/.ssh/id_rsa_3dot14 root@187.127.130.103 'bash /root/server-setup.sh'
```

Expected: ends with `server-setup: done`; `swapon --show` lists `/swapfile`; `fail2ban-client status sshd` shows the jail.

- [ ] **Step 4: Add the Caddy block and reload**

```bash
scp -i ~/.ssh/id_rsa_3dot14 deploy/clipupp.caddy root@187.127.130.103:/opt/clipupp/clipupp.caddy
ssh -i ~/.ssh/id_rsa_3dot14 root@187.127.130.103 'cp /opt/r2r/Caddyfile /opt/r2r/Caddyfile.bak.$(date +%s) && cat /opt/clipupp/clipupp.caddy >> /opt/r2r/Caddyfile && docker compose -f /opt/r2r/docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile && docker compose -f /opt/r2r/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile'
```

Expected: validate prints `Valid configuration`; reload succeeds. Caddy returns 502 for the clipupp hosts until the first deploy; the other sites keep working (`curl -sI https://opaks.gounmanual.com | head -1` is 200).

- [ ] **Step 5: Merge the branch and run the first deploy**

Open a pull request from `devops-cicd` to `main`, confirm CI is green (all jobs), merge.
Wait for CI on `main` to push the images, then approve the `production` job in the Deploy run.
Expected: deploy log shows the dump, backend ready, web healthy; smoke green; Telegram message; `https://clipupp.187-127-130-103.sslip.io/` serves the homepage.

- [ ] **Step 6: Prove rollback and the failure path**

Run the Rollback workflow with no tag after a second deploy exists; expect success and a Telegram message.
Then redeploy `main` by `workflow_dispatch`.

- [ ] **Step 7: Record outcomes in the spec**

Append to section 11: date, first deployed sha, measured deploy duration, any deviation.

---

### Task 9: DNS cutover and verification

Operated by the controller with Vishnu.

- [ ] **Step 1: Lower TTL and switch records**

In the DNS provider for `clipupp.com`: `A @ 187.127.130.103` (TTL 300), `A www 187.127.130.103`, remove the Vercel records.

- [ ] **Step 2: Watch Caddy issue certificates**

`ssh root@187.127.130.103 'docker logs --since 10m r2r-caddy-1 2>&1 | grep -i "clipupp.com" | grep -iE "certificate|obtain|error"'` until `certificate obtained successfully` for both hosts.

- [ ] **Step 3: Flip SITE_URL and the sslip block**

Set the `production` variable `SITE_URL=https://clipupp.com` and the repository variable `SITE_URL` the same; edit `deploy/clipupp.caddy` so the sslip block is `redir https://clipupp.com{uri} permanent`; commit; on the server apply the same edit in place with `sed -i` on `/opt/r2r/Caddyfile` and reload; run Deploy so the web image is rebuilt with the final `NEXT_PUBLIC_SITE_URL`.

- [ ] **Step 4: Verify**

```bash
curl -sI https://clipupp.com | head -1
curl -sI https://www.clipupp.com | grep -i location
curl -s https://clipupp.com/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://clipupp.com/hi
curl -s -o /dev/null -w "%{http_code}\n" https://clipupp.com/sitemap.xml
curl -s -o /dev/null -w "%{http_code}\n" https://clipupp.com/robots.txt
curl -s https://clipupp.com | grep -ci cashback
```

Expected: 200, redirect to `https://clipupp.com/`, backend up with the deployed sha, 200, 200, 200, `0`.
Sign in, reveal a coupon, open the admin, request an OG image by hand.

- [ ] **Step 5: Remove the Vercel project; log the cutover in the spec; commit**

```bash
git add deploy/clipupp.caddy spec/deployment/00devops.md
git commit -m "docs(devops): cutover to the vps completed, sslip host redirects"
```
