import { Sidebar } from '../../components/Sidebar';
import ModuleCard from '../../components/shared/ModuleCard';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  Search,
  FileSpreadsheet,
  FileIcon as PdfIcon
} from 'lucide-react';
import { useState } from 'react';

export default function Reportes() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">CENTRO DE REPORTES</h2>
              <p className="text-slate-500 font-medium mt-1">Genera y exporta informes detallados de producción, calidad y rendimientos.</p>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
               <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition">
                  <Search size={16} />
                  BUSCAR REPORTE
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filtros de Reporte */}
            <div className="lg:col-span-1 space-y-6">
              <ModuleCard title="Filtros de Exportación" subtitle="Personaliza tu informe">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Informe</label>
                    <div className="relative">
                      <select className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all outline-none text-slate-700 font-bold text-sm">
                        <option>Producción por Variedad</option>
                        <option>Índices de Calidad Semanal</option>
                        <option>Registro de Daños y Pérdidas</option>
                        <option>Rendimiento por Bloque</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rango de Fechas</label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm font-bold text-slate-700"
                        />
                      </div>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloque / Área</label>
                    <div className="relative">
                      <select className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none text-slate-700 font-bold text-sm">
                        <option>Todos los Bloques</option>
                        <option>Bloque B1</option>
                        <option>Bloque B2</option>
                        <option>Bloque B3</option>
                        <option>Bloque B4</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button className="w-full btn-primary flex items-center justify-center gap-2 py-4">
                      <Download size={18} />
                      GENERAR REPORTE
                    </button>
                    <button className="w-full btn-secondary flex items-center justify-center gap-2 py-4">
                      <Filter size={18} />
                      LIMPIAR FILTROS
                    </button>
                  </div>
                </div>
              </ModuleCard>
            </div>

            {/* Formatos y Recientes */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                  <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="text-emerald-600" size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Exportar a Excel</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6">Ideal para análisis de datos profundos y manipulación en hojas de cálculo.</p>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Recomendado</span>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group hover:border-rose-200 transition-all">
                  <div className="bg-rose-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <PdfIcon className="text-rose-600" size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Exportar a PDF</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6">Perfecto para presentaciones ejecutivas y archivos de lectura rápida.</p>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">Formato Fijo</span>
                </div>
              </div>

              <ModuleCard title="Reportes Generados Recientemente" subtitle="Últimas 24 horas">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm">
                          <FileText className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Reporte_Produccion_S{i+12}_2024.xlsx</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generado hace {i * 2} horas • 2.4 MB</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </ModuleCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
