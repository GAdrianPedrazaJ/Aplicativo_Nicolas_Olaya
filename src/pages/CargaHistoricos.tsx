import { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import ModuleCard from '../components/shared/ModuleCard'
import FileUploader from '../components/upload/FileUploader'
import { useHistoricos } from '../hooks/useHistoricos'
import { History, Info, UploadCloud, Database, RefreshCcw } from 'lucide-react'

export default function CargaHistoricos() {
  const { uploadData, loading } = useHistoricos()
  // Asumimos que hay una función para obtener un resumen de históricos o similar
  const [totalRegistros, setTotalRegistros] = useState(0)

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight text-uppercase">CARGA DE HISTÓRICOS</h2>
              <p className="text-slate-500 font-medium mt-1">Sincroniza y actualiza los registros históricos de producción y cortes.</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-3 rounded-[24px] shadow-sm border border-slate-100">
              <div className="px-5 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Sincronización</span>
                <span className="text-sm font-black text-indigo-900 uppercase">Al día</span>
              </div>
              <button
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCcw size={18} />
                <span>REFRESCAR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            {/* Sección de Carga */}
            <ModuleCard
              title="Importación de Datos Históricos"
              subtitle="Formatos aceptados: .xlsx, .csv"
              action={<UploadCloud className="text-indigo-400" size={24} />}
            >
              <div className="max-w-4xl">
                <div className="flex gap-4 p-5 bg-indigo-50 rounded-[24px] border border-indigo-100 mb-8">
                  <div className="bg-indigo-100 p-2 rounded-xl h-fit">
                    <Info className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wide mb-1">Guía de importación</h4>
                    <p className="text-sm text-indigo-800 leading-relaxed">
                      Para una carga exitosa, el archivo debe contener las columnas: <span className="font-bold">Fecha Corte, Tallos Cortados, Tallos Perdidos, Bloque y Variedad</span>.
                      Los datos se vincularán automáticamente a los ciclos de producción activos.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors">
                  <FileUploader mode="historicos" onUpload={uploadData} />
                </div>
              </div>
            </ModuleCard>

            {/* Resumen de Integridad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                  <Database className="text-emerald-600" size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros Procesados</p>
                <p className="text-2xl font-black text-slate-900 mt-1">12,450</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                  <History className="text-amber-600" size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Carga</p>
                <p className="text-2xl font-black text-slate-900 mt-1">Hace 2 días</p>
              </div>
              <div className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-200 text-white">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Estado del Sistema</p>
                <p className="text-2xl font-black mt-1">Optimizado</p>
                <p className="text-[10px] text-indigo-100 mt-2 font-medium">Todos los datos históricos están vinculados.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
