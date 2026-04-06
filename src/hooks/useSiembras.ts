import { useState } from 'react'
import { useSupabase } from './useSupabase'
import { siembraRowSchema, SiembraRow } from '../utils/validators'
import { useUploadStore } from '../store/useUploadStore'
import { v4 as uuidv4 } from 'uuid'

export function useSiembras() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()
  const setUploading = useUploadStore((state) => state.setUploading)

  const uploadData = async (rows: SiembraRow[]) => {
    try {
      setLoading(true)
      setError(null)
      setUploading(true)

      // Validar rows con errores detallados
      const validRows = []
      const validationErrors = []
      for (const [index, row] of rows.entries()) {
        const result = siembraRowSchema.safeParse(row)
        if (!result.success) {
          validationErrors.push({ 
            rowIndex: index + 2, // +2 for header + 1-index
            row: row as any, 
            errors: result.error.flatten().fieldErrors 
          })
        } else {
          validRows.push(result.data)
        }
      }

      if (validationErrors.length === rows.length) {
        console.error('All validation errors:', validationErrors.slice(0, 10))
        throw new Error(`Todas las filas (\${rows.length}) inválidas. Primer error fila 2: \${JSON.stringify(validationErrors[0])}`)
      } else if (validationErrors.length > 0) {
        console.warn('Some validation errors, uploading valid ones:', validRows.length, 'valid')
        // Don't throw - upload valid rows only
      }

      // Map to DB siembras (mock lookups)
      const siembraData = validRows.map((r) => {
        // Mock lookup: Bloque-Lado-Nave-Cama → id_cama
        const id_cama = crypto.randomUUID() // Real: query camas WHERE bloque/nave/cama
        // Mock lookup: Variedad → id_variedad
        const id_variedad = crypto.randomUUID() // Real: query variedades WHERE nombre=r.Variedad
        return ({
          id_siembra: crypto.randomUUID(),
          id_cama,
          id_variedad,
          fecha_siembra: r['Fecha de siembra'],
          plantas_sembradas: r['Plantas sembradas'],
          densidad_m2: r['Área (m2)'] ? r['Plantas sembradas'] / r['Área (m2)'] : null,
          estado: 'EN PRODUCCION',
          creado_por: null
        })
      })

      const { data, error: upsertError } = await supabase
        .from('siembras')
.upsert(siembrasData)

      if (upsertError) throw upsertError

      return { success: true, count: siembraData.length }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return { loading, uploadData, error }
}

