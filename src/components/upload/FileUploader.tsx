import React, { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useUploadStore } from '../../store/useUploadStore'
import DataPreviewTable from './DataPreviewTable'
import ValidationResults from './ValidationResults'
import BulkRetryModal from './BulkRetryModal'

interface FileUploaderProps {
  mode: 'siembras' | 'historicos'
  onUpload?: (data: any[]) => Promise<{ success: boolean; count?: number; error?: string }>
  extraInfo?: React.ReactNode
  submitLabel?: string
  confirmMessage?: string
  titleLabel?: string
  fileLabel?: string
  previewTitle?: string
}

export default function FileUploader({
  mode,
  onUpload,
  extraInfo,
  submitLabel = 'Subir Datos a DB',
  confirmMessage,
  titleLabel = 'Seleccionar Archivo',
  fileLabel = 'Elegir archivo',
  previewTitle = 'Vista Previa de Datos'
}: FileUploaderProps) {
  const [data, setData] = useState<any[]>([])
  const [mappedData, setMappedData] = useState<any[] | null>(null)
  const [errors, setErrors] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const uploadStore = useUploadStore()

  const handleUpload = useCallback(async () => {
    if (!onUpload) {
      uploadStore.setStatus('error')
      uploadStore.setMessage('Hook de upload no configurado')
      return
    }

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return
    }

    uploadStore.setStatus('uploading')
    uploadStore.setProgress(0)
    uploadStore.setMessage('Procesando solicitud...')

    try {
      const payload = (mappedData && mappedData.length > 0) ? mappedData : data
      const result = await onUpload(payload)

      if (result && Array.isArray((result as any).errors) && (result as any).errors.length > 0) {
        setErrors((result as any).errors)
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Se procesaron ${result.count || 0} filas. ${ (result as any).errors.length } errores.`)
        return
      }

      if (result.success) {
        uploadStore.setStatus('success')
        uploadStore.setMessage(`Acción completada: ${result.count || payload.length} registros procesados`)
        setErrors([])
      } else {
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Error: ${result.error}`)
      }
    } catch (err: any) {
      uploadStore.setStatus('error')
      uploadStore.setMessage(`Error: ${err.message}`)
    }
  }, [data, mappedData, uploadStore, onUpload, confirmMessage])

  const retryRowNow = useCallback(async (errRow: any) => {
    if (!onUpload) return
    const raw = errRow.raw ?? errRow
    uploadStore.setStatus('uploading')
    uploadStore.setProgress(0)
    uploadStore.setMessage('Reintentando...')
    try {
      const result = await onUpload([raw])
      if (result && Array.isArray((result as any).errors) && (result as any).errors.length > 0) {
        setErrors((result as any).errors)
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Error en reintento.`)
        return
      }
      if (result.success) {
        uploadStore.setStatus('success')
        uploadStore.setMessage(`Reintento exitoso`)
        setErrors((prev) => prev.filter((e) => e !== errRow))
      } else {
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Error: ${result.error}`)
      }
    } catch (err: any) {
      uploadStore.setStatus('error')
      uploadStore.setMessage(`Error: ${err.message}`)
    }
  }, [onUpload, uploadStore])

  const [retrying, setRetrying] = useState(false)
  const [retryTotal, setRetryTotal] = useState(0)
  const [retryDone, setRetryDone] = useState(0)

  const retryAll = useCallback(async () => {
    if (!onUpload) return
    if (!errors || errors.length === 0) return
    const raws = errors.map((e) => e.raw ?? e)
    uploadStore.setStatus('uploading')
    uploadStore.setMessage(`Procesando reintentos...`)
    uploadStore.setProgress(0)
    setRetrying(true)
    setRetryTotal(raws.length)
    setRetryDone(0)
    const remainingErrors: any[] = []
    try {
      for (let i = 0; i < raws.length; i++) {
        const row = raws[i]
        const result = await onUpload([row])
        if (result && Array.isArray((result as any).errors) && (result as any).errors.length > 0) {
          remainingErrors.push(...(result as any).errors)
        }
        const done = i + 1
        setRetryDone(done)
        const percent = Math.round((done / raws.length) * 100)
        uploadStore.setProgress(percent)
      }

      if (remainingErrors.length > 0) {
        setErrors(remainingErrors)
        uploadStore.setStatus('error')
        uploadStore.setMessage(`${remainingErrors.length} errores restantes.`)
      } else {
        setErrors([])
        uploadStore.setStatus('success')
        uploadStore.setMessage(`Proceso masivo completado`)
      }
    } catch (err: any) {
      uploadStore.setStatus('error')
      uploadStore.setMessage(`Error: ${err.message}`)
    } finally {
      setRetrying(false)
    }
  }, [errors, onUpload, uploadStore])

  const editRowForRetry = useCallback((errRow: any) => {
    const raw = errRow.raw ?? errRow
    setMappedData([raw])
    uploadStore.setMessage('Edita la fila y procesa nuevamente')
  }, [uploadStore])

  const onFile = async (file: File | null) => {
    if (!file) return
    const name = file.name.toLowerCase()
    try {
      if (name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data as any[])
            setErrors([])
          },
          error: (err) => setErrors([{ message: err.message }]),
        })
        return
      }

      if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        const ab = await file.arrayBuffer()
        const wb = XLSX.read(ab, { type: 'array' })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        let json = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 }) as string[][]

        json = json.filter(row => !row.some(cell => cell && cell.toString().includes('Filtros aplicados')))
        
        const headerIndex = json.findIndex(
          (row) => Array.isArray(row) && row.filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '').length >= 3
        )
        const startIndex = headerIndex >= 0 ? headerIndex : 0
        if (startIndex > 0) {
          json = json.slice(startIndex)
        }
        
        const headers = (json[0] || []).map((h) => (h == null ? '' : String(h).trim())) as string[]
        const dataRows = json.slice(1).filter((row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
        const parsedData = dataRows.map(row => {
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header] = row[i] || ''
          })
          return obj
        })
        
        setData(parsedData)
        setMappedData(null)
        setErrors([])
        return
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data as any[])
          setErrors([])
        },
        error: (err) => setErrors([{ message: err.message }]),
      })
    } catch (err: any) {
      setErrors([{ message: err.message ?? String(err) }])
    }
  }

  const isDeleteMode = submitLabel.toLowerCase().includes('eliminar')

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">{titleLabel}</h3>
            <div className="flex items-center gap-4">
              <label className={`inline-flex items-center px-4 py-2 text-white rounded-md cursor-pointer transition-colors ${isDeleteMode ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#005d5d] hover:bg-[#004d4d]'}`}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4 4 4m6 8v-8a2 2 0 00-2-2h-3"/></svg>
                <span className="text-xs font-bold uppercase tracking-wider">{fileLabel}</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Excel o CSV</div>
            </div>
          </div>

          <ValidationResults errors={errors} onEdit={editRowForRetry} onRetryNow={retryRowNow} onRetryAll={retryAll} />

          {data.length > 0 && errors.length === 0 && (
            <div className="space-y-3">
              <button
                onClick={handleUpload}
                disabled={uploadStore.status === 'uploading'}
                className={`w-full px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isDeleteMode
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                }`}
              >
                {uploadStore.status === 'uploading' ? 'Procesando...' : submitLabel}
              </button>

              {uploadStore.status !== 'idle' && uploadStore.message && (
                <div className={`p-3 border rounded-xl text-[10px] font-bold uppercase tracking-wider text-center ${
                  uploadStore.status === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                }`}>
                  {uploadStore.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {extraInfo}
        </div>
      </div>

      {data.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-8 w-full">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{previewTitle}</h3>
             {mappedData && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{mappedData.length} registros detectados</span>}
          </div>
          <DataPreviewTable data={data} onMapped={(m) => setMappedData(m)} />
        </div>
      )}

      <BulkRetryModal open={retrying} total={retryTotal} done={retryDone} onClose={() => setRetrying(false)} />
    </div>
  )
}
