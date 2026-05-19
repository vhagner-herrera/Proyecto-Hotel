# ── BUILD ──────────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# POMs separados para aprovechar cache de capas
COPY pom.xml                        ./pom.xml
COPY auth-service/pom.xml           ./auth-service/pom.xml
COPY habitaciones-service/pom.xml   ./habitaciones-service/pom.xml
COPY reservas-service/pom.xml       ./reservas-service/pom.xml

COPY administracion-service/pom.xml ./administracion-service/pom.xml
COPY hotel-gateway/pom.xml          ./hotel-gateway/pom.xml

# Instalar padre y resolver dependencias del servicio (cacheado mientras no cambien los pom)
RUN mvn install -N -q && \
    mvn dependency:resolve -pl auth-service -q

# Fuentes del servicio
COPY auth-service/src ./auth-service/src

# Compilar solo este módulo
RUN mvn package -pl auth-service -DskipTests -q

# ── RUNTIME ────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S hotel && adduser -S hotel -G hotel
USER hotel

COPY --from=builder /workspace/auth-service/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
