import { useState } from 'react'
import { useSupabase } from './useSupabase'
import { historicoRowSchema, HistoricoRow } from '../utils/validators'
import { useUploadStore } from '../store/useUploadStore'
import { v4 as uuidv4 } from 'uuid'

export function useHistoricos() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()
  const setUploading = useUploadStore((state) => state.setUploading)

  const uploadData = async (rows: HistoricoRow[]) => {
    try {
      setLoading(true)
      setError(null)
      setUploading(true)

      // Validar rows
      const validRows = []
      const validationErrors = []
      for (const row of rows) {
        const result = historicoRowSchema.safeParse(row)
        if (!result.success) {
          validationErrors.push({ row: row as any, errors: result.error.errors })
        } else {
          validRows.push(result.data)
        }
      }
      if (validationErrors.length > 0) {
        throw new Error(`${validationErrors.length} filas inválidas`)
      }


      // Real upsert (dummy IDs for test - replace with lookups)
      const historicoData = validRows.map((r) => ({
        id_registro: crypto.randomUUID(),
        id_siembra: '00000000-0000-0000-0000-000000000001', // Dummy - from CSV or select
        id_ciclo: null,
        fecha_corte: r.FechaCorte,
        tallos_cortados: r.TallosCortados,
        tallos_perdidos: r.TallosPerdidos || 0,
        registrado_por: null, // user UUID
        id_causa_dano: r.Causa ? crypto.randomUUID() : null, // lookup causa nombre
        observaciones: '',
        cerrado: false
      }))

      const { data, error: upsertError } = await supabase
        .from('registros_corte_diario')
        .upsert(historicoData)

      if (upsertError) throw upsertError

      return { success: true, count: historicoData.length }
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

