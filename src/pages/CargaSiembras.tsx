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
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Siembras</h2>
          <p className="text-slate-500 mt-1">Administra y carga los planos de siembra del cultivo.</p>
        </div>

        <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">Total Registros</span>
            <span className="text-xl font-black text-emerald-700">{siembras.length}</span>
          </div>
          <button
            onClick={fetchSiembras}
            disabled={loading}
            className="btn-primary flex items-center gap-2 h-full py-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Actualizando...
              </>
            ) : (
              'Refrescar Datos'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <ModuleCard title="Base de Datos de Siembras">
          {siembras.length === 0 && !loading ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No se encontraron registros en la base de datos.</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-slate-100 shadow-inner">
              <DataPreviewTable data={siembras.map(s => ({
                ID: s?.id_siembra,
                Bloque: s?.camas?.naves?.bloques?.nombre || 'N/A',
                Nave: s?.camas?.naves?.numero_nave || 'N/A',
                Cama: s?.camas?.numero_cama || 'N/A',
                Variedad: s?.variedades?.nombre || 'N/A',
                Color: s?.variedades?.colores?.nombre || 'N/A',
                Producto: s?.variedades?.colores?.productos?.nombre || 'N/A',
                'Fecha Siembra': s?.fecha_siembra || 'N/A',
                Plantas: s?.plantas_sembradas || 0,
                Estado: s?.estado || 'N/A'
              }))} />
            </div>
          )}
        </ModuleCard>

        <ModuleCard title="Carga Masiva de Planos">
          <div className="max-w-3xl">
            <p className="text-sm text-slate-500 mb-6 italic bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <strong>Nota:</strong> El archivo debe contener las columnas de Bloque, Nave, Cama, Producto, Color, Variedad y Plantas. Los formatos soportados son .xlsx y .csv.
            </p>
            <FileUploader mode="siembras" onUpload={uploadData} />
          </div>
        </ModuleCard>
      </div>
    </div>
  )
}
