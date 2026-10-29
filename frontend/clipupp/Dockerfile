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
# Server-side proxy target; read by next.config.mjs rewrites at build time. clipupp-backend is the
# backend container name, unique on the host; a bare service name such as "backend" could also
# resolve on the shared edge network the web container joins.
ARG BACKEND_URL=http://clipupp-backend:8080
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
# Pick up Alpine security fixes published after the base image was built (Trivy gates on them).
RUN apk upgrade --no-cache
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
ARG BACKEND_URL=http://clipupp-backend:8080
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
# 127.0.0.1, not localhost: BusyBox wget may resolve localhost to ::1 while the server binds IPv4.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
