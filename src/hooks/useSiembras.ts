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
            case 'fechadesiembra':
            case 'fechadesiembra':
            case 'fechade siembra':
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
      const resp = await fetch((import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + '/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadRows)
      })
      const payload = await resp.json()
      if (!resp.ok) {
        throw new Error(payload.error || JSON.stringify(payload))
      }
      if (payload.errors && payload.errors.length > 0) {
        console.warn('Backend reported errors:', payload.errors)
      }
      await fetchSiembras()
      return { success: true, count: payload.inserted || 0 }
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

