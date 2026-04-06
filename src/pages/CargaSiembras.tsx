import React, { useEffect } from 'react'
import { useSiembras } from '../hooks/useSiembras'
import FileUploader from '../components/upload/FileUploader'
import ModuleCard from '../components/shared/ModuleCard'
import DataPreviewTable from '../components/upload/DataPreviewTable'

export default function CargaSiembras() {
  const { uploadData, siembras, fetchSiembras, loading } = useSiembras()

  useEffect(() => {
    fetchSiembras()
  }, [])

  return (
    <div className="space-y-6">
      <ModuleCard title="Ver Siembras Existentes (DB)">
        <div className="flex gap-4 mb-4">
          <button
            onClick={fetchSiembras}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Refrescar Siembras'}
          </button>
          <span className="text-sm text-gray-600 self-center">
            Total: {siembras.length} siembras
          </span>
        </div>
        {siembras.length === 0 ? (
          <p className="text-gray-500">No hay siembras o error conexión DB.</p>
        ) : (
          <DataPreviewTable data={siembras.map(s => ({
            ID: s.id_siembra,
            Bloque: s.camas.naves.bloques.nombre,
            Nave: s.camas.naves.numero_nave,
            Cama: s.camas.numero_cama,
            Variedad: s.variedades.nombre,
            'Fecha Siembra': s.fecha_siembra,
            Plantas: s.plantas_sembradas,
            Estado: s.estado
          }))} />
        )}
      </ModuleCard>

      <ModuleCard title="Subir Nuevo Plano de Siembra">
        <FileUploader mode="siembras" onUpload={uploadData} />
      </ModuleCard>
    </div>
  )
}
