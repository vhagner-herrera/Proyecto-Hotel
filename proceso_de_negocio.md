# Proceso de Negocio — Hotel BonAventura

Documento que describe los procesos operativos del sistema, los actores involucrados,
los flujos de cada caso de uso y los estados de las entidades principales.

---

## Tabla de Contenidos

1. [Roles del Sistema](#1-roles-del-sistema)
2. [Diagrama de Casos de Uso](#2-diagrama-de-casos-de-uso)
3. [Flujo de Autenticación](#3-flujo-de-autenticación)
4. [Flujo de Check-in (Recepcionista)](#4-flujo-de-check-in-recepcionista)
5. [Flujo Check-in — Secuencia Backend Completa](#5-flujo-check-in--secuencia-backend-completa)
6. [Estados de Habitación](#6-estados-de-habitación)
7. [Estados de Reserva](#7-estados-de-reserva)
8. [Flujo del Panel Administrador](#8-flujo-del-panel-administrador)
9. [Arquitectura de Servicios](#9-arquitectura-de-servicios)

---

## 1. Roles del Sistema

El sistema tiene **dos roles diferenciados**. El Administrador hereda todas las
capacidades del Recepcionista más las funciones de gestión y reportes.

| Rol | Acceso | Ruta base |
|---|---|---|
| `RECEPCIONISTA` | Habitaciones, Check-in, Reservas | `/recepcion` |
| `ADMINISTRADOR` | Todo lo anterior + Usuarios, Habitaciones (CRUD), Reportes, Parámetros | `/recepcion` y `/admin` |

> Un Recepcionista que intente acceder a `/admin` es redirigido automáticamente a `/recepcion`
> por `ProtectedRoute.jsx`.

---

## 2. Diagrama de Casos de Uso

```plantuml
@startuml casos_de_uso
left to right direction
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam ArrowColor #1e3a5f
skinparam ActorBorderColor #1e3a5f
skinparam UsecaseBorderColor #1e3a5f
skinparam UsecaseBackgroundColor #f0f4ff

actor "Recepcionista" as R #lightblue
actor "Administrador" as A #lightyellow

rectangle "Sistema Hotel BonAventura" {

  package "Acceso compartido\n(RECEPCIONISTA + ADMINISTRADOR)" {
    usecase "Iniciar sesión" as UC_LOGIN
    usecase "Cerrar sesión" as UC_LOGOUT
    usecase "Ver habitaciones\n(con filtros por estado)" as UC_VER_HAB
    usecase "Realizar Check-in\n(crear reserva)" as UC_CHECKIN
    usecase "Consultar DNI en RENIEC" as UC_RENIEC
    usecase "Ver listado de reservas" as UC_VER_RES
    usecase "Descargar boleta PDF" as UC_PDF
  }

  package "Solo Administrador" {
    usecase "Ver Dashboard KPIs" as UC_DASH
    usecase "Gestionar usuarios\n(crear, editar, desactivar)" as UC_USUARIOS
    usecase "Gestionar habitaciones\n(CRUD + cambiar estado)" as UC_HAB_ADMIN
    usecase "Reporte de ingresos\n(por rango de fechas)" as UC_REP_ING
    usecase "Reporte de ocupación\n(tabla por habitación)" as UC_REP_OC
    usecase "Editar parámetros\n(precio base, IGV, etc.)" as UC_PARAMS
  }
}

R --> UC_LOGIN
R --> UC_LOGOUT
R --> UC_VER_HAB
R --> UC_CHECKIN
R --> UC_VER_RES
R --> UC_PDF

UC_CHECKIN ..> UC_RENIEC : <<include>>\n(si tipo = DNI)

A --> UC_LOGIN
A --> UC_LOGOUT
A --> UC_VER_HAB
A --> UC_CHECKIN
A --> UC_VER_RES
A --> UC_PDF
A --> UC_DASH
A --> UC_USUARIOS
A --> UC_HAB_ADMIN
A --> UC_REP_ING
A --> UC_REP_OC
A --> UC_PARAMS

@enduml
```

---

## 3. Flujo de Autenticación

```plantuml
@startuml flujo_autenticacion
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #f0f4ff
skinparam ActivityDiamondBackgroundColor #fff9e6
skinparam NoteBackgroundColor #fffbe6

title Flujo de Autenticación

start

:Usuario accede a la aplicación;
note right: http://localhost:3000

if (¿Tiene token JWT\nválido en localStorage?) then (sí)
  if (¿Rol = ADMINISTRADOR?) then (sí)
    :Redirige a /admin;
  else (no, RECEPCIONISTA)
    :Redirige a /recepcion;
  endif
else (no)
  :Muestra /login;
  :Ingresa correo y contraseña;
  :Frontend → POST /api/auth/login\n(Gateway → Auth Service :8081);

  if (¿Correo existe\nen BD?) then (no)
    :401 "Credenciales inválidas";
    :Muestra error en pantalla;
    stop
  endif

  if (¿Estado = ACTIVO?) then (no)
    :401 "Credenciales inválidas";
    :Muestra error en pantalla;
    stop
  endif

  if (¿BCrypt.matches()\ncontraseña?) then (no)
    :401 "Credenciales inválidas";
    :Muestra error en pantalla;
    stop
  endif

  :Genera JWT firmado HS384\n(expira en 24 horas);
  :Retorna {token, nombre, rol, email};
  :authStore guarda token\n+ usuario en Zustand/localStorage;

  if (¿Rol = ADMINISTRADOR?) then (sí)
    :Redirige a /admin;
    :Carga Dashboard con KPIs\n(auto-refresh cada 30s);
  else (RECEPCIONISTA)
    :Redirige a /recepcion;
    :Carga lista de habitaciones;
  endif
endif

stop
@enduml
```

---

## 4. Flujo de Check-in (Recepcionista)

Este es el proceso operativo central del sistema. Involucra 3 pasos en el formulario
y desencadena eventos asíncronos en el backend.

```plantuml
@startuml flujo_checkin
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #f0f4ff
skinparam ActivityDiamondBackgroundColor #fff9e6

title Flujo de Check-in — Perspectiva del Recepcionista

start

:Recepcionista accede a /recepcion;
:Ve lista de habitaciones;
note right
  Filtros disponibles:
  - TODOS
  - DISPONIBLE
  - OCUPADA
  - MANTENIMIENTO
end note

:Hace clic en habitación DISPONIBLE;
:Sistema verifica estado actual de la habitación;

if (¿Habitación sigue\nDISPONIBLE?) then (no)
  :Toast de error\n"Esta habitación ya no está disponible";
  :Redirige a /recepcion;
  stop
endif

:Muestra formulario de Check-in\n(3 pasos);

partition "Paso 1 — Datos del Cliente" {
  :Selecciona tipo de documento;

  if (¿Tipo = DNI?) then (sí)
    :Ingresa 8 dígitos del DNI;
    :Hace clic en "Consultar RENIEC";
    if (¿DNI encontrado\nen RENIEC?) then (sí)
      :Nombre completo se\nauto-completa (solo lectura);
      :Flag dniConsultado = true;
    else (no)
      :Error "DNI no encontrado en RENIEC";
      :Debe reintentar o cambiar tipo de doc;
    endif
  else (Carnet de Extranjería)
    :Ingresa número de documento (max 15 chars);
    :Ingresa nombre completo manualmente;
  endif
}

partition "Paso 2 — Datos Adicionales" {
  :Ingresa edad del huésped (1–120);
  :Ingresa número de celular (9–15 dígitos);
  :Ingresa cantidad de noches (mínimo 1);
  note right
    El panel derecho muestra
    el resumen en tiempo real:
    - Precio por noche
    - Total = precio × noches
  end note
}

partition "Paso 3 — Método de Pago" {
  :Selecciona método de pago;
  note right
    Opciones:
    - EFECTIVO
    - TARJETA
  end note
}

:Hace clic en\n"Procesar Check-in y Emitir Boleta";

if (¿Tipo DNI y\ndniConsultado = false?) then (sí)
  :Error "Debes consultar el DNI\nantes de continuar";
  stop
endif

:POST /api/reservas/checkin;

if (¿Backend responde\nexitosamente?) then (sí)
  :Toast "¡Reserva creada exitosamente!";
  :Modal de confirmación muestra:\n- Código de reserva (RES-2026-XXXX)\n- Datos del huésped\n- Habitación + fechas\n- Monto total;
  note right
    En paralelo (asíncrono):
    - Habitación cambia a OCUPADA
    - Se genera pago + boleta PDF
  end note
else (error)
  :Toast con mensaje de error\ndel backend;
  stop
endif

:Recepcionista puede\ndescargar boleta PDF;

stop
@enduml
```

---

## 5. Flujo Check-in — Secuencia Backend Completa

```plantuml
@startuml secuencia_checkin
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam SequenceArrowColor #1e3a5f
skinparam ParticipantBorderColor #1e3a5f
skinparam ParticipantBackgroundColor #f0f4ff
skinparam NoteBackgroundColor #fffbe6
skinparam SequenceGroupBackgroundColor #e8f0fe

title Secuencia Completa: Check-in

actor "Recepcionista\n(Navegador)" as R
participant "Frontend\nReact :3000" as FE
participant "Gateway\n:8080" as GW
participant "Reservas\nService :8083" as RS
participant "RENIEC\nAPI" as RENIEC
participant "Kafka\nBroker :9092" as KAFKA
participant "Habitaciones\nService :8082" as HS
participant "Pagos\nService :8084" as PS
database "Supabase\nPostgreSQL" as DB

== Consulta DNI (previa al submit) ==

R -> FE: Ingresa DNI + clic "Consultar RENIEC"
FE -> GW: GET /api/reservas/consultar-dni/{dni}
GW -> GW: Valida JWT (HS384)\nInyecta X-User-Email, X-User-Role
GW -> RS: GET /reservas/consultar-dni/{dni}
RS -> RENIEC: GET https://api.decolecta.com\n?dni={dni}&token={RENIEC_API_KEY}
alt DNI encontrado
  RENIEC --> RS: {nombreCompleto, ...}
  RS --> GW: 200 {nombreCompleto}
  GW --> FE: 200 {nombreCompleto}
  FE --> R: Nombre auto-completado (verde)
else DNI no encontrado
  RENIEC --> RS: 404
  RS --> GW: 404 "DNI no encontrado"
  GW --> FE: 404
  FE --> R: Toast error
end

== Submit Check-in ==

R -> FE: Clic "Procesar Check-in y Emitir Boleta"
FE -> GW: POST /api/reservas/checkin\n{idHabitacion, tipoDocumento, clienteDocumento,\nclienteNombreCompleto, clienteEdad, clienteCelular,\ncantidadNoches, metodoPago}
GW -> GW: Valida JWT\nInyecta headers X-User-Email, X-User-Role
GW -> RS: POST /reservas/checkin

RS -> DB: SELECT * FROM hotel_habitaciones.habitaciones\nWHERE id = ?
alt Habitación no DISPONIBLE
  DB --> RS: habitacion.estado != DISPONIBLE
  RS --> GW: 409 "Habitación no disponible"
  GW --> FE: 409
  FE --> R: Toast error
end

RS -> RS: Calcula fechaCheckin (hoy)\nfechaCheckout = hoy + cantidadNoches\nmontoTotal = precioPorNoche × cantidadNoches
RS -> RS: Genera código único\nRES-{año}-{secuencial 4 dígitos}
RS -> DB: INSERT INTO hotel_reservas.reservas\n(estado = CONFIRMADA)
DB --> RS: Reserva creada con id

note over RS, KAFKA
  Publicación del evento al topic:
  "reserva-completada-topic"
end note

RS -> KAFKA: Publica ReservaCompletadaEvent\n{idReserva, codigoReserva, idHabitacion,\nnumeroHabitacion, clienteDni, clienteNombre,\nfechaCheckin, fechaCheckout, cantidadNoches,\nmontoTotal, metodoPago}
RS --> GW: 200 {codigoReserva, huésped, habitacion, montoTotal}
GW --> FE: 200
FE --> R: Toast éxito + Modal confirmación

== Procesamiento Asíncrono (eventos Kafka) ==

par Habitaciones Consumer
  KAFKA -> HS: ReservaCompletadaEvent\n(ReservaCompletadaListener)
  HS -> DB: UPDATE hotel_habitaciones.habitaciones\nSET estado = 'OCUPADA'\nWHERE id = ?
  DB --> HS: OK
end

par Pagos Consumer
  KAFKA -> PS: ReservaCompletadaEvent\n(kafka_consumer.py — hilo separado)
  PS -> DB: INSERT INTO hotel_pagos.pagos\n{idReserva, monto, metodoPago, estado=EXITOSO}
  DB --> PS: Pago creado
  PS -> PS: boleta_generator.py:\nCalcula base_imponible = monto / 1.18\nIGV = monto - base_imponible\nGenera número B001-{correlativo}
  PS -> DB: INSERT INTO hotel_pagos.boletas\n{serieBoleta=B001, numero, clienteDni,\nbase_imponible, igv, importe_total, documento_completo JSON}
  DB --> PS: Boleta creada
end

== Descarga de Boleta PDF ==

R -> FE: Clic "Descargar Boleta"
FE -> GW: GET /api/pagos/boletas/{idBoleta}/pdf
GW -> PS: GET /pagos/boletas/{idBoleta}/pdf\n(FastAPI, responseType: blob)
PS -> PS: pdf_generator.py con reportlab:\n- Cabecera: RUC empresa, Boleta tipo 03 SUNAT\n- Cliente: DNI, nombre\n- Detalle: reserva, habitación, noches, fechas\n- Totales: base imponible, IGV, importe total
PS --> GW: application/pdf (inline)
GW --> FE: PDF blob
FE --> R: Navegador abre/descarga PDF

@enduml
```

---

## 6. Estados de Habitación

```plantuml
@startuml estados_habitacion
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam StateBorderColor #1e3a5f
skinparam StateBackgroundColor #f0f4ff
skinparam StateStartColor #1e3a5f
skinparam StateEndColor #1e3a5f

title Estados de Habitación

[*] --> DISPONIBLE : Habitación creada

DISPONIBLE --> OCUPADA : Check-in confirmado\n(Kafka consumer en habitaciones-service)
DISPONIBLE --> MANTENIMIENTO : Admin cambia estado manualmente\n(PUT /habitaciones/{id}/estado)
DISPONIBLE --> LIMPIEZA : Admin cambia estado manualmente

OCUPADA --> DISPONIBLE : Admin cambia estado manualmente\n(cuando el huésped hace check-out)
OCUPADA --> MANTENIMIENTO : Admin cambia estado manualmente

MANTENIMIENTO --> DISPONIBLE : Admin cambia estado manualmente
LIMPIEZA --> DISPONIBLE : Admin cambia estado manualmente

note right of OCUPADA
  El cambio DISPONIBLE → OCUPADA
  es AUTOMÁTICO vía evento Kafka
  (ReservaCompletadaEvent).
  El recepcionista no puede
  cambiar estados manualmente.
end note

note right of DISPONIBLE
  Solo las habitaciones DISPONIBLE
  pueden recibir un Check-in.
  El sistema verifica el estado
  en tiempo real antes de
  mostrar el formulario.
end note

@enduml
```

---

## 7. Estados de Reserva

```plantuml
@startuml estados_reserva
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam StateBorderColor #1e3a5f
skinparam StateBackgroundColor #f0f4ff

title Estados de Reserva

[*] --> CONFIRMADA : Check-in procesado\n(INSERT en reservas-service)

note right of CONFIRMADA
  La reserva se crea
  directamente en CONFIRMADA
  (no pasa por PENDIENTE
  en el flujo normal de check-in)
end note

CONFIRMADA --> CANCELADA : Cancelación manual\n(no implementado en UI actual)
CONFIRMADA --> COMPLETADA : Check-out\n(no implementado en UI actual)

PENDIENTE --> CONFIRMADA : Confirmación
PENDIENTE --> CANCELADA : Cancelación

CANCELADA --> [*]
COMPLETADA --> [*]

@enduml
```

---

## 8. Flujo del Panel Administrador

```plantuml
@startuml flujo_administrador
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #f0f4ff
skinparam ActivityDiamondBackgroundColor #fff9e6

title Flujo del Panel Administrador — /admin

start

:Administrador accede a /admin;
note right
  DashboardAdmin.jsx = shell/layout
  (sidebar + header + Outlet)
  HomeAdmin.jsx = página de inicio
  dentro del Outlet
end note

:Dashboard KPIs carga automáticamente\nGET /api/admin/reportes/dashboard;
note right
  KPIs principales:
  - Ingresos del Mes (S/.)
  - Reservas del Mes (count)
  - Habitaciones Disponibles
  - Habitaciones Ocupadas

  Métricas adicionales:
  - % Ocupación
  - Usuarios Activos
  - Boletas Emitidas
  - Promedio Diario (S/.)

  Auto-refresh cada 30 segundos
end note

:Administrador elige módulo desde sidebar;

split
  -> Usuarios;
  partition "Gestión de Usuarios" {
    :GET /api/admin/usuarios\n(lista todos los usuarios);
    :Puede crear nuevo usuario\n(ADMINISTRADOR o RECEPCIONISTA);
    :Puede editar nombre, rol, contraseña;
    :Puede desactivar usuario\n(estado = INACTIVO);
    note right
      El módulo de usuarios es el único
      punto de creación de cuentas.
      No existe registro público.
    end note
  }
split again
  -> Habitaciones;
  partition "Gestión de Habitaciones" {
    :GET /api/habitaciones\n(lista todas las habitaciones);
    :Puede crear habitación\n(número, tipo, precio por noche);
    :Puede editar habitación;
    :Puede eliminar habitación;
    :Puede cambiar estado manualmente\n(DISPONIBLE / MANTENIMIENTO / LIMPIEZA);
    note right
      El cambio a OCUPADA
      solo lo hace el sistema
      vía Kafka (no manual).
    end note
  }
split again
  -> Reportes;
  partition "Reportes de Ingresos" {
    :Selecciona fecha inicio y fecha fin;
    :GET /api/admin/reportes/ingresos\n?fechaInicio=&fechaFin=;
    :Visualiza gráfico de barras\n(ingresos por día en el período);
    :Datos: ingresosPorDia[], totalIngresos,\ncantidadReservas;
  }
split again
  -> Ocupación;
  partition "Reporte de Ocupación" {
    :GET /api/admin/reportes/ocupacion;
    :Visualiza tabla con estado actual\nde cada habitación;
    :Datos: número, tipo, estado,\nreserva activa (si aplica);
  }
split again
  -> Parámetros;
  partition "Parámetros del Sistema" {
    :GET /api/admin/parametros\n(lista parámetros configurables);
    :Puede editar valor de cada parámetro\nPUT /api/admin/parametros/{clave};
    note right
      Parámetros típicos:
      precio base, porcentaje IGV,
      configuraciones del sistema
    end note
  }
end split

stop
@enduml
```

---

## 9. Arquitectura de Servicios

```plantuml
@startuml arquitectura_servicios
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ComponentBorderColor #1e3a5f
skinparam DatabaseBorderColor #1e3a5f
skinparam NodeBorderColor #1e3a5f

title Arquitectura de Microservicios — Hotel BonAventura

node "Red Docker: hotel-net" {

  component "Frontend\nReact + Nginx\n:3000" as FE #lightblue

  component "Hotel Gateway\nSpring Cloud Gateway\n:8080" as GW #lightyellow {
    component "JwtAuthFilter" as JWT
    component "CorsConfig" as CORS
    component "GatewayConfig\n(rutas)" as ROUTES
  }

  component "auth-service\nSpring Boot :8081" as AUTH #lightgreen
  component "habitaciones-service\nSpring Boot :8082" as HAB #lightgreen
  component "reservas-service\nSpring Boot :8083" as RES #lightgreen
  component "pagos-service\nFastAPI (Python) :8084" as PAG #lightsalmon
  component "administracion-service\nSpring Boot :8085" as ADM #lightgreen

  component "Apache Kafka\nKRaft mode :9092" as KAFKA #lightyellow

  database "Supabase PostgreSQL\n(AWS us-west-2)" as DB {
    component "hotel_auth" as DB_AUTH
    component "hotel_habitaciones" as DB_HAB
    component "hotel_reservas" as DB_RES
    component "hotel_pagos" as DB_PAG
    component "hotel_administracion" as DB_ADM
  }
}

cloud "Servicios Externos" {
  component "RENIEC API\napi.decolecta.com" as RENIEC
}

FE -right-> GW : HTTP REST\n/api/**

GW --> AUTH  : /api/auth/**
GW --> HAB   : /api/habitaciones/**
GW --> RES   : /api/reservas/**
GW --> PAG   : /api/pagos/**
GW --> ADM   : /api/admin/**

AUTH  --> DB_AUTH : JDBC/SSL
HAB   --> DB_HAB  : JDBC/SSL
RES   --> DB_RES  : JDBC/SSL
RES   --> DB_HAB  : JDBC/SSL (lectura\ndisponibilidad)
PAG   --> DB_PAG  : psycopg2/SSL
ADM   --> DB_AUTH  : JDBC/SSL (lectura)
ADM   --> DB_RES   : JDBC/SSL (lectura)
ADM   --> DB_HAB   : JDBC/SSL (lectura)
ADM   --> DB_PAG   : JDBC/SSL (lectura)

RES -down-> KAFKA : Produce\nreserva-completada-topic
KAFKA -down-> HAB  : Consume\n(cambia estado → OCUPADA)
KAFKA -down-> PAG  : Consume\n(genera pago + boleta PDF)

RES --> RENIEC : GET consulta DNI\n(solo si tipoDoc = DNI)

@enduml
```

---

## Notas de Implementación

### Aclaración: DashboardAdmin vs HomeAdmin

| Archivo | Tipo | Rol en la UI |
|---|---|---|
| `DashboardAdmin.jsx` | Layout/Shell | Sidebar de navegación + header "Administrador" + `<Outlet />`. Se renderiza en `/admin` y todas sus sub-rutas. |
| `HomeAdmin.jsx` | Página de contenido | KPIs y métricas del hotel. Se renderiza **dentro** del Outlet en la ruta `/admin` (index). Auto-refresh cada 30 segundos. |
| `DashboardRecepcion.jsx` | Layout/Shell | Mismo patrón: sidebar "Habitaciones / Reservas" + header "Recepcionista" + `<Outlet />`. |

### Reglas de Negocio Clave

1. **Check-in con DNI:** El recepcionista **debe** consultar RENIEC antes de poder enviar el formulario. El nombre se bloquea como solo lectura tras la consulta exitosa.
2. **Check-in con Carnet de Extranjería:** No pasa por RENIEC; el nombre se ingresa manualmente.
3. **Habitación OCUPADA:** El cambio de estado `DISPONIBLE → OCUPADA` es **exclusivamente automático** vía evento Kafka. Ni el recepcionista ni el administrador pueden forzarlo directamente.
4. **Boleta electrónica:** Se genera automáticamente con cada reserva confirmada. Sigue el formato SUNAT Boleta tipo 03 (serie B001 con correlativo).
5. **Creación de usuarios:** Solo el Administrador puede crear cuentas. No hay registro público.
6. **Expiración de sesión:** El JWT expira en 24 horas. El interceptor de Axios redirige automáticamente a `/login` ante cualquier `401`.
