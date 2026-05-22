# Habitaciones Service — Gestión de Habitaciones

Microservicio responsable de la **gestión y monitoreo del estado de las habitaciones** del Hotel BonAventura. Expone una API REST para consultar y actualizar habitaciones, y es **consumidor de eventos Kafka** para actualizar automáticamente el estado cuando se confirma una reserva.

---

## Función Principal

- CRUD de habitaciones (número, tipo, precio, estado).
- Consulta de habitaciones por estado (disponibles, ocupadas, en mantenimiento).
- Escuchar el evento `ReservaCompletadaEvent` de Kafka y cambiar el estado de la habitación a `OCUPADA` automáticamente al confirmarse una reserva.

---

## Puerto

| Entorno | Puerto |
|---------|--------|
| Docker (externo) | **8082** |
| Docker (interno) | 8082 |

---

## Estructura de Carpetas

```
habitaciones-service/
├── src/
│   └── main/
│       ├── java/com/hotelbonaventura/habitaciones/
│       │   ├── HabitacionesServiceApplication.java   # Punto de entrada
│       │   ├── controller/
│       │   │   └── HabitacionController.java         # Endpoints REST
│       │   ├── service/
│       │   │   ├── HabitacionService.java            # Interfaz
│       │   │   └── impl/
│       │   │       └── HabitacionServiceImpl.java    # Lógica de negocio
│       │   ├── repository/
│       │   │   └── HabitacionRepository.java         # JPA: acceso a BD
│       │   ├── entity/
│       │   │   └── Habitacion.java                   # Mapeo JPA
│       │   ├── dto/
│       │   │   ├── HabitacionDTO.java                # Respuesta API
│       │   │   ├── CrearHabitacionRequestDTO.java
│       │   │   ├── ActualizarHabitacionRequestDTO.java
│       │   │   └── CambioEstadoRequestDTO.java
│       │   ├── mapper/
│       │   │   └── HabitacionMapper.java             # Entity ↔ DTO
│       │   ├── kafka/
│       │   │   ├── ReservaCompletadaEvent.java       # Estructura del evento
│       │   │   ├── ReservaCompletadaListener.java    # Consumer Kafka
│       │   │   └── KafkaConsumerConfig.java          # Config del consumer
│       │   └── exception/
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           └── application.yml
├── Dockerfile
└── pom.xml
```

---

## Endpoints REST

Todos los endpoints requieren token JWT válido (enviado a través del Gateway).

### Habitaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/habitaciones` | Listar todas las habitaciones |
| `GET` | `/api/habitaciones/{id}` | Obtener una habitación por ID |
| `GET` | `/api/habitaciones/disponibles` | Listar solo habitaciones DISPONIBLES |
| `POST` | `/api/habitaciones` | Crear nueva habitación |
| `PUT` | `/api/habitaciones/{id}` | Actualizar datos de una habitación |
| `PATCH` | `/api/habitaciones/{id}/estado` | Cambiar estado manualmente |
| `DELETE` | `/api/habitaciones/{id}` | Eliminar habitación |

**Ejemplo de respuesta (HabitacionDTO):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "numero": "101",
  "tipo": "DOBLE",
  "precioPorNoche": 150.00,
  "estado": "DISPONIBLE"
}
```

**Estados posibles:**
- `DISPONIBLE` — lista para reservar
- `OCUPADA` — con reserva activa (actualizado por Kafka)
- `MANTENIMIENTO` — fuera de servicio temporalmente

---

## Cómo Está Construido

### Capa de Datos

```
Schema: hotel_habitaciones
Tabla:  habitaciones

┌────────────────┬───────────────────────────────┐
│ Columna        │ Tipo / Descripción            │
├────────────────┼───────────────────────────────┤
│ id             │ UUID (PK)                     │
│ numero         │ VARCHAR(2) UNIQUE             │
│ tipo           │ VARCHAR (SIMPLE/DOBLE/SUITE)  │
│ precio_por_noche│ DECIMAL(10,2)               │
│ estado         │ VARCHAR: DISPONIBLE /         │
│                │  OCUPADA / MANTENIMIENTO      │
│ created_at     │ TIMESTAMP                     │
└────────────────┴───────────────────────────────┘
```

### Consumer Kafka (`ReservaCompletadaListener.java`)

Al producirse una reserva confirmada, el `reservas-service` publica un evento en Kafka. Este servicio lo consume y actualiza el estado de la habitación:

```java
@KafkaListener(
  topics = "reserva-completada-topic",
  groupId = "habitaciones-service-group"
)
public void onReservaCompletada(ReservaCompletadaEvent event) {
    habitacionService.cambiarEstado(event.getIdHabitacion(), "OCUPADA");
}
```

**Configuración del consumer:**
- Deserializador: `JsonDeserializer<ReservaCompletadaEvent>`
- Paquetes de confianza: `com.hotelbonaventura.*`
- `auto.offset.reset`: `earliest` (procesa desde el inicio si no hay offset guardado)

---

## Diagrama de Flujo

```
Frontend (Recepcionista)
    │
    │  GET /api/habitaciones/disponibles
    ▼
Hotel Gateway → Habitaciones Service (:8082)
    │
    ▼
HabitacionController
    └── HabitacionServiceImpl
            └── HabitacionRepository (JPA)
                    └── Supabase PostgreSQL (hotel_habitaciones)
                              ▼
                    Lista de habitaciones DISPONIBLES

─────────────────────────────────────────────────────
(flujo asíncrono: después del check-in)

Reservas Service
    │  Publica ReservaCompletadaEvent
    ▼
Apache Kafka (reserva-completada-topic)
    │
    ▼
ReservaCompletadaListener.onReservaCompletada()
    │
    ▼
habitacionService.cambiarEstado(idHabitacion, "OCUPADA")
    │
    ▼
Supabase: UPDATE habitaciones SET estado = 'OCUPADA' WHERE id = ?
```

---

## Variables de Entorno Relevantes

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexión a Supabase PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales BD |
| `KAFKA_BROKER` | Dirección del broker (`kafka-container:9092`) |
| `KAFKA_GROUP_ID` | Consumer group base |
