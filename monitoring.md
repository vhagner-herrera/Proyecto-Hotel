# Monitoreo de APIs y Gestión Centralizada de Logs — Hotel BonAventura

Este documento describe la arquitectura, integración, configuración, flujo de datos y uso detallado del stack de **Observabilidad, Monitoreo de APIs y Auditoría de Logs** (Prometheus, Loki, Promtail y Grafana) implementado para el sistema de microservicios de Hotel BonAventura.

---

## 1. Visión General de la Arquitectura de Observabilidad

El stack se ejecuta de forma totalmente contenerizada dentro de la red privada `hotel-net` de Docker:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            RED DOCKER: hotel-net                             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     MICROSERVICIOS DEL SISTEMA                         │  │
│  │ (auth-service, habitaciones-service, reservas-service, pagos-service,  │  │
│  │               administracion-service, hotel-gateway)                   │  │
│  └───────────────────┬────────────────────────────────┬───────────────────┘  │
│                      │                                │                      │
│        Exponen /actuator/prometheus           Escriben logs a stdout         │
│                      │                                │                      │
│                      ▼                                ▼                      │
│             ┌────────────────┐               ┌────────────────┐              │
│             │   PROMETHEUS   │               │    PROMTAIL    │              │
│             │  (Puerto 9090) │               │(Docker Log Scraper)           │
│             └───────┬────────┘               └───────┬────────┘              │
│                     │                                │                       │
│                     │ Recolecta métricas             │ Envía logs            │
│                     │                                ▼                       │
│                     │                        ┌────────────────┐              │
│                     │                        │      LOKI      │              │
│                     │                        │  (Puerto 3100) │              │
│                     │                        └───────┬────────┘              │
│                     │                                │                       │
│                     └────────────────┬───────────────┘                       │
│                                      ▼                                       │
│                           ┌────────────────────┐                             │
│                           │      GRAFANA       │ (Puerto 3001)                 │
│                           │ UI Métricas + Logs │                             │
│                           └────────────────────┘                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Puertos y Credenciales de Acceso

| Servicio | URL de Acceso | Usuario | Contraseña | Descripción |
|---|---|---|---|---|
| **Grafana** | `http://localhost:3001` | `admin` | `admin` | **Interfaz gráfica unificada** para visualizar métricas y auditar logs. |
| **Prometheus** | `http://localhost:9090` | — | — | Servidor de recolección de métricas de APIs y estado de salud. |
| **Loki** | `http://localhost:3100` | — | — | Motor de base de datos e indexación centralizada de logs. |

---

## 3. Explicación Detallada: Gestión Centralizada de Logs (Loki + Promtail)

### ¿Cómo funciona la recolección y auditoría de logs?

En una arquitectura de microservicios, consultar los archivos de registro entrando a cada contenedor individualmente es ineficiente y propenso a errores. La **Gestión Centralizada de Logs** resuelve esto agregando todos los mensajes emitidos por cada servicio en un único almacén searchable.

1. **Emisión de Logs (stdout / stderr)**:
   * Cada microservicio en Java (Spring Boot) o Python (FastAPI) emite eventos de registro utilizando librerías estándar (SLF4J, Logback, Python logging).
   * Los contenedores de Docker capturan estos mensajes en la salida estándar de la consola (`stdout`).

2. **Captura y Etiquetado por Promtail**:
   * **Promtail** se conecta directamente al socket de la API de Docker (`/var/run/docker.sock`).
   * Detecta automáticamente la creación y ejecución de contenedores y añade etiquetas a cada línea de log, tales como:
     * `container`: Nombre del contenedor (ej. `auth-service`, `reservas-service`).
     * `service`: Nombre del servicio asociado.
   * Envía los flujos de texto comprimidos mediante HTTP/gRPC al puerto `3100` de **Loki**.

3. **Almacenamiento Eficiente en Loki**:
   * A diferencia de sistemas pesados como Elasticsearch que indexan todo el texto de los logs, **Loki indexa únicamente las etiquetas** (`metadata`).
   * Esto reduce drásticamente el consumo de memoria RAM y espacio en disco (menos de 100MB de consumo).

4. **Auditoría e Interacción entre Servicios**:
   * Cuando se realiza una operación crítica (ej. una reserva de habitación o cobro de boleta), el **API Gateway** propaga el correo del usuario (`X-User-Email`) y su rol (`X-User-Role`).
   * Todos los logs generados en la cadena de llamadas quedan asociados al timestamp exacto, permitiendo rastrear el flujo de una petición a través de múltiples microservicios (Auth ➔ Gateway ➔ Reservas ➔ Kafka ➔ Pagos).

---

## 4. Explicación Detallada: Monitoreo de APIs en Tiempo Real (Prometheus)

### ¿Cómo funciona el monitoreo de métricas?

El monitoreo de servicios se basa en el modelo **Pull (Scraping)**: Prometheus no espera a que los servicios le envíen datos, sino que consulta periódicamente a cada API para obtener su estado actual.

1. **Exposición de Endpoints de Métricas**:
   * **Spring Boot**: La librería `micrometer-registry-prometheus` junto con `actuator` formatea los datos internos de la JVM y de Spring MVC en el formato estándar OpenMetrics en la URL `/actuator/prometheus`.
   * **FastAPI (Pagos)**: La librería `prometheus-client` genera el listado de métricas en la ruta `/actuator/prometheus` (o `/metrics`).

2. **Scraping Periódico (15 segundos)**:
   * Cada 15 segundos (`scrape_interval: 15s`), **Prometheus** realiza peticiones HTTP GET a cada uno de los microservicios:
     * `http://auth-service:8081/actuator/prometheus`
     * `http://habitaciones-service:8082/actuator/prometheus`
     * `http://reservas-service:8083/actuator/prometheus`
     * `http://pagos-service:8084/actuator/prometheus`
     * `http://administracion-service:8085/actuator/prometheus`
     * `http://hotel-gateway:8080/actuator/prometheus`

3. **Tipos de Métricas Recolectadas**:
   * **Contadores (Counters)**: Valores que solo se incrementan, como el número total de peticiones atendidas (`http_server_requests_seconds_count`) o excepciones lanzadas.
   * **Gauges**: Mediciones instantáneas que suben y bajan, como el uso de memoria RAM de la JVM (`jvm_memory_used_bytes`), conexiones a la base de datos Supabase o consumo de CPU (`process_cpu_usage`).
   * **Histogramas / Timers**: Miden la latencia y tiempo de respuesta de cada endpoint HTTP de la API (`http_server_requests_seconds_sum / http_server_requests_seconds_count`).

---

## 5. Integración en el Código Fuente

### A. Backend Java (Spring Boot)
Aplicado a: `auth-service`, `habitaciones-service`, `reservas-service`, `administracion-service` y `hotel-gateway`.

* **Dependencia en `pom.xml`**:
  ```xml
  <dependency>
      <groupId>io.micrometer</groupId>
      <artifactId>micrometer-registry-prometheus</artifactId>
  </dependency>
  ```
* **Configuración en `application.yml`**:
  ```yaml
  management:
    endpoints:
      web:
        exposure:
          include: health, info, prometheus
    metrics:
      tags:
        application: ${spring.application.name}
  ```

### B. Backend Python (FastAPI — Pagos Service)
Aplicado a: `pagos-service`.

* **Dependencia en `requirements.txt`**:
  ```
  prometheus-client==0.19.0
  ```
* **Endpoint expuesto en `main.py`**:
  ```python
  from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

  @app.get("/actuator/prometheus")
  @app.get("/metrics")
  def metrics():
      return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
  ```

---

## 6. Archivos de Infraestructura (`/monitoring`)

Toda la configuración de monitoreo se encuentra en `./monitoring`:

* **`monitoring/prometheus/prometheus.yml`**: Define las tareas de scraping e intervalos hacia los 6 microservicios.
* **`monitoring/loki/loki-config.yml`**: Define los puertos (3100), esquemas de almacenamiento y retención de logs.
* **`monitoring/promtail/promtail-config.yml`**: Mapea las etiquetas de los contenedores Docker hacia Loki.
* **`monitoring/grafana/provisioning/datasources/datasources.yml`**: Registra automáticamente las fuentes de datos (Prometheus y Loki) en Grafana.

---

## 7. Guía Práctica de Uso en Grafana

### A. Auditoría de Logs (Loki)
1. Entra a `http://localhost:3001` (Usuario: `admin`, Contraseña: `admin`).
2. Ve a **Explore** (`http://localhost:3001/explore`).
3. Selecciona la fuente **Loki**.
4. Consultas LogQL útiles:

```logql
# Ver logs de Auth Service
{container="auth-service"}

# Ver logs del Servicio de Reservas
{container="reservas-service"}

# Buscar la palabra ERROR o Exception en cualquier servicio
{container=~".+"} |= "ERROR"

# Filtrar logins por correo específico
{container="auth-service"} |= "admin@bonaventura.com"
```

* **Live Tailing**: Pulsa el botón **`Live`** en la esquina superior derecha para ver los logs apareciendo en pantalla en tiempo real mientras realizas acciones en la aplicación web.

### B. Monitoreo de Rendimiento de APIs (Prometheus)
1. En **Explore**, selecciona la fuente **Prometheus**.
2. Consultas PromQL útiles:

```promql
# Peticiones HTTP totales atendidas por cada microservicio
http_server_requests_seconds_count

# Tasa de peticiones por segundo (Req/sec)
rate(http_server_requests_seconds_count[1m])

# Latencia media de respuestas HTTP
rate(http_server_requests_seconds_sum[1m]) / rate(http_server_requests_seconds_count[1m])

# Uso de memoria RAM JVM de los servicios Java (en bytes)
jvm_memory_used_bytes

# Porcentaje de CPU usado por cada microservicio
process_cpu_usage
```

---

## 8. Cómo Ejecutar

Para desplegar o actualizar el sistema completo con monitoreo y logs activos:

```bash
docker compose up -d --build
```
