import { z } from 'zod'

export const siembraRowSchema = z.object({
  Bloque: z.string().optional(),
  Nave: z.string(),
  Cama: z.string(),
  Color: z.string(),
  Variedad: z.string(),
  Producto: z.string().optional(),
  FechaSiembra: z.string().min(1),
  PlantasSembradas: z.preprocess((v) => Number(v || 0), z.number().int().nonnegative()),
  AreaM2: z.preprocess((v) => v ? Number(v) : null, z.number().positive().optional()),
  Estado: z.string().optional(),
}).refine((data) => data.Nave && data.Cama && data.Color && data.Variedad && data.FechaSiembra && data.PlantasSembradas != null, {
  message: 'Campos requeridos: Nave, Cama, Color, Variedad, FechaSiembra, PlantasSembradas'
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

