# Auth Service — Hotel BonAventura

Microservicio de autenticación del sistema hotelero **Hotel BonAventura**.  
Responsable de validar credenciales, generar tokens JWT y gestionar el acceso de usuarios.

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Stack tecnológico](#stack-tecnológico)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Base de datos](#base-de-datos)
6. [Endpoint de login](#endpoint-de-login)
7. [Flujo de autenticación](#flujo-de-autenticación)
8. [Token JWT](#token-jwt)
9. [Seguridad](#seguridad)
10. [Configuración](#configuración)
11. [Cómo ejecutar](#cómo-ejecutar)
12. [Pruebas con Postman](#pruebas-con-postman)
13. [Errores posibles](#errores-posibles)

---

## Descripción general

El `auth-service` es el único microservicio que maneja identidad dentro del sistema. Su función es **exclusivamente de autenticación**: no gestiona permisos de negocio ni lógica hotelera.

```
Responsabilidades:
  ✓ Validar correo y contraseña contra la BD Supabase
  ✓ Verificar contraseñas hasheadas con BCrypt
  ✓ Verificar que el usuario esté ACTIVO
  ✓ Generar un token JWT firmado con HS384
  ✓ Retornar los datos del usuario autenticado

Fuera de alcance:
  ✗ Gestión de habitaciones, reservas, pagos
  ✗ Refresh tokens
  ✗ Registro de nuevos usuarios (Admin lo hace)
```

---

## Arquitectura

### Posición en el sistema completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                           │
│                   localhost:3000                            │
└──────────────────────────┬──────────────────────────────────┘
                           │  POST /api/auth/login
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   HOTEL GATEWAY                             │
│                   localhost:8080                            │
│   - Enruta /api/auth/** → auth-service                     │
│   - Ruta PÚBLICA (no valida JWT aquí)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │  reenvía a :8081
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTH SERVICE        ← ESTE SERVICIO       │
│                   localhost:8081                            │
│                                                             │
│  AuthController → AuthService → UsuarioRepository          │
│                       ↓                JwtUtil              │
│              BCryptPasswordEncoder         ↓                │
│                                     JWT Token               │
└──────────────────────────┬──────────────────────────────────┘
                           │  JDBC / SSL
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE POSTGRESQL                            │
│     aws-1-us-west-2.pooler.supabase.com:6543               │
│     Schema: hotel_auth  |  Tabla: usuarios                 │
└─────────────────────────────────────────────────────────────┘
```

### Capas internas del servicio

```
┌────────────────────────────────────────────┐
│            AuthController                  │  ← Capa HTTP (REST)
│   POST /api/auth/login                     │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────▼─────────────────────────┐
│            AuthServiceImpl                 │  ← Capa de negocio
│   1. Buscar usuario                        │
│   2. Verificar estado ACTIVO               │
│   3. Validar contraseña BCrypt             │
│   4. Generar token JWT                     │
└──────┬──────────────────────┬──────────────┘
       │                      │
┌──────▼──────┐     ┌─────────▼────────────┐
│  Usuario    │     │      JwtUtil         │  ← Utilidades
│  Repository │     │  generateToken()     │
│  (JPA)      │     │  validateToken()     │
└──────┬──────┘     │  extractEmail()      │
       │            │  extractRole()       │
┌──────▼──────┐     └──────────────────────┘
│  Supabase   │
│  PostgreSQL │
└─────────────┘
```

---

## Stack tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Framework | Spring Boot | 4.0.6 |
| Lenguaje | Java | 21 |
| Servidor web | Apache Tomcat (embebido) | 11.x |
| Seguridad | Spring Security | 7.x |
| Persistencia | Spring Data JPA + Hibernate | 7.x |
| Base de datos | PostgreSQL (Supabase) | 17.6 |
| Pool de conexiones | HikariCP | - |
| JWT | JJWT | 0.12.6 |
| Hash contraseñas | BCrypt | strength 10 |
| Build | Maven | 3.9.15 |

---

## Estructura del proyecto

```
auth-service/
├── pom.xml                                    ← Dependencias del módulo
├── README.md                                  ← Esta documentación
└── src/
    └── main/
        ├── java/com/hotelbonaventura/auth/
        │   ├── AuthServiceApplication.java    ← Punto de entrada (@SpringBootApplication)
        │   │
        │   ├── controller/
        │   │   └── AuthController.java        ← POST /api/auth/login
        │   │
        │   ├── service/
        │   │   ├── AuthService.java           ← Interfaz del servicio
        │   │   └── impl/
        │   │       └── AuthServiceImpl.java   ← Lógica de autenticación
        │   │
        │   ├── repository/
        │   │   └── UsuarioRepository.java     ← Acceso a hotel_auth.usuarios
        │   │
        │   ├── entity/
        │   │   └── Usuario.java               ← Mapeo JPA de la tabla usuarios
        │   │
        │   ├── dto/
        │   │   ├── LoginRequestDTO.java       ← Body del request (correo + contrasena)
        │   │   └── AuthResponseDTO.java       ← Respuesta con token JWT
        │   │
        │   ├── util/
        │   │   └── JwtUtil.java               ← Generación y validación JWT
        │   │
        │   ├── config/
        │   │   └── SecurityConfig.java        ← CSRF off, STATELESS, CORS, BCrypt bean
        │   │
        │   └── exception/
        │       ├── GlobalExceptionHandler.java ← Manejo global de errores
        │       └── ErrorResponse.java          ← Estructura estándar de error
        │
        └── resources/
            └── application.yml                ← Configuración del servicio
```

---

## Base de datos

### Conexión

- **Host:** `aws-1-us-west-2.pooler.supabase.com`
- **Puerto:** `6543` (Supabase Transaction Pooler)
- **Base de datos:** `postgres`
- **Schema:** `hotel_auth`
- **SSL:** requerido (`sslmode=require`)
- **Parámetro especial:** `prepareThreshold=0` (requerido por el pooler de Supabase)

### Tabla `hotel_auth.usuarios`

```sql
CREATE TABLE hotel_auth.usuarios (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100)  NOT NULL,
    correo      VARCHAR(100)  NOT NULL UNIQUE,
    contrasena  VARCHAR(255)  NOT NULL,   -- Hash BCrypt
    rol         VARCHAR(20)   NOT NULL,   -- 'ADMINISTRADOR' | 'RECEPCIONISTA'
    estado      VARCHAR(15)   NOT NULL,   -- 'ACTIVO' | 'INACTIVO'
    created_at  TIMESTAMPTZ   DEFAULT now()
    -- NOTA: NO existe columna updated_at
);
```

### Mapeo en la entidad `Usuario.java`

| Columna BD | Campo Java | Tipo |
|---|---|---|
| `id` | `id` | `UUID` |
| `nombre` | `nombre` | `String` |
| `correo` | `correo` | `String` |
| `contrasena` | `contrasena` | `String` (BCrypt hash) |
| `rol` | `rol` | `String` |
| `estado` | `estado` | `String` |
| `created_at` | `createdAt` | `LocalDateTime` |

> **Importante:** La anotación `@Column(name = "created_at", updatable = false)` mapea el nombre de columna correcto. El campo `updatedAt` no existe y no se mapea.

### Usuarios precargados

| Correo | Contraseña | Rol |
|---|---|---|
| admin@bonaventura.com | admin2026 | ADMINISTRADOR |
| recepcionista@bonaventura.com | recep2026 | RECEPCIONISTA |

> Las contraseñas se almacenan como hash BCrypt (strength 10). Para generarlos o actualizarlos en la BD, se puede usar el script SQL con los hashes generados por `BCryptPasswordEncoder`.

---

## Endpoint de login

### `POST /api/auth/login`

**Ruta pública** — no requiere token JWT.

#### Request

```http
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "correo": "admin@bonaventura.com",
  "contrasena": "admin2026"
}
```

| Campo | Tipo | Validación |
|---|---|---|
| `correo` | String | `@NotBlank` + `@Email` |
| `contrasena` | String | `@NotBlank` |

#### Response exitoso `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbi...",
  "tipo": "Bearer",
  "email": "admin@bonaventura.com",
  "nombre": "Renzo Administrador",
  "rol": "ADMINISTRADOR",
  "expiresIn": 86400000
}
```

| Campo | Descripción |
|---|---|
| `token` | JWT firmado con HS384 |
| `tipo` | Siempre `"Bearer"` |
| `email` | Correo del usuario autenticado |
| `nombre` | Nombre completo del usuario |
| `rol` | `ADMINISTRADOR` o `RECEPCIONISTA` |
| `expiresIn` | Tiempo de expiración en milisegundos (24 horas) |

#### Response error `401 Unauthorized`

```json
{
  "timestamp": "2026-05-18T18:09:52",
  "status": 401,
  "error": "Unauthorized",
  "message": "Credenciales invalidas",
  "path": "/api/auth/login"
}
```

#### Response error `400 Bad Request` (validación)

```json
{
  "timestamp": "2026-05-18T18:09:52",
  "status": 400,
  "error": "Bad Request",
  "message": "Formato de correo invalido",
  "path": "/api/auth/login"
}
```

---

## Flujo de autenticación

```
Cliente                AuthController          AuthServiceImpl        BD Supabase
   │                        │                        │                     │
   │  POST /api/auth/login  │                        │                     │
   │  {correo, contrasena}  │                        │                     │
   │───────────────────────►│                        │                     │
   │                        │  @Valid valida DTO      │                     │
   │                        │  si falla → 400        │                     │
   │                        │                        │                     │
   │                        │  authService.login()   │                     │
   │                        │───────────────────────►│                     │
   │                        │                        │  findByCorreo()     │
   │                        │                        │────────────────────►│
   │                        │                        │                     │
   │                        │                        │◄────────────────────│
   │                        │                        │  Optional<Usuario>  │
   │                        │                        │                     │
   │                        │              ┌─────────┴──────────┐          │
   │                        │              │ ¿Usuario existe?   │          │
   │                        │              │  NO → 401          │          │
   │                        │              │  SI → continuar    │          │
   │                        │              └─────────┬──────────┘          │
   │                        │                        │                     │
   │                        │              ┌─────────┴──────────┐          │
   │                        │              │ ¿Estado ACTIVO?    │          │
   │                        │              │  NO → 401          │          │
   │                        │              │  SI → continuar    │          │
   │                        │              └─────────┬──────────┘          │
   │                        │                        │                     │
   │                        │              ┌─────────┴──────────┐          │
   │                        │              │ BCrypt.matches()?  │          │
   │                        │              │  NO → 401          │          │
   │                        │              │  SI → continuar    │          │
   │                        │              └─────────┬──────────┘          │
   │                        │                        │                     │
   │                        │                  jwtUtil.generateToken()     │
   │                        │                        │                     │
   │                        │◄───────────────────────│                     │
   │                        │   AuthResponseDTO       │                     │
   │◄───────────────────────│                        │                     │
   │   200 OK + JWT Token   │                        │                     │
```

---

## Token JWT

### Algoritmo

JJWT 0.12.x selecciona automáticamente el algoritmo según el tamaño de la clave:

| Tamaño de clave | Algoritmo elegido |
|---|---|
| 32–47 bytes | HS256 |
| 48–63 bytes | **HS384** ← usado aquí |
| 64+ bytes | HS512 |

El `JWT_SECRET` del proyecto tiene más de 48 bytes, por lo que JJWT elige **HS384**.

### Estructura del token

```
eyJhbGciOiJIUzM4NCJ9          ← Header (algoritmo)
.
eyJzdWIiOiJhZG1pbi4uLiJ9      ← Payload (claims)
.
N8M-i6VpbjRj...               ← Signature (firma HMAC-SHA384)
```

### Claims incluidos

```json
{
  "sub":    "admin@bonaventura.com",
  "nombre": "Renzo Administrador",
  "rol":    "ADMINISTRADOR",
  "iat":    1779146012,
  "exp":    1779232412
}
```

| Claim | Descripción |
|---|---|
| `sub` | Email del usuario (sujeto del token) |
| `nombre` | Nombre completo |
| `rol` | Rol del usuario (`ADMINISTRADOR` o `RECEPCIONISTA`) |
| `iat` | Issued At — timestamp de emisión |
| `exp` | Expiration — timestamp de expiración (iat + 24h) |

### Uso del token en rutas protegidas

Una vez obtenido el token, el cliente debe enviarlo en todas las peticiones a rutas protegidas:

```http
GET http://localhost:8080/api/habitaciones/disponibles
Authorization: Bearer eyJhbGciOiJIUzM4NCJ9...
```

El **Gateway** extrae y valida este token, luego inyecta los headers:
- `X-User-Email: admin@bonaventura.com`
- `X-User-Role: ADMINISTRADOR`

---

## Seguridad

### Configuración de Spring Security (`SecurityConfig.java`)

| Aspecto | Configuración |
|---|---|
| CSRF | Deshabilitado (API stateless) |
| Sesiones | `STATELESS` — no se crean sesiones HTTP |
| `/api/auth/login` | `permitAll()` — público |
| `/actuator/health` | `permitAll()` — público |
| Todo lo demás | `authenticated()` |

### Hashing de contraseñas

- Algoritmo: **BCrypt**
- Strength: **10** (2¹⁰ = 1024 iteraciones ≈ 100ms por hash)
- El hash de la BD nunca se expone en logs ni respuestas
- Los logs solo registran el correo, nunca la contraseña

### Mensajes de error genéricos

Para evitar revelar si un correo existe en el sistema, todos los errores de autenticación retornan el mismo mensaje:

```
"Credenciales invalidas"
```

---

## Configuración

### Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST` | Host de Supabase | `aws-1-us-west-2.pooler.supabase.com` |
| `DB_PORT` | Puerto del pooler | `6543` |
| `DB_NAME` | Nombre de la BD | `postgres` |
| `DB_USERNAME` | Usuario de conexión | `postgres.xxxx` |
| `DB_PASSWORD` | Contraseña de la BD | `...` |
| `JWT_SECRET` | Clave secreta para firmar JWT | min. 48 caracteres |
| `JWT_EXPIRATION` | Expiración en ms | `86400000` (24h) |

Todas las variables se definen en el archivo `.env` en la raíz del proyecto padre.

### `application.yml` resumido

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require&prepareThreshold=0
  jpa:
    hibernate:
      ddl-auto: none        # No modifica el schema de Supabase
    properties:
      hibernate:
        default_schema: hotel_auth
```

> **Nota `prepareThreshold=0`:** El pooler de Supabase en modo transacción no soporta prepared statements persistentes. Sin este parámetro la conexión JDBC falla.

---

## Cómo ejecutar

### Prerequisitos

- Java 21+
- Maven Wrapper incluido (`mvnw.cmd`)
- Variables de entorno del `.env` cargadas
- Conexión a internet (primera ejecución descarga dependencias)

### Desde el directorio del módulo

```bash
# 1. Instalar el POM padre en el repositorio local (solo primera vez)
cd hotel-bonaventura
mvnw.cmd install -N

# 2. Cargar variables de entorno (Windows PowerShell)
Get-Content .env | Where-Object { $_ -match '^\s*[^#].*=.*' } | ForEach-Object {
    $p = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim(), 'Process')
}

# 3. Ejecutar el auth-service
cd auth-service
..\mvnw.cmd spring-boot:run
```

### Verificar que arrancó correctamente

```
HikariPool-1 - Start completed.
Tomcat started on port 8081 (http)
Started AuthServiceApplication in X seconds
```

---

## Pruebas con Postman

### Login Administrador ✓

```
Método : POST
URL    : http://localhost:8081/api/auth/login
Header : Content-Type: application/json
Body   :
{
  "correo": "admin@bonaventura.com",
  "contrasena": "admin2026"
}
```

### Login Recepcionista ✓

```
Método : POST
URL    : http://localhost:8081/api/auth/login
Body   :
{
  "correo": "recepcionista@bonaventura.com",
  "contrasena": "recep2026"
}
```

### Credenciales incorrectas → 401

```json
{ "correo": "admin@bonaventura.com", "contrasena": "mala" }
```

### Correo con formato inválido → 400

```json
{ "correo": "esto-no-es-correo", "contrasena": "admin2026" }
```

### Health Check

```
Método : GET
URL    : http://localhost:8081/actuator/health
```

---

## Errores posibles

| Error | Causa | Solución |
|---|---|---|
| `401 Credenciales invalidas` | Contraseña en BD no está hasheada con BCrypt | Ejecutar UPDATE con hash BCrypt en Supabase |
| `401 Usuario inactivo` | Campo `estado` no es `ACTIVO` | Actualizar `estado = 'ACTIVO'` en la BD |
| `400 Formato de correo invalido` | Correo no pasa validación `@Email` | Enviar un correo válido |
| `Connection refused :8081` | El servicio no está corriendo | Ejecutar `mvnw spring-boot:run` |
| `HikariPool - Connection is not available` | Variables de entorno no cargadas | Cargar el `.env` antes de ejecutar |
| `prepareThreshold` error | Falta el parámetro en la URL JDBC | Ya incluido en `application.yml` |

---

*Documentación generada para Hotel BonAventura — auth-service v1.0.0-SNAPSHOT*
