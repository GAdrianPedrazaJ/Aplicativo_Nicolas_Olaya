import { useState } from 'react'
import { useSupabase } from './useSupabase'
import { SiembraRow } from '../utils/validators'
import { useUploadStore } from '../store/useUploadStore'
// Note: inserts are performed by backend /planos endpoint

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
        .limit(1000)
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

      // Delegate normalization and validation to the batch service which
      // knows how to map different header variants to our schema.
      // Map incoming rows to server-expected keys (normalize header variants)
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
            case 'aream2':
            case 'area':
            case 'áream2': obj.AreaM2 = v ? Number(v) : null; break
            case 'estado': obj.Estado = String(v ?? '').trim(); break
            default: break
          }
        }
        return obj
      }

      const payloadRows = rows.map(r => normalize(r))

      // Send rows to the backend endpoint which uses the Supabase Service Role
      // to perform upserts and hierarchical creation. Backend returns { inserted, errors }
      setStatus('uploading')
      setProgress(0)
      setMessage('Enviando filas al servidor...')
      const resp = await fetch((import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + '/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadRows)
      })
      const payload = await resp.json()
      if (!resp.ok) {
        setStatus('error')
        setMessage(payload.error || JSON.stringify(payload))
        throw new Error(payload.error || JSON.stringify(payload))
      }

      // Normalize backend errors into a client-friendly shape
      const backendErrors: Array<{ rowIndex?: number, messages: string[], raw?: any }> = []
      if (payload.errors && Array.isArray(payload.errors) && payload.errors.length) {
        for (const e of payload.errors) {
          // e may be { index, issues, raw } from validation or { index, message }
          const rowIndex = e.index ?? e.rowIndex
          const messages: string[] = []
          if (e.issues && Array.isArray(e.issues)) {
            for (const it of e.issues) {
              if (it.message) messages.push(it.message)
              else messages.push(JSON.stringify(it))
            }
          } else if (e.message) {
            messages.push(String(e.message))
          } else if (e.issues && typeof e.issues === 'object') {
            messages.push(JSON.stringify(e.issues))
          }
          backendErrors.push({ rowIndex, messages, raw: e.raw ?? null })
        }
      }

      // compute and publish progress based on successful inserts vs total rows
      const total = payloadRows.length || 0
      const inserted = payload.inserted || 0
      const percent = total > 0 ? Math.round((inserted / total) * 100) : 100
      setProgress(percent)
      setStatus('success')
      setMessage(`Se subieron ${inserted} de ${total} filas.`)

      // Refresh siembras after attempted upload
      await fetchSiembras()
      return { success: true, count: inserted || 0, errors: backendErrors }
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

  return { 
    loading, 
    siembras, 
    uploadData, 
    error, 
    fetchSiembras 
  }
}

