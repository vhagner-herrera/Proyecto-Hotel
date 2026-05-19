# ── BUILD ──────────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

COPY pom.xml                        ./pom.xml
COPY auth-service/pom.xml           ./auth-service/pom.xml
COPY habitaciones-service/pom.xml   ./habitaciones-service/pom.xml
COPY reservas-service/pom.xml       ./reservas-service/pom.xml

COPY administracion-service/pom.xml ./administracion-service/pom.xml
COPY hotel-gateway/pom.xml          ./hotel-gateway/pom.xml

RUN mvn install -N -q && \
    mvn dependency:resolve -pl administracion-service -q

COPY administracion-service/src ./administracion-service/src

RUN mvn package -pl administracion-service -DskipTests -q

# ── RUNTIME ────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S hotel && adduser -S hotel -G hotel
USER hotel

COPY --from=builder /workspace/administracion-service/target/*.jar app.jar

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
