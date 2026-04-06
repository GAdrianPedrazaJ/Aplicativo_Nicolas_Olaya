-- Esquema inicial (esqueleto). Ajustar tipos y constraints según necesidades.

CREATE TABLE bloques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL
);

CREATE TABLE naves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloque_id uuid REFERENCES bloques(id) ON DELETE CASCADE,
  nombre text NOT NULL
);

CREATE TABLE camas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nave_id uuid REFERENCES naves(id) ON DELETE CASCADE,
  nombre text NOT NULL
);

CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL
);

CREATE TABLE variedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid REFERENCES productos(id),
  nombre text NOT NULL
);

CREATE TABLE siembras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cama_id uuid REFERENCES camas(id),
  variedad_id uuid REFERENCES variedades(id),
  fecha_siembra date NOT NULL,
  plantas_sembradas integer NOT NULL,
  estado text NOT NULL DEFAULT 'ACTIVO',
  usuario_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ciclos_produccion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siembra_id uuid REFERENCES siembras(id) ON DELETE CASCADE,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado text NOT NULL
);

CREATE TABLE causas_danos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL
);

CREATE TABLE registros_corte_diario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid REFERENCES ciclos_produccion(id) ON DELETE CASCADE,
  fecha_corte date NOT NULL,
  tallos_cortados integer NOT NULL,
  tallos_perdidos integer DEFAULT 0,
  causa_id uuid REFERENCES causas_danos(id),
  usuario_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE indices_semanales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana date NOT NULL,
  indice numeric,
  created_at timestamptz DEFAULT now()
);
