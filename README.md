# Proyecto-Hotel: Hotel BonAventura

Este es el sistema de gestión del **Hotel BonAventura**, estructurado en una arquitectura de microservicios utilizando Spring Boot (Java), FastAPI (Python), Kafka para la comunicación orientada a eventos y un frontend desarrollado en React (Vite).

---

## 🛠️ Requisitos Previos

Antes de levantar el proyecto, asegúrate de tener instalado:
*   [Docker](https://www.docker.com/products/docker-desktop/) y **Docker Compose**
*   [Node.js](https://nodejs.org/) (si deseas correr el frontend de forma local sin Docker)
*   [Java 17/21](https://adoptium.net/) y **Maven** (si deseas correr el backend de forma local sin Docker)

---

## ⚙️ Configuración de Variables de Entorno

Tanto en Docker como localmente, el backend requiere variables de entorno para conectarse a la base de datos (PostgreSQL/Supabase) y configurar la seguridad.

1. Navega al directorio `hotel-bonaventura/`.
2. Copia el archivo de plantilla `.env.template` y renómbralo a `.env`:
   ```bash
   cp hotel-bonaventura/.env.template hotel-bonaventura/.env
   ```
3. Edita `hotel-bonaventura/.env` con tus credenciales reales (por ejemplo, el host, usuario y contraseña de tu base de datos de Supabase, claves secretas para JWT, etc.).

---

## 🚀 Cómo Levantar el Proyecto (Método Recomendado: Docker Compose)

Docker Compose levantará automáticamente Kafka, todos los microservicios backend y el frontend de React.

1. Abre tu terminal en la raíz del proyecto.
2. Levanta los contenedores compilándolos desde cero:
   ```bash
   docker compose up --build
   ```
3. Espera a que todos los contenedores pasen el control de salud (`healthcheck`). El Gateway y el Frontend dependen de que los servicios internos estén saludables para iniciar.
4. **Acceso al Sistema**:
   *   **Frontend**: Accede a [http://localhost:3000](http://localhost:3000) en tu navegador.
   *   **API Gateway**: Expuesto en [http://localhost:8080](http://localhost:8080).

---

## 🖥️ Levantamiento para Desarrollo (Modo Local)

Si prefieres correr y depurar los servicios individualmente de forma local:

### 1. Iniciar Kafka e Infraestructura
Puedes usar Docker solo para levantar Kafka y no compilar todo:
```bash
docker compose up kafka-container -d
```

### 2. Levantar el Backend (Spring Boot & Python)
Asegúrate de tener cargadas las variables del archivo `hotel-bonaventura/.env` en tu entorno o en tu IDE (IntelliJ / VS Code).

*   **Servicios Java (Auth, Habitaciones, Reservas, Administracion, Gateway)**:
    Ingresa al subdirectorio correspondiente en `hotel-bonaventura/` y ejecuta:
    ```bash
    ./mvnw spring-boot:run
    ```
*   **Servicio de Pagos (Python/FastAPI)**:
    Ingresa a `hotel-bonaventura/pagos-service/`:
    1. Crea un entorno virtual: `python -m venv venv`
    2. Actívalo:
       * Windows: `venv\Scripts\activate`
       * Linux/macOS: `source venv/bin/activate`
    3. Instala dependencias: `pip install -r requirements.txt`
    4. Ejecuta: `uvicorn main:app --host 0.0.0.0 --port 8084`

### 3. Levantar el Frontend (React + Vite)
1. Navega al directorio `/frontend`.
2. Crea el archivo de variables de entorno `/frontend/.env` si es necesario configurar la URL del gateway (por defecto apunta a `http://localhost:8080`).
3. Instala las dependencias y corre el servidor de desarrollo:
   ```bash
   npm install
   npm run dev
   ```
4. El frontend estará disponible localmente en [http://localhost:5173](http://localhost:5173) (o el puerto indicado por Vite).

---

## 🗺️ Mapa de Puertos y Servicios

| Servicio | Puerto | Descripción |
| :--- | :--- | :--- |
| **Frontend** | `3000` (Docker) / `5173` (Local) | Interfaz web de usuario |
| **Hotel Gateway** | `8080` | Punto de entrada único para la API REST |
| **Auth Service** | `8081` | Registro, autenticación y generación de JWT |
| **Habitaciones Service** | `8082` | Gestión y estados de las habitaciones |
| **Reservas Service** | `8083` | Creación y confirmación de reservas (RENIEC integration) |
| **Pagos Service** | `8084` | Generador de boletas e integración con Kafka |
| **Administracion Service** | `8085` | Panel administrativo y reportería financiera |
| **Apache Kafka** | `9092` | Broker de mensajería asíncrona para eventos |
