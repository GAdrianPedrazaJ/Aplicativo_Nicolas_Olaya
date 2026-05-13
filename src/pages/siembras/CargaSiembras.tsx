import { useEffect } from 'react'
import { useSiembras } from '../../hooks/useSiembras'
import FileUploader from '../../components/upload/FileUploader'
import ModuleCard from '../../components/shared/ModuleCard'
import DataPreviewTable from '../../components/upload/DataPreviewTable'
import { Sidebar } from '../../components/Sidebar'
import { RefreshCcw, UploadCloud, Info, Database } from 'lucide-react'

export default function CargaSiembras() {
  const { uploadData, siembras, fetchSiembras, loading } = useSiembras()

  useEffect(() => {
    fetchSiembras()
  }, [])

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">GESTIÓN DE SIEMBRAS</h2>
              <p className="text-slate-500 font-medium mt-1">Administra y carga los planos de siembra del cultivo de forma masiva.</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-3 rounded-[24px] shadow-sm border border-slate-100">
              <div className="px-5 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Registros Totales</span>
                <span className="text-xl font-black text-indigo-900">{siembras.length}</span>
              </div>
              <button
                onClick={fetchSiembras}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? <RefreshCcw className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                <span>ACTUALIZAR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            {/* Sección de Carga */}
            <ModuleCard
              title="Carga Masiva de Planos"
              subtitle="Importación de archivos Excel/CSV"
              action={<UploadCloud className="text-indigo-400" size={24} />}
            >
              <div className="max-w-4xl">
                <div className="flex gap-4 p-5 bg-amber-50 rounded-[24px] border border-amber-100 mb-8">
                  <div className="bg-amber-100 p-2 rounded-xl h-fit">
                    <Info className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide mb-1">Requerimientos del archivo</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      El sistema espera un archivo con las columnas: <span className="font-bold">Bloque, Nave, Cama, Producto, Color, Variedad y Plantas</span>.
                      Asegúrese de que el formato de fecha sea válido y no existan celdas vacías en campos obligatorios.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors">
                  <FileUploader mode="siembras" onUpload={uploadData} />
                </div>
              </div>
            </ModuleCard>

            {/* Visualización de Datos */}
            <ModuleCard
              title="Base de Datos de Siembras"
              subtitle="Visualización de registros actuales"
              action={<Database className="text-slate-400" size={24} />}
            >
              {siembras.length === 0 && !loading ? (
                <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Database className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontraron registros</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[24px] border border-slate-100 shadow-sm bg-white">
                  <DataPreviewTable data={siembras.map(s => ({
                    ID: s?.id_siembra?.substring(0, 8),
                    Bloque: s?.camas?.naves?.bloques?.nombre || 'N/A',
                    Nave: s?.camas?.naves?.numero_nave || 'N/A',
                    Cama: s?.camas?.numero_cama || 'N/A',
                    Variedad: s?.variedades?.nombre || 'N/A',
                    'Fecha Siembra': s?.fecha_siembra || 'N/A',
                    Plantas: s?.plantas_sembradas?.toLocaleString() || 0,
                    Estado: s?.estado || 'N/A'
                  }))} />
                </div>
              )}
            </ModuleCard>
          </div>
        </div>
      </main>
    </div>
  )
}
