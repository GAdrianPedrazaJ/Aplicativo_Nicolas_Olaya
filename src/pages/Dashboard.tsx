import React, { useEffect, useMemo, useState } from 'react'
import FileUploader from '../components/upload/FileUploader'
import { useSiembras } from '../hooks/useSiembras'
import { useUploadStore } from '../store/useUploadStore'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { uploadData, siembras, fetchSiembras, loading } = useSiembras()
  const uploadStore = useUploadStore()
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { fetchSiembras() }, [])

  const rows = useMemo(() => (siembras || []).map((s: any) => ({
    id: s.id_siembra,
    bloque: s.camas?.naves?.bloques?.nombre || '-',
    nave: s.camas?.naves?.numero_nave || '-',
    cama: s.camas?.numero_cama || '-',
    area: s.camas?.area_m2 ?? '-',
    estado: s.estado || '-',
    producto: s.variedades?.colores?.productos?.nombre || '-',
    color: s.variedades?.colores?.nombre || '-',
    variedad: s.variedades?.nombre || '-',
    fecha: s.fecha_siembra || '-'
  })), [siembras])

  const [query, setQuery] = useState('')
  const filteredRows = rows.filter((r: any) => {
    if (!query) return true
    const q = String(query).toLowerCase()
    return [r.bloque, r.nave, r.cama, r.producto, r.color, r.variedad].some((v) => String(v ?? '').toLowerCase().includes(q))
  })
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageRows = filteredRows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)

  // Summary aggregates: unique camas and top product/color/variedad combos
  // summary should reflect currently visible rows (filtered)
  const summary = React.useMemo(() => {
    const camasSet = new Set<string>()
    const comboMap = new Map<string, { producto: string; color: string; variedad: string; camas: Set<string> }>()
    for (const r of filteredRows) {
      const camaKey = `${r.bloque}||${r.nave}||${r.cama}`
      camasSet.add(camaKey)
      const comboKey = `${r.producto}||${r.color}||${r.variedad}`
      if (!comboMap.has(comboKey)) comboMap.set(comboKey, { producto: r.producto, color: r.color, variedad: r.variedad, camas: new Set() })
      comboMap.get(comboKey)!.camas.add(camaKey)
    }
    const combos = Array.from(comboMap.values()).map(c => ({ producto: c.producto, color: c.color, variedad: c.variedad, camasCount: c.camas.size }))
      .sort((a, b) => b.camasCount - a.camasCount)
    return { totalSiembras: filteredRows.length, uniqueCamas: camasSet.size, combos }
  }, [filteredRows])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">SIEMBRAS</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow flex flex-col justify-center border-l-4 border-green-500">
              <div className="text-xs text-gray-500">Siembras</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{summary.totalSiembras}</div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow flex flex-col justify-center border-l-4 border-green-500">
              <div className="text-xs text-gray-500">Camas únicas</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{summary.uniqueCamas}</div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow lg:col-span-2">
              <div className="text-xs text-gray-500">Top combos (producto • color • variedad)</div>
              <div className="mt-2 space-y-2">
                {summary.combos.slice(0,3).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">{c.producto} • {c.color} • {c.variedad}</div>
                    <div className="text-sm font-semibold text-green-600">{c.camasCount} camas</div>
                  </div>
                ))}
                {summary.combos.length === 0 && <div className="text-sm text-gray-500">No hay datos</div>}
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Subir Nuevo Plan</h3>
            {(() => {
              const auth = useAuth()
              if (!auth.isLoggedIn) return <div className="text-sm text-gray-600">Inicia sesión para subir archivos.</div>
              if (auth.hasRole('uploader') || auth.hasRole('admin')) {
                return <FileUploader mode="siembras" onUpload={uploadData} />
              }
              return <div className="text-sm text-gray-600">No tienes permisos para subir archivos.</div>
            })()}
          </div>

          {/* Single consolidated siembras table (blocks, nave, producto, color, variedad, cama) */}
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Siembras registradas</h3>
              <div className="flex items-center gap-3">
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPageIndex(0) }} placeholder="Buscar (bloque, nave, producto...)" className="border rounded p-2 text-sm w-64" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="p-3 text-left">Bloque</th>
                    <th className="p-3 text-left">Nave</th>
                    <th className="p-3 text-left">Cama</th>
                    <th className="p-3 text-left">Producto</th>
                    <th className="p-3 text-left">Color</th>
                    <th className="p-3 text-left">Variedad</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {pageRows.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{r.bloque}</td>
                      <td className="p-3">{r.nave}</td>
                      <td className="p-3">{r.cama}</td>
                      <td className="p-3">{r.producto}</td>
                      <td className="p-3">{r.color}</td>
                      <td className="p-3">{r.variedad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">Mostrando {filteredRows.length} resultados</div>
              <div className="flex gap-2">
                <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} className="px-3 py-1 border rounded">‹</button>
                <button onClick={() => setPageIndex(Math.min(pageCount - 1, pageIndex + 1))} className="px-3 py-1 border rounded">›</button>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0) }} className="ml-2 border rounded p-1">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-3 space-y-6">
          <div className="p-4 bg-white rounded-lg shadow border-l-4 border-green-600">
            <h4 className="text-sm font-medium mb-2">Estado de carga</h4>
            <div className="text-sm text-gray-700 mb-2">{uploadStore.message ?? 'Validando y subiendo datos...'}</div>
            <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-green-500 to-green-700" style={{ width: `${uploadStore.progress}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{uploadStore.progress}% • {uploadStore.status === 'uploading' ? 'Subiendo...' : (uploadStore.status === 'error' ? 'Error' : 'OK')}</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="text-sm font-medium mb-2">Top productos por camas</h4>
            <div className="text-sm text-gray-700">
              {summary.combos.slice(0,8).map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                  <div className="text-gray-700">{c.producto} • {c.color} • {c.variedad}</div>
                  <div className="font-semibold text-green-700">{c.camasCount}</div>
                </div>
              ))}
              {summary.combos.length === 0 && <div className="text-gray-500">No hay registros</div>}
            </div>
          </div>
        </aside>
      </div>

      {/* single paginated table exists above; duplicate removed */}
    </div>
  )
}
