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

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageRows = rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">RDC Tandil SAS — Control de Siembras</h2>
          <p className="text-sm text-gray-500">Resumen ejecutivo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
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

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Siembras (vista previa)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="p-3 text-left">Sede</th>
                    <th className="p-3 text-left">Bloque</th>
                    <th className="p-3 text-left">Lado</th>
                    <th className="p-3 text-left">Nave</th>
                    <th className="p-3 text-left">Cama</th>
                    <th className="p-3 text-left">Área (m²)</th>
                    <th className="p-3 text-left">Tipo de siembra</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  { /* Reuse rows for preview - show a sample */ }
                  {rows.slice(0, 10).map((r: any, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3">{r.sede || 'TN'}</td>
                      <td className="p-3">{r.bloque}</td>
                      <td className="p-3">{r.lado}</td>
                      <td className="p-3">{r.nave}</td>
                      <td className="p-3">{r.cama}</td>
                      <td className="p-3">{r.area}</td>
                      <td className="p-3">{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-3 space-y-6">
          <div className="p-6 bg-white rounded-lg shadow">
            <h4 className="text-lg font-medium mb-2">Estado de Carga</h4>
            <div className="text-sm text-gray-600 mb-2">{uploadStore.message ?? 'Validando y subiendo datos...'}</div>
            <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${uploadStore.progress}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{uploadStore.progress}% • {uploadStore.status === 'uploading' ? 'Subiendo...' : (uploadStore.status === 'error' ? 'Error' : 'OK')}</div>
          </div>
        </aside>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Siembras Registradas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-3 text-left">Bloque</th>
                <th className="p-3 text-left">Nave</th>
                <th className="p-3 text-left">Cama</th>
                <th className="p-3 text-left">Área (m²)</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Color</th>
                <th className="p-3 text-left">Variedad</th>
                <th className="p-3 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {pageRows.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{r.bloque}</td>
                  <td className="p-3">{r.nave}</td>
                  <td className="p-3">{r.cama}</td>
                  <td className="p-3">{r.area}</td>
                  <td className="p-3">{r.estado}</td>
                  <td className="p-3">{r.producto}</td>
                  <td className="p-3">{r.color}</td>
                  <td className="p-3">{r.variedad}</td>
                  <td className="p-3">{r.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">Página {pageIndex + 1} de {pageCount}</div>
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
  )
}
