# Hotel BonAventura — Sistema de Gestión Hotelera

Sistema de gestión hotelera completo basado en arquitectura de **microservicios**, desarrollado con Spring Boot, FastAPI y React. Permite gestionar habitaciones, reservas, pagos y boletas electrónicas en un hotel, con roles diferenciados para recepcionistas y administradores.

---

## Tabla de Contenidos

- [Arquitectura General](#arquitectura-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Servicios y Puertos](#servicios-y-puertos)
- [Comunicación entre Servicios](#comunicación-entre-servicios)
- [Patrones de Diseño](#patrones-de-diseño)
- [Flujos Principales](#flujos-principales)
- [Base de Datos](#base-de-datos)
- [Contenedores Docker](#contenedores-docker)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Variables de Entorno](#variables-de-entorno)

---

## Arquitectura General

El sistema está compuesto por **8 contenedores Docker** que se comunican en una red privada llamada `hotel-net`. La arquitectura sigue el patrón de microservicios con un API Gateway como punto de entrada único.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RED DOCKER: hotel-net                              │
│                                                                             │
│  ┌──────────────┐        ┌──────────────────────────────────────────────┐  │
│  │   FRONTEND   │ :3000  │             HOTEL GATEWAY                    │  │
│  │  React+Nginx │───────▶│        Spring Cloud Gateway :8080            │  │
│  └──────────────┘        │  • Enrutamiento  • Validación JWT  • CORS    │  │
│                           └───────────────────┬──────────────────────────┘  │
│                                               │                             │
│              ┌────────────────────────────────┼──────────────────────┐     │
│              │                    │           │                      │     │
│              ▼                    ▼           ▼                      ▼     │
│  ┌──────────────────┐  ┌──────────────────┐ ┌──────────────────┐ ┌──────┐ │
│  │  auth-service    │  │habitaciones-svc  │ │ reservas-service │ │admin │ │
│  │  Spring Boot     │  │ Spring Boot :8082│ │ Spring Boot :8083│ │:8085 │ │
│  │     :8081        │  └────────┬─────────┘ └────────┬─────────┘ └──────┘ │
│  └──────────────────┘           │                    │                     │
│                         Kafka   │ Consumer   Producer │ Kafka               │
│                                 └──────────┬──────────┘                    │
│                                            ▼                               │
│   ┌─────────────────┐           ┌──────────────────────┐                  │
│   │  pagos-service  │◀──────────│       KAFKA          │                  │
│   │  FastAPI :8084  │ Consumer  │  (KRaft mode) :9092  │                  │
│   └─────────────────┘           └──────────────────────┘                  │
│                                                                             │
│                    ┌──────────────────────────────────┐                    │
│                    │   SUPABASE PostgreSQL (externo)   │                    │
│                    │  hotel_auth | hotel_reservas      │                    │
│                    │  hotel_pagos | hotel_habitaciones │                    │
│                    └──────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tecnologías Utilizadas

### Backend Java (Microservicios)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Java | 21 | Lenguaje principal de microservicios |
| Spring Boot | 4.0.6 | Framework de microservicios |
| Spring Cloud Gateway | 2025.1.1 | API Gateway reactivo (WebFlux) |
| Spring Security | 6.x | Seguridad y autenticación |
| Spring Data JPA | 3.x | Acceso a base de datos (ORM) |
| JJWT | 0.12.6 | Generación y validación de JWT |
| Spring Kafka | 3.x | Integración con Apache Kafka |
| SpringDoc OpenAPI | 3.0.2 | Documentación Swagger automática |
| HikariCP | — | Pool de conexiones a la BD |
| Maven | 3.9 | Gestión de dependencias y build |

### Backend Python (Pagos)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.11 | Lenguaje del servicio de pagos |
| FastAPI | 0.109.2 | Framework web asíncrono |
| Uvicorn | 0.27.1 | Servidor ASGI |
| Pydantic | 2.6.1 | Validación y serialización de datos |
| psycopg2-binary | 2.9.9 | Driver PostgreSQL |
| kafka-python-ng | 2.2.2 | Cliente Kafka |
| reportlab | 4.0.9 | Generación de PDFs |

### Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19.2.6 | Framework UI (componentes) |
| Vite | 8.0.12 | Build tool y dev server |
| Tailwind CSS | 4.3.0 | Estilos utilitarios (utility-first) |
| Zustand | 5.0.13 | State management global liviano |
| Axios | 1.16.1 | Cliente HTTP con interceptores |
| React Hook Form | 7.76.0 | Gestión de formularios sin re-renders |
| Yup | 1.7.1 | Validación de esquemas de formularios |
| React Router DOM | 6.30.3 | Enrutamiento SPA (client-side) |
| React Hot Toast | 2.6.0 | Notificaciones toast |
| date-fns | 4.2.1 | Formateo y manipulación de fechas |

### Infraestructura

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Docker + Docker Compose | v2+ | Orquestación de contenedores |
| Apache Kafka (KRaft) | Latest | Message broker asíncrono (sin Zookeeper) |
| Nginx | 1.27 Alpine | Servidor web del frontend en producción |
| PostgreSQL | 17.6 (Supabase) | Base de datos relacional principal |

### Servicios Externos

| Servicio | Uso |
|---------|-----|
| Supabase | Base de datos PostgreSQL en la nube (AWS us-west-2) con Transaction Pooler |
| API RENIEC (decolecta.com) | Validación de DNI peruanos y obtención de datos del cliente |

---

## Estructura del Proyecto

```
proyecto/
├── docker-compose.yml                    # Orquestación de todos los contenedores
├── README.md                             # Este archivo
│
├── frontend/                             # Aplicación React + Vite
│   ├── src/
│   │   ├── api/                          # Clientes HTTP por servicio (Axios)
│   │   ├── store/                        # Estado global con Zustand
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── pages/                        # Páginas: auth/, recepcion/, admin/
│   │   ├── components/                   # Componentes reutilizables
│   │   ├── routes/                       # Enrutamiento y ProtectedRoute
│   │   └── utils/                        # Constantes, formateadores, validadores
│   ├── nginx.conf                        # Configuración Nginx (proxy + SPA fallback)
│   ├── Dockerfile                        # Build multi-stage (Node → Nginx)
│   └── README.md                         # Documentación del frontend
│
└── hotel-bonaventura/                    # Monorepo de microservicios
    ├── pom.xml                           # POM padre con dependencias compartidas
    ├── .env                              # Variables de entorno para todos los servicios
    │
    ├── hotel-gateway/                    # API Gateway (Spring Cloud Gateway)
    │   └── README.md
    ├── auth-service/                     # Autenticación y generación de JWT
    │   └── README.md
    ├── habitaciones-service/             # Gestión del estado de habitaciones
    │   └── README.md
    ├── reservas-service/                 # Reservas + integración RENIEC + Kafka Producer
    │   └── README.md
    ├── pagos-service/                    # Pagos + boletas electrónicas (FastAPI/Python)
    │   └── README.md
    └── administracion-service/           # Reportes, usuarios y parámetros del sistema
        └── README.md
```

---

## Servicios y Puertos

| Servicio | Puerto Externo | Tecnología | Función Principal | Documentación |
|---------|---------------|-----------|------------------|---------------|
| Frontend | 3000 | React + Nginx | Interfaz de usuario web | [README](./frontend/README.md) |
| Hotel Gateway | 8080 | Spring Cloud Gateway | Enrutamiento + JWT + CORS | [README](./hotel-bonaventura/hotel-gateway/README.md) |
| Auth Service | 8081 | Spring Boot | Login y emisión de tokens JWT | [README](./hotel-bonaventura/auth-service/README.md) |
| Habitaciones Service | 8082 | Spring Boot | CRUD y estado de habitaciones | [README](./hotel-bonaventura/habitaciones-service/README.md) |
| Reservas Service | 8083 | Spring Boot | Reservas + RENIEC + Kafka Producer | [README](./hotel-bonaventura/reservas-service/README.md) |
| Pagos Service | 8084 | FastAPI (Python) | Pagos, boletas PDF + Kafka Consumer | [README](./hotel-bonaventura/pagos-service/README.md) |
| Administración Service | 8085 | Spring Boot | Reportes, usuarios, parámetros | [README](./hotel-bonaventura/administracion-service/README.md) |
| Apache Kafka | 9092 | KRaft (sin Zookeeper) | Message broker de eventos | — |

> Los microservicios (8081-8085) son accesibles directamente solo en desarrollo. En producción, todo el tráfico debe pasar por el **Gateway (8080)**.

---

## Comunicación entre Servicios

El sistema utiliza dos tipos de comunicación: síncrona via HTTP REST y asíncrona via Apache Kafka.

### Comunicación Síncrona (HTTP REST)

El frontend se comunica **exclusivamente** con el Hotel Gateway, que enruta cada petición al microservicio correspondiente según el prefijo de URL:

```
Frontend (:3000)
    │
    └─── HTTP REST ───▶  Hotel Gateway (:8080)
                              │
                    ┌─────────┼─────────────┬───────────────┐
                    │         │             │               │
                    ▼         ▼             ▼               ▼
              /api/auth  /api/habitaciones  /api/reservas  /api/pagos
              Auth(8081) Habitaciones(8082) Reservas(8083) Pagos(8084)

                                                    /api/admin
                                              Administración(8085)
```

### Comunicación Asíncrona (Apache Kafka)

Los microservicios se comunican entre sí mediante **eventos de dominio** sin depender unos de otros:

```
Reservas Service  ──Producer──▶  Topic: reserva-completada-topic
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              Habitaciones Service (Consumer)   Pagos Service (Consumer)
              Cambia estado a OCUPADA           Genera Pago + Boleta
```

**Evento `ReservaCompletadaEvent`** (publicado en JSON):
```json
{
  "idReserva": "uuid",
  "codigoReserva": "RES-2026-0001",
  "idHabitacion": "uuid",
  "numeroHabitacion": "101",
  "clienteDni": "12345678",
  "clienteNombre": "Juan Pérez García",
  "fechaCheckin": "2026-05-22",
  "fechaCheckout": "2026-05-25",
  "cantidadNoches": 3,
  "montoTotal": 450.00,
  "metodoPago": "EFECTIVO"
}
```

### Propagación de Contexto (Headers)

El Gateway extrae los claims del JWT y los inyecta como headers HTTP en cada petición reenviada a los microservicios:

```
Petición entrante:  Authorization: Bearer <jwt_token>
                              │
                    Gateway extrae claims
                              │
Petición reenviada: X-User-Email: usuario@bonaventura.com
                    X-User-Role:  RECEPCIONISTA
```

---

## Patrones de Diseño

### Patrones Arquitecturales

| Patrón | Implementación | Beneficio |
|--------|---------------|-----------|
| **API Gateway** | `hotel-gateway` con Spring Cloud Gateway | Punto de entrada único; centraliza autenticación, CORS y enrutamiento |
| **Microservicios** | 5 servicios independientes | Cada uno desplegable, escalable y con BD propia |
| **Event-Driven Architecture** | Apache Kafka con `ReservaCompletadaEvent` | Desacoplamiento total entre Reservas, Habitaciones y Pagos |
| **Database per Service** | Schemas separados en Supabase PostgreSQL | Aislamiento de datos; cada servicio es dueño de su schema |
| **Backend for Frontend (BFF)** | Gateway optimiza respuestas para React | Reduce la complejidad en el frontend |

### Patrones de Implementación (Backend)

| Patrón | Implementación | Dónde |
|--------|---------------|-------|
| **DTO (Data Transfer Object)** | Clases DTO separadas de entidades JPA | Todos los servicios Java |
| **Repository** | Interfaces que extienden `JpaRepository` | Spring Data JPA en cada servicio |
| **Service Layer** | Clases `*ServiceImpl` con lógica de negocio | Separadas de los controllers REST |
| **Global Exception Handler** | `@RestControllerAdvice` + `GlobalExceptionHandler` | Cada servicio Java |
| **Filter Chain** | `JwtAuthenticationFilter` con `HIGHEST_PRECEDENCE` | Hotel Gateway |
| **Observer** | Kafka listeners `@KafkaListener` | Habitaciones y Pagos Service |
| **Mapper** | Clases `*Mapper` para DTO ↔ Entity | Habitaciones, Reservas |

### Patrones de Frontend

| Patrón | Implementación | Beneficio |
|--------|---------------|-----------|
| **Single Page Application (SPA)** | React + React Router con client-side routing | Navegación fluida sin recarga de página |
| **Protected Routes** | `ProtectedRoute.jsx` con validación de rol | Control de acceso por rol (ADMINISTRADOR / RECEPCIONISTA) |
| **Store Pattern** | Zustand con stores de `auth`, `habitaciones`, `reservas` | Estado global predecible |
| **Interceptor** | Axios request/response interceptors | Inyección automática de JWT y manejo global de 401 |
| **Custom Hooks** | `useAuth`, `useHabitaciones`, `useReservas` | Lógica reutilizable separada de componentes |

---

## Flujos Principales

### Flujo 1: Autenticación (Login)

```
┌──────────┐    POST /api/auth/login     ┌─────────┐
│ Frontend │ ─────────────────────────▶ │ Gateway │  (ruta pública, no valida JWT)
└──────────┘                            └────┬────┘
                                             │ reenvía
                                             ▼
                                      ┌─────────────┐
                                      │ Auth Service│
                                      │             │
                                      │ 1. Busca    │
                                      │    usuario  │
                                      │    por email│
                                      │ 2. BCrypt   │
                                      │    .matches │
                                      │ 3. Genera   │
                                      │    JWT HS384│
                                      └──────┬──────┘
                                             │ {token, nombre, rol}
                                             ▼
                                      ┌──────────┐
                                      │ Frontend │
                                      │ guarda   │
                                      │ token en │
                                      │localStorage
                                      └──────────┘
```

### Flujo 2: Check-in / Creación de Reserva

```
Recepcionista selecciona habitación DISPONIBLE
        │
        ▼
POST /api/reservas/checkin {idHabitacion, dni, fechaCheckin, fechaCheckout}
        │
        ▼
Gateway: valida JWT → inyecta X-User-Email, X-User-Role
        │
        ▼
Reservas Service (8083):
  1. Verifica habitación disponible
  2. Consulta RENIEC API con DNI → obtiene nombre completo
  3. Calcula cantidad de noches y monto total
  4. Crea Reserva en BD (estado: CONFIRMADA)
  5. Genera código único (ej: RES-2026-0042)
  6. Publica ReservaCompletadaEvent a Kafka
        │
        │ (respuesta inmediata al frontend)
        ▼
Frontend muestra: código de reserva + datos del huésped
        │
        │ (proceso asíncrono, en paralelo)
        ├──────────────────────────────────────────────────┐
        ▼                                                  ▼
Habitaciones Service (Consumer):               Pagos Service (Consumer):
  - Cambia estado habitación → OCUPADA           - Crea Pago (estado: EXITOSO)
                                                 - Calcula IGV 18%
                                                 - Genera Boleta electrónica
```

### Flujo 3: Descarga de Boleta PDF

```
Frontend: GET /api/pagos/boletas/{id}/pdf
    │
    ▼
Gateway → Pagos Service (FastAPI :8084)
    │
    ▼
1. Busca boleta en BD (tabla boletas)
2. Genera PDF con reportlab:
   - Cabecera: RUC empresa, tipo boleta (03 SUNAT)
   - Cliente: DNI, nombre
   - Detalle: código reserva, habitación, noches, fechas
   - Totales: base imponible, IGV, importe total
3. Response: Content-Type: application/pdf (inline)
    │
    ▼
Navegador abre/descarga el PDF
```

### Flujo 4: Reporte de Ingresos (Administración)

```
Admin selecciona rango de fechas
    │
    ▼
GET /api/admin/reportes/ingresos?from=2026-05-01&to=2026-05-31
    │
    ▼
Gateway: valida JWT + verifica rol = ADMINISTRADOR
    │
    ▼
Administración Service (8085):
  1. Consulta tabla pagos filtrando por rango de fechas
  2. Agrupa por día, suma montos
  3. Calcula totales del período
    │
    ▼
Response: {ingresosPorDia[], totalIngresos, cantidadReservas}
    │
    ▼
Frontend renderiza gráfico de barras con los datos
```

---

## Base de Datos

La base de datos es **PostgreSQL 17.6** alojada en **Supabase** (AWS us-west-2), organizada en schemas separados por servicio para garantizar aislamiento.

```
SUPABASE PostgreSQL
│
├── Schema: hotel_auth
│   └── usuarios
│       (id UUID, nombre, correo, contrasena_hash BCrypt, rol, estado)
│
├── Schema: hotel_habitaciones
│   └── habitaciones
│       (id UUID, numero, tipo, precio_por_noche, estado)
│       estados: DISPONIBLE | OCUPADA | MANTENIMIENTO
│
├── Schema: hotel_reservas
│   └── reservas
│       (id UUID, id_habitacion, cliente_dni, cliente_nombre,
│        codigo_reserva, fecha_checkin, fecha_checkout,
│        cantidad_noches, estado)
│       estados: PENDIENTE | CONFIRMADA | CANCELADA
│
├── Schema: hotel_pagos
│   ├── pagos
│   │   (id UUID, id_reserva, monto, metodo_pago, estado, fecha_pago)
│   └── boletas
│       (id UUID, id_pago, serie "B001", numero auto-increment,
│        cliente_dni, base_imponible, igv, importe_total,
│        documento_completo JSON, estado)
│
└── Schema: hotel_administracion
    └── (accede a tablas de los otros schemas para reportes:
         usuarios, reservas, habitaciones, boletas)
```

**Parámetros de conexión relevantes:**
- Puerto `6543` (Transaction Pooler de Supabase, requerido para pooling)
- `sslmode=require` (seguridad obligatoria)
- `prepareThreshold=0` (necesario para compatibilidad con el pooler de Supabase)
- Pool HikariCP: máximo 5 conexiones por servicio

---

## Contenedores Docker

El `docker-compose.yml` define 8 servicios en la red `hotel-net`:

```
Orden de arranque (dependencias):
  1. kafka-container  (KRaft, health check: kafka-topics.sh)
  2. auth-service       ─┐
  3. habitaciones-service ├─ dependen de kafka (healthy)
  4. reservas-service   ─┤
  5. pagos-service      ─┤
  6. administracion-service ─┘
  7. hotel-gateway      (depende de todos los anteriores: service_healthy)
  8. frontend           (depende de hotel-gateway)
```

**Estrategia de build (Dockerfiles multi-stage):**

| Tipo | Stage 1 (Build) | Stage 2 (Runtime) | Tamaño final |
|------|----------------|-------------------|-------------|
| Java | `maven:3.9-eclipse-temurin-21` | `eclipse-temurin:21-jre-alpine` | ~180 MB |
| Python | `python:3.11-slim` | mismo | ~200 MB |
| Frontend | `node:22-alpine` | `nginx:1.27-alpine` | ~25 MB |

---

## Cómo Ejecutar

### Prerequisitos

- Docker Desktop (con Docker Compose v2+)
- Git

### Levantar todo el sistema

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd proyecto

# Levantar todos los contenedores (con build)
docker compose up --build

# O en segundo plano:
docker compose up --build -d
```

Espera a que todos los servicios pasen sus health checks (~2-3 minutos en el primer build).

### URLs de acceso

| Recurso | URL |
|---------|-----|
| Frontend (UI) | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Swagger Auth Service | http://localhost:8081/swagger-ui.html |
| Swagger Habitaciones | http://localhost:8082/swagger-ui.html |
| Swagger Reservas | http://localhost:8083/swagger-ui.html |
| Docs Pagos Service | http://localhost:8084/docs |
| Swagger Administración | http://localhost:8085/swagger-ui.html |

### Credenciales por defecto

| Rol | Email | Contraseña | Acceso |
|-----|-------|-----------|--------|
| Administrador | admin@bonaventura.com | admin2026 | Todo el sistema |
| Recepcionista | recepcionista@bonaventura.com | recep2026 | Solo recepción |

### Desarrollo local (sin Docker)

```bash
# Solo Kafka (necesario siempre)
docker compose up kafka-container -d

# Microservicios Java (en hotel-bonaventura/<servicio>/)
./mvnw spring-boot:run

# Pagos Service (Python)
cd hotel-bonaventura/pagos-service
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux/macOS
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8084

# Frontend
cd frontend
npm install
npm run dev    # http://localhost:5173
```

---

## Variables de Entorno

El archivo `hotel-bonaventura/.env` centraliza todas las variables compartidas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host del pooler de Supabase | `aws-1-us-west-2.pooler.supabase.com` |
| `DB_PORT` | Puerto del Transaction Pooler | `6543` |
| `DB_NAME` | Nombre de la base de datos | `postgres` |
| `DB_USERNAME` | Usuario de Supabase | `postgres.xxx` |
| `DB_PASSWORD` | Contraseña de Supabase | `***` |
| `JWT_SECRET` | Clave secreta para firmar JWT (HS384, min 48 chars) | `MiClaveSecreta...` |
| `JWT_EXPIRATION` | Tiempo de vida del JWT en milisegundos | `86400000` (24h) |
| `KAFKA_BROKER` | Dirección del broker Kafka | `kafka-container:9092` |
| `KAFKA_GROUP_ID` | Consumer Group ID base | `hotel-bonaventura-group` |
| `RENIEC_API_KEY` | API Key para validación de DNI | `sk_xxxxx` |
