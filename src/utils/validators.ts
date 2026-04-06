import { z } from 'zod'

export const siembraRowSchema = z.object({
  Bloque: z.string().optional(),
  Lado: z.string().optional(),
  Nave: z.string(),
  Cama: z.string(),
  Variedad: z.string(),
  'Fecha de siembra': z.union([z.string(), z.number()]).pipe(z.coerce.date()).transform((d) => d.toISOString().split('T')[0]),
  'Plantas sembradas': z.preprocess((v) => Number(v || 0), z.number().int().min(0)),
  'Área (m2)': z.preprocess((v) => v ? Number(v) : null, z.number().optional()),
}).refine((data) => data.Nave && data.Cama && data.Variedad && data['Fecha de siembra'] && data['Plantas sembradas'] != null, {
  message: 'Campos requeridos: Nave, Cama, Variedad, Fecha de siembra, Plantas sembradas'
})

export type SiembraRow = z.infer<typeof siembraRowSchema>

export const historicoRowSchema = z.object({
  Ciclo: z.string().optional(),
  FechaCorte: z.string(),
  TallosCortados: z.preprocess((v) => Number(v), z.number().int().nonnegative()),
  TallosPerdidos: z.preprocess((v) => Number(v), z.number().int().nonnegative().optional()),
  Causa: z.string().optional(),
})

export type HistoricoRow = z.infer<typeof historicoRowSchema>

