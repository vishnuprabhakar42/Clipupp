# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Clipupp backend — production Dockerfile
# Alpine multi-stage. Why Alpine over Debian:
#   - smaller runtime image (~80 MB vs ~250 MB)
#   - BusyBox `adduser -S` auto-assigns a free UID, so no "UID 1000 is not
#     unique" collision against base images that already ship that UID.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:24-jdk-alpine AS builder

WORKDIR /app

# Copy Gradle wrapper + dependency files first → dependency-download layer is
# cached as long as build.gradle / settings.gradle don't change.
COPY gradle/ gradle/
COPY gradlew gradlew
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew

# Pre-fetch dependencies (warms the cache; the `|| true` covers Gradle's
# legitimate non-zero exits on unresolved configs without breaking the build).
RUN ./gradlew dependencies --no-daemon -q || true

# Build the boot jar. Tests run in backend-ci, not here.
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test


# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:24-jre-alpine

WORKDIR /app

# Pick up Alpine security fixes published after the base image was built (Trivy gates on them).
RUN apk upgrade --no-cache

# Non-root user - BusyBox -S = system account, GID/UID auto-assigned.
RUN addgroup -S clipupp && adduser -S clipupp -G clipupp

# build.gradle pins archiveFileName = 'app.jar', so the path is deterministic.
COPY --from=builder --chown=clipupp:clipupp /app/build/libs/app.jar /app/app.jar

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
# 127.0.0.1, not localhost: BusyBox wget may resolve localhost to ::1 while the server binds IPv4.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health/readiness >/dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
