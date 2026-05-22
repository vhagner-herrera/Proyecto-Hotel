# Administración Service — Panel Administrativo

Microservicio de uso exclusivo para usuarios con rol **ADMINISTRADOR**. Provee endpoints para gestionar usuarios del sistema, mantener parámetros globales y consultar reportes de ingresos y ocupación del hotel. Lee datos de múltiples schemas de la base de datos para consolidar información en reportes.

---

## Función Principal

- **Gestión de usuarios:** crear, editar y desactivar cuentas de recepcionistas y administradores.
- **Parámetros globales:** configuración del sistema (precios base, políticas, etc.).
- **Reportes de ingresos:** ingresos agrupados por día en un rango de fechas.
- **Reporte de ocupación:** porcentaje de ocupación por habitación en un período.
- **Dashboard:** KPIs principales del hotel (reservas totales, ingresos, ocupación).

---

## Puerto

| Entorno | Puerto |
|---------|--------|
| Docker (externo) | **8085** |
| Docker (interno) | 8085 |

---

## Estructura de Carpetas

```
administracion-service/
├── src/
│   └── main/
│       ├── java/com/hotelbonaventura/administracion/
│       │   ├── AdministracionServiceApplication.java
│       │   ├── controller/
│       │   │   ├── UsuarioAdminController.java    # CRUD usuarios
│       │   │   ├── ParametroController.java       # Parámetros del sistema
│       │   │   └── ReporteController.java         # Reportes y dashboard
│       │   ├── service/
│       │   │   ├── impl/
│       │   │   │   ├── UsuarioAdminServiceImpl.java
│       │   │   │   ├── ParametroServiceImpl.java
│       │   │   │   └── ReporteServiceImpl.java    # Lógica de reportes
│       │   ├── repository/
│       │   │   ├── UsuarioRepository.java         # hotel_auth.usuarios
│       │   │   ├── ParametroRepository.java       # hotel_administracion.parametros
│       │   │   ├── BoletaRepository.java          # hotel_pagos.boletas
│       │   │   ├── ReservaRepository.java         # hotel_reservas.reservas
│       │   │   └── HabitacionRepository.java      # hotel_habitaciones.habitaciones
│       │   ├── entity/
│       │   │   ├── Usuario.java
│       │   │   ├── ParametroGlobal.java
│       │   │   ├── Boleta.java
│       │   │   ├── Reserva.java
│       │   │   └── Habitacion.java
│       │   ├── dto/
│       │   │   ├── UsuarioDTO.java
│       │   │   ├── CrearUsuarioDTO.java
│       │   │   ├── ActualizarUsuarioDTO.java
│       │   │   ├── ParametroDTO.java
│       │   │   ├── ReporteIngresosDTO.java
│       │   │   ├── ReporteOcupacionDTO.java
│       │   │   ├── DashboardDTO.java
│       │   │   └── PeriodoDTO.java
│       │   ├── config/
│       │   │   └── SecurityConfig.java
│       │   └── exception/
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           └── application.yml
├── Dockerfile
└── pom.xml
```

---

## Endpoints REST

Todos los endpoints requieren JWT con **rol ADMINISTRADOR**. El Gateway valida el header `X-User-Role`.

### Gestión de Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/admin/usuarios` | Listar todos los usuarios |
| `GET` | `/api/admin/usuarios/{id}` | Obtener usuario por ID |
| `POST` | `/api/admin/usuarios` | Crear nuevo usuario |
| `PUT` | `/api/admin/usuarios/{id}` | Actualizar usuario |
| `DELETE` | `/api/admin/usuarios/{id}` | Desactivar usuario (soft delete) |

**Request de creación:**
```json
{
  "nombre": "María Recepcionista",
  "correo": "maria@bonaventura.com",
  "contrasena": "maria2026",
  "rol": "RECEPCIONISTA"
}
```

> Las contraseñas se hashean con BCrypt (strength 10) antes de guardar.

### Parámetros del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/admin/parametros` | Listar parámetros actuales |
| `POST` | `/api/admin/parametros` | Crear o actualizar parámetro |

### Reportes y Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/admin/dashboard` | KPIs actuales del hotel |
| `GET` | `/api/admin/reportes/ingresos` | Ingresos por período (query: `from`, `to`) |
| `GET` | `/api/admin/reportes/ocupacion` | Ocupación por período (query: `from`, `to`) |

---

## Cómo Está Construido

### Reporte de Ingresos (`ReporteServiceImpl`)

Consulta la tabla `hotel_pagos.boletas` filtrando por rango de fechas y agrupa por día:

```
GET /api/admin/reportes/ingresos?from=2026-05-01&to=2026-05-31

Respuesta (ReporteIngresosDTO):
{
  "periodo": {
    "desde": "2026-05-01",
    "hasta": "2026-05-31"
  },
  "ingresosPorDia": [
    { "fecha": "2026-05-01", "monto": 900.00, "cantidadReservas": 2 },
    { "fecha": "2026-05-03", "monto": 450.00, "cantidadReservas": 1 }
  ],
  "totalIngresos": 1350.00,
  "cantidadReservas": 3
}
```

### Reporte de Ocupación (`ReporteServiceImpl`)

Calcula los días que cada habitación estuvo ocupada en el período:

```
GET /api/admin/reportes/ocupacion?from=2026-05-01&to=2026-05-31

Respuesta (ReporteOcupacionDTO):
{
  "periodo": { "desde": "...", "hasta": "..." },
  "detalleOcupacion": [
    {
      "numeroHabitacion": "101",
      "tipo": "DOBLE",
      "diasOcupados": 12,
      "diasTotal": 31,
      "porcentajeOcupacion": 38.7
    }
  ],
  "porcentajeOcupacionPromedio": 42.5
}
```

### Dashboard (`ReporteServiceImpl`)

Consolida datos en tiempo real de múltiples tablas:

```
GET /api/admin/dashboard

Respuesta (DashboardDTO):
{
  "totalReservas": 87,
  "totalIngresos": 39150.00,
  "porcentajeOcupacion": 65.2,
  "habitacionesDisponibles": 4
}
```

### Acceso Multi-Schema

El servicio accede a múltiples schemas de Supabase en modo lectura para los reportes:

```
hotel_auth.usuarios             → gestión de usuarios del sistema
hotel_administracion.parametros → parámetros globales
hotel_reservas.reservas         → datos de reservas para reportes
hotel_habitaciones.habitaciones → estado actual de habitaciones
hotel_pagos.boletas             → montos para reporte de ingresos
```

---

## Diagrama de Flujo

```
Administrador (Navegador)
    │
    │  GET /api/admin/reportes/ingresos?from=2026-05-01&to=2026-05-31
    ▼
Hotel Gateway
    ├── Valida JWT
    └── Verifica X-User-Role = ADMINISTRADOR
                │
                ▼
┌───────────────────────────────────────────────────┐
│         ADMINISTRACIÓN SERVICE :8085              │
│                                                   │
│  ReporteController.getIngresos(from, to)          │
│       │                                           │
│       ▼                                           │
│  ReporteServiceImpl.calcularIngresos()            │
│    ├── BoletaRepository                           │
│    │    SELECT SUM(importe_total), COUNT(*),      │
│    │           DATE(fecha_emision)                │
│    │    FROM hotel_pagos.boletas                  │
│    │    WHERE fecha_emision BETWEEN from AND to   │
│    │    GROUP BY DATE(fecha_emision)              │
│    │                                              │
│    └── Construye ReporteIngresosDTO               │
└───────────────────────────────────────────────────┘
                │
                ▼
           Frontend
     Renderiza GraficoIngresos.jsx
```

---

## Variables de Entorno Relevantes

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexión a Supabase PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales BD |
| `JWT_SECRET` | Para que Spring Security valide el header X-User-Role |
