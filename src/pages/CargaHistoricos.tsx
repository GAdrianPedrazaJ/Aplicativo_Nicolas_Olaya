import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import ModuleCard from '../components/shared/ModuleCard'
import FileUploader from '../components/upload/FileUploader'
import { useHistoricos } from '../hooks/useHistoricos'
import { History, Database, RefreshCcw, Sprout, BarChart2, CheckCircle2 } from 'lucide-react'

export default function CargaHistoricos() {
  const { uploadData, loading } = useHistoricos()
  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />

      {/* SUB-NAVBAR SUPERIOR UNIFICADA DE SIEMBRAS */}
      <div className="bg-white border-b border-slate-200 px-6 shrink-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex h-11 items-center gap-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 h-full text-[10px] font-black uppercase tracking-wider border-b-4 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <BarChart2 size={14} />
            ANÁLISIS DE SIEMBRAS
          </Link>
          <Link
            to="/siembras/cargar"
            className={`flex items-center gap-2 px-6 h-full text-[10px] font-black uppercase tracking-wider border-b-4 transition-all
              ${location.pathname === '/siembras/cargar'
                ? 'border-[#005d5d] text-[#005d5d] bg-emerald-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
          >
            <Sprout size={14} />
            CARGAR PLANOS
          </Link>
          <Link
            to="/siembras/historicos"
            className={`flex items-center gap-2 px-6 h-full text-[10px] font-black uppercase tracking-wider border-b-4 transition-all
              ${location.pathname === '/siembras/historicos'
                ? 'border-[#005d5d] text-[#005d5d] bg-emerald-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
          >
            <History size={14} />
            CARGAR HISTÓRICOS
          </Link>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sincronización de Históricos</h2>
              <p className="text-slate-500 font-medium text-[11px]">Importación masiva de registros de producción y cortes diarios.</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
              <div className="px-4 py-1 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-indigo-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Estado: Al día</span>
              </div>
              <button
                className="bg-[#005d5d] text-white px-4 py-2 rounded-lg font-bold text-[10px] flex items-center gap-2 hover:bg-[#004d4d] transition-colors"
              >
                <RefreshCcw size={14} />
                REFRESCAR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5">
              <ModuleCard
                title="Carga de Producción"
                subtitle="Archivo Excel con registros de corte"
                action={<History className="text-[#f5a623]" size={18} />}
              >
                <div className="mt-2">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                      <strong>Importante:</strong> El archivo debe contener columnas de Fecha Corte, Bloque, Variedad y Tallos.
                    </p>
                  </div>
                  <FileUploader mode="historicos" onUpload={uploadData} />
                </div>
              </ModuleCard>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                    <Database className="text-emerald-600" size={20} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registros Procesados</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">12,450</p>
                </div>

                <div className="bg-[#005d5d] p-5 rounded-2xl shadow-lg text-white">
                  <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                  </div>
                  <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">Integridad de Datos</p>
                  <p className="text-2xl font-black mt-1">100% OK</p>
                </div>
              </div>

              <div className="mt-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Últimas Importaciones</h3>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <History size={16} className="text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-700">Produccion_Semana_{24+i}.xlsx</p>
                          <p className="text-[9px] text-slate-400 uppercase">Hace {i} día(s)</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ÉXITO</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
