RDC Tandil SAS — Backend

Pequeño servidor Express que expone un endpoint `POST /planos` para insertar planos de siembra en Supabase usando la Service Role key.

Setup

1. Ir a `server/` y correr `npm install`.
2. Copiar `../.env.example` a `.env` y rellenar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. `npm run dev` para desarrollo o `npm start` para producción.

Endpoint

- `POST /planos` — body: arreglo de filas con campos: `Bloque`, `Nave`, `Cama`, `AreaM2` (opcional), `Producto`, `Color`, `Variedad`, `FechaSiembra`, `PlantasSembradas`, `Estado`.
