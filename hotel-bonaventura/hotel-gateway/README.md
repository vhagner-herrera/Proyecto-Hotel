# Hotel Gateway — API Gateway

Servicio de entrada única para todo el sistema Hotel BonAventura. Implementado con **Spring Cloud Gateway** (reactivo, basado en WebFlux). Se encarga de enrutar peticiones a los microservicios internos, validar tokens JWT y gestionar CORS.

---

## Función Principal

- **Punto de entrada único** para todas las peticiones del frontend y clientes externos.
- **Validación global de JWT** antes de reenviar cualquier petición a los microservicios.
- **Enrutamiento dinámico** según el prefijo de URL.
- **Gestión de CORS** para el frontend React.
- **Propagación de contexto** del usuario autenticado mediante headers HTTP.

---

## Puerto

| Entorno | Puerto |
|---------|--------|
| Docker (externo) | **8080** |
| Docker (interno) | 8080 |

---

## Estructura de Carpetas

```
hotel-gateway/
├── src/
│   └── main/
│       ├── java/com/hotelbonaventura/gateway/
│       │   ├── HotelGatewayApplication.java     # Punto de entrada Spring Boot
│       │   ├── config/
│       │   │   ├── GatewayConfig.java            # Definición de rutas y predicados
│       │   │   └── CorsConfig.java               # CORS global (WebFilter reactivo)
│       │   └── filter/
│       │       └── JwtAuthenticationFilter.java  # Filtro JWT (GlobalFilter)
│       └── resources/
│           └── application.yml                   # Configuración del servicio
├── Dockerfile                                    # Build multi-stage (Maven → JRE Alpine)
└── pom.xml                                       # Dependencias del módulo
```

---

## Cómo Está Construido

### Tecnología Base

Spring Cloud Gateway usa **Spring WebFlux** (programación reactiva), lo que lo hace no bloqueante y eficiente para alta concurrencia.

### Enrutamiento (`GatewayConfig.java`)

Define las rutas mediante predicados de path que redirigen a los servicios internos:

```
/api/auth/**           →  http://auth-service:8081
/api/habitaciones/**   →  http://habitaciones-service:8082
/api/reservas/**       →  http://reservas-service:8083
/api/pagos/**          →  http://pagos-service:8084
/api/admin/**          →  http://administracion-service:8085
```

Los nombres de host (`auth-service`, `habitaciones-service`, etc.) son resueltos por la red Docker `hotel-net`.

### Filtro JWT (`JwtAuthenticationFilter.java`)

Implementa `GlobalFilter` con prioridad `HIGHEST_PRECEDENCE`, ejecutándose **antes** que cualquier otro filtro:

```
Para cada petición entrante:
  ├── ¿Es ruta pública? (/api/auth/login)
  │       └── Sí → dejar pasar sin validar
  │
  ├── ¿Tiene header Authorization: Bearer <token>?
  │       └── No → retorna 401 Unauthorized
  │
  ├── ¿Token válido? (firma + expiración con JJWT)
  │       └── No → retorna 401 Unauthorized
  │
  └── Extraer claims (email, rol)
          └── Inyectar headers: X-User-Email, X-User-Role
          └── Continuar cadena de filtros → microservicio destino
```

### CORS (`CorsConfig.java`)

Configurado como `CorsWebFilter` reactivo (no `CorsFilter` de Servlet):

```
Orígenes permitidos: http://localhost:3000 (frontend Docker)
Métodos:            GET, POST, PUT, DELETE, OPTIONS
Headers permitidos: Authorization, Content-Type
Credenciales:       true
Max-age:            3600 segundos
```

---

## Diagrama de Flujo

```
Cliente / Frontend
        │
        │  HTTP Request + Authorization: Bearer <token>
        ▼
┌───────────────────────────────────────────────────┐
│                 HOTEL GATEWAY :8080                │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │         JwtAuthenticationFilter              │  │
│  │  (GlobalFilter, HIGHEST_PRECEDENCE)          │  │
│  │                                             │  │
│  │  /api/auth/login → SKIP (ruta pública)      │  │
│  │  Otras rutas:                               │  │
│  │    ├── Sin token     → 401 Unauthorized     │  │
│  │    ├── Token inválido→ 401 Unauthorized     │  │
│  │    └── Token válido  → inyecta headers      │  │
│  └─────────────────────────────────────────────┘  │
│                        │                          │
│  ┌─────────────────────▼────────────────────────┐ │
│  │              GatewayConfig (Routes)           │ │
│  │                                              │ │
│  │  /api/auth/**       → auth-service:8081      │ │
│  │  /api/habitaciones/**→ habitaciones-svc:8082 │ │
│  │  /api/reservas/**   → reservas-service:8083  │ │
│  │  /api/pagos/**      → pagos-service:8084     │ │
│  │  /api/admin/**      → administracion-svc:8085│ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
        │
        │  HTTP Request + X-User-Email + X-User-Role
        ▼
   Microservicio destino (interno, red hotel-net)
```

---

## Dependencias de Arranque

En `docker-compose.yml`, el Gateway solo arranca cuando **todos** los microservicios están healthy:

```yaml
depends_on:
  auth-service:          { condition: service_healthy }
  habitaciones-service:  { condition: service_healthy }
  reservas-service:      { condition: service_healthy }
  pagos-service:         { condition: service_healthy }
  administracion-service:{ condition: service_healthy }
```

---

## Variables de Entorno Relevantes

| Variable | Uso |
|----------|-----|
| `JWT_SECRET` | Clave para verificar la firma del JWT (debe coincidir con auth-service) |
| `JWT_EXPIRATION` | Expiración en ms (solo informativo; el filtro verifica la expiración del token) |
