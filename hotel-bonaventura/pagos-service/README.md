# Pagos Service — Pagos y Boletas Electrónicas

Microservicio responsable del **procesamiento de pagos** y la **generación de boletas electrónicas** (Tipo 03 SUNAT) del Hotel BonAventura. Implementado en **Python con FastAPI**. Es consumidor de eventos Kafka: al recibir una reserva confirmada, genera automáticamente el registro de pago y la boleta correspondiente, incluyendo el cálculo del IGV (18%).

---

## Función Principal

- Escuchar el evento `ReservaCompletadaEvent` de Kafka y crear el pago y la boleta automáticamente.
- Calcular el desglose tributario: base imponible + IGV 18% = importe total.
- Generar y almacenar boletas electrónicas con estructura SUNAT (Tipo 03).
- Exponer endpoints para consultar pagos, boletas y **descargar boletas en PDF**.
- Generar documentos PDF con `reportlab`.

---

## Puerto

| Entorno | Puerto |
|---------|--------|
| Docker (externo) | **8084** |
| Docker (interno) | 8084 |

---

## Estructura de Carpetas

```
pagos-service/
├── main.py                    # App FastAPI: definición de rutas y startup
├── kafka_consumer.py          # Consumer Kafka en hilo separado
├── boleta_generator.py        # Lógica de generación de boletas (SUNAT)
├── pdf_generator.py           # Generación de PDFs con reportlab
├── database.py                # Conexión psycopg2 a Supabase
├── requirements.txt           # Dependencias Python
└── Dockerfile                 # Python 3.11-slim + Uvicorn
```

---

## Endpoints REST

### Health (compatibles con Spring Actuator)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/actuator/health` | `{"status": "UP"}` |
| `GET` | `/actuator/info` | Info del servicio |

### Pagos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/pagos` | Listar todos los pagos |
| `GET` | `/api/pagos/{id}` | Obtener pago por ID |
| `GET` | `/api/pagos/reserva/{id_reserva}` | Pago de una reserva específica |
| `POST` | `/api/pagos/simular` | Simular pago (pruebas manuales) |

### Boletas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/pagos/boletas/{id}` | Obtener boleta por ID |
| `GET` | `/api/pagos/boletas/reserva/{id_reserva}` | Boleta de una reserva |
| `GET` | `/api/pagos/boletas/{id}/pdf` | **Descargar boleta en PDF** |

### Documentación interactiva

- Swagger UI: `http://localhost:8084/docs`
- ReDoc: `http://localhost:8084/redoc`

---

## Cómo Está Construido

### Flujo de Procesamiento (Kafka Consumer)

Al recibir un `ReservaCompletadaEvent` del topic `reserva-completada-topic`:

```python
def procesar_pago_y_boleta(event: dict):

    # 1. Insertar registro de Pago
    pago_id = db.insert("pagos", {
        "id_reserva": event["idReserva"],
        "monto": event["montoTotal"],
        "metodo_pago": event["metodoPago"],
        "estado": "EXITOSO",
        "fecha_pago": datetime.now()
    })

    # 2. Calcular desglose de IGV
    monto_total = Decimal(event["montoTotal"])
    base_imponible = monto_total / Decimal("1.18")   # excluye IGV
    igv = monto_total - base_imponible                # 18%

    # 3. Generar número de boleta secuencial
    numero = db.next_numero_boleta()   # auto-increment

    # 4. Construir documento JSON (estructura SUNAT)
    documento = boleta_generator.generar(event, base_imponible, igv, numero)

    # 5. Insertar Boleta en BD
    db.insert("boletas", {
        "id_pago": pago_id,
        "serie": "B001",
        "numero": numero,
        "cliente_dni": event["clienteDni"],
        "cliente_nombre_completo": event["clienteNombre"],
        "base_imponible": base_imponible,
        "igv": igv,
        "importe_total": monto_total,
        "documento_completo": documento,   # JSON
        "estado": "EMITIDA"
    })
```

### Cálculo del IGV

```
Entrada:  montoTotal (precio por noche × noches, IGV incluido)

baseImponible = montoTotal / 1.18
igv           = montoTotal - baseImponible
importeTotal  = montoTotal

Ejemplo con S/ 450.00:
  baseImponible = 450.00 / 1.18 = 381.36
  igv           = 450.00 - 381.36 = 68.64
  importeTotal  = 450.00
```

### Estructura del Documento SUNAT (JSON en BD)

```json
{
  "tipoDocumento": "03",
  "serie": "B001",
  "numero": 42,
  "empresa": {
    "ruc": "20123456789",
    "razonSocial": "Hotel BonAventura S.A.C.",
    "direccion": "Av. Principal 123, Lima"
  },
  "cliente": {
    "tipoDocumento": "1",
    "numeroDocumento": "12345678",
    "nombreCompleto": "Juan Carlos Pérez García"
  },
  "reserva": {
    "codigo": "RES-2026-0042",
    "habitacion": "101",
    "fechaCheckin": "2026-05-22",
    "fechaCheckout": "2026-05-25",
    "cantidadNoches": 3
  },
  "totales": {
    "valorVenta": 381.36,
    "igv": 68.64,
    "importeTotal": 450.00
  },
  "sunat": {
    "tipoOperacion": "0101",
    "hash": "generado",
    "fechaEmision": "2026-05-22"
  }
}
```

### Generación de PDF (`pdf_generator.py`)

Usa **reportlab** para generar el PDF de la boleta:

```python
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# Contenido del PDF:
# - Cabecera: RUC, razón social, dirección, tipo de boleta
# - Número: B001-00000042
# - Cliente: DNI y nombre
# - Detalle: código de reserva, habitación, fechas, noches
# - Totales: valor venta, IGV 18%, importe total
```

**Endpoint de descarga:**
```python
@app.get("/api/pagos/boletas/{id}/pdf")
def descargar_pdf(id: str):
    boleta = db.get_boleta(id)
    pdf_bytes = pdf_generator.generar(boleta)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=boleta-{boleta.numero}.pdf"}
    )
```

### Consumer Kafka (`kafka_consumer.py`)

```python
consumer = KafkaConsumer(
    "reserva-completada-topic",
    bootstrap_servers=KAFKA_BROKER,
    group_id="pagos-service-group",
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest"
)

# Corre en un hilo daemon para no bloquear FastAPI
threading.Thread(target=consumer_loop, daemon=True).start()
```

### Base de Datos

```
Schema: hotel_pagos

Tabla: pagos
┌─────────────┬───────────────────────────────────┐
│ Columna     │ Tipo / Descripción                │
├─────────────┼───────────────────────────────────┤
│ id          │ UUID (PK)                         │
│ id_reserva  │ UUID                              │
│ monto       │ DECIMAL(10,2)                     │
│ metodo_pago │ VARCHAR (EFECTIVO, TARJETA, etc.) │
│ estado      │ EXITOSO / PENDIENTE / RECHAZADO   │
│ fecha_pago  │ TIMESTAMP                         │
└─────────────┴───────────────────────────────────┘

Tabla: boletas
┌────────────────────┬──────────────────────────────┐
│ Columna            │ Tipo / Descripción           │
├────────────────────┼──────────────────────────────┤
│ id                 │ UUID (PK)                    │
│ id_pago            │ UUID (FK → pagos)            │
│ id_reserva         │ UUID                         │
│ serie              │ VARCHAR (siempre "B001")     │
│ numero             │ INTEGER (auto-increment)     │
│ cliente_dni        │ VARCHAR(8)                   │
│ cliente_nombre_completo│ VARCHAR                 │
│ base_imponible     │ DECIMAL(10,2)               │
│ igv                │ DECIMAL(10,2)               │
│ importe_total      │ DECIMAL(10,2)               │
│ documento_completo │ JSON (estructura SUNAT)      │
│ estado             │ EMITIDA / ANULADA            │
│ fecha_emision      │ TIMESTAMP                    │
└────────────────────┴──────────────────────────────┘
```

---

## Diagrama de Flujo

```
Reservas Service
    │  Publica ReservaCompletadaEvent (JSON)
    ▼
Apache Kafka (reserva-completada-topic)
    │
    ▼
┌──────────────────────────────────────────────┐
│           PAGOS SERVICE :8084                 │
│                                              │
│  kafka_consumer.py (hilo daemon)             │
│       │                                      │
│       ▼                                      │
│  procesar_pago_y_boleta(event)               │
│    ├── Insertar Pago (EXITOSO)               │
│    ├── Calcular IGV 18%                      │
│    ├── Número secuencial de boleta           │
│    ├── Construir doc JSON (SUNAT)            │
│    └── Insertar Boleta (EMITIDA)             │
└──────────────────────────────────────────────┘

─────────────────────────────────────────────────
(flujo de descarga de boleta)

Frontend
    │  GET /api/pagos/boletas/{id}/pdf
    ▼
Hotel Gateway → Pagos Service
    │
    ▼
pdf_generator.generar(boleta)
    │
    ▼
Response: PDF inline (reportlab)
    │
    ▼
Navegador abre / descarga el PDF
```

---

## Variables de Entorno Relevantes

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexión a Supabase PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales BD |
| `KAFKA_BROKER` | Dirección del broker (`kafka-container:9092`) |
| `KAFKA_GROUP_ID` | Consumer group base |
