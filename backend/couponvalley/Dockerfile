# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# ClipUpp backend — production Dockerfile
# Multi-stage build keeps the runtime image lean (no JDK, no Gradle cache,
# no test classes). Suitable for Railway, Render, Fly.io, AWS ECS / EKS.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1 — build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copy Gradle wrapper + build files first so the dependency download layer
# is cached as long as build.gradle / settings.gradle don't change.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon --version

# Resolve dependencies (cached unless build.gradle changes)
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

# Now copy sources and build the boot jar
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test

# Verify the artifact name matches build.gradle's bootJar.archiveFileName
RUN test -f build/libs/app.jar || (ls -lah build/libs && false)


# ── Stage 2 — runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre

# Run as a non-root user for safety.
RUN groupadd --system clipupp && \
    useradd  --system --gid clipupp --uid 1000 --home /app --shell /sbin/nologin clipupp && \
    mkdir -p /app && chown clipupp:clipupp /app

WORKDIR /app
COPY --from=build --chown=clipupp:clipupp /workspace/build/libs/app.jar /app/app.jar

USER clipupp

# Container-aware JVM flags + UTF-8 + urandom for fast SecureRandom seeding.
# MaxRAMPercentage lets the JVM right-size its heap against the container
# memory limit (Railway containers default to 512 MB → ~384 MB heap).
ENV JAVA_OPTS="\
    -XX:+UseG1GC \
    -XX:MaxRAMPercentage=75 \
    -XX:+ExitOnOutOfMemoryError \
    -Djava.security.egd=file:/dev/./urandom \
    -Dfile.encoding=UTF-8 \
    -Duser.timezone=UTC"

EXPOSE 8080

# Spring Boot reads $PORT via ${PORT:8080} fallback in application.yml after we
# wire SERVER_PORT=$PORT in Railway. Falls back to 8080 when not set (local).
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
