# ClipUpp — Production Deployment

Backend → Railway (Spring Boot 4 + Postgres). Frontend → Vercel (Next.js 15).

This doc walks through a green-field deploy. For day-2 operations (rotations,
migrations, scaling) see the inline comments in the files referenced below.

---

## 0. Prerequisites

- GitHub repo containing this monorepo, pushed.
- A Cloudflare R2 bucket (or any S3-compatible store) for admin media uploads.
- A Resend account with a verified sending domain → API key.
- (Optional) A custom domain.

---

## 1. Backend — Railway

### 1.1 Create the project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pick the ClipUpp repo.
2. Click **+ Add → Database → PostgreSQL**. Railway provisions a managed Postgres and injects `PGHOST / PGUSER / PGPASSWORD / PGDATABASE / PGPORT` into the same project.

### 1.2 Configure the backend service

- **Root Directory**: `backend/couponvalley`
- **Build**: the repo ships [`backend/couponvalley/Dockerfile`](./backend/couponvalley/Dockerfile) and [`railway.json`](./backend/couponvalley/railway.json) — Railway auto-detects them. No build / start command override needed.
- **Health check**: already declared in `railway.json` as `/actuator/health`.

### 1.3 Backend environment variables

Open the backend service → **Variables** → paste the values from
[`.env.production.example`](./.env.production.example). Required keys:

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SERVER_PORT` | `${{ PORT }}` (Railway reference variable) |
| `DB_URL` | `jdbc:postgresql://${{ Postgres.PGHOST }}:${{ Postgres.PGPORT }}/${{ Postgres.PGDATABASE }}` |
| `DB_USERNAME` | `${{ Postgres.PGUSER }}` |
| `DB_PASSWORD` | `${{ Postgres.PGPASSWORD }}` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `PUBLIC_SITE_URL` | Vercel domain (set after frontend deploy) |
| `API_BASE_URL` | Railway domain (set after first backend deploy) |
| `CORS_ALLOWED_ORIGINS` | Vercel domain |
| `COOKIE_SECURE` | `true` |
| `EMAIL_PROVIDER` | `resend` (or `logging` to defer wiring) |
| `EMAIL_FROM` | `no-reply@verified-domain.example` |
| `RESEND_API_KEY` | `re_xxxx` |
| `R2_BUCKET` / `R2_PUBLIC_BASE_URL` / `R2_ENDPOINT` / `R2_REGION` / `R2_ACCESS_KEY` / `R2_SECRET_KEY` | Cloudflare R2 token values |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

Optional:
| Variable | Default | Notes |
|---|---|---|
| `DB_POOL_SIZE` | `25` | Hikari max-pool-size |
| `COUPONVALLEY_RATELIMIT_PUBLIC_PER_MIN` | `120` | Per-IP req/min on public GETs |
| `COUPONVALLEY_RATELIMIT_WINDOW_SECONDS` | `60` | Bucket refill window |

### 1.4 Expose a public URL

Backend service → **Settings → Networking → Generate Domain**. Note the URL — that's `API_BASE_URL`. Update the env var.

### 1.5 First deploy + verification

Railway redeploys on env-var change. Watch the build log:
- Stage 1 builds with Gradle wrapper (`./gradlew bootJar -x test`).
- Stage 2 ships a JRE-only runtime image.
- Flyway runs on first boot — migrations `V001` … `V031` apply.

Smoke tests:
```bash
curl https://<railway-domain>/actuator/health
# → {"status":"UP"}

curl https://<railway-domain>/api/v1/stores?limit=4 | head -c 200
# → JSON with seeded stores (proves DB + Flyway worked)

curl https://<railway-domain>/api/v1/settings/public | head -c 200
# → JSON; brand.name should read "ClipUpp" (proves V031 rebrand-data migration ran)

curl -i https://<railway-domain>/v3/api-docs
# → 404 (Swagger is disabled in prod by application-prod.yml)
```

---

## 2. Frontend — Vercel

### 2.1 Import the project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. **Root Directory**: `frontend/couponvalley`
3. **Framework Preset**: Next.js (auto-detected).
4. Leave Build / Install / Output commands as defaults.

### 2.2 Environment variables

| Variable | Value |
|---|---|
| `BACKEND_URL` | Railway public URL (`https://…`) |
| `NEXT_PUBLIC_SITE_URL` | Vercel public URL (`https://…`) |
| `NEXT_PUBLIC_API_BASE_URL` | *(empty — keeps browser fetches same-origin via the rewrite)* |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### 2.3 Deploy

Click **Deploy**. Vercel builds, prerenders the static pages (homepage + every `[slug]` via `generateStaticParams`), and gives you a `*.vercel.app` URL.

### 2.4 Loop back to Railway

Once the Vercel URL is known, update:
```
PUBLIC_SITE_URL       = https://<vercel-domain>
CORS_ALLOWED_ORIGINS  = https://<vercel-domain>
```
Railway will roll a new revision automatically.

---

## 3. Post-deploy checklist

Backend:
- [ ] `GET /actuator/health` → 200 `{"status":"UP"}`
- [ ] `GET /api/v1/stores?limit=4` → 200 with stores
- [ ] `GET /api/v1/settings/public` → 200 with `"brand.name":"ClipUpp"`
- [ ] `GET /v3/api-docs` → 404 (Swagger disabled in prod)
- [ ] `GET /api/v1/dev/seed` → 404 (dev endpoint absent in prod profile)
- [ ] Hammer `/api/v1/stores` 200+ times → 429 with `Retry-After` (rate limiter works)
- [ ] Logs are single-line JSON (greppable in Railway log viewer)

Frontend:
- [ ] Homepage loads, sections render
- [ ] DevTools → Network: `/api/v1/homepage` returns 200 (rewrite + CORS work)
- [ ] Sign-in / sign-up flow completes (cookie auth, JWT refresh)
- [ ] Click a coupon → `/r/{id}` opens the merchant in a new tab (redirect proxy works)
- [ ] Admin login: log in as an `ADMIN` user → `/admin` loads

---

## 4. Custom domain

**Vercel** (frontend on `clipupp.com`):
- Project → Settings → Domains → add `clipupp.com` + `www.clipupp.com`. Apply the DNS records Vercel gives you at your registrar.

**Railway** (backend on `api.clipupp.com`):
- Backend service → Settings → Networking → Custom Domain → add `api.clipupp.com`. Point a `CNAME` at the value Railway provides.

After both domains resolve, **update env vars and redeploy both**:
- Railway: `PUBLIC_SITE_URL=https://clipupp.com`, `CORS_ALLOWED_ORIGINS=https://clipupp.com,https://www.clipupp.com`, `API_BASE_URL=https://api.clipupp.com`
- Vercel: `BACKEND_URL=https://api.clipupp.com`, `NEXT_PUBLIC_SITE_URL=https://clipupp.com`

---

## 5. Operations

### Logs
Railway → backend service → **Logs** tab. Logs are emitted as one JSON line per entry; copy a line and run it through `jq` to filter fields.

### Database backups
Railway Postgres on the paid plan includes automatic daily backups + point-in-time recovery. Enable in the Postgres service settings before any real traffic.

### Migrations
New Flyway migrations apply automatically on boot. **Never edit an applied migration file** — write a new `V0xx__name.sql`. Backend dev profile has auto-`repair()` for editing convenience; **prod does not**, so the file/checksum match is enforced.

If you ever need to repair prod schema history (e.g. you intentionally rewrote a migration after a release), set `FLYWAY_REPAIR=true` env var, redeploy, then unset it.

### Rotating secrets
- **JWT_SECRET**: rotating invalidates every active session immediately. Push the new value, redeploy. All users must sign in again.
- **R2 keys**: rotate in Cloudflare → R2 → Manage R2 API tokens. Update Railway envs. Admin uploads will switch over on the next request.
- **RESEND_API_KEY**: rotate in Resend dashboard → API Keys. Update Railway envs.

### Scaling
Phase 1 is built for a single backend instance:
- In-memory Caffeine cache → won't share across nodes
- In-memory Bucket4j rate limiter → enforced per-node
- Outbox poller runs on every node (idempotent by design)

When the time comes to scale horizontally, swap Caffeine for Redis-backed cache and `Bucket4jProxyManager` for Redis backing — both are one-line dependency injections.

---

## 6. Security notes

- **Dev seed endpoint** (`/api/v1/dev/seed`) is `@Profile("dev")` — the controller bean is never registered in prod.
- **Swagger UI + raw OpenAPI doc** are disabled in prod via `application-prod.yml` (`springdoc.api-docs.enabled=false`, `springdoc.swagger-ui.enabled=false`). SecurityConfig also drops the public allowlist for those paths when the prod profile is active.
- **The `cv_rt` refresh cookie** is `HttpOnly`, `Secure`, `SameSite=Lax`. It only travels over HTTPS because `COOKIE_SECURE=true` is set in prod.
- **CSP** ships in report-only mode from `next.config.mjs`. After ~2 weeks of report-only telemetry, flip it to enforcement by renaming the header.
- **CORS** is locked to `CORS_ALLOWED_ORIGINS` — set this to your Vercel domain (or custom domain) and nothing else.
- **The dev `application-dev.yml`** contains live Cloudflare R2 credentials (intentionally, so the Gradle daemon doesn't drop env vars on macOS). Before going to production, **rotate those keys in Cloudflare** so the committed copy can't be used to access prod media.
