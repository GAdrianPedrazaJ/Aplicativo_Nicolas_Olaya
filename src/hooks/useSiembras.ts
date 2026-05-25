import { useState } from 'react'
import { useSupabase } from './useSupabase'
import { useUploadStore } from '../store/useUploadStore'

export function useSiembras() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siembras, setSiembras] = useState<any[]>([])
  const supabase = useSupabase()
  const setUploading = useUploadStore((state) => state.setUploading)
  const setProgress = useUploadStore((state) => state.setProgress)
  const setStatus = useUploadStore((state) => state.setStatus)
  const setMessage = useUploadStore((state) => state.setMessage)

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
              numero_nave,
              bloques (nombre)
            ),
            numero_cama,
            nombre,
            area_m2
          ),
          variedades (
            id_variedad,
            colores (
              id_color,
              nombre,
              productos (nombre)
            ),
            nombre
          )
        `)
        .order('fecha_siembra', { ascending: false })
      if (error) throw error
      setSiembras(data || [])
    } catch (err: any) {
      console.error('Fetch siembras error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadData = async (rows: any[]) => {
    try {
      setLoading(true)
      setError(null)
      setUploading(true)

      const normalize = (raw: any) => {
        const obj: any = {}
        for (const k of Object.keys(raw)) {
          const v = raw[k]
          const mk = String(k).replace(/\s+/g, '').toLowerCase()
          switch (mk) {
            case 'bloque': obj.Bloque = String(v ?? '').trim(); break
            case 'nave': obj.Nave = String(v ?? '').trim(); break
            case 'cama': obj.Cama = String(v ?? '').trim(); break
            case 'producto': obj.Producto = String(v ?? '').trim(); break
            case 'color': obj.Color = String(v ?? '').trim(); break
            case 'variedad': obj.Variedad = String(v ?? '').trim(); break
            case 'fechasiembra':
            case 'fechadesiembra': obj.FechaSiembra = String(v ?? '').trim(); break
            case 'plantas':
            case 'plantassembradas':
            case 'cantidad': obj.PlantasSembradas = Number(v || 0); break
            default: break
          }
        }
        return obj
      }

      const payloadRows = rows.map(r => normalize(r))
      setStatus('uploading')
      setProgress(0)
      setMessage('Enviando filas al servidor...')

      const resp = await fetch((import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + '/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadRows)
      })

      const payload = await resp.json()
      if (!resp.ok) throw new Error(payload.error || 'Error en la carga')

      const backendErrors: any[] = []
      if (payload.errors) {
        payload.errors.forEach((e: any) => {
          backendErrors.push({ rowIndex: e.index, messages: e.issues?.map((i: any) => i.message) || [e.message], raw: e.raw })
        })
      }

      setProgress(100)
      setStatus('success')
      setMessage(`Se procesaron ${payload.inserted || 0} filas exitosamente.`)
      await fetchSiembras()
      return { success: true, count: payload.inserted || 0, errors: backendErrors }
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
      setMessage(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const deleteSiembras = async (ids: string[]) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('siembras')
        .delete()
        .in('id_siembra', ids)

      if (error) throw error
      await fetchSiembras()
      return { success: true }
    } catch (err: any) {
      console.error('Delete siembras error:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const deleteSiembrasByFile = async (rows: any[]) => {
    try {
      setLoading(true)
      setStatus('uploading')
      setMessage('Identificando registros para eliminar...')

      // Enviamos al backend para que identifique y elimine por criterios de negocio (Bloque, Cama, Variedad)
      const resp = await fetch((import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + '/planos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows)
      })

      const payload = await resp.json()
      if (!resp.ok) throw new Error(payload.error || 'Error en la eliminación masiva')

      setStatus('success')
      setMessage(`Se eliminaron ${payload.deleted || 0} registros correctamente.`)
      await fetchSiembras()
      return { success: true, count: payload.deleted }
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { 
    loading, 
    siembras, 
    uploadData, 
    deleteSiembras,
    deleteSiembrasByFile,
    error,
    fetchSiembras 
  }
}
