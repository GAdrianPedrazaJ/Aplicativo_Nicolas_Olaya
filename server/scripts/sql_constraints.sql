-- SQL constraints to enforce uniqueness (run AFTER deduplication)
-- 1) productos: unique on normalized name
CREATE UNIQUE INDEX IF NOT EXISTS productos_nombre_norm_unique ON productos ((lower(trim(nombre))));

-- 2) colores: unique per product on normalized color name
CREATE UNIQUE INDEX IF NOT EXISTS colores_producto_nombre_norm_unique ON colores (id_producto, (lower(trim(nombre))));

-- 3) variedades: unique per color on normalized variedad name
CREATE UNIQUE INDEX IF NOT EXISTS variedades_color_nombre_norm_unique ON variedades (id_color, (lower(trim(nombre))));

-- Notes:
--  - Run the deduplication script first to merge existing duplicates.
--  - Creating these indexes will make future inserts fail when a duplicate (case/space-insensitive) is attempted.
--  - Adjust index names if your schema uses different column names.
