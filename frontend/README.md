# Frontend — Hotel BonAventura

Aplicación web SPA (Single Page Application) del sistema de gestión hotelera **Hotel BonAventura**. Construida con **React 19 + Vite** y servida en producción con **Nginx**. Permite a recepcionistas y administradores gestionar habitaciones, reservas, pagos y reportes desde una interfaz web.

---

## Función Principal

- Interfaz de usuario para el sistema Hotel BonAventura.
- **Dos roles diferenciados:**
  - **Recepcionista:** gestión de habitaciones, check-in, listado de reservas.
  - **Administrador:** todo lo anterior + usuarios, reportes de ingresos y ocupación, parámetros del sistema.
- Se comunica exclusivamente con el **Hotel Gateway** en `http://localhost:8080/api`.

---

## Puerto

| Entorno | Puerto |
|---------|--------|
| Docker (Nginx) | **3000** → interno 80 |
| Desarrollo local (Vite) | **5173** |

---

## Estructura de Carpetas

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/                         # Clientes HTTP por servicio
│   │   ├── axios.config.js          # Instancia Axios + interceptores
│   │   ├── auth.api.js              # POST /api/auth/login
│   │   ├── habitaciones.api.js      # CRUD habitaciones
│   │   ├── reservas.api.js          # Reservas + check-in
│   │   ├── pagos.api.js             # Pagos + boletas + PDF
│   │   └── admin.api.js             # Usuarios, parámetros, reportes
│   ├── store/                       # Estado global (Zustand)
│   │   ├── authStore.js             # Usuario autenticado + token
│   │   ├── habitacionesStore.js     # Lista y filtro de habitaciones
│   │   └── reservasStore.js         # Lista de reservas
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.js               # Login, logout, estado de auth
│   │   ├── useHabitaciones.js       # Carga y filtrado de habitaciones
│   │   └── useReservas.js           # Carga y gestión de reservas
│   ├── routes/
│   │   ├── AppRouter.jsx            # Definición de todas las rutas
│   │   └── ProtectedRoute.jsx       # Guarda de ruta por rol
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx        # Página de login
│   │   ├── recepcion/
│   │   │   ├── DashboardRecepcion.jsx
│   │   │   ├── HabitacionesPage.jsx # Lista de habitaciones con filtros
│   │   │   ├── CheckinPage.jsx      # Formulario de check-in
│   │   │   └── ReservasPage.jsx     # Tabla de reservas activas
│   │   └── admin/
│   │       ├── HomeAdmin.jsx        # Dashboard con KPIs
│   │       ├── UsuariosPage.jsx     # CRUD de usuarios del sistema
│   │       ├── HabitacionesAdminPage.jsx  # Gestión de habitaciones
│   │       ├── ReportesIngresosPage.jsx   # Gráfico de ingresos
│   │       ├── ReporteOcupacionPage.jsx   # Tabla de ocupación
│   │       └── ParametrosPage.jsx         # Parámetros del sistema
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx           # Shell: Navbar + Sidebar + Outlet
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── common/
│   │   │   ├── Button.jsx           # Botón reutilizable
│   │   │   ├── Input.jsx            # Input con label + error
│   │   │   ├── Modal.jsx            # Modal genérico
│   │   │   ├── Card.jsx
│   │   │   └── Loading.jsx          # Spinner de carga
│   │   ├── recepcion/
│   │   │   ├── HabitacionCard.jsx   # Tarjeta de habitación con estado
│   │   │   ├── FiltroEstados.jsx    # Filtros: DISPONIBLE / OCUPADA / TODOS
│   │   │   ├── ResumenReserva.jsx   # Detalle de reserva
│   │   │   ├── ConfirmacionModal.jsx
│   │   │   └── TablaReservas.jsx
│   │   └── admin/
│   │       ├── StatsCard.jsx        # KPI card (ingresos, ocupación...)
│   │       ├── TablaUsuarios.jsx
│   │       ├── TablaOcupacion.jsx
│   │       ├── ModalCrearUsuario.jsx
│   │       ├── ModalEditarUsuario.jsx
│   │       ├── ModalCrearHabitacion.jsx
│   │       ├── ModalEditarHabitacion.jsx
│   │       └── GraficoIngresos.jsx  # Gráfico de barras de ingresos
│   ├── utils/
│   │   ├── constants.js             # ROLES, ESTADOS_HABITACION, etc.
│   │   ├── formatters.js            # Formateo de fechas y montos
│   │   └── validators.js            # Funciones de validación
│   ├── assets/
│   │   └── hero.png
│   ├── App.jsx                      # Componente raíz
│   └── main.jsx                     # Entry point (ReactDOM.render)
├── nginx.conf                       # Config Nginx: SPA + proxy /api
├── Dockerfile                       # Build multi-stage Node → Nginx
├── vite.config.js                   # Configuración de Vite
└── package.json
```

---

## Cómo Está Construido

### Stack

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| React | 19.2.6 | Framework de componentes |
| Vite | 8.0.12 | Build tool y dev server (HMR) |
| Tailwind CSS | 4.3.0 | Estilos utility-first |
| Zustand | 5.0.13 | Estado global sin boilerplate |
| Axios | 1.16.1 | Cliente HTTP con interceptores |
| React Hook Form | 7.76.0 | Formularios eficientes |
| Yup | 1.7.1 | Schemas de validación |
| React Router DOM | 6.30.3 | Enrutamiento SPA |
| React Hot Toast | 2.6.0 | Notificaciones UI |
| Nginx | 1.27 | Servidor web en producción |

### Enrutamiento y Control de Acceso

```
/login                          (pública, sin autenticación)
│
/recepcion                      (protegida: RECEPCIONISTA + ADMINISTRADOR)
│   ├── index → HabitacionesPage
│   ├── checkin/:idHabitacion → CheckinPage
│   └── reservas → ReservasPage
│
/admin                          (protegida: solo ADMINISTRADOR)
    ├── index → HomeAdmin
    ├── usuarios
    ├── habitaciones
    ├── reportes/ingresos
    ├── reportes/ocupacion
    └── parametros
```

`ProtectedRoute.jsx` lee el rol del token JWT (almacenado en Zustand/localStorage) y redirige a `/login` si no está autenticado, o a `/recepcion` si un RECEPCIONISTA intenta acceder a `/admin`.

### Estado Global (Zustand)

```javascript
// authStore.js
{
  user: { email, nombre, rol },
  token: string,
  isAuthenticated: boolean,
  setUser(user),
  setToken(token),
  logout()       // limpia store + localStorage
}

// habitacionesStore.js
{
  habitaciones: Habitacion[],
  filtro: 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO' | 'TODOS',
  setHabitaciones(list),
  setFiltro(estado)
}
```

### Cliente HTTP (Axios)

```javascript
// axios.config.js
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
timeout: 10000

// Interceptor de request:
  config.headers.Authorization = `Bearer ${token}`

// Interceptor de response:
  error.response.status === 401 → redirige a /login
```

### Nginx en Producción (`nginx.conf`)

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  # SPA: todas las rutas sirven index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy para el API Gateway (cuando está en Docker)
  location /api {
    proxy_pass http://hotel-gateway:8080;
  }
}
```

### Dockerfile (Multi-stage)

```dockerfile
# Stage 1: compilar con Node 22
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci --silent
COPY . .
RUN npm run build          # genera /app/dist/

# Stage 2: servir con Nginx 1.27
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Diagrama de Comunicación

```
                         USUARIO (Navegador)
                               │
                               │  http://localhost:3000
                               ▼
┌──────────────────────────────────────────────────────────┐
│                 FRONTEND (React SPA)                      │
│                                                          │
│  LoginPage  ──────────────────────────────────────────┐ │
│                   authStore (Zustand)                  │ │
│                         │                             │ │
│  HabitacionesPage        │ token                      │ │
│  CheckinPage     ────────┼──── Axios ──────────────── │ │
│  ReservasPage            │    (interceptor: JWT)      │ │
│  Páginas Admin   ────────┘                            │ │
│                                                       │ │
│  nginx.conf: proxy /api → hotel-gateway:8080 (Docker) │ │
└──────────────────────────────────────────────────────────┘
                               │
                               │  HTTP REST (con Bearer token)
                               ▼
                   HOTEL GATEWAY :8080
                    (valida JWT, enruta)
                               │
              ┌────────────────┼───────────────┐
              ▼                ▼               ▼
        Auth :8081    Habitaciones :8082   Reservas :8083
                      Pagos :8084         Admin :8085
```

---

## Cómo Ejecutar

### Con Docker (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up --build
# Acceder en http://localhost:3000
```

### Desarrollo local

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

Para desarrollo local, crear `frontend/.env`:
```
VITE_API_URL=http://localhost:8080/api
```

### Build de producción

```bash
npm run build   # genera dist/
npm run preview # previsualiza el build
```

---

## Variables de Entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `VITE_API_URL` | URL base del API Gateway | `http://localhost:8080/api` |
