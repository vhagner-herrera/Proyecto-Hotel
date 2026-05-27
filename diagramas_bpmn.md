# Diagramas BPMN — Hotel BonAventura

Diagramas de proceso de negocio (estilo BPMN con swimlanes) que evidencian
qué actores y servicios participan en cada proceso del sistema.

---

## Tabla de Contenidos

1. [Proceso: Autenticación y Sesión](#1-proceso-autenticación-y-sesión)
2. [Proceso: Check-in de Huésped](#2-proceso-check-in-de-huésped)
3. [Proceso: Descarga de Boleta PDF](#3-proceso-descarga-de-boleta-pdf)
4. [Proceso: Gestión de Habitaciones](#4-proceso-gestión-de-habitaciones)
5. [Proceso: Gestión de Usuarios](#5-proceso-gestión-de-usuarios)
6. [Proceso: Generación de Reportes](#6-proceso-generación-de-reportes)
7. [Proceso: Configuración de Parámetros](#7-proceso-configuración-de-parámetros)
8. [Mapa de Participación de Servicios](#8-mapa-de-participación-de-servicios)

---

## 1. Proceso: Autenticación y Sesión

**Servicios involucrados:** Frontend · Hotel Gateway · Auth Service · Supabase

```plantuml
@startuml bpmn_autenticacion
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #dbeafe
skinparam ActivityDiamondBackgroundColor #fef9c3
skinparam SwimlaneBorderColor #1e3a5f
skinparam SwimlaneBackgroundColor #f8fafc

title BPMN — Autenticación y Sesión

|#e0f2fe| Usuario (Navegador) |
start
:Accede a la aplicación\nhttp://localhost:3000;

|#dbeafe| Frontend (React :3000) |
if (¿Token JWT\nen localStorage?) then (sí)
  :Lee rol del token;
  if (¿Rol = ADMINISTRADOR?) then (sí)
    :Redirige a /admin;
  else (RECEPCIONISTA)
    :Redirige a /recepcion;
  endif
  stop
else (no)
  :Muestra /login;
endif

|#e0f2fe| Usuario (Navegador) |
:Ingresa correo + contraseña;
:Envía formulario;

|#dbeafe| Frontend (React :3000) |
:POST /api/auth/login\n{correo, contraseña};

|#fef3c7| Hotel Gateway (:8080) |
:Recibe petición;
note right
  Ruta /api/auth/**
  es PÚBLICA
  (no valida JWT)
end note
:Reenvía a Auth Service :8081;

|#dcfce7| Auth Service (:8081) |
:Busca usuario por correo\nen hotel_auth.usuarios;
if (¿Existe?) then (no)
  :Retorna 401\n"Credenciales inválidas";
else (sí)
  if (¿Estado = ACTIVO?) then (no)
    :Retorna 401\n"Credenciales inválidas";
  else (sí)
    :BCrypt.matches(contraseña, hash);
    if (¿Coincide?) then (no)
      :Retorna 401\n"Credenciales inválidas";
    else (sí)
      :Genera JWT HS384\n(expira 24h);
      :Retorna 200\n{token, tipo, email, nombre, rol, expiresIn};
    endif
  endif
endif

|#fef3c7| Hotel Gateway (:8080) |
:Propaga respuesta al Frontend;

|#dbeafe| Frontend (React :3000) |
if (¿Respuesta 200?) then (sí)
  :Guarda token en authStore\n+ localStorage;
  :Redirige según rol;
else (error)
  :Muestra mensaje de error;
  :Permanece en /login;
endif

|#e0f2fe| Usuario (Navegador) |
:Accede al panel correspondiente;
stop

@enduml
```

---

## 2. Proceso: Check-in de Huésped

**Servicios involucrados:** Frontend · Hotel Gateway · Reservas Service · Habitaciones Service · Pagos Service · RENIEC API · Kafka · Supabase

```plantuml
@startuml bpmn_checkin
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ActivityBorderColor #1e3a5f
skinparam ActivityBackgroundColor #dbeafe
skinparam ActivityDiamondBackgroundColor #fef9c3
skinparam SwimlaneBorderColor #1e3a5f

title BPMN — Check-in de Huésped (Proceso Principal)

|#e0f2fe| Recepcionista |
start
:Selecciona habitación\nDISPONIBLE en /recepcion;

|#dbeafe| Frontend (:3000) |
:GET /api/habitaciones/{id}\nVerifica estado actual;

if (¿Estado = DISPONIBLE?) then (no)
  :Toast "No disponible"\nRedirige a /recepcion;
  stop
else (sí)
  :Muestra formulario\nde Check-in (3 pasos);
endif

|#e0f2fe| Recepcionista |
:Selecciona tipo de documento\n(DNI o Carnet Extranjería);

if (¿Tipo = DNI?) then (sí)
  :Ingresa 8 dígitos del DNI;
  :Clic "Consultar RENIEC";

  |#dbeafe| Frontend (:3000) |
  :GET /api/reservas/consultar-dni/{dni};

  |#fef3c7| Hotel Gateway (:8080) |
  :Valida JWT\nInyecta X-User-Email, X-User-Role;
  :Reenvía a Reservas Service :8083;

  |#f0fdf4| Reservas Service (:8083) |
  :Llama a RENIEC API\nhttps://api.decolecta.com;

  |#fce7f3| RENIEC API (Externo) |
  if (¿DNI válido?) then (sí)
    :Retorna nombre completo;
  else (no)
    :Retorna 404;
  endif

  |#f0fdf4| Reservas Service (:8083) |
  :Propaga respuesta;

  |#dbeafe| Frontend (:3000) |
  if (¿DNI encontrado?) then (sí)
    :Autocompleta nombre (solo lectura)\ndniConsultado = true;
  else (no)
    :Toast error "DNI no encontrado";
  endif

  |#e0f2fe| Recepcionista |
else (Carnet Extranjería)
  :Ingresa número + nombre\nmanualmente;

  |#e0f2fe| Recepcionista |
endif

:Completa Paso 2:\nEdad, celular, cant. noches;
:Selecciona método de pago\n(EFECTIVO / TARJETA);
:Clic "Procesar Check-in\ny Emitir Boleta";

|#dbeafe| Frontend (:3000) |
:POST /api/reservas/checkin\n{idHabitacion, tipoDocumento,\nclienteDocumento, clienteNombre,\nclienteEdad, clienteCelular,\ncantidadNoches, metodoPago};

|#fef3c7| Hotel Gateway (:8080) |
:Valida JWT HS384;
:Inyecta X-User-Email, X-User-Role;
:Reenvía a Reservas Service :8083;

|#f0fdf4| Reservas Service (:8083) |
:Verifica disponibilidad\nde la habitación;
if (¿Disponible?) then (no)
  :409 "Habitación no disponible";
  stop
else (sí)
  :Calcula fechas y montoTotal;
  :Genera código RES-{año}-{XXXX};
  :INSERT reserva (estado=CONFIRMADA)\nen hotel_reservas;
  :Retorna 201 {codigoReserva, datos};
endif

|#fef3c7| Hotel Gateway (:8080) |
:Propaga 201 al Frontend;

|#dbeafe| Frontend (:3000) |
:Toast "¡Reserva creada!"\nModal con código y resumen;

|#e0f2fe| Recepcionista |
:Ve confirmación con:\n- Código RES-XXXX\n- Datos del huésped\n- Monto total;

note right
  Proceso asíncrono continúa
  en paralelo (Kafka)
end note

|#f0fdf4| Reservas Service (:8083) |
:Publica ReservaCompletadaEvent\nen Kafka topic\n"reserva-completada-topic";

|#fff7ed| Apache Kafka (:9092) |
:Distribuye evento\na consumers registrados;

fork
  |#fef9c3| Habitaciones Service (:8082) |
  :Consume ReservaCompletadaEvent\n(ReservaCompletadaListener);
  :UPDATE habitacion\nSET estado = 'OCUPADA';
fork again
  |#fdf4ff| Pagos Service (:8084) |
  :Consume ReservaCompletadaEvent\n(kafka_consumer.py en hilo separado);
  :INSERT pago (estado=EXITOSO);
  :Calcula IGV 18%\nbase_imponible = monto / 1.18;
  :INSERT boleta serie B001\n(documento_completo JSON);
end fork

stop

@enduml
```

---

## 3. Proceso: Descarga de Boleta PDF

**Servicios involucrados:** Frontend · Hotel Gateway · Pagos Service · Supabase

```plantuml
@startuml bpmn_boleta_pdf
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam SwimlaneBorderColor #1e3a5f

title BPMN — Descarga de Boleta PDF

|#e0f2fe| Recepcionista / Admin |
start
:Ve confirmación de reserva\no lista de reservas;
:Clic "Descargar Boleta PDF";

|#dbeafe| Frontend (:3000) |
:GET /api/pagos/boletas/{idBoleta}/pdf\n(responseType: blob);

|#fef3c7| Hotel Gateway (:8080) |
:Valida JWT;
:Reenvía a Pagos Service :8084;

|#fdf4ff| Pagos Service FastAPI (:8084) |
:Busca boleta en hotel_pagos.boletas\npor id;
if (¿Boleta existe?) then (no)
  :Retorna 404;
  stop
else (sí)
  :Genera PDF con reportlab (pdf_generator.py);
  note right
    Estructura del PDF (SUNAT Boleta 03):
    ─────────────────────────────
    Cabecera: RUC empresa, razón social
    Tipo: Boleta de Venta B001-{numero}
    ─────────────────────────────
    Cliente:
      DNI / Carnet: {clienteDocumento}
      Nombre: {clienteNombre}
    ─────────────────────────────
    Detalle:
      Código reserva: RES-XXXX
      Habitación: N° {numero} - {tipo}
      Fecha entrada: {fechaCheckin}
      Fecha salida:  {fechaCheckout}
      Cant. noches:  {cantidadNoches}
    ─────────────────────────────
    Totales:
      Base imponible: S/. XX.XX
      IGV (18%):      S/. XX.XX
      Importe total:  S/. XX.XX
    ─────────────────────────────
    Método de pago: EFECTIVO / TARJETA
  end note
  :Retorna PDF binario\nContent-Type: application/pdf\nContent-Disposition: inline;
endif

|#fef3c7| Hotel Gateway (:8080) |
:Propaga PDF al Frontend;

|#dbeafe| Frontend (:3000) |
:Crea Blob URL\nabre PDF en nueva pestaña;

|#e0f2fe| Recepcionista / Admin |
:Visualiza / descarga PDF;
stop

@enduml
```

---

## 4. Proceso: Gestión de Habitaciones

**Servicios involucrados:** Frontend · Hotel Gateway · Habitaciones Service · Supabase

```plantuml
@startuml bpmn_habitaciones
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam SwimlaneBorderColor #1e3a5f

title BPMN — Gestión de Habitaciones (Admin)

|#e0f2fe| Administrador |
start
:Accede a /admin/habitaciones;

|#dbeafe| Frontend (:3000) |
:GET /api/habitaciones\n(lista completa);

|#fef3c7| Hotel Gateway (:8080) |
:Valida JWT\nInyecta rol ADMINISTRADOR;

|#fef9c3| Habitaciones Service (:8082) |
:Consulta hotel_habitaciones.habitaciones;
:Retorna List<HabitacionDTO>;

|#dbeafe| Frontend (:3000) |
:Renderiza tabla con todas\nlas habitaciones;

|#e0f2fe| Administrador |
:Selecciona acción;

split
  -> Crear;
  |#e0f2fe| Administrador |
  :Completa modal:\nnúmero, tipo, precio/noche;

  |#dbeafe| Frontend (:3000) |
  :POST /api/habitaciones\n{numero, tipo, precioPorNoche};

  |#fef9c3| Habitaciones Service (:8082) |
  :Valida número único;
  if (¿Duplicado?) then (sí)
    :409 "Habitación ya existe";
  else (no)
    :INSERT en hotel_habitaciones\nestado inicial = DISPONIBLE;
    :Retorna 201 HabitacionDTO;
  endif

split again
  -> Editar;
  |#e0f2fe| Administrador |
  :Modifica número, tipo\no precio en modal;

  |#dbeafe| Frontend (:3000) |
  :PUT /api/habitaciones/{id}\n{numero, tipo, precioPorNoche};

  |#fef9c3| Habitaciones Service (:8082) |
  :UPDATE en hotel_habitaciones;
  :Retorna HabitacionDTO actualizado;

split again
  -> Cambiar Estado;
  |#e0f2fe| Administrador |
  :Selecciona nuevo estado:\nDISPONIBLE / MANTENIMIENTO / LIMPIEZA;
  note right
    El estado OCUPADA
    no puede asignarse
    manualmente desde aquí.
    Solo via Kafka (check-in).
  end note

  |#dbeafe| Frontend (:3000) |
  :PUT /api/habitaciones/{id}/estado\n{estado}\nHeader: X-User-Role: ADMINISTRADOR;

  |#fef9c3| Habitaciones Service (:8082) |
  :Valida transición de estado;
  :UPDATE estado en BD;
  :Retorna CambioEstadoResponseDTO\n{id, estado, fechaCambio};

split again
  -> Eliminar;
  |#e0f2fe| Administrador |
  :Confirma eliminación;

  |#dbeafe| Frontend (:3000) |
  :DELETE /api/habitaciones/{id};

  |#fef9c3| Habitaciones Service (:8082) |
  :DELETE en hotel_habitaciones;
  :Retorna 204 No Content;

end split

|#dbeafe| Frontend (:3000) |
:Actualiza tabla en pantalla;

stop

@enduml
```

---

## 5. Proceso: Gestión de Usuarios

**Servicios involucrados:** Frontend · Hotel Gateway · Administración Service · Supabase

```plantuml
@startuml bpmn_usuarios
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam SwimlaneBorderColor #1e3a5f

title BPMN — Gestión de Usuarios (Admin)

|#e0f2fe| Administrador |
start
:Accede a /admin/usuarios;

|#dbeafe| Frontend (:3000) |
:GET /api/admin/usuarios;

|#fef3c7| Hotel Gateway (:8080) |
:Valida JWT\nVerifica X-User-Role = ADMINISTRADOR;

|#e8f5e9| Administración Service (:8085) |
:Consulta hotel_auth.usuarios\n(lectura cross-schema);
:Retorna List<UsuarioDTO>;

|#dbeafe| Frontend (:3000) |
:Renderiza TablaUsuarios;

|#e0f2fe| Administrador |
:Selecciona acción;

split
  -> Crear usuario;
  |#e0f2fe| Administrador |
  :Completa ModalCrearUsuario:\nnombre, correo, contraseña, rol\n(ADMINISTRADOR / RECEPCIONISTA);

  |#dbeafe| Frontend (:3000) |
  :POST /api/admin/usuarios\n{nombre, correo, contrasena, rol};

  |#e8f5e9| Administración Service (:8085) |
  :Hashea contraseña con BCrypt;
  :INSERT en hotel_auth.usuarios\n(estado = ACTIVO);
  :Retorna 201 {id, nombre, correo, rol, estado};

split again
  -> Editar usuario;
  |#e0f2fe| Administrador |
  :Modifica nombre, correo\no rol en ModalEditarUsuario;

  |#dbeafe| Frontend (:3000) |
  :PUT /api/admin/usuarios/{id}\n{nombre, correo, rol};

  |#e8f5e9| Administración Service (:8085) |
  :UPDATE en hotel_auth.usuarios;
  :Retorna UsuarioDTO actualizado;

split again
  -> Desactivar usuario;
  |#e0f2fe| Administrador |
  :Confirma desactivación;
  note right
    No se elimina el registro.
    Se cambia estado a INACTIVO.
    Un usuario INACTIVO no puede
    hacer login en el sistema.
  end note

  |#dbeafe| Frontend (:3000) |
  :DELETE /api/admin/usuarios/{id};

  |#e8f5e9| Administración Service (:8085) |
  :UPDATE hotel_auth.usuarios\nSET estado = 'INACTIVO';
  :Retorna {message: "Usuario desactivado"};

end split

|#dbeafe| Frontend (:3000) |
:Recarga lista de usuarios;

stop

@enduml
```

---

## 6. Proceso: Generación de Reportes

**Servicios involucrados:** Frontend · Hotel Gateway · Administración Service · Supabase

```plantuml
@startuml bpmn_reportes
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam SwimlaneBorderColor #1e3a5f

title BPMN — Reportes de Ingresos y Ocupación (Admin)

|#e0f2fe| Administrador |
start
:Accede a /admin/reportes;

note right
  La ruta /admin/reportes
  redirige automáticamente
  a /admin/reportes/ingresos
end note

split
  -> Reporte de Ingresos;
  |#e0f2fe| Administrador |
  :Selecciona rango de fechas\n(fecha inicio – fecha fin);
  :Clic "Generar reporte";

  |#dbeafe| Frontend (:3000) |
  :GET /api/admin/reportes/ingresos\n?fechaInicio={date}&fechaFin={date};

  |#fef3c7| Hotel Gateway (:8080) |
  :Valida JWT\nVerifica rol ADMINISTRADOR;

  |#e8f5e9| Administración Service (:8085) |
  :Consulta hotel_pagos.boletas\nfiltradas por rango de fechas;
  :Agrupa por día;
  :Calcula:\n- totalIngresos\n- totalBaseImponible\n- totalIGV\n- cantidadBoletas\n- detallesPorDia[];
  :Retorna ReporteIngresosDTO;

  |#dbeafe| Frontend (:3000) |
  :Renderiza GraficoIngresos\n(gráfico de barras por día);

split again
  -> Reporte de Ocupación;
  |#e0f2fe| Administrador |
  :Accede a /admin/reportes/ocupacion;

  |#dbeafe| Frontend (:3000) |
  :GET /api/admin/reportes/ocupacion;

  |#fef3c7| Hotel Gateway (:8080) |
  :Valida JWT\nVerifica rol ADMINISTRADOR;

  |#e8f5e9| Administración Service (:8085) |
  :Consulta hotel_habitaciones.habitaciones\ny hotel_reservas.reservas;
  :Calcula tasaOcupacion = ocupadas/total;
  :Agrupa detallesPorTipo;
  :Retorna ReporteOcupacionDTO\n{totalHabitaciones, ocupadas, disponibles,\ntasaOcupacion, detallesPorTipo[]};

  |#dbeafe| Frontend (:3000) |
  :Renderiza TablaOcupacion;

split again
  -> Dashboard KPIs;
  note right
    Se carga automáticamente
    al entrar a /admin
    y se refresca cada 30s
  end note

  |#dbeafe| Frontend (:3000) |
  :GET /api/admin/reportes/dashboard\n(setInterval 30000ms);

  |#e8f5e9| Administración Service (:8085) |
  :Consulta múltiples schemas;
  :Retorna DashboardDTO:\n- ingresosMes\n- reservasMes\n- habitacionesDisponibles\n- habitacionesOcupadas\n- porcentajeOcupacion\n- usuariosActivos\n- boletasEmitidas\n- promedioDiario;

  |#dbeafe| Frontend (:3000) |
  :Actualiza 8 StatsCards;

end split

stop

@enduml
```

---

## 7. Proceso: Configuración de Parámetros

**Servicios involucrados:** Frontend · Hotel Gateway · Administración Service · Supabase

```plantuml
@startuml bpmn_parametros
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam SwimlaneBorderColor #1e3a5f

title BPMN — Configuración de Parámetros del Sistema (Admin)

|#e0f2fe| Administrador |
start
:Accede a /admin/parametros;

|#dbeafe| Frontend (:3000) |
:GET /api/admin/parametros;

|#fef3c7| Hotel Gateway (:8080) |
:Valida JWT\nVerifica rol ADMINISTRADOR;

|#e8f5e9| Administración Service (:8085) |
:Consulta hotel_administracion.parametros_globales;
:Retorna List<ParametroDTO>\n{clave, valor, updatedAt};

|#dbeafe| Frontend (:3000) |
:Renderiza ParametrosPage\ncon lista de parámetros editables;

|#e0f2fe| Administrador |
:Edita valor de un parámetro;

|#dbeafe| Frontend (:3000) |
:PUT /api/admin/parametros/{clave}\n{valor: "nuevo_valor"};

|#fef3c7| Hotel Gateway (:8080) |
:Valida JWT;

|#e8f5e9| Administración Service (:8085) |
if (¿Parámetro existe?) then (no)
  :404 "Parámetro no encontrado";
else (sí)
  :UPDATE parametros_globales\nSET valor = ? WHERE clave = ?;
  :Retorna {clave, valor,\nmessage: "Parámetro actualizado"};
endif

|#dbeafe| Frontend (:3000) |
:Toast confirmación\nActualiza valor en pantalla;

stop

@enduml
```

---

## 8. Mapa de Participación de Servicios

Resumen de qué servicio participa en cada proceso de negocio.

```plantuml
@startuml mapa_servicios
skinparam backgroundColor white
skinparam ArrowColor #1e3a5f
skinparam ClassBorderColor #1e3a5f
skinparam ClassBackgroundColor #f0f4ff

title Mapa de Participación — Servicios por Proceso

class "Autenticación\ny Sesión" as P1 << (P,#fef9c3) proceso >>
class "Check-in\nde Huésped" as P2 << (P,#fef9c3) proceso >>
class "Boleta\nPDF" as P3 << (P,#fef9c3) proceso >>
class "Gestión\nHabitaciones" as P4 << (P,#fef9c3) proceso >>
class "Gestión\nUsuarios" as P5 << (P,#fef9c3) proceso >>
class "Reportes" as P6 << (P,#fef9c3) proceso >>
class "Parámetros" as P7 << (P,#fef9c3) proceso >>

class "Hotel Gateway\n:8080" as GW << (S,#fde68a) servicio >>
class "Auth Service\n:8081" as AUTH << (S,#bbf7d0) servicio >>
class "Habitaciones\n:8082" as HAB << (S,#bbf7d0) servicio >>
class "Reservas\n:8083" as RES << (S,#bbf7d0) servicio >>
class "Pagos\n:8084" as PAG << (S,#fecaca) servicio >>
class "Administración\n:8085" as ADM << (S,#bbf7d0) servicio >>
class "Kafka :9092" as KAF << (I,#e9d5ff) infra >>
class "RENIEC API" as RENIEC << (E,#fed7aa) externo >>

P1 --> GW
P1 --> AUTH

P2 --> GW
P2 --> RES
P2 --> HAB : vía Kafka
P2 --> PAG : vía Kafka
P2 --> KAF
P2 --> RENIEC : solo si DNI

P3 --> GW
P3 --> PAG

P4 --> GW
P4 --> HAB

P5 --> GW
P5 --> ADM

P6 --> GW
P6 --> ADM

P7 --> GW
P7 --> ADM

@enduml
```
