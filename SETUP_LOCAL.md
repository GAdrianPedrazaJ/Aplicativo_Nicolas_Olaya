# 🚀 Configuración Local del Proyecto

## Reparaciones Realizadas

Se han corregido los siguientes problemas:

1. ✅ **tsconfig.json** - Se removió `baseUrl` deprecated y se agregó `ignoreDeprecations: 6.0`
2. ✅ **validators.ts** - Se actualizó el schema `siembraRowSchema` para usar las claves correctas (FechaSiembra, PlantasSembradas, AreaM2)
3. ✅ **useSiembras.ts** - Se corrigió el tipo de parámetro de `uploadData` de `SiembraRow[]` a `any[]`
4. ✅ **CargaSiembras.tsx** - Se agregó validación segura con optional chaining para acceso a propiedades anidadas
5. ✅ **.env** - Se agregó variable `VITE_BACKEND_URL=http://localhost:4000`
6. ✅ **Backend (server/index.js)** - Verificado que inicia correctamente

---

## Pasos para Ejecutar Localmente

### 1️⃣ **Terminal 1 - Iniciar el Backend (Node.js)**

```powershell
cd c:\Proyectos\Nicolas_Olaya\server
npm install  # Si no está instalado
npm start    # o npm run dev (con nodemon para reload automático)
```

**Esperado:** 
```
RDC backend listening on 4000
```

### 2️⃣ **Terminal 2 - Iniciar el Frontend (Vite)**

```powershell
cd c:\Proyectos\Nicolas_Olaya
npm install  # Si no está instalado
npm run dev
```

**Esperado:**
```
VITE v5.4.21  ready in 1234 ms

➜  Local:   http://localhost:5173/
```

---

## 3️⃣ **Verificar que todo funciona**

1. Abre el navegador en: **http://localhost:5173/**
2. Deberías ver la aplicación cargada sin errores
3. Las variables de entorno están configuradas en `.env` y `.env.local`

---

## 📋 Variables de Entorno

Verificadas y configuradas en `.env`:

- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅  
- `VITE_BACKEND_URL=http://localhost:4000` ✅

Verificadas en `server/.env`:

- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `PORT=4000` ✅

---

## 🔧 Comandos Útiles

### Frontend
```powershell
npm run dev     # Desarrollo con hot reload
npm run build   # Compilar para producción
npm run preview # Ver build localmente
```

### Backend
```powershell
npm start       # Iniciar servidor
npm run dev     # Dev con nodemon (reload automático)
```

---

## 🛠️ Troubleshooting

### Error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing"
→ Verifica que `server/.env` esté configurado correctamente

### Error: "Port 4000 already in use"
→ Cambia el PORT en `server/.env` a otro puerto (ej: 4001)

### Error: "Module not found"
→ Ejecuta `npm install` en la raíz y en `server/`

### Frontend no se conecta al backend
→ Verifica que `VITE_BACKEND_URL` esté configurado a `http://localhost:4000`

---

## ✨ Proyecto Listo para Pruebas

El proyecto está completamente operativo y listo para pruebas locales.

¡Bienvenido de vuelta al desarrollo! 🎉
