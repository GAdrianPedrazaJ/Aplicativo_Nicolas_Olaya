export type Bloque = { id: string; nombre: string }
export type Nave = { id: string; nombre: string; bloque_id: string }
export type Cama = { id: string; nombre: string; nave_id: string }
export type Variedad = { id: string; nombre: string }
export type Siembra = { id: string; cama_id: string; variedad_id: string; fecha_siembra: string; cantidad: number }
