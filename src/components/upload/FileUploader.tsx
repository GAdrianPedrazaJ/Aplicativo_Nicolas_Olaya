import React, { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useUploadStore } from '../../store/useUploadStore'
import DataPreviewTable from './DataPreviewTable'
import ValidationResults from './ValidationResults'
import BulkRetryModal from './BulkRetryModal'


export default function FileUploader({ mode, onUpload }: { mode: 'siembras' | 'historicos', onUpload?: (data: any[]) => Promise<{success: boolean, count?: number, error?: string}> }) {
  const [data, setData] = useState<any[]>([])
  const [mappedData, setMappedData] = useState<any[] | null>(null)
  const [errors, setErrors] = useState<any[]>([])
  const [showSample, setShowSample] = useState<boolean>(true)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const uploadStore = useUploadStore()

  const handleUpload = useCallback(async () => {
    if (!onUpload) {
      uploadStore.setStatus('error')
      uploadStore.setMessage('Hook de upload no configurado')
      return
    }

    uploadStore.setStatus('uploading')
    uploadStore.setProgress(0)
    uploadStore.setMessage('Validando y subiendo datos...')

    try {
      const payload = (mappedData && mappedData.length > 0) ? mappedData : data
      const result = await onUpload(payload)
      // If backend returned per-row errors, show them in the UI
      if (result && Array.isArray((result as any).errors) && (result as any).errors.length > 0) {
        setErrors((result as any).errors)
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Se subieron ${result.count || 0} filas. ${ (result as any).errors.length } errores.`)
        return
      }

      if (result.success) {
        uploadStore.setStatus('success')
        uploadStore.setMessage(`Éxito: ${result.count || payload.length} registros subidos a Supabase`)
        setErrors([])
      } else {
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Error: ${result.error}`)
      }
    } catch (err: any) {
      uploadStore.setStatus('error')
      uploadStore.setMessage(`Error: ${err.message}`)
    }
  }, [data, mappedData, uploadStore, onUpload])

  // Retry a single errored row immediately (no mapping step)
  const retryRowNow = useCallback(async (errRow: any) => {
    if (!onUpload) return
    const raw = errRow.raw ?? errRow
    uploadStore.setStatus('uploading')
    uploadStore.setProgress(0)
    uploadStore.setMessage('Reintentando fila...')
    try {
      const result = await onUpload([raw])
      if (result && Array.isArray((result as any).errors) && (result as any).errors.length > 0) {
        // still has errors: update panel
        setErrors((result as any).errors)
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Reintento: ${ (result as any).errors.length } errores.`)
        return
      }
      if (result.success) {
        uploadStore.setStatus('success')
        uploadStore.setMessage(`Reintento exitoso: 1 fila`)
        // remove the specific error from list
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

  // Retry all errored rows in bulk (sequential, to show progress)
  const [retrying, setRetrying] = useState(false)
  const [retryTotal, setRetryTotal] = useState(0)
  const [retryDone, setRetryDone] = useState(0)

  const retryAll = useCallback(async () => {
    if (!onUpload) return
    if (!errors || errors.length === 0) return
    const raws = errors.map((e) => e.raw ?? e)
    uploadStore.setStatus('uploading')
    uploadStore.setMessage(`Reintentando ${raws.length} filas...`)
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
          // collect returned errors
          remainingErrors.push(...(result as any).errors)
        }
        const done = i + 1
        setRetryDone(done)
        const percent = Math.round((done / raws.length) * 100)
        uploadStore.setProgress(percent)
        uploadStore.setMessage(`Reintentando ${done}/${raws.length} filas...`)
      }

      if (remainingErrors.length > 0) {
        setErrors(remainingErrors)
        uploadStore.setStatus('error')
        uploadStore.setMessage(`Se completó el reintento. ${remainingErrors.length} errores restantes.`)
      } else {
        setErrors([])
        uploadStore.setStatus('success')
        uploadStore.setMessage(`Reintento masivo completado: ${raws.length} filas`)
      }
    } catch (err: any) {
      uploadStore.setStatus('error')
      uploadStore.setMessage(`Error: ${err.message}`)
    } finally {
      setRetrying(false)
    }
  }, [errors, onUpload, uploadStore])

  // Edit a specific errored row: populate mapping editor with raw data
  const editRowForRetry = useCallback((errRow: any) => {
    const raw = errRow.raw ?? errRow
    setMappedData([raw])
    setShowSample(true)
    uploadStore.setMessage('Edita la fila en el mapeo y pulsa "Subir Datos a DB" para reintentar')
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

        // Skip filter rows
        json = json.filter(row => !row.some(cell => cell && cell.toString().includes('Filtros aplicados')))
        
        // Heuristic: find first row that looks like a header (has >= 3 non-empty cells)
        const headerIndex = json.findIndex(
          (row) => Array.isArray(row) && row.filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '').length >= 3
        )
        const startIndex = headerIndex >= 0 ? headerIndex : 0
        if (startIndex > 0) {
          json = json.slice(startIndex)
        }
        
        // Convert to object from row 0 as header
        const headers = (json[0] || []).map((h) => (h == null ? '' : String(h).trim())) as string[]
        const dataRows = json.slice(1).filter((row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
        const parsedData = dataRows.map(row => {
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header] = row[i] || ''
          })
          return obj
        })
        
        // reset any previous mapping when loading a new file
        console.debug('Parsed XLSX headers:', headers)
        console.debug('Parsed rows count:', parsedData.length)
        setData(parsedData)
        setMappedData(null)
        setErrors([])
        return
      }

      // Fallback: try CSV parse
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4 4 4m6 8v-8a2 2 0 00-2-2h-3"/></svg>
          <span>Elegir archivo</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="text-sm text-gray-600">Acepta CSV (recomendado)</div>
      </div>

      <ValidationResults errors={errors} onEdit={editRowForRetry} onRetryNow={retryRowNow} onRetryAll={retryAll} />

      {data.length > 0 && errors.length === 0 && (
        <div className="space-y-3">
          <button
            onClick={handleUpload}
            disabled={uploadStore.status === 'uploading'}
            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md transition-all duration-200"
          >
            {uploadStore.status === 'uploading' ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </>
            ) : (
              'Subir Datos a DB'
            )}
          </button>

          {/* Progress indicator moved to Dashboard; keep local messages only */}
          {uploadStore.status !== 'idle' && uploadStore.message && (
            <div className="mt-2 p-2 text-sm text-blue-800">{uploadStore.message}</div>
          )}
        </div>
      )}

      <div className="mt-2">
        <DataPreviewTable data={(mappedData && mappedData.length > 0) ? mappedData : data} onMapped={(m) => setMappedData(m)} />
        {mappedData && mappedData.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-gray-700">Se aplicó mapeo: <span className="font-medium">{mappedData.length}</span> filas preparadas para subir.</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSample((s) => !s)}
                className="px-2 py-1 text-sm bg-gray-100 border rounded"
              >
                {showSample ? 'Ocultar muestra' : 'Mostrar muestra (5 filas)'}
              </button>
            </div>
            {/* JSON preview removed per request */}
          </div>
        )}
      </div>
      <BulkRetryModal open={retrying} total={retryTotal} done={retryDone} onClose={() => setRetrying(false)} />
    </div>
  )
}
