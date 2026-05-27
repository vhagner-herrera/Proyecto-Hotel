# Diagramas de Servicios — Hotel BonAventura

Diagramas de flujo interno para cada microservicio: qué recibe, cómo lo procesa,
con qué colabora y qué devuelve.

---

## Tabla de Contenidos

1. [Hotel Gateway — Enrutamiento y Seguridad](#1-hotel-gateway--enrutamiento-y-seguridad)
2. [Auth Service — Autenticación JWT](#2-auth-service--autenticación-jwt)
3. [Habitaciones Service — CRUD y Kafka Consumer](#3-habitaciones-service--crud-y-kafka-consumer)
4. [Reservas Service — Check-in, RENIEC y Kafka Producer](#4-reservas-service--check-in-reniec-y-kafka-producer)
5. [Pagos Service — Procesamiento y Boletas PDF](#5-pagos-service--procesamiento-y-boletas-pdf)
6. [Administración Service — Reportes, Usuarios y Parámetros](#6-administración-service--reportes-usuarios-y-parámetros)

---

## 1. Hotel Gateway — Enrutamiento y Seguridad

**Puerto:** 8080 | **Stack:** Spring Cloud Gateway (WebFlux reactivo)
**Responsabilidad:** Punto de entrada único. Valida JWT, inyecta contexto de usuario y enruta al microservicio correspondiente.

```plantuml
@startuml servicio_gateway
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #fef9c3
skinparam ActivityDiamondBackgroundColor #dbeafe

title Hotel Gateway (:8080) — Flujo Interno

start

:Recibe petición HTTP entrante;
note right
  Toda petición al sistema
  pasa obligatoriamente
  por el Gateway.
end note

:JwtAuthenticationFilter\n(HIGHEST_PRECEDENCE);

if (¿Ruta es pública?\n/api/auth/** o /actuator/health) then (sí)
  :Permite pasar sin validación JWT;
else (no, ruta protegida)
  :Extrae header\nAuthorization: Bearer {token};

  if (¿Header presente?) then (no)
    :Retorna 401 Unauthorized;
    stop
  endif

  :JwtUtil.validateToken(token);

  if (¿Token válido y no expirado?) then (no)
    :Retorna 401 Unauthorized;
    stop
  endif

  :Extrae claims del JWT:\nemail, rol, nombre;
  :Inyecta headers en la petición reenviada:\n→ X-User-Email: {email}\n→ X-User-Role: {rol};
endif

:GatewayConfig — Determina ruta destino;

if (¿Path comienza con /api/auth?) then (sí)
  :Reenvía a Auth Service :8081;
else if (¿/api/habitaciones?) then (sí)
  :Reenvía a Habitaciones Service :8082;
else if (¿/api/reservas?) then (sí)
  :Reenvía a Reservas Service :8083;
else if (¿/api/pagos?) then (sí)
  :Reenvía a Pagos Service :8084;
else if (¿/api/admin?) then (sí)
  :Reenvía a Administración Service :8085;
else
  :404 Not Found;
  stop
endif

:Retorna respuesta del microservicio\nal cliente original;

stop

@enduml
```

### Configuración de Rutas

```plantuml
@startuml gateway_rutas
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ComponentBorderColor #1e3a5f
skinparam ComponentBackgroundColor #fef9c3

title Gateway — Tabla de Enrutamiento

component "Hotel Gateway\n:8080" as GW

component "/api/auth/**\n(PÚBLICO)" as R1
component "/api/habitaciones/**\n(JWT requerido)" as R2
component "/api/reservas/**\n(JWT requerido)" as R3
component "/api/pagos/**\n(JWT requerido)" as R4
component "/api/admin/**\n(JWT + rol ADMIN)" as R5

component "Auth Service\n:8081" as S1 #lightgreen
component "Habitaciones\n:8082" as S2 #lightgreen
component "Reservas\n:8083" as S3 #lightgreen
component "Pagos\n:8084" as S4 #lightsalmon
component "Administración\n:8085" as S5 #lightgreen

GW --> R1
GW --> R2
GW --> R3
GW --> R4
GW --> R5

R1 --> S1
R2 --> S2
R3 --> S3
R4 --> S4
R5 --> S5

@enduml
```

---

## 2. Auth Service — Autenticación JWT

**Puerto:** 8081 | **Stack:** Spring Boot + Spring Security + JJWT
**Responsabilidad:** Único punto de autenticación. Valida credenciales y emite tokens JWT firmados con HS384.

```plantuml
@startuml servicio_auth
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #dcfce7
skinparam ActivityDiamondBackgroundColor #fef9c3
skinparam SequenceArrowColor #1e3a5f

title Auth Service (:8081) — Flujo de Login

start

:POST /api/auth/login\n{correo, contrasena};

partition "AuthController" {
  :@Valid valida LoginRequestDTO;\n(correo: @Email @NotBlank\ncontrasena: @NotBlank)
  if (¿Pasa validación?) then (no)
    :400 Bad Request\n{timestamp, status, error, message, path};
    stop
  endif
}

partition "AuthServiceImpl" {
  :usuarioRepository\n.findByCorreo(correo);

  if (¿Usuario encontrado?) then (no)
    :throw InvalidCredentialsException;
  endif

  if (¿estado = "ACTIVO"?) then (no)
    :throw InvalidCredentialsException;
  endif

  :BCryptPasswordEncoder\n.matches(contrasena, usuario.contrasena);

  if (¿Hash coincide?) then (no)
    :throw InvalidCredentialsException;
  endif
}

partition "JwtUtil" {
  :Construye claims:\n{sub: correo, nombre, rol, iat, exp};
  :Firma con HMAC-SHA384\n(clave ≥ 48 bytes → HS384);
  :Genera token JWT;
}

partition "AuthController (respuesta)" {
  :Retorna 200 OK\n{token, tipo: "Bearer",\nemail, nombre, rol, expiresIn: 86400000};
}

stop

@enduml
```

### Capas Internas

```plantuml
@startuml auth_capas
skinparam backgroundColor white
skinparam SequenceArrowColor #1e3a5f
skinparam ParticipantBorderColor #1e3a5f
skinparam ParticipantBackgroundColor #dcfce7

title Auth Service — Colaboración entre Capas

participant "AuthController" as C
participant "AuthServiceImpl" as S
participant "UsuarioRepository\n(JPA)" as R
participant "BCryptPasswordEncoder" as BC
participant "JwtUtil" as J
database "Supabase\nhotel_auth.usuarios" as DB

C -> S: login(LoginRequestDTO)
S -> R: findByCorreo(correo)
R -> DB: SELECT * FROM usuarios WHERE correo = ?
DB --> R: Optional<Usuario>
R --> S: Optional<Usuario>

alt Usuario no existe o inactivo
  S --> C: throw InvalidCredentialsException → 401
end

S -> BC: matches(contrasenaPlana, hashBD)
BC --> S: boolean

alt No coincide
  S --> C: throw InvalidCredentialsException → 401
end

S -> J: generateToken(usuario)
J --> S: jwtString (HS384)

S --> C: AuthResponseDTO
C --> C: ResponseEntity.ok(dto) → 200

@enduml
```

---

## 3. Habitaciones Service — CRUD y Kafka Consumer

**Puerto:** 8082 | **Stack:** Spring Boot + Spring Data JPA + Spring Kafka
**Responsabilidad:** Gestión del catálogo y estado de habitaciones. Escucha eventos Kafka para actualizar estado automáticamente tras check-in.

```plantuml
@startuml servicio_habitaciones
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #fef9c3
skinparam ActivityDiamondBackgroundColor #dbeafe

title Habitaciones Service (:8082) — Flujo de Operaciones

start

:Recibe petición HTTP\no evento Kafka;

if (¿Origen = HTTP?) then (sí)

  :HabitacionController recibe request;

  if (¿GET /habitaciones?) then (sí)
    :HabitacionServiceImpl\n.listarTodas() o .listarPorEstado();
    :findAll() en hotel_habitaciones;
    :Mapper → List<HabitacionDTO>;
    :200 OK;

  else if (¿GET /habitaciones/{id}?) then (sí)
    :findById(id);
    if (¿Existe?) then (no)
      :404 HabitacionNoEncontradaException;
    else (sí)
      :Mapper → HabitacionDTO;
      :200 OK;
    endif

  else if (¿POST /habitaciones?) then (sí)
    :@Valid CrearHabitacionRequestDTO\n(numero, tipo, precioPorNoche);
    :Verifica numero no duplicado;
    if (¿Duplicado?) then (sí)
      :409 HabitacionDuplicadaException;
    else (no)
      :Mapper → Habitacion entity\nestado = DISPONIBLE;
      :save() en BD;
      :201 Created + HabitacionDTO;
    endif

  else if (¿PUT /habitaciones/{id}?) then (sí)
    :ActualizarHabitacionRequestDTO;
    :findById → update fields;
    :save() → HabitacionDTO;
    :200 OK;

  else if (¿PUT /habitaciones/{id}/estado?) then (sí)
    :CambioEstadoRequestDTO {estado};
    :Valida transición de estado;
    note right
      Validaciones:
      OCUPADA solo puede asignarse
      vía Kafka (no por HTTP directamente).
      Otros estados: libre transición
      para el Administrador.
    end note
    :UPDATE estado en BD;
    :CambioEstadoResponseDTO\n{id, estado, fechaCambio};
    :200 OK;

  else if (¿DELETE /habitaciones/{id}?) then (sí)
    :findById;
    :deleteById();
    :204 No Content;
  endif

else (Evento Kafka)

  :KafkaConsumerConfig\nescucha topic "reserva-completada-topic";

  partition "ReservaCompletadaListener" {
    :Deserializa ReservaCompletadaEvent\n{idReserva, idHabitacion, ...};
    :findById(idHabitacion);
    if (¿Habitación encontrada?) then (sí)
      :UPDATE estado = 'OCUPADA';
      :save() en BD;
      :Log: "Habitación {numero} → OCUPADA";
    else (no)
      :Log warning: "Habitación no encontrada";
    endif
  }
endif

stop

@enduml
```

---

## 4. Reservas Service — Check-in, RENIEC y Kafka Producer

**Puerto:** 8083 | **Stack:** Spring Boot + Spring Data JPA + Spring Kafka + RestTemplate
**Responsabilidad:** Proceso central de check-in. Consulta RENIEC, crea la reserva y publica el evento que desencadena los procesos de pago y estado de habitación.

```plantuml
@startuml servicio_reservas
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #f0fdf4
skinparam ActivityDiamondBackgroundColor #fef9c3

title Reservas Service (:8083) — Flujo Completo

start

:Recibe petición HTTP;

if (¿GET /reservas/consultar-dni/{dni}?) then (sí)

  partition "ReniecServiceImpl" {
    :Construye URL:\nhttps://api.decolecta.com\n?dni={dni}&token={RENIEC_API_KEY};
    :RestTemplate.getForObject();
    if (¿Respuesta OK?) then (sí)
      :Deserializa ReniecResponseDTO\n{apellidoPaterno, apellidoMaterno, nombres, dni};
      :Construye nombreCompleto;
      :200 OK {nombreCompleto};
    else (error/404)
      :throw DniNoEncontradoException;
      :404 "DNI no encontrado en RENIEC";
    endif
  }

else if (¿POST /reservas/checkin?) then (sí)

  :@Valid CheckinRequestDTO;
  note right
    Validaciones:
    - idHabitacion: @NotNull
    - tipoDocumento: DNI|CARNET_EXTRANJERIA
    - clienteDocumento: @NotBlank max 15
    - clienteEdad: 1–120
    - clienteCelular: 9–15 dígitos
    - cantidadNoches: min 1
    - metodoPago: EFECTIVO|TARJETA
  end note

  partition "ReservaServiceImpl" {
    :Verifica habitacion.estado = DISPONIBLE\n(consulta hotel_habitaciones vía JPA);
    if (¿Disponible?) then (no)
      :throw HabitacionNoDisponibleException;
      :409 "Habitación no disponible";
      stop
    endif

    :fechaCheckin = hoy;
    :fechaCheckout = hoy + cantidadNoches;
    :montoTotal = precioPorNoche × cantidadNoches;
  }

  partition "CodigoReservaGenerator" {
    :Cuenta reservas del año actual;
    :Genera código = "RES-{año}-{secuencial 4 dígitos}"\n(ej: RES-2026-0042);
  }

  partition "Persistencia" {
    :Mapper → Reserva entity;
    :reservaRepository.save()\nen hotel_reservas.reservas\n(estado = CONFIRMADA);
    :DB retorna reserva con id;
  }

  partition "KafkaProducerService" {
    :Construye ReservaCompletadaEvent\n{idReserva, codigoReserva, idHabitacion,\nnumeroHabitacion, tipoHabitacion, precioPorNoche,\nclienteDocumento, clienteNombreCompleto, clienteEdad,\nclienteCelular, fechaCheckin, fechaCheckout,\ncantidadNoches, montoTotal, metodoPago, timestamp};
    :kafkaTemplate.send(\n  "reserva-completada-topic",\n  idReserva.toString(),\n  event\n);
    :Log: "Evento publicado para reserva {codigoReserva}";
  }

  :Mapper → CheckinResponseDTO\n{id, codigoReserva, clienteDocumento,\nclienteNombreCompleto, numeroHabitacion,\nfechaCheckin, fechaCheckout, cantidadNoches,\nmontoTotal, estado, mensaje};
  :201 Created;

else if (¿GET /reservas?) then (sí)
  :findAll() en hotel_reservas;
  :Mapper → List<ReservaDTO>;
  :200 OK;

else if (¿GET /reservas/{id}?) then (sí)
  :findById();
  if (¿Existe?) then (sí)
    :200 OK ReservaDTO;
  else (no)
    :404;
  endif

else if (¿GET /reservas/cliente/{dni}?) then (sí)
  :findByClienteDni(dni);
  :200 OK List<ReservaDTO>;
endif

stop

@enduml
```

---

## 5. Pagos Service — Procesamiento y Boletas PDF

**Puerto:** 8084 | **Stack:** FastAPI (Python) + Uvicorn + psycopg2 + kafka-python-ng + reportlab
**Responsabilidad:** Recibe eventos Kafka de reservas confirmadas, genera pagos y boletas electrónicas SUNAT tipo 03. Expone descarga de PDF.

```plantuml
@startuml servicio_pagos
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #fdf4ff
skinparam ActivityDiamondBackgroundColor #fef9c3

title Pagos Service (:8084) — Flujo Kafka + HTTP

start

:Inicialización (startup):;
note right
  1. Conecta a Supabase hotel_pagos
  2. Inicia kafka_consumer.py
     en hilo daemon separado
  3. Levanta servidor Uvicorn :8084
end note

split
  -> Hilo Kafka Consumer;

  partition "kafka_consumer.py (hilo daemon)" {
    :Suscribe a topic\n"reserva-completada-topic"\ngrupo: pagos-group;

    repeat
      :Espera mensaje Kafka;
      :Deserializa JSON → dict\n{idReserva, codigoReserva, idHabitacion,\nnumeroHabitacion, clienteDocumento,\nclienteNombreCompleto, fechaCheckin,\nfechaCheckout, cantidadNoches,\nmontoTotal, metodoPago, ...};

      partition "Procesamiento de Pago" {
        :INSERT en hotel_pagos.pagos:\n{id_reserva, monto: montoTotal,\nmetodo_pago, estado: 'EXITOSO',\nfecha_pago: now()};
        :DB retorna id_pago;
      }

      partition "boleta_generator.py" {
        :base_imponible = montoTotal / 1.18;
        :igv = montoTotal - base_imponible;
        :Obtiene siguiente numero de serie B001\n(MAX(numero)+1 en boletas);
        :Construye documento_completo (JSON):\n{serie: "B001", numero, clienteDni,\nclienteNombre, codigoReserva,\nnumeroHabitacion, fechaCheckin,\nfechaCheckout, cantidadNoches,\nbase_imponible, igv, importe_total,\nmetodoPago};
        :INSERT en hotel_pagos.boletas\n{id_pago, serie, numero, cliente_dni,\nbase_imponible, igv, importe_total,\ndocumento_completo};
      }

      :Log: "Boleta generada para reserva {codigoReserva}";
    repeat while (¿Kafka activo?)
  }

split again
  -> HTTP FastAPI;

  partition "main.py (Uvicorn)" {

    if (¿GET /api/pagos?) then (sí)
      :SELECT * FROM hotel_pagos.pagos;
      :200 OK List<pago>;

    else if (¿GET /api/pagos/{id}?) then (sí)
      :SELECT WHERE id = {id};
      if (¿Existe?) then (sí)
        :200 OK pago;
      else (no)
        :404;
      endif

    else if (¿GET /api/pagos/reserva/{id_reserva}?) then (sí)
      :SELECT WHERE id_reserva = {id};
      :200 OK pago o 404;

    else if (¿GET /api/pagos/boletas/{id}?) then (sí)
      :SELECT FROM boletas WHERE id = {id};
      :200 OK boleta o 404;

    else if (¿GET /api/pagos/boletas/reserva/{id_reserva}?) then (sí)
      :SELECT boleta JOIN pago WHERE id_reserva = {id};
      :200 OK boleta o 404;

    else if (¿GET /api/pagos/boletas/{id}/pdf?) then (sí)

      partition "pdf_generator.py (reportlab)" {
        :Obtiene boleta de BD;
        :Crea PDF en memoria (BytesIO);
        :Canvas reportlab:\n→ Cabecera: RUC, razón social\n→ Tipo: Boleta 03 SUNAT\n→ Número: B001-{numero}\n→ Cliente: DNI/Carnet, nombre\n→ Detalle: reserva, habitación,\n   noches, fechas\n→ Totales: base imponible,\n   IGV 18%, importe total\n→ Método de pago;
        :StreamingResponse(PDF bytes)\nContent-Type: application/pdf;
      }

    else if (¿POST /api/pagos/simular?) then (sí)
      :Recibe ReservaCompletadaEvent como body;
      :Ejecuta mismo flujo que consumer Kafka\n(de forma síncrona, para testing);
      :200 OK boleta generada;

    else if (¿GET /actuator/health?) then (sí)
      :{"status": "UP"};

    endif
  }

end split

stop

@enduml
```

---

## 6. Administración Service — Reportes, Usuarios y Parámetros

**Puerto:** 8085 | **Stack:** Spring Boot + Spring Security + Spring Data JPA
**Responsabilidad:** Panel administrativo completo. Lee datos de múltiples schemas para reportes cruzados. Gestiona usuarios y parámetros del sistema.

```plantuml
@startuml servicio_administracion
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #e8f5e9
skinparam ActivityDiamondBackgroundColor #fef9c3

title Administración Service (:8085) — Flujo por Módulo

start

:Recibe petición HTTP\ncon header X-User-Role = "ADMINISTRADOR";

if (¿Rol = ADMINISTRADOR?) then (no)
  :403 AccesoNoAutorizadoException;
  stop
endif

if (¿/api/admin/usuarios?) then (sí)

  if (¿GET?) then (sí)
    :UsuarioRepository.findAll()\nen hotel_auth.usuarios;
    :200 OK List<UsuarioDTO>;

  else if (¿POST?) then (sí)
    :@Valid CrearUsuarioDTO\n{nombre, correo, contrasena (min 6), rol};
    :BCryptPasswordEncoder.encode(contrasena);
    :INSERT en hotel_auth.usuarios\n(estado = ACTIVO);
    :201 Created {id, nombre, correo, rol, estado};

  else if (¿PUT /{id}?) then (sí)
    :findById(id);
    :UPDATE nombre, correo, rol;
    :200 OK UsuarioDTO;

  else if (¿DELETE /{id}?) then (sí)
    :findById(id);
    :UPDATE estado = "INACTIVO"\n(soft delete, no borra registro);
    :200 OK {message: "Usuario desactivado"};
  endif

else if (¿/api/admin/reportes/ingresos?) then (sí)

  :Params: fechaInicio, fechaFin\n(default: mes actual);
  :BoletaRepository.findByFechaCreacionBetween(\n  fechaInicio, fechaFin\n)\nen hotel_pagos.boletas;
  :ReporteServiceImpl:\n  totalIngresos = SUM(importe_total)\n  totalBaseImponible = SUM(base_imponible)\n  totalIGV = SUM(igv)\n  cantidadBoletas = COUNT()\n  detallesPorDia = GROUP BY fecha;
  :200 OK ReporteIngresosDTO;

else if (¿/api/admin/reportes/ocupacion?) then (sí)

  :HabitacionRepository.findAll()\nen hotel_habitaciones;
  :ReservaRepository.findByEstado("CONFIRMADA")\nen hotel_reservas;
  :Calcula:\n  tasaOcupacion = ocupadas / total × 100\n  detallesPorTipo (SIMPLE/DOBLE/SUITE);
  :200 OK ReporteOcupacionDTO;

else if (¿/api/admin/reportes/dashboard?) then (sí)

  :Consultas múltiples en paralelo:;
  note right
    Schemas consultados:
    - hotel_pagos (ingresos mes, boletas)
    - hotel_reservas (reservas mes)
    - hotel_habitaciones (disponibles/ocupadas)
    - hotel_auth (usuarios activos)
  end note
  :Construye DashboardDTO:\n  ingresosMes, reservasMes\n  habitacionesDisponibles, habitacionesOcupadas\n  porcentajeOcupacion, usuariosActivos\n  boletasEmitidas, promedioDiario;
  :200 OK DashboardDTO;

else if (¿/api/admin/parametros?) then (sí)

  if (¿GET?) then (sí)
    :ParametroRepository.findAll()\nen hotel_administracion.parametros_globales;
    :200 OK List<ParametroDTO>;

  else if (¿PUT /{clave}?) then (sí)
    :findByClave(clave);
    if (¿Existe?) then (no)
      :throw ParametroNoEncontradoException → 404;
    else (sí)
      :UPDATE valor WHERE clave = ?;
      :200 OK {clave, valor, message};
    endif
  endif

endif

stop

@enduml
```

### Acceso Cross-Schema del Administración Service

```plantuml
@startuml admin_schemas
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam DatabaseBorderColor #1e3a5f
skinparam ComponentBorderColor #1e3a5f

title Administración Service — Acceso a Múltiples Schemas

component "Administración\nService :8085" as ADM #lightgreen

database "hotel_auth" as DB1 {
  component "usuarios\n(lectura + escritura)" as T1
}

database "hotel_habitaciones" as DB2 {
  component "habitaciones\n(solo lectura)" as T2
}

database "hotel_reservas" as DB3 {
  component "reservas\n(solo lectura)" as T3
}

database "hotel_pagos" as DB4 {
  component "boletas\n(solo lectura)" as T4
}

database "hotel_administracion" as DB5 {
  component "parametros_globales\n(lectura + escritura)" as T5
}

ADM --> T1 : CRUD Usuarios\nUsuarioAdminController
ADM --> T2 : Reporte Ocupación\nReporteController
ADM --> T3 : Reporte Ocupación\nReservas activas
ADM --> T4 : Reporte Ingresos\nBoletas por período
ADM --> T5 : CRUD Parámetros\nParametroController

@enduml
```
