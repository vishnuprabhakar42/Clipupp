# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Clipupp backend — production Dockerfile
# Alpine multi-stage. Why Alpine over Debian:
#   - smaller runtime image (~80 MB vs ~250 MB)
#   - BusyBox `adduser -S` auto-assigns a free UID, so no "UID 1000 is not
#     unique" collision against base images that already ship that UID.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

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
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user — BusyBox -S = system account, GID/UID auto-assigned.
RUN addgroup -S clipupp && adduser -S clipupp -G clipupp

# build.gradle pins archiveFileName = 'app.jar', so the path is deterministic.
COPY --from=builder --chown=clipupp:clipupp /app/build/libs/app.jar /app/app.jar

USER clipupp

# Default to the prod profile so a misconfigured Railway service still boots
# safely. Override via env if needed.
ENV SPRING_PROFILES_ACTIVE=prod

# Container-aware JVM: heap auto-sizes to the container memory limit.
# Railway's default 512 MB container → ~384 MB heap.
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8 -Duser.timezone=UTC"

EXPOSE 8080

# Spring picks up $PORT via ${PORT:8080} in application.yml when Railway
# injects it; falls back to 8080 locally.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
