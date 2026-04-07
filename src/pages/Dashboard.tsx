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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Panel de Control</h2>
          </div>
          <nav className="flex gap-2">
            <button className="px-3 py-2 rounded border text-sm">Planes de Siembra</button>
            <button className="px-3 py-2 rounded border text-sm">Históricos</button>
            <button className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">Power BI</button>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-semibold">Siembras Activas</div>
            <div className="text-2xl font-bold">{rows.length}</div>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-semibold">Página</div>
            <div className="text-2xl font-bold">{pageIndex + 1} / {pageCount}</div>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-semibold">Estado</div>
            <div className="text-xl font-semibold text-green-700">{loading ? 'Cargando...' : 'Listo'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="card border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-medium mb-4">Subir Nuevo Plan</h3>
            {/* Show uploader only to roles 'uploader' or 'admin' (useAuth is a stub for now) */}
            {(() => {
              const auth = useAuth()
              if (!auth.isLoggedIn) return <div className="text-sm text-gray-600">Inicia sesión para subir archivos.</div>
              if (auth.hasRole('uploader') || auth.hasRole('admin')) {
                return <FileUploader mode="siembras" onUpload={uploadData} />
              }
              return <div className="text-sm text-gray-600">No tienes permisos para subir archivos.</div>
            })()}
          </div>

          <div className="card border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-medium mb-4">Estado de Carga</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{uploadStore.message ?? 'Validando y subiendo datos...'}</span>
                <span className="font-semibold">{uploadStore.status === 'uploading' ? '...' : (uploadStore.status === 'error' ? 'Error' : 'OK')}</span>
              </div>
              <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
                <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${uploadStore.progress}%` }} />
              </div>
              <div className="text-xs text-gray-500">{uploadStore.progress}%</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Siembras Registradas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-2 text-left">Bloque</th>
                  <th className="p-2 text-left">Nave</th>
                  <th className="p-2 text-left">Cama</th>
                  <th className="p-2 text-left">Área (m²)</th>
                  <th className="p-2 text-left">Estado</th>
                  <th className="p-2 text-left">Producto</th>
                  <th className="p-2 text-left">Color</th>
                  <th className="p-2 text-left">Variedad</th>
                  <th className="p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {pageRows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.bloque}</td>
                    <td className="p-2">{r.nave}</td>
                    <td className="p-2">{r.cama}</td>
                    <td className="p-2">{r.area}</td>
                    <td className="p-2">{r.estado}</td>
                    <td className="p-2">{r.producto}</td>
                    <td className="p-2">{r.color}</td>
                    <td className="p-2">{r.variedad}</td>
                    <td className="p-2">{r.fecha}</td>
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
    </div>
  )
}
