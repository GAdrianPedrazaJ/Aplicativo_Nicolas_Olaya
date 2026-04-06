import { useState } from 'react'
import { useSupabase } from './useSupabase'
import { siembraRowSchema, SiembraRow } from '../utils/validators'
import { useUploadStore } from '../store/useUploadStore'
import { insertSiembrasBatch } from '../services/dataService'
import { v4 as uuidv4 } from 'uuid'

export function useSiembras() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siembras, setSiembras] = useState<any[]>([])
  const supabase = useSupabase()
  const setUploading = useUploadStore((state) => state.setUploading)

  const fetchSiembras = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('siembras')
        .select(`
          id_siembra,
          fecha_siembra,
          plantas_sembradas,
          estado,
          camas (
            id_cama,
            naves (
              id_nave,
              bloques (nombre)
            ),
            numero_cama,
            nombre
          ),
          variedades (
            id_variedad,
            colores (
              id_color,
              productos (nombre)
            ),
            nombre
          )
        `)
        .order('fecha_siembra', { ascending: false })
        .limit(50)
      if (error) throw error
      setSiembras(data || [])
    } catch (err: any) {
      console.error('Fetch siembras error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadData = async (rows: SiembraRow[]) => {
    try {
      setLoading(true)
      setError(null)
      setUploading(true)

      // Validar rows con errores detallados
      const validRows: SiembraRow[] = []
      const validationErrors: any[] = []
      for (const [index, row] of rows.entries()) {
        const result = siembraRowSchema.safeParse(row)
        if (!result.success) {
          validationErrors.push({ 
            rowIndex: index + 2, 
            row: row as any, 
            errors: result.error.flatten().fieldErrors 
          })
        } else {
          validRows.push(result.data)
        }
      }

      if (validationErrors.length === rows.length) {
        console.error('All validation errors:', validationErrors.slice(0, 10))
        throw new Error(`Todas las filas (${rows.length}) inválidas. Primer error fila 2: ${JSON.stringify(validationErrors[0])}`)
      } else if (validationErrors.length > 0) {
        console.warn('Some validation errors, uploading valid ones:', validRows.length, 'valid')
      }

      // Use real service for hierarchy insert
      const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000001'
      const result = await insertSiembrasBatch(validRows, DUMMY_USER_ID)
      
      if (result.errors.length > 0) {
        console.warn('Insert errors:', result.errors)
        throw new Error(`Inserted ${result.inserted}, ${result.errors.length} errors`)
      }

      await fetchSiembras()
      return { success: true, count: result.inserted }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return { 
    loading, 
    siembras, 
    uploadData, 
    error, 
    fetchSiembras 
  }
}

