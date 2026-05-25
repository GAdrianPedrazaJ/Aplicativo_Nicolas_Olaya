# AgroTech - Documentación de la aplicación

## 1. Resumen general

Esta aplicación es una plataforma React + TypeScript para la gestión y análisis de datos agrícolas, con un backend ligero en Express y almacenamiento en Supabase.

Su objetivo principal es:
- administrar la carga masiva de planos de siembra
- sincronizar históricos de producción
- controlar permisos de usuarios y roles
- mostrar reportes analíticos

---

## 2. Stack tecnológico

- Frontend: React 18, TypeScript, Vite
- Estado: Zustand
- UI: Tailwind CSS, lucide-react
- Gráficos: Recharts
- Backend/API: Express
- Base de datos: Supabase (PostgreSQL)
- Parser de archivos: xlsx, papaparse
- Validaciones: Zod

---

## 3. Estructura de carpetas

### raíz del proyecto

- `Dockerfile` - contenedor de la aplicación
- `index.html` - plantilla HTML para Vite
- `package.json` - dependencias y scripts
- `tsconfig.json` - configuración de TypeScript
- `vite.config.ts` - configuración del bundler Vite
- `README.md` - README general existente
- `README_APP.md` - este README de estructura y funcionamiento
- `SETUP_LOCAL.md` - instrucciones de entorno local
- `TODO.md` - tareas pendientes

### `src/`

El frontend principal de la aplicación.

- `App.tsx` - enrutamiento principal con `react-router-dom` y protección de rutas
- `main.tsx` - arranca React + Vite
- `index.css` - estilos globales base
- `vite-env.d.ts` - tipos de entorno para Vite

#### `src/components/`

Componentes UI reutilizables y layout:
- `ProtectedRoute.tsx` - controla acceso por autenticación y roles
- `Sidebar.tsx` - menú lateral de navegación
- `shared/` - botones, inputs, layouts, tarjetas de módulo, NavBar
- `upload/` - componentes especializados para carga de archivos y preview de datos:
  - `FileUploader.tsx`
  - `DataPreviewTable.tsx`
  - `ValidationResults.tsx`
  - `BulkRetryModal.tsx`

#### `src/hooks/`

Lógica React personalizada y recuperación de datos:
- `useAuth.ts` - hooks de autenticación (si existen)
- `useWithUser.ts` - hook decorador con usuario
- `useSupabase.ts` - devuelve el cliente Supabase común
- `useSiembras.ts` - cargas, consultas y eliminaciones de siembras
- `useHistoricos.ts` - carga de históricos de producción
- `usePermission.ts` - permisos basados en roles
- `useAnalytics.ts` - métrica o telemetría personalizada

#### `src/pages/`

Vistas principales de la aplicación:
- `Login.tsx` - inicio de sesión
- `Dashboard.tsx` - vista principal de control
- `Reportes.tsx` - reportes y analítica
- `Usuarios.tsx` - gestión de usuarios
- `Configuracion.tsx` - sección de ajustes
- `CargaHistoricos.tsx` - carga masiva de históricos
- `pages/siembras/` - gestión de siembras:
  - `CargaSiembras.tsx`
  - `ListaSiembras.tsx`
  - `EliminarSiembras.tsx`
- `pages/analytics/` - pestañas analíticas especializadas
- `pages/cosechas/` - vista de cosechas
- `pages/reportes/` - reportes analíticos y generales
- `pages/usuarios/` - listado y edición de usuarios

#### `src/config/`

- `routes.ts` - definición de rutas del menú y subrutas con íconos y roles necesarios

#### `src/constants/`

- `roles.ts` - definición de roles de usuario y permisos asociados

#### `src/services/`

- `supabase.ts` - inicialización del cliente Supabase compartido
- `analyticsService.ts` - llamadas a métricas o datos analíticos
- `authService.ts` - servicios de autenticación
- `dataService.ts` - servicios genéricos de datos
- `excelParser.ts` - parseo de archivos Excel/CSV
- `statsService.ts` - servicio de estadísticas

#### `src/store/`

Estado global con Zustand:
- `useAuthStore.ts` - almacena usuario, sesión y auth persistida
- `useUploadStore.ts` - controla estado de subida y progreso de archivos

#### `src/utils/`

Helpers comunes:
- `dateHelpers.ts` - utilidades de fechas
- `validators.ts` - validadores adicionales

#### `src/styles/`

- `dashboard.css` - estilos específicos de dashboard

### `server/`

Backend ligero en Express para la validación y procesamiento de archivos.

- `index.js` - servidor principal con rutas API y lógica de validación
- `last_import_audit.json` - auditoría de últimas importaciones
- `package.json` - dependencias backend
- `scripts/` - utilidades de servidor:
  - `dedupe_entities.js`
  - `sql_constraints.sql`

### `sql/`

- `schema.sql` - esquema de base de datos y estructura de tablas

### `scripts/`

- `reproduce_upload.js` - script de reproducción de cargas o tests de subida

---

## 4. Flujo de funcionamiento

### 4.1 Autenticación y permisos

- `src/store/useAuthStore.ts` guarda el usuario y bandera `isAuthenticated` en `localStorage`.
- `src/components/ProtectedRoute.tsx` bloquea rutas cuando el usuario no está autenticado.
- Los roles soportados son: `SUPERADMIN`, `ADMIN`, `MONITOR` y `OPERARIO`.
- Algunas rutas solo están disponibles según rol, por ejemplo:
  - `/usuarios` -> solo `SUPERADMIN`
  - `/siembras/cargar` -> `ADMIN` y `SUPERADMIN`
  - `/siembras/historicos` -> `ADMIN`, `MONITOR`, `SUPERADMIN`

### 4.2 Enrutamiento principal

- `src/App.tsx` define las rutas principales con `react-router-dom`.
- Rutas clave:
  - `/login`
  - `/dashboard`
  - `/siembras/lista`
  - `/siembras/cargar`
  - `/siembras/eliminar`
  - `/siembras/historicos`
  - `/reportes`
  - `/usuarios`
  - `/configuracion`

### 4.3 Carga masiva de siembras

- Página: `src/pages/siembras/CargaSiembras.tsx`
- Usa `Sidebar`, `FileUploader` y `DataPreviewTable`.
- El hook `useSiembras.ts` realiza:
  - `fetchSiembras()` -> consulta tabla `siembras` en Supabase con relaciones anidadas
  - `uploadData(rows)` -> envía filas normalizadas a `/planos` del backend
  - `deleteSiembras(ids)` -> elimina registros directamente en Supabase
  - `deleteSiembrasByFile(rows)` -> envía archivo al backend para eliminar según criterios

- El backend Express valida cada fila con Zod y normaliza columnas basadas en nombres flexibles.
- La API backend utiliza la `SUPABASE_SERVICE_ROLE_KEY` para insertar/actualizar datos con permisos de servicio.

### 4.4 Carga de históricos

- Página: `src/pages/CargaHistoricos.tsx`
- Usa `useHistoricos.ts` para procesar Excel/CSV con producción histórica.
- El flujo es este:
  1. El usuario sube un archivo mediante `FileUploader`
  2. El frontend transforma el archivo en filas JSON
  3. Se envía el payload a la API backend
  4. El backend valida, procesa y persiste en Supabase

### 4.5 Consumo de Supabase

- `src/services/supabase.ts` crea el cliente con:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- `src/hooks/useSupabase.ts` exporta el cliente para usarlo en hooks como `useSiembras`.
- Las consultas incluyen selects profundos para traer relaciones anidadas de `camas`, `naves`, `bloques`, `variedades`, `colores` y `productos`.

---

## 5. Variables de entorno importantes

### Frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_URL` (por ejemplo `http://localhost:4000`)

### Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (opcional, por defecto `4000`)

---

## 6. Cómo ejecutar la aplicación

### Instalación

```bash
npm install
cd server
npm install
```

### Desarrollo frontend

```bash
npm run dev
```

### Backend local

```bash
cd server
node index.js
```

### Vista de producción local

```bash
npm run build
npm run preview
```

---

## 7. Puntos clave del diseño

- Centralización de permisos basada en roles con `ProtectedRoute`
- Carga de datos escalable por archivos Excel/CSV
- Separación frontend/backend para validación de negocio y normalización
- Uso de Supabase como backend de datos y autenticación
- UI modular basada en componentes compartidos y layout responsive

---

## 8. Recomendaciones de mantenimiento

- Mantener `src/config/routes.ts` sincronizado con las páginas y permisos.
- Revisar `server/index.js` si se añaden nuevas columnas de `planos`.
- Actualizar `src/hooks/useSiembras.ts` cuando la estructura de la tabla `siembras` cambie.
- Centralizar nuevas utilidades en `src/utils/`.
- Agregar tests de integración para el backend Express si se amplía la lógica de importación.
