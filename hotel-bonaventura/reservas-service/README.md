# Reservas Service — Gestión de Reservas

Microservicio responsable de la **creación y gestión de reservas** del Hotel BonAventura. Integra con la **API RENIEC** para validar el DNI del huésped y obtener sus datos personales, y es **productor de eventos Kafka** que desencadenan la actualización de habitaciones y la generación de pagos/boletas.

---

## Función Principal

- Verificar disponibilidad de habitaciones antes de confirmar una reserva.
- Consultar la **API RENIEC** con el DNI del huésped para obtener nombre completo.
- Crear registros de reserva en la base de datos con estado `CONFIRMADA`.
- Generar un **código único de reserva** (ej: `RES-2026-0001`).
- Publicar el evento `ReservaCompletadaEvent` a Apache Kafka para notificar a otros servicios.
- Listar y consultar reservas existentes.

---

## Puerto

| Entorno | Puerto |
|---------|--------|
| Docker (externo) | **8083** |
| Docker (interno) | 8083 |

---

## Estructura de Carpetas

```
reservas-service/
├── src/
│   └── main/
│       ├── java/com/hotelbonaventura/reservas/
│       │   ├── ReservasServiceApplication.java
│       │   ├── controller/
│       │   │   └── ReservaController.java            # Endpoints REST
│       │   ├── service/
│       │   │   ├── ReservaService.java               # Interfaz
│       │   │   ├── impl/
│       │   │   │   ├── ReservaServiceImpl.java       # Lógica principal
│       │   │   │   └── ReniecServiceImpl.java        # Integración RENIEC
│       │   ├── repository/
│       │   │   ├── ReservaRepository.java            # JPA reservas
│       │   │   └── HabitacionRepository.java         # JPA habitaciones (lectura)
│       │   ├── entity/
│       │   │   ├── Reserva.java                      # Mapeo JPA
│       │   │   └── Habitacion.java                   # Ref. solo lectura
│       │   ├── dto/
│       │   │   ├── ReservaDTO.java                   # Respuesta API
│       │   │   ├── CheckinRequestDTO.java            # Body del check-in
│       │   │   ├── CheckinResponseDTO.java           # Respuesta del check-in
│       │   │   └── ReniecResponseDTO.java            # Respuesta de RENIEC API
│       │   ├── mapper/
│       │   │   └── ReservaMapper.java                # Entity ↔ DTO
│       │   ├── client/
│       │   │   └── ReniecClient.java                 # HTTP client RestTemplate
│       │   ├── config/
│       │   │   └── RestTemplateConfig.java           # Bean RestTemplate
│       │   ├── kafka/
│       │   │   ├── ReservaCompletadaEvent.java       # Estructura del evento
│       │   │   ├── KafkaProducerConfig.java          # Configuración producer
│       │   │   └── KafkaProducerService.java         # Publicador del evento
│       │   ├── util/
│       │   │   └── CodigoReservaGenerator.java       # Genera códigos únicos
│       │   └── exception/
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           └── application.yml
├── Dockerfile
└── pom.xml
```

---

## Endpoints REST

Todos los endpoints requieren token JWT válido.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/reservas/checkin` | Crear nueva reserva (check-in) |
| `GET` | `/api/reservas` | Listar todas las reservas |
| `GET` | `/api/reservas/{id}` | Obtener una reserva por ID |
| `GET` | `/api/reservas/codigo/{codigo}` | Buscar por código de reserva |
| `PUT` | `/api/reservas/{id}/cancelar` | Cancelar una reserva |

### POST `/api/reservas/checkin`

**Request (`CheckinRequestDTO`):**
```json
{
  "idHabitacion": "550e8400-e29b-41d4-a716-446655440000",
  "clienteDni": "12345678",
  "fechaCheckin": "2026-05-22",
  "fechaCheckout": "2026-05-25",
  "metodoPago": "EFECTIVO"
}
```

**Validaciones:**
- `fechaCheckout` debe ser estrictamente posterior a `fechaCheckin`
- `clienteDni` debe tener exactamente 8 dígitos (DNI peruano)
- La habitación debe existir y estar en estado `DISPONIBLE`
- El DNI debe ser válido en la API RENIEC

**Response exitoso (200):**
```json
{
  "codigoReserva": "RES-2026-0042",
  "idReserva": "uuid",
  "clienteNombre": "Juan Carlos Pérez García",
  "clienteDni": "12345678",
  "numeroHabitacion": "101",
  "fechaCheckin": "2026-05-22",
  "fechaCheckout": "2026-05-25",
  "cantidadNoches": 3,
  "montoTotal": 450.00
}
```

---

## Cómo Está Construido

### Flujo de Check-in

```
POST /api/reservas/checkin
        │
        ▼
ReservaController.checkin(@Valid CheckinRequestDTO)
        │
        ▼
ReservaServiceImpl.crearReserva()
        │
        ├── 1. HabitacionRepository.findById(idHabitacion)
        │         └── No existe → 404 Not Found
        │         └── Estado ≠ DISPONIBLE → 409 Conflict
        │
        ├── 2. ReniecServiceImpl.consultarDni(clienteDni)
        │         └── ReniecClient → GET https://api.decolecta.com/...
        │         └── Obtiene: nombres, apellidoPaterno, apellidoMaterno
        │         └── DNI no válido → 400 Bad Request
        │
        ├── 3. Calcular cantidadNoches (checkout - checkin en días)
        │         Calcular montoTotal (noches × precioNoche)
        │
        ├── 4. CodigoReservaGenerator.generar()
        │         → "RES-YYYY-XXXX" (año + secuencia)
        │
        ├── 5. Guardar Reserva en BD (estado: CONFIRMADA)
        │
        └── 6. KafkaProducerService.publicar(ReservaCompletadaEvent)
                  → Topic: reserva-completada-topic
```

### Integración RENIEC (`ReniecClient.java`)

```
API: https://api.decolecta.com
Header: Authorization: Bearer {RENIEC_API_KEY}
Endpoint: GET /api/v1/reniec/dni/{dni}

Respuesta: {
  "nombres": "JUAN CARLOS",
  "apellidoPaterno": "PEREZ",
  "apellidoMaterno": "GARCIA"
}

Nombre completo = nombres + apellidoPaterno + apellidoMaterno
```

### Kafka Producer (`KafkaProducerService.java`)

```java
kafkaTemplate.send("reserva-completada-topic", event);
```

**Serialización:** `JsonSerializer` con `JavaTimeModule` para fechas `LocalDate`.

**Estructura del evento publicado:**
```json
{
  "idReserva": "uuid",
  "codigoReserva": "RES-2026-0042",
  "idHabitacion": "uuid",
  "numeroHabitacion": "101",
  "clienteDni": "12345678",
  "clienteNombre": "Juan Carlos Pérez García",
  "fechaCheckin": "2026-05-22",
  "fechaCheckout": "2026-05-25",
  "cantidadNoches": 3,
  "montoTotal": 450.00,
  "metodoPago": "EFECTIVO"
}
```

### Base de Datos

```
Schema: hotel_reservas
Tabla:  reservas

┌──────────────────────┬──────────────────────────────────────┐
│ Columna              │ Tipo / Descripción                   │
├──────────────────────┼──────────────────────────────────────┤
│ id                   │ UUID (PK)                            │
│ id_habitacion        │ UUID (FK lógica)                     │
│ codigo_reserva       │ VARCHAR UNIQUE (ej: RES-2026-0001)   │
│ cliente_dni          │ VARCHAR(8)                           │
│ cliente_nombre_completo│ VARCHAR                           │
│ numero_habitacion    │ VARCHAR(2)                           │
│ fecha_checkin        │ DATE                                 │
│ fecha_checkout       │ DATE                                 │
│ cantidad_noches      │ INTEGER                              │
│ monto_total          │ DECIMAL(10,2)                        │
│ metodo_pago          │ VARCHAR                              │
│ estado               │ PENDIENTE / CONFIRMADA / CANCELADA   │
│ created_at           │ TIMESTAMP                            │
└──────────────────────┴──────────────────────────────────────┘
```

---

## Diagrama de Flujo

```
Recepcionista
    │
    │  POST /api/reservas/checkin {idHabitacion, dni, fechas}
    ▼
Hotel Gateway (valida JWT)
    │
    ▼
┌──────────────────────────────────────────┐
│         RESERVAS SERVICE :8083           │
│                                          │
│  1. Verifica habitación DISPONIBLE       │
│  2. RENIEC API → nombre del huésped      │
│  3. Calcula noches y monto               │
│  4. Genera código único                  │
│  5. Guarda reserva (estado: CONFIRMADA)  │
│  6. Publica evento a Kafka               │
└───────────────────┬──────────────────────┘
                    │
      ┌─────────────┴──────────────┐
      ▼                            ▼
Kafka: reserva-completada-topic
      │                            │
      ▼                            ▼
Habitaciones Service        Pagos Service
(estado → OCUPADA)          (genera pago + boleta)
```

---

## Variables de Entorno Relevantes

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexión a Supabase PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales BD |
| `KAFKA_BROKER` | Dirección del broker Kafka |
| `RENIEC_API_KEY` | API Key para consulta de DNI |
