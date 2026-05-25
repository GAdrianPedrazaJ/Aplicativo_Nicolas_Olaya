# 🌱 AgroTech - Sistema de Gestión de Invernaderos

AgroTech es una plataforma empresarial avanzada para la gestión técnica, control de producción y analítica de datos en entornos agrícolas de alto rendimiento. Optimizada para la toma de decisiones basada en datos, permite el control total desde la siembra hasta la cosecha.

## 🚀 Versión Actual: 2.3 - Arquitectura Global Unificada

### 📊 1. Centro de Analítica Avanzada (Módulos Unificados)
El sistema ofrece una experiencia idéntica a los reportes de **Power BI**, facilitando la adopción por parte de los usuarios acostumbrados a **Verdad Única**.
- **Navegación de Reporte:** Sistema de pestañas inferiores (Bottom Tabs) para conmutar entre las 10 páginas de inteligencia de datos sin pérdida de contexto.
- **Productividad CPC (Sábana de Datos):** Integración total de la "Sábana CPC" con filtros dinámicos (Slicers) horizontales, visualización de productividad por supervisor y mini-dashboards.
- **Visualizaciones de Alto Impacto:** Gráficos de tendencias, curvas de ciclo de vida y análisis fitosanitarios (Daños Astronova).

### 🧭 2. Navegación Superior y UX
- **Global Top Navbar:** Se ha reemplazado la barra lateral por una navegación superior horizontal que maximiza el espacio de trabajo para los datos.
- **Menús Inteligentes:** Acceso centralizado a través de menús desplegables para la gestión de **Siembras** (Carga Masiva e Históricos).
- **Layout de Ancho Completo:** Diseño optimizado para visualizar grandes volúmenes de datos técnicos y tablas comparativas de alta densidad.

### 🗺️ 3. Gestión Técnica y Operativa
- **Carga Masiva de Planos:** Motor de normalización dinámica para la ingesta de archivos Excel/CSV.
- **Sincronización de Históricos:** Módulo especializado para la carga de registros de corte y producción diaria.
- **Validación Robusta:** Esquemas de validación con Zod para asegurar la integridad técnica en cada carga.

### 🎨 4. Identidad Visual GHT
- **Paleta Corporativa:** Uso estricto de **Verde Cerceta (#005d5d)** y **Naranja (#f5a623)** para diferenciar datos objetivos de reales.
- **Headers de Reporte:** Cabeceras minimalistas que siguen el estándar de la industria (Verdad Única).

## 🛠️ Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite.
- **Estado:** Zustand con persistencia local.
- **Visualización:** Recharts (High-performance charts).
- **Estilos:** Tailwind CSS con componentes personalizados.
- **Backend:** Supabase (PostgreSQL + Real-time sync).

## 📂 Estructura de Navegación
- `Inteligencia de Datos`: Dashboard de control general.
- `Centro de Analítica`: Suite de reportes de productividad.
- `Siembras`: 
    - `Cargar Siembras`: Subida de planos técnicos.
    - `Carga de Históricos`: Importación de data de producción.
- `Usuarios`: Gestión de perfiles y roles.
- `Configuración`: Ajustes globales y cuenta.

---
*Nota: Este sistema garantiza que todas las áreas operativas trabajen sobre una "Sola Fuente de Verdad", eliminando silos de información.*
